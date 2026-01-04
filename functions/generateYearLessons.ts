import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { studentId, isPicadeiro } = await req.json();

    if (!studentId) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Buscar dados do aluno
    let student;
    if (isPicadeiro) {
      const students = await base44.asServiceRole.entities.PicadeiroStudent.filter({ id: studentId });
      if (students.length === 0) {
        return Response.json({ error: 'Student not found' }, { status: 404 });
      }
      student = students[0];
      student.full_name = student.name;
    } else {
      const users = await base44.asServiceRole.entities.User.filter({ id: studentId });
      if (users.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      student = users[0];
    }

    if (!student.fixed_schedule || student.fixed_schedule.length === 0) {
      return Response.json({ error: 'Student has no fixed schedule' }, { status: 400 });
    }

    // Buscar serviço - tentar encontrar qualquer serviço relacionado
    const services = await base44.asServiceRole.entities.Service.list();
    console.log('Serviços disponíveis:', services.map(s => ({ id: s.id, title: s.title })));
    
    const service = services.find(s => 
      s.title?.toLowerCase().includes('aula') || 
      s.title?.toLowerCase().includes('escola') ||
      s.title?.toLowerCase().includes('equitação')
    ) || services[0];

    if (!service) {
      return Response.json({ 
        error: 'No service available', 
        total_services: services.length 
      }, { status: 404 });
    }
    
    console.log('Serviço selecionado:', service.title);

    const today = new Date();
    const daysMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
    
    let created = 0;
    let updated = 0;
    
    // Criar aulas para as próximas 52 semanas (1 ano)
    for (let week = 0; week < 52; week++) {
      for (const schedule of student.fixed_schedule) {
        const targetDay = daysMap[schedule.day];
        const currentDay = today.getDay();
        
        // Calcular próxima ocorrência do dia da semana
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;
        if (daysUntilTarget === 0 && week === 0) daysUntilTarget = 7;
        
        const lessonDate = new Date(today);
        lessonDate.setDate(today.getDate() + daysUntilTarget + (week * 7));
        
        const year = lessonDate.getFullYear();
        const month = String(lessonDate.getMonth() + 1).padStart(2, '0');
        const day = String(lessonDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        try {
          // Verificar se já existe aula neste horário
          const existingLessons = await base44.asServiceRole.entities.Lesson.filter({ 
            date: dateStr,
            start_time: schedule.time,
            service_id: service.id
          });

          let lesson;
          if (existingLessons.length === 0) {
            // Criar nova aula
            const [hours, minutes] = schedule.time.split(':');
            const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            endTime.setMinutes(endTime.getMinutes() + (schedule.duration || 30));
            
            lesson = await base44.asServiceRole.entities.Lesson.create({
              service_id: service.id,
              date: dateStr,
              start_time: schedule.time,
              end_time: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
              max_spots: 6,
              booked_spots: 1,
              fixed_students_count: 1,
              is_auto_generated: true
            });
            created++;
          } else {
            lesson = existingLessons[0];
          }

          // Verificar se já existe reserva do aluno
          const existingBookings = await base44.asServiceRole.entities.Booking.filter({
            lesson_id: lesson.id,
            client_email: student.email
          });

          if (existingBookings.length === 0) {
            // Criar reserva automática
            await base44.asServiceRole.entities.Booking.create({
              lesson_id: lesson.id,
              client_email: student.email,
              client_name: student.full_name,
              status: 'approved',
              is_fixed_student: true
            });

            // Atualizar contadores se a aula já existia
            if (existingLessons.length > 0) {
              await base44.asServiceRole.entities.Lesson.update(lesson.id, {
                booked_spots: (lesson.booked_spots || 0) + 1,
                fixed_students_count: (lesson.fixed_students_count || 0) + 1
              });
              updated++;
            }
          }
        } catch (e) {
          console.error('Error creating lesson:', e);
        }
      }
    }

    return Response.json({ 
      success: true, 
      created,
      updated,
      message: `Criadas ${created} novas aulas e atualizadas ${updated} aulas existentes para o próximo ano`
    });

  } catch (error) {
    console.error('Error generating lessons:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});