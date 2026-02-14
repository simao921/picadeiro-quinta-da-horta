import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function UserPreferences() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin();
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
        setPhone(userData.phone || '');
        setSmsEnabled(userData.notification_preferences?.sms_enabled || false);
        setEmailEnabled(userData.notification_preferences?.email_enabled !== false);
      } catch (error) {
        toast.error('Erro ao carregar preferências');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const updatePreferences = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        phone,
        notification_preferences: {
          sms_enabled: smsEnabled,
          email_enabled: emailEnabled
        }
      });
    },
    onSuccess: () => {
      toast.success('Preferências atualizadas com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">Preferências de Notificações</h1>
          <p className="text-stone-600 mt-2">Gerir como recebe as suas notificações</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Métodos de Notificação
            </CardTitle>
            <CardDescription>
              Escolha como quer receber notificações sobre aulas, confirmações e promoções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#4A5D23]" />
                  <div>
                    <Label className="text-base">Notificações por Email</Label>
                    <p className="text-sm text-stone-600">Receber emails para {user?.email}</p>
                  </div>
                </div>
                <Switch 
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#4A5D23]" />
                    <div>
                      <Label className="text-base">Notificações por SMS</Label>
                      <p className="text-sm text-stone-600">Receber SMS no seu telemóvel</p>
                    </div>
                  </div>
                  <Switch 
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                    disabled={!phone}
                  />
                </div>

                <div className="ml-8 space-y-2">
                  <Label>Número de Telefone</Label>
                  <Input 
                    placeholder="+351 XXX XXX XXX" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-stone-600">
                    {!phone && 'Adicione um número de telefone para ativar SMS'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">ℹ️ Informação</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Lembretes de aulas agendadas</li>
                <li>• Confirmações de reservas</li>
                <li>• Notificações de cancelamentos</li>
                <li>• Promoções especiais</li>
              </ul>
            </div>

            <Button 
              onClick={() => updatePreferences.mutate()}
              disabled={updatePreferences.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePreferences.isPending ? 'A Guardar...' : 'Guardar Preferências'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}