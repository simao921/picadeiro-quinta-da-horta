import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MapPin, Phone, Mail, Clock, Send, CheckCircle2,
  Facebook, Instagram 
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

  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Create contact message
      await base44.entities.ContactMessage.create(data);
      
      // Send emails
      const emailBody = `
Nova mensagem de contacto do site:

Nome: ${data.name}
Email: ${data.email}
Telefone: ${data.phone || 'Não fornecido'}
Assunto: ${data.subject}

Mensagem:
${data.message}
      `;

      await Promise.all([
        base44.integrations.Core.SendEmail({
          to: 'picadeiroquintadahortagf@gmail.com',
          subject: `Contacto do Site: ${data.subject}`,
          body: emailBody
        }),
        base44.integrations.Core.SendEmail({
          to: 'csofiabartolo@gmail.com',
          subject: `Contacto do Site: ${data.subject}`,
          body: emailBody
        })
      ]);
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Mensagem enviada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-[#2C3E1F]">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1460134846237-51c777df6111?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Entre em <span className="text-[#C9A961]">Contacto</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-stone-300 max-w-2xl mx-auto"
          >
            Estamos aqui para responder a todas as suas questões
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#4A5D23]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-[#4A5D23]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2C3E1F] mb-2">Morada</h3>
                        <p className="text-stone-600 text-sm leading-relaxed">
                          Rua das Hortas 83 – Fonte da Senhora<br />
                          Alcochete, Portugal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#C9A961]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-[#C9A961]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2C3E1F] mb-2">Telefone</h3>
                        <a 
                          href="tel:+351932111786"
                          className="text-stone-600 hover:text-[#4A5D23] transition-colors text-sm"
                        >
                          +351 932 111 786
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#8B7355]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-[#8B7355]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2C3E1F] mb-2">Email</h3>
                        <a 
                          href="mailto:picadeiroquintadahortagf@gmail.com"
                          className="text-stone-600 hover:text-[#4A5D23] transition-colors text-sm block mb-1"
                        >
                          picadeiroquintadahortagf@gmail.com
                        </a>
                        <a 
                          href="mailto:csofiabartolo@gmail.com"
                          className="text-stone-600 hover:text-[#4A5D23] transition-colors text-sm block"
                        >
                          csofiabartolo@gmail.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#4A5D23]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-[#4A5D23]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2C3E1F] mb-2">Horário</h3>
                        <p className="text-stone-600 text-sm">
                          Segunda a Domingo<br />
                          09:00 - 19:00
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex gap-4 pt-4"
              >
                <a 
                  href="#"
                  className="w-12 h-12 bg-[#4A5D23] rounded-xl flex items-center justify-center
                             hover:bg-[#3A4A1B] transition-colors"
                >
                  <Facebook className="w-6 h-6 text-white" />
                </a>
                <a 
                  href="#"
                  className="w-12 h-12 bg-[#C9A961] rounded-xl flex items-center justify-center
                             hover:bg-[#B89A51] transition-colors"
                >
                  <Instagram className="w-6 h-6 text-white" />
                </a>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-4">
                        Mensagem Enviada!
                      </h3>
                      <p className="text-stone-600 mb-6">
                        Obrigado pelo seu contacto. Responderemos em breve.
                      </p>
                      <Button
                        onClick={() => setSubmitted(false)}
                        className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                      >
                        Enviar Nova Mensagem
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-2">
                          Envie-nos uma Mensagem
                        </h2>
                        <p className="text-stone-600">
                          Preencha o formulário e entraremos em contacto consigo.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome *</Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="O seu nome"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+351"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Assunto *</Label>
                          <Input
                            id="subject"
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Sobre o que é?"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem *</Label>
                        <Textarea
                          id="message"
                          required
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="A sua mensagem..."
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitMutation.isPending}
                        className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B] text-white"
                      >
                        {submitMutation.isPending ? (
                          'A enviar...'
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Enviar Mensagem
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl overflow-hidden shadow-2xl h-96"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3113.345!2d-9.0!3d38.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQ1JzAwLjAiTiA5wrAwMCcwMC4wIlc!5e0!3m2!1spt-PT!2spt!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}