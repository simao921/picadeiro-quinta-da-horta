import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LazyImage from '@/components/ui/LazyImage';

const testimonials = [
  {
    name: 'Maria Santos',
    role: 'Mãe de Aluno',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    text: 'O meu filho adora as aulas no Picadeiro. A equipa é fantástica e o ambiente é muito seguro. Recomendo a todas as famílias!',
    rating: 5
  },
  {
    name: 'João Ferreira',
    role: 'Aluno Avançado',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    text: 'Treinar com o Gilberto Filipe foi um sonho realizado. A sua experiência e paciência fazem toda a diferença no nosso progresso.',
    rating: 5
  },
  {
    name: 'Ana Costa',
    role: 'Mãe de Aluno',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    text: 'As aulas transformaram a vida do meu filho. O carinho e profissionalismo da equipa são incomparáveis.',
    rating: 5
  }
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % testimonials.length), []);
  const prev = useCallback(() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length), []);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-stone-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#C9A961]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4A5D23]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A5D23]/10 rounded-full 
                       text-[#4A5D23] text-sm font-medium mb-4"
          >
            <Quote className="w-4 h-4" />
            Testemunhos
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C3E1F] mb-4"
          >
            O Que Dizem os
            <span className="text-[#C9A961]"> Nossos Clientes</span>
          </motion.h2>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col items-center text-center">
                    {/* Quote Icon */}
                    <div className="w-16 h-16 bg-[#C9A961]/20 rounded-full flex items-center justify-center mb-6">
                      <Quote className="w-8 h-8 text-[#C9A961]" />
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonials[current].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#C9A961] text-[#C9A961]" />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-lg sm:text-xl text-stone-700 leading-relaxed mb-8 max-w-2xl italic">
                      "{testimonials[current].text}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <LazyImage
                        src={testimonials[current].image}
                        alt={testimonials[current].name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#C9A961]"
                      />
                      <div className="text-left">
                        <p className="font-semibold text-[#2C3E1F]">{testimonials[current].name}</p>
                        <p className="text-sm text-stone-500">{testimonials[current].role}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full border-[#4A5D23] text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  aria-label={`Ver testemunho ${index + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A961] focus:ring-offset-2 ${
                    index === current 
                      ? 'bg-[#C9A961] w-8' 
                      : 'bg-stone-300 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full border-[#4A5D23] text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}