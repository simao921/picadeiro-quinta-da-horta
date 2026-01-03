import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o assistente virtual do Picadeiro Quinta da Horta. Como posso ajudar?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: services } = useQuery({
    queryKey: ['chatbot-services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const { data: instructors } = useQuery({
    queryKey: ['chatbot-instructors'],
    queryFn: () => base44.entities.Instructor.list(),
    initialData: []
  });

  const { data: horses } = useQuery({
    queryKey: ['chatbot-horses'],
    queryFn: () => base44.entities.Horse.list(),
    initialData: []
  });

  const { data: products } = useQuery({
    queryKey: ['chatbot-products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
    initialData: []
  });

  const { data: galleryImages } = useQuery({
    queryKey: ['chatbot-gallery'],
    queryFn: () => base44.entities.GalleryImage.list('-created_date', 5),
    initialData: []
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Construir informação dos serviços dinamicamente
      const servicesInfo = services.map((s, i) => 
        `${i + 1}. ${s.title} - ${s.price ? `€${s.price}` : 'Preço sob consulta'} ${s.duration ? `(${s.duration} minutos)` : ''} - ${s.short_description || s.description}`
      ).join('\n');

      // Informação dos monitores
      const instructorsInfo = instructors
        .filter(i => i.is_active)
        .map(i => `- ${i.name}${i.is_champion ? ' (Bi-Campeão Mundial)' : ''}${i.specialties?.length ? ` - Especialidades: ${i.specialties.join(', ')}` : ''}`)
        .join('\n');

      // Informação dos cavalos
      const horsesInfo = horses
        .filter(h => h.is_active)
        .map(h => `- ${h.name}${h.breed ? ` (${h.breed})` : ''}${h.specialties?.length ? ` - ${h.specialties.join(', ')}` : ''}`)
        .join('\n');

      // Informação dos produtos
      const productsInfo = products.slice(0, 10).map(p => 
        `- ${p.name}: ${p.sale_price || p.price}€${p.sale_price ? ` (desconto de ${p.price}€)` : ''}`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `És o assistente virtual do Picadeiro Quinta da Horta, um centro equestre de excelência em Alcochete, Portugal.

════════════════════════════════════════════
📍 INFORMAÇÕES GERAIS
════════════════════════════════════════════
- Localização: Rua das Hortas - Fonte da Senhora, 2890-106 Alcochete
- Telefone: +351 932 111 786
- Email: picadeiroquintadahortagf@gmail.com
- Facebook: Picadeiroquintadahortaoficial
- Instagram: @picadeiro.quinta.da.horta

════════════════════════════════════════════
🐴 SOBRE O PICADEIRO QUINTA DA HORTA
════════════════════════════════════════════
- Centro equestre de referência na região de Alcochete
- Fundado e dirigido por Gilberto Filipe, Bi-Campeão Mundial de Equitação
- Instalações modernas e seguras para todas as idades
- Foco em ensino de qualidade, bem-estar animal e desenvolvimento pessoal através da equitação
- Oferece desde aulas para iniciantes até treino competitivo de alto nível
- Ambiente familiar e profissional

════════════════════════════════════════════
💎 SERVIÇOS E PLANOS - PREÇOS EXATOS
════════════════════════════════════════════

**AULAS DE ESCOLA (Aulas em Grupo)**
Ideal para quem quer aprender em grupo, socializar e evoluir com outros alunos.
▸ 30 minutos: 70€/mês (1x/semana) | 120€/mês (2x/semana) | 150€/mês (3x/semana)
▸ 60 minutos: 90€/mês (1x/semana) | 150€/mês (2x/semana) | 180€/mês (3x/semana)
▸ Máximo 6 alunos por aula
▸ Ensino progressivo com monitores qualificados
▸ Cavalos adaptados ao nível de cada aluno

**AULAS PARTICULARES**
Atenção personalizada para evolução rápida e focada.
▸ Com Gilberto Filipe (Bi-Campeão Mundial): 75€ por aula
  - Treino de alto nível
  - Preparação para competições
  - Técnicas avançadas de equitação
  - Opção extra: Registo de fotos/vídeo +50€
▸ Com Monitores/Team: 50€ por aula
  - Ensino de qualidade com equipa experiente
  - Acompanhamento individualizado
  - Foco nas necessidades específicas do aluno

**SESSÕES FOTOGRÁFICAS**
Capture momentos especiais com o seu cavalo.
▸ Pack 10 Fotografias: 50€
▸ Pack 12 Fotografias: 60€
▸ Pack 15 Fotografias: 70€
▸ Pack 20 Fotografias: 95€
▸ Fotografia profissional de qualidade
▸ Entrega digital em alta resolução

**SERVIÇOS DE PROPRIETÁRIOS**
Para quem tem cavalo próprio e quer treinar no picadeiro.
▸ Em Grupo (com monitores): 35€/semana (1x) | 60€/semana (2x) | 100€/semana (3x)
▸ Individual (com monitores/team): 50€ por aula
▸ IMPORTANTE: Cavalo deve apresentar-se limpo e equipado antes da aula
▸ Nota: Estas aulas têm prioridade menor que as de escola

**HIPOTERAPIA**
Terapia assistida por cavalos com profissionais especializados.
▸ 50€ por sessão
▸ Benefícios físicos, emocionais e cognitivos
▸ Acompanhamento profissional especializado
▸ Cavalos treinados especificamente para hipoterapia

════════════════════════════════════════════
👨‍🏫 EQUIPA DE MONITORES
════════════════════════════════════════════
${instructorsInfo || '- Gilberto Filipe: Bi-Campeão Mundial de Equitação, fundador e instrutor principal\n- Equipa de monitores qualificados e experientes'}

════════════════════════════════════════════
🐎 CAVALOS DISPONÍVEIS
════════════════════════════════════════════
${horsesInfo || 'Contamos com diversos cavalos de diferentes raças e temperamentos, cuidadosamente selecionados para cada tipo de aula e nível de cavaleiro.'}

════════════════════════════════════════════
🛍️ LOJA ONLINE
════════════════════════════════════════════
Oferecemos uma variedade de produtos equestres:
${productsInfo || '- Equipamentos de equitação\n- Vestuário especializado\n- Acessórios para cavalos\n- Produtos de cuidados'}
Visite a nossa loja online no website para ver todos os produtos disponíveis.

════════════════════════════════════════════
⏰ HORÁRIOS DE FUNCIONAMENTO
════════════════════════════════════════════
▸ Segunda a Sexta: 09:00 - 19:00
▸ Sábado: 09:00 - 17:00
▸ Domingo: FECHADO
▸ Horários de aulas: De meia em meia hora entre 09:00-18:00 (2ª-6ª) e 09:00-16:00 (Sáb)

════════════════════════════════════════════
📅 COMO RESERVAR AULAS
════════════════════════════════════════════
1. **Online**: Através do website na página "Reservas" (mais rápido)
2. **Telefone**: +351 932 111 786
3. **Email**: picadeiroquintadahortagf@gmail.com

**Processo de Reserva:**
- Aulas devem ser previamente agendadas
- Planos mensais (2x ou 3x/semana) ficam pendentes de aprovação
- Confirmação é enviada por email
- Sujeito a disponibilidade de horários e cavalos

════════════════════════════════════════════
💳 POLÍTICAS DE PAGAMENTO
════════════════════════════════════════════
▸ Pagamentos mensais até ao dia 5 de cada mês
▸ Penalizações aplicadas após o dia 5 (ver regulamento)
▸ Contas bloqueadas com dívida superior a 30€:
  - Não pode fazer novas reservas
  - Não pode participar em aulas
  - Não pode participar em provas/competições
▸ Métodos aceites: Transferência, MBWay, Dinheiro, Cartão

════════════════════════════════════════════
📋 REGRAS E POLÍTICAS IMPORTANTES
════════════════════════════════════════════
1. **Segurança**: Uso obrigatório de capacete em todas as aulas
2. **Pontualidade**: Chegar 10 minutos antes da aula para preparação
3. **Cancelamentos**: Avisar com 24h de antecedência quando possível
4. **Vestuário**: Calças compridas e calçado adequado (botas ou ténis com sola lisa)
5. **Comportamento**: Respeito pelos cavalos, instrutores e outros alunos
6. **Proprietários**: Cavalo limpo e equipado antes da aula

════════════════════════════════════════════
🎯 PERGUNTAS FREQUENTES
════════════════════════════════════════════
**Nunca montei a cavalo, posso começar?**
Sim! Oferecemos aulas para todos os níveis, desde iniciantes totais.

**Preciso de ter equipamento próprio?**
Não inicialmente. Capacete é obrigatório mas pode usar um nosso. Com o tempo, recomendamos adquirir equipamento próprio.

**Que idade mínima para aulas?**
Geralmente a partir dos 4-5 anos, mas depende do desenvolvimento da criança.

**Posso escolher o cavalo?**
Os instrutores escolhem o cavalo mais adequado ao seu nível e objetivos.

**Como funciona a primeira aula?**
Avaliação inicial do nível, apresentação dos cavalos e instalações, e introdução básica à equitação.

════════════════════════════════════════════
⚠️ REGRAS PARA AS RESPOSTAS
════════════════════════════════════════════
1. Usa SEMPRE os preços EXATOS listados acima
2. Gilberto Filipe: 75€/aula (não outros valores!)
3. Monitores/Team: 50€/aula
4. Responde em português de forma amigável e profissional
5. Se não souberes algo específico, sugere contacto direto
6. Menciona sempre o Bi-Campeonato Mundial do Gilberto quando relevante
7. Destaca a qualidade e segurança do centro
8. Incentiva a visita às instalações ou contacto para mais informações

════════════════════════════════════════════
Pergunta do cliente: ${userMessage}`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro. Por favor tente novamente ou contacte-nos diretamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 
                       bg-gradient-to-br from-[#4A5D23] to-[#2C3E1F] 
                       text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
                       flex items-center justify-center z-50 group"
          >
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-4 sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto 
                       sm:w-96 sm:h-[600px] w-auto h-auto
                       bg-white rounded-2xl shadow-2xl 
                       flex flex-col z-50 border border-stone-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4A5D23] to-[#2C3E1F] text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistente Virtual</h3>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#4A5D23] text-white rounded-br-none'
                        : 'bg-white text-stone-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-lg rounded-bl-none shadow-sm">
                    <Loader2 className="w-5 h-5 text-[#4A5D23] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-stone-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua pergunta..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-stone-500 mt-2 text-center">
                💬 Resposta gerada por IA
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}