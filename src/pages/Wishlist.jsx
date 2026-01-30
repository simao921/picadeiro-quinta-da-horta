import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        } else {
          base44.auth.redirectToLogin(window.location.href);
        }
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkAuth();
  }, []);

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist', user?.email],
    queryFn: () => base44.entities.Wishlist.filter({ client_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Wishlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success('Removido da lista de desejos');
    }
  });

  const wishlistProducts = wishlist
    .map(w => products.find(p => p.id === w.product_id))
    .filter(Boolean);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Adicionado ao carrinho!');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to={createPageUrl('Shop')}
            className="inline-flex items-center text-stone-600 hover:text-[#B8956A] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Loja
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#2C3E1F]">
            Lista de Desejos
          </h1>
          <p className="text-stone-600 mt-2">{wishlistProducts.length} {wishlistProducts.length === 1 ? 'produto' : 'produtos'}</p>
        </div>

        {wishlistProducts.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-lg">
            <CardContent>
              <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#2C3E1F] mb-2">
                Lista de desejos vazia
              </h2>
              <p className="text-stone-500 mb-6">
                Adicione produtos aos seus favoritos
              </p>
              <Link to={createPageUrl('Shop')}>
                <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                  Explorar Produtos
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistProducts.map((product) => {
                const wishlistItem = wishlist.find(w => w.product_id === product.id);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
                      <div className="relative h-52 overflow-hidden group">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <button
                          onClick={() => removeMutation.mutate(wishlistItem.id)}
                          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <h3 className="font-semibold text-base text-[#2C3E1F] mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-stone-500 mb-3 line-clamp-2 flex-1">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t">
                          <span className="font-bold text-lg text-[#B8956A]">
                            {(product.sale_price || product.price).toFixed(2)}€
                          </span>
                          <Button
                            onClick={() => addToCart(product)}
                            size="sm"
                            className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}