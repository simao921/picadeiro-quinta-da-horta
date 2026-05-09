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
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';

export default function Bookings() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState(DEFAULT_IMAGES.hero_bookings);

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

  useEffect(() => {
    getSiteImage('hero_bookings', DEFAULT_IMAGES.hero_bookings).then(setHeroImage);
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
        <section className="relative py-24 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <LazyImage
              src={heroImage}
              alt=""
              className="w-full h-full object-cover"
              priority={true}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/65" />
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
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Cinematic Hero Section */}
      <section className="relative h-[40vh] flex items-center overflow-hidden bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A]">
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            className="w-full h-full"
          >
            <LazyImage
              src={heroImage}
              alt="Reservas"
              className="w-full h-full object-cover opacity-40"
              priority={true}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-5xl sm:text-7xl font-black text-white leading-tight mb-4">
              {t('hello')}, <span className="text-[#B8956A] italic">{user?.full_name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xl text-stone-300 font-medium">
              {t('manage_bookings_subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Account Status Alert - Premium Design */}
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16 p-10 bg-red-50/50 backdrop-blur-xl border-2 border-red-100 rounded-[3rem] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 relative z-10">
                <div className="w-20 h-20 bg-red-500 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-red-500/20">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <div className="text-center lg:text-left flex-grow">
                  <h3 className="font-serif text-3xl font-black text-red-950 mb-4">Conta Suspensa</h3>
                  <p className="text-lg text-red-900/70 font-medium mb-8 max-w-2xl">
                    Detetámos pagamentos em atraso superiores a 30€. Para garantir a sustentabilidade do clube, o acesso a novas reservas foi temporariamente restrito.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-2">Valor em Dívida</p>
                      <p className="text-4xl font-serif font-black text-red-600">
                        {totalDebt.toFixed(2)}€
                      </p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-2">Contacto Direto</p>
                      <p className="text-2xl font-black text-red-950">+351 932 111 786</p>
                    </div>
                  </div>

                  <div className="bg-red-900/5 rounded-[2rem] p-8">
                    <p className="font-black uppercase tracking-widest text-[10px] text-red-900/50 mb-4">Restrições em Vigor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        'Criação de novas reservas',
                        'Participação em aulas agendadas',
                        'Inscrição em competições',
                        'Representação oficial do clube'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-red-900/60 font-bold text-sm">
                          <div className="w-2 h-2 bg-red-400 rounded-full" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <Tabs defaultValue="new" className="space-y-12">
            <div className="flex justify-center">
              <TabsList className="bg-stone-50 border border-stone-100 p-2 rounded-[2rem] h-auto gap-2">
                <TabsTrigger 
                  value="new" 
                  className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  {t('new_booking')}
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
                >
                  <Euro className="w-4 h-4 mr-3" />
                  {t('payments')}
                </TabsTrigger>
              </TabsList>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TabsContent value="new" className="mt-0">
                <NewBookingForm user={user} isBlocked={isBlocked} />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <PaymentsSection user={user} />
              </TabsContent>
            </motion.div>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
