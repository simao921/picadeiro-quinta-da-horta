import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Checkout() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [shippingData, setShippingData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Portugal',
    phone: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setShippingData(prev => ({ ...prev, name: userData.full_name || '' }));
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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  const shippingCost = subtotal > 50 ? 0 : 5;
  const total = subtotal + shippingCost;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderNumber = `PQH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        user_email: user.email,
        user_name: user.full_name,
        status: 'pendente',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: item.product_price,
          size: item.size,
          color: item.color
        })),
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: shippingData,
        payment_method: paymentMethod,
        payment_status: 'pendente',
        notes
      });

      // Update product stock
      for (const item of cartItems) {
        const product = await base44.entities.Product.list();
        const prod = product.find(p => p.id === item.product_id);
        if (prod) {
          await base44.entities.Product.update(item.product_id, {
            stock: Math.max(0, (prod.stock || 0) - item.quantity)
          });
        }
      }

      // Clear cart
      for (const item of cartItems) {
        await base44.entities.CartItem.delete(item.id);
      }

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Encomenda Confirmada - ${orderNumber}`,
        body: `
          <h2>Obrigado pela sua encomenda!</h2>
          <p>Olá ${user.full_name},</p>
          <p>A sua encomenda <strong>${orderNumber}</strong> foi recebida e está a ser processada.</p>
          
          <h3>Detalhes da Encomenda</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${cartItems.map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                  ${item.product_name} x${item.quantity}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                  ${(item.product_price * item.quantity).toFixed(2)}€
                </td>
              </tr>
            `).join('')}
            <tr>
              <td style="padding: 8px;"><strong>Total</strong></td>
              <td style="padding: 8px; text-align: right;"><strong>${total.toFixed(2)}€</strong></td>
            </tr>
          </table>
          
          <h3>Morada de Envio</h3>
          <p>
            ${shippingData.name}<br>
            ${shippingData.address}<br>
            ${shippingData.postal_code} ${shippingData.city}<br>
            ${shippingData.country}
          </p>
          
          <p>Entraremos em contacto brevemente com os detalhes de pagamento e envio.</p>
          <p>Obrigado por escolher o Picadeiro Quinta da Horta!</p>
        `
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      setStep(3);
    }
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    navigate(createPageUrl('Shop'));
    return null;
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2D2D2D] mb-4">
            Encomenda Confirmada!
          </h1>
          <p className="text-stone-600 mb-8">
            Recebeu um email de confirmação com os detalhes da sua encomenda.
            Entraremos em contacto brevemente.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Shop'))}
            className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
          >
            Voltar à Loja
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative py-16 bg-[#2D2D2D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
            Finalizar <span className="text-[#B8956A]">Compra</span>
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#B8956A]' : 'text-stone-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-[#B8956A]' : 'bg-stone-600'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="hidden sm:inline">Envio</span>
            </div>
            <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-[#B8956A]' : 'bg-stone-600'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#B8956A]' : 'text-stone-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-[#B8956A]' : 'bg-stone-600'
              }`}>
                2
              </div>
              <span className="hidden sm:inline">Pagamento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Form */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === 1 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">
                      Morada de Envio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={shippingData.name}
                        onChange={(e) => setShippingData({...shippingData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Morada *</Label>
                      <Input
                        id="address"
                        value={shippingData.address}
                        onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          value={shippingData.city}
                          onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">Código Postal *</Label>
                        <Input
                          id="postal_code"
                          value={shippingData.postal_code}
                          onChange={(e) => setShippingData({...shippingData, postal_code: e.target.value})}
                          placeholder="0000-000"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingData.phone}
                        onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                        placeholder="+351 900 000 000"
                        required
                      />
                    </div>
                    <Button
                      onClick={() => setStep(2)}
                      className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                      disabled={!shippingData.name || !shippingData.address || !shippingData.city || !shippingData.postal_code || !shippingData.phone}
                    >
                      Continuar para Pagamento
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">
                      Método de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="transferencia" id="transferencia" />
                        <Label htmlFor="transferencia" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Transferência Bancária</div>
                          <div className="text-sm text-stone-600">
                            Receberá os dados bancários por email
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="multibanco" id="multibanco" />
                        <Label htmlFor="multibanco" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Multibanco</div>
                          <div className="text-sm text-stone-600">
                            Receberá a referência por email
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="mbway" id="mbway" />
                        <Label htmlFor="mbway" className="flex-1 cursor-pointer">
                          <div className="font-semibold">MB WAY</div>
                          <div className="text-sm text-stone-600">
                            Pagamento por MB WAY
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div>
                      <Label htmlFor="notes">Notas Adicionais (Opcional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Informações adicionais sobre a encomenda..."
                        className="h-24"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={() => createOrderMutation.mutate()}
                        disabled={createOrderMutation.isPending}
                        className="flex-1 bg-[#B8956A] hover:bg-[#8B7355] text-white"
                      >
                        {createOrderMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            A processar...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Confirmar Encomenda
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="border-0 shadow-lg sticky top-24">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.product_image || 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=100&q=80'}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.product_name}</p>
                          <p className="text-xs text-stone-600">Qtd: {item.quantity}</p>
                          <p className="text-sm font-bold text-[#B8956A]">
                            {(item.product_price * item.quantity).toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Envio</span>
                      <span>{shippingCost === 0 ? 'Grátis' : `${shippingCost.toFixed(2)}€`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{total.toFixed(2)}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}