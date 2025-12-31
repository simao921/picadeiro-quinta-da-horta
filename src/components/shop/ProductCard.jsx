import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product, featured = false }) {
  const hasDiscount = product.discount_percentage > 0;
  const finalPrice = hasDiscount 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const isOutOfStock = product.stock === 0;

  return (
    <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
      <Card className={`group overflow-hidden border-0 hover:shadow-xl transition-all duration-300 h-full ${
        featured ? 'ring-2 ring-[#B8956A]' : 'shadow-md'
      }`}>
        <div className="relative h-64 overflow-hidden bg-stone-100">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400&q=80'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="secondary" className="bg-white text-stone-900">
                Esgotado
              </Badge>
            </div>
          )}

          {hasDiscount && !isOutOfStock && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-600 text-white">
                -{product.discount_percentage}%
              </Badge>
            </div>
          )}

          {featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-[#B8956A] text-white flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                Destaque
              </Badge>
            </div>
          )}

          {!isOutOfStock && product.stock <= 5 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="bg-white/90 text-orange-600 border-orange-600">
                <Package className="w-3 h-3 mr-1" />
                Últimas {product.stock} unidades
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              {product.category === 'equipamento' ? 'Equipamento' :
               product.category === 'vestuario' ? 'Vestuário' :
               product.category === 'acessorios' ? 'Acessórios' :
               product.category === 'cuidados_cavalo' ? 'Cuidados do Cavalo' :
               product.category === 'decoracao' ? 'Decoração' : 'Outro'}
            </Badge>
          </div>

          <h3 className="font-semibold text-[#2D2D2D] mb-2 line-clamp-2 group-hover:text-[#B8956A] transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-stone-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-sm text-stone-400 line-through">
                  {product.price.toFixed(2)}€
                </span>
              )}
              <span className="text-xl font-bold text-[#B8956A]">
                {finalPrice.toFixed(2)}€
              </span>
            </div>
            
            {!isOutOfStock && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-[#B8956A] flex items-center justify-center text-white
                           group-hover:bg-[#8B7355] transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}