import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, Upload, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getSiteImage, updateSiteImage, DEFAULT_IMAGES } from '@/components/utils/siteImages.js';

export default function AdminImages() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({});
  const [imageUrls, setImageUrls] = useState({});

  // Carregar todas as imagens do site
  React.useEffect(() => {
    const loadImages = async () => {
      const keys = Object.keys(DEFAULT_IMAGES);
      const urls = {};
      for (const key of keys) {
        urls[key] = await getSiteImage(key, DEFAULT_IMAGES[key]);
      }
      setImageUrls(urls);
    };
    loadImages();
  }, []);

  const handleFileUpload = async (key, file) => {
    if (!file) return;
    
    setUploading(prev => ({ ...prev, [key]: true }));
    toast.loading('A fazer upload da imagem...', { id: 'upload' });

    try {
      // Upload para o storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Guardar no sistema
      await updateSiteImage(key, file_url);
      
      // Atualizar estado local
      setImageUrls(prev => ({ ...prev, [key]: file_url }));
      
      toast.dismiss('upload');
      toast.success('Imagem atualizada com sucesso!');
      
      // Force page reload to see changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.dismiss('upload');
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReset = async (key) => {
    if (!confirm('Restaurar imagem padrão?')) return;
    
    toast.loading('A restaurar imagem...', { id: 'reset' });
    
    try {
      await updateSiteImage(key, DEFAULT_IMAGES[key]);
      setImageUrls(prev => ({ ...prev, [key]: DEFAULT_IMAGES[key] }));
      
      toast.dismiss('reset');
      toast.success('Imagem restaurada!');
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      toast.dismiss('reset');
      toast.error('Erro ao restaurar imagem');
    }
  };

  const ImageUploadCard = ({ title, description, imageKey }) => {
    const currentUrl = imageUrls[imageKey] || DEFAULT_IMAGES[imageKey];
    const isUploading = uploading[imageKey];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#4A5D23]" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-stone-500">{description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview da imagem */}
          <div className="aspect-video bg-stone-100 rounded-lg overflow-hidden border">
            {currentUrl ? (
              <img 
                src={currentUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Label 
              htmlFor={`upload-${imageKey}`}
              className="flex-1"
            >
              <div className="w-full cursor-pointer">
                <Button 
                  type="button"
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        A carregar...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Carregar Nova
                      </>
                    )}
                  </span>
                </Button>
              </div>
              <Input
                id={`upload-${imageKey}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(imageKey, file);
                }}
                disabled={isUploading}
              />
            </Label>
            
            <Button
              variant="outline"
              onClick={() => handleReset(imageKey)}
              disabled={isUploading}
              className="border-stone-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-stone-500">
            Formatos: JPG, PNG, WebP | Tamanho recomendado: 1920x1080px
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E1F]">Imagens do Site</h1>
            <p className="text-stone-600 mt-1">
              Gerir todas as imagens que aparecem no site
            </p>
          </div>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Página Inicial</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="backgrounds">Fundos</TabsTrigger>
          </TabsList>

          {/* Página Inicial */}
          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadCard
                title="Logo do Site"
                description="Aparece no cabeçalho e rodapé"
                imageKey="logo"
              />
              
              <ImageUploadCard
                title="Hero - Imagem Principal"
                description="Imagem de fundo da secção principal"
                imageKey="hero_background"
              />

              <ImageUploadCard
                title="Secção Sobre Nós"
                description="Imagem da secção 'Sobre Nós'"
                imageKey="about_image"
              />

              <ImageUploadCard
                title="Secção Testemunhos"
                description="Imagem de fundo dos testemunhos"
                imageKey="testimonials_background"
              />
            </div>
          </TabsContent>

          {/* Serviços */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadCard
                title="Aulas Privadas"
                description="Imagem do serviço de aulas privadas"
                imageKey="service_private"
              />
              
              <ImageUploadCard
                title="Aulas em Grupo"
                description="Imagem do serviço de aulas em grupo"
                imageKey="service_group"
              />

              <ImageUploadCard
                title="Aluguer de Cavalos"
                description="Imagem do serviço de aluguer"
                imageKey="service_rental"
              />

              <ImageUploadCard
                title="Serviço Proprietários"
                description="Imagem do serviço para proprietários"
                imageKey="service_owners"
              />
            </div>
          </TabsContent>

          {/* Geral */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadCard
                title="Galeria - Hero"
                description="Imagem de topo da página de galeria"
                imageKey="gallery_hero"
              />
              
              <ImageUploadCard
                title="Reservas - Hero"
                description="Imagem de topo da página de reservas"
                imageKey="bookings_hero"
              />

              <ImageUploadCard
                title="Placeholder Geral"
                description="Imagem usada quando não há imagem disponível"
                imageKey="placeholder"
              />
            </div>
          </TabsContent>

          {/* Fundos */}
          <TabsContent value="backgrounds" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadCard
                title="Padrão de Fundo"
                description="Textura ou padrão usado em fundos"
                imageKey="background_pattern"
              />
              
              <ImageUploadCard
                title="CTA (Call to Action)"
                description="Fundo da secção de chamada para ação"
                imageKey="cta_background"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> As imagens são otimizadas automaticamente. 
              Para melhores resultados, use imagens com pelo menos 1920x1080px e formato JPG ou PNG.
              Após alterar uma imagem, a página recarregará automaticamente para mostrar as alterações.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}