import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, CalendarDays, Clock, Users, 
  CheckCircle, XCircle, Loader2, AlertCircle, Search,
  UserCheck, UserX, Eye, EyeOff
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { toast } from 'sonner';

export default function AdminLessons() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [newLesson, setNewLesson] = useState({
    service_id: '',
    instructor_id: '',
    start_time: '09:00',
    duration: 30,
    client_email: '',
    client_name: ''
  });

  const queryClient = useQueryClient();

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['admin-lessons', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const result = await base44.entities.Lesson.filter({ date: format(selectedDate, 'yyyy-MM-dd') });
      // Ordenar por hora
      return result.sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });
    },
    initialData: []
  });

  const { data: allLessons } = useQuery({
    queryKey: ['admin-all-lessons'],
    queryFn: () => base44.entities.Lesson.list('-created_date', 1000),
    initialData: []
  });

  const { data: bookings } = useQuery({
    queryKey: ['admin-all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    initialData: []
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Service.list('-created_date', 100);
        return result || [];
      } catch (error) {
        console.error('Error loading services:', error);
        return [];
      }
    }
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Instructor.list('-created_date', 100);
        return result || [];
      } catch (error) {
        console.error('Error loading instructors:', error);
        return [];
      }
    }
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-picadeiro-students-for-booking'],
    queryFn: async () => {
      try {
        const result = await base44.entities.PicadeiroStudent.list('-created_date', 500);
        return result || [];
      } catch (error) {
        console.error('Error loading students:', error);
        return [];
      }
    }
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.service_id) {
        toast.error('Selecione um serviço');
        throw new Error('Service required');
      }
      
      const duration = data.duration || 30;
      const startTime = new Date(`2000-01-01T${data.start_time}:00`);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      // Verificar disponibilidade no horário principal (máximo 6 por meia hora)
      const existingLessonsAtTime = lessons.filter(l => l.start_time === data.start_time);
      const totalBookedAtTime = existingLessonsAtTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);
      
      if (totalBookedAtTime >= 6) {
        toast.error('Horário indisponível - máximo 6 alunos por meia hora');
        throw new Error('Time slot full');
      }
      
      // Se for 60 minutos, verificar próxima meia hora também
      if (duration === 60) {
        const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
        const slotIndex = timeSlots.indexOf(data.start_time);
        const nextSlot = timeSlots[slotIndex + 1];
        
        if (nextSlot) {
          const existingLessonsAtNextTime = lessons.filter(l => l.start_time === nextSlot);
          const totalBookedAtNextTime = existingLessonsAtNextTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);
          
          if (totalBookedAtNextTime >= 6) {
            toast.error('Horário indisponível - próxima meia hora está cheia');
            throw new Error('Next time slot full');
          }
        }
      }
      
      const lessonData = {
        service_id: data.service_id,
        instructor_id: data.instructor_id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: data.start_time,
        end_time: format(endTime, 'HH:mm'),
        max_spots: 6,
        status: 'scheduled',
        booked_spots: data.client_email ? 1 : 0
      };
      
      const lesson = await base44.entities.Lesson.create(lessonData);
      
      // Se for 60 minutos, criar/atualizar a próxima meia hora também
      if (duration === 60) {
        const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
        const slotIndex = timeSlots.indexOf(data.start_time);
        const nextSlot = timeSlots[slotIndex + 1];
        
        if (nextSlot) {
          const existingNextLesson = lessons.find(l => l.start_time === nextSlot && l.service_id === data.service_id);
          
          if (existingNextLesson) {
            // Atualizar lição existente
            await base44.entities.Lesson.update(existingNextLesson.id, {
              booked_spots: (existingNextLesson.booked_spots || 0) + 1
            });
          } else {
            // Criar nova lição para a próxima meia hora
            const nextStartTime = new Date(`2000-01-01T${nextSlot}:00`);
            const nextEndTime = new Date(nextStartTime.getTime() + 30 * 60000);
            
            await base44.entities.Lesson.create({
              service_id: data.service_id,
              instructor_id: data.instructor_id,
              date: format(selectedDate, 'yyyy-MM-dd'),
              start_time: nextSlot,
              end_time: format(nextEndTime, 'HH:mm'),
              max_spots: 6,
              status: 'scheduled',
              booked_spots: data.client_email ? 1 : 0
            });
          }
        }
      }
      
      // Se cliente selecionado, criar reserva
      if (data.client_email && data.client_name) {
        await base44.entities.Booking.create({
          lesson_id: lesson.id,
          client_email: data.client_email,
          client_name: data.client_name,
          status: 'approved',
          approved_at: new Date().toISOString()
        });
      }
      
      return lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
      setDialogOpen(false);
      setNewLesson({ service_id: '', instructor_id: '', start_time: '09:00', duration: 30, client_email: '', client_name: '' });
      toast.success('Aula criada com sucesso!');
    },
    onError: (error) => {
      if (error.message !== 'Service required') {
        toast.error('Erro ao criar aula');
      }
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status, booking }) => {
      // Obter a aula antes de atualizar a reserva
      const lesson = allLessons.find(l => l.id === booking.lesson_id);
      
      // Atualizar status da reserva
      await base44.entities.Booking.update(id, { 
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? 'admin' : null
      });

      // Recalcular contadores da aula baseado no status das reservas
      if (lesson) {
        // Buscar todas as reservas da aula para recalcular contadores
        const allBookingsForLesson = await base44.entities.Booking.filter({ lesson_id: lesson.id });
        
        // Contar apenas reservas aprovadas (não rejeitadas ou canceladas)
        const approvedBookings = allBookingsForLesson.filter(b => b.status === 'approved');
        const fixedStudentsCount = approvedBookings.filter(b => b.is_fixed_student).length;
        
        // Atualizar contadores da aula
        await base44.entities.Lesson.update(lesson.id, {
          booked_spots: approvedBookings.length,
          fixed_students_count: fixedStudentsCount
        });
        
        console.log(`Aula ${lesson.id} atualizada: ${approvedBookings.length}/6 (${fixedStudentsCount} fixos)`);
      }

      // Enviar email de confirmação
      const service = services.find(s => s.id === lesson?.service_id);
      
      if (status === 'approved') {
        await base44.integrations.Core.SendEmail({
          to: booking.client_email,
          subject: '✅ Reserva Aprovada - Picadeiro Quinta da Horta',
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 30px; text-align: center;">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                               alt="Picadeiro Quinta da Horta" 
                               style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid white; margin-bottom: 15px;">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Reserva Aprovada! ✅</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Picadeiro Quinta da Horta</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px; background-color: #f9f9f9;">
                          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Olá <strong>${booking.client_name}</strong>,
                          </p>
                          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            A sua reserva foi <strong style="color: #4CAF50;">aprovada com sucesso</strong>! 🎉
                          </p>
                          <div style="background: white; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #2C3E1F; font-size: 18px;">📅 Detalhes da Aula:</h3>
                            <p style="margin: 8px 0; color: #555;"><strong>Serviço:</strong> ${service?.title || 'Aula de Equitação'}</p>
                            <p style="margin: 8px 0; color: #555;"><strong>Data:</strong> ${format(new Date(lesson?.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            <p style="margin: 8px 0; color: #555;"><strong>Horário:</strong> ${lesson?.start_time}</p>
                            <p style="margin: 8px 0; color: #555;"><strong>Monitor:</strong> ${getInstructorName(lesson?.instructor_id)}</p>
                          </div>
                          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                            Aguardamos por si! Se tiver alguma dúvida, não hesite em contactar-nos.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #2D2D2D; padding: 30px; text-align: center;">
                          <p style="color: #B8956A; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">📞 Entre em Contacto</p>
                          <p style="color: #fff; margin: 5px 0; font-size: 14px;">
                            <a href="tel:+351932111786" style="color: #B8956A; text-decoration: none;">+351 932 111 786</a>
                          </p>
                          <p style="color: #fff; margin: 5px 0; font-size: 14px;">
                            <a href="mailto:picadeiroquintadahortagf@gmail.com" style="color: #B8956A; text-decoration: none;">picadeiroquintadahortagf@gmail.com</a>
                          </p>
                          <p style="color: rgba(255,255,255,0.6); margin: 15px 0 0 0; font-size: 12px;">
                            Rua das Hortas - Fonte da Senhora<br>
                            2890-106 Alcochete, Portugal
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        });
      } else if (status === 'rejected') {
        await base44.integrations.Core.SendEmail({
          to: booking.client_email,
          subject: 'Informação sobre a sua Reserva - Picadeiro Quinta da Horta',
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #B8956A 0%, #8B7355 100%); padding: 40px 30px; text-align: center;">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                               alt="Picadeiro Quinta da Horta" 
                               style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid white; margin-bottom: 15px;">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Informação sobre Reserva</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Picadeiro Quinta da Horta</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 30px; background-color: #f9f9f9;">
                          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Olá <strong>${booking.client_name}</strong>,
                          </p>
                          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            Infelizmente não foi possível aprovar a sua reserva para o dia <strong>${format(new Date(lesson?.date), "d 'de' MMMM", { locale: ptBR })}</strong> às <strong>${lesson?.start_time}</strong>.
                          </p>
                          <p style="color: #666; font-size: 15px; line-height: 1.6;">
                            Isto pode dever-se a limitações de disponibilidade ou capacidade. 
                          </p>
                          <p style="color: #666; font-size: 15px; line-height: 1.6; margin-top: 20px;">
                            Por favor, entre em contacto connosco para encontrarmos um horário alternativo que funcione para si.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #2D2D2D; padding: 30px; text-align: center;">
                          <p style="color: #B8956A; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">📞 Entre em Contacto</p>
                          <p style="color: #fff; margin: 5px 0; font-size: 14px;">
                            <a href="tel:+351932111786" style="color: #B8956A; text-decoration: none;">+351 932 111 786</a>
                          </p>
                          <p style="color: #fff; margin: 5px 0; font-size: 14px;">
                            <a href="mailto:picadeiroquintadahortagf@gmail.com" style="color: #B8956A; text-decoration: none;">picadeiroquintadahortagf@gmail.com</a>
                          </p>
                          <p style="color: rgba(255,255,255,0.6); margin: 15px 0 0 0; font-size: 12px;">
                            Rua das Hortas - Fonte da Senhora<br>
                            2890-106 Alcochete, Portugal
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Reserva atualizada e email enviado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar reserva:', error);
      toast.error('Erro ao atualizar reserva');
    }
  });

  const [selectedAbsentBooking, setSelectedAbsentBooking] = useState(null);
  const [showCompensableDialog, setShowCompensableDialog] = useState(false);

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ bookingId, attendance, absenceCompensable }) => {
      console.log('Marking attendance:', { bookingId, attendance, absenceCompensable });
      
      const updateData = { 
        attendance_status: attendance,
        attendance: attendance,
        attendance_marked_at: attendance ? new Date().toISOString() : null,
        attendance_marked_by: attendance ? 'admin' : null
      };
      
      if (attendance === 'present') {
        updateData.notes = (updateData.notes || '') + ' [PRESENTE]';
      } else if (attendance === 'absent') {
        updateData.notes = (updateData.notes || '') + ' [AUSENTE]';
        if (absenceCompensable !== undefined) {
          updateData.absence_compensable = absenceCompensable;
        }
      } else if (attendance === null) {
        // Limpar presença/ausência
        updateData.absence_compensable = null;
      }
      
      await base44.entities.Booking.update(bookingId, updateData);
    },
    onSuccess: () => {
      console.log('Attendance marked successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
      setShowCompensableDialog(false);
      setSelectedAbsentBooking(null);
      toast.success('Presença marcada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao marcar presença:', error);
      toast.error('Erro ao marcar presença');
    }
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  
  const getPendingBookingsWithLessons = () => {
    return pendingBookings.map(booking => {
      const lesson = allLessons.find(l => l.id === booking.lesson_id);
      return { ...booking, lesson };
    });
  };

  const getServiceName = (serviceId) => {
    if (!services || !Array.isArray(services)) return 'Serviço não encontrado';
    return services.find(s => s.id === serviceId)?.title || 'Serviço não encontrado';
  };

  const getInstructorName = (instructorId) => {
    if (!instructors || !Array.isArray(instructors)) return 'Não atribuído';
    return instructors.find(i => i.id === instructorId)?.name || 'Não atribuído';
  };

  const getLessonBookings = (lessonId) => {
    if (!bookings || !Array.isArray(bookings)) return [];
    const filtered = bookings.filter(b => b.lesson_id === lessonId);
    console.log(`Reservas para aula ${lessonId}:`, filtered);
    return filtered;
  };

  const getAttendanceStats = (lessonBookings) => {
    const approvedBookings = lessonBookings.filter(b => b.status === 'approved');
    const present = approvedBookings.filter(b => b.attendance_status === 'present' || b.attendance === 'present').length;
    const absent = approvedBookings.filter(b => b.attendance_status === 'absent' || b.attendance === 'absent').length;
    const unmarked = approvedBookings.filter(b => !b.attendance_status && !b.attendance).length;
    
    return { present, absent, unmarked, total: approvedBookings.length };
  };

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    u.phone?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const isLessonCompleted = (lesson) => {
    if (!lesson?.date || !lesson?.end_time) return false;
    const lessonDateTime = new Date(`${lesson.date}T${lesson.end_time}:00`);
    return lessonDateTime < new Date();
  };

  return (
    <AdminLayout currentPage="AdminLessons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Aulas</h1>
            <p className="text-stone-500">Gerir aulas e reservas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Aula</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Cliente em PRIMEIRO com pesquisa */}
                <div className="p-4 bg-[#4B6382]/10 rounded-lg border-2 border-[#4B6382]/30">
                  <p className="text-sm font-bold text-[#2C3E1F] mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Selecionar Cliente (opcional)
                  </p>
                  <div className="space-y-3">
                    {/* Barra de pesquisa */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Pesquisar por nome ou email..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Select do cliente */}
                    <Select 
                      value={newLesson.client_email || undefined}
                      onValueChange={(v) => {
                        const student = allUsers.find(u => (u.email && u.email === v) || (u.phone && u.phone === v));
                        setNewLesson({
                          ...newLesson, 
                          client_email: student?.email || student?.phone || v,
                          client_name: student?.name || ''
                        });
                        setClientSearch('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar aluno..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {clientSearch ? 'Nenhum aluno encontrado' : 'Sem alunos disponíveis'}
                          </SelectItem>
                        ) : (
                          filteredUsers.map(u => (
                            <SelectItem key={u.id} value={(u.email || u.phone || u.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{u.name}</span>
                                <span className="text-xs text-stone-500">{u.email || u.phone || 'Sem contacto'}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Mostrar email selecionado */}
                    {newLesson.client_email && (
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-[#4B6382]">
                        <div className="w-8 h-8 rounded-full bg-[#4B6382] text-white flex items-center justify-center font-bold">
                          {newLesson.client_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#2C3E1F]">{newLesson.client_name}</p>
                          <p className="text-xs text-stone-500">{newLesson.client_email}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setNewLesson({...newLesson, client_email: '', client_name: ''})}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Depois Serviço */}
                <div className="space-y-2">
                  <Label>Serviço *</Label>
                  <Select 
                    value={newLesson.service_id || undefined}
                    onValueChange={(v) => setNewLesson({...newLesson, service_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {!services || services.length === 0 ? (
                        <SelectItem value="none" disabled>Sem serviços disponíveis</SelectItem>
                      ) : (
                        services.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Monitor */}
                <div className="space-y-2">
                  <Label>Monitor</Label>
                  <Select 
                    value={newLesson.instructor_id || undefined}
                    onValueChange={(v) => setNewLesson({...newLesson, instructor_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar monitor (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {!instructors || instructors.length === 0 ? (
                        <SelectItem value="none" disabled>Sem monitores disponíveis</SelectItem>
                      ) : (
                        instructors.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horário e Duração */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora de Início</Label>
                    <Select
                      value={newLesson.start_time}
                      onValueChange={(v) => setNewLesson({...newLesson, start_time: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duração</Label>
                    <Select
                      value={String(newLesson.duration)}
                      onValueChange={(v) => setNewLesson({...newLesson, duration: parseInt(v)})}
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
                </div>
                <Button 
                  onClick={() => createLessonMutation.mutate(newLesson)}
                  disabled={createLessonMutation.isPending}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {createLessonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Aula
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Bookings Section */}
        {pendingBookings.length > 0 && (
          <Card className="border-amber-300 bg-amber-50/50 shadow-lg">
            <CardHeader className="bg-amber-100">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Reservas Pendentes de Aprovação
                </span>
                <Badge className="bg-amber-600 text-white">
                  {pendingBookings.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getPendingBookingsWithLessons().map((item) => (
                  <Card key={item.id} className="border-amber-200 bg-white">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-amber-500 text-white">Aguarda Aprovação</Badge>
                          </div>
                          <p className="font-semibold text-[#2C3E1F] mb-1">{item.client_name}</p>
                          <p className="text-sm text-stone-500 mb-2">{item.client_email}</p>
                          {item.lesson ? (
                            <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4 text-[#B8956A]" />
                                {format(new Date(item.lesson.date), "d 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-[#B8956A]" />
                                {item.lesson.start_time}
                              </span>
                              <span className="text-stone-500">
                                {getServiceName(item.lesson.service_id)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-400">ID da Aula: {item.lesson_id}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-[#4B6382] hover:bg-[#3B5372] text-white"
                            onClick={() => updateBookingMutation.mutate({ id: item.id, status: 'approved', booking: item })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => updateBookingMutation.mutate({ id: item.id, status: 'rejected', booking: item })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1 border-0 shadow-xl bg-gradient-to-br from-white to-stone-50 overflow-hidden animate-fadeIn">
            <CardHeader className="bg-gradient-to-br from-[#B8956A] via-[#A08859] to-[#8B7355] text-white pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Calendário
              </CardTitle>
              <p className="text-sm text-white/90 mt-1">Selecione uma data</p>
            </CardHeader>
            <CardContent className="p-5">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-md border-0 w-full"
                classNames={{
                  months: "flex flex-col space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center mb-4",
                  caption_label: "text-base font-bold text-[#2C3E1F]",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-9 w-9 bg-white hover:bg-[#B8956A] hover:text-white rounded-lg transition-all duration-200 border border-stone-200 hover:border-[#B8956A] hover:scale-105 shadow-sm hover:shadow-md",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex justify-between mb-3",
                  head_cell: "text-stone-500 rounded-md w-10 font-bold text-xs uppercase",
                  row: "flex w-full mt-2 justify-between",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#B8956A]/10 rounded-lg",
                  day: "h-10 w-10 p-0 font-semibold hover:bg-gradient-to-br hover:from-[#B8956A]/20 hover:to-[#B8956A]/30 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer relative",
                  day_selected: "bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white hover:from-[#C9A961] hover:to-[#A08859] shadow-lg scale-110 ring-2 ring-[#B8956A] ring-offset-2 font-bold",
                  day_today: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 font-bold ring-2 ring-blue-400 ring-offset-2 shadow-sm",
                  day_outside: "text-stone-300 opacity-40 hover:opacity-60",
                  day_disabled: "text-stone-200 opacity-20 hover:bg-transparent cursor-not-allowed hover:scale-100",
                  day_hidden: "invisible",
                }}
              />
              <div className="mt-5 pt-4 border-t border-stone-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md ring-2 ring-blue-400"></div>
                    <span className="text-stone-600 font-medium">Hoje</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-md ring-2 ring-[#B8956A]"></div>
                    <span className="text-stone-600 font-medium">Selecionado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons List */}
          <Card className="lg:col-span-3 border-0 shadow-xl bg-gradient-to-br from-white to-stone-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#4B6382] to-[#5B7392] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold mb-1">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </CardTitle>
                  <p className="text-white/80 text-sm">
                    {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllBookings(!showAllBookings)}
                    className="text-white hover:bg-white/20"
                  >
                    {showAllBookings ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showAllBookings ? 'Ocultar' : 'Mostrar'} Reservas
                  </Button>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-2xl font-bold">{lessons.length}</span>
                    <span className="text-sm ml-1 text-white/80">aulas</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-12 h-12 text-stone-300" />
                  </div>
                  <p className="text-stone-500 font-medium">Sem aulas agendadas para este dia</p>
                  <p className="text-sm text-stone-400 mt-1">Clique em "Nova Aula" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => {
                    const lessonBookings = getLessonBookings(lesson.id);
                    const hasPending = lessonBookings.some(b => b.status === 'pending');
                    const isFull = (lesson.booked_spots || 0) >= 6;
                    const isCompleted = isLessonCompleted(lesson);
                    const attendanceStats = getAttendanceStats(lessonBookings);
                    return (
                      <Card key={lesson.id} className={`border-l-4 shadow-md hover:shadow-lg transition-all ${
                        isCompleted ? 'border-l-green-500 bg-green-50/30' :
                        hasPending ? 'border-l-amber-500 bg-amber-50/50' : 
                        isFull ? 'border-l-red-500 bg-red-50/30' : 
                        'border-l-[#4B6382] bg-gradient-to-br from-[#4B6382]/5 to-[#4B6382]/15 hover:from-[#4B6382]/10 hover:to-[#4B6382]/20'
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white rounded-lg px-3 py-2 font-bold text-lg shadow-md">
                                  {lesson.start_time}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-[#2C3E1F] text-lg">{getServiceName(lesson.service_id)}</p>
                                  <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                                    <span>Monitor: {getInstructorName(lesson.instructor_id)}</span>
                                    <span className="text-stone-300">•</span>
                                    <span>{lesson.end_time || '--:--'}</span>
                                  </div>
                                  {attendanceStats.total > 0 && (
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="flex items-center gap-1 text-xs">
                                        <UserCheck className="w-3 h-3 text-green-600" />
                                        <span className="text-green-600 font-medium">{attendanceStats.present}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <UserX className="w-3 h-3 text-red-600" />
                                        <span className="text-red-600 font-medium">{attendanceStats.absent}</span>
                                      </div>
                                      {attendanceStats.unmarked > 0 && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <AlertCircle className="w-3 h-3 text-amber-600" />
                                          <span className="text-amber-600 font-medium">{attendanceStats.unmarked} pendente</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isCompleted && (
                                <Badge className="bg-green-600 text-white shadow-lg">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Efetuada
                                </Badge>
                              )}
                              {hasPending && !isCompleted && (
                                <Badge className="bg-amber-500 text-white animate-pulse shadow-lg">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                              <Badge className={`text-base px-4 py-2 font-bold shadow-md ${
                                isFull ? 'bg-red-500 text-white' : 
                                (lesson.booked_spots || 0) > 3 ? 'bg-amber-500 text-white' :
                                'bg-[#4B6382] text-white'
                              }`}>
                                <Users className="w-4 h-4 mr-2" />
                                {lesson.booked_spots || 0}/6
                              </Badge>
                            </div>
                          </div>

                          {lessonBookings.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-stone-200">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-[#2C3E1F] flex items-center gap-2">
                                  <Users className="w-4 h-4 text-[#B8956A]" />
                                  Reservas ({lessonBookings.length})
                                </p>
                              </div>
                              <div className="space-y-2">
                                {lessonBookings.length > 0 ? lessonBookings.map((booking) => (
                                  <div key={booking.id} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                    booking.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                                    booking.status === 'approved' ? 'bg-[#4B6382]/10 border-[#4B6382]/30' :
                                    'bg-stone-50 border-stone-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                        booking.status === 'pending' ? 'bg-amber-500' :
                                        booking.status === 'approved' ? 'bg-[#4B6382]' :
                                        booking.status === 'rejected' ? 'bg-red-500' :
                                        'bg-stone-400'
                                      }`}>
                                        {booking.client_name?.charAt(0) || '?'}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm text-[#2C3E1F]">{booking.client_name}</p>
                                        <p className="text-xs text-stone-500">{booking.client_email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {booking.status === 'pending' ? (
                                        <>
                                          <Button
                                            size="sm"
                                            className="bg-[#4B6382] hover:bg-[#3B5372] text-white shadow-md"
                                            onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'approved', booking })}
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white shadow-md"
                                            onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'rejected', booking })}
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Badge className={`font-semibold px-3 py-1 ${
                                            booking.status === 'approved' ? 'bg-[#4B6382] text-white' :
                                            booking.status === 'rejected' ? 'bg-red-500 text-white' :
                                            'bg-stone-400 text-white'
                                          }`}>
                                            {booking.status === 'approved' ? '✓ Aprovada' :
                                             booking.status === 'rejected' ? '✗ Rejeitada' : 'Cancelada'}
                                          </Badge>
                                          
                                          {booking.status === 'approved' && (
                                           <div className="flex items-center gap-1">
                                             {(() => {
                                               // Verificar se pode alterar presença (até 20:00 do mesmo dia)
                                               const lessonDate = new Date(lesson.date);
                                               const now = new Date();
                                               const cutoffTime = new Date(lessonDate);
                                               cutoffTime.setHours(20, 0, 0, 0);
                                               const canEditAttendance = now <= cutoffTime;

                                               const hasMarkedAttendance = booking.attendance_status || booking.attendance;

                                               if (hasMarkedAttendance === 'present') {
                                                 return (
                                                   <div className="flex items-center gap-1">
                                                     <Badge className="bg-green-600 text-white px-2 py-1 text-xs">
                                                       <UserCheck className="w-3 h-3 mr-1" />
                                                       Presente
                                                     </Badge>
                                                     {canEditAttendance && (
                                                       <Button
                                                         size="sm"
                                                         variant="ghost"
                                                         className="h-5 px-1 text-xs text-stone-400 hover:text-stone-600"
                                                         onClick={() => {
                                                           if (confirm('Alterar presença?')) {
                                                             markAttendanceMutation.mutate({ 
                                                               bookingId: booking.id, 
                                                               attendance: null 
                                                             });
                                                           }
                                                         }}
                                                         title="Limpar presença"
                                                       >
                                                         ✕
                                                       </Button>
                                                     )}
                                                   </div>
                                                 );
                                               } else if (hasMarkedAttendance === 'absent') {
                                                 return (
                                                   <div className="flex flex-col gap-1">
                                                     <div className="flex items-center gap-1">
                                                       <Badge className="bg-red-500 text-white px-2 py-1 text-xs">
                                                         <UserX className="w-3 h-3 mr-1" />
                                                         Ausente
                                                       </Badge>
                                                       {canEditAttendance && (
                                                         <Button
                                                           size="sm"
                                                           variant="ghost"
                                                           className="h-5 px-1 text-xs text-stone-400 hover:text-stone-600"
                                                           onClick={() => {
                                                             if (confirm('Alterar ausência?')) {
                                                               markAttendanceMutation.mutate({ 
                                                                 bookingId: booking.id, 
                                                                 attendance: null 
                                                               });
                                                             }
                                                           }}
                                                           title="Limpar ausência"
                                                         >
                                                           ✕
                                                         </Button>
                                                       )}
                                                     </div>
                                                     {booking.absence_compensable !== undefined && (
                                                       <Badge className={`px-2 py-1 text-xs ${booking.absence_compensable ? 'bg-blue-500 text-white' : 'bg-stone-500 text-white'}`}>
                                                         {booking.absence_compensable ? 'Compensável' : 'Não Compensável'}
                                                       </Badge>
                                                     )}
                                                   </div>
                                                 );
                                               } else {
                                                 return canEditAttendance ? (
                                                   <div className="flex gap-1">
                                                     <Button
                                                       size="sm"
                                                       variant="outline"
                                                       className="h-6 px-2 text-xs border-green-500 text-green-600 hover:bg-green-50"
                                                       onClick={() => markAttendanceMutation.mutate({ bookingId: booking.id, attendance: 'present' })}
                                                     >
                                                       <UserCheck className="w-3 h-3" />
                                                     </Button>
                                                     <Button
                                                       size="sm"
                                                       variant="outline"
                                                       className="h-6 px-2 text-xs border-red-500 text-red-600 hover:bg-red-50"
                                                       onClick={() => {
                                                         setSelectedAbsentBooking(booking.id);
                                                         setShowCompensableDialog(true);
                                                       }}
                                                     >
                                                       <UserX className="w-3 h-3" />
                                                     </Button>
                                                   </div>
                                                 ) : (
                                                   <Badge className="bg-stone-400 text-white px-2 py-1 text-xs">
                                                     Prazo expirado
                                                   </Badge>
                                                 );
                                               }
                                             })()}
                                           </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )) : (
                                  <p className="text-sm text-stone-500 text-center py-4">Sem reservas</p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog para escolher se ausência é compensável */}
        <Dialog open={showCompensableDialog} onOpenChange={setShowCompensableDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Marcar como Ausente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-stone-600">A ausência deste aluno é compensável?</p>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => markAttendanceMutation.mutate({ 
                    bookingId: selectedAbsentBooking, 
                    attendance: 'absent',
                    absenceCompensable: true 
                  })}
                  disabled={markAttendanceMutation.isPending}
                >
                  {markAttendanceMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sim, Compensável
                </Button>
                <Button
                  className="flex-1 bg-stone-600 hover:bg-stone-700 text-white"
                  onClick={() => markAttendanceMutation.mutate({ 
                    bookingId: selectedAbsentBooking, 
                    attendance: 'absent',
                    absenceCompensable: false 
                  })}
                  disabled={markAttendanceMutation.isPending}
                >
                  {markAttendanceMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Não Compensável
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}