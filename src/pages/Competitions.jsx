import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trophy, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import MetaTags from '@/components/seo/MetaTags';
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';

export default function Competitions() {
  const [modalityFilter, setModalityFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [heroImage, setHeroImage] = useState(DEFAULT_IMAGES.hero_competitions);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setCurrentUser).catch(() => {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getSiteImage('hero_competitions', DEFAULT_IMAGES.hero_competitions).then(setHeroImage);
  }, []);

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });
  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: () => base44.entities.CompetitionModality.list()
  });

  const { data: userEntries = [] } = useQuery({
    queryKey: ['my-entries', currentUser?.email],
    queryFn: () => base44.entities.CompetitionEntry.filter({ rider_email: currentUser.email }),
    enabled: !!currentUser?.email
  });

  const years = [...new Set(competitions.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);

  const filteredCompetitions = competitions.filter(comp => {
    if (modalityFilter !== 'all' && comp.modality_name !== modalityFilter) return false;
    if (yearFilter !== 'all' && comp.year !== parseInt(yearFilter)) return false;
    if (statusFilter !== 'all' && comp.status !== statusFilter) return false;
    return true;
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

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <MetaTags
        title="Competições Equestres - Picadeiro Quinta da Horta"
        description="Próximas provas e competições equestres. Inscreva-se e acompanhe os resultados."
        keywords="competições equestres, provas, dressage, working equitation, inscrições"
      />

      <section className="relative py-20 sm:py-24 bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <LazyImage
            src={heroImage}
            alt="Competições"
            className="w-full h-full object-cover"
            priority={true}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/65" />
        <div className="absolute top-10 right-10 sm:top-20 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-[#B8956A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-[#8B7355]/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Competições</h1>
            <p className="text-stone-200 mt-2 max-w-2xl">Acompanhe as provas e os resultados da nossa equipa.</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Advanced Filters */}
        <div className="mb-12">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <Filter className="w-5 h-5 text-stone-400" />
              <h2 className="text-lg font-semibold text-stone-700">Filtros</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600">Modalidade</label>
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                  <SelectTrigger className="w-full bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as modalidades</SelectItem>
                    {modalities.map(mod => (
                      <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600">Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="inscricoes_abertas">Inscrições Abertas</SelectItem>
                    <SelectItem value="inscricoes_encerradas">Inscrições Encerradas</SelectItem>
                    <SelectItem value="em_curso">Em Curso</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
            <Trophy className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-stone-500">Nenhuma competição encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((comp) => {
              const statusInfo = getStatusInfo(comp.status);
              return (
                <Card key={comp.id} className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className={`${statusInfo.color} border-none`}>
                        {statusInfo.label}
                      </Badge>
                      {userEntries.some(e => e.competition_id === comp.id) && (
                        <Badge className="bg-[#B8956A] text-white border-none">
                          Registado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold text-[#2C3E1F] line-clamp-2">
                      {comp.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-0 flex-grow flex flex-col">
                    <div className="space-y-3 mb-6 text-sm text-stone-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        {format(new Date(comp.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-stone-400" />
                        {comp.modality_name}
                      </div>
                      {comp.grade && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-stone-400" />
                          Grau: {comp.grade}
                        </div>
                      )}
                    </div>

                    {comp.description && (
                      <p className="text-sm text-stone-500 mb-6 line-clamp-3">
                        {comp.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <Link to={createPageUrl('CompetitionDetail') + `?id=${comp.id}`}>
                        <Button className="w-full bg-[#2C3E1F] hover:bg-[#1f2c16] text-white">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
