import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Check, Package, Truck, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/shop/ProductCard';

export default function ProductDetail() {
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.list();
      return products.find(p => p.id === productId);
    },
    enabled: !!productId
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ 
        category: product.category,
        is_active: true 
      });
      return products.filter(p => p.id !== productId).slice(0, 4);
    },
    enabled: !!product
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      await base44.entities.CartItem.create({
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        product_price: finalPrice,
        product_image: product.image_url,
        quantity,
        size: selectedSize,
        color: selectedColor
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      navigate(createPageUrl('Cart'));
    }
  });

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  const hasDiscount = product.discount_percentage > 0;
  const finalPrice = hasDiscount 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;
  const isOutOfStock = product.stock === 0;

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image_url || 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=800&q=80'];

  const canAddToCart = !isOutOfStock && 
    (!product.sizes || selectedSize) && 
    (!product.colors || selectedColor);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Shop'))}
            className="text-stone-600 hover:text-[#B8956A]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Loja
          </Button>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-stone-100"
              >
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <Badge className="absolute top-4 right-4 bg-red-600 text-white text-lg px-4 py-2">
                    -{product.discount_percentage}%
                  </Badge>
                )}
              </motion.div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-[#B8956A]' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-3">
                  {product.category === 'equipamento' ? 'Equipamento' :
                   product.category === 'vestuario' ? 'Vestuário' :
                   product.category === 'acessorios' ? 'Acessórios' :
                   product.category === 'cuidados_cavalo' ? 'Cuidados do Cavalo' :
                   product.category === 'decoracao' ? 'Decoração' : 'Outro'}
                </Badge>
                <h1 className="font-serif text-3xl font-bold text-[#2D2D2D] mb-3">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-3 mb-4">
                  {hasDiscount && (
                    <span className="text-2xl text-stone-400 line-through">
                      {product.price.toFixed(2)}€
                    </span>
                  )}
                  <span className="text-4xl font-bold text-[#B8956A]">
                    {finalPrice.toFixed(2)}€
                  </span>
                </div>

                {product.stock > 0 && product.stock <= 10 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Package className="w-3 h-3 mr-1" />
                    Apenas {product.stock} em stock
                  </Badge>
                )}

                {isOutOfStock && (
                  <Badge variant="destructive">Esgotado</Badge>
                )}
              </div>

              <p className="text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Tamanho *
                  </label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Cor *
                  </label>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedColor === color 
                            ? 'border-[#B8956A] bg-[#B8956A]/10' 
                            : 'border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={isOutOfStock}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={!canAddToCart || addToCartMutation.isPending}
                className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white h-14 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
              </Button>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-[#B8956A]" />
                  <div>
                    <p className="font-semibold text-sm">Envio Grátis</p>
                    <p className="text-xs text-stone-600">Em compras +50€</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-[#B8956A]" />
                  <div>
                    <p className="font-semibold text-sm">Compra Segura</p>
                    <p className="text-xs text-stone-600">Pagamento protegido</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-[#B8956A]" />
                  <div>
                    <p className="font-semibold text-sm">Qualidade</p>
                    <p className="text-xs text-stone-600">Produtos certificados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="font-serif text-2xl font-bold text-[#2D2D2D] mb-8">
                Produtos Relacionados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}