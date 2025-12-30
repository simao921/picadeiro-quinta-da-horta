import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1460134846237-51c777df6111?w=1920&q=80"
          alt="Cavalos ao pôr do sol"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C3E1F]/95 via-[#2C3E1F]/85 to-[#2C3E1F]/70" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Pronto para Começar a Sua
              <span className="text-[#C9A961]"> Jornada Equestre?</span>
            </h2>
            
            <p className="text-lg text-stone-300 leading-relaxed mb-8">
              Dê o primeiro passo para uma experiência única com cavalos. 
              Reserve a sua primeira aula experimental ou entre em contacto 
              para mais informações.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('Bookings')}>
                <Button 
                  size="lg" 
                  className="bg-[#C9A961] hover:bg-[#B89A51] text-[#2C3E1F] font-semibold px-8
                             shadow-lg shadow-[#C9A961]/30"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar Aula
                </Button>
              </Link>
              <a href="tel:+351932111786">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Ligar Agora
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Right - Quick Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 
                           hover:bg-white/20 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Aula Experimental</h3>
                  <p className="text-stone-300 text-sm">
                    Experimente uma aula introdutória e descubra o mundo da equitação.
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-[#C9A961] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 
                           hover:bg-white/20 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Visita às Instalações</h3>
                  <p className="text-stone-300 text-sm">
                    Agende uma visita para conhecer o nosso espaço e os nossos cavalos.
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-[#C9A961] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 
                           hover:bg-white/20 transition-colors group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Pacotes Mensais</h3>
                  <p className="text-stone-300 text-sm">
                    Descubra os nossos planos com condições especiais para alunos regulares.
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-[#C9A961] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}