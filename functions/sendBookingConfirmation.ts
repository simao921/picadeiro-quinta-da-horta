import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingId, lessonId, clientEmail, clientName, lessonDate, lessonTime, serviceName } = await req.json();

    // Tentar buscar detalhes da aula
    let lessonData = {};
    let serviceData = {};
    
    try {
      const lessons = await base44.asServiceRole.entities.Lesson.filter({ id: lessonId });
      lessonData = lessons[0] || {};
      
      if (lessonData.service_id) {
        const services = await base44.asServiceRole.entities.Service.filter({ id: lessonData.service_id });
        serviceData = services[0] || {};
      }
    } catch (e) {
      console.log('Could not fetch lesson details, using provided data');
    }
    
    // Usar dados fornecidos se não conseguir buscar
    const date = lessonData.date || lessonDate;
    const time = lessonData.start_time || lessonTime;
    const service = serviceData.title || serviceName || 'Aula';

    // Enviar email de confirmação
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: "Picadeiro Quinta da Horta",
      to: clientEmail,
      subject: "✅ Reserva Confirmada - Picadeiro Quinta da Horta",
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                   alt="Picadeiro Quinta da Horta" 
                   style="width: 100px; height: 100px; border-radius: 50%;">
              <h1 style="color: #2C3E1F; margin-top: 15px;">Reserva Confirmada! 🎉</h1>
            </div>

            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #4A5D23; margin-top: 0;">Olá ${clientName || clientEmail},</h2>
              <p style="color: #555; line-height: 1.6;">
                A sua reserva foi confirmada com sucesso! Estamos ansiosos para recebê-lo(a).
              </p>
            </div>

            <div style="border-left: 4px solid #4A5D23; padding-left: 20px; margin: 25px 0;">
              <h3 style="color: #2C3E1F; margin-bottom: 15px;">📋 Detalhes da Aula:</h3>
              <p style="margin: 8px 0; color: #555;"><strong>Serviço:</strong> ${service}</p>
              ${date ? `<p style="margin: 8px 0; color: #555;"><strong>Data:</strong> ${new Date(date).toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>` : ''}
              ${time ? `<p style="margin: 8px 0; color: #555;"><strong>Horário:</strong> ${time}</p>` : ''}
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Importante:</strong> Por favor, chegue 15 minutos antes do horário agendado.
              </p>
            </div>

            <div style="margin: 30px 0;">
              <h3 style="color: #2C3E1F;">🎒 O que trazer:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>Roupa confortável e adequada para equitação</li>
                <li>Calçado fechado (botas ou ténis)</li>
                <li>Água e protetor solar</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Precisa de ajuda?</p>
              <p style="margin: 5px 0;">
                <a href="tel:+351932111786" style="color: #4A5D23; text-decoration: none;">📞 +351 932 111 786</a>
              </p>
              <p style="margin: 5px 0;">
                <a href="mailto:picadeiroquintadahortagf@gmail.com" style="color: #4A5D23; text-decoration: none;">✉️ picadeiroquintadahortagf@gmail.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px;">
                © ${new Date().getFullYear()} Picadeiro Quinta da Horta - Rua das Hortas 83, Alcochete
              </p>
            </div>
          </div>
        </div>
      `
    });

    return Response.json({ success: true, message: 'Email enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});