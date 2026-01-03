import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEmails() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const allEmails = users.map(u => u.email).filter(Boolean);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedEmails(allEmails);
    } else {
      setSelectedEmails([]);
    }
  };

  const handleToggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const handleSendEmails = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Preencha o assunto e a mensagem');
      return;
    }

    if (selectedEmails.length === 0) {
      toast.error('Selecione pelo menos um destinatário');
      return;
    }

    setSending(true);
    
    try {
      const response = await base44.functions.invoke('sendBulkEmail', {
        subject,
        message,
        recipients: selectedEmails
      });

      console.log('Response:', response);

      if (response?.data?.success) {
        const { sent, failed, total } = response.data.results;
        toast.success(`✅ Emails enviados: ${sent}/${total}`);
        if (failed > 0) {
          toast.warning(`⚠️ ${failed} emails falharam`);
        }
        
        // Limpar formulário
        setSubject('');
        setMessage('');
        setSelectedEmails([]);
        setSelectAll(false);
      } else {
        toast.error('Erro ao enviar emails: ' + (response?.data?.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminEmails">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
            <Mail className="w-7 h-7 text-[#4A5D23]" />
            Enviar Emails em Massa
          </h1>
          <p className="text-stone-500">Envie mensagens para todos os utilizadores registados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Compor Mensagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Assunto</label>
                  <Input
                    placeholder="Ex: Novidades do Picadeiro Quinta da Horta"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mensagem</label>
                  <Textarea
                    placeholder="Escreva a sua mensagem aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={12}
                    className="text-base resize-none"
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    A mensagem será enviada com o logo e rodapé do Picadeiro
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedEmails.length} destinatário(s)
                  </Badge>
                </div>

                <Button
                  onClick={handleSendEmails}
                  disabled={sending || selectedEmails.length === 0 || !subject || !message}
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B] text-white"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar Emails
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recipients List */}
          <div>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Destinatários</span>
                  <Badge className="bg-[#4A5D23]">{allEmails.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Selecionar Todos
                    </label>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto space-y-2">
                    {allEmails.map((email) => (
                      <div key={email} className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded">
                        <Checkbox
                          id={email}
                          checked={selectedEmails.includes(email)}
                          onCheckedChange={() => handleToggleEmail(email)}
                        />
                        <label htmlFor={email} className="text-sm cursor-pointer flex-1 truncate">
                          {email}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Email Automático de Confirmação</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Quando um cliente faz uma reserva, recebe automaticamente um email de confirmação com todos os detalhes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Dicas para Emails Eficazes</h4>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Use assuntos claros e apelativos</li>
                    <li>• Seja breve e direto</li>
                    <li>• Inclua sempre um call-to-action</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}