import React, { useMemo, useState, useEffect } from 'react';
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
import CompetitionEntryForm from '@/components/competitions/CompetitionEntryForm';

export default function CompetitionDetail() {
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [selectedResultGrade, setSelectedResultGrade] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const competitionId = urlParams.get('id');

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setCurrentUser).catch(() => {});
    }).catch(() => {});
  }, []);

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      const comps = await base44.entities.Competition.filter({ id: competitionId });
      return comps[0];
    },
    enabled: !!competitionId
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['competition-entries', competitionId, currentUser?.email],
    queryFn: async () => {
      if (!competitionId) return [];
      const allEntries = await base44.entities.CompetitionEntry.filter({ competition_id: competitionId });
      // Mostrar todas as aprovadas E as pendentes/rejeitadas do próprio utilizador
      return allEntries.filter(e => e.status === 'aprovada' || e.rider_email === currentUser?.email);
    },
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
    <div className="min-h-screen bg-[#FDFCFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <Badge className={`${statusInfo.color} mb-4`}>
                {statusInfo.label}
              </Badge>
              <h1 className="text-3xl font-bold text-[#2C3E1F] mb-4">
                {competition.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-stone-600 font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  {format(new Date(competition.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-stone-400" />
                  {competition.modality_name}
                </div>
                {competition.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-stone-400" />
                    {competition.location}
                  </div>
                )}
              </div>
            </div>
            {canEnroll && (
              <Button 
                onClick={() => setShowEntryDialog(true)}
                className="bg-[#2C3E1F] hover:bg-[#1f2c16] text-white px-8 py-6 rounded-xl text-lg w-full md:w-auto"
              >
                Inscrever-se na Prova
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="bg-stone-50 border border-stone-100 p-1.5 rounded-[2rem] h-auto gap-2 mb-12">
                <TabsTrigger value="info" className="rounded-[1.5rem] px-8 py-4 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500">
                  Sobre a Prova
                </TabsTrigger>
                <TabsTrigger value="participants" className="rounded-[1.5rem] px-8 py-4 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500">
                  Participantes ({entries.length})
                </TabsTrigger>
                <TabsTrigger value="results" className="rounded-[1.5rem] px-8 py-4 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500">
                  Resultados
                </TabsTrigger>
                <TabsTrigger value="program" className="rounded-[1.5rem] px-8 py-4 font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-[#2C3E1F] data-[state=active]:text-white transition-all duration-500">
                  Ordem de Entrada
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-0">
                <Card className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
                  <CardContent className="p-12 space-y-10">
                    <div className="space-y-6">
                      <h3 className="text-3xl font-serif font-black text-[#2C3E1F]">Detalhes do Evento</h3>
                      <p className="text-xl text-stone-500 leading-relaxed font-medium">
                        {competition.description || 'Estamos a finalizar os detalhes desta competição. Fique atento às atualizações.'}
                      </p>
                    </div>
                    {competition.regulation_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(competition.regulation_url, '_blank')}
                        className="h-16 px-8 rounded-2xl border-stone-100 text-[#B8956A] font-black uppercase tracking-widest text-[10px]"
                      >
                        <FileText className="w-5 h-5 mr-3" />
                        Consultar Regulamento PDF
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants" className="mt-0">
                <Card className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
                  <CardContent className="p-12">
                    {entries.length === 0 ? (
                      <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                        <Users className="w-20 h-20 text-stone-200 mx-auto mb-6" />
                        <p className="text-xl font-serif font-black text-stone-400">Nenhum participante registado</p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {entries.map((entry, index) => (
                          <div key={entry.id} className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="flex items-center gap-8">
                              <div className="w-14 h-14 bg-[#11180D] rounded-2xl flex items-center justify-center text-white font-serif font-black text-xl shadow-lg">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-2xl font-serif font-black text-[#2C3E1F]">{entry.rider_name}</p>
                                <p className="text-lg font-bold text-[#B8956A] uppercase tracking-widest text-[10px]">{entry.horse_name}</p>
                              </div>
                            </div>
                            <Badge className="bg-[#B8956A]/10 text-[#B8956A] border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Confirmado
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="mt-0">
                <Card className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
                  <CardHeader className="p-10 px-12 border-b border-stone-50 flex flex-row items-center justify-between">
                    <h3 className="text-2xl font-serif font-black text-[#2C3E1F]">Tabela de Classificações</h3>
                    {hasResults && (
                      <Select value={selectedResultGrade} onValueChange={setSelectedResultGrade}>
                        <SelectTrigger className="w-64 h-12 rounded-xl border-stone-100 font-bold">
                          <SelectValue placeholder="Todos os Escalões" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Escalões</SelectItem>
                          {availableGrades.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardHeader>
                  <CardContent className="p-12">
                    {!hasResults ? (
                      <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                        <Award className="w-20 h-20 text-stone-200 mx-auto mb-6" />
                        <p className="text-xl font-serif font-black text-stone-400">Resultados pendentes de publicação</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {filteredResults.map((result, index) => {
                          const scoreValue = typeof result.score === 'number' ? result.score : parseFloat(result.score || 0);
                          const percentageValue = typeof result.percentage === 'number' ? result.percentage : parseFloat(result.percentage || 0);

                          return (
                            <div key={result.id} className="p-10 bg-stone-50/50 rounded-[3rem] border border-stone-100 relative group hover:bg-white hover:shadow-2xl transition-all duration-700">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10">
                                <div className="flex items-center gap-10">
                                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-serif font-black text-3xl shadow-xl transform group-hover:scale-110 transition-transform duration-500 ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-white' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                    'bg-white text-[#11180D] border border-stone-100'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="text-3xl font-serif font-black text-[#2C3E1F] mb-1">{result.rider_name}</p>
                                    <div className="flex items-center gap-4">
                                      <p className="text-lg font-bold text-[#B8956A]">{result.horse_name}</p>
                                      <span className="w-1 h-1 bg-stone-300 rounded-full" />
                                      <p className="text-xs font-black uppercase tracking-widest text-stone-400">{result.grade}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {percentageValue > 0 && (
                                    <p className="text-5xl font-serif font-black text-[#11180D] mb-1">{percentageValue.toFixed(2)}%</p>
                                  )}
                                  <p className="text-sm font-black text-stone-400 uppercase tracking-widest">{scoreValue.toFixed(2)} Pontos Totais</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {competition.final_report_url && (
                          <div className="pt-8">
                            <Button
                              onClick={() => window.open(competition.final_report_url, '_blank')}
                              className="w-full h-20 rounded-[2rem] bg-[#11180D] hover:bg-[#B8956A] text-white font-black uppercase tracking-widest text-xs transition-all duration-500 shadow-2xl shadow-[#11180D]/20"
                            >
                              <Download className="w-6 h-6 mr-4" />
                              Baixar Livro de Resultados Oficial
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="program" className="mt-0">
                <Card className="premium-card bg-white border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
                  <CardContent className="p-12">
                    {entries.length === 0 ? (
                      <div className="text-center py-20 bg-stone-50/50 rounded-[3rem] border-2 border-dashed border-stone-100">
                        <FileText className="w-20 h-20 text-stone-200 mx-auto mb-6" />
                        <p className="text-xl font-serif font-black text-stone-400">Ordem de entrada em processamento</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {entries
                          .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
                          .map((entry) => {
                            const timeMatch = entry.notes?.match(/Horário:\s*(\d{2}:\d{2})/);
                            const entryTime = timeMatch ? timeMatch[1] : null;
                            
                            return (
                              <div key={entry.id} className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all duration-500 group">
                                <div className="flex items-center gap-8">
                                  <div className="w-14 h-14 bg-[#2C3E1F] rounded-2xl flex items-center justify-center text-white font-serif font-black text-xl shadow-lg">
                                    {entry.order_number || '-'}
                                  </div>
                                  <div>
                                    <p className="text-2xl font-serif font-black text-[#2C3E1F]">{entry.rider_name}</p>
                                    <p className="text-lg font-bold text-[#B8956A] uppercase tracking-widest text-[10px]">{entry.horse_name}</p>
                                    {entry.status !== 'aprovada' && (
                                      <Badge className="mt-2 bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">
                                        {entry.status === 'pendente' ? 'Pendente de Aprovação' : 'Rejeitada'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {entryTime && (
                                  <div className="bg-[#11180D] px-8 py-4 rounded-2xl shadow-xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#B8956A] mb-1">Início Estimado</p>
                                    <p className="text-2xl font-serif font-black text-white">{entryTime}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-12">
            {(competition.status === 'inscricoes_abertas' || isFull) && (
              <div className="premium-card bg-[#11180D] p-12 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.3)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8956A]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10 space-y-10 text-center">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B8956A]">Inscrições Online</span>
                    <h3 className="text-4xl font-serif font-black text-white">Participe Hoje</h3>
                    <p className="text-white/50 font-medium text-lg">
                      {isFull ? 'As inscrições para esta prova encontram-se atualmente esgotadas.' : 'Garanta o seu lugar na linha de partida submetendo a sua inscrição segura.'}
                    </p>
                  </div>
                  
                  <Button
                    disabled={!canEnroll}
                    onClick={() => setShowEntryDialog(true)}
                    className="w-full h-20 bg-[#B8956A] hover:bg-white hover:text-[#11180D] text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 shadow-2xl shadow-[#B8956A]/20"
                  >
                    Submeter Formulário
                  </Button>

                  {competition.entry_deadline && (
                    <p className="text-xs font-black uppercase tracking-widest text-white/30">
                      Encerramento a {format(new Date(competition.entry_deadline), "d 'de' MMMM", { locale: pt })}
                    </p>
                  )}

                  <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Suporte ao Atleta</p>
                    <a href="tel:+351932111786" className="text-white font-bold hover:text-[#B8956A] transition-colors text-lg">+351 932 111 786</a>
                  </div>
                </div>
              </div>
            )}

            <Card className="premium-card bg-white border border-stone-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-8 border-b border-stone-50">
                <h3 className="text-xl font-serif font-black text-[#2C3E1F]">Resumo Técnico</h3>
              </div>
              <CardContent className="p-10 space-y-6">
                <div className="flex justify-between items-center group">
                  <span className="text-xs font-black uppercase tracking-widest text-stone-400">Modalidade</span>
                  <span className="font-bold text-[#2C3E1F]">{competition.modality_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-stone-400">Participantes</span>
                  <span className="font-bold text-[#2C3E1F]">{entries.length} / {competition.max_entries || '∞'}</span>
                </div>
                {competition.grade && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-400">Grau Técnico</span>
                    <span className="font-bold text-[#2C3E1F]">{competition.grade}</span>
                  </div>
                )}
                {competition.is_federal && (
                  <Badge className="w-full justify-center bg-blue-50 text-blue-600 border-none py-3 rounded-xl font-black uppercase tracking-widest text-[9px]">
                    Evento Federado Oficial
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
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
