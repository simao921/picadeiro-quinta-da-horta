import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Upload, Save, Loader2, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import LazyImage from '@/components/ui/LazyImage';

const IMAGE_CATEGORIES = {
  logo: { name: 'Logo do Site', description: 'Logo principal que aparece no header e footer' },
  hero: { name: 'Imagem Hero (Home)', description: 'Imagem de fundo da seção principal da página inicial' },
  cta: { name: 'Imagem CTA (Home)', description: 'Imagem de fundo da seção de call-to-action' },
  service_1: { name: 'Serviço 1 (Aulas Privadas)', description: 'Imagem do card de aulas privadas' },
  service_2: { name: 'Serviço 2 (Aulas de Grupo)', description: 'Imagem do card de aulas de grupo' },
  service_3: { name: 'Serviço 3 (Eventos)', description: 'Imagem do card de eventos' },
  about_decorative: { name: 'Sobre Nós - Imagem Decorativa (Fundo)', description: 'Imagem decorativa de fundo que aparece na seção "Sobre Nós" (lado direito, atrás do texto)' },
  about_grid_1: { name: 'Sobre Nós - Grid Superior Esquerdo', description: 'Primeira imagem do grid de imagens na seção "Sobre Nós" (cavalo elegante)' },
  about_grid_2: { name: 'Sobre Nós - Grid Inferior Esquerdo', description: 'Segunda imagem do grid de imagens na seção "Sobre Nós" (aula de equitação)' },
  about_grid_3: { name: 'Sobre Nós - Grid Superior Direito', description: 'Terceira imagem do grid de imagens na seção "Sobre Nós" (instalações)' },
  about_grid_4: { name: 'Sobre Nós - Grid Inferior Direito', description: 'Quarta imagem do grid de imagens na seção "Sobre Nós" (equitação)' },
  gallery_background: { name: 'Galeria - Background', description: 'Imagem de fundo da página de galeria' },
};

