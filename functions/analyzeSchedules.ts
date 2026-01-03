import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Buscar TODAS as aulas e reservas diretamente
        const allLessons = await base44.asServiceRole.entities.Lesson.list();
        const allBookings = await base44.asServiceRole.entities.Booking.list();

        const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Analisa os seguintes dados de um centro equestre e sugere otimizações de horários:
          
**Aulas Agendadas:**
${JSON.stringify(allLessons, null, 2)}

**Reservas:**
${JSON.stringify(allBookings, null, 2)}

Com base nestes dados, fornece OBRIGATORIAMENTE:

1. **best_time_slots** - Array com 5 sugestões de melhores horários para novas aulas
   Formato: [{ "day": "Segunda-feira", "time": "10:00", "reason": "explicação detalhada" }]

2. **patterns** - Análise dos padrões de ocupação (string descritiva)

3. **recommendations** - Array com 5 recomendações práticas para otimizar horários
   Formato: ["recomendação 1", "recomendação 2", ...]

4. **conflicts** - Array de potenciais conflitos detectados

5. **optimization_tips** - Array com 3 dicas para maximizar ocupação

Responde APENAS em JSON válido com esta estrutura exata em português.`,
            response_json_schema: {
                type: "object",
                properties: {
                    best_time_slots: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                day: { type: "string" },
                                time: { type: "string" },
                                reason: { type: "string" }
                            }
                        }
                    },
                    patterns: { type: "string" },
                    recommendations: { type: "array", items: { type: "string" } },
                    conflicts: { type: "array", items: { type: "string" } },
                    optimization_tips: { type: "array", items: { type: "string" } }
                }
            }
        });

        return Response.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Error analyzing schedules:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});