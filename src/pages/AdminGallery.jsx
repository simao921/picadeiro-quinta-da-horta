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
import { Image, Plus, Trash2, Star, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'aulas', label: 'Aulas' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'cavalos', label: 'Cavalos' },
  { id: 'instalacoes', label: 'Instalações' },
  { id: 'competicoes', label: 'Competições' },
  { id: 'outros', label: 'Outros' }
];

export default function AdminGallery() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    category: 'outros',
    is_featured: false
  });

  const queryClient = useQueryClient();

  const { data: images, isLoading } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: () => base44.entities.GalleryImage.list('-created_date'),
    initialData: []
  });

  const createImageMutation = useMutation({
    mutationFn: (data) => base44.entities.GalleryImage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-gallery']);
      setDialogOpen(false);
      setFormData({ title: '', image_url: '', category: 'outros', is_featured: false });
      toast.success('Imagem adicionada!');
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id) => base44.entities.GalleryImage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-gallery']);
      toast.success('Imagem eliminada!');
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, is_featured }) => base44.entities.GalleryImage.update(id, { is_featured }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-gallery']);
      toast.success('Destaque atualizado!');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success('Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminGallery">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão da Galeria</h1>
            <p className="text-stone-500">{images.length} imagens</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Imagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Upload de Imagem</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A carregar...
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ou URL da Imagem</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                {formData.image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-stone-100">
                    <img 
                      src={formData.image_url} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Título (opcional)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título da imagem"
                  />
                </div>
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
                <Button 
                  onClick={() => createImageMutation.mutate(formData)}
                  disabled={!formData.image_url || createImageMutation.isPending}
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  {createImageMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#4A5D23]" />
          </div>
        ) : images.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Image className="w-12 h-12 mx-auto mb-2 text-stone-300" />
              <p className="text-stone-500">Nenhuma imagem na galeria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="group overflow-hidden border-0 shadow-md">
                <div className="aspect-square relative">
                  <img
                    src={image.image_url}
                    alt={image.title || 'Galeria'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className={image.is_featured ? 'bg-amber-500 text-white' : ''}
                      onClick={() => toggleFeaturedMutation.mutate({ 
                        id: image.id, 
                        is_featured: !image.is_featured 
                      })}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => deleteImageMutation.mutate(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {image.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-amber-500">
                      <Star className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{image.title || 'Sem título'}</p>
                  <p className="text-xs text-stone-500">
                    {categories.find(c => c.id === image.category)?.label || 'Outros'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}