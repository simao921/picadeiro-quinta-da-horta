import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail, subject, message, type = 'general' } = await req.json();

    if (!userEmail || !message) {
      return Response.json({ error: 'User email and message are required' }, { status: 400 });
    }

    // Get user preferences
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    const targetUser = users[0];

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = targetUser.notification_preferences || { sms_enabled: false, email_enabled: true };
    const results = { email: null, sms: null };

    // Send Email if enabled
    if (preferences.email_enabled) {
      try {
        const emailResult = await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: subject || 'Notificação - Picadeiro Quinta da Horta',
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
                  +351 932 111 786
                </p>
              </div>
            </div>
          `
        });
        results.email = { success: true, result: emailResult };
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Send SMS if enabled and phone available
    if (preferences.sms_enabled && targetUser.phone) {
      try {
        const smsResult = await base44.asServiceRole.functions.invoke('sendSMS', {
          to: targetUser.phone,
          message: message
        });
        results.sms = { success: true, result: smsResult.data };
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    return Response.json({ 
      success: true, 
      results,
      sentVia: {
        email: preferences.email_enabled,
        sms: preferences.sms_enabled && !!targetUser.phone
      }
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});