import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmails() {
  const [singleEmail, setSingleEmail] = useState('');
  const [singleSubject, setSingleSubject] = useState('');
  const [singleMessage, setSingleMessage] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-for-emails'],
    queryFn: () => base44.entities.User.list('-created_date', 500)
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['email-subscribers'],
    queryFn: () => base44.entities.EmailSubscriber.filter({ is_active: true })
  });

  const sendSingleEmail = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: singleEmail,
        subject: singleSubject,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #B8956A 0%, #8B7355 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Picadeiro Quinta da Horta</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <p style="color: #333; line-height: 1.6;">${singleMessage.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="background-color: #2D2D2D; padding: 20px; text-align: center;">
              <p style="color: #fff; margin: 0; font-size: 12px;">
                Picadeiro Quinta da Horta - Alcochete<br>
                +351 932 111 786 | picadeiroquintadahortagf@gmail.com
              </p>
            </div>
          </div>
        `
      });
    },
    onSuccess: () => {
      toast.success('Email enviado com sucesso!');
      setSingleEmail('');
      setSingleSubject('');
      setSingleMessage('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const sendBulkEmail = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId) || subscribers.find(s => s.id === userId);
        const email = user?.email;
        
        if (!email) continue;

        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: bulkSubject,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #B8956A 0%, #8B7355 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Picadeiro Quinta da Horta</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                  <p style="color: #333; line-height: 1.6;">${bulkMessage.replace(/\n/g, '<br>')}</p>
                </div>
                <div style="background-color: #2D2D2D; padding: 20px; text-align: center;">
                  <p style="color: #fff; margin: 0; font-size: 12px;">
                    Picadeiro Quinta da Horta - Alcochete<br>
                    +351 932 111 786 | picadeiroquintadahortagf@gmail.com
                  </p>
                </div>
              </div>
            `
          });
          results.push({ user: user.full_name || user.name || email, success: true });
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          results.push({ user: user.full_name || user.name || email, success: false });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      toast.success(`${successful} emails enviados! ${failed > 0 ? `${failed} falharam.` : ''}`);
      setSelectedUsers([]);
      setBulkSubject('');
      setBulkMessage('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const templates = [
    { 
      name: 'Lembrete de Aula', 
      subject: '⏰ Lembrete - Aula Amanhã',
      text: 'Olá!\n\nLembramos que tem uma aula agendada para amanhã no Picadeiro Quinta da Horta.\n\nAguardamos por si!\n\nCumprimentos,\nEquipa Picadeiro Quinta da Horta' 
    },
    { 
      name: 'Confirmação de Reserva', 
      subject: '✅ Reserva Confirmada',
      text: 'Olá!\n\nA sua reserva foi confirmada com sucesso!\n\nAguardamos por si no Picadeiro Quinta da Horta.\n\nCumprimentos,\nEquipa Picadeiro Quinta da Horta' 
    },
    { 
      name: 'Promoção Especial', 
      subject: '🎉 Promoção Especial',
      text: 'Olá!\n\nTemos uma promoção especial para si! Condições exclusivas para novos alunos.\n\nContacte-nos para saber mais!\n\nCumprimentos,\nEquipa Picadeiro Quinta da Horta\n+351 932 111 786' 
    }
  ];

  return (
    <AdminLayout currentPage="AdminEmails">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Gestão de Emails</h1>
            <p className="text-stone-600 mt-1">Envie emails para clientes e subscritores</p>
          </div>
          <Mail className="w-8 h-8 text-[#4A5D23]" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilizadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{users.length}</div>
              <p className="text-xs text-stone-600">utilizadores registados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscritores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{subscribers.length}</div>
              <p className="text-xs text-stone-600">subscritores ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Contactos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">
                {users.length + subscribers.length}
              </div>
              <p className="text-xs text-stone-600">contactos disponíveis</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="single" className="space-y-4">
          <TabsList>
            <TabsTrigger value="single">Email Individual</TabsTrigger>
            <TabsTrigger value="bulk">Email em Massa</TabsTrigger>
            <TabsTrigger value="templates">Modelos</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Email Individual</CardTitle>
                <CardDescription>Envie um email para um destinatário específico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email do Destinatário</Label>
                  <Input 
                    type="email"
                    placeholder="exemplo@email.com" 
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input 
                    placeholder="Assunto do email" 
                    value={singleSubject}
                    onChange={(e) => setSingleSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea 
                    placeholder="Escreva a sua mensagem aqui..." 
                    rows={6}
                    value={singleMessage}
                    onChange={(e) => setSingleMessage(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={() => sendSingleEmail.mutate()}
                  disabled={!singleEmail || !singleSubject || !singleMessage || sendSingleEmail.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendSingleEmail.isPending ? 'A Enviar...' : 'Enviar Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Email em Massa</CardTitle>
                <CardDescription>Selecione múltiplos destinatários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecionar Destinatários</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    <div className="font-semibold text-sm text-stone-700 mb-2">Utilizadores</div>
                    {users.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <label className="text-sm">
                          {user.full_name || user.email}
                        </label>
                      </div>
                    ))}

                    <div className="font-semibold text-sm text-stone-700 mt-4 mb-2">Subscritores</div>
                    {subscribers.map(sub => (
                      <div key={sub.id} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={selectedUsers.includes(sub.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, sub.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== sub.id));
                            }
                          }}
                        />
                        <label className="text-sm">
                          {sub.name || sub.email}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600">{selectedUsers.length} destinatários selecionados</p>
                </div>

                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input 
                    placeholder="Assunto do email" 
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea 
                    placeholder="Escreva a mensagem para todos os destinatários..." 
                    rows={6}
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={() => sendBulkEmail.mutate()}
                  disabled={selectedUsers.length === 0 || !bulkSubject || !bulkMessage || sendBulkEmail.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendBulkEmail.isPending ? 'A Enviar...' : `Enviar para ${selectedUsers.length} destinatários`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modelos de Emails</CardTitle>
                <CardDescription>Use modelos predefinidos para emails rápidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template, idx) => (
                  <Card key={idx} className="cursor-pointer hover:bg-stone-50 transition-colors">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-stone-600 mb-1">Assunto: {template.subject}</p>
                      <p className="text-sm text-stone-600 mb-3 whitespace-pre-line">{template.text}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSingleSubject(template.subject);
                            setSingleMessage(template.text);
                          }}
                        >
                          Usar em Email Individual
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setBulkSubject(template.subject);
                            setBulkMessage(template.text);
                          }}
                        >
                          Usar em Email Massa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}