import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { value: 'all', label: 'Todas' },
  { value: 'aulas', label: 'Aulas' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'cavalos', label: 'Cavalos' },
  { value: 'instalacoes', label: 'Instalações' },
  { value: 'competicoes', label: 'Competições' }
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: () => base44.entities.GalleryImage.list('-created_date', 100),
    initialData: []
  });

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-[#2C3E1F]">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Nossa <span className="text-[#C9A961]">Galeria</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-stone-300 max-w-2xl mx-auto"
          >
            Momentos especiais capturados no Picadeiro Quinta da Horta
          </motion.p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex justify-center mb-12">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full max-w-2xl">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto bg-white shadow-md">
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat.value} 
                    value={cat.value}
                    className="data-[state=active]:bg-[#4A5D23] data-[state=active]:text-white py-3"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Images Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-500 text-lg">Nenhuma imagem disponível nesta categoria.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer
                               shadow-lg hover:shadow-2xl transition-all duration-300"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.image_url}
                      alt={image.title || 'Imagem da galeria'}
                      className="w-full h-full object-cover transition-transform duration-500 
                                 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full 
                                        flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      {image.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-medium">{image.title}</p>
                          {image.description && (
                            <p className="text-stone-300 text-sm mt-1">{image.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0">
          <div className="relative">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm 
                         rounded-full flex items-center justify-center text-white 
                         hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            {selectedImage && (
              <div className="bg-black rounded-2xl overflow-hidden">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title || 'Imagem'}
                  className="w-full h-auto max-h-[85vh] object-contain"
                />
                {(selectedImage.title || selectedImage.description) && (
                  <div className="bg-white p-6">
                    {selectedImage.title && (
                      <h3 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-2">
                        {selectedImage.title}
                      </h3>
                    )}
                    {selectedImage.description && (
                      <p className="text-stone-600">{selectedImage.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}