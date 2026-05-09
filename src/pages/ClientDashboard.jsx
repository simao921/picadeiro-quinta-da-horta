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
  AlertCircle, Euro, LogOut,
  Calendar as CalendarIcon, FileText, Eye, X, Star, Trash2
} from 'lucide-react';
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

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [selectedRegulation, setSelectedRegulation] = useState(null);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const queryClient = useQueryClient();

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
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#2C3E1F]">
                Olá, {user.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-stone-600">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 w-fit"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isto irá eliminar permanentemente a sua conta 
                      e remover todos os seus dados dos nossos servidores, incluindo todas as suas reservas e pagamentos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sim, eliminar a minha conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                onClick={() => base44.auth.logout()}
                className="w-fit"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Terminar Sessão
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Alert if blocked */}
        {isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Conta Bloqueada</h3>
                <p className="text-red-700 text-sm">
                  A sua conta está bloqueada devido a dívidas superiores a 30€. 
                  Por favor regularize a sua situação para poder continuar a ter aulas e participar em provas.
                </p>
                <p className="text-red-800 font-semibold mt-2">
                  Dívida total: {totalDebt.toFixed(2)}€
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Reservas Ativas</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">
                    {bookings.filter(b => b.status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Pendentes</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${totalDebt > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                  <Euro className={`w-6 h-6 ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Dívida</p>
                  <p className={`text-2xl font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalDebt.toFixed(2)}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Regulations Section */}
        {regulations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-[#B8956A] bg-gradient-to-br from-stone-50 to-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#B8956A]" />
                  Regulamento Interno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {regulations.map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-stone-200 hover:border-[#B8956A] transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-[#B8956A]" />
                        <div>
                          <p className="font-medium text-[#2C3E1F]">{reg.title}</p>
                          <p className="text-xs text-stone-500">Documento em PDF</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#B8956A] text-[#B8956A] hover:bg-[#B8956A] hover:text-white"
                        onClick={() => setSelectedRegulation(reg)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Documento
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-[#B8956A] data-[state=active]:text-white">
              Minhas Aulas
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#B8956A] data-[state=active]:text-white">
              Pagamentos
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Reservas</CardTitle>
                <Link to={createPageUrl('Bookings')}>
                  <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Nova Reserva
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">Ainda não tem reservas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const lesson = lessons.find(l => l.id === booking.lesson_id);
                      return (
                        <div
                          key={booking.id}
                          className="p-4 bg-stone-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {isLessonCompleted(lesson) && booking.status === 'approved' && (
                                <Badge className="bg-green-600 text-white">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Efetuada
                                </Badge>
                              )}
                              {getStatusBadge(booking.status)}
                              {booking.attendance && (
                                <Badge variant="outline">
                                  Presença: {booking.attendance === 'confirmed' ? 'Confirmada' : booking.attendance === 'absent' ? 'Ausente' : 'Pendente'}
                                </Badge>
                              )}
                              {booking.status === 'approved' && lesson && new Date(lesson.date) < new Date() && (
                                <Button
                                  onClick={() => setFeedbackBooking(booking)}
                                  variant="outline"
                                  size="sm"
                                  className="ml-auto"
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Deixar Feedback
                                </Button>
                              )}
                            </div>
                            <p className="font-semibold text-[#2C3E1F]">
                              {lesson ? format(new Date(lesson.date), "d 'de' MMMM", { locale: pt }) : 'Data não disponível'}
                            </p>
                            <p className="text-sm text-stone-500">
                              {lesson?.start_time || '--:--'} - {lesson?.end_time || '--:--'}
                            </p>
                          </div>

                          {booking.status === 'approved' && booking.attendance === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => updateAttendanceMutation.mutate({
                                  bookingId: booking.id,
                                  attendance: 'confirmed'
                                })}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Vou
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => updateAttendanceMutation.mutate({
                                  bookingId: booking.id,
                                  attendance: 'absent'
                                })}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Não Vou
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <Euro className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">Sem pagamentos registados.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 bg-stone-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-semibold text-[#2C3E1F]">
                            {payment.month}
                          </p>
                          <p className="text-sm text-stone-500">
                            Vencimento: {payment.due_date ? format(new Date(payment.due_date), 'dd/MM/yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {(payment.total || payment.amount).toFixed(2)}€
                            </p>
                            {payment.penalty > 0 && (
                              <p className="text-xs text-red-600">
                                Inclui {payment.penalty.toFixed(2)}€ de penalização
                              </p>
                            )}
                          </div>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Regulation Viewer Dialog */}
        <Dialog open={!!selectedRegulation} onOpenChange={() => setSelectedRegulation(null)}>
          <DialogContent className="max-w-6xl h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#B8956A]" />
                  {selectedRegulation?.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRegulation(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full">
              {selectedRegulation && (
                <iframe
                  src={selectedRegulation.file_url}
                  className="w-full h-full rounded-lg"
                  title={selectedRegulation.title}
                />
              )}
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