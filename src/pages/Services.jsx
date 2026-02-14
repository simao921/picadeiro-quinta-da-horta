import React from 'react';
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
  GraduationCap, Users, Heart, PartyPopper, Euro, Users2, ArrowRight, Trophy, CheckCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';

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
  
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: defaultServices
  });

  const displayServices = (services && services.length > 0) ? services : defaultServices;

  return (
    <div className="min-h-screen bg-stone-50">
      <MetaTags 
        title="Serviços - Picadeiro Quinta da Horta"
        description="Aulas de equitação particulares e em grupo, hipoterapia e aluguer de espaço para eventos. Programas personalizados com o Bi-Campeão Mundial Gilberto Filipe."
        keywords="aulas equitação, aulas particulares cavalos, hipoterapia, eventos cavalos, gilberto filipe"
      />
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1460134846237-51c777df6111?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 sm:top-20 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-[#B8956A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-[#8B7355]/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#B8956A]/20 backdrop-blur-sm 
                           rounded-full text-[#B8956A] text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('services_title')}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6 px-4">
              {t('services_page_title')}
            </h1>
            <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed px-4">
              {t('services_page_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12 md:space-y-16">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-64 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-10 w-32" />
                    </CardContent>
                  </Card>
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
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-xl bg-white">
                      <div className={`grid grid-cols-1 lg:grid-cols-2 ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                        {/* Image */}
                        <div className={`relative h-56 sm:h-72 md:h-80 lg:h-auto ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent lg:hidden" />
                          <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                            <Badge className="bg-[#C9A961] text-[#2C3E1F] px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm">
                              <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {service.short_description || 'Destaque'}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className={`p-5 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C3E1F] mb-3 sm:mb-4">
                            {service.title}
                          </h2>
                          <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-4 sm:mb-6">
                            {service.description}
                          </p>

                          {/* Features */}
                          {service.features && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                              {service.features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-stone-600">
                                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4A5D23] flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Info Cards */}
                          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
                            {service.max_participants && (
                              <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-100 rounded-lg">
                                <Users2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600" />
                                <span className="text-sm sm:text-base text-stone-600">Máx. {service.max_participants}</span>
                              </div>
                            )}
                          </div>

                          <Link to={createPageUrl('Bookings')}>
                            <Button 
                              size="lg" 
                              className="bg-[#B8956A] hover:bg-[#8B7355] text-white w-full sm:w-fit shadow-lg shadow-[#B8956A]/30 text-sm sm:text-base"
                            >
                              {t('book_now')}
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-r from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#B8956A] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#8B7355] rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('not_found_services') || 'Não encontrou o que procurava?'}
          </h2>
          <p className="text-stone-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
            {t('not_found_services_desc') || 'Entre em contacto connosco para soluções personalizadas.'}
          </p>
          <Link to={createPageUrl('Contact')}>
            <Button 
              size="lg" 
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white font-semibold shadow-lg shadow-[#B8956A]/30 px-6 sm:px-8 w-full sm:w-auto text-sm sm:text-base"
            >
              {t('talk_to_us') || 'Fale Connosco'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}