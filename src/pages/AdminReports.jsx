import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, Euro, ShoppingBag, 
  Calendar, Download, FileText, UserCheck, UserX
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

const COLORS = ['#B8956A', '#8B7355', '#C9A961', '#A68B6A', '#6B5845'];

export default function AdminReports() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
    initialData: []
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['all-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
    initialData: []
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.Lesson.list('-created_date', 500),
    initialData: []
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => base44.entities.Instructor.list(),
    initialData: []
  });

  // Calculations - Receita Total Interligada
  const ordersRevenue = orders
    .filter(o => o.status === 'entregue' || o.status === 'enviada')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  
  const paymentsRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);
  
  const totalRevenue = ordersRevenue + paymentsRevenue;
  
  const currentMonth = new Date();
  const monthOrders = orders.filter(o => {
    const orderDate = new Date(o.created_date);
    return orderDate.getMonth() === currentMonth.getMonth() && 
           orderDate.getFullYear() === currentMonth.getFullYear() &&
           (o.status === 'entregue' || o.status === 'enviada');
  });
  
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const monthPayments = payments.filter(p => {
    const paymentDate = new Date(p.created_date);
    return paymentDate.getMonth() === currentMonth.getMonth() && 
           paymentDate.getFullYear() === currentMonth.getFullYear() &&
           p.status === 'paid';
  });

  const monthPaymentsRevenue = monthPayments.reduce((sum, p) => sum + (p.total || p.amount), 0);

  const totalMonthRevenue = monthRevenue + monthPaymentsRevenue;

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

  // Métricas de Frequência
  const attendanceByService = useMemo(() => {
    const stats = {};
    
    lessons.forEach(lesson => {
      const service = services.find(s => s.id === lesson.service_id);
      const serviceName = service?.title || 'Sem Serviço';
      
      if (!stats[serviceName]) {
        stats[serviceName] = { present: 0, absent: 0, total: 0 };
      }
      
      const lessonBookings = bookings.filter(b => 
        b.lesson_id === lesson.id && b.status === 'approved'
      );
      
      lessonBookings.forEach(b => {
        stats[serviceName].total += 1;
        if (b.attendance === 'present' || b.attendance_status === 'present') {
          stats[serviceName].present += 1;
        } else if (b.attendance === 'absent' || b.attendance_status === 'absent') {
          stats[serviceName].absent += 1;
        }
      });
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      presentes: data.present,
      ausentes: data.absent,
      taxa: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0
    }));
  }, [lessons, services, bookings]);

  const attendanceByInstructor = useMemo(() => {
    const stats = {};
    
    lessons.forEach(lesson => {
      const instructor = instructors.find(i => i.id === lesson.instructor_id);
      const instructorName = instructor?.name || 'Sem Monitor';
      
      if (!stats[instructorName]) {
        stats[instructorName] = { present: 0, absent: 0, total: 0 };
      }
      
      const lessonBookings = bookings.filter(b => 
        b.lesson_id === lesson.id && b.status === 'approved'
      );
      
      lessonBookings.forEach(b => {
        stats[instructorName].total += 1;
        if (b.attendance === 'present' || b.attendance_status === 'present') {
          stats[instructorName].present += 1;
        } else if (b.attendance === 'absent' || b.attendance_status === 'absent') {
          stats[instructorName].absent += 1;
        }
      });
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      presentes: data.present,
      ausentes: data.absent,
      taxa: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0
    }));
  }, [lessons, instructors, bookings]);

  // Estatísticas de Aulas
  const lessonStats = useMemo(() => {
    const completed = lessons.filter(l => {
      if (!l.date || !l.end_time) return false;
      const lessonDateTime = new Date(`${l.date}T${l.end_time}:00`);
      return lessonDateTime < new Date();
    }).length;
    
    const cancelled = lessons.filter(l => l.status === 'cancelled').length;
    const scheduled = lessons.length - completed - cancelled;
    
    const approvedBookings = bookings.filter(b => b.status === 'approved');
    const present = approvedBookings.filter(b => 
      b.attendance === 'present' || b.attendance_status === 'present'
    ).length;
    const absent = approvedBookings.filter(b => 
      b.attendance === 'absent' || b.attendance_status === 'absent'
    ).length;
    const compensable = approvedBookings.filter(b => 
      (b.attendance === 'absent' || b.attendance_status === 'absent') && 
      b.absence_compensable === true
    ).length;
    const nonCompensable = approvedBookings.filter(b => 
      (b.attendance === 'absent' || b.attendance_status === 'absent') && 
      b.absence_compensable === false
    ).length;
    
    return {
      completed,
      cancelled,
      scheduled,
      present,
      absent,
      compensable,
      nonCompensable
    };
  }, [lessons, bookings]);

  // Função de Exportação CSV (formato profissional PT/EU)
  const exportToCSV = () => {
    if (!lessons || lessons.length === 0) {
      toast.error('Não há dados de aulas para exportar');
      return;
    }

    setIsExporting(true);

    const rows = [
      ['RELATÓRIO DE AULAS - PICADEIRO QUINTA DA HORTA'],
      [''],
      ['Data de Exportação:', format(new Date(), 'dd/MM/yyyy HH:mm')],
      ['Período:', 'Todos os registos'],
      [''],
      ['═══════════════════════════════════════════════════════════════'],
      ['RESUMO GERAL DE AULAS'],
      ['═══════════════════════════════════════════════════════════════'],
      ['Métrica', 'Valor'],
      ['Aulas Completas', lessonStats.completed],
      ['Aulas Canceladas', lessonStats.cancelled],
      ['Aulas Agendadas', lessonStats.scheduled],
      ['Total de Aulas', lessons.length],
      [''],
      ['═══════════════════════════════════════════════════════════════'],
      ['RESUMO DE PRESENÇAS E AUSÊNCIAS'],
      ['═══════════════════════════════════════════════════════════════'],
      ['Métrica', 'Quantidade'],
      ['Total de Presenças', lessonStats.present],
      ['Total de Ausências', lessonStats.absent],
      ['Ausências Compensáveis', lessonStats.compensable],
      ['Ausências Não Compensáveis', lessonStats.nonCompensable],
      ['Taxa de Presença Global', lessonStats.present + lessonStats.absent > 0 ? `${((lessonStats.present / (lessonStats.present + lessonStats.absent)) * 100).toFixed(1)}%` : 'N/A'],
      [''],
      ['═══════════════════════════════════════════════════════════════'],
      ['FREQUÊNCIA POR SERVIÇO'],
      ['═══════════════════════════════════════════════════════════════'],
      ['Serviço', 'Presentes', 'Ausentes', 'Total', 'Taxa de Presença (%)'],
      ...attendanceByService.map(s => [
        s.name, 
        s.presentes, 
        s.ausentes, 
        s.presentes + s.ausentes,
        `${s.taxa}%`
      ]),
      [''],
      ['═══════════════════════════════════════════════════════════════'],
      ['FREQUÊNCIA POR MONITOR'],
      ['═══════════════════════════════════════════════════════════════'],
      ['Monitor', 'Presentes', 'Ausentes', 'Total', 'Taxa de Presença (%)'],
      ...attendanceByInstructor.map(i => [
        i.name, 
        i.presentes, 
        i.ausentes,
        i.presentes + i.ausentes,
        `${i.taxa}%`
      ]),
      [''],
      ['═══════════════════════════════════════════════════════════════'],
      [''],
      ['Relatório gerado automaticamente pelo sistema'],
      ['Picadeiro Quinta da Horta - Rua das Hortas, Fonte da Senhora'],
      ['2890-106 Alcochete - Portugal'],
      ['Tel: +351 932 111 786']
    ];
    
    // Usar ponto e vírgula como separador (padrão PT/EU)
    const csvContent = rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell || '');
        // Adicionar aspas se contiver vírgula, ponto e vírgula ou quebra de linha
        if (cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';')
    ).join('\n');
    
    try {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio-aulas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('Relatório CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Função de Exportação PDF (formato profissional)
  const exportToPDF = async () => {
    if (!lessons || lessons.length === 0) {
      toast.error('Não há dados de aulas para exportar');
      return;
    }

    setIsExporting(true);

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 20;
      
      // Cabeçalho com cores
      doc.setFillColor(184, 149, 106); // #B8956A
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Logo/Título
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('RELATÓRIO DE AULAS', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text('Picadeiro Quinta da Horta', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(9);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 33, { align: 'center' });
      
      y = 50;
      doc.setTextColor(0, 0, 0);
      
      // Função auxiliar para desenhar caixas
      const drawBox = (title, data, startY) => {
        let currentY = startY;
        
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 20;
        }
        
        // Título da secção
        doc.setFillColor(139, 115, 85); // #8B7355
        doc.rect(15, currentY, pageWidth - 30, 10, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(title, 20, currentY + 7);
        currentY += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        // Dados
        data.forEach(([label, value]) => {
          if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(`${label}:`, 20, currentY);
          doc.setFont(undefined, 'bold');
          doc.text(String(value), 120, currentY);
          doc.setFont(undefined, 'normal');
          currentY += 7;
        });
        
        return currentY + 5;
      };
      
      // Resumo Geral de Aulas
      y = drawBox('RESUMO GERAL DE AULAS', [
        ['Total de Aulas', lessons.length],
        ['Aulas Completas', lessonStats.completed],
        ['Aulas Canceladas', lessonStats.cancelled],
        ['Aulas Agendadas', lessonStats.scheduled]
      ], y);
      
      // Resumo de Presenças
      const globalRate = lessonStats.present + lessonStats.absent > 0 
        ? `${((lessonStats.present / (lessonStats.present + lessonStats.absent)) * 100).toFixed(1)}%`
        : 'N/A';
      
      y = drawBox('RESUMO DE PRESENÇAS E AUSÊNCIAS', [
        ['Total de Presenças', lessonStats.present],
        ['Total de Ausências', lessonStats.absent],
        ['Ausências Compensáveis', lessonStats.compensable],
        ['Ausências Não Compensáveis', lessonStats.nonCompensable],
        ['Taxa de Presença Global', globalRate]
      ], y);
      
      // Frequência por Serviço
      if (attendanceByService.length > 0) {
        if (y > pageHeight - 80) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFillColor(139, 115, 85);
        doc.rect(15, y, pageWidth - 30, 10, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('FREQUÊNCIA POR SERVIÇO', 20, y + 7);
        y += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        
        // Cabeçalho da tabela
        doc.setFillColor(245, 243, 239);
        doc.rect(15, y, pageWidth - 30, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Serviço', 20, y + 6);
        doc.text('Presentes', 100, y + 6);
        doc.text('Ausentes', 130, y + 6);
        doc.text('Taxa', 160, y + 6);
        y += 10;
        
        doc.setFont(undefined, 'normal');
        attendanceByService.forEach((s, idx) => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, y - 5, pageWidth - 30, 7, 'F');
          }
          
          doc.text(s.name.substring(0, 30), 20, y);
          doc.text(String(s.presentes), 100, y);
          doc.text(String(s.ausentes), 130, y);
          doc.text(`${s.taxa}%`, 160, y);
          y += 7;
        });
        
        y += 5;
      }
      
      // Frequência por Monitor
      if (attendanceByInstructor.length > 0) {
        if (y > pageHeight - 80) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFillColor(139, 115, 85);
        doc.rect(15, y, pageWidth - 30, 10, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('FREQUÊNCIA POR MONITOR', 20, y + 7);
        y += 15;
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        
        // Cabeçalho da tabela
        doc.setFillColor(245, 243, 239);
        doc.rect(15, y, pageWidth - 30, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text('Monitor', 20, y + 6);
        doc.text('Presentes', 100, y + 6);
        doc.text('Ausentes', 130, y + 6);
        doc.text('Taxa', 160, y + 6);
        y += 10;
        
        doc.setFont(undefined, 'normal');
        attendanceByInstructor.forEach((i, idx) => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          
          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, y - 5, pageWidth - 30, 7, 'F');
          }
          
          doc.text(i.name.substring(0, 30), 20, y);
          doc.text(String(i.presentes), 100, y);
          doc.text(String(i.ausentes), 130, y);
          doc.text(`${i.taxa}%`, 160, y);
          y += 7;
        });
      }
      
      // Rodapé em todas as páginas
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('Picadeiro Quinta da Horta - +351 932 111 786', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
      
      doc.save(`relatorio-aulas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao exportar PDF. Por favor, tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminReports">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Relatórios e Estatísticas</h1>
            <p className="text-stone-500">Visão geral do desempenho do negócio</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              disabled={isExporting || !lessons || lessons.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'A exportar...' : 'Exportar CSV'}
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={isExporting || !lessons || lessons.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExporting ? 'A exportar...' : 'Exportar PDF'}
            </Button>
          </div>
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
                  <p className="text-sm text-stone-500">Este Mês (Total)</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{totalMonthRevenue.toFixed(2)}€</p>
                  <p className="text-xs text-stone-400">Loja: {monthRevenue.toFixed(2)}€ | Pagamentos: {monthPaymentsRevenue.toFixed(2)}€</p>
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
                  <p className="text-sm text-stone-500">Aulas Este Mês</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">
                    {lessons.filter(l => {
                      const lessonDate = new Date(l.created_date);
                      return lessonDate.getMonth() === currentMonth.getMonth() && 
                             lessonDate.getFullYear() === currentMonth.getFullYear();
                    }).length}
                  </p>
                  <p className="text-xs text-stone-400">Total de aulas: {lessons.length}</p>
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

        {/* Estatísticas de Aulas */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#B8956A]" />
              Estatísticas de Aulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{lessonStats.completed}</p>
                <p className="text-xs text-stone-600 mt-1">Completas</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{lessonStats.cancelled}</p>
                <p className="text-xs text-stone-600 mt-1">Canceladas</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{lessonStats.scheduled}</p>
                <p className="text-xs text-stone-600 mt-1">Agendadas</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{lessonStats.present}</p>
                <p className="text-xs text-stone-600 mt-1">Presenças</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{lessonStats.absent}</p>
                <p className="text-xs text-stone-600 mt-1">Ausências</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-600">{lessonStats.compensable}</p>
                <p className="text-xs text-stone-600 mt-1">Compensáveis</p>
              </div>
              <div className="text-center p-4 bg-stone-100 rounded-lg">
                <p className="text-2xl font-bold text-stone-600">{lessonStats.nonCompensable}</p>
                <p className="text-xs text-stone-600 mt-1">Não Compensáveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Frequência */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frequência por Serviço */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Frequência por Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceByService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presentes" fill="#10b981" name="Presentes" />
                  <Bar dataKey="ausentes" fill="#ef4444" name="Ausentes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Frequência por Monitor */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Frequência por Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceByInstructor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presentes" fill="#10b981" name="Presentes" />
                  <Bar dataKey="ausentes" fill="#ef4444" name="Ausentes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Taxa de Frequência por Serviço */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Taxa de Presença por Serviço (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceByService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="taxa" fill="#B8956A" name="Taxa %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Taxa de Frequência por Monitor */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Taxa de Presença por Monitor (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceByInstructor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="taxa" fill="#B8956A" name="Taxa %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}