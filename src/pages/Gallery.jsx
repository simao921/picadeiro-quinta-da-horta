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

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

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
    <div className="min-h-screen bg-stone-50">
      <MetaTags 
        title={`${t('our_gallery')} - Picadeiro Quinta da Horta`}
        description={t('gallery_subtitle')}
        keywords="galeria equitação, fotos cavalos, eventos hípicos, instalações picadeiro"
      />

      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1600')] bg-cover bg-center"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-900/50"></div>
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
              {t('our_gallery')}
            </h1>
            <p className="text-xl md:text-2xl text-stone-300 max-w-3xl mx-auto font-light">
              {t('gallery_subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-full flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#2D2D2D]">{t('filters')}</h2>
              <p className="text-stone-600 text-sm">{t('gallery_subtitle')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <Button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  variant={selectedCategory === category.value || selectedCategory.startsWith(category.value + '_') ? 'default' : 'outline'}
                  className={`transition-all duration-300 ${selectedCategory === category.value || selectedCategory.startsWith(category.value + '_')
                    ? 'bg-gradient-to-r from-[#B8956A] to-[#8B7355] hover:from-[#A08560] hover:to-[#7B6545] text-white shadow-lg scale-105' 
                    : 'border-[#B8956A] text-[#8B7355] hover:bg-[#B8956A]/10 hover:border-[#8B7355]'
                  }`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
            
            {/* Subcategories */}
            {categories.find(c => c.value === selectedCategory && c.subcategories) && (
              <div className="flex flex-wrap gap-2 ml-8">
                {categories.find(c => c.value === selectedCategory)?.subcategories?.map(sub => (
                  <Button
                    key={sub.value}
                    onClick={() => setSelectedCategory(`${selectedCategory}_${sub.value}`)}
                    variant="outline"
                    size="sm"
                    className="border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355]/10"
                  >
                    {sub.label}
                  </Button>
                ))}
              </div>
            )}
            
            {selectedCategory.includes('_') && (
              <div className="flex flex-wrap gap-2 ml-8">
                {(() => {
                  const [mainCat] = selectedCategory.split('_');
                  const mainCategory = categories.find(c => c.value === mainCat);
                  return mainCategory?.subcategories?.map(sub => (
                    <Button
                      key={sub.value}
                      onClick={() => setSelectedCategory(`${mainCat}_${sub.value}`)}
                      variant={selectedCategory === `${mainCat}_${sub.value}` ? 'default' : 'outline'}
                      size="sm"
                      className={selectedCategory === `${mainCat}_${sub.value}`
                        ? 'bg-gradient-to-r from-[#8B7355] to-[#6B5845] text-white'
                        : 'border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355]/10'
                      }
                    >
                      {sub.label}
                    </Button>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Images Grid */}
        {sortedImages.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-600 mb-2">
              {t('no_images')}
            </h3>
            <p className="text-stone-500">
              {t('no_images')}
            </p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {sortedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-[#B8956A]"
                  onClick={() => setSelectedImage(image)}
                >
                  <LazyImage
                    src={image.image_url}
                    alt={image.title || t('our_gallery')}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/90 via-[#1A1A1A]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {image.title && (
                        <h3 className="text-white font-serif font-bold text-xl mb-2">
                          {image.title}
                        </h3>
                      )}
                      {image.description && (
                        <p className="text-white/95 text-sm line-clamp-2 mb-3">
                          {image.description}
                        </p>
                      )}
                      {image.category && (
                        <Badge className="bg-gradient-to-r from-[#B8956A] to-[#8B7355] border-0 shadow-lg">
                          {categories.find(c => c.value === image.category)?.label || image.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-6xl max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title || t('our_gallery')}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              {(selectedImage.title || selectedImage.description) && (
                <div className="mt-4 text-center">
                  {selectedImage.title && (
                    <h3 className="text-white text-2xl font-serif font-bold mb-2">
                      {selectedImage.title}
                    </h3>
                  )}
                  {selectedImage.description && (
                    <p className="text-stone-300 text-lg">
                      {selectedImage.description}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}