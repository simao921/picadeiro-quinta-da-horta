import React from 'react';
import MetaTags from '@/components/seo/MetaTags';
import HeroSection from '@/components/home/HeroSection';
import ServicesPreview from '@/components/home/ServicesPreview';
import AboutSection from '@/components/home/AboutSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  return (
    <div>
      <MetaTags 
        title="Picadeiro Quinta da Horta - Centro Equestre de Excelência em Alcochete"
        description="Centro equestre de excelência em Alcochete. Aulas de equitação e eventos com o Bi-Campeão Mundial Gilberto Filipe. Experimente a paixão pelos cavalos!"
        keywords="equitação alcochete, aulas de equitação, cavalos portugal, picadeiro, gilberto filipe campeão, centro equestre, aulas cavalos, eventos cavalos"
      />
      <HeroSection />
      <ServicesPreview />
      <AboutSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}