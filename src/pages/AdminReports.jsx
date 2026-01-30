import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Euro, Calendar, Users
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';

const COLORS = ['#B8956A', '#8B7355', '#C9A961', '#A68B6A', '#6B5845'];

export default function AdminReports() {
  const { data: bookings } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    initialData: []
  });

  const { data: payments } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
    initialData: []
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const { data: lessons } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list('-created_date', 500),
    initialData: []
  });

  // Calculations
  const currentMonth = new Date();
  
  const monthLessons = lessons.filter(l => {
    const lessonDate = new Date(l.date);
    return lessonDate.getMonth() === currentMonth.getMonth() && 
           lessonDate.getFullYear() === currentMonth.getFullYear();
  });

  const monthLessonsRevenue = monthLessons.reduce((sum, lesson) => {
    const service = services.find(s => s.id === lesson.service_id);
    const bookedSpots = lesson.booked_spots || 0;
    return sum + (service?.price || 0) * bookedSpots;
  }, 0);

  const pendingPayments = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);

  const lessonsByDay = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayLessons = lessons.filter(l => 
      format(new Date(l.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      date: format(date, 'EEE', { locale: pt }),
      lessons: dayLessons.length
    };
  });

  const serviceStats = services.map(service => ({
    name: service.title,
    lessons: lessons.filter(l => l.service_id === service.id).length
  })).sort((a, b) => b.lessons - a.lessons).slice(0, 5);

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
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Aulas Este Mês</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{monthLessons.length}</p>
                  <p className="text-xs text-stone-400">Total de aulas: {lessons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Receita Estimada (Mês)</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{monthLessonsRevenue.toFixed(2)}€</p>
                  <p className="text-xs text-stone-400">Baseado em aulas realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Reservas Totais</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{bookings.length}</p>
                  <p className="text-xs text-stone-400">Aprovadas: {bookings.filter(b => b.status === 'approved').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
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
          {/* Lessons Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Aulas dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lessonsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="lessons" stroke="#B8956A" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Top 5 Serviços Mais Usados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="lessons" fill="#B8956A" />
                </BarChart>
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