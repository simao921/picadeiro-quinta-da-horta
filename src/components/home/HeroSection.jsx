import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80"
          alt="Cavalo elegante"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C3E1F]/90 via-[#2C3E1F]/70 to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-[#C9A961]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#4A5D23]/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A961]/20 backdrop-blur-sm 
                           rounded-full text-[#C9A961] text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[#C9A961] rounded-full animate-pulse" />
              Centro Equestre de Excelência
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6"
          >
            Picadeiro
            <span className="block text-[#C9A961]">Quinta da Horta</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-stone-300 leading-relaxed mb-8 max-w-lg"
          >
            Descubra a arte da equitação com o <strong className="text-white">Bi-Campeão do Mundo Gilberto Filipe</strong>. 
            Oferecemos aulas personalizadas, hipoterapia e experiências únicas com cavalos num ambiente natural e&nbsp;acolhedor.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link to={createPageUrl('Bookings')}>
              <Button 
                size="lg" 
                className="bg-[#C9A961] hover:bg-[#B89A51] text-[#2C3E1F] font-semibold px-8 
                           shadow-lg shadow-[#C9A961]/30 transition-all duration-300 hover:scale-105"
              >
                Reservar Aula
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('Services')}>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#2C3E1F] backdrop-blur-sm px-8 transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Conhecer Serviços
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-8 mt-12 pt-8 border-t border-white/20"
          >
            <div>
              <p className="text-3xl font-bold text-[#C9A961]">15+</p>
              <p className="text-sm text-stone-400">Anos de Experiência</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#C9A961]">500+</p>
              <p className="text-sm text-stone-400">Alunos Formados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#C9A961]">2x</p>
              <p className="text-sm text-stone-400">Campeão Mundial</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-[#C9A961] rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}