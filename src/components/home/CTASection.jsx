import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';

export default function CTASection() {
  const { t } = useLanguage();
  const [ctaImage, setCtaImage] = useState(DEFAULT_IMAGES.cta);

  useEffect(() => {
    getSiteImage('cta', DEFAULT_IMAGES.cta).then(setCtaImage);
  }, []);
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <LazyImage
          src={ctaImage}
          alt="Cavalos ao pôr do sol"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/95 via-[#1A1A1A]/85 to-[#1A1A1A]/70" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {t('cta_title')}
              <span className="text-[#B8956A]">{t('cta_title_highlight')}</span>
            </h2>
            
            <p className="text-lg text-stone-300 leading-relaxed mb-8">
              {t('cta_subtitle')}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('Bookings')}>
                <Button 
                  size="lg" 
                  className="bg-[#B8956A] hover:bg-[#8B7355] text-white font-semibold px-8
                             shadow-lg shadow-[#B8956A]/30"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {t('cta_book')}
                </Button>
              </Link>
              <a href="tel:+351932111786" aria-label="Ligar para +351 932 111 786">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {t('cta_call')}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}