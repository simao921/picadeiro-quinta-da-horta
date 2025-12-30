import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Mail, Phone, CheckCircle, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminMessages() {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => base44.entities.ContactMessage.list('-created_date'),
    initialData: []
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactMessage.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-messages']);
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ message, reply }) => {
      await base44.integrations.Core.SendEmail({
        to: message.email,
        subject: `Re: ${message.subject || 'Contacto Picadeiro Quinta da Horta'}`,
        body: `
          <p>Olá ${message.name},</p>
          <p>${reply.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><em>Mensagem original:</em></p>
          <p>${message.message}</p>
          <hr>
          <p>Picadeiro Quinta da Horta<br>
          +351 932 111 786<br>
          picadeiroquintadahortagf@gmail.com</p>
        `
      });
      
      await base44.entities.ContactMessage.update(message.id, { 
        is_read: true,
        replied_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-messages']);
      setSelectedMessage(null);
      setReplyText('');
      toast.success('Resposta enviada!');
    },
    onError: () => {
      toast.error('Erro ao enviar resposta');
    }
  });

  const openMessage = (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <AdminLayout currentPage="AdminMessages">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Mensagens de Contacto</h1>
          <p className="text-stone-500">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
          </p>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#4A5D23]" />
          </div>
        ) : messages.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-stone-300" />
              <p className="text-stone-500">Nenhuma mensagem recebida</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !message.is_read ? 'border-l-4 border-l-[#4A5D23] bg-[#4A5D23]/5' : ''
                }`}
                onClick={() => openMessage(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#2C3E1F]">{message.name}</span>
                        {!message.is_read && (
                          <Badge className="bg-[#4A5D23] text-white text-xs">Nova</Badge>
                        )}
                        {message.replied_at && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Respondida
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-stone-500 mb-1">{message.email}</p>
                      {message.subject && (
                        <p className="font-medium text-sm mb-1">{message.subject}</p>
                      )}
                      <p className="text-sm text-stone-600 line-clamp-2">{message.message}</p>
                    </div>
                    <div className="text-right text-sm text-stone-400">
                      {message.created_date && format(new Date(message.created_date), "d MMM", { locale: pt })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mensagem de Contacto</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">De</p>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Data</p>
                    <p className="font-medium">
                      {selectedMessage.created_date && format(new Date(selectedMessage.created_date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: pt })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <a href={`mailto:${selectedMessage.email}`} className="flex items-center gap-2 text-sm text-[#4A5D23] hover:underline">
                    <Mail className="w-4 h-4" />
                    {selectedMessage.email}
                  </a>
                  {selectedMessage.phone && (
                    <a href={`tel:${selectedMessage.phone}`} className="flex items-center gap-2 text-sm text-[#4A5D23] hover:underline">
                      <Phone className="w-4 h-4" />
                      {selectedMessage.phone}
                    </a>
                  )}
                </div>

                {selectedMessage.subject && (
                  <div>
                    <p className="text-sm text-stone-500">Assunto</p>
                    <p className="font-medium">{selectedMessage.subject}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-stone-500 mb-2">Mensagem</p>
                  <div className="p-4 bg-stone-50 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {!selectedMessage.replied_at && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-stone-500 mb-2">Responder</p>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva a sua resposta..."
                      className="min-h-[100px]"
                    />
                    <Button
                      onClick={() => sendReplyMutation.mutate({ message: selectedMessage, reply: replyText })}
                      disabled={!replyText || sendReplyMutation.isPending}
                      className="mt-3 bg-[#4A5D23] hover:bg-[#3A4A1B]"
                    >
                      {sendReplyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Enviar Resposta
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}