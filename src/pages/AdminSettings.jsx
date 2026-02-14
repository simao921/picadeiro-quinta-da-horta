import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Euro, Bell, Loader2, Save, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

const weekDays = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    monthly_fee: 60,
    penalty_9_15: 5,
    penalty_16_end: 15,
    block_threshold: 30,
    notification_hours: 2
  });

  const [schedules, setSchedules] = useState({
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: true, start: '09:00', end: '13:00' },
    sunday: { enabled: false, start: '09:00', end: '18:00' }
  });

  const queryClient = useQueryClient();

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => base44.entities.SiteSettings.list(),
    initialData: []
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services-pricing'],
    queryFn: () => base44.entities.Service.list('-created_date', 100),
    initialData: []
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Service.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['services-pricing']);
      toast.success('Serviço atualizado!');
    }
  });

  useEffect(() => {
    if (savedSettings.length > 0) {
      const newSettings = { ...settings };
      savedSettings.forEach(s => {
        if (s.key in newSettings) {
          newSettings[s.key] = s.key === 'maintenance_mode' 
            ? s.value === 'true' 
            : parseFloat(s.value) || s.value;
        }
      });
      setSettings(newSettings);
    }
  }, [savedSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      for (const [key, value] of Object.entries(newSettings)) {
        const existing = savedSettings.find(s => s.key === key);
        if (existing) {
          await base44.entities.SiteSettings.update(existing.id, { value: String(value) });
        } else {
          await base44.entities.SiteSettings.create({ 
            key, 
            value: String(value),
            category: key.includes('penalty') || key.includes('fee') || key.includes('threshold') 
              ? 'payments' 
              : key.includes('notification') 
                ? 'notifications' 
                : 'general'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      toast.success('Definições guardadas!');
    },
    onError: () => {
      toast.error('Erro ao guardar definições');
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  return (
    <AdminLayout currentPage="AdminSettings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Definições</h1>
            <p className="text-stone-500">Configurações do sistema</p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
          >
            {saveSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Alterações
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="schedules">Horários</TabsTrigger>
            <TabsTrigger value="services">Preços Serviços</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#4A5D23]" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Modo Manutenção</h3>
                    <p className="text-sm text-stone-500">
                      Quando ativado, o site mostra uma página de manutenção aos visitantes
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(v) => setSettings({...settings, maintenance_mode: v})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules */}
          <TabsContent value="schedules">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#4A5D23]" />
                  Horários Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weekDays.map((day) => (
                  <div key={day.value} className="p-4 bg-stone-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{day.label}</h3>
                      <Switch
                        checked={schedules[day.value].enabled}
                        onCheckedChange={(v) => setSchedules({
                          ...schedules,
                          [day.value]: { ...schedules[day.value], enabled: v }
                        })}
                      />
                    </div>
                    {schedules[day.value].enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Abertura</Label>
                          <Input
                            type="time"
                            value={schedules[day.value].start}
                            onChange={(e) => setSchedules({
                              ...schedules,
                              [day.value]: { ...schedules[day.value], start: e.target.value }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Encerramento</Label>
                          <Input
                            type="time"
                            value={schedules[day.value].end}
                            onChange={(e) => setSchedules({
                              ...schedules,
                              [day.value]: { ...schedules[day.value], end: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Pricing */}
          <TabsContent value="services">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#4A5D23]" />
                  Preços dos Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    <p>Nenhum serviço encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="p-4 bg-stone-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Preço (€)</Label>
                            <Input
                              type="number"
                              value={service.price || 0}
                              onChange={(e) => {
                                updateServiceMutation.mutate({
                                  id: service.id,
                                  data: { price: parseFloat(e.target.value) }
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duração (min)</Label>
                            <Input
                              type="number"
                              value={service.duration || 60}
                              onChange={(e) => {
                                updateServiceMutation.mutate({
                                  id: service.id,
                                  data: { duration: parseInt(e.target.value) }
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Máx. Participantes</Label>
                            <Input
                              type="number"
                              value={service.max_participants || 1}
                              onChange={(e) => {
                                updateServiceMutation.mutate({
                                  id: service.id,
                                  data: { max_participants: parseInt(e.target.value) }
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-[#4A5D23]" />
                  Configurações de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Mensalidade Base (€)</Label>
                    <Input
                      type="number"
                      value={settings.monthly_fee}
                      onChange={(e) => setSettings({...settings, monthly_fee: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-stone-500">Valor base da mensalidade mensal</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de Bloqueio (€)</Label>
                    <Input
                      type="number"
                      value={settings.block_threshold}
                      onChange={(e) => setSettings({...settings, block_threshold: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-stone-500">Dívida máxima antes do bloqueio</p>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-4">Penalizações por Atraso</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Dia 9 a 15 (€)</Label>
                      <Input
                        type="number"
                        value={settings.penalty_9_15}
                        onChange={(e) => setSettings({...settings, penalty_9_15: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dia 16 até fim do mês (€)</Label>
                      <Input
                        type="number"
                        value={settings.penalty_16_end}
                        onChange={(e) => setSettings({...settings, penalty_16_end: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">Regras de Bloqueio</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Pagamento até dia 8: Sem penalização</li>
                    <li>• Dia 9 a 15: +{settings.penalty_9_15}€ de penalização</li>
                    <li>• Dia 16 até fim do mês: +{settings.penalty_16_end}€ de penalização</li>
                    <li>• Após fim do mês: Perda de horário</li>
                    <li>• Dívida superior a {settings.block_threshold}€: Conta bloqueada</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#4A5D23]" />
                  Configurações de Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Lembrete de Aulas (horas antes)</Label>
                  <Input
                    type="number"
                    value={settings.notification_hours}
                    onChange={(e) => setSettings({...settings, notification_hours: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-stone-500">
                    Quantas horas antes da aula o aluno recebe lembrete
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Notificações Automáticas</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Confirmação de reserva</li>
                    <li>• Aprovação/Rejeição de reserva</li>
                    <li>• Lembrete de aula ({settings.notification_hours}h antes)</li>
                    <li>• Aviso de pagamento pendente</li>
                    <li>• Confirmação de encomenda</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}