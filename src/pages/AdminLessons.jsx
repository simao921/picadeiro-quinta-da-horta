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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, CalendarDays, Clock, Users, 
  CheckCircle, XCircle, Loader2, AlertCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminLessons() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
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
    queryFn: () => base44.entities.Lesson.filter({ date: format(selectedDate, 'yyyy-MM-dd') }),
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
    queryKey: ['all-users-for-booking'],
    queryFn: async () => {
      try {
        const result = await base44.entities.User.list('-created_date', 500);
        return result || [];
      } catch (error) {
        console.error('Error loading users:', error);
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
      queryClient.invalidateQueries(['admin-lessons']);
      queryClient.invalidateQueries(['admin-all-bookings']);
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
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { 
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-all-bookings']);
      toast.success('Reserva atualizada!');
    }
  });

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
    return bookings.filter(b => b.lesson_id === lessonId);
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Aula</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-3">Reservar para cliente (opcional)</p>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select 
                      value={newLesson.client_email || undefined}
                      onValueChange={(v) => {
                        const user = allUsers.find(u => u.email === v);
                        setNewLesson({
                          ...newLesson, 
                          client_email: v,
                          client_name: user?.full_name || user?.email || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.length === 0 ? (
                          <SelectItem value="none" disabled>Sem clientes disponíveis</SelectItem>
                        ) : (
                          allUsers.map(u => (
                            <SelectItem key={u.id} value={u.email}>
                              {u.full_name || u.email}
                            </SelectItem>
                          ))
                        )}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar + Pending Stats */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#B8956A]" />
                  Calendário
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={pt}
                  className="rounded-md border-0 w-full"
                />
              </CardContent>
            </Card>

            {/* Pending Bookings Alert */}
            {bookings.filter(b => b.status === 'pending').length > 0 && (
              <Card className="border-amber-200 bg-amber-50 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">
                        {bookings.filter(b => b.status === 'pending').length} Reserva{bookings.filter(b => b.status === 'pending').length > 1 ? 's' : ''} Pendente{bookings.filter(b => b.status === 'pending').length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-xs text-amber-700">
                        Clique nas aulas abaixo para aprovar ou rejeitar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lessons List */}
          <Card className="lg:col-span-3 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                Aulas de {format(selectedDate, "d 'de' MMMM", { locale: pt })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CalendarDays className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                  <p>Sem aulas agendadas para este dia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => {
                    const lessonBookings = getLessonBookings(lesson.id);
                    const hasPending = lessonBookings.some(b => b.status === 'pending');
                    return (
                      <Card key={lesson.id} className={`border ${hasPending ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-[#B8956A]" />
                                <span className="font-semibold">{lesson.start_time} - {lesson.end_time || '--:--'}</span>
                                {hasPending && (
                                  <Badge className="bg-amber-500 text-white animate-pulse">
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-stone-600">{getServiceName(lesson.service_id)}</p>
                              <p className="text-sm text-stone-500">Monitor: {getInstructorName(lesson.instructor_id)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${(lesson.booked_spots || 0) >= 6 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                <Users className="w-3 h-3 mr-1" />
                                {lesson.booked_spots || 0}/6
                              </Badge>
                            </div>
                          </div>

                          {lessonBookings.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Reservas:</p>
                              <div className="space-y-2">
                                {lessonBookings.map((booking) => (
                                  <div key={booking.id} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                                    <div>
                                      <p className="font-medium text-sm">{booking.client_name}</p>
                                      <p className="text-xs text-stone-500">{booking.client_email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {booking.status === 'pending' ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                            onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'approved' })}
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                            onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'rejected' })}
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <Badge className={
                                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-stone-100 text-stone-800'
                                        }>
                                          {booking.status === 'approved' ? 'Aprovada' :
                                           booking.status === 'rejected' ? 'Rejeitada' : 'Cancelada'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
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
      </div>
    </AdminLayout>
  );
}