import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MetaTags from '@/components/seo/MetaTags';
import LazyImage from '@/components/ui/LazyImage';
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
import { ShoppingCart, Search, Star, Package, TrendingUp, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';

export default function Shop() {
  const { t } = useLanguage();
  
  const categories = [
    { id: 'all', labelKey: 'all_categories_shop' },
    { id: 'vestuario', label: 'Vestuário' },
    { id: 'equipamento', label: 'Equipamento' },
    { id: 'acessorios', label: 'Acessórios' },
    { id: 'cuidados', label: 'Cuidados' },
    { id: 'alimentacao', label: 'Alimentação' },
  ];

const defaultProducts = [
  {
    id: '1',
    name: 'Capacete de Equitação Premium',
    description: 'Capacete profissional com certificação de segurança, ventilação otimizada e ajuste personalizado.',
    price: 89.99,
    category: 'equipamento',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
    stock: 15,
    is_active: true,
    is_featured: true
  },
  {
    id: '2',
    name: 'Botas de Equitação Profissionais',
    description: 'Botas de couro genuíno, impermeáveis e com sola antiderrapante para máximo conforto e segurança.',
    price: 159.99,
    category: 'vestuario',
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80'],
    stock: 8,
    is_active: true,
    is_featured: true
  },
  {
    id: '3',
    name: 'Sela Completa Pro',
    description: 'Sela ergonómica de alta qualidade com almofadas ajustáveis para conforto máximo do cavalo.',
    price: 449.99,
    sale_price: 399.99,
    category: 'equipamento',
    images: ['https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80'],
    stock: 5,
    is_active: true,
    is_featured: true
  },
  {
    id: '4',
    name: 'Kit de Limpeza Completo',
    description: 'Kit profissional com escovas, pentes e produtos de limpeza premium para cuidado diário.',
    price: 34.99,
    category: 'cuidados',
    images: ['https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80'],
    stock: 25,
    is_active: true
  },
  {
    id: '5',
    name: 'Luvas de Equitação Premium',
    description: 'Luvas em pele sintética respirável com grip antiderrapante e proteção reforçada.',
    price: 24.99,
    category: 'acessorios',
    images: ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80'],
    stock: 30,
    is_active: true
  },
  {
    id: '6',
    name: 'Suplemento Vitamínico Premium',
    description: 'Suplemento completo de vitaminas e minerais para saúde e performance do cavalo.',
    price: 54.99,
    category: 'alimentacao',
    images: ['https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80'],
    stock: 12,
    is_active: true
  }
];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true }),
    initialData: defaultProducts
  });

  const displayProducts = (products && products.length > 0) ? products : defaultProducts;

  // Advanced filtering and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...displayProducts];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    result = result.filter(p => {
      const price = p.sale_price || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return result;
  }, [displayProducts, selectedCategory, searchQuery, sortBy, priceRange]);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(t('added_to_cart'));
  };

  const featuredProducts = displayProducts.filter(p => p.is_featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-stone-50">
      <MetaTags 
        title="Loja - Picadeiro Quinta da Horta"
        description="Loja online de equipamento equestre. Capacetes, botas, selas, acessórios e produtos de cuidados para cavalos."
        keywords="loja equestre, equipamento cavalos, vestuário equitação, selas, capacetes, botas"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#B8956A]/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/20 backdrop-blur-sm 
                           rounded-full text-[#B8956A] text-sm font-medium mb-6">
              <Package className="w-4 h-4" />
              {t('shop_title')}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('shop_title')}
            </h1>
            <p className="text-lg text-stone-300 max-w-2xl mx-auto">
              Descubra a nossa seleção de equipamento e acessórios de alta qualidade para equitação
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-white to-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#2C3E1F] mb-2">
                  {t('featured_products')}
                </h2>
                <p className="text-stone-600">Os nossos produtos mais populares</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#B8956A]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                    <div className="relative h-56 overflow-hidden group">
                      <LazyImage
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-[#B8956A] text-white">
                          <Star className="w-3 h-3 mr-1" />
                          {t('featured')}
                        </Badge>
                      </div>
                      {product.sale_price && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-red-500 text-white">
                            -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-stone-500 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.sale_price ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xl text-[#B8956A]">
                                {product.sale_price.toFixed(2)}€
                              </span>
                              <span className="text-sm text-stone-400 line-through">
                                {product.price.toFixed(2)}€
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-xl text-[#B8956A]">
                              {product.price.toFixed(2)}€
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={() => addToCart(product)}
                          className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
                          size="sm"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Shop Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters Bar */}
          <Card className="mb-8 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    placeholder={t('search_products')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48 h-12">
                    <SelectValue placeholder={t('sort_by')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">{t('featured')}</SelectItem>
                    <SelectItem value="price_asc">{t('price_low_high')}</SelectItem>
                    <SelectItem value="price_desc">{t('price_high_low')}</SelectItem>
                    <SelectItem value="name">{t('name_az')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  className="lg:hidden h-12"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t('filters')}
                </Button>
              </div>

              {/* Category Filters */}
              <div className={`flex flex-wrap gap-2 mt-4 ${showFilters || 'hidden lg:flex'}`}>
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
                    {cat.labelKey ? t(cat.labelKey) : cat.label}
                  </Button>
                ))}
                {(selectedCategory !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('clear')}
                  </Button>
                )}
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-stone-500">
                {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? t('products_found') : t('products_found_plural')} {filteredAndSortedProducts.length === 1 ? t('found') : t('found_plural')}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-4" />
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Package className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                <h3 className="text-xl font-semibold text-[#2C3E1F] mb-2">
                  {t('no_products_found')}
                </h3>
                <p className="text-stone-500 mb-4">
                  Tente ajustar os seus filtros de pesquisa
                </p>
                <Button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  variant="outline"
                >
                  {t('clear_filters')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredAndSortedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to={`${createPageUrl('ProductDetail')}?id=${product.id}`}>
                    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow h-full flex flex-col bg-white cursor-pointer">
                      <div className="relative h-52 overflow-hidden group">
                        <LazyImage
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {product.sale_price && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-red-500 text-white">
                              -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                            </Badge>
                          </div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="absolute bottom-3 right-3">
                            <Badge className="bg-amber-500 text-white text-xs">
                              {t('last_units')} {product.stock} {t('units')}
                            </Badge>
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge className="bg-red-500 text-white">{t('out_of_stock')}</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base text-[#2C3E1F] mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-stone-500 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t">
                          <div>
                            {product.sale_price ? (
                              <div>
                                <span className="font-bold text-lg text-[#B8956A] block">
                                  {product.sale_price.toFixed(2)}€
                                </span>
                                <span className="text-xs text-stone-400 line-through">
                                  {product.price.toFixed(2)}€
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-lg text-[#B8956A]">
                                {product.price.toFixed(2)}€
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            className="bg-[#B8956A] hover:bg-[#8B7355] text-white disabled:opacity-50"
                            size="sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}