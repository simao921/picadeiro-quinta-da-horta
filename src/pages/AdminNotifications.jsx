import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

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
      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: subject,
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
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Picadeiro Quinta da Horta</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px; letter-spacing: 2px;">CENTRO EQUESTRE</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; background-color: #f9f9f9;">
                        <div style="color: #333; line-height: 1.8; font-size: 16px;">
                          ${message.replace(/\n/g, '<br>')}
                        </div>
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
        return { success: true };
      } catch (error) {
        console.error('Email error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('✅ Email enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Notification error:', error);
      toast.error(`❌ Erro ao enviar: ${error.message || 'Erro desconhecido'}`);
    }
  });

  const handleApprovalNotification = (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);
    const service = services.find(s => s.id === lesson?.service_id);

    sendNotification.mutate({
      email: booking.client_email,
      subject: '✅ Aula Aprovada - Picadeiro Quinta da Horta',
      message: `Olá ${booking.client_name}!\n\nA sua reserva foi aprovada!\n\nDetalhes:\n📅 Data: ${lesson?.date}\n⏰ Horário: ${lesson?.start_time} - ${lesson?.end_time}\n🏇 Serviço: ${service?.title || 'N/A'}\n\nAguardamos por si!\n\nPicadeiro Quinta da Horta\n+351 932 111 786`
    });
  };

  const handleRejectionNotification = (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);

    sendNotification.mutate({
      email: booking.client_email,
      subject: '❌ Reserva Não Aprovada - Picadeiro Quinta da Horta',
      message: `Olá ${booking.client_name},\n\nInfelizmente não foi possível aprovar a sua reserva para o dia ${lesson?.date} às ${lesson?.start_time}.\n\nPor favor contacte-nos para mais informações ou para agendar outra data.\n\nPicadeiro Quinta da Horta\n+351 932 111 786`
    });
  };

  const handleReminderNotification = (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);
    const service = services.find(s => s.id === lesson?.service_id);

    sendNotification.mutate({
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
                        onClick={() => handleReminderNotification(booking)}
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
                            await base44.entities.Booking.update(booking.id, { 
                              status: 'approved',
                              approved_at: new Date().toISOString(),
                              approved_by: 'admin'
                            });
                            
                            // Recalcular contadores da aula
                            const lesson = lessons.find(l => l.id === booking.lesson_id);
                            if (lesson) {
                              const allBookingsForLesson = await base44.entities.Booking.filter({ lesson_id: lesson.id });
                              const approvedBookings = allBookingsForLesson.filter(b => b.status === 'approved');
                              const fixedStudentsCount = approvedBookings.filter(b => b.is_fixed_student).length;
                              
                              await base44.entities.Lesson.update(lesson.id, {
                                booked_spots: approvedBookings.length,
                                fixed_students_count: fixedStudentsCount
                              });
                            }
                            
                            handleApprovalNotification(booking);
                            queryClient.invalidateQueries({ queryKey: ['bookings-notifications'] });
                            queryClient.invalidateQueries({ queryKey: ['lessons-notifications'] });
                            queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
                            queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
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
                            
                            // Recalcular contadores da aula
                            const lesson = lessons.find(l => l.id === booking.lesson_id);
                            if (lesson) {
                              const allBookingsForLesson = await base44.entities.Booking.filter({ lesson_id: lesson.id });
                              const approvedBookings = allBookingsForLesson.filter(b => b.status === 'approved');
                              const fixedStudentsCount = approvedBookings.filter(b => b.is_fixed_student).length;
                              
                              await base44.entities.Lesson.update(lesson.id, {
                                booked_spots: approvedBookings.length,
                                fixed_students_count: fixedStudentsCount
                              });
                            }
                            
                            handleRejectionNotification(booking);
                            queryClient.invalidateQueries({ queryKey: ['bookings-notifications'] });
                            queryClient.invalidateQueries({ queryKey: ['lessons-notifications'] });
                            queryClient.invalidateQueries({ queryKey: ['admin-lessons'] });
                            queryClient.invalidateQueries({ queryKey: ['admin-all-lessons'] });
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