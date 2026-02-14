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
import { Calendar, Plus, Trash2, Edit, Search, Clock } from 'lucide-react';
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
    queryFn: async () => {
      const data = await base44.entities.PicadeiroStudent.filter({ is_active: true });
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    initialData: [],
    staleTime: 0
  });

  const fixedStudentsFromUsers = allUsers.filter(u => u.student_type === 'fixo' || u.student_type === 'flexivel');
  const fixedStudentsFromPicadeiro = picadeiroStudents.filter(s => s.student_type === 'fixo' || s.student_type === 'flexivel').map(s => ({
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

  const [studentTypeMode, setStudentTypeMode] = useState('fixo'); // fixo ou flexivel

  // Lista combinada de todos os alunos (users + picadeiro) para seleção
  const allStudentsForSelection = [
    ...allUsers.filter(u => (u.student_type !== 'fixo' && u.student_type !== 'flexivel') || u.id === editingStudent?.id).map(u => ({
      id: `user-${u.id}`,
      name: u.full_name || '',
      email: u.email || '',
      phone: '',
      source: 'user'
    })),
    ...picadeiroStudents.filter(s => (s.student_type !== 'fixo' && s.student_type !== 'flexivel') || s.id === editingStudent?.id).map(s => ({
      id: `picadeiro-${s.id}`,
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      source: 'picadeiro'
    }))
  ].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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
      console.log('=== INICIANDO ATUALIZAÇÃO DE ALUNO ===');
      console.log('User ID:', userId);
      console.log('Email:', studentEmail);
      console.log('Is Editing:', isEditing);
      
      // Se está editando, remover TODAS as aulas futuras do aluno e recriar
      if (isEditing && studentEmail) {
        console.log('MODO EDIÇÃO: A remover todas as aulas futuras do aluno...');
        
        toast.loading('A atualizar horários...');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Buscar TODAS as reservas fixas do aluno
        let allBookings = await base44.entities.Booking.filter({
          client_email: studentEmail,
          is_fixed_student: true
        });
        
        console.log(`Total reservas fixas encontradas: ${allBookings.length}`);
        
        // Processar cada reserva
        for (const booking of allBookings) {
          try {
            // Buscar aula da reserva
            const lessonResult = await base44.entities.Lesson.filter({ id: booking.lesson_id });
            if (!lessonResult || lessonResult.length === 0) {
              console.log(`Aula ${booking.lesson_id} não encontrada, removendo reserva`);
              await base44.entities.Booking.delete(booking.id);
              continue;
            }
            
            const lesson = lessonResult[0];
            const lessonDate = new Date(lesson.date);
            lessonDate.setHours(0, 0, 0, 0);
            
            // Apenas remover aulas futuras (hoje ou depois)
            if (lessonDate >= today) {
              console.log(`Removendo reserva ${booking.id} da aula ${lesson.id} (${lesson.date})`);
              
              // Apagar reserva
              await base44.entities.Booking.delete(booking.id);
              
              // Verificar reservas restantes
              const remainingBookings = await base44.entities.Booking.filter({ lesson_id: lesson.id });
              
              if (remainingBookings.length === 0 && lesson.is_auto_generated) {
                // Aula vazia e auto-gerada = apagar
                console.log(`  → Apagando aula ${lesson.id} (vazia)`);
                await base44.entities.Lesson.delete(lesson.id);
              } else if (remainingBookings.length > 0) {
                // Atualizar contadores
                const fixedCount = remainingBookings.filter(b => b.is_fixed_student).length;
                await base44.entities.Lesson.update(lesson.id, {
                  booked_spots: remainingBookings.length,
                  fixed_students_count: fixedCount
                });
              }
            }
          } catch (e) {
            console.error(`Erro ao processar reserva ${booking.id}:`, e);
          }
        }
        
        console.log('Todas as aulas futuras foram removidas');
      }
      
      // Atualizar dados do aluno
      console.log('Atualizando dados do aluno...');
      if (isPicadeiro) {
        await base44.entities.PicadeiroStudent.update(userId, data);
      } else {
        await base44.entities.User.update(userId, data);
      }
      
      console.log('=== ATUALIZAÇÃO CONCLUÍDA ===');
      return { userId, data, isPicadeiro, oldSchedules, studentEmail, studentName, isEditing };
    },
    onSuccess: async (result) => {
      try {
        // Construir aluno com dados atualizados
        let updatedStudent;
        if (result.isPicadeiro) {
          // Re-fetch para obter dados mais recentes
          const students = await base44.entities.PicadeiroStudent.list();
          const student = students.find(s => s.id === result.userId);
          updatedStudent = {
            id: result.userId,
            email: student?.email || result.studentEmail || '',
            phone: student?.phone || '',
            full_name: student?.name || result.studentName || '',
            fixed_schedule: result.data.fixed_schedule || [],
            ...result.data
          };
        } else {
          const users = await base44.entities.User.list('-created_date', 500);
          const user = users.find(u => u.id === result.userId);
          updatedStudent = {
            id: result.userId,
            email: user?.email || result.studentEmail || '',
            phone: '',
            full_name: user?.full_name || result.studentName || '',
            fixed_schedule: result.data.fixed_schedule || [],
            ...result.data
          };
        }
        
        // Usar dados passados como fallback
        if (!updatedStudent.email && result.studentEmail) {
          updatedStudent.email = result.studentEmail;
        }
        if (!updatedStudent.full_name && result.studentName) {
          updatedStudent.full_name = result.studentName;
        }
        
        // Identificador estável para reservas
        const hasIdentifier = updatedStudent.email || updatedStudent.phone;
        
        console.log('=== DEBUG: Aluno para criar aulas ===');
        console.log('updatedStudent:', updatedStudent);
        console.log('hasIdentifier:', hasIdentifier);
        console.log('fixed_schedule:', updatedStudent.fixed_schedule);
        console.log('isEditing:', result.isEditing);
        
        // Criar aulas para os próximos 3 meses
        if (updatedStudent.fixed_schedule && updatedStudent.fixed_schedule.length > 0 && hasIdentifier) {
          if (!result.isEditing) {
            // Aluno novo: criar todas as aulas
            toast.loading('A criar aulas para 3 meses...', { id: 'saving-student' });
            await createRecurringLessons(updatedStudent);
            toast.dismiss('saving-student');
            toast.success('Aluno fixo guardado e horários criados!');
          } else {
            // Aluno editado: criar aulas para TODOS os horários (já removemos as antigas)
            toast.loading('A criar novas aulas para 3 meses...', { id: 'saving-student' });
            await createRecurringLessons(updatedStudent);
            toast.dismiss('saving-student');
            toast.success('Aluno atualizado e horários recriados para 3 meses!');
          }
        } else {
          console.log('Não criou aulas porque:', {
            hasSchedule: !!updatedStudent.fixed_schedule,
            scheduleLength: updatedStudent.fixed_schedule?.length,
            hasIdentifier
          });
          toast.success('Aluno fixo atualizado!');
        }
      } catch (error) {
        console.error('Erro ao criar aulas:', error);
        toast.dismiss();
        toast.error('Aluno guardado mas houve erro ao criar algumas aulas');
      } finally {
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
    }
  });

  const createRecurringLessons = async (student) => {
    console.log('=== INICIANDO createRecurringLessons ===');
    console.log('Student recebido:', student);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const withRateLimitRetry = async (fn, { retries = 5, baseDelay = 600 } = {}) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          const message = String(error?.message || '').toLowerCase();
          const isRateLimit = message.includes('rate limit') || error?.status === 429 || error?.response?.status === 429;
          if (!isRateLimit || attempt === retries) {
            throw error;
          }
          const delay = baseDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
      throw lastError;
    };

    const rateLimitState = {
      lastRequest: 0,
      minDelay: 140,
      maxDelay: 1500,
      active: 0,
      maxConcurrency: 2
    };

    const rateLimitCall = async (fn) => {
      while (rateLimitState.active >= rateLimitState.maxConcurrency) {
        await sleep(30);
      }
      rateLimitState.active += 1;
      try {
        const now = Date.now();
        const wait = Math.max(0, rateLimitState.minDelay - (now - rateLimitState.lastRequest));
        if (wait > 0) {
          await sleep(wait);
        }
        rateLimitState.lastRequest = Date.now();
        const result = await withRateLimitRetry(fn);
        rateLimitState.minDelay = Math.max(80, rateLimitState.minDelay * 0.95);
        return result;
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const isRateLimit = message.includes('rate limit') || error?.status === 429 || error?.response?.status === 429;
        if (isRateLimit) {
          rateLimitState.minDelay = Math.min(rateLimitState.minDelay * 1.6 + 100, rateLimitState.maxDelay);
          await sleep(rateLimitState.minDelay);
        }
        throw error;
      } finally {
        rateLimitState.active -= 1;
      }
    };
    
    if (!student.fixed_schedule || student.fixed_schedule.length === 0) {
      console.log('❌ Sem horários fixos definidos');
      return;
    }
    
    const studentKey = student.email || student.phone || `student-${student.full_name || student.name}`;
    const studentName = student.full_name || student.name || 'Aluno';
    
    console.log('StudentKey:', studentKey);
    console.log('StudentName:', studentName);
    
    if (!studentKey) {
      console.error('❌ Aluno sem identificador válido:', student);
      toast.error('Erro: aluno sem identificador');
      return;
    }
    
    const serviceList = await base44.entities.Service.list();
    console.log('Serviços disponíveis:', serviceList.map(s => s.title));
    
    const service = serviceList.find(s => s.title === 'Aulas em Grupo');
    if (!service) {
      console.error('❌ Serviço "Aulas em Grupo" não encontrado');
      toast.error('Serviço "Aulas em Grupo" não encontrado');
      return;
    }
    
    console.log('✅ Serviço encontrado:', service.id);

    const schedulesToCreate = student.fixed_schedule;
    console.log(`Criando aulas para ${studentName} (${studentKey})`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 3 MESES EM VEZ DE 1 ANO PARA EVITAR TIMEOUTS
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    
    const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    
    let created = 0;
    let bookingsCreated = 0;
    
    // Calcular todas as datas
    const allDates = [];
    for (const schedule of schedulesToCreate) {
      const targetDay = daysMap[schedule.day];
      const currentDate = new Date(today);
      
      const currentDay = currentDate.getDay();
      let daysUntilTarget = (targetDay - currentDay + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7;
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);
      
      while (currentDate <= endDate) {
        allDates.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          schedule: schedule
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
    
    console.log(`Total de aulas a processar: ${allDates.length}`);

    const existingLessonsMap = new Map();
    const uniqueTimes = [...new Set(schedulesToCreate.map(schedule => schedule.time))];

    for (const time of uniqueTimes) {
      const lessonsForTime = await rateLimitCall(() =>
        base44.entities.Lesson.filter({
          service_id: service.id,
          start_time: time
        })
      );
      lessonsForTime.forEach(lesson => {
        const key = `${lesson.date}-${lesson.start_time}`;
        existingLessonsMap.set(key, lesson);
      });
    }

    const existingBookings = await rateLimitCall(() =>
      base44.entities.Booking.filter({
        client_email: studentKey,
        is_fixed_student: true
      })
    );
    const bookingLessonIds = new Set(existingBookings.map(booking => booking.lesson_id));

    const MAX_CONCURRENCY = 3;
    let active = 0;
    let cursor = 0;

    const processLesson = async ({ date, schedule }) => {
      try {
        const lessonKey = `${date}-${schedule.time}`;
        let lesson = existingLessonsMap.get(lessonKey);

        if (!lesson) {
          const [hours, minutes] = schedule.time.split(':');
          const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
          endTime.setMinutes(endTime.getMinutes() + (schedule.duration || 30));

          lesson = await rateLimitCall(() =>
            base44.entities.Lesson.create({
              service_id: service.id,
              date: date,
              start_time: schedule.time,
              end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
              max_spots: 6,
              booked_spots: 1,
              fixed_students_count: 1,
              is_auto_generated: true,
              status: 'scheduled'
            })
          );

          existingLessonsMap.set(lessonKey, lesson);

          await rateLimitCall(() =>
            base44.entities.Booking.create({
              lesson_id: lesson.id,
              client_email: studentKey,
              client_name: studentName,
              status: 'approved',
              is_fixed_student: true,
              approved_at: new Date().toISOString(),
              approved_by: 'system'
            })
          );

          bookingLessonIds.add(lesson.id);
          created += 1;
          bookingsCreated += 1;
          return;
        }

        if (!bookingLessonIds.has(lesson.id)) {
          await rateLimitCall(() =>
            base44.entities.Booking.create({
              lesson_id: lesson.id,
              client_email: studentKey,
              client_name: studentName,
              status: 'approved',
              is_fixed_student: true,
              approved_at: new Date().toISOString(),
              approved_by: 'system'
            })
          );

          await rateLimitCall(() =>
            base44.entities.Lesson.update(lesson.id, {
              booked_spots: (lesson.booked_spots || 0) + 1,
              fixed_students_count: (lesson.fixed_students_count || 0) + 1
            })
          );

          bookingLessonIds.add(lesson.id);
          bookingsCreated += 1;
        }
      } catch (e) {
        console.error(`Erro ${date} ${schedule.time}:`, e);
      }
    };

    const runQueue = async () => {
      while (cursor < allDates.length) {
        if (active >= MAX_CONCURRENCY) {
          await sleep(120);
          continue;
        }
        const item = allDates[cursor++];
        active += 1;
        processLesson(item)
          .catch((error) => console.error('Erro no processamento:', error))
          .finally(() => {
            active -= 1;
          });
      }
      while (active > 0) {
        await sleep(120);
      }
    };

    await runQueue();

    toast.loading(`A criar aulas... 100% (${created} aulas, ${bookingsCreated} reservas)`, { id: 'creating-lessons' });
    
    toast.dismiss('creating-lessons');
    console.log(`✅ CONCLUÍDO: Criadas ${created} aulas, ${bookingsCreated} reservas`);
    toast.success(`Criadas ${created} aulas para 3 meses!`);
  };

  const extendLessons = async (student) => {
    console.log('=== INICIANDO extendLessons ===');
    console.log('Student recebido:', student);
    console.log('Data atual:', new Date().toISOString().split('T')[0]);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const withRateLimitRetry = async (fn, { retries = 5, baseDelay = 600 } = {}) => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          const message = String(error?.message || '').toLowerCase();
          const isRateLimit = message.includes('rate limit') || error?.status === 429 || error?.response?.status === 429;
          if (!isRateLimit || attempt === retries) {
            throw error;
          }
          const delay = baseDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
      throw lastError;
    };

    const rateLimitState = {
      lastRequest: 0,
      minDelay: 140,
      maxDelay: 1500,
      active: 0,
      maxConcurrency: 2
    };

    const rateLimitCall = async (fn) => {
      while (rateLimitState.active >= rateLimitState.maxConcurrency) {
        await sleep(30);
      }
      rateLimitState.active += 1;
      try {
        const now = Date.now();
        const wait = Math.max(0, rateLimitState.minDelay - (now - rateLimitState.lastRequest));
        if (wait > 0) {
          await sleep(wait);
        }
        rateLimitState.lastRequest = Date.now();
        const result = await withRateLimitRetry(fn);
        rateLimitState.minDelay = Math.max(80, rateLimitState.minDelay * 0.95);
        return result;
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        const isRateLimit = message.includes('rate limit') || error?.status === 429 || error?.response?.status === 429;
        if (isRateLimit) {
          rateLimitState.minDelay = Math.min(rateLimitState.minDelay * 1.6 + 100, rateLimitState.maxDelay);
          await sleep(rateLimitState.minDelay);
        }
        throw error;
      } finally {
        rateLimitState.active -= 1;
      }
    };

    if (!student.fixed_schedule || student.fixed_schedule.length === 0) {
      console.log('❌ Sem horários fixos definidos');
      return;
    }

    const studentKey = student.email || student.phone || `student-${student.full_name || student.name}`;
    const studentName = student.full_name || student.name || 'Aluno';

    console.log('=== DEBUG STUDENT KEY ===');
    console.log('Student object:', student);
    console.log('Student email:', student.email);
    console.log('Student phone:', student.phone);
    console.log('Student name:', student.full_name || student.name);
    console.log('StudentKey gerado:', studentKey);
    console.log('StudentName:', studentName);

    if (!studentKey) {
      console.error('❌ Aluno sem identificador válido:', student);
      toast.error('Erro: aluno sem identificador');
      return;
    }

    const serviceList = await base44.entities.Service.list();
    const service = serviceList.find(s => s.title === 'Aulas em Grupo');
    if (!service) {
      console.error('❌ Serviço "Aulas em Grupo" não encontrado');
      toast.error('Serviço "Aulas em Grupo" não encontrado');
      return;
    }

    console.log('✅ Serviço encontrado:', service.id);

    const schedulesToCreate = student.fixed_schedule;
    console.log(`Estendendo aulas para ${studentName} (${studentKey})`);

    // Encontrar a última aula existente para este aluno
    // Estratégia múltipla: tentar diferentes identificadores
    let existingBookings = [];
    let foundByMethod = '';

    // Método 1: Buscar por email/phone com is_fixed_student
    if (studentKey && studentKey !== `student-${studentName}`) {
      existingBookings = await rateLimitCall(() =>
        base44.entities.Booking.filter({
          client_email: studentKey,
          is_fixed_student: true
        })
      );
      if (existingBookings.length > 0) {
        foundByMethod = 'email/phone + is_fixed_student';
      }
    }

    // Método 2: Se não encontrou, buscar apenas por email/phone (todas as reservas)
    if (existingBookings.length === 0 && studentKey && studentKey !== `student-${studentName}`) {
      const allBookingsByEmail = await rateLimitCall(() =>
        base44.entities.Booking.filter({
          client_email: studentKey
        })
      );
      // Filtrar apenas reservas de aulas auto-geradas (que são dos alunos fixos)
      const autoGeneratedBookings = [];
      for (const booking of allBookingsByEmail) {
        try {
          const lesson = await rateLimitCall(() =>
            base44.entities.Lesson.get(booking.lesson_id)
          );
          if (lesson && lesson.is_auto_generated) {
            autoGeneratedBookings.push(booking);
          }
        } catch (e) {
          // Aula pode ter sido deletada, ignorar
        }
      }
      existingBookings = autoGeneratedBookings;
      if (existingBookings.length > 0) {
        foundByMethod = 'email/phone + auto_generated_lessons';
      }
    }

    // Método 3: Buscar por nome se ainda não encontrou
    if (existingBookings.length === 0 && studentName) {
      const allBookings = await rateLimitCall(() =>
        base44.entities.Booking.list('-created_date', 1000)
      );
      existingBookings = allBookings.filter(b => 
        b.client_name === studentName && b.is_fixed_student
      );
      if (existingBookings.length > 0) {
        foundByMethod = 'client_name + is_fixed_student';
      }
    }

    console.log(`Reservas encontradas via ${foundByMethod}:`, existingBookings.length);
    console.log('Método usado:', foundByMethod);

    if (existingBookings.length === 0) {
      console.log('❌ BUG DETECTADO: Nenhuma reserva encontrada para aluno fixo que deveria ter aulas!');
      console.log('Isso indica que as reservas criadas anteriormente não estão sendo encontradas.');
      console.log('Possíveis causas:');
      console.log('1. Reservas não têm is_fixed_student: true');
      console.log('2. StudentKey não corresponde ao usado na criação');
      console.log('3. Reservas foram deletadas ou alteradas');
      
      // Fallback: começar de hoje mesmo sem reservas
      toast.warning('Nenhuma reserva encontrada - começando extensão do zero');
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }

    console.log('Reservas encontradas:', existingBookings.length);
    console.log('Primeiras reservas:', existingBookings.slice(0, 3).map(b => ({ id: b.id, lesson_id: b.lesson_id })));

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (existingBookings.length > 0) {
      // Buscar todas as aulas para encontrar a mais recente
      const allLessonsForStudent = await rateLimitCall(() =>
        base44.entities.Lesson.list('-date', 1000)
      );

      console.log('Total de aulas no sistema:', allLessonsForStudent.length);

      // Filtrar apenas aulas que têm reservas deste aluno
      const studentLessonIds = new Set(existingBookings.map(b => b.lesson_id));
      const studentLessons = allLessonsForStudent.filter(l => studentLessonIds.has(l.id));

      console.log('Aulas do aluno encontradas:', studentLessons.length);
      console.log('Datas das aulas:', studentLessons.map(l => l.date).sort());

      if (studentLessons.length > 0) {
        // Encontrar a aula mais recente
        const latestLesson = studentLessons.reduce((latest, lesson) => {
          const lessonDate = new Date(lesson.date);
          const latestDate = new Date(latest.date);
          return lessonDate > latestDate ? lesson : latest;
        });

        startDate = new Date(latestLesson.date);
        startDate.setDate(startDate.getDate() + 1); // Começar no dia seguinte
        console.log('Última aula encontrada:', latestLesson.date, 'Nova startDate:', startDate.toISOString().split('T')[0]);
      } else {
        console.log('❌ Nenhuma aula encontrada para as reservas do aluno');
      }
    } else {
      console.log('❌ Nenhuma reserva encontrada para o aluno');
    }

    // Adicionar 3 meses a partir da data de início
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

    let created = 0;
    let bookingsCreated = 0;

    // Calcular todas as datas dos próximos 3 meses
    const allDates = [];
    for (const schedule of schedulesToCreate) {
      const targetDay = daysMap[schedule.day];
      const currentDate = new Date(startDate);

      const currentDay = currentDate.getDay();
      let daysUntilTarget = (targetDay - currentDay + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7;
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);

      while (currentDate <= endDate) {
        allDates.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          schedule: schedule
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    console.log(`Total de aulas a adicionar: ${allDates.length}`);
    console.log('Primeiras datas a processar:', allDates.slice(0, 5).map(d => d.date));

    const existingLessonsMap = new Map();
    const uniqueTimes = [...new Set(schedulesToCreate.map(schedule => schedule.time))];

    for (const time of uniqueTimes) {
      const lessonsForTime = await rateLimitCall(() =>
        base44.entities.Lesson.filter({
          service_id: service.id,
          start_time: time
        })
      );
      lessonsForTime.forEach(lesson => {
        const key = `${lesson.date}-${lesson.start_time}`;
        existingLessonsMap.set(key, lesson);
      });
    }

    console.log('Aulas existentes encontradas:', existingLessonsMap.size);

    const existingBookingsSet = new Set(existingBookings.map(booking => booking.lesson_id));

    // Verificar reservas existentes para este aluno especificamente
    const checkExistingBookingForLesson = async (lessonId) => {
      const bookingsForLesson = await rateLimitCall(() =>
        base44.entities.Booking.filter({
          lesson_id: lessonId,
          client_email: studentKey,
          is_fixed_student: true
        })
      );
      return bookingsForLesson.length > 0;
    };

    const MAX_CONCURRENCY = 3;
    let active = 0;
    let cursor = 0;

    const processLesson = async ({ date, schedule }) => {
      try {
        const lessonKey = `${date}-${schedule.time}`;
        console.log(`Processando aula: ${lessonKey}`);
        
        let lesson = existingLessonsMap.get(lessonKey);

        if (!lesson) {
          // Verificação adicional: buscar especificamente por data e horário
          const existingLessonCheck = await rateLimitCall(() =>
            base44.entities.Lesson.filter({
              service_id: service.id,
              date: date,
              start_time: schedule.time
            })
          );
          
          if (existingLessonCheck.length > 0) {
            lesson = existingLessonCheck[0];
            existingLessonsMap.set(lessonKey, lesson);
            console.log(`Aula já existia: ${lessonKey}`);
          }
        }

        if (!lesson) {
          const [hours, minutes] = schedule.time.split(':');
          const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
          endTime.setMinutes(endTime.getMinutes() + (schedule.duration || 30));

          lesson = await rateLimitCall(() =>
            base44.entities.Lesson.create({
              service_id: service.id,
              date: date,
              start_time: schedule.time,
              end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
              max_spots: 6,
              booked_spots: 1,
              fixed_students_count: 1,
              is_auto_generated: true,
              status: 'scheduled'
            })
          );

          existingLessonsMap.set(lessonKey, lesson);

          await rateLimitCall(() =>
            base44.entities.Booking.create({
              lesson_id: lesson.id,
              client_email: studentKey,
              client_name: studentName,
              status: 'approved',
              is_fixed_student: true,
              approved_at: new Date().toISOString(),
              approved_by: 'system'
            })
          );

          existingBookingsSet.add(lesson.id);
          created += 1;
          bookingsCreated += 1;
          console.log(`Criada nova aula: ${lessonKey}`);
          return;
        }

        if (!existingBookingsSet.has(lesson.id)) {
          // Verificação adicional para garantir que não há reserva duplicada
          const hasExistingBooking = await checkExistingBookingForLesson(lesson.id);
          
          if (!hasExistingBooking) {
            await rateLimitCall(() =>
              base44.entities.Booking.create({
                lesson_id: lesson.id,
                client_email: studentKey,
                client_name: studentName,
                status: 'approved',
                is_fixed_student: true,
                approved_at: new Date().toISOString(),
                approved_by: 'system'
              })
            );

            await rateLimitCall(() =>
              base44.entities.Lesson.update(lesson.id, {
                booked_spots: (lesson.booked_spots || 0) + 1,
                fixed_students_count: (lesson.fixed_students_count || 0) + 1
              })
            );

            existingBookingsSet.add(lesson.id);
            bookingsCreated += 1;
          }
        }
      } catch (e) {
        console.error(`Erro ${date} ${schedule.time}:`, e);
      }
    };

    const runQueue = async () => {
      while (cursor < allDates.length) {
        if (active >= MAX_CONCURRENCY) {
          await sleep(120);
          continue;
        }
        const item = allDates[cursor++];
        active += 1;
        processLesson(item)
          .catch((error) => console.error('Erro no processamento:', error))
          .finally(() => {
            active -= 1;
          });
      }
      while (active > 0) {
        await sleep(120);
      }
    };

    await runQueue();

    toast.loading(`A estender aulas... 100% (${created} aulas, ${bookingsCreated} reservas)`, { id: 'extending-lessons' });

    toast.dismiss('extending-lessons');
    console.log(`✅ EXTENSÃO CONCLUÍDA: Adicionadas ${created} aulas, ${bookingsCreated} reservas`);
    toast.success(`Adicionadas ${created} aulas para mais 3 meses!`);
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
    
    // Obter dados do aluno selecionado
    const selectedStudent = allStudentsForSelection.find(s => s.id === formData.user_id);
    
    let studentEmail = '';
    let studentName = '';
    let oldSchedules = [];
    
    if (editingStudent) {
      studentEmail = editingStudent.email || editingStudent.phone || '';
      studentName = editingStudent.full_name || editingStudent.name || '';
      oldSchedules = editingStudent.fixed_schedule || [];
    }
    
    // Usar dados do aluno selecionado como fallback
    if (!studentEmail && selectedStudent) {
      studentEmail = selectedStudent.email || selectedStudent.phone || '';
    }
    if (!studentName && selectedStudent) {
      studentName = selectedStudent.name || '';
    }
    
    // Se não tem email/telefone, usar o nome como identificador único
    if (!studentEmail && studentName) {
      studentEmail = `aluno-${studentName.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    console.log('=== handleSave DEBUG ===');
    console.log('formData.user_id:', formData.user_id);
    console.log('studentEmail (identificador):', studentEmail);
    console.log('studentName:', studentName);
    console.log('schedules:', formData.schedules);
    
    if (!studentEmail) {
      toast.error('O aluno precisa ter nome, email ou telefone para criar aulas');
      return;
    }

    await updateUserMutation.mutateAsync({
      userId: actualId,
      isPicadeiro,
      isEditing: !!editingStudent,
      studentEmail,
      studentName,
      oldSchedules,
      data: {
        student_type: studentTypeMode,
        student_level: formData.student_level,
        fixed_schedule: studentTypeMode === 'fixo' ? formData.schedules : [],
        monthly_fee: studentTypeMode === 'fixo' ? monthlyFee : 0
      }
    });
  };

  const addScheduleSlot = () => {
    const newSchedule = {
      day: 'monday',
      time: '09:00',
      duration: formData.duration || 30
    };
    console.log('Adicionando novo horário:', newSchedule);
    setFormData({
      ...formData,
      schedules: [...formData.schedules, newSchedule]
    });
  };

  const removeScheduleSlot = (index) => {
    const newSchedules = formData.schedules.filter((_, i) => i !== index);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const removeStudentMutation = useMutation({
    mutationFn: async ({ userId, isPicadeiro, studentEmail }) => {
      console.log('=== INICIANDO REMOÇÃO ===');
      console.log('userId:', userId);
      console.log('studentEmail:', studentEmail);
      console.log('isPicadeiro:', isPicadeiro);
      
      toast.loading('A remover aluno fixo e aulas futuras...');

      if (studentEmail) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar TODAS as reservas do aluno (fixas)
        let allBookings = await base44.entities.Booking.filter({
          client_email: studentEmail,
          is_fixed_student: true
        });
        
        console.log(`Total reservas fixas encontradas: ${allBookings.length}`);
        
        // Se não encontrou por email e tem nome, tentar buscar por nome
        if (allBookings.length === 0) {
          console.log('Tentando buscar por client_email alternativo...');
          const allBookingsList = await base44.entities.Booking.list('-created_date', 1000);
          allBookings = allBookingsList.filter(b => 
            b.client_email === studentEmail && b.is_fixed_student === true
          );
          console.log(`Reservas encontradas por busca alternativa: ${allBookings.length}`);
        }

        if (allBookings.length === 0) {
          console.log('⚠️ Nenhuma reserva encontrada para remover');
          toast.warning('Nenhuma reserva encontrada para este aluno');
        } else {
          // Separar por data
          const futureBookings = [];
          const processedLessons = new Set();
          
          for (const booking of allBookings) {
            try {
              // Buscar aula da reserva
              const lesson = await base44.entities.Lesson.filter({ id: booking.lesson_id });
              if (!lesson || lesson.length === 0) {
                console.log(`Aula ${booking.lesson_id} não encontrada, removendo reserva órfã`);
                await base44.entities.Booking.delete(booking.id);
                continue;
              }
              
              const lessonData = lesson[0];
              const lessonDate = new Date(lessonData.date);
              lessonDate.setHours(0, 0, 0, 0);
              
              // Apenas futuras (hoje ou depois)
              if (lessonDate >= today) {
                futureBookings.push({ booking, lesson: lessonData });
              }
            } catch (e) {
              console.error(`Erro ao processar booking ${booking.id}:`, e);
            }
          }
          
          console.log(`Reservas futuras a remover: ${futureBookings.length}`);
          
          // Remover reservas futuras e atualizar aulas
          for (const { booking, lesson } of futureBookings) {
            try {
              console.log(`Removendo reserva ${booking.id} da aula ${lesson.id} (${lesson.date})`);
              
              // Apagar reserva
              await base44.entities.Booking.delete(booking.id);
              
              // Evitar processar a mesma aula múltiplas vezes
              if (processedLessons.has(lesson.id)) continue;
              processedLessons.add(lesson.id);
              
              // Verificar reservas restantes
              const remainingBookings = await base44.entities.Booking.filter({ lesson_id: lesson.id });
              
              if (remainingBookings.length === 0 && lesson.is_auto_generated) {
                // Aula vazia e auto-gerada = apagar
                console.log(`  → Apagando aula ${lesson.id} (vazia)`);
                await base44.entities.Lesson.delete(lesson.id);
              } else if (remainingBookings.length > 0) {
                // Atualizar contadores
                const fixedCount = remainingBookings.filter(b => b.is_fixed_student).length;
                console.log(`  → Atualizando aula ${lesson.id}: ${remainingBookings.length}/6 (${fixedCount} fixos)`);
                await base44.entities.Lesson.update(lesson.id, {
                  booked_spots: remainingBookings.length,
                  fixed_students_count: fixedCount
                });
              }
            } catch (e) {
              console.error(`Erro ao processar reserva ${booking.id}:`, e);
            }
          }
        }
      }

      // Remover/Desativar aluno
      console.log('Removendo aluno da base de dados...');
      if (isPicadeiro) {
        // Para PicadeiroStudent, desativar em vez de deletar para manter histórico
        await base44.entities.PicadeiroStudent.update(userId, {
          is_active: false,
          student_type: 'avulso',
          fixed_schedule: [],
          monthly_fee: 0
        });
      } else {
        // Para User, apenas remover as propriedades de aluno fixo
        await base44.entities.User.update(userId, { 
          student_type: 'avulso', 
          fixed_schedule: [], 
          monthly_fee: 0 
        });
      }
      
      console.log('=== REMOÇÃO CONCLUÍDA ===');
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
      toast.success('Aluno fixo removido! Todas as aulas futuras foram canceladas.');
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(`Erro ao remover aluno: ${error.message}`);
    }
  });



  const removeFixedStudent = (student) => {
    if (confirm('Remover aluno fixo do sistema? Todas as aulas futuras automáticas e reservas serão canceladas.')) {
      const isPicadeiro = picadeiroStudents.some(s => s.id === student.id);
      const studentEmail = student.email || student.phone || `aluno-${(student.full_name || student.name || '').toLowerCase().replace(/\s+/g, '-')}`;
      
      console.log('Removendo aluno:', student);
      console.log('Email identificador:', studentEmail);

      removeStudentMutation.mutate({
        userId: student.id,
        isPicadeiro,
        studentEmail
      });
    }
  };

  const editFixedStudent = (student) => {
    console.log('=== EDITANDO ALUNO ===');
    console.log('Student:', student);
    
    // Garantir que temos todos os dados do aluno
    const studentData = {
      ...student,
      email: student.email || student.phone || '',
      full_name: student.full_name || student.name || '',
      name: student.name || student.full_name || '',
      fixed_schedule: student.fixed_schedule || []
    };
    
    console.log('Student Data preparado:', studentData);
    console.log('Fixed schedule:', studentData.fixed_schedule);
    
    setEditingStudent(studentData);
    const isPicadeiro = picadeiroStudents.some(s => s.id === student.id);
    
    // Garantir que os schedules têm a propriedade duration
    const schedulesWithDuration = (studentData.fixed_schedule || []).map(s => ({
      ...s,
      duration: s.duration || 30
    }));
    
    setFormData({
      user_id: `${isPicadeiro ? 'picadeiro' : 'user'}-${student.id}`,
      student_level: student.student_level || 'iniciante',
      duration: schedulesWithDuration[0]?.duration || 30,
      weekly_frequency: schedulesWithDuration.length || 1,
      schedules: schedulesWithDuration
    });
    
    console.log('FormData após edição:', {
      user_id: `${isPicadeiro ? 'picadeiro' : 'user'}-${student.id}`,
      schedules: schedulesWithDuration
    });
    
    setStudentSearchQuery('');
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
                <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Registar Aluno'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {!editingStudent && (
                  <div className="space-y-2">
                    <Label>Tipo de Aluno *</Label>
                    <Select value={studentTypeMode} onValueChange={setStudentTypeMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixo">Fixo - Horário semanal fixo</SelectItem>
                        <SelectItem value="flexivel">Flexível - Horário variável (pais c/ turnos)</SelectItem>
                      </SelectContent>
                    </Select>
                    {studentTypeMode === 'flexivel' && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          ℹ️ Alunos flexíveis não têm horário fixo. Marque as aulas manualmente conforme disponibilidade.
                        </p>
                      </div>
                    )}
                  </div>
                )}
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

                {studentTypeMode === 'fixo' && (
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
                )}

                {studentTypeMode === 'fixo' && (
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
                )}

                {studentTypeMode === 'fixo' && formData.duration && formData.weekly_frequency && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">
                      Mensalidade: {monthlyFees[formData.duration][formData.weekly_frequency]}€/mês
                    </p>
                  </div>
                )}

                {studentTypeMode === 'fixo' && (
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
                              newSchedules[index] = {
                                ...newSchedules[index],
                                day: v,
                                duration: formData.duration
                              };
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
                             newSchedules[index] = {
                               ...newSchedules[index],
                               time: e.target.value,
                               duration: formData.duration
                             };
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
                )}

                <Button 
                  onClick={handleSave} 
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'A guardar...' : (studentTypeMode === 'flexivel' ? 'Guardar Aluno Flexível' : 'Guardar Aluno Fixo')}
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
                      {student.student_type === 'flexivel' ? (
                        <Badge className="bg-blue-600">Flexível</Badge>
                      ) : (
                        <Badge className="bg-[#4A5D23]">{student.student_level || 'N/A'}</Badge>
                      )}
                    </div>
                    {student.email && (
                      <p className="text-xs text-stone-500 mb-2">{student.email}</p>
                    )}
                    {student.student_type !== 'flexivel' && (
                      <p className="text-sm text-stone-600">
                        💰 Mensalidade: <strong>{student.monthly_fee}€</strong>
                      </p>
                    )}
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
                    {student.student_type !== 'flexivel' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => extendLessons(student)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Estender aulas +3 meses"
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                    )}
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