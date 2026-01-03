import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import FixedStudentsManager from '@/components/admin/FixedStudentsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileSpreadsheet, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStudentSchedules() {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [tableData, setTableData] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-schedules'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const processScheduleData = (text) => {
    const lines = text.trim().split('\n');
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split('\t').map(p => p.trim());
      const name = parts[0];
      
      if (!name) continue;

      const schedules = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (let j = 1; j <= 6; j++) {
        const time = parts[j];
        if (time && time !== '') {
          // Limpar horário (remover h, ?, etc)
          let cleanTime = time.replace(/h.*/, '').replace('?', '').trim();
          
          // Converter para formato HH:MM
          if (cleanTime.includes(':')) {
            const [h, m] = cleanTime.split(':');
            cleanTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
          } else if (cleanTime.length <= 2) {
            cleanTime = `${cleanTime.padStart(2, '0')}:00`;
          }

          schedules.push({
            day: days[j - 1],
            time: cleanTime,
            duration: 60
          });
        }
      }

      if (schedules.length > 0) {
        students.push({
          name,
          schedules,
          weekly_frequency: schedules.length
        });
      }
    }

    return students;
  };

  const importSchedulesMutation = useMutation({
    mutationFn: async (studentsData) => {
      const results = { created: 0, updated: 0, errors: 0 };

      for (const student of studentsData) {
        try {
          // Procurar utilizador por nome
          let user = allUsers.find(u => 
            u.full_name?.toLowerCase().includes(student.name.toLowerCase()) ||
            student.name.toLowerCase().includes(u.full_name?.toLowerCase())
          );

          if (!user) {
            // Criar novo utilizador
            const email = `${student.name.toLowerCase().replace(/\s+/g, '.')}@picadeiro.temp`;
            user = await base44.entities.User.create({
              email,
              full_name: student.name,
              role: 'user'
            });
            results.created++;
          }

          // Calcular mensalidade baseado na frequência (assumindo aulas de 60min)
          const monthlyFees = {
            1: 90,
            2: 150,
            3: 180
          };
          const monthlyFee = monthlyFees[student.weekly_frequency] || 90;

          // Atualizar com horários fixos
          await base44.entities.User.update(user.id, {
            student_type: 'fixo',
            fixed_schedule: student.schedules,
            monthly_fee: monthlyFee,
            student_level: 'intermedio'
          });

          results.updated++;
        } catch (e) {
          console.error(`Erro ao processar ${student.name}:`, e);
          results.errors++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries(['all-users-schedules']);
      queryClient.invalidateQueries(['all-users']);
      toast.success(`✅ Importação concluída! ${results.created} criados, ${results.updated} atualizados${results.errors > 0 ? `, ${results.errors} erros` : ''}`);
      setTableData('');
    },
    onError: () => {
      toast.error('Erro na importação');
    }
  });

  const handleImport = () => {
    if (!tableData.trim()) {
      toast.error('Cole os dados da tabela primeiro');
      return;
    }

    setImporting(true);
    try {
      const students = processScheduleData(tableData);
      
      if (students.length === 0) {
        toast.error('Nenhum aluno com horários encontrado');
        setImporting(false);
        return;
      }

      importSchedulesMutation.mutate(students);
    } catch (e) {
      toast.error('Erro ao processar dados');
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminStudentSchedules">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#4A5D23]" />
            Gestão de Alunos Fixos
          </h1>
          <p className="text-stone-500">Importar e gerir horários semanais</p>
        </div>

        {/* Importação */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#4A5D23]" />
              Importar Horários do Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cole a tabela do Excel aqui</Label>
              <Textarea
                placeholder="Nome	2F	3F	4F	5F	6F	Sábado&#10;Clarinha		16h				&#10;Ana Cavaleiro						&#10;..."
                value={tableData}
                onChange={(e) => setTableData(e.target.value)}
                className="font-mono text-xs min-h-[200px]"
              />
              <p className="text-xs text-stone-500">
                Cole os dados diretamente do Excel (Ctrl+C no Excel, Ctrl+V aqui)
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">ℹ️ Como usar:</p>
              <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                <li>Abra o ficheiro Excel com os horários</li>
                <li>Selecione toda a tabela (incluindo cabeçalhos)</li>
                <li>Copie (Ctrl+C)</li>
                <li>Cole no campo acima (Ctrl+V)</li>
                <li>Clique em "Importar"</li>
              </ol>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing || !tableData.trim()}
              className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A importar...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Horários
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Gestão de Alunos Fixos */}
        <FixedStudentsManager />
      </div>
    </AdminLayout>
  );
}