import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Apenas admins podem enviar emails em massa' }, { status: 403 });
    }

    const { subject, message, recipients } = await req.json();

    if (!subject || !message || !recipients || recipients.length === 0) {
      return Response.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    // Enviar emails para cada destinatário usando Core.SendEmail
    for (const recipient of recipients) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Picadeiro Quinta da Horta',
          to: recipient,
          subject: subject,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                       alt="Picadeiro Quinta da Horta" 
                       style="width: 100px; height: 100px; border-radius: 50%;">
                </div>

                <div style="color: #555; line-height: 1.6; white-space: pre-wrap;">
                  ${message}
                </div>

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Contactos</p>
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

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ email: recipient, error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      results: {
        total: recipients.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Erro ao enviar emails em massa:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});