import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusOptions = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  processamento: { label: 'Processamento', color: 'bg-blue-100 text-blue-800' },
  enviada: { label: 'Enviada', color: 'bg-purple-100 text-purple-800' },
  entregue: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
};

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
    initialData: []
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Estado atualizado!');
    }
  });

  const getStatusBadge = (status) => {
    const config = statusOptions[status] || statusOptions.pendente;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pendente: orders.filter(o => o.status === 'pendente').length,
    processamento: orders.filter(o => o.status === 'processamento').length,
    enviada: orders.filter(o => o.status === 'enviada').length,
    entregue: orders.filter(o => o.status === 'entregue').length,
  };

  return (
    <AdminLayout currentPage="AdminOrders">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Encomendas</h1>
          <p className="text-stone-500">{filteredOrders.length} de {orders.length} encomendas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#2C3E1F]">{stats.total}</p>
              <p className="text-xs text-stone-500">Total</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.pendente}</p>
              <p className="text-xs text-stone-500">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.processamento}</p>
              <p className="text-xs text-stone-500">Processamento</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.enviada}</p>
              <p className="text-xs text-stone-500">Enviadas</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.entregue}</p>
              <p className="text-xs text-stone-500">Entregues</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Pesquisar por cliente ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processamento">Processamento</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-stone-500">Nenhuma encomenda</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id?.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.client_name}</p>
                          <p className="text-sm text-stone-500">{order.client_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{order.items?.length || 0}</TableCell>
                      <TableCell className="font-semibold">
                        {order.total?.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status || 'pendente'}
                          onValueChange={(v) => updateOrderMutation.mutate({ id: order.id, status: v })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue>
                              {getStatusBadge(order.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="processamento">Processamento</SelectItem>
                            <SelectItem value="enviada">Enviada</SelectItem>
                            <SelectItem value="entregue">Entregue</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Encomenda #{selectedOrder?.id?.slice(-8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Cliente</p>
                    <p className="font-medium">{selectedOrder.client_name}</p>
                    <p className="text-sm">{selectedOrder.client_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Morada de Envio</p>
                    {selectedOrder.shipping_address ? (
                      <>
                        <p className="font-medium">{selectedOrder.shipping_address.street}</p>
                        <p className="text-sm">
                          {selectedOrder.shipping_address.postal_code} {selectedOrder.shipping_address.city}
                        </p>
                      </>
                    ) : (
                      <p className="text-stone-400">Não disponível</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-stone-500 mb-2">Produtos</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between p-3 bg-stone-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-stone-500">Qtd: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{(item.price * item.quantity).toFixed(2)}€</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{selectedOrder.subtotal?.toFixed(2)}€</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>-{selectedOrder.discount?.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Envio</span>
                    <span>{selectedOrder.shipping === 0 ? 'Grátis' : `${selectedOrder.shipping?.toFixed(2)}€`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#B8956A]">{selectedOrder.total?.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}