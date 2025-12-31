import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function EventForm({ event, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(event || {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'outro',
    location: 'Picadeiro Quinta da Horta',
    color: '#B8956A'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-[#2D2D2D] text-white">
        <CardTitle className="font-serif">
          {event ? 'Editar Evento' : 'Novo Evento'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Título do Evento *</Label>
            <Input
              id="title"
              placeholder="Ex: Competição Regional de Saltos"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes do evento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data e Hora de Início *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data e Hora de Término *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_type">Tipo de Evento</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger id="event_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aula">Aula</SelectItem>
                  <SelectItem value="competicao">Competição</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                placeholder="Local do evento"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
              {event ? 'Atualizar' : 'Criar'} Evento
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}