export default function AdminImages() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Fetch site images
  const { data: siteImages = [], isLoading } = useQuery({
    queryKey: ['site-images'],
    queryFn: async () => {
      try {
        const images = await base44.entities.SiteImage?.list() || [];
        return images;
      } catch (e) {
        // If entity doesn't exist, return empty array
        return [];
      }
    },
  });

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async ({ key, url }) => {
      const existing = siteImages.find(img => img.key === key);
      
      if (existing) {
        return base44.entities.SiteImage?.update(existing.id, { url });
      } else {
        return base44.entities.SiteImage?.create({
          key,
          url,
          description: IMAGE_CATEGORIES[key]?.description || '',
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-images'] });
      toast.success(`Imagem ${IMAGE_CATEGORIES[variables.key]?.name || variables.key} guardada!`);
      setEditingKey(null);
      setImageUrl('');
    },
    onError: () => {
      toast.error('Erro ao guardar imagem');
    },
  });

  const handleImageUpload = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um ficheiro de imagem');
      return;
    }

    setUploading({ ...uploading, [key]: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Save immediately after upload
      const existing = siteImages.find(img => img.key === key);
      if (existing) {
        await base44.entities.SiteImage?.update(existing.id, { url: file_url });
      } else {
        await base44.entities.SiteImage?.create({
          key,
          url: file_url,
          description: IMAGE_CATEGORIES[key]?.description || '',
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['site-images'] });
      toast.success('Imagem carregada e guardada!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploading({ ...uploading, [key]: false });
    }
  };

  const getImageUrl = (key, defaultUrl) => {
    const image = siteImages.find(img => img.key === key);
    return image?.url || defaultUrl;
  };

  const handleEdit = (key) => {
    const image = siteImages.find(img => img.key === key);
    setEditingKey(key);
    setImageUrl(image?.url || '');
  };

  const handleSaveUrl = (key) => {
    if (!imageUrl.trim()) {
      toast.error('Por favor, insira uma URL válida');
      return;
    }
    saveMutation.mutate({ key, url: imageUrl.trim() });
  };

  const handleDelete = async (key) => {
    const image = siteImages.find(img => img.key === key);
    if (!image) return;

    if (!confirm(`Tem certeza que deseja remover a imagem ${IMAGE_CATEGORIES[key]?.name}?`)) {
      return;
    }

    try {
      await base44.entities.SiteImage?.delete(image.id);
      queryClient.invalidateQueries({ queryKey: ['site-images'] });
      toast.success('Imagem removida!');
    } catch (error) {
      toast.error('Erro ao remover imagem');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout currentPage="AdminImages">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B8956A]" />
        </div>
      </AdminLayout>
    );
  }

  // Group images by category
  const homeImages = [
    { key: 'logo', default: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG' },
    { key: 'hero', default: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80' },
    { key: 'cta', default: 'https://images.unsplash.com/photo-1460134846237-51c777df6111?w=1920&q=80' },
  ];

  const serviceImages = [
    { key: 'service_1', default: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
    { key: 'service_2', default: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=600&q=80' },
    { key: 'service_3', default: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=600&q=80' },
  ];

  const aboutImages = [
    { key: 'about_decorative', default: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800&q=80' },
    { key: 'about_grid_1', default: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80' },
    { key: 'about_grid_2', default: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
    { key: 'about_grid_3', default: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=400&q=80' },
    { key: 'about_grid_4', default: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=600&q=80' },
  ];

  const galleryImages = [
    { key: 'gallery_background', default: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80' },
  ];

  return (
    <AdminLayout currentPage="AdminImages">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Imagens do Site</h1>
          <p className="text-stone-500">Altere todas as imagens do site - carregue novas imagens ou insira URLs</p>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Página Inicial</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="about">Sobre</TabsTrigger>
            <TabsTrigger value="gallery">Galeria</TabsTrigger>
          </TabsList>

          {/* Home Images */}
          <TabsContent value="home" className="space-y-4">
            {homeImages.map(({ key, default: defaultUrl }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{IMAGE_CATEGORIES[key]?.name}</CardTitle>
                  <CardDescription>{IMAGE_CATEGORIES[key]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden">
                        <LazyImage
                          src={getImageUrl(key, defaultUrl)}
                          alt={IMAGE_CATEGORIES[key]?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-4">
                      {editingKey === key ? (
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveUrl(key)}
                              disabled={saveMutation.isPending}
                              size="sm"
                            >
                              {saveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Guardar URL
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setImageUrl('');
                              }}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm text-stone-500">
                            URL Atual: {getImageUrl(key, defaultUrl).substring(0, 60)}...
                          </Label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              onClick={() => handleEdit(key)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Editar URL
                            </Button>
                            <label className="cursor-pointer">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading[key]}
                                asChild
                              >
                                <span>
                                  {uploading[key] ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Carregar Imagem
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, key)}
                              />
                            </label>
                            {siteImages.find(img => img.key === key) && (
                              <Button
                                onClick={() => handleDelete(key)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Service Images */}
          <TabsContent value="services" className="space-y-4">
            {serviceImages.map(({ key, default: defaultUrl }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{IMAGE_CATEGORIES[key]?.name}</CardTitle>
                  <CardDescription>{IMAGE_CATEGORIES[key]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden">
                        <LazyImage
                          src={getImageUrl(key, defaultUrl)}
                          alt={IMAGE_CATEGORIES[key]?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-4">
                      {editingKey === key ? (
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveUrl(key)}
                              disabled={saveMutation.isPending}
                              size="sm"
                            >
                              {saveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Guardar URL
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setImageUrl('');
                              }}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm text-stone-500">
                            URL Atual: {getImageUrl(key, defaultUrl).substring(0, 60)}...
                          </Label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              onClick={() => handleEdit(key)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Editar URL
                            </Button>
                            <label className="cursor-pointer">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading[key]}
                                asChild
                              >
                                <span>
                                  {uploading[key] ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Carregar Imagem
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, key)}
                              />
                            </label>
                            {siteImages.find(img => img.key === key) && (
                              <Button
                                onClick={() => handleDelete(key)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* About Images */}
          <TabsContent value="about" className="space-y-4">
            {aboutImages.map(({ key, default: defaultUrl }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{IMAGE_CATEGORIES[key]?.name}</CardTitle>
                  <CardDescription>{IMAGE_CATEGORIES[key]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden">
                        <LazyImage
                          src={getImageUrl(key, defaultUrl)}
                          alt={IMAGE_CATEGORIES[key]?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-4">
                      {editingKey === key ? (
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveUrl(key)}
                              disabled={saveMutation.isPending}
                              size="sm"
                            >
                              {saveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Guardar URL
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setImageUrl('');
                              }}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm text-stone-500">
                            URL Atual: {getImageUrl(key, defaultUrl).substring(0, 60)}...
                          </Label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              onClick={() => handleEdit(key)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Editar URL
                            </Button>
                            <label className="cursor-pointer">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading[key]}
                                asChild
                              >
                                <span>
                                  {uploading[key] ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Carregar Imagem
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, key)}
                              />
                            </label>
                            {siteImages.find(img => img.key === key) && (
                              <Button
                                onClick={() => handleDelete(key)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Gallery Images */}
          <TabsContent value="gallery" className="space-y-4">
            {galleryImages.map(({ key, default: defaultUrl }) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle>{IMAGE_CATEGORIES[key]?.name}</CardTitle>
                  <CardDescription>{IMAGE_CATEGORIES[key]?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden">
                        <LazyImage
                          src={getImageUrl(key, defaultUrl)}
                          alt={IMAGE_CATEGORIES[key]?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[300px] space-y-4">
                      {editingKey === key ? (
                        <div className="space-y-2">
                          <Label>URL da Imagem</Label>
                          <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveUrl(key)}
                              disabled={saveMutation.isPending}
                              size="sm"
                            >
                              {saveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Guardar URL
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setImageUrl('');
                              }}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm text-stone-500">
                            URL Atual: {getImageUrl(key, defaultUrl).substring(0, 60)}...
                          </Label>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              onClick={() => handleEdit(key)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Editar URL
                            </Button>
                            <label className="cursor-pointer">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploading[key]}
                                asChild
                              >
                                <span>
                                  {uploading[key] ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Carregar Imagem
                                </span>
                              </Button>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, key)}
                              />
                            </label>
                            {siteImages.find(img => img.key === key) && (
                              <Button
                                onClick={() => handleDelete(key)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

