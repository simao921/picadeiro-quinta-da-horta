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
  CheckCircle, XCircle, Loader2 
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
    max_spots: 4
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

  const { data: services } = useQuery({
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

  const { data: instructors } = useQuery({
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

  const createLessonMutation = useMutation({
    mutationFn: (data) => {
      if (!data.service_id) {
        toast.error('Selecione um serviço');
        throw new Error('Service required');
      }
      return base44.entities.Lesson.create({
        ...data,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status: 'scheduled',
        booked_spots: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-lessons']);
      setDialogOpen(false);
      setNewLesson({ service_id: '', instructor_id: '', start_time: '09:00', max_spots: 4 });
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
    return services.find(s => s.id === serviceId)?.title || 'Serviço não encontrado';
  };

  const getInstructorName = (instructorId) => {
    return instructors.find(i => i.id === instructorId)?.name || 'Não atribuído';
  };

  const getLessonBookings = (lessonId) => {
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
                      {services.length === 0 ? (
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
                      {instructors.length === 0 ? (
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
                    <Input
                      type="time"
                      value={newLesson.start_time}
                      onChange={(e) => setNewLesson({...newLesson, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vagas</Label>
                    <Input
                      type="number"
                      value={newLesson.max_spots}
                      onChange={(e) => setNewLesson({...newLesson, max_spots: parseInt(e.target.value)})}
                    />
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
          {/* Calendar */}
          <Card className="lg:col-span-1 border-0 shadow-md">
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
                    return (
                      <Card key={lesson.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-[#B8956A]" />
                                <span className="font-semibold">{lesson.start_time} - {lesson.end_time || '--:--'}</span>
                              </div>
                              <p className="text-stone-600">{getServiceName(lesson.service_id)}</p>
                              <p className="text-sm text-stone-500">Monitor: {getInstructorName(lesson.instructor_id)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                <Users className="w-3 h-3 mr-1" />
                                {lesson.booked_spots || 0}/{lesson.max_spots}
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