import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function AIRecommendations({ user }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: bookings } = useQuery({
    queryKey: ['user-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user?.email }),
    enabled: !!user,
    initialData: []
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const generateRecommendations = async () => {
    if (!user || loading) return;

    setLoading(true);

    try {
      const bookingHistory = bookings.map(b => ({
        service: b.service_name,
        date: b.date,
        status: b.status
      }));

      const availableServices = services.map(s => ({
        name: s.title,
        description: s.description,
        price: s.price,
        duration: s.duration
      }));

      const prompt = `
        És um assistente especializado em equitação e aulas de cavalos do Picadeiro Quinta da Horta.
        
        Analisa o histórico de reservas do utilizador e fornece recomendações personalizadas:
        
        Utilizador: ${user.full_name}
        Email: ${user.email}
        
        Histórico de Reservas (últimas ${bookingHistory.length} reservas):
        ${JSON.stringify(bookingHistory, null, 2)}
        
        Serviços Disponíveis:
        ${JSON.stringify(availableServices, null, 2)}
        
        Com base nesta informação:
        1. Identifica o nível de experiência do utilizador (iniciante, intermediário, avançado)
        2. Identifica os interesses e preferências demonstrados
        3. Recomenda 3 serviços ou experiências personalizadas
        4. Para cada recomendação, explica BREVEMENTE (1-2 linhas) por que é adequada
        5. Sugere objetivos de progressão adequados ao nível
        
        Sê entusiasta, motivador e específico. As recomendações devem ser práticas e acionáveis.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            user_level: {
              type: 'string',
              enum: ['iniciante', 'intermediario', 'avancado']
            },
            interests: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  service_name: { type: 'string' },
                  reason: { type: 'string' },
                  priority: { type: 'string', enum: ['alta', 'media', 'baixa'] }
                }
              }
            },
            progression_goals: {
              type: 'array',
              items: { type: 'string' }
            },
            motivational_message: { type: 'string' }
          }
        }
      });

      setRecommendations(response);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && bookings.length > 0 && services.length > 0 && !recommendations) {
      generateRecommendations();
    }
  }, [user, bookings, services]);

  if (!user) return null;

  if (bookings.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-[#B8956A]/10 to-[#8B7355]/10">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-[#B8956A] mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-[#2D2D2D] mb-2">
            Comece a Sua Jornada Equestre
          </h3>
          <p className="text-stone-600 mb-6">
            Faça a sua primeira reserva e receba recomendações personalizadas da nossa IA
          </p>
          <Link to={createPageUrl('Bookings')}>
            <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
              Ver Serviços Disponíveis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 text-[#B8956A] mx-auto mb-4 animate-spin" />
          <p className="text-stone-600">A analisar o seu perfil e gerar recomendações...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) return null;

  const levelColors = {
    'iniciante': 'bg-blue-100 text-blue-800',
    'intermediario': 'bg-green-100 text-green-800',
    'avancado': 'bg-purple-100 text-purple-800'
  };

  const priorityIcons = {
    'alta': '🔥',
    'media': '⭐',
    'baixa': '💡'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h2 className="font-serif text-2xl font-bold">
              Recomendações Personalizadas com IA
            </h2>
          </div>
          <p className="text-white/90 mb-4">
            {recommendations.motivational_message}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${levelColors[recommendations.user_level]} border-0`}>
              Nível: {recommendations.user_level === 'iniciante' ? 'Iniciante' : 
                      recommendations.user_level === 'intermediario' ? 'Intermediário' : 
                      'Avançado'}
            </Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              {bookings.length} aulas realizadas
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      {recommendations.interests && recommendations.interests.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Seus Interesses Identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recommendations.interests.map((interest, idx) => (
                <Badge key={idx} variant="outline" className="text-[#B8956A] border-[#B8956A]">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{priorityIcons[rec.priority]}</span>
                  <Badge variant="outline" className={
                    rec.priority === 'alta' ? 'text-red-600 border-red-600' :
                    rec.priority === 'media' ? 'text-orange-600 border-orange-600' :
                    'text-blue-600 border-blue-600'
                  }>
                    {rec.priority === 'alta' ? 'Alta Prioridade' :
                     rec.priority === 'media' ? 'Prioridade Média' :
                     'Explorar'}
                  </Badge>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#2D2D2D] mb-3">
                  {rec.service_name}
                </h3>
                <p className="text-stone-600 text-sm mb-4 line-clamp-3">
                  {rec.reason}
                </p>
                <Link to={createPageUrl('Bookings')}>
                  <Button variant="outline" className="w-full border-[#B8956A] text-[#B8956A] hover:bg-[#B8956A] hover:text-white">
                    Reservar Agora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progression Goals */}
      {recommendations.progression_goals && recommendations.progression_goals.length > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-br from-stone-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#B8956A]" />
              Objetivos de Progressão Sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.progression_goals.map((goal, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#B8956A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#B8956A] text-sm font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-stone-700">{goal}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={generateRecommendations}
          disabled={loading}
          className="border-[#B8956A] text-[#B8956A] hover:bg-[#B8956A] hover:text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              A atualizar...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Atualizar Recomendações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}