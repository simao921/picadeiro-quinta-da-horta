import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const studentsData = [
  { name: "Ana Cavaleiro", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Clarinha", schedules: [{day: "wednesday", time: "16:00"}] },
  { name: "Adriana Barreto", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Alicia Paquinha", schedules: [{day: "thursday", time: "16:30"}] },
  { name: "Alice Nunes", schedules: [{day: "thursday", time: "18:00"}] },
  { name: "Azevedo Patrícia", schedules: [{day: "wednesday", time: "19:00"}, {day: "friday", time: "19:00"}] },
  { name: "Ana Patrício Duarte", schedules: [{day: "tuesday", time: "17:30"}] },
  { name: "Ana Rita Neves", schedules: [{day: "tuesday", time: "18:30"}, {day: "friday", time: "16:30"}] },
  { name: "Anastasia Kampurska", schedules: [{day: "thursday", time: "18:00"}] },
  { name: "André Duarte", schedules: [{day: "tuesday", time: "18:30"}, {day: "thursday", time: "18:30"}] },
  { name: "Bárbara Mendonça", schedules: [{day: "thursday", time: "17:30"}] },
  { name: "Beatriz Pereira", schedules: [{day: "wednesday", time: "15:00"}, {day: "friday", time: "18:30"}] },
  { name: "Bernardo Maia", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Bianca Lima", schedules: [{day: "saturday", time: "14:30"}] },
  { name: "Carlota Peralta", schedules: [{day: "wednesday", time: "17:00"}, {day: "thursday", time: "16:30"}] },
  { name: "Carlota Guedes", schedules: [{day: "tuesday", time: "16:30"}, {day: "thursday", time: "16:30"}] },
  { name: "Carlota Quartiero", schedules: [{day: "wednesday", time: "19:00"}] },
  { name: "Carlota Matias", schedules: [{day: "friday", time: "19:00"}] },
  { name: "Carmem Maia", schedules: [{day: "tuesday", time: "18:30"}, {day: "saturday", time: "15:00"}] },
  { name: "Catarina Félix", schedules: [{day: "wednesday", time: "17:00"}, {day: "saturday", time: "16:00"}] },
  { name: "Cláudia Albuquerque", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Diogo Brito", schedules: [{day: "thursday", time: "19:00"}] },
  { name: "Diogo Marta Oliveira", schedules: [{day: "saturday", time: "17:00"}] },
  { name: "Constança Ferreira", schedules: [{day: "thursday", time: "16:30"}] },
  { name: "Diana Félix", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Duarte Melissa", schedules: [{day: "saturday", time: "17:30"}] },
  { name: "Edgar Lopes", schedules: [{day: "tuesday", time: "15:00"}] },
  { name: "Francisca Dias", schedules: [{day: "wednesday", time: "17:30"}, {day: "thursday", time: "16:30"}] },
  { name: "Francisca Pratas", schedules: [{day: "thursday", time: "17:30"}] },
  { name: "Francisco Patrocínio", schedules: [{day: "wednesday", time: "18:30"}, {day: "friday", time: "17:30"}] },
  { name: "Helena Carniel", schedules: [{day: "saturday", time: "16:00"}] },
  { name: "Henrique Santos", schedules: [{day: "wednesday", time: "17:30"}] },
  { name: "Hugo Ferreira", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Inês Andreia", schedules: [{day: "wednesday", time: "18:30"}, {day: "friday", time: "17:00"}] },
  { name: "Inês Duval", schedules: [{day: "wednesday", time: "19:00"}, {day: "saturday", time: "16:30"}] },
  { name: "Inês Figo", schedules: [{day: "saturday", time: "17:30"}] },
  { name: "Irene Lopes", schedules: [{day: "tuesday", time: "15:00"}] },
  { name: "João Liberatore", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Júlia Peixoto Guimarães", schedules: [{day: "wednesday", time: "16:30"}, {day: "friday", time: "18:30"}] },
  { name: "Laura Hortega", schedules: [{day: "friday", time: "18:00"}] },
  { name: "Lara Marto", schedules: [{day: "thursday", time: "16:30"}] },
  { name: "Laura Correia", schedules: [{day: "friday", time: "16:30"}, {day: "saturday", time: "17:30"}] },
  { name: "Lázaro Soho - Rosa", schedules: [{day: "saturday", time: "16:00"}] },
  { name: "Lázaro Chorão", schedules: [{day: "friday", time: "18:00"}] },
  { name: "Letícia Guimarães", schedules: [{day: "friday", time: "16:30"}] },
  { name: "Lídia Azenha", schedules: [{day: "wednesday", time: "18:30"}, {day: "thursday", time: "16:30"}] },
  { name: "Lourenço Marinheiro", schedules: [{day: "wednesday", time: "19:00"}] },
  { name: "Luana Castanheira", schedules: [{day: "saturday", time: "16:30"}] },
  { name: "Mafalda Ramos", schedules: [{day: "saturday", time: "15:00"}] },
  { name: "Mariana Roboio", schedules: [{day: "friday", time: "17:30"}] },
  { name: "Mariana Soares", schedules: [{day: "thursday", time: "16:30"}] },
  { name: "Maria Bernardo", schedules: [{day: "wednesday", time: "18:30"}, {day: "saturday", time: "15:00"}] },
  { name: "Maria Constança", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Maria Duarte - Rosa", schedules: [{day: "wednesday", time: "19:00"}, {day: "saturday", time: "15:30"}] },
  { name: "Maria Fuentes Pernas", schedules: [{day: "friday", time: "15:30"}] },
  { name: "Maria do Carmo Máximo", schedules: [{day: "tuesday", time: "16:30"}, {day: "wednesday", time: "17:30"}, {day: "friday", time: "17:00"}] },
  { name: "Maria de Carmo Barreto", schedules: [{day: "wednesday", time: "17:30"}, {day: "thursday", time: "17:30"}, {day: "friday", time: "17:00"}] },
  { name: "Maria Fernandes", schedules: [{day: "saturday", time: "16:30"}] },
  { name: "Maria Francisca Soares", schedules: [{day: "wednesday", time: "19:30"}] },
  { name: "Maria Inês Pires", schedules: [{day: "tuesday", time: "18:30"}, {day: "saturday", time: "16:00"}] },
  { name: "Maria Madanelo Dias", schedules: [{day: "tuesday", time: "18:30"}, {day: "friday", time: "19:00"}] },
  { name: "Maria Mota", schedules: [{day: "saturday", time: "17:30"}] },
  { name: "Matilde Dias", schedules: [{day: "wednesday", time: "19:30"}] },
  { name: "Maria Pilar Planas", schedules: [{day: "wednesday", time: "16:30"}] },
  { name: "Maria Rita Costa", schedules: [{day: "saturday", time: "16:30"}] },
  { name: "Maria Rita Rosa", schedules: [{day: "tuesday", time: "19:00"}] },
  { name: "Mariana Liberate", schedules: [{day: "friday", time: "19:00"}] },
  { name: "Martim Jorge", schedules: [{day: "friday", time: "17:00"}] },
  { name: "Matilde Durão", schedules: [{day: "saturday", time: "17:00"}] },
  { name: "Pedro Camuyrano", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Patrícia Mão", schedules: [{day: "wednesday", time: "17:30"}] },
  { name: "Rafaela Bica", schedules: [{day: "friday", time: "19:00"}] },
  { name: "Rita and Fernandes", schedules: [{day: "wednesday", time: "19:30"}] },
  { name: "Rodrigo Mendes", schedules: [{day: "saturday", time: "15:00"}] },
  { name: "Santiago Delicado", schedules: [{day: "saturday", time: "18:00"}] },
  { name: "Santiago Martins", schedules: [{day: "tuesday", time: "18:30"}] },
  { name: "Simão Joaquim", schedules: [{day: "friday", time: "17:30"}] },
  { name: "Sofia Pereira", schedules: [{day: "wednesday", time: "17:30"}] },
  { name: "Sofia Magalhães Dias", schedules: [{day: "thursday", time: "17:00"}] },
  { name: "Tomás Soutopires Pina", schedules: [{day: "saturday", time: "17:30"}] },
  { name: "Valentim Costa", schedules: [{day: "wednesday", time: "17:30"}, {day: "saturday", time: "16:30"}] }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = { created: 0, updated: 0, errors: [] };

    // Buscar todos os users existentes
    const existingUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);

    for (const student of studentsData) {
      try {
        // Procurar user por nome
        let existingUser = existingUsers.find(u => 
          u.full_name?.toLowerCase().includes(student.name.toLowerCase()) ||
          student.name.toLowerCase().includes(u.full_name?.toLowerCase())
        );

        const schedules = student.schedules.map(s => ({
          day: s.day,
          time: s.time,
          duration: 60
        }));

        const monthlyFees = {
          1: 90,
          2: 150,
          3: 180
        };
        const monthlyFee = monthlyFees[schedules.length] || 90;
        const classRegime = schedules.length === 1 ? "1x_semana" : schedules.length === 2 ? "2x_semana" : "3x_semana";

        if (!existingUser) {
          // Criar novo user
          const email = `${student.name.toLowerCase().replace(/\s+/g, '.')}@picadeiro.temp`;
          existingUser = await base44.asServiceRole.entities.User.create({
            email,
            full_name: student.name,
            role: 'user',
            student_type: 'fixo',
            student_level: 'intermedio',
            class_regime: classRegime,
            fixed_schedule: schedules,
            monthly_fee: monthlyFee
          });
          results.created++;
        } else {
          // Atualizar user existente
          await base44.asServiceRole.entities.User.update(existingUser.id, {
            student_type: 'fixo',
            student_level: 'intermedio',
            class_regime: classRegime,
            fixed_schedule: schedules,
            monthly_fee: monthlyFee
          });
          results.updated++;
        }
      } catch (e) {
        results.errors.push(`${student.name}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `✅ Importação concluída! ${results.created} criados, ${results.updated} atualizados`,
      details: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});