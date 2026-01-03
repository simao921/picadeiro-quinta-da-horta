import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { lessons, bookings } = await req.json();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "És um consultor especializado em otimização de horários para centros equestres. Analisa dados e fornece insights práticos e acionáveis."
                },
                {
                    role: "user",
                    content: `Analisa os seguintes dados de um centro equestre e sugere otimizações de horários:
          
**Aulas Agendadas (últimos registos):**
${JSON.stringify(lessons.slice(0, 100), null, 2)}

**Reservas:**
${JSON.stringify(bookings.slice(0, 100), null, 2)}

Com base nestes dados, fornece:
1. Melhores horários e dias da semana para oferecer novas aulas (máximo 5 sugestões)
2. Padrões de ocupação (horários mais procurados vs menos procurados)
3. Sugestões de distribuição de aulas ao longo da semana (3-5 sugestões práticas)
4. Alertas sobre potenciais conflitos ou sobreposições
5. Recomendações para maximizar ocupação sem sobrecarregar instrutores

Responde em português e em formato JSON estruturado.`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        });

        const analysis = JSON.parse(response.choices[0].message.content);

        return Response.json({
            success: true,
            analysis: analysis,
            tokens_used: response.usage.total_tokens
        });

    } catch (error) {
        console.error('Error analyzing schedules:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});