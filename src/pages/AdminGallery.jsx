import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ImageIcon, Upload, Trash2, Edit, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import LazyImage from '@/components/ui/LazyImage';

export default function AdminGallery() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'instalacoes',
    subcategory: 'none',
    is_featured: true,
    order: 0,
    image_url: ''
  });

  const { data: images = [] } = useQuery({
    queryKey: ['admin-gallery-images'],
    queryFn: () => base44.entities.GalleryImage.list('-order'),
    initialData: []
  });

  const categories = [
    { value: 'instalacoes', label: 'Instalações' },
    { value: 'team', label: 'Team' },
    { value: 'titulos', label: 'Títulos' },
    { value: 'aulas', label: 'Aulas' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'provas', label: 'Provas' }
  ];

  const subcategories = [
    { value: 'none', label: 'Nenhuma' },
    { value: 'particulares', label: 'Particulares', parent: 'aulas' },
    { value: 'grupo', label: 'Grupo', parent: 'aulas' },
    { value: 'dressage_maneabilidade', label: 'Dressage e Maneabilidade', parent: 'provas' },
    { value: 'golega', label: 'Golegã', parent: 'provas' }
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem válida');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      toast.error('Erro ao carregar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveImageMutation = useMutation({
    mutationFn: async (data) => {
      if (editingImage) {
        return await base44.entities.GalleryImage.update(editingImage.id, data);
      } else {
        return await base44.entities.GalleryImage.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      setDialogOpen(false);
      setEditingImage(null);
      setFormData({
        title: '',
        description: '',
        category: 'instalacoes',
        subcategory: 'none',
        is_featured: true,
        order: 0,
        image_url: ''
      });
      toast.success(editingImage ? 'Imagem atualizada!' : 'Imagem adicionada!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar: ' + error.message);
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => base44.entities.GalleryImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success('Imagem eliminada!');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, order }) => base44.entities.GalleryImage.update(id, { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    }
  });

  const handleSave = () => {
    if (!formData.image_url) {
      toast.error('Por favor carregue uma imagem');
      return;
    }

    saveImageMutation.mutate(formData);
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title || '',
      description: image.description || '',
      category: image.category || 'instalacoes',
      subcategory: image.subcategory || 'none',
      is_featured: image.is_featured ?? true,
      order: image.order || 0,
      image_url: image.image_url
    });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja eliminar esta imagem?')) {
      deleteImageMutation.mutate(id);
    }
  };

  const moveImage = (image, direction) => {
    const newOrder = (image.order || 0) + (direction === 'up' ? 1 : -1);
    updateOrderMutation.mutate({ id: image.id, order: newOrder });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E1F]">Gestão da Galeria</h1>
            <p className="text-stone-600 mt-1">Gerir imagens da galeria pública</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingImage(null);
              setFormData({
                title: '',
                description: '',
                category: 'instalacoes',
                subcategory: 'none',
                is_featured: true,
                order: 0,
                image_url: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Imagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingImage ? 'Editar Imagem' : 'Adicionar Nova Imagem'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagem *</Label>
                  {formData.image_url ? (
                    <div className="relative">
                      <LazyImage
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                        <p className="text-stone-600">
                          {uploading ? 'A carregar...' : 'Clique para carregar imagem'}
                        </p>
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título da imagem"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da imagem"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v, subcategory: 'none' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sub-categoria</Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(v) => setFormData({ ...formData, subcategory: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories
                          .filter(sub => sub.value === 'none' || sub.parent === formData.category)
                          .map(sub => (
                            <SelectItem key={sub.value} value={sub.value}>
                              {sub.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ordem de Exibição</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                  <div>
                    <Label>Destacar na Galeria</Label>
                    <p className="text-xs text-stone-500">Mostrar na galeria pública</p>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                  disabled={saveImageMutation.isPending || !formData.image_url}
                >
                  {saveImageMutation.isPending ? 'A guardar...' : (editingImage ? 'Atualizar' : 'Adicionar')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Imagens da Galeria ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">Nenhuma imagem na galeria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="group relative bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-square relative">
                      <LazyImage
                        src={image.image_url}
                        alt={image.title || 'Galeria'}
                        className="w-full h-full object-cover"
                      />
                      {image.is_featured && (
                        <Badge className="absolute top-2 left-2 bg-green-600">
                          Destacada
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => moveImage(image, 'up')}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => moveImage(image, 'down')}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleEdit(image)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                        {image.title || 'Sem título'}
                      </h3>
                      {image.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 mb-2">
                          {image.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.value === image.category)?.label || image.category}
                          </Badge>
                          {image.subcategory && image.subcategory !== 'none' && (
                            <Badge variant="outline" className="text-xs bg-stone-100">
                              {subcategories.find(s => s.value === image.subcategory)?.label}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-stone-400">
                          Ordem: {image.order || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}