import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminBlockedSlots() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blockType, setBlockType] = useState('full_day');
  const [timeSlot, setTimeSlot] = useState('09:00');
  const [reason, setReason] = useState('');

  const queryClient = useQueryClient();

  const { data: blockedSlots = [] } = useQuery({
    queryKey: ['blocked-slots'],
    queryFn: () => base44.entities.BlockedSlot.filter({ is_active: true })
  });

  const createBlockMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BlockedSlot.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blocked-slots']);
      setDialogOpen(false);
      setReason('');
      toast.success('Bloqueio criado com sucesso!');
    }
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => base44.entities.BlockedSlot.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['blocked-slots']);
      toast.success('Bloqueio removido!');
    }
  });

  const handleCreateBlock = () => {
    const data = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: blockType === 'specific_time' ? timeSlot : '',
      reason: reason || (blockType === 'full_day' ? 'Dia bloqueado' : 'Horário bloqueado'),
      is_active: true
    };
    createBlockMutation.mutate(data);
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const groupedBlocks = blockedSlots.reduce((acc, block) => {
    const date = block.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(block);
    return acc;
  }, {});

  return (
    <AdminLayout currentPage="AdminBlockedSlots">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Bloqueios de Horários</h1>
            <p className="text-stone-500">Gerir dias e horários bloqueados para reservas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Bloqueio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Bloqueio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={pt}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Bloqueio</Label>
                  <Select value={blockType} onValueChange={setBlockType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_day">Dia Completo</SelectItem>
                      <SelectItem value="specific_time">Horário Específico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {blockType === 'specific_time' && (
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Motivo (opcional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Feriado, Manutenção..."
                  />
                </div>
                <Button
                  onClick={handleCreateBlock}
                  disabled={createBlockMutation.isPending}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355]"
                >
                  Criar Bloqueio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {Object.keys(groupedBlocks).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ban className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p className="text-stone-500">Sem bloqueios ativos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Object.entries(groupedBlocks)
              .sort(([a], [b]) => new Date(a) - new Date(b))
              .map(([date, blocks]) => (
                <Card key={date}>
                  <CardHeader className="bg-stone-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-[#B8956A]" />
                      {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {blocks.map((block) => (
                        <div key={block.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            {block.time_slot ? (
                              <>
                                <Clock className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{block.time_slot}</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 text-red-600" />
                                <span className="font-medium">Dia Completo</span>
                              </>
                            )}
                            <span className="text-sm text-stone-600">{block.reason}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => deleteBlockMutation.mutate(block.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}