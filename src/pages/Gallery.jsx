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
    queryFn: () => base44.entities.GalleryImage.filter({ is_featured: true }),
    initialData: []
  });

  const categories = [
    { value: 'all', label: t('all') || 'Todas' },
    { value: 'aulas', label: 'Aulas' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'cavalos', label: 'Cavalos' },
    { value: 'instalacoes', label: 'Instalações' },
    { value: 'competicoes', label: 'Competições' },
    { value: 'outros', label: 'Outros' }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

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
        title="Galeria - Picadeiro Quinta da Horta"
        description="Veja momentos especiais das nossas aulas, eventos e competições. Conheça os nossos cavalos e instalações."
        keywords="galeria equitação, fotos cavalos, eventos hípicos, instalações picadeiro"
      />

      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1600')] bg-cover bg-center"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <ImageIcon className="w-16 h-16 text-[#B8956A] mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Galeria
            </h1>
            <p className="text-xl text-stone-300 max-w-2xl mx-auto">
              Momentos especiais capturados no Picadeiro Quinta da Horta
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-[#4A5D23]" />
            <h2 className="text-lg font-semibold text-[#2D2D2D]">Filtrar por categoria</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                className={selectedCategory === category.value 
                  ? 'bg-[#4A5D23] hover:bg-[#3A4A1B] text-white' 
                  : 'border-[#4A5D23] text-[#4A5D23] hover:bg-[#4A5D23]/10'
                }
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Images Grid */}
        {sortedImages.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-600 mb-2">
              Nenhuma imagem disponível
            </h3>
            <p className="text-stone-500">
              Não há imagens nesta categoria ainda.
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
                  className="group relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <LazyImage
                    src={image.image_url}
                    alt={image.title || 'Galeria'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {image.title && (
                        <h3 className="text-white font-semibold text-lg mb-1">
                          {image.title}
                        </h3>
                      )}
                      {image.description && (
                        <p className="text-white/90 text-sm line-clamp-2">
                          {image.description}
                        </p>
                      )}
                      {image.category && (
                        <Badge className="mt-2 bg-[#B8956A]">
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
                alt={selectedImage.title || 'Galeria'}
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