import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const horses = ["Vidre", "Borboleta", "Égua Louza", "U for me", "Faz de conta", "Domino", "Chá", "Árabe", "Floribela", "Joselito"];
const weekDays = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

const monthlyFees = {
  30: { 1: 70, 2: 120, 3: 150 },
  60: { 1: 90, 2: 150, 3: 180 }
};

export default function FixedStudentsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    user_id: '',
    assigned_horse: '',
    student_level: 'iniciante',
    duration: 30,
    weekly_frequency: 1,
    schedules: []
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const fixedStudents = allUsers.filter(u => u.student_type === 'fixo');

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setDialogOpen(false);
      setFormData({
        user_id: '',
        assigned_horse: '',
        student_level: 'iniciante',
        duration: 30,
        weekly_frequency: 1,
        schedules: []
      });
      toast.success('Aluno fixo atualizado!');
    }
  });

  const handleSave = () => {
    if (!formData.user_id || !formData.assigned_horse || formData.schedules.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const monthlyFee = monthlyFees[formData.duration][formData.weekly_frequency];

    updateUserMutation.mutate({
      userId: formData.user_id,
      data: {
        student_type: 'fixo',
        assigned_horse: formData.assigned_horse,
        student_level: formData.student_level,
        fixed_schedule: formData.schedules,
        monthly_fee: monthlyFee
      }
    });
  };

  const addScheduleSlot = () => {
    setFormData({
      ...formData,
      schedules: [...formData.schedules, { day: 'monday', time: '09:00', duration: formData.duration }]
    });
  };

  const removeScheduleSlot = (index) => {
    const newSchedules = formData.schedules.filter((_, i) => i !== index);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const removeFixedStudent = (userId) => {
    if (confirm('Remover aluno da lista de fixos?')) {
      updateUserMutation.mutate({
        userId,
        data: { student_type: 'avulso', fixed_schedule: [], monthly_fee: 0 }
      });
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#4A5D23]" />
            Alunos Fixos
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aluno Fixo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registar Aluno Fixo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecionar Aluno</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(v) => setFormData({ ...formData, user_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.filter(u => u.student_type !== 'fixo').map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cavalo Atribuído *</Label>
                    <Select
                      value={formData.assigned_horse}
                      onValueChange={(v) => setFormData({ ...formData, assigned_horse: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cavalo" />
                      </SelectTrigger>
                      <SelectContent>
                        {horses.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nível</Label>
                    <Select
                      value={formData.student_level}
                      onValueChange={(v) => setFormData({ ...formData, student_level: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante</SelectItem>
                        <SelectItem value="intermedio">Intermédio</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duração da Aula</Label>
                    <Select
                      value={String(formData.duration)}
                      onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequência Semanal</Label>
                    <Select
                      value={String(formData.weekly_frequency)}
                      onValueChange={(v) => setFormData({ ...formData, weekly_frequency: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x por semana</SelectItem>
                        <SelectItem value="2">2x por semana</SelectItem>
                        <SelectItem value="3">3x por semana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.duration && formData.weekly_frequency && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">
                      Mensalidade: {monthlyFees[formData.duration][formData.weekly_frequency]}€/mês
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Horários Fixos *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addScheduleSlot}
                      disabled={formData.schedules.length >= formData.weekly_frequency}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Horário
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.schedules.map((schedule, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Select
                            value={schedule.day}
                            onValueChange={(v) => {
                              const newSchedules = [...formData.schedules];
                              newSchedules[index].day = v;
                              setFormData({ ...formData, schedules: newSchedules });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {weekDays.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Input
                            type="time"
                            value={schedule.time}
                            onChange={(e) => {
                              const newSchedules = [...formData.schedules];
                              newSchedules[index].time = e.target.value;
                              setFormData({ ...formData, schedules: newSchedules });
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScheduleSlot(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]">
                  Guardar Aluno Fixo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fixedStudents.length === 0 ? (
          <p className="text-center text-stone-500 py-8">Nenhum aluno fixo registado</p>
        ) : (
          <div className="space-y-3">
            {fixedStudents.map(student => (
              <div key={student.id} className="p-4 bg-stone-50 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{student.full_name || student.email}</h3>
                      <Badge className="bg-[#4A5D23]">{student.student_level || 'N/A'}</Badge>
                    </div>
                    <p className="text-sm text-stone-600">
                      🐴 Cavalo: <strong>{student.assigned_horse}</strong>
                    </p>
                    <p className="text-sm text-stone-600">
                      💰 Mensalidade: <strong>{student.monthly_fee}€</strong>
                    </p>
                    {student.fixed_schedule && student.fixed_schedule.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-stone-500 mb-1">Horários:</p>
                        <div className="flex flex-wrap gap-1">
                          {student.fixed_schedule.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {weekDays.find(d => d.value === s.day)?.label} {s.time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFixedStudent(student.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}