import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Euro, Plus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import NewBookingForm from '@/components/bookings/NewBookingForm';
import PaymentsSection from '@/components/bookings/PaymentsSection';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';

export default function Bookings() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const { data: payments } = useQuery({
    queryKey: ['my-payments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ client_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const totalDebt = payments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.total || p.amount + (p.penalty || 0)), 0);

  const isBlocked = totalDebt > 30;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50">
        <section className="relative py-24 bg-[#2C3E1F] overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6">
                {t('bookings_area')}
              </h1>
              <p className="text-lg text-stone-300 mb-8">
                {t('bookings_login_message')}
              </p>
              <Button
                size="lg"
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="bg-[#C9A961] hover:bg-[#B89A51] text-[#2C3E1F] font-semibold"
              >
                {t('login_or_register')}
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-[#B8956A]/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
              {t('hello')}, <span className="text-[#B8956A]">{user?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="text-stone-300">
              {t('manage_bookings_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Account Status Alert */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-red-50 border-2 border-red-300 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 text-lg mb-2">🚫 Conta Bloqueada</h3>
                  <p className="text-red-800 mb-3">
                    A sua conta está temporariamente bloqueada devido a pagamentos em atraso superiores a 30€.
                  </p>
                  <div className="bg-white/50 rounded-lg p-3 mb-3">
                    <p className="text-red-900 font-bold text-xl">
                      Dívida Total: {totalDebt.toFixed(2)}€
                    </p>
                  </div>
                  <div className="text-sm text-red-700">
                    <strong>Restrições ativas:</strong>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      <li>Não pode criar novas reservas</li>
                      <li>Não pode participar em aulas agendadas</li>
                      <li>Não pode participar em provas e competições</li>
                      <li>Não pode representar o clube em eventos</li>
                    </ul>
                  </div>
                  <p className="text-red-800 mt-3 font-medium">
                    Por favor entre em contacto connosco para regularizar a situação: +351 932 111 786
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <Tabs defaultValue="new" className="space-y-8">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="new" className="data-[state=active]:bg-[#B8956A] data-[state=active]:text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t('new_booking')}
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-[#B8956A] data-[state=active]:text-white">
                <Euro className="w-4 h-4 mr-2" />
                {t('payments')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <NewBookingForm user={user} isBlocked={isBlocked} />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsSection user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}