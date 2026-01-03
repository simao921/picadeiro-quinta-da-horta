import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, Trash2, Plus, Minus, 
  ArrowLeft, CreditCard, Tag, Loader2, CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';

export default function Cart() {
  const { t } = useLanguage();
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [user, setUser] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    postal_code: '',
    country: 'Portugal'
  });
  const [step, setStep] = useState('cart'); // cart, checkout, success

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Check auth
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

  const updateCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (productId, delta) => {
    const newCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(newCart);
  };

  const removeItem = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    updateCart(newCart);
    toast.success(t('removed_from_cart') || 'Produto removido do carrinho');
  };

  const applyCoupon = async () => {
    try {
      const coupons = await base44.entities.Coupon.filter({ 
        code: couponCode.toUpperCase(), 
        is_active: true 
      });
      
      if (coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        
        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
          toast.error('Este cupão expirou');
          return;
        }
        
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
          toast.error('Este cupão atingiu o limite de utilizações');
          return;
        }

        setAppliedCoupon(coupon);
        toast.success('Cupão aplicado com sucesso!');
      } else {
        toast.error('Cupão inválido');
      }
    } catch (e) {
      toast.error('Erro ao aplicar cupão');
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.sale_price || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const discount = appliedCoupon 
    ? appliedCoupon.discount_type === 'percentage'
      ? subtotal * (appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;

  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal - discount + shipping;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const order = await base44.entities.Order.create({
        client_email: user.email,
        client_name: user.full_name,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.sale_price || item.price
        })),
        subtotal,
        discount,
        shipping,
        total,
        coupon_code: appliedCoupon?.code,
        shipping_address: shippingAddress,
        status: 'pendente'
      });

      // Update coupon usage
      if (appliedCoupon) {
        await base44.entities.Coupon.update(appliedCoupon.id, {
          used_count: (appliedCoupon.used_count || 0) + 1
        });
      }

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Confirmação de Encomenda - Picadeiro Quinta da Horta',
        body: `
          <h2>Obrigado pela sua encomenda!</h2>
          <p>A sua encomenda foi registada com sucesso.</p>
          <h3>Detalhes</h3>
          <p><strong>Total:</strong> ${total.toFixed(2)}€</p>
          <p>Entraremos em contacto em breve com informações de envio.</p>
        `
      });

      return order;
    },
    onSuccess: () => {
      updateCart([]);
      setStep('success');
    },
    onError: () => {
      toast.error('Erro ao processar encomenda');
    }
  });

  const handleCheckout = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setStep('checkout');
  };

  const handlePlaceOrder = () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postal_code) {
      toast.error('Por favor preencha a morada de envio');
      return;
    }
    createOrderMutation.mutate();
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-4">
            {t('order_success')}
          </h1>
          <p className="text-stone-600 mb-8">
            {t('order_confirmation')}
          </p>
          <Link to={createPageUrl('Shop')}>
            <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
              {t('back_to_shop')}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to={createPageUrl('Shop')}
            className="inline-flex items-center text-stone-600 hover:text-[#4A5D23] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('continue_shopping')}
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#2C3E1F]">
            {step === 'cart' ? t('cart_title') : t('checkout_title')}
          </h1>
        </div>

        {cart.length === 0 && step === 'cart' ? (
          <Card className="border-0 shadow-lg text-center py-16">
            <CardContent>
              <ShoppingCart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#2C3E1F] mb-2">
                {t('cart_empty')}
              </h2>
              <p className="text-stone-500 mb-6">
                Adicione alguns produtos para começar.
              </p>
              <Link to={createPageUrl('Shop')}>
                <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                  {t('continue_shopping')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items / Checkout Form */}
            <div className="lg:col-span-2">
              {step === 'cart' ? (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white">
                    <CardTitle className="text-lg">
                      {t('products') || 'Produtos'} ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <AnimatePresence>
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex gap-4 p-4 bg-stone-50 rounded-lg"
                        >
                          <img
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&q=80'}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#2C3E1F]">{item.name}</h3>
                            <p className="text-stone-500 text-sm mb-1">
                              Preço unitário: {(item.sale_price || item.price).toFixed(2)}€
                            </p>
                            <p className="text-[#B8956A] font-bold">
                              {((item.sale_price || item.price) * item.quantity).toFixed(2)}€
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white">
                    <CardTitle className="text-lg">{t('shipping_address')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="street">{t('street')}</Label>
                      <Input
                        id="street"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                        placeholder={t('street')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">{t('city')}</Label>
                        <Input
                          id="city"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                          placeholder={t('city')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">{t('postal_code')}</Label>
                        <Input
                          id="postal_code"
                          value={shippingAddress.postal_code}
                          onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                          placeholder="0000-000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t('country')}</Label>
                      <Input
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                        placeholder="Portugal"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24 border-0 shadow-lg">
                <CardHeader className="bg-stone-50 border-b">
                  <CardTitle className="text-lg">{t('order_summary') || 'Resumo'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Coupon */}
                  {step === 'cart' && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('coupon_code')}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={!couponCode}
                      >
                        <Tag className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                      {t('coupon_applied') || 'Cupão'} {appliedCoupon.code} {t('applied') || 'aplicado'}!
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">{t('subtotal')}</span>
                      <span>{subtotal.toFixed(2)}€</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('discount')}</span>
                        <span>-{discount.toFixed(2)}€</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-600">{t('shipping')}</span>
                      <span>{shipping === 0 ? (t('free') || 'Grátis') : `${shipping.toFixed(2)}€`}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('total')}</span>
                    <span className="text-[#B8956A]">{total.toFixed(2)}€</span>
                  </div>

                  {shipping > 0 && (
                    <p className="text-xs text-stone-500">
                      {t('free_shipping_note') || 'Envio grátis para encomendas superiores a 50€'}
                    </p>
                  )}

                  {step === 'cart' ? (
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      {t('proceed_checkout')}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={createOrderMutation.isPending}
                        className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                      >
                        {createOrderMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {t('processing') || 'A processar...'}
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            {t('place_order')}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setStep('cart')}
                        className="w-full"
                      >
                        {t('back_to_cart') || 'Voltar ao Carrinho'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}