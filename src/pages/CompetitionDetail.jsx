import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calendar, MapPin, Trophy, Download, Users, FileText, Award, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import CompetitionEntryForm from '@/components/competitions/CompetitionEntryForm';

export default function CompetitionDetail() {
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [selectedResultGrade, setSelectedResultGrade] = useState('all');
  const urlParams = new URLSearchParams(window.location.search);
  const competitionId = urlParams.get('id');

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      const comps = await base44.entities.Competition.filter({ id: competitionId });
      return comps[0];
    },
    enabled: !!competitionId
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['competition-entries', competitionId],
    queryFn: () => base44.entities.CompetitionEntry.filter({ competition_id: competitionId, status: 'aprovada' }),
    enabled: !!competitionId
  });

  const { data: results = [] } = useQuery({
    queryKey: ['competition-results', competitionId],
    queryFn: () => base44.entities.CompetitionResult.filter({ competition_id: competitionId }),
    enabled: !!competitionId
  });

  const { data: modality } = useQuery({
    queryKey: ['modality', competition?.modality_id],
    queryFn: async () => {
      if (!competition?.modality_id) return null;
      const mods = await base44.entities.CompetitionModality.filter({ id: competition.modality_id });
      return mods[0] || null;
    },
    enabled: !!competition?.modality_id
  });

  const getStatusInfo = (status) => {
    const statusMap = {
      inscricoes_abertas: { label: 'Inscrições Abertas', color: 'bg-green-100 text-green-800' },
      inscricoes_encerradas: { label: 'Inscrições Encerradas', color: 'bg-yellow-100 text-yellow-800' },
      em_curso: { label: 'Em Curso', color: 'bg-blue-100 text-blue-800' },
      concluida: { label: 'Concluída', color: 'bg-gray-100 text-gray-800' },
      cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || statusMap.inscricoes_abertas;
  };

  const statusInfo = getStatusInfo(competition?.status);
  const isFull = !!competition?.max_entries && entries.length >= competition.max_entries;
  const canEnroll = competition?.status === 'inscricoes_abertas' && !isFull;
  const hasResults = results.length > 0;
  
  const resultsWithGrade = useMemo(() => {
    if (!results.length) return [];

    const entryGradeById = new Map(
      entries.map((entry) => [entry.id, entry.grade || 'Sem escalão'])
    );

    return results.map((result) => {
      const entryGrade = result.entry_id ? entryGradeById.get(result.entry_id) : null;
      const fallbackEntry = !entryGrade
        ? entries.find((entry) =>
            entry.rider_name === result.rider_name &&
            entry.horse_name === result.horse_name
          )
        : null;

      return {
        ...result,
        grade: entryGrade || fallbackEntry?.grade || 'Sem escalão'
      };
    });
  }, [results, entries]);

  const availableGrades = useMemo(() => {
    return Array.from(new Set(resultsWithGrade.map((result) => result.grade)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt'));
  }, [resultsWithGrade]);

  const filteredResults = useMemo(() => {
    const source = selectedResultGrade === 'all'
      ? resultsWithGrade
      : resultsWithGrade.filter((result) => result.grade === selectedResultGrade);

    return [...source].sort((a, b) => {
      const aPercentage = Number(a.percentage);
      const bPercentage = Number(b.percentage);
      if (Number.isFinite(aPercentage) && Number.isFinite(bPercentage) && aPercentage !== bPercentage) {
        return bPercentage - aPercentage;
      }

      const aScore = Number(a.score);
      const bScore = Number(b.score);
      if (Number.isFinite(aScore) && Number.isFinite(bScore) && aScore !== bScore) {
        return bScore - aScore;
      }

      return Number(a.position || 999) - Number(b.position || 999);
    });
  }, [resultsWithGrade, selectedResultGrade]);

  if (isLoading || !competition) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1A1A1A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className={`${statusInfo.color} mb-4`}>{statusInfo.label}</Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{competition.name}</h1>
            <div className="flex flex-wrap gap-6 text-stone-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {format(new Date(competition.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {competition.modality_name}
              </div>
              {competition.grade && (
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Grau: {competition.grade}
                </div>
              )}
              {competition.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {competition.location}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informação</TabsTrigger>
                <TabsTrigger value="participants">
                  Participantes ({entries.length})
                </TabsTrigger>
                <TabsTrigger value="results">Resultados</TabsTrigger>
                <TabsTrigger value="program">Ordem de Entrada</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre a Prova</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-700 leading-relaxed">
                      {competition.description || 'Informação detalhada em breve.'}
                    </p>
                    {competition.regulation_url && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.open(competition.regulation_url, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Regulamento
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Lista de Participantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {entries.length === 0 ? (
                      <p className="text-stone-500 text-center py-8">Ainda não há participantes confirmados</p>
                    ) : (
                      <div className="space-y-3">
                        {entries.map((entry, index) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                            <div>
                              <p className="font-medium">{entry.rider_name}</p>
                              <p className="text-sm text-stone-600">{entry.horse_name}</p>
                            </div>
                            <Badge variant="outline">#{index + 1}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Resultados
                      </CardTitle>
                      {modality?.scoring_formula && (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          <Calculator className="w-3 h-3 mr-1" />
                          Calculado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!hasResults ? (
                      <p className="text-stone-500 text-center py-8">Resultados disponíveis após a conclusão da prova</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-stone-600">
                            Melhores resultados por escalão
                          </p>
                          <Select value={selectedResultGrade} onValueChange={setSelectedResultGrade}>
                            <SelectTrigger className="w-56">
                              <SelectValue placeholder="Selecionar escalão" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os escalões</SelectItem>
                              {availableGrades.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {filteredResults.map((result, index) => {
                          const notes = result.notes || '';
                          const baseMatch = notes.match(/Base:\s*([\d.]+)/);
                          const techMatch = notes.match(/Técnica:\s*([\d.]+)/);
                          const artMatch = notes.match(/Artística:\s*([\d.]+)/);
                          const bonusMatch = notes.match(/Bonifica(?:ção|cao):\s*([+\-]?[\d.]+)%?/i);
                          const calcMatch = notes.match(/Cálculo:\s*([^|]+)/);
                          const scoreValue = typeof result.score === 'number'
                            ? result.score
                            : parseFloat(result.score || 0);
                          const percentageValue = typeof result.percentage === 'number'
                            ? result.percentage
                            : parseFloat(result.percentage || 0);

                          return (
                            <div key={result.id} className="p-4 bg-stone-50 rounded-lg border-l-4 border-[#B8956A]">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                    index + 1 === 1 ? 'bg-yellow-400 text-yellow-900' :
                                    index + 1 === 2 ? 'bg-gray-300 text-gray-900' :
                                    index + 1 === 3 ? 'bg-amber-600 text-white' :
                                    'bg-[#B8956A] text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-bold">{result.rider_name}</p>
                                    <p className="text-sm text-stone-600">{result.horse_name}</p>
                                    <p className="text-xs text-stone-500">{result.grade}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {percentageValue > 0 && (
                                    <p className="text-2xl font-bold text-[#B8956A]">{percentageValue.toFixed(2)}%</p>
                                  )}
                                  <p className="text-sm text-stone-600">{scoreValue.toFixed(2)} pts</p>
                                  {result.position ? (
                                    <p className="text-xs text-stone-500">Geral: {result.position}º</p>
                                  ) : null}
                                </div>
                              </div>

                              {(baseMatch || techMatch || artMatch || result.penalties > 0 || bonusMatch) && (
                                <div className="mt-3 pt-3 border-t border-stone-200">
                                  <div className="grid grid-cols-5 gap-2 text-xs text-center">
                                    {baseMatch && (
                                      <div>
                                        <div className="text-stone-500">Base</div>
                                        <div className="font-medium mt-1">{baseMatch[1]}</div>
                                      </div>
                                    )}
                                    {techMatch && (
                                      <div>
                                        <div className="text-stone-500">Técnica</div>
                                        <div className="font-medium mt-1">{techMatch[1]}</div>
                                      </div>
                                    )}
                                    {artMatch && (
                                      <div>
                                        <div className="text-stone-500">Artística</div>
                                        <div className="font-medium mt-1">{artMatch[1]}</div>
                                      </div>
                                    )}
                                    {result.penalties > 0 && (
                                      <div>
                                        <div className="text-stone-500">Penalizações</div>
                                        <div className="font-medium text-red-600 mt-1">-{result.penalties}</div>
                                      </div>
                                    )}
                                    {bonusMatch && (
                                      <div>
                                        <div className="text-stone-500">Bonificação</div>
                                        <div className="font-medium text-green-700 mt-1">+{bonusMatch[1]}%</div>
                                      </div>
                                    )}
                                  </div>
                                  {calcMatch && (
                                    <p className="text-xs text-stone-500 mt-2 italic text-center">
                                      {calcMatch[1].trim()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {competition.final_report_url && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => window.open(competition.final_report_url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Relatório Final
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="program">
                <Card>
                  <CardHeader>
                    <CardTitle>Ordem de Entrada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {entries.length === 0 ? (
                      <p className="text-stone-500 text-center py-8">Ordem de entrada disponível em breve</p>
                    ) : (
                      <div className="space-y-2">
                        {entries
                          .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
                          .map((entry) => {
                            const timeMatch = entry.notes?.match(/Horário:\s*(\d{2}:\d{2})/);
                            const entryTime = timeMatch ? timeMatch[1] : null;
                            
                            return (
                              <div key={entry.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border-l-4 border-[#B8956A]">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-[#2D2D2D] text-white flex items-center justify-center font-bold">
                                    {entry.order_number || '-'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-stone-900">{entry.rider_name}</p>
                                    <p className="text-sm text-stone-600">{entry.horse_name}</p>
                                    {entry.grade && (
                                      <p className="text-xs text-stone-500">{entry.grade}</p>
                                    )}
                                  </div>
                                </div>
                                {entryTime && (
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-[#B8956A]">{entryTime}</p>
                                    <p className="text-xs text-stone-500">Horário</p>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                        {filteredResults.length === 0 && (
                          <p className="text-stone-500 text-center py-8">
                            Sem resultados para o escalão selecionado.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {(competition.status === 'inscricoes_abertas' || isFull) && (
              <Card className="border-[#B8956A] border-2">
                <CardHeader>
                  <CardTitle className="text-center">Inscrições</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <p className="text-stone-700">
                    {isFull
                      ? 'As inscrições estão lotadas para esta prova.'
                      : 'Pode submeter a sua inscrição online e acompanhar o estado da aprovação.'}
                  </p>
                  <Button
                    className="w-full bg-[#B8956A] hover:bg-[#8B7355]"
                    onClick={() => setShowEntryDialog(true)}
                    disabled={!canEnroll}
                  >
                    Submeter Inscrição
                  </Button>
                  {competition.entry_deadline && (
                    <p className="text-xs text-stone-600">
                      Inscrições até {format(new Date(competition.entry_deadline), "d/MM/yyyy")}
                    </p>
                  )}
                  <div className="pt-2 space-y-2 text-sm text-stone-600">
                    <a href="tel:+351932111786" className="block hover:text-[#B8956A]">
                      📞 +351 932 111 786
                    </a>
                    <a href="mailto:picadeiroquintadahorta.gf@gmail.com" className="block hover:text-[#B8956A]">
                      ✉️ picadeiroquintadahorta.gf@gmail.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Modalidade:</span>
                  <span className="font-medium">{competition.modality_name}</span>
                </div>
                {competition.grade && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Grau:</span>
                    <span className="font-medium">{competition.grade}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">Participantes:</span>
                  <span className="font-medium">{entries.length}</span>
                </div>
                {competition.max_entries && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Limite:</span>
                    <span className="font-medium">{competition.max_entries}</span>
                  </div>
                )}
                {competition.is_federal && (
                  <Badge className="w-full justify-center bg-blue-100 text-blue-800">
                    Prova Federada
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CompetitionEntryForm
            competitionId={competition.id}
            competitionName={competition.name}
            onClose={() => setShowEntryDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
