import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingBag, Search, SlidersHorizontal, 
  ShoppingCart, Heart, Star, Tag 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'vestuario', label: 'Vestuário' },
  { id: 'equipamento', label: 'Equipamento' },
  { id: 'acessorios', label: 'Acessórios' },
  { id: 'cuidados', label: 'Cuidados' }
];

const defaultProducts = [
  {
    id: '1',
    name: 'Capacete de Equitação Premium',
    price: 89.99,
    sale_price: 79.99,
    category: 'equipamento',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'],
    stock: 15,
    is_featured: true
  },
  {
    id: '2',
    name: 'Botas de Equitação Clássicas',
    price: 159.99,
    category: 'vestuario',
    images: ['https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=400&q=80'],
    stock: 8
  },
  {
    id: '3',
    name: 'Luvas de Couro Premium',
    price: 45.00,
    category: 'acessorios',
    images: ['https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=400&q=80'],
    stock: 25
  },
  {
    id: '4',
    name: 'Escova para Cavalos',
    price: 24.99,
    category: 'cuidados',
    images: ['https://images.unsplash.com/photo-1508881598441-324f3974994b?w=400&q=80'],
    stock: 50
  },
  {
    id: '5',
    name: 'Calças de Equitação Stretch',
    price: 75.00,
    category: 'vestuario',
    images: ['https://images.unsplash.com/photo-1460134846237-51c777df6111?w=400&q=80'],
    stock: 12
  },
  {
    id: '6',
    name: 'Rédeas de Couro',
    price: 55.00,
    category: 'equipamento',
    images: ['https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=400&q=80'],
    stock: 20
  }
];

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState([]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
    initialData: []
  });

  const displayProducts = products.length > 0 ? products : defaultProducts;

  const filteredProducts = displayProducts
    .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'featured') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      return 0;
    });

  const addToCart = (product) => {
    let updatedCart;
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      updatedCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(updatedCart);
    toast.success(`${product.name} adicionado ao carrinho!`);
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
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
              <ShoppingBag className="w-4 h-4" />
              Nossa Loja
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Equipamento<br />
              <span className="text-[#B8956A]">Equestre</span>
            </h1>
            <p className="text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
              Descubra a nossa seleção de produtos de qualidade para cavaleiros e cavalos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Pesquisar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={selectedCategory === cat.id 
                    ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A]' 
                    : 'border-stone-300 hover:border-[#B8956A] hover:text-[#B8956A]'
                  }
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Destaques</SelectItem>
                <SelectItem value="price-asc">Preço: Menor</SelectItem>
                <SelectItem value="price-desc">Preço: Maior</SelectItem>
              </SelectContent>
            </Select>

            {/* Cart Button */}
            <Link to={createPageUrl('Cart')}>
              <Button variant="outline" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C9A961] text-[#2C3E1F] 
                                  text-xs rounded-full flex items-center justify-center font-bold">
                    {cart.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all">
                  <div className="aspect-square relative overflow-hidden bg-stone-100">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 
                                 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=80';
                      }}
                    />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.is_featured && (
                          <Badge className="bg-[#C9A961] text-[#2C3E1F]">
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        {product.sale_price && (
                          <Badge className="bg-red-500 text-white">
                            <Tag className="w-3 h-3 mr-1" />
                            Promoção
                          </Badge>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 
                                     group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="w-9 h-9 rounded-full bg-white/90 hover:bg-white"
                        >
                          <Heart className="w-4 h-4 text-stone-600" />
                        </Button>
                      </div>

                      {/* Add to Cart Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t 
                                     from-black/70 to-transparent opacity-0 group-hover:opacity-100 
                                     transition-opacity">
                        <Button
                          onClick={() => addToCart(product)}
                          className="w-full bg-white text-[#2C3E1F] hover:bg-stone-100"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Adicionar ao Carrinho
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                        {categories.find(c => c.id === product.category)?.label || 'Produto'}
                      </p>
                      <h3 className="font-semibold text-[#2C3E1F] mb-2 line-clamp-2 
                                    group-hover:text-[#4A5D23] transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {product.sale_price ? (
                          <>
                            <span className="font-bold text-lg text-[#B8956A]">
                              {product.sale_price.toFixed(2)}€
                            </span>
                            <span className="text-sm text-stone-400 line-through">
                              {product.price.toFixed(2)}€
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-lg text-[#B8956A]">
                            {product.price.toFixed(2)}€
                          </span>
                        )}
                      </div>
                      {product.stock < 10 && product.stock > 0 && (
                        <p className="text-xs text-amber-600 mt-2">
                          Apenas {product.stock} em stock
                        </p>
                      )}
                      {product.stock === 0 && (
                        <p className="text-xs text-red-600 mt-2">Esgotado</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500 text-lg">Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}