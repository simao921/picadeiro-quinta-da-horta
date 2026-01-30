import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Upload, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const imageKeys = [
  { key: 'hero_home', section: 'Home', description: 'Imagem de fundo do Hero da página inicial' },
  { key: 'hero_services', section: 'Serviços', description: 'Imagem de fundo do Hero da página de serviços' },
  { key: 'hero_gallery', section: 'Galeria', description: 'Imagem de fundo do Hero da galeria' },
  { key: 'hero_bookings', section: 'Reservas', description: 'Imagem de fundo do Hero das reservas' },
  { key: 'about_section', section: 'Sobre Nós', description: 'Imagem da secção Sobre Nós' },
  { key: 'logo', section: 'Global', description: 'Logotipo do site' },
  { key: 'testimonials_bg', section: 'Testemunhos', description: 'Fundo da secção de testemunhos' },
  { key: 'cta_section', section: 'Call to Action', description: 'Imagem da secção CTA' },
];

export default function AdminImages() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    image_key: '',
    image_url: '',
    description: '',
    section: ''
  });

  const { data: siteImages = [] } = useQuery({
    queryKey: ['site-images'],
    queryFn: () => base44.entities.SiteImage.list(),
    initialData: []
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = siteImages.find(img => img.image_key === data.image_key);
      if (existing) {
        await base44.entities.SiteImage.update(existing.id, data);
      } else {
        await base44.entities.SiteImage.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-images'] });
      toast.success('Imagem guardada com sucesso!');
      setDialogOpen(false);
      setSelectedImage(null);
      setFormData({ image_key: '', image_url: '', description: '', section: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.SiteImage.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-images'] });
      toast.success('Imagem removida!');
    }
  });

  const handleFileUpload = async (e, imageKey) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    toast.loading('A carregar imagem...', { id: 'upload' });

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      
      const keyData = imageKeys.find(k => k.key === imageKey);
      await saveMutation.mutateAsync({
        image_key: imageKey,
        image_url: result.file_url,
        description: keyData?.description || '',
        section: keyData?.section || ''
      });

      toast.dismiss('upload');
    } catch (error) {
      toast.dismiss('upload');
      toast.error('Erro ao carregar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (imageKey) => {
    const keyData = imageKeys.find(k => k.key === imageKey);
    const existing = siteImages.find(img => img.image_key === imageKey);
    
    setFormData({
      image_key: imageKey,
      image_url: existing?.image_url || '',
      description: keyData?.description || '',
      section: keyData?.section || ''
    });
    setSelectedImage(existing);
    setDialogOpen(true);
  };

  const handleSaveUrl = async () => {
    if (!formData.image_url) {
      toast.error('Insira o URL da imagem');
      return;
    }

    await saveMutation.mutateAsync(formData);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Imagens do Site</h1>
            <p className="text-stone-600 mt-1">Configure todas as imagens do seu website</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageKeys.map((item) => {
            const existingImage = siteImages.find(img => img.image_key === item.key);
            
            return (
              <Card key={item.key} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#4A5D23]" />
                    {item.section}
                  </CardTitle>
                  <p className="text-xs text-stone-500">{item.description}</p>
                </CardHeader>
                <CardContent>
                  {existingImage ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden">
                        <img
                          src={existingImage.image_url}
                          alt={item.description}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, item.key)}
                            disabled={uploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={(e) => e.currentTarget.previousElementSibling.click()}
                            disabled={uploading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Substituir
                          </Button>
                        </label>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(item.key)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('Remover esta imagem?')) {
                              deleteMutation.mutate(existingImage.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="aspect-video bg-stone-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-stone-300" />
                      </div>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, item.key)}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                          onClick={(e) => e.currentTarget.previousElementSibling.click()}
                          disabled={uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Carregar Imagem
                        </Button>
                      </label>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEdit(item.key)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Usar URL
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Imagem via URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Secção</Label>
                <Input value={formData.section} disabled />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={formData.description} disabled rows={2} />
              </div>
              <div>
                <Label>URL da Imagem *</Label>
                <Input
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              {formData.image_url && (
                <div className="aspect-video bg-stone-100 rounded-lg overflow-hidden">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Button
                onClick={handleSaveUrl}
                className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                disabled={saveMutation.isPending}
              >
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}