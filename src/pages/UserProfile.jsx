import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FeedbackModal from '@/components/FeedbackModal';
import {
  CalendarDays, Clock, CheckCircle, XCircle, 
  AlertCircle, Euro, LogOut, Plus, Trophy,
  Calendar as CalendarIcon, FileText, Eye, X, Star, Trash2,
  User as UserIcon, History, MessageSquare, Mail, Phone, MapPin, Edit2, Save, CheckCircle2, Ban, Send
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/LanguageProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [selectedRegulation, setSelectedRegulation] = useState(null);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Profile Edit States
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });

  // Message States
  const [message, setMessage] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin();
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          address: userData.address || ''
        });
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    checkAuth();
  }, []);

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.Booking.filter({ client_email: user.email });
      } catch (error) {
        console.error('Error loading bookings:', error);
        return [];
      }
    },
    enabled: !!user?.email
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['my-payments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.Payment.filter({ client_email: user.email });
      } catch (error) {
        console.error('Error loading payments:', error);
        return [];
      }
    },
    enabled: !!user?.email
  });



  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      try {
        return await base44.entities.Lesson.list();
      } catch (error) {
        console.error('Error loading lessons:', error);
        return [];
      }
    }
  });

  const { data: competitionEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['my-competition-entries', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const entries = await base44.entities.CompetitionEntry.filter({ rider_email: user.email });
        // Carregar competições relacionadas
        const comps = await base44.entities.Competition.list();
        return entries.map(entry => {
          const competition = comps.find(c => c.id === entry.competition_id);
          return { ...entry, competition };
        });
      } catch (error) {
        console.error('Error loading competition entries:', error);
        return [];
      }
    },
    enabled: !!user?.email
  });

  const { data: regulations = [] } = useQuery({
    queryKey: ['regulations'],
    queryFn: async () => {
      try {
        return await base44.entities.RegulationDocument.filter({ is_visible: true });
      } catch (error) {
        console.error('Error loading regulations:', error);
        return [];
      }
    }
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ bookingId, attendance }) => 
      base44.entities.Booking.update(bookingId, { attendance }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-bookings']);
      toast.success('Presença atualizada!');
    }
  });

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendente', class: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Aprovada', class: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitada', class: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelada', class: 'bg-stone-100 text-stone-800' }
    };
    const { label, class: className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendente', class: 'bg-amber-100 text-amber-800', icon: Clock },
      paid: { label: 'Pago', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { label: 'Em Atraso', class: 'bg-red-100 text-red-800', icon: AlertCircle },
      blocked: { label: 'Bloqueado', class: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { label, class: className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const totalDebt = payments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.total || p.amount + (p.penalty || 0)), 0);

  const isBlocked = totalDebt > 30;

  const isLessonCompleted = (lesson) => {
    if (!lesson?.date || !lesson?.end_time) return false;
    const lessonDateTime = new Date(`${lesson.date}T${lesson.end_time}:00`);
    return lessonDateTime < new Date();
  };

  const handleDeleteAccount = async () => {
    try {
      await base44.entities.User.delete(user.id);
      toast.success('Conta eliminada com sucesso');
      setTimeout(() => {
        base44.auth.logout();
      }, 1000);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao eliminar conta. Contacte o suporte.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header - Cinematic Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B8956A]">Portal do Cliente</span>
              <h1 className="font-serif text-5xl sm:text-6xl font-black text-[#2C3E1F] leading-tight">
                Olá, <span className="text-[#B8956A] italic">{user.full_name?.split(' ')[0]}!</span>
              </h1>
              <p className="text-xl text-stone-400 font-medium">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="h-14 rounded-2xl border-stone-100 text-stone-400 hover:text-red-600 hover:border-red-100 transition-all font-bold"
                  >
                    <Trash2 className="w-5 h-5 mr-3" />
                    Eliminar Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-3xl font-black text-[#2C3E1F]">Tem a certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription className="text-stone-500 font-medium text-lg leading-relaxed pt-4">
                      Esta ação não pode ser desfeita. Isto irá eliminar permanentemente a sua conta 
                      e remover todos os seus dados dos nossos servidores, incluindo todas as suas reservas e pagamentos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="pt-10">
                    <AlertDialogCancel className="h-14 rounded-2xl border-stone-100 font-black uppercase tracking-widest text-xs">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-600/20"
                    >
                      Sim, eliminar conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                onClick={() => base44.auth.logout()}
                className="h-14 rounded-2xl border-stone-100 text-[#2C3E1F] font-black uppercase tracking-widest text-xs shadow-sm hover:shadow-lg transition-all"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Terminar Sessão
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Alert if blocked - Premium Version */}
        {isBlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16 p-10 bg-red-50 border-2 border-red-100 rounded-[3rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-red-500/20">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black text-red-950 mb-3 uppercase tracking-tight">Acesso Restrito</h3>
                <p className="text-red-900/70 font-medium text-lg leading-relaxed max-w-3xl">
                  Detetámos pagamentos em atraso superiores a 30€. Por favor regularize a sua situação (Valor total: <span className="font-black text-red-600">{totalDebt.toFixed(2)}€</span>) para poder continuar as suas atividades.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards - Premium Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <motion.div whileHover={{ y: -5 }} className="premium-card bg-white p-8 border border-stone-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#2C3E1F]/5 rounded-[1.5rem] flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-[#2C3E1F]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Reservas Ativas</p>
                <p className="text-4xl font-serif font-black text-[#2C3E1F]">
                  {bookings.filter(b => b.status === 'approved').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="premium-card bg-white p-8 border border-stone-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#B8956A]/10 rounded-[1.5rem] flex items-center justify-center">
                <Clock className="w-8 h-8 text-[#B8956A]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-1">Pedidas</p>
                <p className="text-4xl font-serif font-black text-[#B8956A]">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="premium-card bg-[#11180D] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 ${totalDebt > 0 ? 'bg-red-500/10' : 'bg-green-500/10'} rounded-[1.5rem] flex items-center justify-center`}>
                <Euro className={`w-8 h-8 ${totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1">Balanço</p>
                <p className={`text-4xl font-serif font-black ${totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {totalDebt.toFixed(2)}€
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="premium-card bg-[#B8956A] p-8 shadow-[0_30px_60px_-15px_rgba(184,149,106,0.3)]">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Provas</p>
                <p className="text-4xl font-serif font-black text-white">
                  {competitionEntries.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Regulations - Premium Card */}
        {regulations.length > 0 && (
          <div className="mb-24">
            <div className="premium-card bg-white border border-stone-100 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="bg-[#11180D] p-8 px-12 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="w-6 h-6 text-[#B8956A]" />
                  <h2 className="text-xl font-serif font-black text-white">Regulamentos Internos</h2>
                </div>
              </div>
              <div className="p-8 px-12 divide-y divide-stone-50">
                {regulations.map((reg) => (
                  <div key={reg.id} className="py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:bg-[#B8956A]/10 transition-colors duration-500">
                        <FileText className="w-8 h-8 text-stone-300 group-hover:text-[#B8956A] transition-colors" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-[#2C3E1F] mb-1">{reg.title}</p>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400">Formato Digital PDF</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-stone-100 text-[#2C3E1F] font-black uppercase tracking-widest text-[10px] hover:bg-[#B8956A] hover:border-[#B8956A] hover:text-white transition-all shadow-sm"
                      onClick={() => setSelectedRegulation(reg)}
                    >
                      <Eye className="w-4 h-4 mr-3" />
                      Visualizar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Tabs - Premium Interface */}
        <Tabs defaultValue="bookings" className="space-y-12">
          <div className="flex justify-start">
            <TabsList className="bg-stone-50 border border-stone-100 p-2 rounded-[2rem] h-auto gap-2">
              <TabsTrigger 
                value="bookings" 
                className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
              >
                Minhas Aulas
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
              >
                Histórico Financeiro
              </TabsTrigger>
              <TabsTrigger 
                value="competitions" 
                className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
              >
                Inscrições em Provas
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
              >
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger 
                value="messages" 
                className="rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500 shadow-none data-[state=active]:shadow-2xl"
              >
                Apoio Cliente
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bookings" className="mt-0">
            <div className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-10 px-12 border-b border-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <h3 className="text-2xl font-serif font-black text-[#2C3E1F]">Agenda Pessoal</h3>
                <div className="flex gap-4">
                  <Link to={createPageUrl('Competitions')}>
                    <Button variant="outline" className="h-14 rounded-2xl border-[#B8956A] text-[#B8956A] font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-[#B8956A]/5 transition-all hover:scale-105 hover:bg-[#B8956A] hover:text-white">
                      <Star className="w-4 h-4 mr-3" />
                      Competições
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Bookings')}>
                    <Button className="h-14 rounded-2xl bg-[#B8956A] hover:bg-[#11180D] text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-[#B8956A]/20 transition-all hover:scale-105">
                      <Plus className="w-4 h-4 mr-3" />
                      Agendar Aula
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-12">
                {bookingsLoading ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-3xl bg-stone-50 animate-pulse" />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                    <CalendarDays className="w-20 h-20 text-stone-200 mx-auto mb-6" />
                    <p className="text-xl font-serif font-black text-stone-400">Sem atividades agendadas</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookings.map((booking) => {
                      const lesson = lessons.find(l => l.id === booking.lesson_id);
                      return (
                        <div
                          key={booking.id}
                          className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all hover:bg-white hover:shadow-xl hover:border-white group"
                        >
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              {isLessonCompleted(lesson) && booking.status === 'approved' && (
                                <Badge className="bg-green-100 text-green-700 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                  Efetuada
                                </Badge>
                              )}
                              <Badge className={`${
                                booking.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-stone-100 text-stone-700'
                              } border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest`}>
                                {booking.status === 'approved' ? 'Confirmada' : 
                                 booking.status === 'pending' ? 'Em Aprovação' : 
                                 'Cancelada'}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-serif text-3xl font-black text-[#2C3E1F] mb-1">
                                {lesson ? format(new Date(lesson.date), "d 'de' MMMM", { locale: pt }) : 'Data Indisponível'}
                              </p>
                              <p className="text-lg text-[#B8956A] font-bold">
                                {lesson?.start_time || '--:--'} — {lesson?.end_time || '--:--'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            {booking.status === 'approved' && lesson && new Date(lesson.date) < new Date() && (
                              <Button
                                onClick={() => setFeedbackBooking(booking)}
                                variant="outline"
                                className="h-14 rounded-2xl border-stone-100 text-[#2C3E1F] font-black uppercase tracking-widest text-[10px] px-8 bg-white shadow-sm"
                              >
                                <Star className="w-4 h-4 mr-3 text-[#B8956A]" />
                                Avaliar Experiência
                              </Button>
                            )}

                            {booking.status === 'approved' && booking.attendance === 'pending' && (
                              <div className="flex gap-4">
                                <Button
                                  className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-green-600/10 transition-all hover:scale-105"
                                  onClick={() => updateAttendanceMutation.mutate({
                                    bookingId: booking.id,
                                    attendance: 'confirmed'
                                  })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-3" />
                                  Vou Comparacer
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-14 rounded-2xl border-red-100 text-red-600 font-black uppercase tracking-widest text-[10px] px-8 bg-white hover:bg-red-50 transition-all"
                                  onClick={() => updateAttendanceMutation.mutate({
                                    bookingId: booking.id,
                                    attendance: 'absent'
                                  })}
                                >
                                  <XCircle className="w-4 h-4 mr-3" />
                                  Não Poderei Ir
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-0">
            <div className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-10 px-12 border-b border-stone-50">
                <h3 className="text-2xl font-serif font-black text-[#2C3E1F]">Extrato Digital</h3>
              </div>
              <div className="p-12">
                {paymentsLoading ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-3xl bg-stone-50 animate-pulse" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                    <Euro className="w-20 h-20 text-stone-200 mx-auto mb-6" />
                    <p className="text-xl font-serif font-black text-stone-400">Sem histórico de transações</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-8 transition-all hover:bg-white hover:shadow-xl hover:border-white group"
                      >
                        <div className="space-y-2">
                          <p className="font-serif text-3xl font-black text-[#2C3E1F]">
                            {payment.month}
                          </p>
                          <div className="flex items-center gap-3 text-sm font-bold text-stone-400">
                            <CalendarIcon className="w-4 h-4" />
                            Vencimento: {payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yyyy') : 'Imediato'}
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <p className="text-4xl font-serif font-black text-[#11180D]">
                              {(payment.total || payment.amount).toFixed(2)}€
                            </p>
                            {payment.penalty > 0 && (
                              <p className="text-xs font-black uppercase tracking-widest text-red-500 mt-2">
                                +{payment.penalty.toFixed(2)}€ Mora
                              </p>
                            )}
                          </div>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="competitions" className="mt-0">
            <div className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-10 px-12 border-b border-stone-50">
                <h3 className="text-2xl font-serif font-black text-[#2C3E1F]">Minhas Provas</h3>
              </div>
              <div className="p-12">
                {entriesLoading ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-3xl bg-stone-50 animate-pulse" />
                    ))}
                  </div>
                ) : competitionEntries.length === 0 ? (
                  <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                    <Trophy className="w-20 h-20 text-stone-200 mx-auto mb-6" />
                    <p className="text-xl font-serif font-black text-stone-400">Sem inscrições em provas</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {competitionEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-8 transition-all hover:bg-white hover:shadow-xl hover:border-white group"
                      >
                        <div className="space-y-2">
                          <p className="font-serif text-3xl font-black text-[#2C3E1F]">
                            {entry.competition?.name || 'Competição'}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm font-bold text-stone-400">
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              {entry.competition?.date ? format(new Date(entry.competition.date), 'dd/MM/yyyy') : 'Data TBD'}
                            </span>
                            <span className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-[#B8956A]" />
                              {entry.horse_name}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Badge className={`${
                            entry.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                            entry.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          } border-none px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest`}>
                            {entry.status || 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-2xl border border-stone-100 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              <div className="p-10 px-12 border-b border-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-b from-stone-50/50 to-transparent">
                <div>
                  <h3 className="text-3xl font-serif font-black text-[#11180D]">Informações de Registo</h3>
                  <p className="text-stone-400 font-medium text-sm mt-1">Gira os seus dados pessoais e de faturação</p>
                </div>
                {!editMode ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setEditMode(true)}
                    className="h-14 rounded-2xl border-stone-100 text-[#B8956A] font-black uppercase tracking-widest text-[10px] px-8 bg-white hover:bg-[#B8956A] hover:text-white transition-all duration-500 shadow-sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Dados
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          full_name: user.full_name || '',
                          phone: user.phone || '',
                          address: user.address || ''
                        });
                      }}
                      className="h-14 rounded-2xl text-stone-400 hover:bg-stone-50 font-black uppercase tracking-widest text-[10px] px-6"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateUserMutation.isPending}
                      className="h-14 rounded-2xl bg-[#11180D] text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-xl hover:bg-[#2C3E1F] transition-all"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Alterações
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nome Completo</Label>
                    {editMode ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="h-14 rounded-xl border-stone-100 bg-stone-50/50 font-bold"
                      />
                    ) : (
                      <p className="text-2xl font-serif font-black text-[#2C3E1F]">{user?.full_name || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-4 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Mail className="w-3 h-3"/> Endereço de Email</Label>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/50 group-hover:bg-white group-hover:shadow-md transition-all">
                      <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#B8956A]" />
                      </div>
                      <p className="text-xl font-bold text-stone-600">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Phone className="w-3 h-3"/> Telefone / WhatsApp</Label>
                    {editMode ? (
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-14 rounded-xl border-stone-100 bg-stone-50/50 font-bold"
                      />
                    ) : (
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/50 group-hover:bg-white group-hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center">
                          <Phone className="w-5 h-5 text-[#B8956A]" />
                        </div>
                        <p className="text-xl font-bold text-stone-600">{user?.phone || 'Não definido'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><MapPin className="w-3 h-3"/> Residência Fiscal</Label>
                    {editMode ? (
                      <Textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="rounded-xl border-stone-100 bg-stone-50/50 font-bold min-h-[120px]"
                      />
                    ) : (
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/50 group-hover:bg-white group-hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-[#B8956A]" />
                        </div>
                        <p className="text-lg font-bold text-stone-600 mt-2">{user?.address || 'Não definida'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-stone-100 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                <div className="p-10 px-12 border-b border-stone-50">
                  <h3 className="text-2xl font-serif font-black text-[#11180D]">Nova Mensagem</h3>
                  <p className="text-stone-400 font-medium text-sm mt-1">Envie as suas dúvidas para a administração</p>
                </div>
                <form onSubmit={handleSendMessage} className="p-12 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Assunto</Label>
                    <Input
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Ex: Questão sobre mensalidade"
                      className="h-14 rounded-xl border-stone-100 bg-stone-50/50 font-bold"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Mensagem</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escreva aqui a sua mensagem..."
                      className="min-h-[200px] rounded-2xl border-stone-100 bg-stone-50/50 font-medium p-6"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={sendMessageMutation.isPending}
                    className="w-full h-16 rounded-2xl bg-[#B8956A] hover:bg-[#11180D] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#B8956A]/20 transition-all"
                  >
                    <Send className="w-4 h-4 mr-3" />
                    {sendMessageMutation.isPending ? 'A enviar...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-stone-100 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                <div className="p-10 px-12 border-b border-stone-50">
                  <h3 className="text-2xl font-serif font-black text-[#11180D]">Histórico de Contactos</h3>
                </div>
                <div className="p-10 max-h-[600px] overflow-y-auto space-y-6">
                  {messagesLoading ? (
                    <div className="space-y-6">
                      {[1, 2].map(i => <div key={i} className="h-32 rounded-3xl bg-stone-50 animate-pulse" />)}
                    </div>
                  ) : userMessages.length === 0 ? (
                    <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                      <MessageSquare className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                      <p className="text-lg font-serif font-black text-stone-400">Sem mensagens enviadas</p>
                    </div>
                  ) : (
                    userMessages.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map((msg) => (
                      <div key={msg.id} className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-xl font-black text-[#2C3E1F]">{msg.subject}</h4>
                          <Badge className={msg.replied_at ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {msg.replied_at ? 'Respondida' : 'Enviada'}
                          </Badge>
                        </div>
                        <p className="text-stone-500 text-sm italic">"{msg.message}"</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">
                          {format(new Date(msg.created_date), "d 'de' MMMM", { locale: pt })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Premium Regulation Viewer */}
        <Dialog open={!!selectedRegulation} onOpenChange={() => setSelectedRegulation(null)}>
          <DialogContent className="max-w-7xl h-[95vh] rounded-[3rem] p-0 border-none shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] bg-[#11180D]">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-8 px-12 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#B8956A] rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-serif font-black text-white">{selectedRegulation?.title}</h2>
                </div>
                <Button
                  variant="ghost"
                  className="w-16 h-16 rounded-full text-white hover:bg-white/5"
                  onClick={() => setSelectedRegulation(null)}
                >
                  <X className="w-8 h-8" />
                </Button>
              </div>
              <div className="flex-grow p-8 bg-stone-100 overflow-hidden rounded-b-[3rem]">
                {selectedRegulation && (
                  <iframe
                    src={selectedRegulation.file_url}
                    className="w-full h-full rounded-[2rem] shadow-2xl"
                    title={selectedRegulation.title}
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Feedback Modal */}
        {feedbackBooking && (
          <FeedbackModal
            booking={feedbackBooking}
            onClose={() => setFeedbackBooking(null)}
            onSuccess={() => {
              queryClient.invalidateQueries(['reviews']);
              setFeedbackBooking(null);
            }}
          />
        )}
      </div>
    </div>
  );
}