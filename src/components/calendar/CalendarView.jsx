import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarView({ events, onEventClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, day);
    });
  };

  const eventTypeColors = {
    'aula': 'bg-blue-500',
    'competicao': 'bg-red-500',
    'evento': 'bg-purple-500',
    'manutencao': 'bg-yellow-500',
    'outro': 'bg-gray-500'
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#2D2D2D] capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-stone-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 rounded-lg border transition-colors ${
                  !isSameMonth(day, currentDate)
                    ? 'bg-stone-50 text-stone-400'
                    : isToday
                    ? 'bg-[#B8956A]/10 border-[#B8956A]'
                    : 'bg-white hover:bg-stone-50'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#B8956A]' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`text-xs px-2 py-1 rounded cursor-pointer text-white truncate ${
                        event.isBooking ? 'bg-[#4A5D23]' : eventTypeColors[event.event_type] || 'bg-[#B8956A]'
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-stone-500 px-2">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#4A5D23]" />
            <span className="text-sm text-stone-600">Aulas/Reservas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-stone-600">Aula</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-stone-600">Competição</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span className="text-sm text-stone-600">Evento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}