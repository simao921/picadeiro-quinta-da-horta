import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MetaTags from '@/components/seo/MetaTags';
import LazyImage from '@/components/ui/LazyImage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';


import { ShoppingCart, Star, ArrowLeft, Check, Truck, Shield, Package, Plus, Minus, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReviewSection from '@/components/product/ReviewSection';

export default function ProductDetail() {
  const location = useLocation();
  const productId = new URLSearchParams(location.search).get('id');
  
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const products = await base44.entities.Product.filter({ id: productId });
      return products?.[0] || null;
    },
    enabled: !!productId,
    retry: 1
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {}
    };
    checkAuth();
  }, []);

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', user?.email],
    queryFn: () => base44.entities.Wishlist.filter({ client_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  useEffect(() => {
    if (product && wishlist) {
      setIsInWishlist(wishlist.some(w => w.product_id === product.id));
    }
  }, [product, wishlist]);

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWishlist) {
        const item = wishlist.find(w => w.product_id === product.id);
        await base44.entities.Wishlist.delete(item.id);
      } else {
        await base44.entities.Wishlist.create({
          client_email: user.email,
          product_id: product.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(isInWishlist ? 'Removido da lista de desejos' : 'Adicionado à lista de desejos');
    }
  });

  useEffect(() => {
    if (product?.images?.[0]) {
      setSelectedImage(0);
    }
  }, [product]);

  const addToCart = () => {
    if (!product) return;

    // Validate selections
    const sizes = product.sizes || [];
    const colors = product.colors || [];
    
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Por favor selecione um tamanho');
      return;
    }
    
    if (colors.length > 0 && !selectedColor) {
      toast.error('Por favor selecione uma cor');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItem = {
      ...product,
      quantity,
      selectedSize,
      selectedColor,
      cartItemId: `${product.id}-${selectedSize}-${selectedColor}`
    };

    const existingIndex = cart.findIndex(
      item => item.cartItemId === cartItem.cartItemId
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = cartCount;

    toast.success('Produto adicionado ao carrinho!');
  };

  if (!productId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2C3E1F] mb-2">Produto não especificado</h2>
          <Link to={createPageUrl('Shop')}>
            <Button className="mt-4 bg-[#B8956A] hover:bg-[#8B7355]">Voltar à Loja</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2C3E1F] mb-2">Produto não encontrado</h2>
          <p className="text-stone-600 mb-4">Este produto não existe ou foi removido</p>
          <Link to={createPageUrl('Shop')}>
            <Button className="mt-4 bg-[#B8956A] hover:bg-[#8B7355]">Voltar à Loja</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'];
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <MetaTags 
        title={`${product.name} - Picadeiro Quinta da Horta`}
        description={product.description || `Compre ${product.name} na nossa loja online`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link to={createPageUrl('Shop')} className="text-stone-500 hover:text-[#B8956A]">
            Loja
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-[#2C3E1F] font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images - Smaller */}
          <div className="lg:col-span-1 space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-xl overflow-hidden bg-white shadow-md"
            >
              <LazyImage
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-[#B8956A] ring-2 ring-[#B8956A]/30'
                        : 'border-transparent hover:border-stone-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <div>
              {product.is_featured && (
                <Badge className="bg-[#B8956A] text-white mb-3">
                  <Star className="w-3 h-3 mr-1" />
                  Produto em Destaque
                </Badge>
              )}
              <h1 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-3">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3">
                {product.sale_price ? (
                  <>
                    <span className="text-4xl font-bold text-[#B8956A]">
                      {product.sale_price.toFixed(2)}€
                    </span>
                    <span className="text-xl text-stone-400 line-through">
                      {product.price.toFixed(2)}€
                    </span>
                    <Badge className="bg-red-500 text-white">
                      -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                    </Badge>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-[#B8956A]">
                    {product.price.toFixed(2)}€
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-[#2C3E1F] mb-2">Descrição</h3>
                <p className="text-stone-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <label className="block font-semibold text-[#2C3E1F] mb-3">
                  Tamanho {selectedSize && `(${selectedSize})`}
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        selectedSize === size
                          ? 'border-[#B8956A] bg-[#B8956A] text-white'
                          : 'border-stone-300 hover:border-[#B8956A] text-stone-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <label className="block font-semibold text-[#2C3E1F] mb-3">
                  Cor {selectedColor && `(${selectedColor})`}
                </label>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        selectedColor === color
                          ? 'border-[#B8956A] scale-110'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    >
                      {selectedColor === color && (
                        <Check className="w-6 h-6 text-white mx-auto drop-shadow-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block font-semibold text-[#2C3E1F] mb-3">Quantidade</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-stone-500 ml-2">
                  {product.stock} disponível
                </span>
              </div>
            </div>

            <Separator />

            {/* Add to Cart */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={addToCart}
                  disabled={!inStock}
                  className="flex-1 h-14 bg-[#B8956A] hover:bg-[#8B7355] text-white text-lg font-semibold"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {inStock ? 'Adicionar ao Carrinho' : 'Esgotado'}
                </Button>
                {user && (
                  <Button
                    onClick={() => toggleWishlistMutation.mutate()}
                    variant="outline"
                    size="lg"
                    className="h-14 w-14 border-2"
                  >
                    <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                )}
              </div>
              <Link to={createPageUrl('Shop')} className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continuar a Comprar
                </Button>
              </Link>
            </div>

            {/* Features */}
            <Card className="border-0 bg-stone-100">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-[#B8956A]" />
                  <span className="text-stone-700">Envio grátis em compras superiores a 50€</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-5 h-5 text-[#B8956A]" />
                  <span className="text-stone-700">Garantia de qualidade</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Package className="w-5 h-5 text-[#B8956A]" />
                  <span className="text-stone-700">Embalagem cuidada</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">Avaliações</h2>
          <ReviewSection entityType="product" entityId={product.id} />
        </div>
      </div>
    </div>
  );
}