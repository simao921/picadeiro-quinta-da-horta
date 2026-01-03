import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { booking_id, rating, comment, client_email } = await req.json();

    if (!booking_id || !rating) {
      return Response.json({ error: 'Dados obrigatórios em falta' }, { status: 400 });
    }

    // Buscar detalhes da reserva e aula
    const booking = await base44.entities.Booking.filter({ id: booking_id });
    const bookingData = booking[0];

    if (!bookingData) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    const lessons = await base44.entities.Lesson.filter({ id: bookingData.lesson_id });
    const lesson = lessons[0];

    const services = await base44.entities.Service.filter({ id: lesson?.service_id });
    const service = services[0];

    // Criar review
    await base44.entities.Review.create({
      entity_type: 'service',
      entity_id: service?.id || 'unknown',
      rating: rating,
      comment: comment || '',
      title: `Feedback - ${service?.title || 'Aula'}`,
      client_name: user.full_name,
      client_email: client_email,
      is_verified: true,
      is_approved: true
    });

    // Usar IA para analisar o feedback e gerar insights
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analisa este feedback de um cliente após uma aula de equitação:
      
Classificação: ${rating}/5 estrelas
Comentário: ${comment || 'Sem comentário'}
Serviço: ${service?.title || 'Aula de Equitação'}

Fornece:
1. sentiment: "positive", "neutral" ou "negative"
2. key_points: array com 2-3 pontos-chave mencionados (ou inferidos se não houver comentário)
3. action_required: boolean - se requer ação imediata da equipa
4. suggestion: uma sugestão específica para melhorar com base neste feedback`,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          action_required: { type: "boolean" },
          suggestion: { type: "string" }
        }
      }
    });

    // Se feedback negativo, notificar admins
    if (rating <= 2 || analysis.action_required) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      
      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: '⚠️ Feedback Negativo Recebido',
          body: `
            <h2>Alerta: Feedback que requer atenção</h2>
            <p><strong>Cliente:</strong> ${user.full_name}</p>
            <p><strong>Serviço:</strong> ${service?.title}</p>
            <p><strong>Classificação:</strong> ${rating}/5 ⭐</p>
            <p><strong>Comentário:</strong> ${comment || 'Sem comentário'}</p>
            
            <h3>Análise da IA:</h3>
            <p><strong>Sentimento:</strong> ${analysis.sentiment}</p>
            <p><strong>Pontos-chave:</strong></p>
            <ul>
              ${analysis.key_points.map(p => `<li>${p}</li>`).join('')}
            </ul>
            <p><strong>Sugestão:</strong> ${analysis.suggestion}</p>
            
            <p>Por favor, contacte o cliente para resolver a situação.</p>
          `
        });
      }
    }

    // Enviar email de agradecimento ao cliente
    await base44.integrations.Core.SendEmail({
      to: client_email,
      subject: 'Obrigado pelo seu feedback! 🙏',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4A5D23;">Obrigado pelo seu feedback!</h2>
          
          <p>Caro(a) ${user.full_name},</p>
          
          <p>Agradecemos imenso por ter partilhado a sua experiência connosco. O seu feedback é essencial para melhorarmos continuamente os nossos serviços.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>A sua avaliação:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
            ${comment ? `<p><strong>Comentário:</strong> ${comment}</p>` : ''}
          </div>
          
          <p>Esperamos vê-lo(a) em breve no Picadeiro Quinta da Horta!</p>
          
          <p style="margin-top: 30px;">Com os melhores cumprimentos,<br/>
          <strong>Equipa Picadeiro Quinta da Horta</strong></p>
        </div>
      `
    });

    return Response.json({ 
      success: true, 
      message: 'Feedback enviado com sucesso',
      analysis 
    });

  } catch (error) {
    console.error('Erro ao processar feedback:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});