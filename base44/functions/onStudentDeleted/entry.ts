import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;
    if (event?.type !== 'delete' || !data) {
      return Response.json({ ok: true });
    }

    const student = data;
    // Use email or name as client_email identifier (same logic as importer)
    const clientId = student.email || student.name;

    if (!clientId) {
      return Response.json({ ok: true, message: 'No clientId found' });
    }

    // Find all bookings for this student
    const bookings = await base44.asServiceRole.entities.Booking.filter({ client_email: clientId });

    let deleted = 0;
    for (const booking of bookings) {
      await base44.asServiceRole.entities.Booking.delete(booking.id);
      deleted++;
    }

    console.log(`Deleted ${deleted} bookings for student: ${clientId}`);
    return Response.json({ ok: true, deleted });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});