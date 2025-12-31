import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Cart() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['cart', user?.email],
    queryFn: () => base44.entities.CartItem.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: []
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => base44.entities.CartItem.update(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  const removeItemMutation = useMutation({
    mutationFn: (id) => base44.entities.CartItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  const shippingCost = subtotal > 50 ? 0 : 5;
  const total = subtotal + shippingCost;

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-stone-400" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#2D2D2D] mb-4">
                O seu carrinho está vazio
              </h1>
              <p className="text-stone-600 mb-8">
                Descubra a nossa seleção de produtos de equitação
              </p>
              <Link to={createPageUrl('Shop')}>
                <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Continuar a Comprar
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative py-16 bg-[#2D2D2D] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
              Carrinho de <span className="text-[#B8956A]">Compras</span>
            </h1>
            <p className="text-stone-300">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'} no carrinho
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={item.product_image || 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=200&q=80'}
                        alt={item.product_name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2D2D2D] mb-1">
                          {item.product_name}
                        </h3>
                        {item.size && (
                          <p className="text-sm text-stone-600">Tamanho: {item.size}</p>
                        )}
                        {item.color && (
                          <p className="text-sm text-stone-600">Cor: {item.color}</p>
                        )}
                        <p className="font-bold text-[#B8956A] mt-2">
                          {item.product_price.toFixed(2)}€
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({
                              id: item.id,
                              quantity: Math.max(1, item.quantity - 1)
                            })}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({
                              id: item.id,
                              quantity: item.quantity + 1
                            })}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border-0 shadow-lg sticky top-24">
                <CardContent className="p-6">
                  <h2 className="font-serif text-xl font-bold text-[#2D2D2D] mb-6">
                    Resumo da Encomenda
                  </h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Envio</span>
                      <span>{shippingCost === 0 ? 'Grátis' : `${shippingCost.toFixed(2)}€`}</span>
                    </div>
                    {subtotal < 50 && (
                      <p className="text-xs text-[#B8956A]">
                        Faltam {(50 - subtotal).toFixed(2)}€ para envio grátis
                      </p>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg text-[#2D2D2D]">
                        <span>Total</span>
                        <span>{total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  <Link to={createPageUrl('Checkout')}>
                    <Button className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white">
                      Finalizar Compra
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>

                  <Link to={createPageUrl('Shop')}>
                    <Button variant="outline" className="w-full mt-3">
                      Continuar a Comprar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}