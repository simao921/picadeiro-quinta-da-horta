import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings, Upload, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

const normalizeExercises = (rawExercises) => {
  let list = [];

  if (Array.isArray(rawExercises)) {
    list = rawExercises;
  } else if (typeof rawExercises === 'string') {
    try {
      const parsed = JSON.parse(rawExercises);
      return normalizeExercises(parsed);
    } catch {
      return [];
    }
  } else if (rawExercises && typeof rawExercises === 'object') {
    if (Array.isArray(rawExercises.items)) {
      list = rawExercises.items;
    } else {
      const numericKeys = Object.keys(rawExercises).filter((key) => /^\d+$/.test(key));
      if (numericKeys.length > 0) {
        list = numericKeys
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => rawExercises[key]);
      }
    }
  }

  return list
    .filter((ex) => ex && (ex.number !== undefined || ex.name !== undefined))
    .map((ex) => ({
      number: ex.number !== undefined ? String(ex.number) : '',
      name: ex.name !== undefined ? String(ex.name) : '',
      coefficient: typeof ex.coefficient === 'number' && ex.coefficient > 0 ? ex.coefficient : 1,
      max_points: typeof ex.max_points === 'number' && ex.max_points > 0 ? ex.max_points : 10
    }));
};

const extractExercisesFromModality = (modality) => normalizeExercises(
  modality?.exercises
    ?? modality?.coefficients?.__exercises
    ?? modality?.penalty_rules?.exercises
    ?? []
);

