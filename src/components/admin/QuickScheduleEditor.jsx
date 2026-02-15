import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const weekDays = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

export default function QuickScheduleEditor({ booking, lesson, open, onClose }) {
  const queryClient = useQueryClient();
  const [newDate, setNewDate] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  // Reset valores quando o modal abre
  React.useEffect(() => {
    if (open && lesson) {
      setNewDate(lesson.date || '');
      setNewTime(lesson.start_time || '09:00');
      setNewDay('');
    }
  }, [open, lesson]);

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-picadeiro-students'],
    queryFn: () => base44.entities.PicadeiroStudent.list('-created_date', 500),
    initialData: []
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-schedule'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ mode, date, day, time }) => {
      console.log('=== INICIANDO updateScheduleMutation ===');
      console.log('Mode:', mode);
      console.log('Booking:', booking);
      console.log('Lesson:', lesson);
      
      const studentKey = booking.client_email;
      console.log('StudentKey:', studentKey);
      
      // Encontrar o aluno - pode ser email, phone OU id do PicadeiroStudent
      let student = allStudents.find(s => 
        s.email === studentKey || 
        s.phone === studentKey || 
        s.id === studentKey ||
        `aluno-${s.name?.toLowerCase().replace(/\s+/g, '-')}` === studentKey
      );
      let isPicadeiro = !!student;
      
      if (!student) {
        student = allUsers.find(u => u.email === studentKey);
      }

      console.log('Student encontrado:', student);
      console.log('isPicadeiro:', isPicadeiro);

      if (!student) {
        toast.error('Aluno não encontrado - chave: ' + studentKey);
        throw new Error('Aluno não encontrado');
      }

      const service = services.find(s => s.title === 'Aulas em Grupo');
      if (!service) {
        toast.error('Serviço "Aulas em Grupo" não encontrado');
        throw new Error('Serviço "Aulas em Grupo" não encontrado');
      }
      
      console.log('Service encontrado:', service.id);

      if (mode === 'this_week') {
        console.log('>>> MODE: this_week');
        console.log('Nova data:', date);
        console.log('Nova hora:', time);
        
        toast.loading('A mover aula...');
        
        // Mudar apenas esta semana - mover a reserva para nova data/horário
        
        // Remover da aula antiga
        console.log('Removendo reserva antiga:', booking.id);
        await base44.entities.Booking.delete(booking.id);
        const oldLesson = lesson;
        const remainingBookings = await base44.entities.Booking.filter({ lesson_id: oldLesson.id });
        
        if (remainingBookings.length === 0 && oldLesson.is_auto_generated) {
          await base44.entities.Lesson.delete(oldLesson.id);
        } else {
          await base44.entities.Lesson.update(oldLesson.id, {
            booked_spots: Math.max(0, (oldLesson.booked_spots || 1) - 1),
            fixed_students_count: Math.max(0, (oldLesson.fixed_students_count || 1) - 1)
          });
        }

        // Criar ou encontrar aula na nova data/horário
        console.log('Procurando aula em:', date, time);
        let newLessonArray = await base44.entities.Lesson.filter({
          service_id: service.id,
          date: date,
          start_time: time
        });
        
        console.log('Aulas encontradas:', newLessonArray.length);

        let newLesson;
        if (newLessonArray.length === 0) {
          // Criar nova aula
          console.log('Criando nova aula...');
          const [hours, minutes] = time.split(':');
          const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
          endTime.setMinutes(endTime.getMinutes() + 30);

          newLesson = await base44.entities.Lesson.create({
            service_id: service.id,
            date: date,
            start_time: time,
            end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
            max_spots: 6,
            booked_spots: 1,
            fixed_students_count: 1,
            is_auto_generated: true,
            status: 'scheduled'
          });
          console.log('Nova aula criada:', newLesson.id);
        } else {
          console.log('Usando aula existente:', newLessonArray[0].id);
          newLesson = newLessonArray[0];
          await base44.entities.Lesson.update(newLesson.id, {
            booked_spots: (newLesson.booked_spots || 0) + 1,
            fixed_students_count: (newLesson.fixed_students_count || 0) + 1
          });
        }

        // Criar nova reserva
        console.log('Criando nova reserva na aula:', newLesson.id);
        await base44.entities.Booking.create({
          lesson_id: newLesson.id,
          client_email: booking.client_email,
          client_name: booking.client_name,
          status: 'approved',
          is_fixed_student: booking.is_fixed_student || false,
          approved_at: new Date().toISOString(),
          approved_by: 'admin'
        });

        console.log('✅ Aula movida com sucesso!');
        toast.dismiss();
        toast.success('Horário desta semana alterado!');

      } else if (mode === 'permanent') {
        console.log('>>> MODE: permanent');
        console.log('Novo dia:', day);
        console.log('Nova hora:', time);
        
        toast.loading('A alterar horário fixo...');
        
        // Alterar horário fixo do aluno permanentemente
        
        if (!student.fixed_schedule || student.fixed_schedule.length === 0) {
          toast.dismiss();
          toast.error('Aluno não tem horários fixos definidos');
          throw new Error('Aluno não tem horários fixos definidos');
        }

        console.log('Fixed schedule atual:', student.fixed_schedule);
        console.log('Procurando horário:', lesson.start_time);

        // Encontrar o horário antigo mais próximo do atual
        const currentSchedule = student.fixed_schedule.find(s => s.time === lesson.start_time);
        
        console.log('Schedule encontrado:', currentSchedule);
        
        if (!currentSchedule) {
          toast.dismiss();
          toast.error('Horário fixo não encontrado para este aluno');
          throw new Error('Horário fixo não encontrado para este aluno');
        }

        // Atualizar horário fixo do aluno
        const newSchedules = student.fixed_schedule.map(s => 
          s.time === currentSchedule.time ? { ...s, day: day, time: time, duration: s.duration || 30 } : s
        );

        console.log('Novos schedules:', newSchedules);
        console.log('Atualizando aluno...');

        if (isPicadeiro) {
          await base44.entities.PicadeiroStudent.update(student.id, {
            fixed_schedule: newSchedules
          });
        } else {
          await base44.entities.User.update(student.id, {
            fixed_schedule: newSchedules
          });
        }
        
        console.log('Aluno atualizado');

        // Remover todas as aulas futuras antigas deste horário específico
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('Buscando reservas do aluno...');
        const allBookings = await base44.entities.Booking.filter({
          client_email: studentKey,
          is_fixed_student: true
        });
        
        console.log('Reservas encontradas:', allBookings.length);

        console.log('Buscando todas as aulas...');
        const allLessons = await base44.entities.Lesson.list('-date', 1000);
        console.log('Aulas encontradas:', allLessons.length);

        for (const b of allBookings) {
          const l = allLessons.find(lesson => lesson.id === b.lesson_id);
          if (!l) continue;

          const lessonDate = new Date(l.date);
          lessonDate.setHours(0, 0, 0, 0);

          // Remover apenas aulas futuras com o horário antigo
          if (lessonDate >= today && l.start_time === currentSchedule.time) {
            console.log('Removendo reserva futura:', b.id, 'da aula', l.id, l.date);
            await base44.entities.Booking.delete(b.id);
            
            const remaining = await base44.entities.Booking.filter({ lesson_id: l.id });
            if (remaining.length === 0 && l.is_auto_generated) {
              console.log('  → Apagando aula vazia:', l.id);
              await base44.entities.Lesson.delete(l.id);
            } else if (remaining.length > 0) {
              console.log('  → Atualizando contadores da aula:', l.id);
              await base44.entities.Lesson.update(l.id, {
                booked_spots: remaining.length,
                fixed_students_count: remaining.filter(r => r.is_fixed_student).length
              });
            }
          }
        }
        
        console.log('Aulas antigas removidas');

        // Criar aulas futuras com novo horário (3 meses)
        console.log('Criando aulas futuras...');
        const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
        const targetDay = daysMap[day];
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 3);
        
        console.log('Período:', today.toISOString().split('T')[0], 'até', endDate.toISOString().split('T')[0]);

        const currentDate = new Date(today);
        const currentDay = currentDate.getDay();
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0) daysUntilTarget = 7;
        currentDate.setDate(currentDate.getDate() + daysUntilTarget);
        
        console.log('Primeira data:', currentDate.toISOString().split('T')[0]);

        while (currentDate <= endDate) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          let lessonAtNewTime = await base44.entities.Lesson.filter({
            service_id: service.id,
            date: dateStr,
            start_time: time
          });

          if (lessonAtNewTime.length === 0) {
            const [hours, minutes] = time.split(':');
            const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            endTime.setMinutes(endTime.getMinutes() + 30);

            lessonAtNewTime = await base44.entities.Lesson.create({
              service_id: service.id,
              date: dateStr,
              start_time: time,
              end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
              max_spots: 6,
              booked_spots: 1,
              fixed_students_count: 1,
              is_auto_generated: true,
              status: 'scheduled'
            });
          } else {
            lessonAtNewTime = lessonAtNewTime[0];
            await base44.entities.Lesson.update(lessonAtNewTime.id, {
              booked_spots: (lessonAtNewTime.booked_spots || 0) + 1,
              fixed_students_count: (lessonAtNewTime.fixed_students_count || 0) + 1
            });
          }

          // Verificar se já existe reserva
          const existingBooking = await base44.entities.Booking.filter({
            lesson_id: lessonAtNewTime.id,
            client_email: studentKey
          });

          if (existingBooking.length === 0) {
            await base44.entities.Booking.create({
              lesson_id: lessonAtNewTime.id,
              client_email: studentKey,
              client_name: booking.client_name,
              status: 'approved',
              is_fixed_student: true,
              approved_at: new Date().toISOString(),
              approved_by: 'admin'
            });
          }

          currentDate.setDate(currentDate.getDate() + 7);
        }

        console.log('✅ Horário fixo alterado com sucesso!');
        toast.dismiss();
        toast.success('Horário fixo atualizado permanentemente!');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['picadeiro-students'] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const handleChangeThisWeek = () => {
    if (!newDate || !newTime) {
      toast.error('Selecione data e horário');
      return;
    }
    updateScheduleMutation.mutate({ mode: 'this_week', date: newDate, time: newTime });
  };

  const handleChangePermanent = () => {
    if (!newDay || !newTime) {
      toast.error('Selecione dia da semana e horário');
      return;
    }
    if (confirm('Alterar horário fixo permanentemente? Todas as aulas futuras serão recriadas com o novo horário.')) {
      updateScheduleMutation.mutate({ mode: 'permanent', day: newDay, time: newTime });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-[#B8956A]" />
            Alterar Horário - {booking?.client_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Apenas esta semana */}
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mover Esta Aula
            </h4>
            <p className="text-sm text-blue-700 mb-3">Move esta aula específica para outra data/horário</p>
            <div className="space-y-2">
              <Label>Nova Data</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <Label>Nova Hora</Label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <Button
                onClick={handleChangeThisWeek}
                disabled={updateScheduleMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {updateScheduleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Mover Aula
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}