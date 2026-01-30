import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';

export default function HeroSection() {
  const { t } = useLanguage();
  const [heroImage, setHeroImage] = useState(DEFAULT_IMAGES.hero_home);

  useEffect(() => {
    const loadImage = async () => {
      const url = await getSiteImage('hero_home', DEFAULT_IMAGES.hero_home);
      setHeroImage(url);
    };
    loadImage();
  }, []);
  
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <LazyImage
          src={heroImage}
          alt="Cavalo elegante"
          className="w-full h-full object-cover"
          priority={true}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/90 via-[#1A1A1A]/70 to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-[#B8956A]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#8B7355]/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/20 backdrop-blur-sm 
                           rounded-full text-[#B8956A] text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-[#B8956A] rounded-full animate-pulse" />
              {t('hero_badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6"
          >
            {t('hero_title')}
            <span className="block text-[#B8956A]">{t('hero_title_highlight')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-stone-300 leading-relaxed mb-8 max-w-lg"
          >
            {t('hero_description')}
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
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white font-semibold px-8 
                           shadow-lg shadow-[#B8956A]/30 transition-all duration-300 hover:scale-105"
              >
                {t('hero_cta_primary')}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl('Services')}>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white/80 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm px-8 transition-all"
              >
                {t('hero_cta_secondary')}
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-6 sm:gap-8 mt-12 pt-8 border-t border-white/20"
          >
            <div className="min-w-[80px]">
              <p className="text-3xl font-bold text-[#B8956A]">15+</p>
              <p className="text-sm text-stone-400">{t('hero_stat_1')}</p>
            </div>
            <div className="min-w-[80px]">
              <p className="text-3xl font-bold text-[#B8956A]">500+</p>
              <p className="text-sm text-stone-400">{t('hero_stat_2')}</p>
            </div>
            <div className="min-w-[80px]">
              <p className="text-3xl font-bold text-[#B8956A]">2x</p>
              <p className="text-sm text-stone-400">{t('hero_stat_3')}</p>
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
            className="w-1.5 h-1.5 bg-[#B8956A] rounded-full"
            />
        </div>
      </motion.div>
    </section>
  );
}