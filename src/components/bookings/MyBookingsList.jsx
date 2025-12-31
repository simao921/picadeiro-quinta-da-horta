import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarDays, CheckCircle, XCircle, Clock, MapPin 
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MyBookingsList({ user }) {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: lessons } = useQuery({
    queryKey: ['all-lessons'],
    queryFn: () => base44.entities.Lesson.list(),
    initialData: []
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ bookingId, attendance }) => 
      base44.entities.Booking.update(bookingId, { attendance }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-bookings']);
      toast.success('Presença atualizada!');
    }
  });

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendente', class: 'bg-amber-100 text-amber-800', icon: Clock },
      approved: { label: 'Aprovada', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejeitada', class: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'Cancelada', class: 'bg-stone-100 text-stone-800', icon: XCircle }
    };
    const { label, class: className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getLessonInfo = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    const service = lesson ? services.find(s => s.id === lesson.service_id) : null;
    return { lesson, service };
  };

  const upcomingBookings = bookings.filter(b => {
    const { lesson } = getLessonInfo(b.lesson_id);
    return lesson && new Date(lesson.date) >= new Date();
  });

  const pastBookings = bookings.filter(b => {
    const { lesson } = getLessonInfo(b.lesson_id);
    return lesson && new Date(lesson.date) < new Date();
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">
          Ainda não tem reservas
        </h3>
        <p className="text-stone-500 mb-6">
          Comece a reservar as suas aulas na aba "Nova Reserva"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg text-[#2C3E1F] mb-4">Próximas Aulas</h3>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const { lesson, service } = getLessonInfo(booking.lesson_id);
              if (!lesson) return null;

              return (
                <Card key={booking.id} className="border-l-4 border-l-[#B8956A]">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(booking.status)}
                          {booking.attendance && (
                            <Badge variant="outline" className={
                              booking.attendance === 'confirmed' ? 'border-green-500 text-green-700' :
                              booking.attendance === 'absent' ? 'border-red-500 text-red-700' :
                              'border-stone-400 text-stone-600'
                            }>
                              {booking.attendance === 'confirmed' ? 'Presença Confirmada' :
                               booking.attendance === 'absent' ? 'Ausência Marcada' :
                               'Presença Pendente'}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-xl text-[#2C3E1F] mb-2">
                          {service?.title || 'Serviço não disponível'}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-sm text-stone-600">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4" />
                            {format(new Date(lesson.date), "EEEE, d 'de' MMMM", { locale: pt })}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {lesson.start_time} - {lesson.end_time || '--:--'}
                          </span>
                        </div>
                      </div>

                      {booking.status === 'approved' && booking.attendance === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => updateAttendanceMutation.mutate({
                              bookingId: booking.id,
                              attendance: 'confirmed'
                            })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Vou Estar Presente
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => updateAttendanceMutation.mutate({
                              bookingId: booking.id,
                              attendance: 'absent'
                            })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Não Vou
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg text-[#2C3E1F] mb-4">Histórico</h3>
          <div className="space-y-3">
            {pastBookings.map((booking) => {
              const { lesson, service } = getLessonInfo(booking.lesson_id);
              if (!lesson) return null;

              return (
                <Card key={booking.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#2C3E1F]">{service?.title}</p>
                        <p className="text-sm text-stone-500">
                          {format(new Date(lesson.date), "d 'de' MMMM", { locale: pt })} às {lesson.start_time}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}