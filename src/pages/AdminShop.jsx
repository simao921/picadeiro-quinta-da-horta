import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ShoppingBag, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'vestuario', label: 'Vestuário' },
  { id: 'equipamento', label: 'Equipamento' },
  { id: 'acessorios', label: 'Acessórios' },
  { id: 'cuidados', label: 'Cuidados' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'outros', label: 'Outros' }
];

export default function AdminShop() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    sale_price: null,
    category: 'outros',
    stock: 0,
    is_active: true,
    is_featured: false,
    images: []
  });

  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: []
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setDialogOpen(false);
      resetForm();
      toast.success('Produto criado!');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      setDialogOpen(false);
      resetForm();
      toast.success('Produto atualizado!');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Produto eliminado!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      sale_price: null,
      category: 'outros',
      stock: 0,
      is_active: true,
      is_featured: false,
      images: []
    });
    setEditingProduct(null);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price || null,
      category: product.category || 'outros',
      stock: product.stock || 0,
      is_active: product.is_active !== false,
      is_featured: product.is_featured || false,
      images: product.images || []
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createProductMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout currentPage="AdminShop">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão da Loja</h1>
            <p className="text-stone-500">{products.length} produtos</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome do produto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do produto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço Promocional (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sale_price || ''}
                      onChange={(e) => setFormData({...formData, sale_price: e.target.value ? parseFloat(e.target.value) : null})}
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(v) => setFormData({...formData, category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={formData.images[0] || ''}
                    onChange={(e) => setFormData({...formData, images: [e.target.value]})}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Produto Ativo</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Destaque</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({...formData, is_featured: v})}
                  />
                </div>
                <Button 
                  onClick={handleSubmit}
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingProduct ? 'Atualizar Produto' : 'Criar Produto'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#4A5D23]" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-stone-500">Nenhum produto cadastrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.is_featured && (
                              <Badge className="bg-amber-100 text-amber-800 text-xs">Destaque</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories.find(c => c.id === product.category)?.label || 'Outros'}
                      </TableCell>
                      <TableCell>
                        {product.sale_price ? (
                          <div>
                            <span className="font-semibold text-green-600">{product.sale_price.toFixed(2)}€</span>
                            <span className="text-stone-400 line-through text-sm ml-2">{product.price.toFixed(2)}€</span>
                          </div>
                        ) : (
                          <span className="font-semibold">{product.price.toFixed(2)}€</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {product.stock || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={product.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'}>
                          {product.is_active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deleteProductMutation.mutate(product.id)}
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