export default function AdminCompetitionModalities() {
  const [showDialog, setShowDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editingModality, setEditingModality] = useState(null);
  const [protocolFile, setProtocolFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'dressage_ensino',
    description: '',
    scoring_formula: '',
    tiebreaker_criteria: '',
    regulation_url: '',
    coefficients: {},
    exercises: [],
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: modalities = [] } = useQuery({
    queryKey: ['admin-modalities'],
    queryFn: () => base44.entities.CompetitionModality.list()
  });

  const createModality = useMutation({
    mutationFn: (data) => base44.entities.CompetitionModality.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modalities'] });
      setShowDialog(false);
      resetForm();
      toast.success('Modalidade criada!');
    }
  });

  const updateModality = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompetitionModality.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modalities'] });
      setShowDialog(false);
      resetForm();
      toast.success('Modalidade atualizada!');
    }
  });

  const deleteModality = useMutation({
    mutationFn: (id) => base44.entities.CompetitionModality.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modalities'] });
      toast.success('Modalidade eliminada!');
    }
  });

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const processProtocol = useMutation({
    mutationFn: async (fileUrl) => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da modalidade" },
          type: { 
            type: "string", 
            enum: ["dressage_ensino", "working_equitation", "saltos", "completo", "outra"],
            description: "Tipo de modalidade baseado no conteúdo" 
          },
          description: { type: "string", description: "Descrição detalhada da modalidade" },
          scoring_formula: { type: "string", description: "Fórmula de cálculo da pontuação" },
          penalty_rules: { 
            type: "object",
            description: "Regras de penalização extraídas do protocolo"
          },
          coefficients: {
            type: "object", 
            description: "Coeficientes aplicáveis extraídos"
          },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "string", description: "Número do exercício" },
                name: { type: "string", description: "Nome/descrição" },
                coefficient: { type: "number", description: "Coeficiente", default: 1 },
                max_points: { type: "number", description: "Pontuação máxima do exercício (se indicada)" }
              }
            },
            description: "Lista de exercícios da prova"
          },
          tiebreaker_criteria: { type: "string", description: "Critério de desempate" }
        }
      };

      const prompt = `
Analisa este protocolo/regulamento de competição equestre e extrai as seguintes informações:

1. NOME DA MODALIDADE: Identifica o nome oficial da prova/modalidade
2. TIPO: Classifica como: dressage_ensino, working_equitation, saltos, completo, ou outra
3. DESCRIÇÃO: Resume os objetivos e características principais da modalidade
4. FÓRMULA DE PONTUAÇÃO: Extrai a fórmula exata de cálculo da pontuação final
5. REGRAS DE PENALIZAÇÃO: Lista todas as penalizações (ex: erro de percurso: -5 pontos, derrubar obstáculo: -4 pontos)
6. COEFICIENTES: Identifica coeficientes aplicáveis (ex: coeficiente de dificuldade: 1.5x)
7. EXERCÍCIOS: Identifica TODOS os exercícios listados:
   - Número do exercício (ex: "1", "2", "3"...)
   - Nome/título/descrição do exercício
   - Coeficiente do exercício (se indicado, senão usa 1)
   - Pontuação máxima do exercício (se não existir no protocolo, usa 10)
9. CRITÉRIO DE DESEMPATE: Como se resolve empates (ex: menor tempo, melhor nota em movimento específico)

⚠️ IMPORTANTE para EXERCÍCIOS:
- Procura tabelas ou listas numeradas de exercícios
- Extrai TODOS os exercícios identificados no protocolo
- Cada exercício deve ter: número (string), nome (descrição), coeficiente (número), max_points (número)

Estrutura os dados de forma clara seguindo o schema JSON.
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        response_json_schema: schema
      });

      return result;
    }
  });

  const handleProcessProtocol = async () => {
    if (!protocolFile) {
      toast.error('Selecione um ficheiro');
      return;
    }

    setIsProcessing(true);
    try {
      const fileUrl = await uploadFile.mutateAsync(protocolFile);
      const extracted = await processProtocol.mutateAsync(fileUrl);
      const normalizedExercises = Array.isArray(extracted.exercises)
        ? extracted.exercises
          .filter(ex => ex?.number && ex?.name)
          .map(ex => ({
            number: String(ex.number),
            name: String(ex.name),
            coefficient: typeof ex.coefficient === 'number' && ex.coefficient > 0 ? ex.coefficient : 1,
            max_points: typeof ex.max_points === 'number' && ex.max_points > 0 ? ex.max_points : 10
          }))
        : [];

      setFormData({
        name: extracted.name || '',
        type: extracted.type || 'dressage_ensino',
        description: extracted.description || '',
        scoring_formula: extracted.scoring_formula || '',
        tiebreaker_criteria: extracted.tiebreaker_criteria || '',
        regulation_url: fileUrl,
        coefficients: extracted.coefficients || {},
        exercises: normalizeExercises(normalizedExercises),
        is_active: true
      });

      setShowAIDialog(false);
      setShowDialog(true);
      toast.success('Protocolo analisado! Revise os dados e guarde.');
    } catch (error) {
      toast.error('Erro ao processar: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'dressage_ensino',
      description: '',
      scoring_formula: '',
      tiebreaker_criteria: '',
      regulation_url: '',
      coefficients: {},
      exercises: [],
      is_active: true
    });
    setEditingModality(null);
    setProtocolFile(null);
  };

  const handleEdit = (mod) => {
    setEditingModality(mod);
    setFormData({
      name: mod.name || '',
      type: mod.type || 'dressage_ensino',
      description: mod.description || '',
      scoring_formula: mod.scoring_formula || '',
      tiebreaker_criteria: mod.tiebreaker_criteria || '',
      regulation_url: mod.regulation_url || '',
      coefficients: mod.coefficients || {},
      exercises: extractExercisesFromModality(mod),
      is_active: mod.is_active !== undefined ? mod.is_active : true
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome da modalidade é obrigatório');
      return;
    }

    const normalizedExercises = normalizeExercises(formData.exercises)
      .filter(ex => ex.number && ex.name)
      .map(ex => ({
        ...ex,
        coefficient: typeof ex.coefficient === 'number' && ex.coefficient > 0 ? ex.coefficient : 1,
        max_points: typeof ex.max_points === 'number' && ex.max_points > 0 ? ex.max_points : 10
      }));

    const dataToSave = {
      ...formData,
      coefficients: {
        ...(formData.coefficients || {}),
        __exercises: normalizedExercises
      },
      exercises: normalizedExercises
    };

    if (editingModality) {
      updateModality.mutate({ id: editingModality.id, data: dataToSave });
    } else {
      createModality.mutate(dataToSave);
    }
  };

  const typeLabels = {
    dressage_ensino: 'Dressage / Ensino',
    working_equitation: 'Working Equitation',
    saltos: 'Saltos',
    completo: 'Completo',
    outra: 'Outra'
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Modalidades de Competição</h1>
            <p className="text-stone-600 mt-1">Configurar regras e critérios de pontuação</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAIDialog(true)} className="bg-gradient-to-r from-[#B8956A] to-[#8B7355]">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar com IA
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-[#2D2D2D]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Manual
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {modalities.map((mod) => (
            <Card key={mod.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#B8956A]" />
                    {mod.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(mod)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm('Eliminar esta modalidade?')) {
                          deleteModality.mutate(mod.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-stone-600">Tipo:</span>
                    <p className="font-medium">{typeLabels[mod.type]}</p>
                  </div>
                  {mod.description && (
                    <div>
                      <span className="text-stone-600">Descrição:</span>
                      <p className="text-stone-700">{mod.description}</p>
                    </div>
                  )}
                  {mod.scoring_formula && (
                    <div>
                      <span className="text-stone-600">Fórmula:</span>
                      <p className="font-mono text-xs bg-stone-100 p-2 rounded">{mod.scoring_formula}</p>
                    </div>
                  )}
                  {extractExercisesFromModality(mod).length > 0 && (
                    <div>
                      <span className="text-stone-600">Exercícios:</span>
                      <p className="font-medium text-green-600">{extractExercisesFromModality(mod).length} exercícios configurados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog para criar/editar modalidade */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowDialog(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingModality ? 'Editar Modalidade' : 'Nova Modalidade'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-xs">Nome *</Label>
                <Input
                  id="name"
                  required
                  className="h-8 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-xs">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dressage_ensino">Dressage / Ensino</SelectItem>
                    <SelectItem value="working_equitation">Working Equitation</SelectItem>
                    <SelectItem value="saltos">Saltos</SelectItem>
                    <SelectItem value="completo">Completo</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs">Descrição</Label>
              <textarea
                id="description"
                className="w-full min-h-[60px] px-2 py-1.5 border rounded-md text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="scoring_formula" className="text-xs">Fórmula</Label>
              <Input
                id="scoring_formula"
                placeholder="Ex: (score - penalties)"
                className="h-8 text-sm"
                value={formData.scoring_formula}
                onChange={(e) => setFormData({ ...formData, scoring_formula: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tiebreaker" className="text-xs">Desempate</Label>
              <Input
                id="tiebreaker"
                placeholder="Ex: menor tempo"
                className="h-8 text-sm"
                value={formData.tiebreaker_criteria}
                onChange={(e) => setFormData({ ...formData, tiebreaker_criteria: e.target.value })}
              />
            </div>

            {/* Exercícios */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Exercícios</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      exercises: [...formData.exercises, { number: '', name: '', coefficient: 1, max_points: 10 }]
                    });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded p-2">
                {formData.exercises.length > 0 ? (
                  formData.exercises.map((ex, index) => (
                    <div key={index} className="flex gap-1.5 items-center bg-stone-50 p-1.5 rounded text-xs">
                      <Input
                        placeholder="Nº"
                        className="w-12 h-7 text-xs"
                        value={ex.number}
                        onChange={(e) => {
                          const updated = [...formData.exercises];
                          updated[index] = { ...updated[index], number: e.target.value };
                          setFormData({ ...formData, exercises: updated });
                        }}
                      />
                      <Input
                        placeholder="Nome"
                        className="flex-1 h-7 text-xs"
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...formData.exercises];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setFormData({ ...formData, exercises: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Coef"
                        className="w-16 h-7 text-xs"
                        step="0.1"
                        value={ex.coefficient}
                        onChange={(e) => {
                          const updated = [...formData.exercises];
                          updated[index] = { ...updated[index], coefficient: parseFloat(e.target.value) || 1 };
                          setFormData({ ...formData, exercises: updated });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Máx"
                        className="w-16 h-7 text-xs"
                        step="0.1"
                        value={ex.max_points || 10}
                        onChange={(e) => {
                          const updated = [...formData.exercises];
                          updated[index] = { ...updated[index], max_points: parseFloat(e.target.value) || 10 };
                          setFormData({ ...formData, exercises: updated });
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          const updated = formData.exercises.filter((_, i) => i !== index);
                          setFormData({ ...formData, exercises: updated });
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500 text-center py-3">Sem exercícios</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-3.5 h-3.5"
              />
              <Label htmlFor="is_active" className="text-xs">Ativa</Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-[#B8956A] h-8">
                {editingModality ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" className="h-8" onClick={() => { resetForm(); setShowDialog(false); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog IA */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#B8956A]" />
              Criar Modalidade com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Como funciona:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Faça upload do protocolo/regulamento (PDF ou imagem)</li>
                    <li>A IA extrai automaticamente todas as informações</li>
                    <li>Revise e ajuste os dados se necessário</li>
                    <li>Guarde a modalidade</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <Label>Upload do Protocolo/Regulamento</Label>
              <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#B8956A] transition-colors mt-2">
                <div className="text-center">
                  <Upload className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 font-medium">
                    {protocolFile ? protocolFile.name : 'Clique para selecionar'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">PDF, JPG ou PNG</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setProtocolFile(e.target.files[0])}
                />
              </label>
            </div>

            <Button
              onClick={handleProcessProtocol}
              disabled={!protocolFile || isProcessing}
              className="w-full bg-gradient-to-r from-[#B8956A] to-[#8B7355] hover:opacity-90"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  A analisar protocolo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analisar com IA
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
