import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MapPin, Phone, Mail, Clock, Send, 
  CheckCircle, Loader2, MessageSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      // Save to database
      await base44.entities.ContactMessage.create(data);
      
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: 'picadeiroquintadahortagf@gmail.com',
        subject: `[Website] ${data.subject || 'Nova mensagem de contacto'}`,
        body: `
          <h2>Nova mensagem de contacto</h2>
          <p><strong>Nome:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Telefone:</strong> ${data.phone || 'Não fornecido'}</p>
          <p><strong>Assunto:</strong> ${data.subject || 'Não especificado'}</p>
          <hr />
          <p><strong>Mensagem:</strong></p>
          <p>${data.message}</p>
        `
      });
      
      return data;
    },
    onSuccess: () => {
      toast.success('Mensagem enviada com sucesso!');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Por favor preencha todos os campos obrigatórios.');
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Morada',
      content: 'Rua das Hortas 83 – Fonte da Senhora',
      subcontent: 'Alcochete, Portugal'
    },
    {
      icon: Phone,
      title: 'Telefone',
      content: '+351 932 111 786',
      link: 'tel:+351932111786'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'picadeiroquintadahortagf@gmail.com',
      link: 'mailto:picadeiroquintadahortagf@gmail.com'
    },
    {
      icon: Clock,
      title: 'Horário',
      content: 'Segunda a Sábado',
      subcontent: '9:00 - 19:00'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#2C3E1F] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A961]/20 
                           rounded-full text-[#C9A961] text-sm font-medium mb-6">
              <MessageSquare className="w-4 h-4" />
              Contacte-nos
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Fale
              <span className="text-[#C9A961]"> Connosco</span>
            </h1>
            <p className="text-lg text-stone-300 max-w-2xl mx-auto">
              Estamos aqui para responder a todas as suas questões. 
              Entre em contacto e teremos todo o gosto em ajudá-lo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-8">
                Informações de Contacto
              </h2>
              
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#4A5D23]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-6 h-6 text-[#4A5D23]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#2C3E1F] mb-1">{item.title}</h3>
                            {item.link ? (
                              <a 
                                href={item.link} 
                                className="text-stone-600 hover:text-[#4A5D23] transition-colors"
                              >
                                {item.content}
                              </a>
                            ) : (
                              <p className="text-stone-600">{item.content}</p>
                            )}
                            {item.subcontent && (
                              <p className="text-sm text-stone-500">{item.subcontent}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="mt-8 aspect-video rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d49871.93584785422!2d-8.934373!3d38.756844!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1944a4e4e9c8c7%3A0x3b5d9e3e3e3e3e3e!2sAlcochete%2C%20Portugal!5e0!3m2!1spt-PT!2spt!4v1620000000000!5m2!1spt-PT!2spt"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8 sm:p-12">
                  <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-2">
                    Envie-nos uma Mensagem
                  </h2>
                  <p className="text-stone-600 mb-8">
                    Preencha o formulário abaixo e entraremos em contacto consigo o mais breve possível.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="O seu nome"
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          className="h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+351 912 345 678"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Como podemos ajudar?"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Escreva a sua mensagem aqui..."
                        className="min-h-[150px] resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={sendEmailMutation.isPending}
                      className="w-full sm:w-auto bg-[#4A5D23] hover:bg-[#3A4A1B] text-white h-12 px-8"
                    >
                      {sendEmailMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          A enviar...
                        </>
                      ) : sendEmailMutation.isSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Enviado!
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}