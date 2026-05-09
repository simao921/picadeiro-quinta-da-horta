import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Filter, X } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import MetaTags from '@/components/seo/MetaTags';
import { useLanguage } from '@/components/LanguageProvider';
import { DEFAULT_IMAGES } from '@/components/lib/siteImages';

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [heroImage] = useState(DEFAULT_IMAGES.hero_gallery);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: () => base44.entities.GalleryImage.list('-order', 500),
    initialData: []
  });

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'instalacoes', label: 'Instalações' },
    { value: 'team', label: 'Team' },
    { value: 'titulos', label: 'Títulos' },
    { value: 'aulas', label: 'Aulas', subcategories: [
      { value: 'particulares', label: 'Aulas Particulares' },
      { value: 'grupo', label: 'Aulas em Grupo' }
    ]},
    { value: 'eventos', label: 'Eventos' },
    { value: 'provas', label: 'Provas', subcategories: [
      { value: 'dressage_maneabilidade', label: 'Dressage e Maneabilidade' },
      { value: 'golega', label: 'Golegã' }
    ]}
  ];

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => {
        if (selectedCategory.includes('_')) {
          const [cat, subcat] = selectedCategory.split('_');
          return img.category === cat && img.subcategory === subcat;
        }
        return img.category === selectedCategory;
      });

  const sortedImages = [...filteredImages].sort((a, b) => (b.order || 0) - (a.order || 0));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <MetaTags 
        title={`${t('our_gallery')} - Picadeiro Quinta da Horta`}
        description={t('gallery_subtitle')}
        keywords="galeria equitação, fotos cavalos, eventos hípicos, instalações picadeiro"
      />

      {/* Cinematic Hero Section */}
      <section className="relative h-[50vh] flex items-center overflow-hidden bg-[#11180D]">
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            className="w-full h-full"
          >
            <LazyImage
              src={heroImage}
              alt="Galeria Picadeiro"
              className="w-full h-full object-cover opacity-30"
              priority={true}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-3 px-6 py-2 bg-[#B8956A]/20 backdrop-blur-md rounded-full text-[#B8956A] text-xs font-black uppercase tracking-[0.4em] mb-8">
              <ImageIcon className="w-4 h-4" />
              {t('our_gallery')}
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-tight mb-8">
              Exploração<br />
              <span className="text-[#B8956A] italic">Visual</span>
            </h1>
            <p className="text-xl text-stone-300 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('gallery_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* Category Filter - Premium Tabs Style */}
        <div className="mb-20">
          <div className="flex flex-col items-center gap-12">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map(category => {
                const isActive = selectedCategory === category.value || selectedCategory.startsWith(category.value + '_');
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 border-2 ${
                      isActive
                        ? 'bg-[#2C3E1F] border-[#2C3E1F] text-white shadow-xl scale-105'
                        : 'bg-white border-stone-100 text-stone-400 hover:border-[#B8956A] hover:text-[#B8956A]'
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
            
            {/* Subcategories - Refined Pill Style */}
            <AnimatePresence mode="wait">
              {categories.find(c => c.value === selectedCategory && c.subcategories) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap justify-center gap-3"
                >
                  {categories.find(c => c.value === selectedCategory)?.subcategories?.map(sub => (
                    <button
                      key={sub.value}
                      onClick={() => setSelectedCategory(`${selectedCategory}_${sub.value}`)}
                      className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#B8956A]/20 text-[#8B7355] hover:bg-[#B8956A] hover:text-white transition-all duration-300"
                    >
                      {sub.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Images Grid - Masonry style feel with different aspect ratios if possible, or just very clean grid */}
        {sortedImages.length === 0 ? (
          <div className="text-center py-32 bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-100">
            <ImageIcon className="w-20 h-20 text-stone-200 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-black text-stone-400">
              Nenhuma imagem encontrada
            </h3>
          </div>
        ) : (
          <motion.div 
            layout
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8"
          >
            <AnimatePresence>
              {sortedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="break-inside-avoid relative rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] transition-all duration-700 cursor-pointer group bg-white border border-stone-100"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative overflow-hidden">
                    <LazyImage
                      src={image.image_url}
                      alt={image.title || t('our_gallery')}
                      className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#11180D] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="space-y-3">
                      {image.category && (
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B8956A]">
                          {categories.find(c => c.value === image.category)?.label || image.category}
                        </span>
                      )}
                      {image.title && (
                        <h3 className="text-white font-serif font-bold text-2xl">
                          {image.title}
                        </h3>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Premium Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#11180D]/98 flex items-center justify-center p-6 sm:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              className="absolute top-10 right-10 w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-7xl w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-[3rem] overflow-hidden shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] border border-white/10">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title || t('our_gallery')}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center space-y-4 max-w-2xl"
              >
                {selectedImage.title && (
                  <h3 className="text-white text-4xl font-serif font-black">
                    {selectedImage.title}
                  </h3>
                )}
                {selectedImage.description && (
                  <p className="text-stone-400 text-lg font-medium leading-relaxed">
                    {selectedImage.description}
                  </p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}