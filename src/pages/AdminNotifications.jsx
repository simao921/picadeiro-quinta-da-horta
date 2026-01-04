import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';

export default function AdminNotifications() {
  const queryClient = useQueryClient();

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons-notifications'],
    queryFn: () => base44.entities.Lesson.list('-date', 100)
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-notifications'],
    queryFn: () => base44.entities.Booking.list('-created_date', 200)
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-notifications'],
    queryFn: () => base44.entities.Service.list()
  });

  const sendNotification = useMutation({
    mutationFn: async ({ email, subject, message }) => {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: subject,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #B8956A 0%, #8B7355 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Picadeiro Quinta da Horta</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <p style="color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="background-color: #2D2D2D; padding: 20px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Picadeiro Quinta da Horta - Alcochete<br>
                +351 932 111 786 | picadeiroquintadahortagf@gmail.com
              </p>
            </div>
          </div>
        `
      });
    },
    onSuccess: () => {
      toast.success('Notificação enviada!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const sendApprovalNotification = async (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);
    const service = services.find(s => s.id === lesson?.service_id);

    await sendNotification.mutateAsync({
      email: booking.client_email,
      subject: '✅ Aula Aprovada - Picadeiro Quinta da Horta',
      message: `Olá ${booking.client_name}!\n\nA sua reserva foi aprovada!\n\nDetalhes:\n📅 Data: ${lesson?.date}\n⏰ Horário: ${lesson?.start_time} - ${lesson?.end_time}\n🏇 Serviço: ${service?.title || 'N/A'}\n\nAguardamos por si!\n\nPicadeiro Quinta da Horta\n+351 932 111 786`
    });
  };

  const sendRejectionNotification = async (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);

    await sendNotification.mutateAsync({
      email: booking.client_email,
      subject: '❌ Reserva Não Aprovada - Picadeiro Quinta da Horta',
      message: `Olá ${booking.client_name},\n\nInfelizmente não foi possível aprovar a sua reserva para o dia ${lesson?.date} às ${lesson?.start_time}.\n\nPor favor contacte-nos para mais informações ou para agendar outra data.\n\nPicadeiro Quinta da Horta\n+351 932 111 786`
    });
  };

  const sendReminderNotification = async (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);
    const service = services.find(s => s.id === lesson?.service_id);

    await sendNotification.mutateAsync({
      email: booking.client_email,
      subject: '⏰ Lembrete de Aula - Picadeiro Quinta da Horta',
      message: `Olá ${booking.client_name}!\n\nLembrete: Tem uma aula amanhã!\n\n📅 Data: ${lesson?.date}\n⏰ Horário: ${lesson?.start_time} - ${lesson?.end_time}\n🏇 Serviço: ${service?.title || 'N/A'}\n\nAté amanhã!\n\nPicadeiro Quinta da Horta\n+351 932 111 786`
    });
  };

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const upcomingBookings = bookings.filter(b => {
    const lesson = lessons.find(l => l.id === b.lesson_id);
    return lesson?.date === tomorrow && b.status === 'approved';
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <AdminLayout currentPage="AdminNotifications">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Notificações Automáticas</h1>
            <p className="text-stone-600 mt-1">Gerir notificações por email para clientes</p>
          </div>
          <Bell className="w-8 h-8 text-[#4A5D23]" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aulas Amanhã</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{upcomingBookings.length}</div>
              <p className="text-xs text-stone-600">reservas confirmadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingBookings.length}</div>
              <p className="text-xs text-stone-600">aguardam aprovação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{bookings.length}</div>
              <p className="text-xs text-stone-600">reservas registadas</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lembretes de Aulas - Amanhã ({tomorrow})</CardTitle>
            <CardDescription>Envie lembretes para alunos com aulas marcadas</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-center text-stone-600 py-8">Sem aulas agendadas para amanhã</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const lesson = lessons.find(l => l.id === booking.lesson_id);
                  const service = services.find(s => s.id === lesson?.service_id);

                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#4A5D23]" />
                        <div>
                          <p className="font-semibold">{booking.client_name}</p>
                          <p className="text-sm text-stone-600">
                            {service?.title} - {lesson?.start_time} às {lesson?.end_time}
                          </p>
                          <p className="text-xs text-stone-500">{booking.client_email}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => sendReminderNotification(booking)}
                        disabled={sendNotification.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Lembrete
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reservas Pendentes</CardTitle>
            <CardDescription>Aprove ou rejeite reservas e envie notificações</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-center text-stone-600 py-8">Sem reservas pendentes</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 10).map((booking) => {
                  const lesson = lessons.find(l => l.id === booking.lesson_id);
                  const service = services.find(s => s.id === lesson?.service_id);

                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-semibold">{booking.client_name}</p>
                          <p className="text-sm text-stone-600">
                            {service?.title} - {lesson?.date} às {lesson?.start_time}
                          </p>
                          <p className="text-xs text-stone-500">{booking.client_email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={async () => {
                            await base44.entities.Booking.update(booking.id, { status: 'approved' });
                            await sendApprovalNotification(booking);
                            queryClient.invalidateQueries({ queryKey: ['bookings-notifications'] });
                          }}
                          disabled={sendNotification.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={async () => {
                            await base44.entities.Booking.update(booking.id, { status: 'rejected' });
                            await sendRejectionNotification(booking);
                            queryClient.invalidateQueries({ queryKey: ['bookings-notifications'] });
                          }}
                          disabled={sendNotification.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}