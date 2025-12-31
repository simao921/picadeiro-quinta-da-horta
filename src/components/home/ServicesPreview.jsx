import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, Users, Heart, PartyPopper, 
  ArrowRight, Trophy 
} from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
  {
    icon: GraduationCap,
    title: 'Aulas Particulares',
    description: 'Aulas individuais com monitores experientes ou com o Bi-Campeão Mundial Gilberto Filipe.',
    highlight: 'Exclusivo',
    color: 'from-[#4A5D23]/80 to-[#6B7F3A]/80',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
  },
  {
    icon: Users,
    title: 'Aulas em Grupo',
    description: 'Aulas com até 4 alunos, promovendo aprendizagem colaborativa e socialização.',
    highlight: 'Máx. 4 alunos',
    color: 'from-[#8B7355]/80 to-[#A68B6A]/80',
    image: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=600&q=80'
  },
  {
    icon: Heart,
    title: 'Hipoterapia',
    description: 'Terapia assistida por cavalos para desenvolvimento físico, emocional e cognitivo.',
    highlight: 'Terapia',
    color: 'from-[#C9A961]/80 to-[#DFC17A]/80',
    image: 'https://images.unsplash.com/photo-1508881598441-324f3974994b?w=600&q=80'
  },
  {
    icon: PartyPopper,
    title: 'Aluguer de Espaço',
    description: 'Espaço único para eventos, festas de aniversário e celebrações especiais.',
    highlight: 'Eventos',
    color: 'from-[#2C3E1F]/80 to-[#4A5D23]/80',
    image: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=600&q=80'
  }
];

export default function ServicesPreview() {
  return (
    <section className="py-24 bg-gradient-to-b from-stone-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%234A5D23" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/10 rounded-full 
                       text-[#8B7355] text-sm font-medium mb-4"
          >
            <Trophy className="w-4 h-4" />
            Os Nossos Serviços
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C3E1F] mb-4 text-left max-w-4xl mx-auto"
          >
            Experiências Equestres de&nbsp;Excelência
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-stone-600 max-w-2xl mx-auto text-left"
          >
            Desde iniciantes a cavaleiros experientes, oferecemos programas personalizados para todas as idades e&nbsp;níveis.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl 
                              transition-all duration-500 h-full">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 
                               group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-50`} />
                  <div className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-xl 
                                  shadow-lg flex items-center justify-center 
                                  group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-7 h-7 text-[#8B7355]" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2 
                                 group-hover:text-[#8B7355] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <Link 
                    to={createPageUrl('Services')}
                    className="inline-flex items-center text-[#4A5D23] font-medium text-sm 
                               hover:text-[#C9A961] transition-colors group/link"
                  >
                    Saber Mais
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to={createPageUrl('Services')}>
            <Button 
              size="lg" 
              className="bg-[#8B7355] hover:bg-[#6B5845] text-white px-8"
            >
              Ver Todos os Serviços
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}