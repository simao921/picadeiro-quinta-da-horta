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
import { Calendar, Plus, Trash2, Edit, Search, Users } from 'lucide-react';
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
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    user_id: '',
    student_level: 'iniciante',
    duration: 30,
    weekly_frequency: 1,
    schedules: []
  });

  const { data: allUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: [],
    staleTime: 0
  });

  const { data: picadeiroStudents = [], refetch: refetchStudents } = useQuery({
    queryKey: ['picadeiro-students'],
    queryFn: () => base44.entities.PicadeiroStudent.list('-created_date'),
    initialData: [],
    staleTime: 0
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

  // Lista combinada de todos os alunos (users + picadeiro) para seleção
  const allStudentsForSelection = [
    ...allUsers.filter(u => u.student_type !== 'fixo' || u.id === editingStudent?.id).map(u => ({
      id: `user-${u.id}`,
      name: u.full_name || '',
      email: u.email || '',
      phone: '',
      source: 'user'
    })),
    ...picadeiroStudents.filter(s => s.student_type !== 'fixo' || s.id === editingStudent?.id).map(s => ({
      id: `picadeiro-${s.id}`,
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      source: 'picadeiro'
    }))
  ];

  // Filtrar alunos baseado na pesquisa
  const filteredStudentsForSelection = allStudentsForSelection.filter(student => {
    if (!studentSearchQuery) return true;
    const query = studentSearchQuery.toLowerCase();
    const name = (student.name || '').toLowerCase();
    const email = (student.email || '').toLowerCase();
    const phone = (student.phone || '').toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data, isPicadeiro, isEditing, studentEmail, studentName, oldSchedules }) => {
      // Se está editando, remover todas as aulas dos horários que foram alterados
      if (isEditing && studentEmail && oldSchedules && oldSchedules.length > 0) {
        toast.loading('A remover aulas antigas e atualizar horários...');
        
        const newSchedules = data.fixed_schedule || [];
        const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
        
        // Identificar horários removidos ou alterados (estavam nos antigos mas não estão nos novos)
        const removedSchedules = oldSchedules.filter(old => 
          !newSchedules.some(ns => ns.day === old.day && ns.time === old.time)
        );
        
        console.log('Horários removidos/alterados:', removedSchedules);
        
        // Remover TODAS as aulas futuras dos horários antigos que foram alterados
        if (removedSchedules.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Buscar o serviço "Aulas em Grupo" - usar serviços do query
          const serviceList = await base44.entities.Service.list();
          const service = serviceList.find(s => s.title === 'Aulas em Grupo');
          if (!service) {
            console.error('Serviço "Aulas em Grupo" não encontrado');
            toast.error('Serviço "Aulas em Grupo" não encontrado');
            // Continuar mesmo sem serviço para não bloquear a atualização
          }
          
          // Processar cada horário removido/alterado
          for (const oldSchedule of removedSchedules) {
            const targetDay = daysMap[oldSchedule.day];
            console.log(`Removendo aulas do horário antigo: ${oldSchedule.day} ${oldSchedule.time}`);
            
            // Buscar TODAS as aulas futuras com este dia e horário (não apenas as que têm reservas)
            try {
              // Buscar todas as aulas futuras do serviço (se serviço encontrado)
              let allFutureLessons = [];
              if (service) {
                allFutureLessons = await base44.entities.Lesson.filter({
                  service_id: service.id,
                  start_time: oldSchedule.time
                });
              } else {
                // Se não encontrar serviço, buscar todas as aulas e filtrar por horário e auto-geradas
                const allLessons = await base44.entities.Lesson.list('-created_date', 2000);
                allFutureLessons = allLessons.filter(l => 
                  l.start_time === oldSchedule.time && l.is_auto_generated === true
                );
              }
              
              console.log(`Encontradas ${allFutureLessons.length} aulas com horário ${oldSchedule.time}`);
              
              // Filtrar apenas aulas futuras no dia correto e auto-geradas
              const lessonsToProcess = allFutureLessons.filter(lesson => {
                // Já filtrado por auto-geradas se serviço não encontrado, mas verificar novamente por segurança
                if (!lesson.is_auto_generated) return false;
                
                const lessonDate = new Date(lesson.date);
                lessonDate.setHours(0, 0, 0, 0);
                
                // Verificar se é futura (hoje ou depois)
                if (lessonDate < today) return false;
                
                const lessonDay = lessonDate.getDay();
                
                // Verificar se é no dia correto da semana
                return lessonDay === targetDay;
              });
              
              console.log(`Processando ${lessonsToProcess.length} aulas futuras no dia ${oldSchedule.day}`);
              
              // Para cada aula, remover a reserva do aluno se existir
              for (const lesson of lessonsToProcess) {
                try {
                  // Buscar reserva do aluno nesta aula
                  const studentBookings = await base44.entities.Booking.filter({
                    lesson_id: lesson.id,
                    client_email: studentEmail,
                    is_fixed_student: true
                  });
                  
                  // Remover todas as reservas do aluno nesta aula
                  for (const booking of studentBookings) {
                    console.log(`Removendo reserva ${booking.id} da aula ${lesson.id} (${lesson.date} ${lesson.start_time})`);
                    await base44.entities.Booking.delete(booking.id);
                  }
                  
                  // Verificar se ainda há outras reservas nesta aula
                  const remainingBookings = await base44.entities.Booking.filter({ lesson_id: lesson.id });
                  
                  if (remainingBookings.length === 0) {
                    // Aula vazia = apagar (apenas se for auto-gerada)
                    await base44.entities.Lesson.delete(lesson.id);
                    console.log(`Aula ${lesson.id} apagada (estava vazia após remoção)`);
                  } else {
                    // Atualizar contadores da aula
                    const fixedCount = remainingBookings.filter(b => b.is_fixed_student).length;
                    await base44.entities.Lesson.update(lesson.id, {
                      booked_spots: remainingBookings.length,
                      fixed_students_count: fixedCount
                    });
                    console.log(`Aula ${lesson.id} atualizada: ${remainingBookings.length}/6 (${fixedCount} fixos)`);
                  }
                } catch (e) {
                  console.error(`Erro ao processar aula ${lesson.id}:`, e);
                }
              }
            } catch (e) {
              console.error(`Erro ao buscar aulas do horário ${oldSchedule.day} ${oldSchedule.time}:`, e);
            }
          }
        }
      }
      
      if (isPicadeiro) {
        await base44.entities.PicadeiroStudent.update(userId, data);
      } else {
        await base44.entities.User.update(userId, data);
      }
      return { userId, data, isPicadeiro, oldSchedules, studentEmail, studentName };
    },
    onSuccess: async (result) => {
      // Construir aluno com dados atualizados
      let updatedStudent;
      if (result.isPicadeiro) {
        // Re-fetch para obter dados mais recentes
        await queryClient.invalidateQueries({ queryKey: ['picadeiro-students'] });
        const students = await base44.entities.PicadeiroStudent.list();
        const student = students.find(s => s.id === result.userId);
        updatedStudent = {
          id: result.userId,
          email: student?.email || student?.phone || `picadeiro-${student?.name}`,
          full_name: student?.name || '',
          fixed_schedule: result.data.fixed_schedule || [],
          ...result.data
        };
      } else {
        await queryClient.invalidateQueries({ queryKey: ['all-users'] });
        const users = await base44.entities.User.list('-created_date', 500);
        const user = users.find(u => u.id === result.userId);
        updatedStudent = {
          id: result.userId,
          email: user?.email || '',
          full_name: user?.full_name || '',
          fixed_schedule: result.data.fixed_schedule || [],
          ...result.data
        };
      }
      
      // Garantir que tem email e nome (usar dados passados se necessário)
      if (result.studentEmail && !updatedStudent.email) {
        updatedStudent.email = result.studentEmail;
      }
      if (result.studentName && !updatedStudent.full_name) {
        updatedStudent.full_name = result.studentName;
      }
      
      // SEMPRE criar/atualizar aulas para todos os horários se tiver horários definidos
      if (updatedStudent.fixed_schedule && updatedStudent.fixed_schedule.length > 0 && updatedStudent.email) {
        const nextYear = new Date().getFullYear() + 1;
        toast.loading(`A criar aulas até fim de ${nextYear}...`);
        console.log('Criando aulas para:', updatedStudent);
        
        // Se está editando, criar aulas para todos os horários novos (já removemos as antigas na mutationFn)
        // Isso garante que todos os horários atuais têm aulas
        const isEditing = !!result.oldSchedules && result.oldSchedules.length > 0;
        // Criar aulas para TODOS os horários atuais (os antigos já foram removidos)
        await createRecurringLessons(updatedStudent, false, []); // false = criar todas as aulas
        
        toast.dismiss();
        toast.success(`Aluno fixo guardado e horários atualizados até ${nextYear}!`);
      } else {
        toast.success('Aluno fixo atualizado!');
      }
      
      // Invalidar todas as queries relacionadas para atualizar a seção de aulas do admin
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      await queryClient.invalidateQueries({ queryKey: ['picadeiro-students'] });
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
      setDialogOpen(false);
      setEditingStudent(null);
      setStudentSearchQuery('');
      setFormData({
        user_id: '',
        student_level: 'iniciante',
        duration: 30,
        weekly_frequency: 1,
        schedules: []
      });
    }
  });

  const createRecurringLessons = async (student, onlyNewSchedules = false, oldSchedules = []) => {
    if (!student.fixed_schedule || student.fixed_schedule.length === 0) {
      console.log('Sem horários fixos definidos');
      return;
    }
    
    if (!student.email) {
      console.error('Aluno sem email:', student);
      toast.error('Erro: aluno sem email');
      return;
    }
    
    const service = services.find(s => s.title === 'Aulas em Grupo');
    if (!service) {
      console.error('Serviço "Aulas em Grupo" não encontrado');
      toast.error('Serviço "Aulas em Grupo" não encontrado');
      return;
    }

    // Se estamos editando, criar apenas os novos horários
    let schedulesToCreate = student.fixed_schedule;
    if (onlyNewSchedules && oldSchedules.length > 0) {
      schedulesToCreate = student.fixed_schedule.filter(ns => 
        !oldSchedules.some(old => old.day === ns.day && old.time === ns.time)
      );
      console.log('Criando apenas novos horários:', schedulesToCreate);
    } else {
      console.log(`Criando todas as aulas para ${student.full_name} (${student.email})`);
    }

    if (schedulesToCreate.length === 0) {
      console.log('Nenhum horário novo para criar');
      return;
    }

    console.log('Horários a criar:', schedulesToCreate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const endDate = new Date(currentYear + 1, 11, 31); // Fim do próximo ano
    endDate.setHours(23, 59, 59, 999);
    console.log(`Criando de ${format(today, 'yyyy-MM-dd')} até ${format(endDate, 'yyyy-MM-dd')}`);
    const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    
    let created = 0;
    let bookingsCreated = 0;
    let lessonsUpdated = 0;
    
    // Calcular todas as datas de uma vez (otimização)
    const allDates = [];
    for (const schedule of schedulesToCreate) {
      const targetDay = daysMap[schedule.day];
      const currentDate = new Date(today);
      
      // Calcular primeira ocorrência
      const currentDay = currentDate.getDay();
      let daysUntilTarget = (targetDay - currentDay + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7;
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);
      
      // Adicionar todas as ocorrências semanais até a data final
      while (currentDate <= endDate) {
        allDates.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          dateObj: new Date(currentDate),
          schedule: schedule
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
    
    console.log(`Total de aulas a processar: ${allDates.length}`);
    
    // Processar em batches para melhor performance
    const BATCH_SIZE = 50;
    for (let i = 0; i < allDates.length; i += BATCH_SIZE) {
      const batch = allDates.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async ({ date, schedule }) => {
        try {
          // Verificar se já existe aula neste horário
          const existingLessons = await base44.entities.Lesson.filter({ 
            date: date,
            start_time: schedule.time,
            service_id: service.id
          });

          let lesson;
          let isNewLesson = false;
          
          if (existingLessons.length === 0) {
            // Criar nova aula
            const [hours, minutes] = schedule.time.split(':');
            const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            endTime.setMinutes(endTime.getMinutes() + (schedule.duration || 30));
            
            lesson = await base44.entities.Lesson.create({
              service_id: service.id,
              date: date,
              start_time: schedule.time,
              end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
              max_spots: 6,
              booked_spots: 0, // Será atualizado depois ao criar booking
              fixed_students_count: 0, // Será atualizado depois ao criar booking
              is_auto_generated: true,
              is_owner_service: false
            });
            isNewLesson = true;
            created++;
          } else {
            lesson = existingLessons[0];
          }

          // SEMPRE verificar e criar reserva do aluno fixo se não existir
          // Isso garante que mesmo se a aula foi alterada manualmente ou já existe, o aluno fixo sempre aparece
          const existingBookings = await base44.entities.Booking.filter({
            lesson_id: lesson.id,
            client_email: student.email
          });

          if (existingBookings.length === 0) {
            // Criar reserva automática do aluno fixo
            await base44.entities.Booking.create({
              lesson_id: lesson.id,
              client_email: student.email,
              client_name: student.full_name,
              status: 'approved',
              is_fixed_student: true,
              is_owner_booking: false
            });
            bookingsCreated++;

            // Atualizar contadores da aula - buscar TODAS as reservas após criar
            const allLessonBookings = await base44.entities.Booking.filter({ lesson_id: lesson.id });
            const approvedBookings = allLessonBookings.filter(b => b.status === 'approved');
            const fixedCount = approvedBookings.filter(b => b.is_fixed_student).length;
            
            await base44.entities.Lesson.update(lesson.id, {
              booked_spots: approvedBookings.length,
              fixed_students_count: fixedCount
            });
            
            if (!isNewLesson) {
              lessonsUpdated++;
            }
          } else {
            // Se já existe reserva, garantir que está marcada como aluno fixo e aprovada
            const studentBooking = existingBookings[0];
            if (!studentBooking.is_fixed_student || studentBooking.status !== 'approved') {
              await base44.entities.Booking.update(studentBooking.id, {
                is_fixed_student: true,
                status: 'approved'
              });
              // Atualizar contadores
              const allLessonBookings = await base44.entities.Booking.filter({ lesson_id: lesson.id });
              const approvedBookings = allLessonBookings.filter(b => b.status === 'approved');
              const fixedCount = approvedBookings.filter(b => b.is_fixed_student).length;
              await base44.entities.Lesson.update(lesson.id, {
                booked_spots: approvedBookings.length,
                fixed_students_count: fixedCount
              });
              if (!isNewLesson) {
                lessonsUpdated++;
              }
            }
          }
        } catch (e) {
          console.error(`Erro ao criar aula ${date} ${schedule.time}:`, e);
        }
      });
      
      // Executar batch e aguardar
      await Promise.all(batchPromises);
      
      // Atualizar progresso
      if (i + BATCH_SIZE < allDates.length) {
        const progress = Math.round(((i + BATCH_SIZE) / allDates.length) * 100);
        toast.loading(`A criar aulas... ${progress}%`);
      }
    }
    
    console.log(`✅ Criadas ${created} novas aulas, ${bookingsCreated} reservas criadas, ${lessonsUpdated} aulas atualizadas`);
  };

  const handleSave = async () => {
    if (!formData.user_id || formData.schedules.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.schedules.length !== formData.weekly_frequency) {
      toast.error(`Selecione exatamente ${formData.weekly_frequency} horário(s)`);
      return;
    }

    const monthlyFee = monthlyFees[formData.duration][formData.weekly_frequency];
    const isPicadeiro = formData.user_id.startsWith('picadeiro-');
    const actualId = formData.user_id.replace('user-', '').replace('picadeiro-', '');
    
    // Obter dados do aluno para comparar horários
    let studentEmail = '';
    let studentName = '';
    let oldSchedules = [];
    if (editingStudent) {
      // Tentar obter email de diferentes fontes
      studentEmail = editingStudent.email || 
                     (editingStudent.source === 'picadeiro' ? editingStudent.phone : '') ||
                     editingStudent.full_name || 
                     editingStudent.name || '';
      studentName = editingStudent.full_name || editingStudent.name || '';
      oldSchedules = editingStudent.fixed_schedule || [];
    } else {
      // Se não está editando, obter dados do aluno selecionado
      const selectedStudent = filteredStudentsForSelection.find(s => s.id === formData.user_id);
      if (selectedStudent) {
        studentEmail = selectedStudent.email || selectedStudent.phone || '';
        studentName = selectedStudent.name || '';
      }
    }

    await updateUserMutation.mutateAsync({
      userId: actualId,
      isPicadeiro,
      isEditing: !!editingStudent,
      studentEmail,
      studentName,
      oldSchedules,
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

      // Apagar todas as reservas fixas do aluno
      if (studentEmail) {
        const bookings = await base44.entities.Booking.filter({
          client_email: studentEmail,
          is_fixed_student: true
        });

        console.log(`Encontradas ${bookings.length} reservas fixas para ${studentEmail}`);

        // Agrupar por lesson_id para processar
        const lessonIds = [...new Set(bookings.map(b => b.lesson_id))];
        
        // Apagar todas as reservas primeiro
        for (const booking of bookings) {
          try {
            await base44.entities.Booking.delete(booking.id);
          } catch (e) {
            console.error('Erro ao apagar reserva:', e);
          }
        }

        // Agora processar cada aula
        for (const lessonId of lessonIds) {
          try {
            const lessons = await base44.entities.Lesson.filter({ id: lessonId });
            if (lessons.length === 0) continue;
            
            const lesson = lessons[0];
            
            // Verificar se ainda há outras reservas nesta aula
            const remainingBookings = await base44.entities.Booking.filter({ lesson_id: lessonId });

            if (remainingBookings.length === 0) {
              // Aula vazia = apagar (auto-gerada ou não)
              await base44.entities.Lesson.delete(lesson.id);
              console.log(`Aula ${lessonId} apagada (estava vazia)`);
            } else {
              // Atualizar contadores
              await base44.entities.Lesson.update(lesson.id, {
                booked_spots: remainingBookings.length,
                fixed_students_count: remainingBookings.filter(b => b.is_fixed_student).length
              });
              console.log(`Aula ${lessonId} atualizada (${remainingBookings.length} alunos restantes)`);
            }
          } catch (e) {
            console.error('Erro ao processar aula:', e);
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
    onSuccess: async () => {
      // Invalidar todas as queries para atualizar a seção de aulas do admin
      await queryClient.invalidateQueries({ queryKey: ['all-users'] });
      await queryClient.invalidateQueries({ queryKey: ['picadeiro-students'] });
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
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
    // Garantir que temos todos os dados do aluno
    const studentData = {
      ...student,
      email: student.email || student.phone || '',
      full_name: student.full_name || student.name || '',
      name: student.name || student.full_name || ''
    };
    setEditingStudent(studentData);
    const isPicadeiro = picadeiroStudents.some(s => s.id === student.id);
    setFormData({
      user_id: `${isPicadeiro ? 'picadeiro' : 'user'}-${student.id}`,
      student_level: student.student_level || 'iniciante',
      duration: student.fixed_schedule?.[0]?.duration || 30,
      weekly_frequency: student.fixed_schedule?.length || 1,
      schedules: student.fixed_schedule || []
    });
    setStudentSearchQuery(''); // Limpar pesquisa ao editar
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
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open && !updateUserMutation.isPending) {
                // Limpar formulário ao fechar apenas se não estiver salvando
                setEditingStudent(null);
                setStudentSearchQuery('');
                setFormData({
                  user_id: '',
                  student_level: 'iniciante',
                  duration: 30,
                  weekly_frequency: 1,
                  schedules: []
                });
              }
            }}>
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
                  <Label>Selecionar Aluno *</Label>
                  <div className="space-y-2">
                    {/* Barra de pesquisa */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Pesquisar por nome, email ou telefone..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="pl-9"
                        disabled={!!editingStudent}
                      />
                    </div>
                    <Select
                      value={formData.user_id || undefined}
                      onValueChange={(v) => {
                        setFormData({ ...formData, user_id: v });
                        setStudentSearchQuery(''); // Limpar pesquisa após seleção
                      }}
                      disabled={!!editingStudent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudentsForSelection.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {studentSearchQuery ? 'Nenhum aluno encontrado' : 'Sem alunos disponíveis'}
                          </SelectItem>
                        ) : (
                          filteredStudentsForSelection.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{student.name}</span>
                                <span className="text-xs text-stone-500">
                                  {student.email || student.phone || 'Sem contacto'} 
                                  {student.source === 'picadeiro' && ' (Picadeiro)'}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formData.user_id && (
                      <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border">
                        <div className="w-8 h-8 rounded-full bg-[#4A5D23] text-white flex items-center justify-center font-bold">
                          {filteredStudentsForSelection.find(s => s.id === formData.user_id)?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#2C3E1F]">
                            {filteredStudentsForSelection.find(s => s.id === formData.user_id)?.name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {filteredStudentsForSelection.find(s => s.id === formData.user_id)?.email || 
                             filteredStudentsForSelection.find(s => s.id === formData.user_id)?.phone || 
                             'Sem contacto'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
