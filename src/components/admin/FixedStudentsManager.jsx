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
import { Calendar, Plus, Trash2, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    user_id: '',
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

  const { data: picadeiroStudents = [] } = useQuery({
    queryKey: ['picadeiro-students'],
    queryFn: () => base44.entities.PicadeiroStudent.list('-created_date'),
    initialData: []
  });

  const fixedStudentsFromUsers = allUsers.filter(u => u.student_type === 'fixo');
  const fixedStudentsFromPicadeiro = picadeiroStudents.filter(s => s.student_type === 'fixo').map(s => ({
    ...s,
    full_name: s.name,
    email: s.email || s.phone || ''
  }));
  const allFixedStudents = [...fixedStudentsFromUsers, ...fixedStudentsFromPicadeiro];
  
  const fixedStudents = allFixedStudents.filter(student => {
    const name = (student.full_name || student.name || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data, isPicadeiro, isEditing, studentEmail }) => {
      // Se está editando, apagar aulas antigas automáticas
      if (isEditing && studentEmail) {
        toast.loading('A atualizar aulas...');
        
        // Buscar todas as reservas do aluno
        const bookings = await base44.entities.Booking.filter({ 
          client_email: studentEmail,
          is_fixed_student: true
        });
        
        // Para cada reserva, buscar a aula e apagar se for auto-gerada
        for (const booking of bookings) {
          try {
            const lessons = await base44.entities.Lesson.filter({ id: booking.lesson_id });
            if (lessons.length > 0 && lessons[0].is_auto_generated) {
              // Apagar a reserva
              await base44.entities.Booking.delete(booking.id);
              
              // Atualizar contadores da aula
              const lesson = lessons[0];
              const newBookedSpots = Math.max(0, (lesson.booked_spots || 0) - 1);
              const newFixedCount = Math.max(0, (lesson.fixed_students_count || 0) - 1);
              
              if (newBookedSpots === 0) {
                // Se não tem mais reservas, apagar a aula
                await base44.entities.Lesson.delete(lesson.id);
              } else {
                // Senão, só atualizar os contadores
                await base44.entities.Lesson.update(lesson.id, {
                  booked_spots: newBookedSpots,
                  fixed_students_count: newFixedCount
                });
              }
            }
          } catch (e) {
            console.error('Erro ao apagar aula:', e);
          }
        }
      }
      
      if (isPicadeiro) {
        await base44.entities.PicadeiroStudent.update(userId, data);
      } else {
        await base44.entities.User.update(userId, data);
      }
      return { userId, data, isPicadeiro };
    },
    onSuccess: async (result) => {
      // Buscar o aluno atualizado com os novos dados
      let updatedStudent;
      if (result.isPicadeiro) {
        const student = picadeiroStudents.find(s => s.id === result.userId);
        updatedStudent = {
          id: result.userId,
          email: student?.email || '',
          full_name: student?.name,
          ...result.data
        };
      } else {
        updatedStudent = {
          id: result.userId,
          email: allUsers.find(u => u.id === result.userId)?.email,
          full_name: allUsers.find(u => u.id === result.userId)?.full_name,
          ...result.data
        };
      }
      
      if (updatedStudent.fixed_schedule && updatedStudent.fixed_schedule.length > 0) {
        toast.loading('A criar novas aulas automáticas...');
        await createRecurringLessons(updatedStudent);
        toast.dismiss();
      }
      
      queryClient.invalidateQueries(['all-users']);
      queryClient.invalidateQueries(['picadeiro-students']);
      queryClient.invalidateQueries(['lessons']);
      setDialogOpen(false);
      setEditingStudent(null);
      setFormData({
        user_id: '',
        student_level: 'iniciante',
        duration: 30,
        weekly_frequency: 1,
        schedules: []
      });
      toast.success('Aluno fixo atualizado e aulas reagendadas!');
    }
  });

  const createRecurringLessons = async (student) => {
    if (!student.fixed_schedule || student.fixed_schedule.length === 0) return;
    
    const service = services.find(s => s.title === 'Aulas de Escola') || services[0];
    if (!service) {
      toast.error('Nenhum serviço disponível');
      return;
    }

    const today = new Date();
    const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    
    let created = 0;
    
    // Criar aulas para as próximas 12 semanas
    for (let week = 0; week < 12; week++) {
      for (const schedule of student.fixed_schedule) {
        const targetDay = daysMap[schedule.day];
        const currentDay = today.getDay();
        
        // Calcular próxima ocorrência do dia da semana
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && week === 0) daysUntilTarget = 7; // Se for hoje, começar na próxima semana
        
        const lessonDate = new Date(today);
        lessonDate.setDate(today.getDate() + daysUntilTarget + (week * 7));
        
        const dateStr = format(lessonDate, 'yyyy-MM-dd');
        
        try {
          // Verificar se já existe aula neste horário
          const existingLessons = await base44.entities.Lesson.filter({ 
            date: dateStr,
            start_time: schedule.time,
            service_id: service.id
          });

          let lesson;
          if (existingLessons.length === 0) {
            // Criar nova aula
            const [hours, minutes] = schedule.time.split(':');
            const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            endTime.setMinutes(endTime.getMinutes() + (schedule.duration || 30));
            
            lesson = await base44.entities.Lesson.create({
              service_id: service.id,
              date: dateStr,
              start_time: schedule.time,
              end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
              max_spots: 6,
              booked_spots: 1,
              fixed_students_count: 1,
              is_auto_generated: true
            });
            created++;
          } else {
            lesson = existingLessons[0];
          }

          // Verificar se já existe reserva do aluno
          const existingBookings = await base44.entities.Booking.filter({
            lesson_id: lesson.id,
            client_email: student.email
          });

          if (existingBookings.length === 0) {
            // Criar reserva automática
            await base44.entities.Booking.create({
              lesson_id: lesson.id,
              client_email: student.email,
              client_name: student.full_name,
              status: 'approved',
              is_fixed_student: true
            });

            // Atualizar contadores se a aula já existia
            if (existingLessons.length > 0) {
              await base44.entities.Lesson.update(lesson.id, {
                booked_spots: (lesson.booked_spots || 0) + 1,
                fixed_students_count: (lesson.fixed_students_count || 0) + 1
              });
            }
          }
        } catch (e) {
          console.error('Erro ao criar aula:', e);
        }
      }
    }
    
    console.log(`Criadas ${created} aulas automáticas`);
  };

  const handleSave = () => {
    if (!formData.user_id || formData.schedules.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const monthlyFee = monthlyFees[formData.duration][formData.weekly_frequency];
    const isPicadeiro = formData.user_id.startsWith('picadeiro-');
    const actualId = formData.user_id.replace('user-', '').replace('picadeiro-', '');
    
    // Obter email do aluno para apagar aulas antigas
    let studentEmail = '';
    if (editingStudent) {
      studentEmail = editingStudent.email || editingStudent.full_name;
    }

    updateUserMutation.mutate({
      userId: actualId,
      isPicadeiro,
      isEditing: !!editingStudent,
      studentEmail,
      data: {
        student_type: 'fixo',
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

  const removeStudentMutation = useMutation({
    mutationFn: async ({ userId, isPicadeiro, studentEmail }) => {
      toast.loading('A remover aluno fixo e aulas associadas...');

      // Apagar todas as aulas automáticas e reservas associadas
      if (studentEmail) {
        const bookings = await base44.entities.Booking.filter({
          client_email: studentEmail,
          is_fixed_student: true
        });

        for (const booking of bookings) {
          try {
            await base44.entities.Booking.delete(booking.id);

            const lessons = await base44.entities.Lesson.filter({ id: booking.lesson_id });
            if (lessons.length > 0 && lessons[0].is_auto_generated) {
              const lesson = lessons[0];
              const newBookedSpots = Math.max(0, (lesson.booked_spots || 0) - 1);
              const newFixedCount = Math.max(0, (lesson.fixed_students_count || 0) - 1);

              if (newBookedSpots === 0 && newFixedCount === 0) {
                await base44.entities.Lesson.delete(lesson.id);
              } else {
                await base44.entities.Lesson.update(lesson.id, {
                  booked_spots: newBookedSpots,
                  fixed_students_count: newFixedCount
                });
              }
            }
          } catch (e) {
            console.error('Erro ao apagar reserva/aula:', e);
          }
        }
      }

      if (isPicadeiro) {
        await base44.entities.PicadeiroStudent.delete(userId);
      } else {
        await base44.entities.User.update(userId, { student_type: 'avulso', fixed_schedule: [], monthly_fee: 0 });
      }
      return { userId, isPicadeiro };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      queryClient.invalidateQueries(['picadeiro-students']);
      queryClient.invalidateQueries(['lessons']);
      toast.dismiss();
      toast.success('Aluno fixo e aulas associadas removidos com sucesso!');
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(`Erro ao remover aluno: ${error.message}`);
    }
  });

  const removeFixedStudent = (student) => {
    if (confirm('Remover aluno fixo do sistema? Todas as aulas automáticas associadas e reservas também serão removidas.')) {
      const isPicadeiro = picadeiroStudents.some(s => s.id === student.id);
      const studentEmail = student.email || student.full_name;

      removeStudentMutation.mutate({
        userId: student.id,
        isPicadeiro,
        studentEmail
      });
    }
  };

  const editFixedStudent = (student) => {
    setEditingStudent(student);
    const isPicadeiro = picadeiroStudents.some(s => s.id === student.id);
    setFormData({
      user_id: `${isPicadeiro ? 'picadeiro' : 'user'}-${student.id}`,
      student_level: student.student_level || 'iniciante',
      duration: student.fixed_schedule?.[0]?.duration || 30,
      weekly_frequency: student.fixed_schedule?.length || 1,
      schedules: student.fixed_schedule || []
    });
    setDialogOpen(true);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4A5D23]" />
              Alunos Fixos ({allFixedStudents.length})
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
                <DialogTitle>{editingStudent ? 'Editar Aluno Fixo' : 'Registar Aluno Fixo'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecionar Aluno</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(v) => setFormData({ ...formData, user_id: v })}
                    disabled={!!editingStudent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {picadeiroStudents.filter(s => s.student_type !== 'fixo' || s.id === editingStudent?.id).map(s => (
                        <SelectItem key={`picadeiro-${s.id}`} value={`picadeiro-${s.id}`}>
                          {s.name}
                        </SelectItem>
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
                      onValueChange={(v) => {
                        const newFreq = parseInt(v);
                        const currentSchedules = formData.schedules;
                        // Ajustar número de horários ao mudar frequência
                        if (currentSchedules.length < newFreq) {
                          // Adicionar horários vazios se necessário
                          const needToAdd = newFreq - currentSchedules.length;
                          const newSchedules = [...currentSchedules];
                          for (let i = 0; i < needToAdd; i++) {
                            newSchedules.push({ day: 'monday', time: '09:00', duration: formData.duration });
                          }
                          setFormData({ ...formData, weekly_frequency: newFreq, schedules: newSchedules });
                        } else if (currentSchedules.length > newFreq) {
                          // Remover horários extra se reduzir frequência
                          setFormData({ ...formData, weekly_frequency: newFreq, schedules: currentSchedules.slice(0, newFreq) });
                        } else {
                          setFormData({ ...formData, weekly_frequency: newFreq });
                        }
                      }}
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

                <Button 
                  onClick={handleSave} 
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'A guardar...' : 'Guardar Aluno Fixo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Pesquisar alunos fixos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{student.full_name || student.name || 'Sem nome'}</h3>
                      <Badge className="bg-[#4A5D23]">{student.student_level || 'N/A'}</Badge>
                    </div>
                    {student.email && (
                      <p className="text-xs text-stone-500 mb-2">{student.email}</p>
                    )}
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => editFixedStudent(student)}
                      className="text-[#4A5D23] hover:text-[#3A4A1B] hover:bg-[#4A5D23]/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFixedStudent(student)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                      <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}