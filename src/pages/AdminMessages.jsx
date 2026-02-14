import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Mail, Phone, Clock, CheckCircle, Send, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: () => base44.entities.ContactMessage.list('-created_date', 200)
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactMessage.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-messages']);
      toast.success('Mensagem marcada como lida');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactMessage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-messages']);
      toast.success('Mensagem eliminada');
      setSelectedMessage(null);
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ messageId, email, subject, replyText }) => {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Re: ${subject}`,
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #B8956A 0%, #8B7355 100%); padding: 40px 30px; text-align: center;">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                             alt="Picadeiro Quinta da Horta" 
                             style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid white; margin-bottom: 15px;">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Picadeiro Quinta da Horta</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px; letter-spacing: 2px;">RESPOSTA À SUA MENSAGEM</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px; background-color: #f9f9f9;">
                        <div style="color: #333; line-height: 1.8; font-size: 16px;">
                          ${replyText.replace(/\n/g, '<br>')}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #2D2D2D; padding: 30px; text-align: center;">
                        <p style="color: #B8956A; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">📞 Entre em Contacto</p>
                        <p style="color: #fff; margin: 5px 0; font-size: 14px;">
                          <a href="tel:+351932111786" style="color: #B8956A; text-decoration: none;">+351 932 111 786</a>
                        </p>
                        <p style="color: #fff; margin: 5px 0; font-size: 14px;">
                          <a href="mailto:picadeiroquintadahortagf@gmail.com" style="color: #B8956A; text-decoration: none;">picadeiroquintadahortagf@gmail.com</a>
                        </p>
                        <p style="color: rgba(255,255,255,0.6); margin: 15px 0 0 0; font-size: 12px;">
                          Rua das Hortas - Fonte da Senhora<br>
                          2890-106 Alcochete, Portugal
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      await base44.entities.ContactMessage.update(messageId, { 
        replied_at: new Date().toISOString(),
        is_read: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-messages']);
      toast.success('Resposta enviada com sucesso!');
      setReplyText('');
      setSelectedMessage(null);
    },
    onError: (error) => {
      toast.error('Erro ao enviar resposta: ' + error.message);
    }
  });

  const unreadCount = messages.filter(m => !m.is_read).length;
  const repliedCount = messages.filter(m => m.replied_at).length;

  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) {
      toast.error('Por favor escreva uma resposta');
      return;
    }
    sendReplyMutation.mutate({
      messageId: selectedMessage.id,
      email: selectedMessage.email,
      subject: selectedMessage.subject,
      replyText
    });
  };

  return (
    <AdminLayout currentPage="AdminMessages">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Mensagens de Clientes</h1>
            <p className="text-stone-600 mt-1">Veja e responda às mensagens recebidas</p>
          </div>
          <MessageSquare className="w-8 h-8 text-[#4A5D23]" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#4A5D23]">{messages.length}</div>
              <p className="text-xs text-stone-600">mensagens recebidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Não Lidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{unreadCount}</div>
              <p className="text-xs text-stone-600">aguardam leitura</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Respondidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{repliedCount}</div>
              <p className="text-xs text-stone-600">com resposta enviada</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mensagens Recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4A5D23] mx-auto"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">Sem mensagens recebidas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <Card 
                    key={message.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${!message.is_read ? 'bg-blue-50 border-blue-200' : ''}`}
                    onClick={() => handleViewMessage(message)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-[#2C3E1F]">{message.name}</h3>
                            {!message.is_read && (
                              <Badge className="bg-blue-600 text-white">Nova</Badge>
                            )}
                            {message.replied_at && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Respondida
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-stone-600 mb-1">
                            <strong>Assunto:</strong> {message.subject || 'Sem assunto'}
                          </p>
                          <p className="text-sm text-stone-600 line-clamp-2 mb-2">
                            {message.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {message.email}
                            </span>
                            {message.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {message.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(message.created_date), "d 'de' MMM, HH:mm", { locale: pt })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMessage(message);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mensagem de {selectedMessage?.name}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-500" />
                  <span className="text-sm font-medium">Email:</span>
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm text-blue-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-500" />
                    <span className="text-sm font-medium">Telefone:</span>
                    <a href={`tel:${selectedMessage.phone}`} className="text-sm text-blue-600 hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span className="text-sm font-medium">Data:</span>
                  <span className="text-sm">{format(new Date(selectedMessage.created_date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Assunto:</h4>
                <p className="text-sm text-stone-700">{selectedMessage.subject || 'Sem assunto'}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Mensagem:</h4>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {selectedMessage.replied_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Respondida em {format(new Date(selectedMessage.replied_at), "d 'de' MMM 'às' HH:mm", { locale: pt })}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Responder à mensagem</Label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva a sua resposta..."
                    rows={6}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => deleteMutation.mutate(selectedMessage.id)}
                    className="text-red-600 border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendReplyMutation.isPending}
                    className="bg-[#4A5D23] hover:bg-[#3A4D1A]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendReplyMutation.isPending ? 'A enviar...' : 'Enviar Resposta'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}