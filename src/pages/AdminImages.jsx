import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image as ImageIcon, Upload, Trash2, Edit, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSiteImage, clearImageCache, DEFAULT_IMAGES } from '@/components/lib/siteImages';

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
  const [currentImages, setCurrentImages] = useState({});
  const [formData, setFormData] = useState({
    image_key: '',
    image_url: '',
    description: '',
    section: ''
  });

  const { data: siteImages = [], refetch } = useQuery({
    queryKey: ['site-images'],
    queryFn: () => base44.entities.SiteImage.list(),
    initialData: []
  });

  // Carregar imagens atuais na inicialização
  useEffect(() => {
    const loadCurrentImages = async () => {
      const images = {};
      const dbImages = await base44.entities.SiteImage.list();
      
      for (const item of imageKeys) {
        const dbImage = dbImages.find(img => img.image_key === item.key);
        images[item.key] = dbImage?.image_url || DEFAULT_IMAGES[item.key];
      }
      setCurrentImages(images);
    };
    loadCurrentImages();
  }, [siteImages]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = siteImages.find(img => img.image_key === data.image_key);
      if (existing) {
        return await base44.entities.SiteImage.update(existing.id, data);
      } else {
        return await base44.entities.SiteImage.create(data);
      }
    },
    onSuccess: async (result, data) => {
      await queryClient.invalidateQueries({ queryKey: ['site-images'] });
      await refetch();
      
      // Atualizar imagem localmente
      setCurrentImages(prev => ({ ...prev, [data.image_key]: data.image_url }));
      
      toast.success('✅ Imagem guardada!', {
        description: 'A imagem foi atualizada. Recarregue o site para ver.'
      });
      setDialogOpen(false);
      setSelectedImage(null);
      setFormData({ image_key: '', image_url: '', description: '', section: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.SiteImage.delete(id);
    },
    onSuccess: async () => {
      clearImageCache();
      await queryClient.invalidateQueries({ queryKey: ['site-images'] });
      await refetch();
      toast.success('Imagem removida! Voltará à imagem padrão.');
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
      <div className="p-6 space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8956A] to-[#8B7355] bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-lg">
                <ImageIcon className="w-7 h-7 text-white" />
              </div>
              Gestão de Imagens do Site
            </h1>
            <p className="text-stone-600 mt-2 text-lg">Configure todas as imagens do seu website</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageKeys.map((item) => {
            const existingImage = siteImages.find(img => img.image_key === item.key);
            const currentImageUrl = currentImages[item.key] || DEFAULT_IMAGES[item.key];
            
            return (
              <Card key={item.key} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#8B7355]">
                    <ImageIcon className="w-5 h-5 text-[#B8956A]" />
                    {item.section}
                  </CardTitle>
                  <p className="text-xs text-stone-600">{item.description}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="relative aspect-video bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg overflow-hidden border-2 border-[#B8956A]/20">
                      {currentImageUrl ? (
                        <>
                          <img
                            src={currentImageUrl}
                            alt={item.description}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = DEFAULT_IMAGES[item.key];
                            }}
                          />
                          {existingImage && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-md">
                              <CheckCircle className="w-3 h-3" />
                              Ativa
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-stone-300" />
                        </div>
                      )}
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
                          className="w-full bg-gradient-to-r from-[#B8956A] to-[#8B7355] hover:from-[#8B7355] hover:to-[#6B5845] text-white shadow-md hover:shadow-lg transition-all duration-200"
                          onClick={(e) => e.currentTarget.previousElementSibling.click()}
                          disabled={uploading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {existingImage ? 'Substituir' : 'Carregar'}
                        </Button>
                      </label>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(item.key)}
                        className="border-[#B8956A] text-[#B8956A] hover:bg-[#B8956A] hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {existingImage && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('Remover esta imagem? Voltará à imagem padrão.')) {
                              deleteMutation.mutate(existingImage.id);
                            }
                          }}
                          className="text-red-600 hover:bg-red-600 hover:text-white border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-[#B8956A]" />
                Configurar Imagem via URL
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-[#8B7355] font-semibold">Secção</Label>
                <Input value={formData.section} disabled className="bg-stone-50" />
              </div>
              <div>
                <Label className="text-[#8B7355] font-semibold">Descrição</Label>
                <Textarea value={formData.description} disabled rows={2} className="bg-stone-50" />
              </div>
              <div>
                <Label className="text-[#8B7355] font-semibold">URL da Imagem *</Label>
                <Input
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="border-[#B8956A]/30 focus:border-[#B8956A]"
                />
              </div>
              {formData.image_url && (
                <div className="aspect-video bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg overflow-hidden border-2 border-[#B8956A]/30">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      toast.error('Erro ao carregar imagem. Verifique o URL.');
                    }}
                  />
                </div>
              )}
              <Button
                onClick={handleSaveUrl}
                className="w-full bg-gradient-to-r from-[#B8956A] to-[#8B7355] hover:from-[#8B7355] hover:to-[#6B5845] text-white shadow-md hover:shadow-lg transition-all duration-200"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}