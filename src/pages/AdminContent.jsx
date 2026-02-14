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
import { FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState({});

  // Fetch content blocks
  const { data: contentBlocks = [], isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => base44.entities.ContentBlock.list(),
  });

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async ({ page, blockId, content }) => {
      const existing = contentBlocks.find(
        b => b.page === page && b.block_id === blockId
      );
      
      if (existing) {
        return base44.entities.ContentBlock.update(existing.id, { content });
      } else {
        return base44.entities.ContentBlock.create({
          page,
          block_id: blockId,
          content_type: 'text',
          content,
          is_active: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      toast.success('Conteúdo guardado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao guardar conteúdo');
    },
  });

  // Get content helper
  const getContent = (page, blockId, defaultValue = '') => {
    const block = contentBlocks.find(
      b => b.page === page && b.block_id === blockId
    );
    return block?.content || defaultValue;
  };

  const handleSave = async (page, blockId, content) => {
    setSaving({ ...saving, [`${page}-${blockId}`]: true });
    try {
      await saveMutation.mutateAsync({ page, blockId, content });
    } finally {
      setSaving({ ...saving, [`${page}-${blockId}`]: false });
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

  if (isLoading) {
    return (
      <AdminLayout currentPage="AdminContent">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B8956A]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="AdminContent">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Conteúdo</h1>
          <p className="text-stone-500">Edite TODO o conteúdo do site - alterações são guardadas na base de dados</p>
        </div>

        <Tabs defaultValue="home">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="home">🏠 Página Inicial</TabsTrigger>
            <TabsTrigger value="about">ℹ️ Sobre Nós</TabsTrigger>
            <TabsTrigger value="services">💼 Serviços</TabsTrigger>
            <TabsTrigger value="shop">🛒 Loja</TabsTrigger>
            <TabsTrigger value="contact">📞 Contactos</TabsTrigger>
            <TabsTrigger value="footer">📄 Footer</TabsTrigger>
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
                <ContentSection
                  title="🎯 Hero Section"
                  fields={[
                    {
                      label: 'Badge (Centro Equestre de...)',
                      page: 'Home',
                      blockId: 'hero_badge',
                      defaultValue: 'Centro Equestre de Excelência',
                    },
                    {
                      label: 'Título Principal',
                      page: 'Home',
                      blockId: 'hero_title',
                      defaultValue: 'Picadeiro Quinta da Horta',
                    },
                    {
                      label: 'Subtítulo/Descrição',
                      page: 'Home',
                      blockId: 'hero_subtitle',
                      defaultValue: 'Descubra a arte da equitação com o Bi-Campeão do Mundo Gilberto Filipe',
                      isTextarea: true,
                    },
                    {
                      label: 'Texto Botão Principal',
                      page: 'Home',
                      blockId: 'hero_cta_primary',
                      defaultValue: 'Reservar Aula',
                    },
                    {
                      label: 'Texto Botão Secundário',
                      page: 'Home',
                      blockId: 'hero_cta_secondary',
                      defaultValue: 'Conhecer Serviços',
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />

                {/* Stats Section */}
                <ContentSection
                  title="📊 Estatísticas"
                  fields={[
                    {
                      label: 'Estatística 1 (Anos de Experiência)',
                      page: 'Home',
                      blockId: 'stat_1',
                      defaultValue: 'Anos de Experiência',
                    },
                    {
                      label: 'Estatística 2 (Alunos Formados)',
                      page: 'Home',
                      blockId: 'stat_2',
                      defaultValue: 'Alunos Formados',
                    },
                    {
                      label: 'Estatística 3 (Campeão Mundial)',
                      page: 'Home',
                      blockId: 'stat_3',
                      defaultValue: 'Bi-Campeão Mundial',
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />

                {/* Services Preview */}
                <ContentSection
                  title="🎪 Preview de Serviços"
                  fields={[
                    {
                      label: 'Badge',
                      page: 'Home',
                      blockId: 'services_badge',
                      defaultValue: 'Os Nossos Serviços',
                    },
                    {
                      label: 'Título',
                      page: 'Home',
                      blockId: 'services_title',
                      defaultValue: 'Experiências Equestres de Excelência',
                    },
                    {
                      label: 'Subtítulo',
                      page: 'Home',
                      blockId: 'services_subtitle',
                      defaultValue: 'Desde iniciantes a cavaleiros experientes...',
                      isTextarea: true,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />

                {/* CTA Section */}
                <ContentSection
                  title="🎯 Call-to-Action Final"
                  fields={[
                    {
                      label: 'Título',
                      page: 'Home',
                      blockId: 'cta_title',
                      defaultValue: 'Pronto para Começar a Sua Jornada Equestre?',
                    },
                    {
                      label: 'Descrição',
                      page: 'Home',
                      blockId: 'cta_description',
                      defaultValue: 'Dê o primeiro passo para uma experiência única com cavalos...',
                      isTextarea: true,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABOUT PAGE */}
          <TabsContent value="about">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Secção "Sobre Nós" (Home)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ContentSection
                  title="ℹ️ Sobre o Picadeiro"
                  fields={[
                    {
                      label: 'Badge',
                      page: 'Home',
                      blockId: 'about_badge',
                      defaultValue: 'Sobre Nós',
                    },
                    {
                      label: 'Título',
                      page: 'Home',
                      blockId: 'about_title',
                      defaultValue: 'Uma Tradição de Excelência Equestre',
                    },
                    {
                      label: 'Parágrafo 1',
                      page: 'Home',
                      blockId: 'about_p1',
                      defaultValue: 'O Picadeiro Quinta da Horta é mais do que um centro equestre...',
                      isTextarea: true,
                    },
                    {
                      label: 'Parágrafo 2',
                      page: 'Home',
                      blockId: 'about_p2',
                      defaultValue: 'Sob a orientação do Bi-Campeão do Mundo Gilberto Filipe...',
                      isTextarea: true,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVICES PAGE */}
          <TabsContent value="services">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Página de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ContentSection
                  title="💼 Cabeçalho Serviços"
                  fields={[
                    {
                      label: 'Título Principal',
                      page: 'Services',
                      blockId: 'page_title',
                      defaultValue: 'Nossos Serviços',
                    },
                    {
                      label: 'Subtítulo',
                      page: 'Services',
                      blockId: 'page_subtitle',
                      defaultValue: 'Programas personalizados para todas as idades',
                      isTextarea: true,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Nota:</strong> Os serviços individuais são geridos em "Serviços" no menu lateral
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SHOP PAGE */}
          <TabsContent value="shop">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Página da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ContentSection
                  title="🛒 Cabeçalho Loja"
                  fields={[
                    {
                      label: 'Título',
                      page: 'Shop',
                      blockId: 'page_title',
                      defaultValue: 'Loja',
                    },
                    {
                      label: 'Subtítulo',
                      page: 'Shop',
                      blockId: 'page_subtitle',
                      defaultValue: 'Equipamento e acessórios premium',
                      isTextarea: true,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACT PAGE */}
          <TabsContent value="contact">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Página de Contactos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ContentSection
                  title="📞 Cabeçalho"
                  fields={[
                    {
                      label: 'Título',
                      page: 'Contact',
                      blockId: 'page_title',
                      defaultValue: 'Contactos',
                    },
                    {
                      label: 'Subtítulo',
                      page: 'Contact',
                      blockId: 'page_subtitle',
                      defaultValue: 'Entre em contacto connosco',
                      isTextarea: true,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
                <ContentSection
                  title="📍 Informações"
                  fields={[
                    {
                      label: 'Morada',
                      page: 'Contact',
                      blockId: 'address',
                      defaultValue: 'Rua das Hortas - Picadeiro Quinta da Horta, 2890-106 Alcochete',
                      isTextarea: true,
                    },
                    {
                      label: 'Telefone',
                      page: 'Contact',
                      blockId: 'phone',
                      defaultValue: '+351 932 111 786',
                    },
                    {
                      label: 'Email',
                      page: 'Contact',
                      blockId: 'email',
                      defaultValue: 'picadeiroquintadahortagf@gmail.com',
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* FOOTER */}
          <TabsContent value="footer">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Footer do Site
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ContentSection
                  title="📄 Conteúdo do Footer"
                  fields={[
                    {
                      label: 'Descrição do Picadeiro',
                      page: 'Footer',
                      blockId: 'description',
                      defaultValue: 'Centro equestre de excelência em Alcochete',
                      isTextarea: true,
                    },
                    {
                      label: 'Copyright',
                      page: 'Footer',
                      blockId: 'copyright',
                      defaultValue: `© ${new Date().getFullYear()} Picadeiro Quinta da Horta`,
                    },
                  ]}
                  getContent={getContent}
                  handleSave={handleSave}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Reusable content section component
function ContentSection({ title, fields, getContent, handleSave, saving }) {
  const [values, setValues] = React.useState({});

  React.useEffect(() => {
    const initialValues = {};
    fields.forEach(field => {
      initialValues[field.blockId] = getContent(field.page, field.blockId, field.defaultValue);
    });
    setValues(initialValues);
  }, [fields, getContent]);

  const handleFieldChange = (blockId, value) => {
    setValues({ ...values, [blockId]: value });
  };

  const handleSaveSection = async () => {
    for (const field of fields) {
      await handleSave(field.page, field.blockId, values[field.blockId] || field.defaultValue);
    }
  };

  const isSaving = fields.some(f => saving[`${f.page}-${f.blockId}`]);

  return (
    <div className="space-y-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
      <h3 className="font-semibold text-lg text-[#2C3E1F]">{title}</h3>
      
      {fields.map((field) => (
        <div key={field.blockId} className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          {field.isTextarea ? (
            <Textarea
              value={values[field.blockId] || ''}
              onChange={(e) => handleFieldChange(field.blockId, e.target.value)}
              placeholder={field.defaultValue}
              rows={3}
              className="w-full"
            />
          ) : (
            <Input
              value={values[field.blockId] || ''}
              onChange={(e) => handleFieldChange(field.blockId, e.target.value)}
              placeholder={field.defaultValue}
              className="w-full"
            />
          )}
        </div>
      ))}

      <Button
        onClick={handleSaveSection}
        disabled={isSaving}
        className="w-full bg-gradient-to-r from-[#B8956A] to-[#8B7355] hover:from-[#8B7355] hover:to-[#6B5845] text-white font-semibold shadow-md hover:shadow-xl transition-all duration-300"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            A guardar...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Guardar {title}
          </>
        )}
      </Button>
    </div>
  );
}