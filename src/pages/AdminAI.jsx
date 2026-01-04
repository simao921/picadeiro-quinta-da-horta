import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, TrendingUp, Calendar, AlertTriangle, 
  Loader2, Star, Clock, Euro, Users 
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: lessons } = useQuery({
    queryKey: ['all-lessons'],
    queryFn: () => base44.entities.Lesson.list(),
    initialData: []
  });

  const { data: bookings } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: []
  });

  const { data: payments } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list(),
    initialData: []
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
    initialData: []
  });

  const analyzeScheduleOptimization = async () => {
    setAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `
          Analisa os horários e reservas de um centro equestre para otimização:
          
          **Aulas Agendadas:**
          ${JSON.stringify(lessons, null, 2)}
          
          **Reservas:**
          ${JSON.stringify(bookings, null, 2)}
          
          Fornece uma análise completa com:
          1. Melhores horários (dias e horas) com maior procura
          2. Padrões de ocupação (quais dias/horários têm mais/menos reservas)
          3. Recomendações para aumentar a ocupação em horários vazios
          4. Dicas de otimização para maximizar receitas
        `,
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
            optimization_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(prev => ({ ...prev, schedule: analysis }));
      toast.success('Análise de horários concluída! ✅');
    } catch (e) {
      console.error('Error:', e);
      toast.error('Erro ao analisar horários: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeProductPerformance = async () => {
    setAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `
          Analisa o desempenho da loja online de um centro equestre:
          
          **Produtos:**
          ${JSON.stringify(products, null, 2)}
          
          **Encomendas:**
          ${JSON.stringify(orders, null, 2)}
          
          Fornece:
          1. Top 5 produtos mais vendidos e porquê
          2. Produtos com baixo desempenho e possíveis razões
          3. Sugestões de produtos para destacar (featured)
          4. Recomendações de preços ou promoções
          5. Produtos que devem ser reabastecidos prioritariamente
        `,
        response_json_schema: {
          type: "object",
          properties: {
            top_products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            underperforming: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            },
            featured_recommendations: { type: "array", items: { type: "string" } },
            pricing_suggestions: { type: "array", items: { type: "string" } },
            restock_priority: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(prev => ({ ...prev, products: analysis }));
      toast.success('Análise de produtos concluída!');
    } catch (e) {
      toast.error('Erro ao analisar produtos');
    } finally {
      setAnalyzing(false);
    }
  };

  const checkPaymentAlerts = () => {
    const overduePayments = payments.filter(p => 
      p.status !== 'paid' && new Date(p.due_date) < new Date()
    );
    
    const blockedAccounts = payments.reduce((acc, p) => {
      if (p.status !== 'paid') {
        acc[p.client_email] = (acc[p.client_email] || 0) + (p.total || p.amount);
      }
      return acc;
    }, {});

    const criticalAccounts = Object.entries(blockedAccounts)
      .filter(([_, debt]) => debt > 30)
      .map(([email, debt]) => ({ email, debt }));

    return { overduePayments, criticalAccounts };
  };

  const checkScheduleConflicts = () => {
    const conflicts = [];
    const futureLeakedLessons = lessons.filter(l => new Date(l.date) >= new Date());
    
    futureLeakedLessons.forEach((lesson, i) => {
      futureLeakedLessons.slice(i + 1).forEach(other => {
        if (lesson.date === other.date && 
            lesson.instructor_id === other.instructor_id &&
            lesson.start_time === other.start_time) {
          conflicts.push({
            date: lesson.date,
            time: lesson.start_time,
            reason: 'Mesmo instrutor agendado para duas aulas ao mesmo tempo'
          });
        }
      });
    });

    return conflicts;
  };

  const alerts = checkPaymentAlerts();
  const scheduleConflicts = checkScheduleConflicts();

  return (
    <AdminLayout currentPage="AdminAI">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
            <Brain className="w-7 h-7 text-[#4A5D23]" />
            Assistente Inteligente
          </h1>
          <p className="text-stone-500">Análises e sugestões com IA para otimizar o negócio</p>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="alerts">Alertas Proativos</TabsTrigger>
            <TabsTrigger value="schedule">Otimização de Horários</TabsTrigger>
            <TabsTrigger value="sales">Análise de Vendas</TabsTrigger>
          </TabsList>

          {/* Proactive Alerts */}
          <TabsContent value="alerts" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Alertas de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.criticalAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.criticalAccounts.map((account, i) => (
                      <div key={i} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-red-900">{account.email}</p>
                            <p className="text-sm text-red-700">Dívida: {account.debt.toFixed(2)}€ (Conta bloqueada)</p>
                          </div>
                          <Badge className="bg-red-600 text-white">Crítico</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600">✓ Não há contas bloqueadas no momento</p>
                )}

                {alerts.overduePayments.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Pagamentos em Atraso: {alerts.overduePayments.length}</p>
                    <div className="space-y-2">
                      {alerts.overduePayments.slice(0, 5).map((payment, i) => (
                        <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-sm text-amber-900">
                            {payment.client_email} - {payment.month} ({payment.total?.toFixed(2)}€)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Conflitos de Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleConflicts.length > 0 ? (
                  <div className="space-y-2">
                    {scheduleConflicts.map((conflict, i) => (
                      <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="font-semibold text-amber-900">
                          {format(new Date(conflict.date), "d 'de' MMMM", { locale: pt })} às {conflict.time}
                        </p>
                        <p className="text-sm text-amber-700">{conflict.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600">✓ Não há conflitos de agendamento detectados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Optimization */}
          <TabsContent value="schedule" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Otimização de Horários com IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={analyzeScheduleOptimization}
                    disabled={analyzing}
                    className="bg-[#4A5D23] hover:bg-[#3A4A1B] w-full"
                    size="lg"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        A analisar com IA (pode demorar 10-15 seg)...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        Analisar Horários com IA
                      </>
                    )}
                  </Button>
                  {analyzing && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        🤖 A IA está a analisar todas as aulas e reservas... Aguarde alguns segundos.
                      </p>
                    </div>
                  )}
                </div>

                {suggestions?.schedule && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Melhores Horários Sugeridos
                      </h4>
                      <div className="space-y-2">
                        {suggestions.schedule.best_time_slots?.map((slot, i) => (
                          <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="font-medium text-green-900">{slot.day} às {slot.time}</p>
                            <p className="text-sm text-green-700">{slot.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {suggestions.schedule.patterns && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          Padrões de Ocupação
                        </h4>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">{suggestions.schedule.patterns}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Recomendações
                      </h4>
                      <ul className="space-y-2">
                        {suggestions.schedule.recommendations?.map((rec, i) => (
                          <li key={i} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {suggestions.schedule.optimization_tips && (
                      <div>
                        <h4 className="font-semibold mb-2">💡 Dicas de Otimização</h4>
                        <ul className="space-y-2">
                          {suggestions.schedule.optimization_tips?.map((tip, i) => (
                            <li key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Analysis */}
          <TabsContent value="sales" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Análise de Vendas com IA</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={analyzeProductPerformance}
                  disabled={analyzing}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B] mb-4"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A analisar...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analisar Desempenho
                    </>
                  )}
                </Button>

                {suggestions?.products && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        Top Produtos
                      </h4>
                      <div className="space-y-2">
                        {suggestions.products.top_products?.map((product, i) => (
                          <div key={i} className="p-3 bg-green-50 border border-green-200 rounded">
                            <p className="font-medium text-green-900">{product.name}</p>
                            <p className="text-sm text-green-700">{product.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Produtos para Destacar</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {suggestions.products.featured_recommendations?.map((rec, i) => (
                          <li key={i} className="text-sm text-stone-700">{rec}</li>
                        ))}
                      </ul>
                    </div>

                    {suggestions.products.underperforming?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Atenção Necessária</h4>
                        <div className="space-y-2">
                          {suggestions.products.underperforming.map((product, i) => (
                            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded">
                              <p className="font-medium text-amber-900">{product.name}</p>
                              <p className="text-sm text-amber-700">{product.reason}</p>
                              <p className="text-sm text-amber-600 mt-1">💡 {product.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}