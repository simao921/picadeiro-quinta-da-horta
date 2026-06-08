import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Search, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const statusLabels = {
  approved: { label: 'Aprovada', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  rejected: { label: 'Recusada', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelada', color: 'bg-stone-100 text-stone-600' },
};

const attendanceLabels = {
  confirmed: { label: 'Presente', color: 'bg-blue-100 text-blue-800' },
  absent: { label: 'Ausente', color: 'bg-orange-100 text-orange-800' },
  pending: null,
};

export default function LessonHistory({ user }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return format(d, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(today);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lesson-history', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['all-lessons-history'],
    queryFn: () => base44.entities.Lesson.list('-date', 3000),
    initialData: []
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  // Apenas aulas passadas (até hoje)
  const lessonMap = {};
  for (const l of lessons) lessonMap[l.id] = l;

  const serviceMap = {};
  for (const s of services) serviceMap[s.id] = s;

  const filtered = bookings
    .map(b => ({ ...b, lesson: lessonMap[b.lesson_id] }))
    .filter(b => {
      if (!b.lesson) return false;
      const d = b.lesson.date;
      if (d > today) return false; // só passado
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    })
    .sort((a, b) => (b.lesson.date + b.lesson.start_time).localeCompare(a.lesson.date + a.lesson.start_time));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-stone-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-stone-500">De</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-stone-500">Até</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                max={today}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                setDateFrom(format(d, 'yyyy-MM-dd'));
                setDateTo(today);
              }}
              className="border-stone-300 text-stone-600"
            >
              Último mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 3);
                setDateFrom(format(d, 'yyyy-MM-dd'));
                setDateTo(today);
              }}
              className="border-stone-300 text-stone-600"
            >
              Últimos 3 meses
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoading ? (
        <div className="text-center py-12 text-stone-400">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma aula encontrada no período selecionado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">{filtered.length} aula(s) encontrada(s)</p>
          {filtered.map(booking => {
            const lesson = booking.lesson;
            const service = serviceMap[lesson.service_id];
            const status = statusLabels[booking.status] || statusLabels.pending;
            const att = booking.attendance && attendanceLabels[booking.attendance];
            return (
              <Card key={booking.id} className="border-stone-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#B8956A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CalendarDays className="w-5 h-5 text-[#B8956A]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C3E1F]">
                          {format(parseISO(lesson.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
                        </p>
                        <div className="flex items-center gap-1.5 text-stone-500 text-sm mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lesson.start_time}{lesson.end_time ? ` – ${lesson.end_time}` : ''}</span>
                          {service && <span className="text-stone-400">· {service.title}</span>}
                        </div>
                        {booking.notes && (
                          <p className="text-xs text-stone-400 mt-1">{booking.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {att && att.label && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${att.color}`}>
                          {att.label}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}