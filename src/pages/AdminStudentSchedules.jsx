import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import FixedStudentsManager from '@/components/admin/FixedStudentsManager';
import { Users } from 'lucide-react';

export default function AdminStudentSchedules() {

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