import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { CalendarDays, Clock, Users, UserCheck, UserX, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const ITEMS_PER_PAGE = 10;

export default function AdminLessonHistory() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return format(d, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(today);
  const [studentFilter, setStudentFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: allLessons = [], isLoading } = useQuery({
    queryKey: ['admin-all-lessons-history'],
    queryFn: () => base44.entities.Lesson.list('-date', 3000),
    initialData: []
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-all-bookings-history'],
    queryFn: () => base44.entities.Booking.list('-created_date', 3000),
    initialData: []
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => base44.entities.Instructor.list(),
    initialData: []
  });

  const serviceMap = useMemo(() => {
    const m = {};
    for (const s of services) m[s.id] = s;
    return m;
  }, [services]);

  const instructorMap = useMemo(() => {
    const m = {};
    for (const i of instructors) m[i.id] = i;
    return m;
  }, [instructors]);

  const bookingsByLesson = useMemo(() => {
    const m = {};
    for (const b of bookings) {
      if (!m[b.lesson_id]) m[b.lesson_id] = [];
      m[b.lesson_id].push(b);
    }
    return m;
  }, [bookings]);

  // Unique students from bookings
  const allStudents = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const b of bookings) {
      const key = b.client_email || b.client_name;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ email: b.client_email, name: b.client_name });
      }
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [bookings]);

  const filtered = useMemo(() => {
    let result = allLessons.filter(l => l.date <= today);

    if (dateFrom) result = result.filter(l => l.date >= dateFrom);
    if (dateTo) result = result.filter(l => l.date <= dateTo);

    if (serviceFilter !== 'all') result = result.filter(l => l.service_id === serviceFilter);

    if (studentFilter !== 'all') {
      result = result.filter(l => {
        const lb = bookingsByLesson[l.id] || [];
        return lb.some(b => b.client_email === studentFilter || b.client_name === studentFilter);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        const lb = bookingsByLesson[l.id] || [];
        return (
          serviceMap[l.service_id]?.title?.toLowerCase().includes(q) ||
          lb.some(b => b.client_name?.toLowerCase().includes(q) || b.client_email?.toLowerCase().includes(q)) ||
          l.notes?.toLowerCase().includes(q)
        );
      });
    }

    return result.sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
  }, [allLessons, dateFrom, dateTo, serviceFilter, studentFilter, searchQuery, bookingsByLesson, serviceMap, today]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  React.useEffect(() => setCurrentPage(1), [dateFrom, dateTo, serviceFilter, studentFilter, searchQuery]);

  const getAttendanceStats = (lessonBookings) => {
    const approved = lessonBookings.filter(b => b.status === 'approved');
    const present = approved.filter(b => b.attendance === 'confirmed' || b.attendance === 'present' || b.attendance_status === 'present').length;
    const absent = approved.filter(b => b.attendance === 'absent' || b.attendance_status === 'absent').length;
    return { present, absent, total: approved.length };
  };

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-stone-500">De</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-stone-500">Até</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} max={today} />
            </div>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger><SelectValue placeholder="Todos os serviços" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {services.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger><SelectValue placeholder="Todos os alunos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os alunos</SelectItem>
                {allStudents.map(s => (
                  <SelectItem key={s.email || s.name} value={s.email || s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs border-stone-300 text-stone-600"
                onClick={() => { const d = new Date(); d.setMonth(d.getMonth()-1); setDateFrom(format(d,'yyyy-MM-dd')); setDateTo(today); }}>
                Último mês
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-stone-300 text-stone-600"
                onClick={() => { const d = new Date(); d.setMonth(d.getMonth()-3); setDateFrom(format(d,'yyyy-MM-dd')); setDateTo(today); }}>
                3 meses
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-stone-300 text-stone-600"
                onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear()-1); setDateFrom(format(d,'yyyy-MM-dd')); setDateTo(today); }}>
                1 ano
              </Button>
            </div>
            <span className="text-sm text-stone-500">{filtered.length} aula(s)</span>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-stone-400">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma aula encontrada no período selecionado.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(lesson => {
              const lb = bookingsByLesson[lesson.id] || [];
              const approved = lb.filter(b => b.status === 'approved');
              const stats = getAttendanceStats(lb);
              const service = serviceMap[lesson.service_id];
              const instructor = instructorMap[lesson.instructor_id];
              return (
                <Card key={lesson.id} className="border-l-4 border-l-[#B8956A] border-stone-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Data e hora */}
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className="bg-[#B8956A]/10 rounded-xl px-3 py-2 text-center min-w-[75px]">
                          <p className="text-xs text-stone-500 font-medium uppercase">
                            {format(parseISO(lesson.date), 'EEE', { locale: ptBR })}
                          </p>
                          <p className="text-2xl font-bold text-[#B8956A] leading-none">
                            {format(parseISO(lesson.date), 'd')}
                          </p>
                          <p className="text-xs text-stone-500">
                            {format(parseISO(lesson.date), 'MMM yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                            <Clock className="w-4 h-4 text-[#B8956A]" />
                            {lesson.start_time}{lesson.end_time ? ` – ${lesson.end_time}` : ''}
                          </div>
                          <p className="text-sm font-medium text-[#2C3E1F] mt-0.5">{service?.title || '—'}</p>
                          {instructor && <p className="text-xs text-stone-400">{instructor.name}</p>}
                        </div>
                      </div>

                      {/* Alunos */}
                      <div className="flex-1">
                        {approved.length === 0 ? (
                          <p className="text-sm text-stone-400 italic">Sem reservas aprovadas</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {approved.map(b => {
                              const isPresent = b.attendance === 'confirmed' || b.attendance === 'present' || b.attendance_status === 'present';
                              const isAbsent = b.attendance === 'absent' || b.attendance_status === 'absent';
                              return (
                                <div key={b.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  isPresent ? 'bg-green-50 border-green-300 text-green-800' :
                                  isAbsent ? 'bg-red-50 border-red-300 text-red-800' :
                                  'bg-stone-50 border-stone-200 text-stone-700'
                                }`}>
                                  {isPresent && <UserCheck className="w-3 h-3" />}
                                  {isAbsent && <UserX className="w-3 h-3" />}
                                  {b.client_name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-sm flex-shrink-0">
                        <div className="flex items-center gap-1 text-green-700">
                          <UserCheck className="w-4 h-4" />
                          <span className="font-bold">{stats.present}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <UserX className="w-4 h-4" />
                          <span className="font-bold">{stats.absent}</span>
                        </div>
                        <Badge className="bg-[#B8956A]/10 text-[#B8956A] border border-[#B8956A]/30 font-bold">
                          <Users className="w-3 h-3 mr-1" />
                          {approved.length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <p className="text-sm text-stone-500">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="border-[#B8956A] text-[#B8956A]">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="border-[#B8956A] text-[#B8956A]">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}