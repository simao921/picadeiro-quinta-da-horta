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
  Loader2, Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

// build trigger
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
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-stone-50 rounded-2xl p-8 shadow-sm border border-stone-200/50">
          <h1 className="text-4xl font-serif font-bold text-[#2C3E1F] flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-[#4A5D23] to-[#3A4A1B] rounded-2xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            Assistente Inteligente
          </h1>
          <p className="text-stone-600 text-lg ml-20">Análises e sugestões com IA para otimizar o negócio</p>
        </div>

        <Tabs defaultValue="alerts" className="space-y-8">
          <TabsList className="bg-white border-2 border-stone-200 shadow-md p-1.5 rounded-xl h-auto">
            <TabsTrigger value="alerts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A5D23] data-[state=active]:to-[#3A4A1B] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg px-5 py-3">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">Alertas Proativos</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A5D23] data-[state=active]:to-[#3A4A1B] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg px-5 py-3">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-medium">Otimização de Horários</span>
            </TabsTrigger>

          </TabsList>

          {/* Proactive Alerts */}
          <TabsContent value="alerts" className="space-y-6 animate-fadeIn">
            <Card className="border-2 border-stone-200/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b-2 border-stone-100 bg-gradient-to-r from-amber-50 to-orange-50 py-5">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  Alertas de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
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
          <TabsContent value="schedule" className="space-y-4 animate-fadeIn">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-600" />
                  Otimização de Horários com IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={analyzeScheduleOptimization}
                    disabled={analyzing}
                    className="bg-gradient-to-r from-[#4A5D23] to-[#3A4A1B] hover:from-[#3A4A1B] hover:to-[#2A3A0B] text-white w-full shadow-md hover:shadow-lg transition-all duration-200"
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


        </Tabs>
      </div>
    </AdminLayout>
  );
}