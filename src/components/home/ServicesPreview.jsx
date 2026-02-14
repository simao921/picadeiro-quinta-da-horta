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
import { useLanguage } from '@/components/LanguageProvider';
import LazyImage from '@/components/ui/LazyImage';
import { DEFAULT_IMAGES } from '@/components/lib/siteImages';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap = {
  'GraduationCap': GraduationCap,
  'Users': Users,
  'Heart': Heart,
  'PartyPopper': PartyPopper,
};

const colorMap = [
  'from-[#4A5D23]/80 to-[#6B7F3A]/80',
  'from-[#8B7355]/80 to-[#A68B6A]/80',
  'from-[#2C3E1F]/80 to-[#4A5D23]/80',
  'from-[#B8956A]/80 to-[#C9A961]/80',
  'from-[#6B5845]/80 to-[#8B7355]/80',
];

export default function ServicesPreview() {
  const { t } = useLanguage();
  
  // Fetch services from database
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  // Filter out services containing "hipoterapia" in title
  const filteredServices = services.filter(service => 
    !service.title?.toLowerCase().includes('hipoterapia')
  );

  // Get only first 3 services for homepage preview
  const displayServices = filteredServices.slice(0, 3);
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
            {t('services_preview_badge')}
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C3E1F] mb-4 text-left max-w-4xl mx-auto"
          >
            {t('services_preview_title')}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-stone-600 max-w-2xl mx-auto text-left"
          >
            {t('services_preview_subtitle')}
          </motion.p>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-lg h-full">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayServices.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${displayServices.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6 lg:gap-8`}>
            {displayServices.map((service, index) => {
              const IconComponent = iconMap[service.icon] || GraduationCap;
              const color = colorMap[index % colorMap.length];
              const imageUrl = service.image_url || DEFAULT_IMAGES[`service_${index + 1}`] || DEFAULT_IMAGES.service_1;
              
              return (
                <motion.div
                  key={service.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl 
                                  transition-all duration-500 h-full">
                    <div className="relative h-48 overflow-hidden">
                      <LazyImage
                        src={imageUrl}
                        alt={service.title || 'Serviço'}
                        className="w-full h-full object-cover transition-transform duration-700 
                                   group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-50 pointer-events-none`} />
                      <div className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-xl 
                                      shadow-lg flex items-center justify-center 
                                      group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-7 h-7 text-[#8B7355]" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2 
                                     group-hover:text-[#8B7355] transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-stone-600 text-sm leading-relaxed mb-4">
                        {service.short_description || service.description || ''}
                      </p>
                      <Link 
                        to={createPageUrl('Services')}
                        className="inline-flex items-center text-[#B8956A] font-medium text-sm 
                                   hover:text-[#8B7355] transition-colors group/link"
                      >
                        {t('learn_more')}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-stone-500">Nenhum serviço disponível no momento.</p>
          </div>
        )}

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
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white px-8 shadow-lg shadow-[#B8956A]/30"
            >
              {t('services_view_all')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}