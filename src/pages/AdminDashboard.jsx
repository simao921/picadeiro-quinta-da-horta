import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Euro, 
  TrendingUp, Clock, CheckCircle, Bell, Package, MessageSquare, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { data: bookings } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
    initialData: []
  });

  const { data: payments } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
    initialData: []
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
    initialData: []
  });

  const { data: messages } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => base44.entities.ContactMessage.filter({ is_read: false }),
    initialData: []
  });

  const { data: lessons } = useQuery({
    queryKey: ['admin-lessons-today'],
    queryFn: () => base44.entities.Lesson.filter({ date: format(new Date(), 'yyyy-MM-dd') }),
    initialData: []
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  // Receita de pagamentos (mensalidades, etc)
  const paymentsRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);
  
  // Receita de encomendas da loja
  const ordersRevenue = orders
    .filter(o => o.status === 'entregue' || o.status === 'enviada')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Receita total interligada
  const totalRevenue = paymentsRevenue + ordersRevenue;

  const stats = [
    { 
      label: 'Reservas Pendentes', 
      value: pendingBookings.length, 
      icon: CalendarDays, 
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      link: 'AdminLessons'
    },
    { 
      label: 'Aulas Hoje', 
      value: lessons.length, 
      icon: Clock, 
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      link: 'AdminLessons'
    },
    { 
      label: 'Mensagens Não Lidas', 
      value: messages.length, 
      icon: MessageSquare, 
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      link: 'AdminMessages'
    },
    { 
      label: 'Encomendas Pendentes', 
      value: pendingOrders.length, 
      icon: Package, 
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      link: 'AdminOrders'
    },
    { 
      label: 'Pagamentos Pendentes', 
      value: pendingPayments.length, 
      icon: Euro, 
      color: 'bg-red-500',
      bgLight: 'bg-red-50',
      link: 'AdminPayments'
    },
    { 
      label: 'Receita Total', 
      value: `${totalRevenue.toFixed(0)}€`, 
      icon: TrendingUp, 
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      link: 'AdminPayments'
    },
  ];

  return (
    <AdminLayout currentPage="AdminDashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Dashboard</h1>
          <p className="text-stone-500">Visão geral do Picadeiro Quinta da Horta</p>
        </div>

        {/* Notifications Banner */}
        {(pendingBookings.length > 0 || pendingOrders.length > 0 || messages.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#B8956A] to-[#8B7355] rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <div className="flex-1">
                <h3 className="font-semibold">Ações Necessárias</h3>
                <div className="flex flex-wrap gap-3 mt-1 text-sm">
                  {pendingBookings.length > 0 && (
                    <Link to={createPageUrl('AdminLessons')} className="hover:underline">
                      {pendingBookings.length} reserva{pendingBookings.length > 1 ? 's' : ''} pendente{pendingBookings.length > 1 ? 's' : ''}
                    </Link>
                  )}
                  {pendingOrders.length > 0 && (
                    <>
                      {pendingBookings.length > 0 && <span>•</span>}
                      <Link to={createPageUrl('AdminOrders')} className="hover:underline">
                        {pendingOrders.length} encomenda{pendingOrders.length > 1 ? 's' : ''} pendente{pendingOrders.length > 1 ? 's' : ''}
                      </Link>
                    </>
                  )}
                  {messages.length > 0 && (
                    <>
                      {(pendingBookings.length > 0 || pendingOrders.length > 0) && <span>•</span>}
                      <Link to={createPageUrl('AdminMessages')} className="hover:underline">
                        {messages.length} mensagem{messages.length > 1 ? 'ns' : ''} não lida{messages.length > 1 ? 's' : ''}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Link key={stat.label} to={createPageUrl(stat.link)}>
              <StatCard {...stat} delay={index * 0.05} />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Bookings */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Reservas Pendentes</CardTitle>
              <Badge className="bg-amber-100 text-amber-800">{pendingBookings.length}</Badge>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>Todas as reservas estão processadas!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="p-3 bg-stone-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-[#2C3E1F]">{booking.client_name}</p>
                          <p className="text-xs text-stone-500">{booking.client_email}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>
                      </div>
                      <Link to={createPageUrl('AdminLessons')}>
                        <Button size="sm" variant="outline" className="w-full mt-2">
                          <Eye className="w-3 h-3 mr-1" />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unread Messages */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Mensagens Não Lidas</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">{messages.length}</Badge>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>Todas as mensagens foram lidas!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 5).map((msg) => (
                    <div key={msg.id} className="p-3 bg-stone-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-[#2C3E1F]">{msg.name}</p>
                        <span className="text-xs text-stone-400">
                          {msg.created_date && format(new Date(msg.created_date), 'dd/MM')}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 line-clamp-1 mb-2">{msg.message}</p>
                      <Link to={createPageUrl('AdminMessages')}>
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="w-3 h-3 mr-1" />
                          Ler Mensagem
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Lessons */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Aulas de Hoje</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">{lessons.length}</Badge>
            </CardHeader>
            <CardContent>
              {lessons.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                  <p>Sem aulas agendadas para hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="p-3 bg-stone-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#2C3E1F]">{lesson.start_time} - {lesson.end_time}</p>
                        <p className="text-sm text-stone-500">{lesson.booked_spots || 0} reservas</p>
                      </div>
                      <Badge className={lesson.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {lesson.status === 'completed' ? 'Concluída' : 'Agendada'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Encomendas Pendentes</CardTitle>
              <Badge className="bg-purple-100 text-purple-800">{pendingOrders.length}</Badge>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  <p>Todas as encomendas estão processadas!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="p-3 bg-stone-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#2C3E1F]">{order.client_name}</p>
                        <p className="text-sm text-stone-500">{order.items?.length || 0} produtos</p>
                      </div>
                      <p className="font-bold text-[#4A5D23]">{order.total?.toFixed(2)}€</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}