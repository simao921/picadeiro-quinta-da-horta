import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Camera, X, ChevronLeft, ChevronRight, 
  Grid3X3, LayoutGrid 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';

export default function Gallery() {
  const { t } = useLanguage();
  
  const categories = [
    { id: 'all', labelKey: 'all_categories' },
    { id: 'aulas', labelKey: 'classes' },
    { id: 'eventos', labelKey: 'events' },
    { id: 'cavalos', labelKey: 'horses' },
    { id: 'instalacoes', labelKey: 'facilities' },
    { id: 'competicoes', labelKey: 'competitions' }
  ];

const defaultImages = [
  { id: '1', image_url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80', title: 'Cavalo no Campo', category: 'cavalos', is_featured: true },
  { id: '2', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', title: 'Aula de Equitação', category: 'aulas' },
  { id: '3', image_url: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=800&q=80', title: 'Treino em Grupo', category: 'aulas' },
  { id: '4', image_url: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=800&q=80', title: 'Picadeiro Principal', category: 'instalacoes' },
  { id: '5', image_url: 'https://images.unsplash.com/photo-1508881598441-324f3974994b?w=800&q=80', title: 'Momento Especial', category: 'eventos' },
  { id: '6', image_url: 'https://images.unsplash.com/photo-1460134846237-51c777df6111?w=800&q=80', title: 'Cavalos ao Pôr do Sol', category: 'instalacoes', is_featured: true },
  { id: '7', image_url: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800&q=80', title: 'Cavalo Branco em Treino', category: 'cavalos' },
  { id: '8', image_url: 'https://images.unsplash.com/photo-1566068256805-4aeacd8ca92d?w=800&q=80', title: 'Competição de Saltos', category: 'competicoes', is_featured: true },
  { id: '9', image_url: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800&q=80', title: 'Arena de Treino', category: 'instalacoes' },
  { id: '10', image_url: 'https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=800&q=80', title: 'Evento Especial', category: 'eventos' },
  { id: '11', image_url: 'https://images.unsplash.com/photo-1628605210289-d24c3a5d9bc3?w=800&q=80', title: 'Cavaleiro em Ação', category: 'competicoes' },
  { id: '12', image_url: 'https://images.unsplash.com/photo-1593179508887-c4b67aba5ad0?w=800&q=80', title: 'Cavalo Castanho no Prado', category: 'cavalos' },
  { id: '13', image_url: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800&q=80', title: 'Cavalos Pastando', category: 'cavalos' },
  { id: '14', image_url: 'https://images.unsplash.com/photo-1590584469252-d8ce95fe7467?w=800&q=80', title: 'Treino Matinal', category: 'aulas' },
  { id: '15', image_url: 'https://images.unsplash.com/photo-1596514072553-a8dd03e41903?w=800&q=80', title: 'Equitação ao Ar Livre', category: 'aulas' },
  { id: '16', image_url: 'https://images.unsplash.com/photo-1502920514313-52581002a659?w=800&q=80', title: 'Competição Nacional', category: 'competicoes' }
];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => base44.entities.GalleryImage.list(),
    initialData: []
  });

  const images = galleryImages.length > 0 ? galleryImages : defaultImages;
  
  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  const openLightbox = (index) => {
    setCurrentImage(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#B8956A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#8B7355]/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/20 backdrop-blur-sm 
                           rounded-full text-[#B8956A] text-sm font-medium mb-6">
              <Camera className="w-4 h-4" />
              {t('our_gallery')}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('gallery_title')}
            </h1>
            <p className="text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
              {t('gallery_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Categories */}
      <section className="py-8 border-b bg-white sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id 
                ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white' 
                : 'border-stone-300 hover:bg-stone-100 hover:border-[#B8956A]'
              }
            >
              {t(cat.labelKey)}
            </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {filteredImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="group cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={image.image_url}
                          alt={image.title || 'Galeria'}
                          className="w-full h-full object-cover transition-transform duration-500 
                                     group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 
                                       transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                              <Grid3X3 className="w-6 h-6 text-[#2C3E1F]" />
                            </div>
                          </div>
                        </div>
                        {image.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t 
                                         from-black/70 to-transparent opacity-0 group-hover:opacity-100 
                                         transition-opacity duration-300">
                            <p className="text-white font-medium">{image.title}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredImages.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 text-lg">{t('no_images')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 
                        rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 
                        rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 
                        rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <motion.img
              key={currentImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={filteredImages[currentImage]?.image_url}
              alt={filteredImages[currentImage]?.title || 'Galeria'}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 
                           bg-white/10 rounded-full text-white text-sm">
              {currentImage + 1} / {filteredImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}