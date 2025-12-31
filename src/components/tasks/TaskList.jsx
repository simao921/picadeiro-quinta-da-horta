import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, User, AlertCircle, CheckCircle2, 
  Clock, Edit, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TaskList({ tasks, onEdit, onStatusChange, currentUser }) {
  const [filterStatus, setFilterStatus] = useState('todas');
  const [filterPriority, setFilterPriority] = useState('todas');

  const priorityColors = {
    'baixa': 'bg-blue-100 text-blue-800',
    'média': 'bg-yellow-100 text-yellow-800',
    'alta': 'bg-orange-100 text-orange-800',
    'urgente': 'bg-red-100 text-red-800'
  };

  const statusColors = {
    'pendente': 'bg-gray-100 text-gray-800',
    'em_andamento': 'bg-blue-100 text-blue-800',
    'concluida': 'bg-green-100 text-green-800'
  };

  const statusIcons = {
    'pendente': Clock,
    'em_andamento': AlertCircle,
    'concluida': CheckCircle2
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'todas' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'todas' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const groupedTasks = {
    'pendente': filteredTasks.filter(t => t.status === 'pendente'),
    'em_andamento': filteredTasks.filter(t => t.status === 'em_andamento'),
    'concluida': filteredTasks.filter(t => t.status === 'concluida')
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-600" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="média">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Task Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(groupedTasks).map(([status, statusTasks]) => {
          const StatusIcon = statusIcons[status];
          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon className="w-5 h-5 text-[#B8956A]" />
                <h3 className="font-serif text-lg font-bold text-[#2D2D2D] capitalize">
                  {status === 'em_andamento' ? 'Em Andamento' : status === 'concluida' ? 'Concluída' : 'Pendente'}
                </h3>
                <Badge variant="outline" className="ml-auto">
                  {statusTasks.length}
                </Badge>
              </div>

              <AnimatePresence>
                {statusTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                      style={{ borderLeftColor: priorityColors[task.priority]?.includes('red') ? '#dc2626' : '#B8956A' }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-[#2D2D2D] line-clamp-2">
                            {task.title}
                          </h4>
                          {currentUser?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(task)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-stone-600 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-stone-600">
                            <User className="w-3.5 h-3.5" />
                            <span>{task.assigned_to}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {format(new Date(task.due_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Badge className={priorityColors[task.priority]} variant="secondary">
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.category}
                          </Badge>
                        </div>

                        {currentUser?.email === task.assigned_to && task.status !== 'concluida' && (
                          <div className="mt-4 pt-3 border-t">
                            <Select
                              value={task.status}
                              onValueChange={(value) => onStatusChange({ 
                                id: task.id, 
                                taskData: { ...task, status: value } 
                              })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                <SelectItem value="concluida">Concluída</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {statusTasks.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-stone-400">Nenhuma tarefa</p>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}