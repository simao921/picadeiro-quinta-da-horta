import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNotifications() {
  const [sending, setSending] = useState(false);
  const [lastResults, setLastResults] = useState(null);

  const sendNotifications = async (type) => {
    setSending(true);
    setLastResults(null);
    
    try {
      const response = await base44.functions.invoke('sendPersonalizedNotifications', { type });
      
      if (response?.data?.success) {
        setLastResults(response.data);
        toast.success(`✅ ${response.data.notifications_sent} notificações enviadas!`);
      } else {
        toast.error('Erro ao enviar notificações');
      }
    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminNotifications">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
            <Bell className="w-7 h-7 text-[#4A5D23]" />
            Notificações Personalizadas
          </h1>
          <p className="text-stone-500">Envie notificações automáticas e personalizadas por IA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aulas Próximas */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Aulas Próximas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-stone-600">
                Envia lembretes automáticos para clientes com aulas nas próximas 48 horas.
              </p>
              <Button
                onClick={() => sendNotifications('upcoming_lessons')}
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Lembretes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Promoções */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Promoções Personalizadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-stone-600">
                IA analisa o histórico e envia promoções personalizadas para cada cliente.
              </p>
              <Button
                onClick={() => sendNotifications('promotions')}
                disabled={sending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Promoções
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pedidos de Feedback */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Pedidos de Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-stone-600">
                Solicita feedback automático de clientes após aulas concluídas.
              </p>
              <Button
                onClick={() => sendNotifications('feedback_requests')}
                disabled={sending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Solicitar Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enviar Tudo */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-[#4A5D23] to-[#2C3E1F] text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Enviar Todas as Notificações</h3>
                <p className="text-sm text-white/80">
                  Envia lembretes, promoções e pedidos de feedback de uma vez
                </p>
              </div>
              <Button
                onClick={() => sendNotifications('all')}
                disabled={sending}
                size="lg"
                className="bg-white text-[#4A5D23] hover:bg-stone-100"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Tudo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {lastResults && (
          <Card className="border-0 shadow-md border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-green-900">Notificações Enviadas com Sucesso!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Total: {lastResults.notifications_sent} notificações enviadas
                  </p>
                  {lastResults.details && lastResults.details.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-stone-600 mb-2">Detalhes:</p>
                      <div className="space-y-1">
                        {lastResults.details.slice(0, 5).map((detail, idx) => (
                          <p key={idx} className="text-xs text-stone-500">
                            • {detail.type} → {detail.email}
                          </p>
                        ))}
                        {lastResults.details.length > 5 && (
                          <p className="text-xs text-stone-500">
                            ... e mais {lastResults.details.length - 5}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}