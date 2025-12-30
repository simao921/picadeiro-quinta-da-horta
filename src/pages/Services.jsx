import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GraduationCap, Users, Heart, PartyPopper, 
  Clock, User, CheckCircle, ArrowRight, Euro 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const iconMap = {
  GraduationCap,
  Users,
  Heart,
  PartyPopper
};

export default function Services() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }, 'order', 100),
    initialData: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-[#2C3E1F]">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
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
            Os Nossos <span className="text-[#C9A961]">Serviços</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-stone-300 max-w-2xl mx-auto"
          >
            Programas personalizados para todas as idades e níveis de experiência
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || GraduationCap;
                
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl 
                                    transition-all duration-500 h-full">
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={service.image_url || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80'}
                          alt={service.title}
                          className="w-full h-full object-cover transition-transform duration-700 
                                     group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2C3E1F]/80 via-[#2C3E1F]/40 to-transparent" />
                        <div className="absolute bottom-4 right-4 w-16 h-16 bg-white rounded-xl 
                                        shadow-lg flex items-center justify-center 
                                        group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-[#4A5D23]" />
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <h3 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-3 
                                       group-hover:text-[#4A5D23] transition-colors">
                          {service.title}
                        </h3>
                        
                        <p className="text-stone-600 leading-relaxed mb-6">
                          {service.description}
                        </p>

                        <div className="space-y-3 mb-6">
                          {service.duration && (
                            <div className="flex items-center gap-3 text-sm text-stone-500">
                              <div className="w-8 h-8 bg-[#4A5D23]/10 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-[#4A5D23]" />
                              </div>
                              <span>{service.duration} minutos por sessão</span>
                            </div>
                          )}
                          
                          {service.max_participants && (
                            <div className="flex items-center gap-3 text-sm text-stone-500">
                              <div className="w-8 h-8 bg-[#4A5D23]/10 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-[#4A5D23]" />
                              </div>
                              <span>Máximo de {service.max_participants} participantes</span>
                            </div>
                          )}
                          
                          {service.price && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 bg-[#C9A961]/10 rounded-lg flex items-center justify-center">
                                <Euro className="w-4 h-4 text-[#C9A961]" />
                              </div>
                              <span className="font-semibold text-[#2C3E1F]">
                                A partir de {service.price}€
                              </span>
                            </div>
                          )}
                        </div>

                        <Link to={createPageUrl('Bookings')}>
                          <Button className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B] text-white">
                            Reservar Agora
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-8 bg-white rounded-2xl shadow-lg"
            >
              <div className="w-16 h-16 bg-[#4A5D23]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#4A5D23]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C3E1F] mb-2">
                Instrutores Certificados
              </h3>
              <p className="text-stone-600 text-sm">
                Equipa experiente e qualificada, incluindo o Bi-Campeão Mundial
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-8 bg-white rounded-2xl shadow-lg"
            >
              <div className="w-16 h-16 bg-[#C9A961]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#C9A961]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C3E1F] mb-2">
                Cavalos Bem Tratados
              </h3>
              <p className="text-stone-600 text-sm">
                Cavalos saudáveis, bem treinados e adequados a cada nível
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-8 bg-white rounded-2xl shadow-lg"
            >
              <div className="w-16 h-16 bg-[#8B7355]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#8B7355]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C3E1F] mb-2">
                Instalações Premium
              </h3>
              <p className="text-stone-600 text-sm">
                Picadeiro coberto e ao ar livre com todas as condições de segurança
              </p>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 text-center bg-gradient-to-r from-[#4A5D23] to-[#6B7F3A] 
                       rounded-3xl p-12 text-white"
          >
            <h2 className="font-serif text-3xl font-bold mb-4">
              Está Pronto para Começar?
            </h2>
            <p className="text-stone-200 mb-8 max-w-2xl mx-auto">
              Marque a sua primeira aula experimental ou entre em contacto para mais informações
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl('Bookings')}>
                <Button size="lg" className="bg-[#C9A961] hover:bg-[#B89A51] text-[#2C3E1F]">
                  Reservar Aula Agora
                </Button>
              </Link>
              <Link to={createPageUrl('Contact')}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Falar Connosco
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}