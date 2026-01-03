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

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `És o assistente virtual do Picadeiro Quinta da Horta, um centro equestre em Alcochete, Portugal.

INFORMAÇÕES DO PICADEIRO:
- Localização: Rua das Hortas - Fonte da Senhora, 2890-106 Alcochete
- Telefone: +351 932 111 786
- Email: picadeiroquintadahortagf@gmail.com

SERVIÇOS E PLANOS COM PREÇOS EXATOS:

**AULAS DE ESCOLA (Aulas em Grupo)**
- 30 minutos: 70€/mês (1x/semana), 120€/mês (2x/semana), 150€/mês (3x/semana)
- 60 minutos: 90€/mês (1x/semana), 150€/mês (2x/semana), 180€/mês (3x/semana)

**AULAS PARTICULARES**
- Com Gilberto Filipe (Bi-Campeão Mundial): 75€ por aula
- Com Monitores/Team: 50€ por aula
- Opção extra: Registo de fotos/vídeo +50€

**SESSÕES FOTOGRÁFICAS**
- Pack 10 Fotografias: 50€
- Pack 12 Fotografias: 60€
- Pack 15 Fotografias: 70€
- Pack 20 Fotografias: 95€

**SERVIÇOS DE PROPRIETÁRIOS**
- Em Grupo (com monitores): 35€/semana (1x), 60€/semana (2x), 100€/semana (3x)
- Individual (com monitores/team): 50€ por aula
- Nota: Cavalo deve apresentar-se limpo e equipado antes da aula

**HIPOTERAPIA**
- Sessão de Hipoterapia: 50€ por sessão
- Terapia assistida por cavalos com profissionais especializados

MONITORES/INSTRUTORES:
${instructorsInfo || '- Gilberto Filipe (Bi-Campeão Mundial de Equitação)'}

CAVALOS DISPONÍVEIS:
${horsesInfo || 'Vários cavalos disponíveis - contactar para mais detalhes'}

HORÁRIOS DE FUNCIONAMENTO:
- Segunda a Sexta: 09:00 - 19:00
- Sábado: 09:00 - 17:00
- Domingo: Fechado

COMO RESERVAR:
- Online através do website na página "Reservas"
- Por telefone: +351 932 111 786
- Por email: picadeiroquintadahortagf@gmail.com

REGRAS IMPORTANTES:
1. Usa SEMPRE os preços EXATOS listados acima
2. Para aulas particulares com Gilberto Filipe, o preço é 75€ (não 45€ ou outros valores)
3. Responde em português de forma amigável e profissional
4. Se não souberes algo específico, sugere contacto direto

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