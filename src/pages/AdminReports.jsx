import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Euro, ShoppingBag, Users, 
  Calendar, Package, Loader2 
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';

const COLORS = ['#B8956A', '#8B7355', '#C9A961', '#A68B6A', '#6B5845'];

export default function AdminReports() {
  const { data: orders } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    initialData: []
  });

  const { data: bookings } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    initialData: []
  });

  const { data: products } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: payments } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
    initialData: []
  });

  // Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const monthRevenue = orders
    .filter(o => new Date(o.created_date) >= startOfMonth(new Date()))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingPayments = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);

  const topProducts = products
    .map(p => ({
      name: p.name,
      sales: orders.reduce((sum, o) => {
        const item = o.items?.find(i => i.product_id === p.id);
        return sum + (item?.quantity || 0);
      }, 0)
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = orders.filter(o => 
      format(new Date(o.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      date: format(date, 'EEE', { locale: pt }),
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  });

  const ordersByStatus = [
    { name: 'Pendente', value: orders.filter(o => o.status === 'pendente').length },
    { name: 'Processamento', value: orders.filter(o => o.status === 'processamento').length },
    { name: 'Enviada', value: orders.filter(o => o.status === 'enviada').length },
    { name: 'Entregue', value: orders.filter(o => o.status === 'entregue').length }
  ];

  const bookingsByStatus = [
    { name: 'Pendente', value: bookings.filter(b => b.status === 'pending').length },
    { name: 'Aprovada', value: bookings.filter(b => b.status === 'approved').length },
    { name: 'Rejeitada', value: bookings.filter(b => b.status === 'rejected').length }
  ];

  return (
    <AdminLayout currentPage="AdminReports">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Relatórios e Estatísticas</h1>
          <p className="text-stone-500">Visão geral do desempenho do negócio</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Receita Total</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{totalRevenue.toFixed(2)}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Este Mês</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{monthRevenue.toFixed(2)}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Total Encomendas</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Pagamentos Pendentes</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{pendingPayments.toFixed(2)}€</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#B8956A" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#B8956A" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Encomendas por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bookings by Status */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Reservas por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookingsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}