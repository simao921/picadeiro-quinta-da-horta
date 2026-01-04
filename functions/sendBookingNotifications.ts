import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { bookingId, action } = await req.json();

    if (!bookingId || !action) {
      return Response.json({ error: 'Booking ID and action are required' }, { status: 400 });
    }

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get lesson details
    const lessons = await base44.asServiceRole.entities.Lesson.filter({ id: booking.lesson_id });
    const lesson = lessons[0];

    if (!lesson) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Get service details
    const services = await base44.asServiceRole.entities.Service.filter({ id: lesson.service_id });
    const service = services[0];

    let subject = '';
    let message = '';

    switch (action) {
      case 'approved':
        subject = '✅ Aula Aprovada - Picadeiro Quinta da Horta';
        message = `Olá ${booking.client_name}!\n\nA sua reserva foi aprovada!\n\nDetalhes:\n📅 Data: ${lesson.date}\n⏰ Horário: ${lesson.start_time} - ${lesson.end_time}\n🏇 Serviço: ${service?.title || 'N/A'}\n\nAguardamos por si!\n\nPicadeiro Quinta da Horta\n+351 932 111 786`;
        break;

      case 'rejected':
        subject = '❌ Reserva Não Aprovada - Picadeiro Quinta da Horta';
        message = `Olá ${booking.client_name},\n\nInfelizmente não foi possível aprovar a sua reserva para o dia ${lesson.date} às ${lesson.start_time}.\n\nPor favor contacte-nos para mais informações ou para agendar outra data.\n\nPicadeiro Quinta da Horta\n+351 932 111 786`;
        break;

      case 'cancelled':
        subject = '🚫 Aula Cancelada - Picadeiro Quinta da Horta';
        message = `Olá ${booking.client_name},\n\nA aula do dia ${lesson.date} às ${lesson.start_time} foi cancelada.\n\nPor favor contacte-nos para reagendar.\n\nPicadeiro Quinta da Horta\n+351 932 111 786`;
        break;

      case 'reminder':
        subject = '⏰ Lembrete de Aula - Picadeiro Quinta da Horta';
        message = `Olá ${booking.client_name}!\n\nLembrete: Tem uma aula amanhã!\n\n📅 Data: ${lesson.date}\n⏰ Horário: ${lesson.start_time} - ${lesson.end_time}\n🏇 Serviço: ${service?.title || 'N/A'}\n\nAté amanhã!\n\nPicadeiro Quinta da Horta\n+351 932 111 786`;
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Send notification using the unified notification system
    const result = await base44.asServiceRole.functions.invoke('sendNotification', {
      userEmail: booking.client_email,
      subject,
      message,
      type: 'booking'
    });

    return Response.json(result.data);

  } catch (error) {
    console.error('Error sending booking notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});