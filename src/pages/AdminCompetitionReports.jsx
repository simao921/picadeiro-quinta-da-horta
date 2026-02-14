import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Sparkles, CheckCircle, Edit, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateFinalScore, calculateRankings } from '@/components/lib/scoreCalculator';
import ExerciseScoreForm from '@/components/admin/ExerciseScoreForm';

const normalizeExercises = (rawExercises) => {
  if (Array.isArray(rawExercises)) return rawExercises;
  if (rawExercises && typeof rawExercises === 'object' && Array.isArray(rawExercises.items)) {
    return rawExercises.items;
  }
  if (typeof rawExercises === 'string') {
    try {
      const parsed = JSON.parse(rawExercises);
      return normalizeExercises(parsed);
    } catch {
      return [];
    }
  }
  return [];
};

const getModalityExercises = (modality) => {
  const source = modality?.exercises?.length
    ? modality.exercises
    : modality?.coefficients?.__exercises?.length
      ? modality.coefficients.__exercises
      : [];

  return normalizeExercises(source).map((ex) => ({
    ...ex,
    number: String(ex.number),
    coefficient: typeof ex.coefficient === 'number' && ex.coefficient > 0 ? ex.coefficient : 1,
    max_points: typeof ex.max_points === 'number' && ex.max_points > 0 ? ex.max_points : 10
  }));
};

