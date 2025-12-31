import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function TaskForm({ task, onSubmit, onCancel, currentUser }) {
  const [formData, setFormData] = useState(task || {
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'média',
    status: 'pendente',
    category: 'outro'
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-[#2D2D2D] text-white">
        <CardTitle className="font-serif">
          {task ? 'Editar Tarefa' : 'Nova Tarefa'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">
              Título da Tarefa *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Preparar cavalos para competição"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="border-stone-300"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium mb-2 block">
              Descrição
            </Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre a tarefa..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-24 border-stone-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned_to" className="text-sm font-medium mb-2 block">
                Atribuir a *
              </Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger id="assigned_to" className="border-stone-300">
                  <SelectValue placeholder="Selecionar utilizador" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date" className="text-sm font-medium mb-2 block">
                Prazo *
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="border-stone-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority" className="text-sm font-medium mb-2 block">
                Prioridade
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority" className="border-stone-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="média">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="border-stone-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium mb-2 block">
                Categoria
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" className="border-stone-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="treino">Treino</SelectItem>
                  <SelectItem value="administrativa">Administrativa</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
              {task ? 'Atualizar' : 'Criar'} Tarefa
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}