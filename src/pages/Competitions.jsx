import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Trophy, Filter, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import MetaTags from '@/components/seo/MetaTags';

export default function Competitions() {
  const [modalityFilter, setModalityFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: () => base44.entities.CompetitionModality.list()
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <MetaTags
        title="Competições Equestres - Picadeiro Quinta da Horta"
        description="Próximas provas e competições equestres. Inscreva-se e acompanhe os resultados."
        keywords="competições equestres, provas, dressage, working equitation, inscrições"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1A1A1A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy className="w-16 h-16 text-[#B8956A] mb-4" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Competições</h1>
            <p className="text-xl text-stone-300 max-w-3xl">
              Acompanhe as próximas provas equestres e consulte os resultados
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Modalidade</label>
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as modalidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as modalidades</SelectItem>
                    {modalities.map(mod => (
                      <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
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
          </CardContent>
        </Card>

        {/* Competitions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-stone-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-600 text-lg">Nenhuma competição encontrada com os filtros selecionados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((comp, index) => {
              const statusInfo = getStatusInfo(comp.status);
              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300 border-l-4 border-[#B8956A]">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-xl font-serif">{comp.name}</CardTitle>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-stone-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(comp.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          {comp.modality_name}
                        </div>
                        {comp.grade && (
                          <div className="text-xs font-medium text-[#B8956A]">
                            Grau: {comp.grade}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {comp.description && (
                        <p className="text-sm text-stone-600 mb-4 line-clamp-3">{comp.description}</p>
                      )}
                      <Link to={createPageUrl('CompetitionDetail') + `?id=${comp.id}`}>
                        <Button className="w-full bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white">
                          Ver Detalhes
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}