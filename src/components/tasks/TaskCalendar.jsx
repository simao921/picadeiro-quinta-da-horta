import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TaskCalendar({ tasks }) {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const tasksForSelectedDate = tasks.filter(task => 
    isSameDay(parseISO(task.due_date), selectedDate)
  );

  const datesWithTasks = tasks.map(task => parseISO(task.due_date));

  const priorityColors = {
    'baixa': 'bg-blue-500',
    'média': 'bg-yellow-500',
    'alta': 'bg-orange-500',
    'urgente': 'bg-red-500'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-0 shadow-xl">
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="rounded-lg border"
            modifiers={{
              hasTasks: datesWithTasks
            }}
            modifiersStyles={{
              hasTasks: {
                fontWeight: 'bold',
                backgroundColor: '#B8956A20'
              }
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <h3 className="font-serif text-lg font-bold mb-4 text-[#2D2D2D]">
            Tarefas para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </h3>

          {tasksForSelectedDate.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-8">
              Nenhuma tarefa para este dia
            </p>
          ) : (
            <div className="space-y-3">
              {tasksForSelectedDate.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border-l-4 bg-stone-50"
                  style={{ borderLeftColor: priorityColors[task.priority] || '#B8956A' }}
                >
                  <h4 className="font-semibold text-sm mb-2 text-[#2D2D2D]">
                    {task.title}
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status === 'em_andamento' ? 'Em Andamento' : task.status === 'concluida' ? 'Concluída' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}