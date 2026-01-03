import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Apenas admins' }, { status: 403 });
    }

    const { type, target_emails } = await req.json();

    let notifications = [];

    // 1. Notificações de aulas próximas (próximas 48h)
    if (type === 'upcoming_lessons' || type === 'all') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const upcomingLessons = await base44.asServiceRole.entities.Lesson.filter({ 
        date: tomorrowStr,
        status: 'scheduled'
      });

      for (const lesson of upcomingLessons) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ 
          lesson_id: lesson.id,
          status: 'approved'
        });

        const services = await base44.asServiceRole.entities.Service.filter({ id: lesson.service_id });
        const service = services[0];

        for (const booking of bookings) {
          if (target_emails && !target_emails.includes(booking.client_email)) continue;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.client_email,
            subject: '🐴 Lembrete: Aula amanhã!',
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4A5D23;">A sua aula está quase a começar!</h2>
                
                <p>Olá ${booking.client_name}!</p>
                
                <p>Este é um lembrete amigável de que tem uma aula marcada:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>📅 Data:</strong> ${new Date(lesson.date).toLocaleDateString('pt-PT')}</p>
                  <p><strong>⏰ Horário:</strong> ${lesson.start_time}</p>
                  <p><strong>🎯 Serviço:</strong> ${service?.title}</p>
                </div>
                
                <p><strong>Dicas para a aula:</strong></p>
                <ul>
                  <li>Chegue 10 minutos mais cedo</li>
                  <li>Use roupa confortável e calçado adequado</li>
                  <li>Traga água</li>
                </ul>
                
                <p>Estamos ansiosos para vê-lo(a)!</p>
                
                <p>Equipa Picadeiro Quinta da Horta 🐴</p>
              </div>
            `
          });

          notifications.push({ type: 'upcoming_lesson', email: booking.client_email });
        }
      }
    }

    // 2. Promoções personalizadas baseadas em histórico
    if (type === 'promotions' || type === 'all') {
      const allUsers = await base44.asServiceRole.entities.User.list();
      
      for (const targetUser of allUsers) {
        if (target_emails && !target_emails.includes(targetUser.email)) continue;

        const userBookings = await base44.asServiceRole.entities.Booking.filter({ 
          client_email: targetUser.email 
        });

        // Usar IA para personalizar a mensagem
        const personalizedMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Cria uma mensagem de promoção personalizada para um cliente de um centro equestre.

Cliente: ${targetUser.full_name}
Número de aulas frequentadas: ${userBookings.length}

Oferece uma promoção relevante baseada no perfil:
- Se tem mais de 10 aulas: Cliente fiel - oferecer pacote premium com desconto
- Se tem 5-10 aulas: Cliente regular - oferecer aula extra gratuita
- Se tem menos de 5 aulas: Cliente novo - oferecer desconto na próxima aula

Escreve um email curto, amigável e personalizado em português. Inclui:
1. Saudação personalizada
2. Reconhecimento do seu percurso
3. Oferta específica
4. Call to action

Responde apenas com o corpo do email em HTML simples.`
        });

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: '🎁 Oferta Especial Para Si!',
          body: personalizedMessage
        });

        notifications.push({ type: 'promotion', email: targetUser.email });
      }
    }

    // 3. Feedback solicitado após aulas concluídas
    if (type === 'feedback_requests' || type === 'all') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const completedLessons = await base44.asServiceRole.entities.Lesson.filter({ 
        date: yesterdayStr,
        status: 'completed'
      });

      for (const lesson of completedLessons) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ 
          lesson_id: lesson.id,
          status: 'approved'
        });

        for (const booking of bookings) {
          if (target_emails && !target_emails.includes(booking.client_email)) continue;

          // Verificar se já deixou feedback
          const existingReviews = await base44.asServiceRole.entities.Review.filter({
            client_email: booking.client_email
          });

          const alreadyReviewed = existingReviews.some(r => 
            r.entity_id === lesson.service_id && 
            new Date(r.created_date).toDateString() === new Date().toDateString()
          );

          if (!alreadyReviewed) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              subject: '💭 Como foi a sua aula?',
              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #4A5D23;">A sua opinião é importante!</h2>
                  
                  <p>Olá ${booking.client_name}!</p>
                  
                  <p>Esperamos que tenha gostado da sua aula de ontem.</p>
                  
                  <p>Gostaríamos muito de saber a sua opinião para continuarmos a melhorar:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://picadeiroquintadahorta.com" 
                       style="background-color: #4A5D23; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 8px; display: inline-block;">
                      Deixar Feedback
                    </a>
                  </div>
                  
                  <p>Leva apenas 1 minuto! 🙏</p>
                  
                  <p>Obrigado,<br/>Equipa Picadeiro Quinta da Horta</p>
                </div>
              `
            });

            notifications.push({ type: 'feedback_request', email: booking.client_email });
          }
        }
      }
    }

    return Response.json({ 
      success: true, 
      notifications_sent: notifications.length,
      details: notifications
    });

  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});