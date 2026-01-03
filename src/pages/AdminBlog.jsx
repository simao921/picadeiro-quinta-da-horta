import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: 'noticias',
    tags: [],
    meta_description: '',
    meta_keywords: [],
    is_published: false
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-posts']);
      toast.success('Artigo criado com sucesso!');
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-posts']);
      toast.success('Artigo atualizado!');
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-blog-posts']);
      toast.success('Artigo eliminado!');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category: 'noticias',
      tags: [],
      meta_description: '',
      meta_keywords: [],
      is_published: false
    });
    setEditingPost(null);
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featured_image: post.featured_image || '',
      category: post.category,
      tags: post.tags || [],
      meta_description: post.meta_description || '',
      meta_keywords: post.meta_keywords || [],
      is_published: post.is_published
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const readingTime = Math.ceil(formData.content.replace(/<[^>]*>/g, '').split(' ').length / 200);
    const dataToSubmit = {
      ...formData,
      reading_time: readingTime,
      published_date: formData.is_published ? new Date().toISOString() : null
    };

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const generateWithAI = async () => {
    if (!formData.title) {
      toast.error('Insira um título primeiro');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await base44.functions.invoke('generateBlogPost', {
        title: formData.title,
        category: formData.category
      });

      setFormData(prev => ({
        ...prev,
        content: response.data.content,
        excerpt: response.data.excerpt,
        meta_description: response.data.meta_description,
        meta_keywords: response.data.meta_keywords,
        tags: response.data.tags
      }));

      toast.success('Conteúdo gerado com IA!');
    } catch (error) {
      toast.error('Erro ao gerar conteúdo');
    } finally {
      setGeneratingAI(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <AdminLayout currentPage="AdminBlog">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Gestão de Blog</h1>
            <p className="text-stone-600">Crie e publique artigos otimizados para SEO</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Artigo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#B8956A]" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <p className="text-stone-500">Nenhum artigo criado ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-stone-800">{post.title}</h3>
                          <p className="text-sm text-stone-500">
                            {post.category} • {post.views || 0} visualizações
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            post.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {post.is_published ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                      </div>
                      <p className="text-stone-600 text-sm mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        {post.published_date && (
                          <span>{format(new Date(post.published_date), "d MMM yyyy", { locale: pt })}</span>
                        )}
                        {post.reading_time && <span>• {post.reading_time} min</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Eliminar este artigo?')) {
                            deleteMutation.mutate(post.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        title: e.target.value,
                        slug: generateSlug(e.target.value)
                      });
                    }}
                    placeholder="Título do artigo"
                  />
                </div>
                <div>
                  <Label>Slug (URL) *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="titulo-do-artigo"
                  />
                </div>
              </div>

              <div>
                <Label>Imagem de Destaque</Label>
                <Input
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="URL da imagem"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dicas">Dicas</SelectItem>
                      <SelectItem value="eventos">Eventos</SelectItem>
                      <SelectItem value="noticias">Notícias</SelectItem>
                      <SelectItem value="cuidados">Cuidados</SelectItem>
                      <SelectItem value="competicoes">Competições</SelectItem>
                      <SelectItem value="iniciantes">Iniciantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Publicar</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Resumo</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Resumo curto do artigo"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Conteúdo *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={generateWithAI}
                    disabled={generatingAI}
                  >
                    {generatingAI ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Gerar com IA
                  </Button>
                </div>
                <ReactQuill
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  className="bg-white"
                  modules={{
                    toolbar: [
                      [{ header: [2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>

              <div>
                <Label>Meta Descrição (SEO)</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Descrição para motores de busca (150-160 caracteres)"
                  rows={2}
                  maxLength={160}
                />
                <p className="text-xs text-stone-500 mt-1">
                  {formData.meta_description.length}/160 caracteres
                </p>
              </div>

              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="equitação, cavalos, dicas"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingPost ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}