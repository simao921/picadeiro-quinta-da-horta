import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Upload, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRegulations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRegulation, setNewRegulation] = useState({
    title: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: regulations, isLoading } = useQuery({
    queryKey: ['admin-regulations'],
    queryFn: () => base44.entities.RegulationDocument.list('-created_date', 100),
    initialData: []
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data) => {
      setUploading(true);
      try {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: data.file
        });

        // Create regulation record
        await base44.entities.RegulationDocument.create({
          title: data.title,
          file_url: file_url,
          is_visible: true
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-regulations']);
      setDialogOpen(false);
      setNewRegulation({ title: '', file: null });
      toast.success('Regulamento adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar regulamento');
    }
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, is_visible }) => 
      base44.entities.RegulationDocument.update(id, { is_visible }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-regulations']);
      toast.success('Visibilidade atualizada!');
    }
  });

  const deleteRegulationMutation = useMutation({
    mutationFn: (id) => base44.entities.RegulationDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-regulations']);
      toast.success('Regulamento removido!');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setNewRegulation({ ...newRegulation, file });
    } else {
      toast.error('Por favor selecione um ficheiro PDF');
    }
  };

  return (
    <AdminLayout currentPage="AdminRegulations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Regulamentos</h1>
            <p className="text-stone-500">Gerir documentos do regulamento interno</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Regulamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Regulamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Ex: Regulamento Interno"
                    value={newRegulation.title}
                    onChange={(e) => setNewRegulation({ ...newRegulation, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ficheiro PDF</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-5 h-5 text-stone-400" />
                  </div>
                  {newRegulation.file && (
                    <p className="text-sm text-green-600">
                      Ficheiro selecionado: {newRegulation.file.name}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => uploadFileMutation.mutate(newRegulation)}
                  disabled={!newRegulation.title || !newRegulation.file || uploading}
                  className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A carregar...
                    </>
                  ) : (
                    'Adicionar Regulamento'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Regulations List */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Regulamentos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
              </div>
            ) : regulations.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p>Nenhum regulamento adicionado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Visível</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regulations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#B8956A]" />
                          <span className="font-medium">{reg.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(reg.created_date).toLocaleDateString('pt-PT')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={reg.is_visible}
                            onCheckedChange={(checked) =>
                              toggleVisibilityMutation.mutate({ id: reg.id, is_visible: checked })
                            }
                          />
                          {reg.is_visible ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={reg.file_url} target="_blank" rel="noopener noreferrer">
                              Ver
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover este regulamento?')) {
                                deleteRegulationMutation.mutate(reg.id);
                              }
                            }}
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
      </div>
    </AdminLayout>
  );
}