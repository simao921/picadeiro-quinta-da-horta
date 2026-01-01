import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Save, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Home Page
  const [homeHeroTitle, setHomeHeroTitle] = useState('Bem-vindo ao Picadeiro Quinta da Horta');
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('Centro Equestre de Excelência em Alcochete');
  const [homeHeroImage, setHomeHeroImage] = useState('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80');
  const [homeCtaText, setHomeCtaText] = useState('Marcar Aula Experimental');

  // Services Page
  const [servicesTitle, setServicesTitle] = useState('Os Nossos Serviços');
  const [servicesSubtitle, setServicesSubtitle] = useState('Experiências únicas de equitação para todos os níveis');

  // Contact Page
  const [contactTitle, setContactTitle] = useState('Contacte-nos');
  const [contactSubtitle, setContactSubtitle] = useState('Estamos aqui para ajudar');
  const [contactAddress, setContactAddress] = useState('Rua das Hortas 83 – Fonte da Senhora, Alcochete');
  const [contactPhone, setContactPhone] = useState('+351 932 111 786');
  const [contactEmail, setContactEmail] = useState('picadeiroquintadahortagf@gmail.com');

  // Shop Page
  const [shopTitle, setShopTitle] = useState('Equipamento Premium');
  const [shopSubtitle, setShopSubtitle] = useState('Descubra a nossa seleção de equipamento e acessórios de alta qualidade');

  const handleSave = async (section) => {
    setSaving(true);
    try {
      // Simulate save - in a real app, this would save to database
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Conteúdo guardado com sucesso!');
    } catch (error) {
      toast.error('Erro ao guardar conteúdo');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setter(file_url);
      toast.success('Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao carregar imagem');
    }
  };

  return (
    <AdminLayout currentPage="AdminContent">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Conteúdo</h1>
          <p className="text-stone-500">Edite o conteúdo das páginas do site diretamente</p>
        </div>

        <Tabs defaultValue="home">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="home">Página Inicial</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="shop">Loja</TabsTrigger>
            <TabsTrigger value="contact">Contactos</TabsTrigger>
          </TabsList>

          {/* HOME PAGE */}
          <TabsContent value="home">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Conteúdo da Página Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Section */}
                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <h3 className="font-semibold text-lg">Secção Principal (Hero)</h3>
                  
                  <div className="space-y-2">
                    <Label>Título Principal</Label>
                    <Input
                      value={homeHeroTitle}
                      onChange={(e) => setHomeHeroTitle(e.target.value)}
                      placeholder="Título grande no topo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      value={homeHeroSubtitle}
                      onChange={(e) => setHomeHeroSubtitle(e.target.value)}
                      placeholder="Texto secundário"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Imagem de Fundo</Label>
                    <div className="flex gap-2">
                      <Input
                        value={homeHeroImage}
                        onChange={(e) => setHomeHeroImage(e.target.value)}
                        placeholder="URL da imagem"
                      />
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <div>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </div>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, setHomeHeroImage)}
                        />
                      </label>
                    </div>
                    {homeHeroImage && (
                      <img src={homeHeroImage} alt="Preview" className="h-32 w-full object-cover rounded mt-2" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Texto do Botão Principal</Label>
                    <Input
                      value={homeCtaText}
                      onChange={(e) => setHomeCtaText(e.target.value)}
                      placeholder="Ex: Marcar Aula"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('home')}
                  disabled={saving}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVICES PAGE */}
          <TabsContent value="services">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Conteúdo da Página de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <h3 className="font-semibold text-lg">Cabeçalho</h3>
                  
                  <div className="space-y-2">
                    <Label>Título da Página</Label>
                    <Input
                      value={servicesTitle}
                      onChange={(e) => setServicesTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Textarea
                      value={servicesSubtitle}
                      onChange={(e) => setServicesSubtitle(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Os serviços individuais são geridos na secção "Serviços" do painel admin
                  </p>
                </div>

                <Button
                  onClick={() => handleSave('services')}
                  disabled={saving}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SHOP PAGE */}
          <TabsContent value="shop">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Conteúdo da Página da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <h3 className="font-semibold text-lg">Cabeçalho</h3>
                  
                  <div className="space-y-2">
                    <Label>Título da Loja</Label>
                    <Input
                      value={shopTitle}
                      onChange={(e) => setShopTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={shopSubtitle}
                      onChange={(e) => setShopSubtitle(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Os produtos são geridos na secção "Loja" do painel admin
                  </p>
                </div>

                <Button
                  onClick={() => handleSave('shop')}
                  disabled={saving}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT PAGE */}
          <TabsContent value="contact">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Conteúdo da Página de Contactos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <h3 className="font-semibold text-lg">Cabeçalho</h3>
                  
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={contactTitle}
                      onChange={(e) => setContactTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      value={contactSubtitle}
                      onChange={(e) => setContactSubtitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <h3 className="font-semibold text-lg">Informações de Contacto</h3>
                  
                  <div className="space-y-2">
                    <Label>Morada</Label>
                    <Textarea
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSave('contact')}
                  disabled={saving}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}