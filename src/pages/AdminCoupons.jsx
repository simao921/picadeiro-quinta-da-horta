import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Tag, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminCoupons() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    max_uses: null,
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => base44.entities.Coupon.list('-created_date'),
    initialData: []
  });

  const createCouponMutation = useMutation({
    mutationFn: (data) => base44.entities.Coupon.create({
      ...data,
      code: data.code.toUpperCase(),
      used_count: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      setDialogOpen(false);
      resetForm();
      toast.success('Cupão criado!');
    }
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Coupon.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      setDialogOpen(false);
      resetForm();
      toast.success('Cupão atualizado!');
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons']);
      toast.success('Cupão eliminado!');
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_uses: null,
      valid_from: '',
      valid_until: '',
      is_active: true
    });
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || 0,
      max_uses: coupon.max_uses || null,
      valid_from: coupon.valid_from || '',
      valid_until: coupon.valid_until || '',
      is_active: coupon.is_active !== false
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCoupon) {
      updateCouponMutation.mutate({ id: editingCoupon.id, data: formData });
    } else {
      createCouponMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout currentPage="AdminCoupons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Cupões</h1>
            <p className="text-stone-500">{coupons.length} cupões</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cupão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Editar Cupão' : 'Novo Cupão'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="VERAO2024"
                    className="uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select 
                      value={formData.discount_type}
                      onValueChange={(v) => setFormData({...formData, discount_type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Compra Mínima (€)</Label>
                    <Input
                      type="number"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({...formData, min_purchase: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. Utilizações</Label>
                    <Input
                      type="number"
                      value={formData.max_uses || ''}
                      onChange={(e) => setFormData({...formData, max_uses: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Válido Desde</Label>
                    <Input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Válido Até</Label>
                    <Input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                  />
                </div>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.code || createCouponMutation.isPending || updateCouponMutation.isPending}
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  {(createCouponMutation.isPending || updateCouponMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingCoupon ? 'Atualizar Cupão' : 'Criar Cupão'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#4A5D23]" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-stone-500">Nenhum cupão cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Utilizações</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-[#4A5D23]">{coupon.code}</span>
                      </TableCell>
                      <TableCell>
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%`
                          : `${coupon.discount_value}€`
                        }
                      </TableCell>
                      <TableCell>
                        {coupon.used_count || 0} / {coupon.max_uses || '∞'}
                      </TableCell>
                      <TableCell className="text-sm text-stone-500">
                        {coupon.valid_until 
                          ? `Até ${format(new Date(coupon.valid_until), 'dd/MM/yyyy')}`
                          : 'Sem limite'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'}>
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deleteCouponMutation.mutate(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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