import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, category } = await req.json();

    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // Gerar conteúdo com IA
    const content = await base44.integrations.Core.InvokeLLM({
      prompt: `Escreve um artigo de blog profissional e informativo para o Picadeiro Quinta da Horta sobre o tema: "${title}"

Categoria: ${category || 'geral'}

INSTRUÇÕES:
1. Escreve em português de Portugal
2. Usa HTML formatado (com tags <h2>, <h3>, <p>, <strong>, <ul>, <li>)
3. O artigo deve ter entre 800-1200 palavras
4. Inclui subtítulos relevantes
5. Deve ser educativo, envolvente e otimizado para SEO
6. Menciona o Picadeiro Quinta da Horta quando apropriado
7. Inclui dicas práticas e exemplos
8. Mantém um tom profissional mas acessível

ESTRUTURA SUGERIDA:
- Introdução cativante
- 3-4 secções principais com subtítulos
- Dicas práticas em lista
- Conclusão com call-to-action

Retorna APENAS o HTML do conteúdo do artigo, sem tags <html>, <head> ou <body>.`,
    });

    // Gerar resumo
    const excerpt = await base44.integrations.Core.InvokeLLM({
      prompt: `Com base neste artigo, cria um resumo curto e cativante de 2-3 frases (máximo 200 caracteres):

${content}

Retorna APENAS o resumo, sem aspas ou formatação adicional.`,
    });

    // Gerar meta description para SEO
    const metaDescription = await base44.integrations.Core.InvokeLLM({
      prompt: `Cria uma meta description otimizada para SEO (150-160 caracteres) para este artigo:

Título: ${title}
Conteúdo: ${content.substring(0, 500)}...

A meta description deve:
- Ter 150-160 caracteres
- Incluir palavras-chave relevantes
- Ser persuasiva e cativante
- Incentivar o clique

Retorna APENAS a meta description, sem aspas.`,
    });

    // Gerar tags e keywords
    const tagsAndKeywords = await base44.integrations.Core.InvokeLLM({
      prompt: `Com base neste artigo sobre "${title}", gera:

1. 5-7 tags relevantes (palavras ou frases curtas)
2. 10 palavras-chave para SEO

Retorna no formato JSON:
{
  "tags": ["tag1", "tag2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          keywords: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      content: content.trim(),
      excerpt: excerpt.trim().substring(0, 200),
      meta_description: metaDescription.trim().substring(0, 160),
      tags: tagsAndKeywords.tags || [],
      meta_keywords: tagsAndKeywords.keywords || []
    });

  } catch (error) {
    console.error('Error generating blog post:', error);
    return Response.json({ 
      error: 'Failed to generate blog post',
      details: error.message 
    }, { status: 500 });
  }
});