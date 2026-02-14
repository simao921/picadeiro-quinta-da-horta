import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Euro, Plus, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminPayments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    client_email: '',
    amount: 0,
    month: format(new Date(), 'yyyy-MM'),
    status: 'pending'
  });

  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 200),
    initialData: []
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const students = users.filter(u => u.role !== 'admin');

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create({
      ...data,
      penalty: 0,
      total: data.amount,
      due_date: `${data.month}-08`
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-payments']);
      setDialogOpen(false);
      toast.success('Pagamento criado!');
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Payment.update(id, { 
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-payments']);
      toast.success('Pagamento atualizado!');
    }
  });

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendente', class: 'bg-amber-100 text-amber-800', icon: Clock },
      paid: { label: 'Pago', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { label: 'Em Atraso', class: 'bg-red-100 text-red-800', icon: AlertCircle },
      blocked: { label: 'Bloqueado', class: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    const { label, class: className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const totalPending = payments
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.total || p.amount), 0);

  return (
    <AdminLayout currentPage="AdminPayments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Pagamentos</h1>
            <p className="text-stone-500">Controlo de mensalidades e penalizações</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Pagamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Aluno</Label>
                  <Select 
                    value={newPayment.client_email}
                    onValueChange={(v) => setNewPayment({...newPayment, client_email: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.email}>
                          {s.full_name || s.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Input
                      type="month"
                      value={newPayment.month}
                      onChange={(e) => setNewPayment({...newPayment, month: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (€)</Label>
                    <Input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createPaymentMutation.mutate(newPayment)}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Pagamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Total Pendente</p>
                  <p className="text-2xl font-bold text-red-600">{totalPending.toFixed(2)}€</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)}€</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Total Registos</p>
                  <p className="text-2xl font-bold text-[#2C3E1F]">{payments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Euro className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Mês</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Penalização</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.client_email}</TableCell>
                      <TableCell>{payment.month}</TableCell>
                      <TableCell>{payment.amount?.toFixed(2)}€</TableCell>
                      <TableCell className={payment.penalty > 0 ? 'text-red-600' : ''}>
                        {(payment.penalty || 0).toFixed(2)}€
                      </TableCell>
                      <TableCell className="font-semibold">
                        {(payment.total || payment.amount).toFixed(2)}€
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.status !== 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePaymentMutation.mutate({ id: payment.id, status: 'paid' })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}