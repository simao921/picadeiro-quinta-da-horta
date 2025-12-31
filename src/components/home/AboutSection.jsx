import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Award, Shield, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Award,
    title: 'Bi-Campeão Mundial',
    description: 'Gilberto Filipe, instrutor principal'
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    description: 'Protocolos rigorosos de segurança'
  },
  {
    icon: Heart,
    title: 'Paixão pelos Cavalos',
    description: 'Cuidado e respeito animal'
  },
  {
    icon: Users,
    title: 'Comunidade',
    description: 'Ambiente familiar acolhedor'
  }
];

export default function AboutSection() {
  return (
    <section className="py-24 bg-[#2C3E1F] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
        <img
          src="https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A961]/20 
                           rounded-full text-[#C9A961] text-sm font-medium mb-6">
              Sobre Nós
            </span>
            
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
              Uma Tradição de Excelência&nbsp;Equestre
            </h2>
            
            <p className="text-stone-300 text-base leading-relaxed mb-6">
              O Picadeiro Quinta da Horta é mais do que um centro equestre — é um lugar onde a paixão pelos cavalos encontra a excelência no ensino. Localizado na bela região de Alcochete, oferecemos um ambiente natural e tranquilo para a prática da&nbsp;equitação.
            </p>
            
            <p className="text-stone-400 text-base leading-relaxed mb-8">
              Sob a orientação do <strong className="text-stone-200">Bi-Campeão do Mundo Gilberto Filipe</strong>, desenvolvemos programas personalizados que respeitam o ritmo de cada aluno, desde iniciantes aos mais&nbsp;experientes.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-sm"
                >
                  <div className="w-10 h-10 bg-[#C9A961]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#C9A961]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{feature.title}</h4>
                    <p className="text-stone-400 text-xs">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link to={createPageUrl('Contact')}>
              <Button 
                size="lg" 
                className="bg-[#C9A961] hover:bg-[#B89A51] text-[#2C3E1F] font-semibold"
              >
                Contacte-nos
              </Button>
            </Link>
          </motion.div>

          {/* Right Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80"
                    alt="Cavalo elegante"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
                    alt="Aula de equitação"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=400&q=80"
                    alt="Instalações"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=600&q=80"
                    alt="Equitação"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6 max-w-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#4A5D23] rounded-xl flex items-center justify-center">
                  <Award className="w-8 h-8 text-[#C9A961]" />
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-[#2C3E1F]">15+ Anos</p>
                  <p className="text-stone-500 text-sm">de Experiência</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}