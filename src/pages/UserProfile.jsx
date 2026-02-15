import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, Calendar, Euro, History, MessageSquare, 
  Mail, Phone, MapPin, Edit2, Save, X, CheckCircle2,
  Clock, AlertCircle, Ban, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageProvider';
import FeedbackModal from '@/components/FeedbackModal';

export default function UserProfile() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState('info');
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState(null);
  
  // Form states for edit mode
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });
  
  // Message form
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
      } catch (error) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['user-bookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ client_email: user.email });
    },
    enabled: !!user?.email,
  });

  // Fetch lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list(),
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['user-payments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Payment.filter({ client_email: user.email });
    },
    enabled: !!user?.email,
  });

  // Update user info mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setEditMode(false);
      setUser({ ...user, ...formData });
    },
  });

  // Fetch user messages
  const { data: userMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['user-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.ContactMessage.filter({ email: user.email });
    },
    enabled: !!user?.email,
  });

  // Fetch user feedbacks
  const { data: userFeedbacks = [] } = useQuery({
    queryKey: ['user-feedbacks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Feedback.filter({ client_email: user.email });
    },
    enabled: !!user?.email,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ContactMessage.create({
        name: user.full_name,
        email: user.email,
        subject: data.subject,
        message: data.message,
        phone: user.phone || ''
      });
    },
    onSuccess: () => {
      setMessage('');
      setMessageSubject('');
      queryClient.invalidateQueries(['user-messages']);
      alert('Mensagem enviada com sucesso!');
    },
  });

  const handleSaveProfile = () => {
    updateUserMutation.mutate(formData);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageSubject.trim() || !message.trim()) {
      alert('Por favor preencha o assunto e a mensagem');
      return;
    }
    sendMessageMutation.mutate({ subject: messageSubject, message });
  };

  // Check if booking already has feedback
  const hasFeedback = (bookingId) => {
    return userFeedbacks.some(feedback => feedback.booking_id === bookingId);
  };

  // Get lesson info for booking
  const getLessonInfo = (booking) => {
    const lesson = lessons.find(l => l.id === booking.lesson_id);
    if (!lesson) return null;
    const service = services.find(s => s.id === lesson.service_id);
    return { lesson, service };
  };

  // Calculate stats
  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(b => {
    const lessonInfo = getLessonInfo(b);
    return lessonInfo?.lesson && new Date(lessonInfo.lesson.date) >= new Date();
  }).length;
  
  const totalDebt = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);
  
  const isBlocked = payments.some(p => p.status === 'blocked');

  // Separate upcoming and past bookings
  const now = new Date();
  const upcomingBookingsList = bookings
    .filter(b => {
      const lessonInfo = getLessonInfo(b);
      return lessonInfo?.lesson && new Date(lessonInfo.lesson.date) >= now;
    })
    .sort((a, b) => {
      const lessonA = getLessonInfo(a)?.lesson;
      const lessonB = getLessonInfo(b)?.lesson;
      return new Date(lessonA?.date || 0) - new Date(lessonB?.date || 0);
    });

  const pastBookingsList = bookings
    .filter(b => {
      const lessonInfo = getLessonInfo(b);
      return lessonInfo?.lesson && new Date(lessonInfo.lesson.date) < now;
    })
    .sort((a, b) => {
      const lessonA = getLessonInfo(a)?.lesson;
      const lessonB = getLessonInfo(b)?.lesson;
      return new Date(lessonB?.date || 0) - new Date(lessonA?.date || 0);
    });

  const renderStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: 'Aprovada', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelada', className: 'bg-stone-100 text-stone-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const renderPaymentStatus = (status) => {
    const statusConfig = {
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      overdue: { label: 'Atrasado', className: 'bg-red-100 text-red-800', icon: AlertCircle },
      blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-800', icon: Ban },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-serif font-bold text-[#2C3E1F]">
                Olá, {user?.full_name?.split(' ')[0] || 'Aluno'}
              </h1>
              <p className="text-stone-600 mt-2">Gerencie o seu perfil e acompanhe as suas atividades</p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
          </div>

          {/* Account Status Alert */}
          {isBlocked && (
            <Alert className="bg-red-50 border-red-200 mb-6">
              <Ban className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                A sua conta está bloqueada devido a pagamentos em atraso. Por favor, regularize a situação para continuar a reservar aulas.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Reservas Ativas</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{upcomingBookings}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total de Aulas</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{totalBookings}</p>
                  </div>
                  <History className="w-12 h-12 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${totalDebt > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-green-50 to-green-100 border-green-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>Saldo Pendente</p>
                    <p className={`text-3xl font-bold mt-1 ${totalDebt > 0 ? 'text-red-900' : 'text-green-900'}`}>€{totalDebt.toFixed(2)}</p>
                  </div>
                  <Euro className={`w-12 h-12 ${totalDebt > 0 ? 'text-red-400' : 'text-green-400'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próximas Aulas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                {!editMode ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          full_name: user.full_name || '',
                          phone: user.phone || '',
                          address: user.address || ''
                        });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={updateUserMutation.isPending}
                      className="bg-[#2C3E1F] hover:bg-[#1A2412]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  {editMode ? (
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg font-medium">{user?.full_name || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <p className="text-lg">{user?.email}</p>
                  <p className="text-xs text-stone-500">O email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  {editMode ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+351 XXX XXX XXX"
                    />
                  ) : (
                    <p className="text-lg">{user?.phone || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Morada
                  </Label>
                  {editMode ? (
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Cidade, Código Postal"
                      rows={3}
                    />
                  ) : (
                    <p className="text-lg">{user?.address || '-'}</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-stone-500">
                    Membro desde {format(new Date(user?.created_date), "MMMM 'de' yyyy", { locale: pt })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Bookings Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Próximas Aulas ({upcomingBookingsList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                  </div>
                ) : upcomingBookingsList.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                    <p className="text-stone-600 text-lg">Não tem aulas agendadas</p>
                    <p className="text-stone-500 text-sm mt-2">Reserve a sua próxima aula na página de reservas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookingsList.map((booking) => {
                      const info = getLessonInfo(booking);
                      if (!info) return null;
                      const { lesson, service } = info;

                      return (
                        <Card key={booking.id} className="border-l-4 border-[#B8956A]">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-[#2C3E1F]">{service?.title}</h3>
                                  {renderStatusBadge(booking.status)}
                                </div>
                                <div className="space-y-1 text-sm text-stone-600">
                                <p className="flex items-center gap-2">
                                 <Calendar className="w-4 h-4" />
                                 {format(new Date(lesson.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
                                </p>
                                <p className="flex items-center gap-2">
                                 <Clock className="w-4 h-4" />
                                 {lesson.start_time} - {lesson.end_time}
                                </p>
                                {(booking.attendance === 'present' || booking.attendance_status === 'present') && (
                                 <div className="flex items-center gap-2 mt-2">
                                   <Badge className="bg-green-100 text-green-800 border border-green-300">
                                     <CheckCircle2 className="w-3 h-3 mr-1" />
                                     Presença Confirmada
                                   </Badge>
                                 </div>
                                )}
                                {(booking.attendance === 'absent' || booking.attendance_status === 'absent') && (
                                 <div className="flex items-center gap-2 mt-2">
                                   <Badge className="bg-red-100 text-red-800 border border-red-300">
                                     <X className="w-3 h-3 mr-1" />
                                     Ausência Registada
                                   </Badge>
                                   {booking.absence_compensable !== undefined && (
                                     <Badge className={`${booking.absence_compensable ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-stone-100 text-stone-800 border-stone-300'}`}>
                                       {booking.absence_compensable ? 'Compensável' : 'Não Compensável'}
                                     </Badge>
                                   )}
                                 </div>
                                )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Aulas ({pastBookingsList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
                  </div>
                ) : pastBookingsList.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                    <p className="text-stone-600 text-lg">Sem histórico de aulas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastBookingsList.map((booking) => {
                      const info = getLessonInfo(booking);
                      if (!info) return null;
                      const { lesson, service } = info;

                      return (
                        <Card key={booking.id} className="opacity-75">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-[#2C3E1F]">{service?.title}</h3>
                                  {renderStatusBadge(booking.status)}
                                </div>
                                <div className="space-y-1 text-sm text-stone-600">
                                <p className="flex items-center gap-2">
                                 <Calendar className="w-4 h-4" />
                                 {format(new Date(lesson.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                </p>
                                <p className="flex items-center gap-2">
                                 <Clock className="w-4 h-4" />
                                 {lesson.start_time} - {lesson.end_time}
                                </p>
                                {(booking.attendance === 'present' || booking.attendance_status === 'present') && (
                                 <div className="flex items-center gap-2 mt-2">
                                   <Badge className="bg-green-100 text-green-800 border border-green-300">
                                     <CheckCircle2 className="w-3 h-3 mr-1" />
                                     Presença Confirmada
                                   </Badge>
                                 </div>
                                )}
                                {(booking.attendance === 'absent' || booking.attendance_status === 'absent') && (
                                 <div className="flex flex-col gap-2 mt-2">
                                   <Badge className="bg-red-100 text-red-800 border border-red-300 w-fit">
                                     <X className="w-3 h-3 mr-1" />
                                     Ausência Registada
                                   </Badge>
                                   {booking.absence_compensable !== undefined && (
                                     <Badge className={`w-fit ${booking.absence_compensable ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-stone-100 text-stone-800 border-stone-300'}`}>
                                       {booking.absence_compensable ? 'Ausência Compensável' : 'Ausência Não Compensável'}
                                     </Badge>
                                   )}
                                 </div>
                                )}
                                </div>
                                </div>
                                {hasFeedback(booking.id) ? (
                                <Badge className="bg-green-100 text-green-800 mt-3">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Feedback Enviado
                                </Badge>
                                ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBookingForFeedback(booking);
                                    setShowFeedback(true);
                                  }}
                                  className="flex items-center gap-2 mt-3"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Deixar Feedback
                                </Button>
                                )}
                                </div>
                                </CardContent>
                                </Card>
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
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <Euro className="w-16 h-16 mx-auto text-stone-300 mb-4" />
                    <p className="text-stone-600 text-lg">Sem pagamentos registados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments
                      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                      .map((payment) => (
                        <Card key={payment.id} className={payment.status === 'overdue' ? 'border-red-300' : ''}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold">
                                    {payment.month ? format(new Date(payment.month + '-01'), "MMMM 'de' yyyy", { locale: pt }) : 'Pagamento'}
                                  </h4>
                                  {renderPaymentStatus(payment.status)}
                                </div>
                                <p className="text-sm text-stone-600">
                                  Vencimento: {payment.due_date ? format(new Date(payment.due_date), "d 'de' MMMM", { locale: pt }) : '-'}
                                </p>
                                {payment.notes && (
                                  <p className="text-xs text-stone-500 mt-1">{payment.notes}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-[#2C3E1F]">
                                  €{(payment.total || payment.amount).toFixed(2)}
                                </p>
                                {payment.penalty > 0 && (
                                  <p className="text-xs text-red-600">
                                    +€{payment.penalty.toFixed(2)} penalização
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="space-y-6">
              {/* Historical Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Minhas Mensagens ({userMessages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
                    </div>
                  ) : userMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                      <p className="text-stone-600">Ainda não enviou nenhuma mensagem</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userMessages
                        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                        .map((msg) => (
                          <Card key={msg.id} className={msg.replied_at ? 'border-l-4 border-green-500' : 'border-l-4 border-blue-500'}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold text-[#2C3E1F]">{msg.subject}</h4>
                                      {msg.replied_at ? (
                                        <Badge className="bg-green-100 text-green-800">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Respondida
                                        </Badge>
                                      ) : msg.is_read ? (
                                        <Badge className="bg-blue-100 text-blue-800">Lida</Badge>
                                      ) : (
                                        <Badge className="bg-yellow-100 text-yellow-800">Enviada</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-stone-500 mb-2">
                                      {format(new Date(msg.created_date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="bg-stone-50 p-3 rounded-lg">
                                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{msg.message}</p>
                                </div>

                                {msg.replied_at && (
                                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg mt-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-semibold text-green-800">
                                        Resposta recebida em {format(new Date(msg.replied_at), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-stone-600 italic">
                                      A resposta foi enviada para o seu email: {msg.email}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Send New Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Enviar Nova Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        placeholder="Motivo do contacto"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escreva a sua mensagem..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#2C3E1F] hover:bg-[#1A2412]"
                      disabled={sendMessageMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendMessageMutation.isPending ? 'A enviar...' : 'Enviar Mensagem'}
                    </Button>
                  </form>

                  <div className="mt-6 p-4 bg-stone-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Outras formas de contacto:</h4>
                    <div className="space-y-2 text-sm text-stone-600">
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        +351 932 111 786
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        picadeiroquintadahortagf@gmail.com
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Modal */}
      {showFeedback && selectedBookingForFeedback && (
        <FeedbackModal
          booking={selectedBookingForFeedback}
          onClose={() => {
            setShowFeedback(false);
            setSelectedBookingForFeedback(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['user-bookings']);
            queryClient.invalidateQueries(['user-feedbacks']);
          }}
        />
      )}
    </div>
  );
}