export default function AdminCompetitionReports() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [currentScore, setCurrentScore] = useState({
    modality_id: '',
    exercise_scores: {},
    penalties: 0
  });

  const queryClient = useQueryClient();

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['competition-reports'],
    queryFn: () => base44.entities.CompetitionReport.list('-created_date')
  });

  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: () => base44.entities.CompetitionModality.list()
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['entries-for-scores', selectedCompetition],
    queryFn: () => base44.entities.CompetitionEntry.filter({ 
      competition_id: selectedCompetition,
      status: 'aprovada'
    }),
    enabled: !!selectedCompetition && showManualDialog
  });

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const processReport = useMutation({
    mutationFn: async ({ fileUrl, modalityId }) => {
      // Buscar modalidade para ver se tem exercícios
      const modality = modalityId ? modalities.find(m => m.id === modalityId) : null;
      const modalityExercises = getModalityExercises(modality);
      const hasExercises = modalityExercises.length > 0;

      const schema = {
        type: "object",
        properties: {
          competition_info: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome da competição" },
              date: { type: "string", description: "Data da prova" },
              location: { type: "string", description: "Local" },
              grade: { type: "string", description: "Grau/Escalão" }
            }
          },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "string", description: "Número do exercício" },
                name: { type: "string", description: "Nome/descrição" },
                coefficient: { type: "number", description: "Coeficiente", default: 1 },
                max_points: { type: "number", description: "Pontuação máxima do exercício (se existir no protocolo)" }
              }
            },
            description: "Lista de exercícios identificados no protocolo"
          },
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                position: { type: "number", description: "Classificação final" },
                rider_name: { type: "string", description: "Nome completo do cavaleiro" },
                horse_name: { type: "string", description: "Nome do cavalo" },
                federal_number: { type: "string", description: "Número federado" },
                club: { type: "string", description: "Clube/Associação" },
                base_score: { type: "number", description: "Pontuação base inicial" },
                final_score: { type: "number", description: "Pontuação final" },
                percentage: { type: "number", description: "Percentagem" },
                penalties: { type: "number", description: "Penalizações" },
                time: { type: "string", description: "Tempo (se aplicável)" },
                technical_score: { type: "number", description: "Nota técnica (se aplicável)" },
                artistic_score: { type: "number", description: "Nota artística (se aplicável)" },
                judge_name: { type: "string", description: "Nome do juiz" },
                ...(hasExercises && {
                  exercise_scores: {
                    type: "object",
                    description: "Pontuações por exercício",
                    additionalProperties: { type: "number" }
                  }
                })
              }
            }
          }
        }
      };

      let prompt = `
Analisa este PROTOCOLO de competição equestre e extrai TODOS os dados disponíveis:

INFORMAÇÃO DA PROVA:
- Nome da competição
- Data
- Local
- Grau/Escalão

EXERCÍCIOS DA PROVA:
Identifica TODOS os exercícios listados no protocolo:
- Número do exercício (ex: "1", "2", "3"...)
- Título/nome/descrição completa do exercício
- Coeficiente (se indicado, senão usa 1)
- Pontuação máxima por exercício (ex: 10, 20, 30). Se não estiver explícito, usa 10

RESULTADOS (para cada participante):
- Posição/Classificação final
- Nome completo do cavaleiro
- Nome do cavalo
- Número federado (se disponível)
- Clube/Associação
- Pontuação base/inicial (nota de partida)
- Pontuação final (resultado após cálculos)
- Percentagem (se disponível)
- Penalizações aplicadas
- Tempo (se aplicável)
- Notas técnicas (se disponível)
- Notas artísticas (se disponível)
- Nome do juiz/júri
`;

      if (hasExercises) {
        prompt += `\n
🔴🔴🔴 ATENÇÃO CRÍTICA - MODO DE EXERCÍCIOS ATIVO 🔴🔴🔴

Esta modalidade tem ${modalityExercises.length} exercícios definidos:
${modalityExercises.map(ex => `  Exercício ${ex.number}: ${ex.name} (coeficiente: ${ex.coefficient})`).join('\n')}

TAREFA OBRIGATÓRIA para CADA participante:
1. Procura no protocolo a tabela/grelha com as pontuações por exercício
2. Identifica as colunas correspondentes a cada exercício (podem estar como "Ex1", "1", "Exercício 1", etc)
3. Extrai a pontuação (normalmente 0-10) de CADA exercício para CADA cavaleiro

FORMATO OBRIGATÓRIO do campo "exercise_scores":
{
  "exercise_scores": {
    "1": 7.5,
    "2": 8.0,
    "3": 6.5,
    ...todos os exercícios...
  }
}

⚠️ MUITO IMPORTANTE:
- As chaves do objeto devem ser STRINGS com o número do exercício
- Extrai TODAS as pontuações visíveis no protocolo para cada exercício
- Se um exercício não tem nota ou não foi realizado: usa null
- NÃO calcules médias, extrai os valores exatos que vês no PDF
- Verifica TODAS as colunas da tabela de resultados

EXEMPLO do que deves extrair se vires uma linha assim:
"João Silva | Cavalo X | 7.5 | 8.0 | 6.5 | 7.0 | ..."
Resultado: {"1": 7.5, "2": 8.0, "3": 6.5, "4": 7.0, ...}
`;
      }

      prompt += `
IMPORTANTE:
✓ Extrai TODOS os participantes do protocolo
✓ Mantém a ordem de classificação
✓ Se um campo não existir, deixa null ou 0
✓ Atenção especial às pontuações base vs finais
✓ Identifica todas as penalizações aplicadas
✓ Nos exercícios devolve sempre: number, name, coefficient, max_points

Estrutura no formato JSON especificado.
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        response_json_schema: schema
      });

      return result;
    }
  });

  const saveReport = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CompetitionReport.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-reports']);
      toast.success('Relatório guardado com sucesso!');
    }
  });

  const saveResults = useMutation({
    mutationFn: async (results) => {
      return await base44.entities.CompetitionResult.bulkCreate(results);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-results']);
      toast.success('Resultados guardados!');
    }
  });

  const saveIndividualResult = useMutation({
    mutationFn: async (result) => {
      return await base44.entities.CompetitionResult.create(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-results']);
      setShowScoreDialog(false);
      setSelectedStudent(null);
      setCurrentScore({ modality_id: '', exercise_scores: {}, penalties: 0 });
      toast.success('Pontuação guardada!');
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReportFile(file);
    }
  };

  const handleProcessReport = async () => {
    if (!reportFile || !selectedCompetition || !selectedGrade) {
      toast.error('Selecione a prova, escalão e o protocolo');
      return;
    }

    setIsProcessing(true);
    try {
      const fileUrl = await uploadFile.mutateAsync(reportFile);
      const competition = competitions.find(c => c.id === selectedCompetition);
      const extracted = await processReport.mutateAsync({ 
        fileUrl, 
        modalityId: competition?.modality_id 
      });

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

      // Se a IA identificou exercícios, atualizar a modalidade IMEDIATAMENTE
      if (normalizedExercises.length > 0 && competition?.modality_id) {
        const modality = modalities.find(m => m.id === competition.modality_id);
        if (modality) {
          await base44.entities.CompetitionModality.update(modality.id, {
            coefficients: {
              ...(modality.coefficients || {}),
              __exercises: normalizedExercises
            },
            exercises: normalizedExercises
          });
          // Refetch imediato dos dados com delay pequeno para garantir que DB foi atualizada
          await new Promise(resolve => setTimeout(resolve, 500));
          await queryClient.refetchQueries({ queryKey: ['modalities'] });
        }
      }

      setExtractedData({
        fileUrl,
        data: {
          ...extracted,
          exercises: normalizedExercises
        },
        competitionId: selectedCompetition,
        grade: selectedGrade
      });

      setShowUploadDialog(false);
      setShowValidationDialog(true);
      toast.success('Protocolo processado! Valide os dados.');

    } catch (error) {
      toast.error('Erro ao processar: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResults = async () => {
    if (!extractedData) return;
    if (!Array.isArray(extractedData.data?.results) || extractedData.data.results.length === 0) {
      toast.error('Não existem resultados extraídos para guardar.');
      return;
    }

    try {
      const user = await base44.auth.me();

      // Buscar modalidade da competição para cálculos
      const competition = competitions.find(c => c.id === extractedData.competitionId);
      const modality = competition?.modality_id 
        ? modalities.find(m => m.id === competition.modality_id)
        : null;

      await saveReport.mutateAsync({
        competition_id: extractedData.competitionId,
        original_file_url: extractedData.fileUrl,
        extracted_data: extractedData.data,
        is_validated: true,
        processed_by: user.email
      });



      // Calcular pontuações finais se houver modalidade com fórmula
      const results = extractedData.data.results.map(r => {
       const calculated = calculateFinalScore(competition, modality, {
          base_score: r.base_score,
          technical_score: r.technical_score,
          artistic_score: r.artistic_score,
          penalties: r.penalties || 0,
          final_score: r.final_score,
          percentage: r.percentage,
          time: r.time,
          exercise_scores: r.exercise_scores || {}
        });

        const notesArray = [];
        
        // Adicionar exercícios às notas se existirem
        if (r.exercise_scores && Object.keys(r.exercise_scores).length > 0) {
          const exercises = getModalityExercises(modality);
          Object.entries(r.exercise_scores).forEach(([exNum, exScore]) => {
            const ex = exercises.find(e => String(e.number) === String(exNum));
            notesArray.push(
              `Ex${exNum}: ${exScore}${ex?.coefficient > 1 ? `×${ex.coefficient}` : ''}${ex?.max_points ? `/${ex.max_points}` : ''}`
            );
          });
        } else {
          if (r.base_score) notesArray.push(`Base: ${r.base_score}`);
          if (r.technical_score) notesArray.push(`Técnica: ${r.technical_score}`);
          if (r.artistic_score) notesArray.push(`Artística: ${r.artistic_score}`);
        }
        
        if (calculated.calculation_details) notesArray.push(`Cálculo: ${calculated.calculation_details}`);
        if (r.judge_name) notesArray.push(`Juiz: ${r.judge_name}`);
        if (r.club) notesArray.push(`Clube: ${r.club}`);

        return {
          competition_id: extractedData.competitionId,
          rider_name: r.rider_name,
          horse_name: r.horse_name,
          score: calculated.final_score,
          percentage: calculated.percentage,
          penalties: r.penalties || 0,
          time: r.time || '',
          position: r.position,
          notes: notesArray.filter(Boolean).join(' | ')
        };
      });

      // Recalcular rankings baseado nas pontuações finais
      // Para saltos, menor pontuação é melhor
      const isSaltos = modality?.type === 'saltos' || modality?.scoring_formula?.includes('saltos');
      const rankedResults = calculateRankings(results, 'score', isSaltos);

      const existingResults = await base44.entities.CompetitionResult.filter({
        competition_id: extractedData.competitionId
      });
      if (existingResults.length > 0) {
        await Promise.all(existingResults.map(item => base44.entities.CompetitionResult.delete(item.id)));
      }

      await saveResults.mutateAsync(rankedResults);

      await base44.entities.Competition.update(extractedData.competitionId, {
        status: 'concluida'
      });

      setShowValidationDialog(false);
      setExtractedData(null);
      setSelectedCompetition('');
      setSelectedGrade('');
      setReportFile(null);

      queryClient.invalidateQueries(['competitions']);
      toast.success('Resultados calculados e guardados!');

    } catch (error) {
      toast.error('Erro: ' + error.message);
    }
  };

  const getCompetitionName = (compId) => {
    const comp = competitions.find(c => c.id === compId);
    return comp?.name || 'Prova desconhecida';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios de Competição</h1>
            <p className="text-stone-600 mt-1">Upload e processamento automático de resultados com IA</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowManualDialog(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Registar Manual
            </Button>
            <Button onClick={() => setShowUploadDialog(true)} className="bg-[#2D2D2D]">
              <Upload className="w-4 h-4 mr-2" />
              Upload Protocolo
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-[#B8956A]" />
                      <h3 className="text-lg font-bold">{getCompetitionName(report.competition_id)}</h3>
                      <Badge className={report.is_validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {report.is_validated ? 'Validado' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-stone-600 space-y-1">
                      <p>Processado por: {report.processed_by}</p>
                      {report.extracted_data?.results && (
                        <p>Resultados extraídos: {report.extracted_data.results.length} participantes</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(report.original_file_url, '_blank')}
                  >
                    Ver Original
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {reports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600">Nenhum relatório processado ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#B8956A]" />
              Upload de Protocolo com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>1. Selecione a Competição</Label>
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a prova" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name} - {comp.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>2. Grau/Escalão</Label>
              <Input
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                placeholder="Ex: Iniciado 1, Elementar, GP"
              />
              <p className="text-xs text-stone-500 mt-1">Escalão da prova</p>
            </div>

            <div>
              <Label>3. Upload do Protocolo</Label>
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#B8956A] transition-colors mt-2">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 font-medium">
                    {reportFile ? reportFile.name : 'Clique para selecionar protocolo'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">PDF ou imagem com resultados</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">
                  A IA extrai: nomes, cavalos, pontuações base, pontuações finais, penalizações, classificações e mais.
                </span>
              </p>
            </div>

            <Button
              onClick={handleProcessReport}
              disabled={!reportFile || !selectedCompetition || !selectedGrade || isProcessing}
              className="w-full bg-[#B8956A] hover:bg-[#8B7355]"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  A processar protocolo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Processar Protocolo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validar Dados Extraídos</DialogTitle>
          </DialogHeader>
          {extractedData && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 p-4 bg-stone-50 rounded-lg text-sm">
                <div>
                  <span className="text-stone-600">Prova:</span>
                  <p className="font-medium">{extractedData.data.competition_info?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-stone-600">Data:</span>
                  <p className="font-medium">{extractedData.data.competition_info?.date || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-stone-600">Escalão:</span>
                  <p className="font-medium">{extractedData.grade}</p>
                </div>
                <div>
                  <span className="text-stone-600">Participantes:</span>
                  <p className="font-medium">{extractedData.data.results?.length || 0}</p>
                </div>
              </div>

              {/* Mostrar exercícios extraídos */}
              {extractedData.data.exercises && extractedData.data.exercises.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-blue-700" />
                    <h3 className="font-bold text-blue-900">Exercícios Identificados pela IA</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {extractedData.data.exercises.map((ex, i) => (
                      <div key={i} className="bg-white p-2 rounded border border-blue-200">
                        <span className="font-bold text-blue-700">Ex. {ex.number}</span>
                        {ex.name && <span className="text-stone-600 ml-1">- {ex.name}</span>}
                        {ex.coefficient > 1 && <span className="text-stone-500 ml-1">(×{ex.coefficient})</span>}
                        <span className="text-stone-500 ml-1">[máx: {ex.max_points || 10}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
               <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold">Resultados Extraídos</h3>
                 {(() => {
                   const comp = competitions.find(c => c.id === extractedData.competitionId);
                   const mod = comp?.modality_id ? modalities.find(m => m.id === comp.modality_id) : null;
                   return mod?.scoring_formula && (
                     <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
                       <Calculator className="w-3 h-3" />
                       Cálculo automático ativo
                     </div>
                   );
                 })()}
               </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {extractedData.data.results?.map((result, index) => {
                    const comp = competitions.find(c => c.id === extractedData.competitionId);
                    const mod = comp?.modality_id ? modalities.find(m => m.id === comp.modality_id) : null;
                    const modExercises = getModalityExercises(mod);
                    const calculated = calculateFinalScore(comp, mod, {
                       base_score: result.base_score,
                       technical_score: result.technical_score,
                       artistic_score: result.artistic_score,
                       penalties: result.penalties || 0,
                       final_score: result.final_score,
                       percentage: result.percentage,
                       exercise_scores: result.exercise_scores || {}
                     });

                    return (
                      <div key={index} className="p-3 border rounded-lg bg-white">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#B8956A] text-white flex items-center justify-center font-bold text-sm">
                                {result.position}
                              </div>
                              <div>
                                <p className="font-bold">{result.rider_name}</p>
                                <p className="text-xs text-stone-600">{result.horse_name}</p>
                              </div>
                            </div>
                            {result.club && (
                              <p className="text-xs text-stone-500">🏛️ {result.club}</p>
                            )}
                            {result.federal_number && (
                              <p className="text-xs text-stone-500">📋 Fed: {result.federal_number}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            {result.base_score > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-stone-600">Base:</span>
                                <span>{result.base_score}</span>
                              </div>
                            )}
                            {result.technical_score > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-stone-600">Técnica:</span>
                                <span>{result.technical_score}</span>
                              </div>
                            )}
                            {result.artistic_score > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-stone-600">Artística:</span>
                                <span>{result.artistic_score}</span>
                              </div>
                            )}
                            {result.penalties > 0 && (
                              <div className="flex justify-between text-xs text-red-600">
                                <span>Penalizações:</span>
                                <span>-{result.penalties}</span>
                              </div>
                            )}
                            <div className="border-t pt-1 mt-1">
                              <div className="flex justify-between font-bold">
                                <span className="text-[#B8956A]">Final:</span>
                                <span className="text-[#B8956A]">{calculated.final_score}</span>
                              </div>
                              {calculated.percentage > 0 && (
                                <div className="flex justify-between text-xs text-stone-600 mt-1">
                                  <span>%:</span>
                                  <span>{calculated.percentage}%</span>
                                </div>
                              )}
                            </div>
                            {calculated.calculation_details && (
                              <p className="text-xs text-stone-500 mt-2 italic">
                                {calculated.calculation_details}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Exercícios */}
                        {result.exercise_scores && Object.keys(result.exercise_scores).length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-bold text-stone-700 mb-2">Pontuações por Exercício:</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {Object.entries(result.exercise_scores).map(([exNum, score]) => {
                                const exercise = modExercises.find(e => String(e.number) === String(exNum));
                                return (
                                  <div key={exNum} className="flex justify-between bg-stone-50 p-1 rounded">
                                    <span className="text-stone-600">
                                      {exNum}
                                      {exercise?.coefficient > 1 && ` (×${exercise.coefficient})`}
                                      {exercise?.max_points && ` /${exercise.max_points}`}
                                      :
                                    </span>
                                    <span className="font-medium">{score !== null ? score : '-'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmResults}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar e Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowValidationDialog(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lista de Alunos para Pontuação */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registar Pontuações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione a Competição</Label>
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a prova" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name} - {comp.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompetition && entries.length > 0 && (
              <>
                <div>
                  <h3 className="font-bold mb-3">Participantes ({entries.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {entries.map((entry) => (
                      <Card key={entry.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-lg">{entry.rider_name}</p>
                              <p className="text-sm text-stone-600">{entry.horse_name}</p>
                            </div>
                            <Button
                              onClick={() => {
                                setSelectedStudent(entry);
                                setCurrentScore({ modality_id: '', exercise_scores: {}, penalties: 0 });
                                setShowScoreDialog(true);
                              }}
                              className="bg-[#B8956A] hover:bg-[#8B7355]"
                            >
                              Meter Pontuação
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedCompetition && entries.length === 0 && (
              <p className="text-center text-stone-500 py-8">
                Nenhum participante aprovado nesta prova.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo Individual de Pontuação */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Pontuação - {selectedStudent?.rider_name}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-lg">
                <p className="text-sm text-stone-600">Cavalo</p>
                <p className="font-bold">{selectedStudent.horse_name}</p>
              </div>

              <div>
                <Label>Modalidade</Label>
                <Select 
                  value={currentScore.modality_id} 
                  onValueChange={(value) => {
                    setCurrentScore({ ...currentScore, modality_id: value, exercise_scores: {} });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map(mod => (
                      <SelectItem key={mod.id} value={mod.id}>
                        {mod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentScore.modality_id && (() => {
                const selectedMod = modalities.find(m => m.id === currentScore.modality_id);
                const selectedExercises = getModalityExercises(selectedMod);
                return (
                  <ExerciseScoreForm
                    exercises={selectedExercises}
                    scores={currentScore.exercise_scores}
                    penalties={currentScore.penalties}
                    onScoreChange={(exNumber, value) => {
                      setCurrentScore({
                        ...currentScore,
                        exercise_scores: {
                          ...currentScore.exercise_scores,
                          [exNumber]: value
                        }
                      });
                    }}
                    onPenaltiesChange={(value) => {
                      setCurrentScore({ ...currentScore, penalties: value });
                    }}
                    showCalculation={true}
                  />
                );
              })()}

              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!currentScore.modality_id) {
                      toast.error('Selecione a modalidade');
                      return;
                    }

                    const selectedMod = modalities.find(m => m.id === currentScore.modality_id);
                    const selectedExercises = getModalityExercises(selectedMod);
                     const comp = competitions.find(c => c.id === selectedCompetition);
                     const calculated = calculateFinalScore(comp, selectedMod, currentScore);

                     const notesArray = [];
                    if (selectedMod) notesArray.push(`Modalidade: ${selectedMod.name}`);
                    if (currentScore.exercise_scores && Object.keys(currentScore.exercise_scores).length > 0) {
                      Object.entries(currentScore.exercise_scores).forEach(([exNum, exScore]) => {
                        const ex = selectedExercises.find(e => String(e.number) === String(exNum));
                        notesArray.push(`Ex${exNum}: ${exScore}${ex?.coefficient > 1 ? `×${ex.coefficient}` : ''}`);
                      });
                    }
                    if (calculated.calculation_details) notesArray.push(`${calculated.calculation_details}`);

                    await saveIndividualResult.mutateAsync({
                      competition_id: selectedCompetition,
                      entry_id: selectedStudent.id,
                      rider_name: selectedStudent.rider_name,
                      horse_name: selectedStudent.horse_name,
                      score: calculated.final_score,
                      percentage: calculated.percentage,
                      penalties: currentScore.penalties || 0,
                      position: 0,
                      notes: notesArray.join(' | ')
                    });
                  }}
                  className="flex-1 bg-[#B8956A] hover:bg-[#8B7355]"
                  disabled={!currentScore.modality_id}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Guardar Pontuação
                </Button>
                <Button variant="outline" onClick={() => setShowScoreDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
