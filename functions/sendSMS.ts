import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ error: 'Phone number and message are required' }, { status: 400 });
    }

    // Ensure phone number is in international format
    let phoneNumber = to;
    if (!phoneNumber.startsWith('+')) {
      // Assume Portuguese number if no country code
      phoneNumber = '+351' + phoneNumber.replace(/\s/g, '');
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !twilioNumber) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', twilioNumber);
    formData.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', data);
      return Response.json({ 
        error: 'Failed to send SMS', 
        details: data.message || 'Unknown error' 
      }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      messageSid: data.sid,
      status: data.status,
      to: phoneNumber
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});