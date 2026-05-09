import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MetaTags from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GraduationCap, Users, Heart, PartyPopper, Users2, ArrowRight, Trophy, CheckCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';

const iconMap = {
  'GraduationCap': GraduationCap,
  'Users': Users,
  'Heart': Heart,
  'PartyPopper': PartyPopper,
};

const getDefaultServices = (t) => [
  {
    id: '1',
    title: t('service_private_title'),
    short_description: t('service_private_short'),
    description: t('service_private_desc'),
    price: 45,
    duration: 60,
    max_participants: 1,
    icon: 'GraduationCap',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    features: [t('service_private_feat_1'), t('service_private_feat_2'), t('service_private_feat_3'), t('service_private_feat_4')]
  },
  {
    id: '2',
    title: t('service_group_title'),
    short_description: t('service_group_short'),
    description: t('service_group_desc'),
    price: 30,
    duration: 60,
    max_participants: 4,
    icon: 'Users',
    image_url: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=800&q=80',
    features: [t('service_group_feat_1'), t('service_group_feat_2'), t('service_group_feat_3'), t('service_group_feat_4')]
  },

  {
    id: '4',
    title: t('service_rental_title'),
    short_description: t('service_rental_short'),
    description: t('service_rental_desc'),
    price: 200,
    duration: 180,
    max_participants: 30,
    icon: 'PartyPopper',
    image_url: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=800&q=80',
    features: [t('service_rental_feat_1'), t('service_rental_feat_2'), t('service_rental_feat_3'), t('service_rental_feat_4')]
  },
  {
    id: '5',
    title: t('service_owners_title'),
    short_description: t('service_owners_short'),
    description: t('service_owners_desc'),
    price: null,
    duration: 30,
    max_participants: 1,
    icon: 'Users',
    image_url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80',
    features: [t('service_owners_feat_1'), t('service_owners_feat_2'), t('service_owners_feat_3'), t('service_owners_feat_4')]
  }
];

export default function Services() {
  const { t } = useLanguage();
  const defaultServices = getDefaultServices(t);
  
  const [heroImage, setHeroImage] = useState(DEFAULT_IMAGES.hero_services);

  useEffect(() => {
    const loadImage = async () => {
      const url = await getSiteImage('hero_services', DEFAULT_IMAGES.hero_services);
      setHeroImage(url);
    };
    loadImage();
  }, []);
  
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: defaultServices
  });

  const displayServices = (services && services.length > 0) ? services : defaultServices;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <MetaTags 
        title="Serviços - Picadeiro Quinta da Horta"
        description="Aulas de equitação particulares e em grupo, hipoterapia e aluguer de espaço para eventos. Programas personalizados com o Bi-Campeão Mundial Gilberto Filipe."
        keywords="aulas equitação, aulas particulares cavalos, hipoterapia, eventos cavalos, gilberto filipe"
      />
      
      {/* Cinematic Hero Section */}
      <section className="relative h-[60vh] flex items-center overflow-hidden bg-[#11180D]">
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            className="w-full h-full"
          >
            <LazyImage
              src={heroImage}
              alt="Serviços Equestres"
              className="w-full h-full object-cover opacity-40"
              priority={true}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[#11180D]/40" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-3 px-6 py-2 bg-[#B8956A]/20 backdrop-blur-md rounded-full text-[#B8956A] text-xs font-black uppercase tracking-[0.4em] mb-8">
              <Trophy className="w-4 h-4" />
              {t('services_title')}
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-tight mb-8">
              {t('services_page_title')}
            </h1>
            <p className="text-xl text-stone-300 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('services_page_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Listing */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="space-y-32">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-20">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[500px] rounded-[3rem] bg-stone-100 animate-pulse" />
                ))}
              </div>
            ) : (
              displayServices.map((service, index) => {
                const Icon = iconMap[service.icon] || GraduationCap;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                      {/* Premium Image Column */}
                      <div className={`relative group ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                        <div className="absolute inset-0 bg-[#B8956A] rounded-[3rem] rotate-3 scale-[1.02] opacity-10 group-hover:rotate-0 transition-transform duration-700" />
                        <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-stone-100">
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#11180D]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        
                        {/* Floating Icon Badge */}
                        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center z-20 group-hover:-translate-y-4 group-hover:bg-[#B8956A] transition-all duration-500">
                          <Icon className="w-10 h-10 text-[#2C3E1F] group-hover:text-white transition-colors duration-500" />
                        </div>
                      </div>

                      {/* Content Column */}
                      <div className={`space-y-10 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                        <div className="space-y-4">
                          <Badge className="bg-[#B8956A]/10 text-[#B8956A] border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                            {service.short_description || 'Excelência Equestre'}
                          </Badge>
                          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-[#2C3E1F] leading-tight">
                            {service.title}
                          </h2>
                        </div>
                        
                        <p className="text-lg text-stone-500 font-medium leading-relaxed">
                          {service.description}
                        </p>

                        {/* Features List */}
                        {service.features && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            {service.features.map((feature, i) => (
                              <div key={i} className="flex items-center gap-4 text-sm font-bold text-[#2C3E1F] group/feat">
                                <div className="w-8 h-8 rounded-xl bg-[#2C3E1F]/5 flex items-center justify-center group-hover/feat:bg-[#B8956A] transition-colors duration-300">
                                  <CheckCircle className="w-4 h-4 text-[#B8956A] group-hover/feat:text-white transition-colors" />
                                </div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-8 flex flex-col sm:flex-row gap-6">
                          <Link to={createPageUrl('Bookings')} className="flex-1 sm:flex-none">
                            <Button 
                              size="lg" 
                              className="bg-[#2C3E1F] hover:bg-[#B8956A] text-white h-20 px-12 rounded-2xl text-lg font-black shadow-2xl shadow-[#2C3E1F]/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                            >
                              {t('book_now')}
                              <ArrowRight className="w-6 h-6 ml-4" />
                            </Button>
                          </Link>
                          {service.price && (
                            <div className="h-20 px-8 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center font-black text-[#2C3E1F]">
                              <span className="text-xs uppercase tracking-widest text-stone-400 mr-4">Desde</span>
                              <span className="text-3xl font-serif">€{service.price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Global Contact CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#11180D] rounded-[4rem] p-12 sm:p-20 relative overflow-hidden text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8956A]/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2C3E1F]/20 rounded-full blur-[100px] -ml-48 -mb-48" />
            
            <div className="relative z-10 space-y-10">
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                {t('not_found_services') || 'Procura algo personalizado?'}
              </h2>
              <p className="text-xl text-stone-400 font-medium max-w-2xl mx-auto">
                {t('not_found_services_desc') || 'Estamos disponíveis para criar programas à medida das suas necessidades e ambições equestres.'}
              </p>
              <div className="pt-6">
                <a href="tel:+351932111786">
                  <Button 
                    size="lg" 
                    className="bg-[#B8956A] hover:bg-white text-[#11180D] h-20 px-12 rounded-2xl text-lg font-black shadow-2xl shadow-[#B8956A]/30 transition-all hover:scale-105 active:scale-95"
                  >
                    Contactar Agora
                    <ArrowRight className="w-6 h-6 ml-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}