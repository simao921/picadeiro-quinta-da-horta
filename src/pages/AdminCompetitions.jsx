import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Trophy, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminCompetitions() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    modality_name: '',
    modality_id: '',
    grade: '',
    status: 'inscricoes_abertas',
    description: '',
    location: '',
    max_entries: 50,
    entry_deadline: '',
    is_federal: false,
    program: ''
  });
  const [regulationFile, setRegulationFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: competitions = [] } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: () => base44.entities.CompetitionModality.list()
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['all-entries'],
    queryFn: () => base44.entities.CompetitionEntry.list()
  });

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const createCompetition = useMutation({
    mutationFn: (data) => base44.entities.Competition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      setShowDialog(false);
      resetForm();
      toast.success('Competição criada com sucesso!');
    }
  });

  const updateCompetition = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Competition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      setShowDialog(false);
      resetForm();
      toast.success('Competição atualizada!');
    }
  });

  const deleteCompetition = useMutation({
    mutationFn: (id) => base44.entities.Competition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competição eliminada!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      modality_name: '',
      modality_id: '',
      grade: '',
      status: 'inscricoes_abertas',
      description: '',
      location: '',
      max_entries: 50,
      entry_deadline: '',
      is_federal: false,
      program: ''
    });
    setEditingCompetition(null);
    setRegulationFile(null);
  };

  const handleEdit = (comp) => {
    setEditingCompetition(comp);
    setFormData(comp);
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let regulationUrl = formData.regulation_url;
    if (regulationFile) {
      try {
        regulationUrl = await uploadFile.mutateAsync(regulationFile);
      } catch (error) {
        toast.error('Erro ao fazer upload do regulamento');
        return;
      }
    }

    const data = {
      ...formData,
      regulation_url: regulationUrl,
      year: new Date(formData.date).getFullYear()
    };

    if (editingCompetition) {
      updateCompetition.mutate({ id: editingCompetition.id, data });
    } else {
      createCompetition.mutate(data);
    }
  };

  const getEntriesCount = (compId) => {
    return entries.filter(e => e.competition_id === compId && e.status === 'aprovada').length;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Competições</h1>
            <p className="text-stone-600 mt-1">Criar e gerir provas equestres</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-[#2D2D2D]">
            <Plus className="w-4 h-4 mr-2" />
            Nova Competição
          </Button>
        </div>

        <div className="grid gap-4">
          {competitions.map((comp) => (
            <Card key={comp.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="w-5 h-5 text-[#B8956A]" />
                      <h3 className="text-xl font-bold">{comp.name}</h3>
                      <Badge className={comp.status === 'inscricoes_abertas' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {comp.status === 'inscricoes_abertas' ? 'Inscrições Abertas' : 'Encerrada'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-stone-600">Data:</span>
                        <p className="font-medium">{format(new Date(comp.date), 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-stone-600">Modalidade:</span>
                        <p className="font-medium">{comp.modality_name}</p>
                      </div>
                      <div>
                        <span className="text-stone-600">Grau:</span>
                        <p className="font-medium">{comp.grade || '-'}</p>
                      </div>
                      <div>
                        <span className="text-stone-600">Inscrições:</span>
                        <p className="font-medium">{getEntriesCount(comp.id)} / {comp.max_entries}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(comp)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja eliminar esta competição?')) {
                          deleteCompetition.mutate(comp.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { resetForm(); } setShowDialog(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompetition ? 'Editar Competição' : 'Nova Competição'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Prova *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="entry_deadline">Prazo de Inscrições</Label>
                <Input
                  id="entry_deadline"
                  type="date"
                  value={formData.entry_deadline}
                  onChange={(e) => setFormData({ ...formData, entry_deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modality">Modalidade *</Label>
                <Select
                  value={formData.modality_name}
                  onValueChange={(value) => {
                    const mod = modalities.find(m => m.name === value);
                    setFormData({ ...formData, modality_name: value, modality_id: mod?.id || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map(mod => (
                      <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="grade">Grau / Escalão</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscricoes_abertas">Inscrições Abertas</SelectItem>
                    <SelectItem value="inscricoes_encerradas">Inscrições Encerradas</SelectItem>
                    <SelectItem value="em_curso">Em Curso</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max_entries">Nº Máximo de Inscrições</Label>
                <Input
                  id="max_entries"
                  type="number"
                  value={formData.max_entries}
                  onChange={(e) => setFormData({ ...formData, max_entries: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="program">Programa / Ordem de Entrada</Label>
              <textarea
                id="program"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
              />
            </div>

            <div>
              <Label>Regulamento (PDF)</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#B8956A]">
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                    <p className="text-sm text-stone-600">
                      {regulationFile ? regulationFile.name : formData.regulation_url ? 'Ficheiro atual' : 'Selecionar PDF'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => setRegulationFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_federal"
                checked={formData.is_federal}
                onChange={(e) => setFormData({ ...formData, is_federal: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_federal">Prova Federada</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-[#B8956A]" disabled={createCompetition.isPending || updateCompetition.isPending}>
                {createCompetition.isPending || updateCompetition.isPending ? 'A guardar...' : editingCompetition ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowDialog(false); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}