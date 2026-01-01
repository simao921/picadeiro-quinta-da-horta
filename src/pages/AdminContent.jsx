import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2, Plus, Save, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const pages = [
  { value: 'Home', label: 'Página Inicial' },
  { value: 'Services', label: 'Serviços' },
  { value: 'Gallery', label: 'Galeria' },
  { value: 'Shop', label: 'Loja' },
  { value: 'Contact', label: 'Contactos' },
  { value: 'About', label: 'Sobre Nós' }
];

const contentTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'image', label: 'Imagem (URL)' },
  { value: 'button', label: 'Botão' },
  { value: 'html', label: 'HTML' }
];

export default function AdminContent() {
  const [selectedPage, setSelectedPage] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [formData, setFormData] = useState({
    page: 'Home',
    block_id: '',
    content_type: 'text',
    content: '',
    metadata: {},
    is_active: true,
    order: 0
  });

  const queryClient = useQueryClient();

  const { data: allBlocks, isLoading } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: () => base44.entities.ContentBlock.list('-created_date', 500),
    initialData: []
  });

  const blocks = selectedPage === 'all' 
    ? allBlocks 
    : allBlocks.filter(b => b.page === selectedPage);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentBlock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['content-blocks']);
      setDialogOpen(false);
      resetForm();
      toast.success('Bloco criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentBlock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['content-blocks']);
      setDialogOpen(false);
      setEditingBlock(null);
      resetForm();
      toast.success('Bloco atualizado com sucesso!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['content-blocks']);
      toast.success('Bloco eliminado!');
    }
  });

  const resetForm = () => {
    setFormData({
      page: selectedPage === 'all' ? 'Home' : selectedPage,
      block_id: '',
      content_type: 'text',
      content: '',
      metadata: {},
      is_active: true,
      order: 0
    });
  };

  const handleEdit = (block) => {
    setEditingBlock(block);
    setFormData({
      page: block.page,
      block_id: block.block_id,
      content_type: block.content_type,
      content: block.content,
      metadata: block.metadata || {},
      is_active: block.is_active,
      order: block.order || 0
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.block_id || !formData.content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getPageStats = (pageName) => {
    const pageBlocks = allBlocks.filter(b => b.page === pageName);
    return {
      total: pageBlocks.length,
      active: pageBlocks.filter(b => b.is_active).length,
      inactive: pageBlocks.filter(b => !b.is_active).length
    };
  };

  return (
    <AdminLayout currentPage="AdminContent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Conteúdo</h1>
            <p className="text-stone-500">Edite o conteúdo de todas as páginas do site</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingBlock(null);
              setDialogOpen(true);
            }}
            className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Bloco
          </Button>
        </div>

        {/* Page Tabs */}
        <Tabs value={selectedPage} onValueChange={setSelectedPage}>
          <TabsList className="bg-white border shadow-sm flex-wrap h-auto">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-[#B8956A] data-[state=active]:text-white"
            >
              Todos
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {allBlocks.length}
              </span>
            </TabsTrigger>
            {pages.map((page) => {
              const stats = getPageStats(page.value);
              return (
                <TabsTrigger
                  key={page.value}
                  value={page.value}
                  className="data-[state=active]:bg-[#B8956A] data-[state=active]:text-white"
                >
                  {page.label}
                  {stats.total > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {stats.total}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all">
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                  </div>
                ) : blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                    <p className="text-stone-500">Nenhum bloco de conteúdo</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Página</TableHead>
                        <TableHead>ID do Bloco</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Conteúdo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blocks.sort((a, b) => (a.order || 0) - (b.order || 0)).map((block) => (
                        <TableRow key={block.id}>
                          <TableCell>
                            <Badge variant="outline">{block.page}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{block.block_id}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-stone-100 rounded text-xs">
                              {contentTypes.find(t => t.value === block.content_type)?.label}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {block.content_type === 'image' ? (
                              <img src={block.content} alt="" className="h-10 w-20 object-cover rounded" />
                            ) : (
                              block.content
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              block.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {block.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(block)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja eliminar este bloco?')) {
                                    deleteMutation.mutate(block.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-600"
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
          </TabsContent>

          {pages.map((page) => (
            <TabsContent key={page.value} value={page.value}>
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                    </div>
                  ) : blocks.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <p className="text-stone-500">Nenhum bloco de conteúdo</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          resetForm();
                          setDialogOpen(true);
                        }}
                      >
                        Criar Primeiro Bloco
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID do Bloco</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Conteúdo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Ordem</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blocks.sort((a, b) => (a.order || 0) - (b.order || 0)).map((block) => (
                          <TableRow key={block.id}>
                            <TableCell className="font-mono text-sm">{block.block_id}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-stone-100 rounded text-xs">
                                {contentTypes.find(t => t.value === block.content_type)?.label}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {block.content_type === 'image' ? (
                                <img src={block.content} alt="" className="h-10 w-20 object-cover rounded" />
                              ) : (
                                block.content
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs ${
                                block.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {block.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell>{block.order || 0}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(block)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja eliminar este bloco?')) {
                                      deleteMutation.mutate(block.id);
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-600"
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
            </TabsContent>
          ))}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBlock ? 'Editar Bloco de Conteúdo' : 'Novo Bloco de Conteúdo'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Página</Label>
                  <Select
                    value={formData.page}
                    onValueChange={(v) => setFormData({ ...formData, page: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ID do Bloco *</Label>
                  <Input
                    placeholder="ex: hero_title"
                    value={formData.block_id}
                    onChange={(e) => setFormData({ ...formData, block_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(v) => setFormData({ ...formData, content_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                {formData.content_type === 'html' || formData.content_type === 'text' ? (
                  <Textarea
                    placeholder="Escreva o conteúdo aqui..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                  />
                ) : (
                  <Input
                    placeholder={formData.content_type === 'image' ? 'URL da imagem' : 'Conteúdo'}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active">Bloco ativo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingBlock(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}