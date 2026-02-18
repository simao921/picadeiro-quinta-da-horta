import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Award, Shield, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';

export default function AboutSection() {
  const { t } = useLanguage();
  const [aboutImages, setAboutImages] = useState({
    decorative: DEFAULT_IMAGES.about_decorative,
    grid1: DEFAULT_IMAGES.about_grid_1,
    grid2: DEFAULT_IMAGES.about_grid_2,
    grid3: DEFAULT_IMAGES.about_grid_3,
    grid4: DEFAULT_IMAGES.about_grid_4,
  });

  useEffect(() => {
    Promise.all([
      getSiteImage('about_decorative', DEFAULT_IMAGES.about_decorative),
      getSiteImage('about_grid_1', DEFAULT_IMAGES.about_grid_1),
      getSiteImage('about_grid_2', DEFAULT_IMAGES.about_grid_2),
      getSiteImage('about_grid_3', DEFAULT_IMAGES.about_grid_3),
      getSiteImage('about_grid_4', DEFAULT_IMAGES.about_grid_4),
    ]).then(([decorative, grid1, grid2, grid3, grid4]) => {
      setAboutImages({ decorative, grid1, grid2, grid3, grid4 });
    });
  }, []);
  
  const features = [
    {
      icon: Award,
      titleKey: 'about_feature_1',
      descKey: 'about_feature_1_desc'
    },
    {
      icon: Shield,
      titleKey: 'about_feature_2',
      descKey: 'about_feature_2_desc'
    },
    {
      icon: Heart,
      titleKey: 'about_feature_3',
      descKey: 'about_feature_3_desc'
    },
    {
      icon: Users,
      titleKey: 'about_feature_4',
      descKey: 'about_feature_4_desc'
    }
  ];
  return (
    <section className="py-24 bg-[#1A1A1A] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 hidden lg:block">
        <LazyImage
          src={aboutImages.decorative}
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
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/20 
                           rounded-full text-[#B8956A] text-sm font-medium mb-6">
              {t('about_badge')}
            </span>
            
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
              {t('about_title')}
            </h2>
            
            <p className="text-stone-300 text-base leading-relaxed mb-6">
              {t('about_p1')}
            </p>
            
            <p className="text-stone-400 text-base leading-relaxed mb-8">
              {t('about_p2')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-sm"
                >
                  <div className="w-10 h-10 bg-[#B8956A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-[#B8956A]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{t(feature.titleKey)}</h4>
                    <p className="text-stone-400 text-xs">{t(feature.descKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <a href="tel:+351932111786">
              <Button 
                size="lg" 
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white font-semibold"
              >
                Ligar agora
              </Button>
            </a>
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
                <div className="aspect-[4/5] rounded-2xl overflow-hidden relative">
                  <LazyImage
                    src={aboutImages.grid1}
                    alt="Cavalo elegante"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <LazyImage
                    src={aboutImages.grid2}
                    alt="Aula de equitação"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <LazyImage
                    src={aboutImages.grid3}
                    alt="Instalações"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden relative">
                  <LazyImage
                    src={aboutImages.grid4}
                    alt="Equitação"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6 max-w-xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#8B7355] rounded-xl flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-[#1A1A1A]">15+ {t('about_years')}</p>
                  <p className="text-stone-500 text-sm">{t('about_experience')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
