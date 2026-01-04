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
import { MessageSquare, Users, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function AdminSMS() {
  const [singlePhone, setSinglePhone] = useState('');
  const [singleMessage, setSingleMessage] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-sms'],
    queryFn: () => base44.entities.User.list('-created_date', 500)
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-for-sms'],
    queryFn: () => base44.entities.PicadeiroStudent.list('-created_date', 500)
  });

  // Função para formatar número português
  const formatPortuguesePhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('351')) return `+${cleaned}`;
    if (cleaned.startsWith('00351')) return `+${cleaned.slice(2)}`;
    if (cleaned.length === 9) return `+351${cleaned}`;
    if (cleaned.startsWith('+')) return cleaned;
    return `+351${cleaned}`;
  };

  const sendSMS = async (to, message) => {
    const formattedPhone = formatPortuguesePhone(to);
    
    const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; // Substituir com variável de ambiente
    const authToken = 'YOUR_TWILIO_AUTH_TOKEN';   // Substituir com variável de ambiente
    const fromNumber = 'YOUR_TWILIO_PHONE';       // Substituir com variável de ambiente

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: message
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar SMS');
    }

    return await response.json();
  };

  const sendSingleSMS = useMutation({
    mutationFn: async () => {
      return await sendSMS(singlePhone, singleMessage);
    },
    onSuccess: () => {
      toast.success('SMS enviado com sucesso!');
      setSinglePhone('');
      setSingleMessage('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const sendBulkSMS = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const userId of selectedUsers) {
        const user = users.find(u => u.id === userId) || students.find(s => s.id === userId);
        const phone = user?.phone;
        
        if (!phone) continue;

        try {
          await sendSMS(phone, bulkMessage);
          results.push({ user: user.full_name || user.name, success: true });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        } catch (error) {
          results.push({ user: user.full_name || user.name, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      toast.success(`${successful} SMS enviados! ${failed > 0 ? `${failed} falharam.` : ''}`);
      setSelectedUsers([]);
      setBulkMessage('');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const usersWithPhone = users.filter(u => u.phone);
  const studentsWithPhone = students.filter(s => s.phone);

  const templates = [
    { name: 'Lembrete de Aula', text: 'Olá! Lembrete: Tem uma aula amanhã no Picadeiro Quinta da Horta. Até já! 🏇' },
    { name: 'Confirmação', text: 'A sua reserva foi confirmada! Aguardamos por si no Picadeiro Quinta da Horta. 📅' },
    { name: 'Cancelamento', text: 'Informamos que a aula foi cancelada. Por favor contacte-nos para reagendar. 🔄' },
    { name: 'Promoção', text: '🎉 Promoção especial! Condições especiais para novos alunos. Contacte-nos! +351 932 111 786' }
  ];

  return (
    <AdminLayout currentPage="AdminSMS">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Gestão de SMS</h1>
            <p className="text-stone-600 mt-1">Envie notificações SMS para clientes</p>
          </div>
          <MessageSquare className="w-8 h-8 text-[#4A5D23]" />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure as credenciais Twilio nas variáveis de ambiente (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilizadores com Telefone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{usersWithPhone.length}</div>
              <p className="text-xs text-stone-600">de {users.length} utilizadores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alunos com Telefone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{studentsWithPhone.length}</div>
              <p className="text-xs text-stone-600">de {students.length} alunos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Contactos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">
                {usersWithPhone.length + studentsWithPhone.length}
              </div>
              <p className="text-xs text-stone-600">contactos disponíveis</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="single" className="space-y-4">
          <TabsList>
            <TabsTrigger value="single">SMS Individual</TabsTrigger>
            <TabsTrigger value="bulk">SMS em Massa</TabsTrigger>
            <TabsTrigger value="templates">Modelos</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar SMS Individual</CardTitle>
                <CardDescription>Envie uma mensagem SMS para um número específico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Número de Telefone</Label>
                  <Input 
                    placeholder="+351 XXX XXX XXX" 
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                  />
                  <p className="text-xs text-stone-600">Formato: +351XXXXXXXXX ou XXXXXXXXX</p>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea 
                    placeholder="Escreva a sua mensagem aqui..." 
                    rows={4}
                    value={singleMessage}
                    onChange={(e) => setSingleMessage(e.target.value)}
                    maxLength={160}
                  />
                  <p className="text-xs text-stone-600">{singleMessage.length}/160 caracteres</p>
                </div>

                <Button 
                  onClick={() => sendSingleSMS.mutate()}
                  disabled={!singlePhone || !singleMessage || sendSingleSMS.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendSingleSMS.isPending ? 'A Enviar...' : 'Enviar SMS'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar SMS em Massa</CardTitle>
                <CardDescription>Selecione múltiplos destinatários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecionar Destinatários</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    <div className="font-semibold text-sm text-stone-700 mb-2">Utilizadores</div>
                    {usersWithPhone.map(user => (
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
                          {user.full_name || user.email} - {user.phone}
                        </label>
                      </div>
                    ))}

                    <div className="font-semibold text-sm text-stone-700 mt-4 mb-2">Alunos do Picadeiro</div>
                    {studentsWithPhone.map(student => (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={selectedUsers.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, student.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <label className="text-sm">
                          {student.name} - {student.phone}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600">{selectedUsers.length} destinatários selecionados</p>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea 
                    placeholder="Escreva a mensagem para todos os destinatários..." 
                    rows={4}
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    maxLength={160}
                  />
                  <p className="text-xs text-stone-600">{bulkMessage.length}/160 caracteres</p>
                </div>

                <Button 
                  onClick={() => sendBulkSMS.mutate()}
                  disabled={selectedUsers.length === 0 || !bulkMessage || sendBulkSMS.isPending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendBulkSMS.isPending ? 'A Enviar...' : `Enviar para ${selectedUsers.length} destinatários`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modelos de Mensagens</CardTitle>
                <CardDescription>Use modelos predefinidos para mensagens rápidas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template, idx) => (
                  <Card key={idx} className="cursor-pointer hover:bg-stone-50 transition-colors">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-2">{template.name}</h4>
                      <p className="text-sm text-stone-600 mb-3">{template.text}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSingleMessage(template.text)}
                        >
                          Usar em SMS Individual
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setBulkMessage(template.text)}
                        >
                          Usar em SMS Massa
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