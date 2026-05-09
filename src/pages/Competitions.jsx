import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trophy, Filter, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import MetaTags from '@/components/seo/MetaTags';
import { useAuth } from '@/lib/AuthContext';

export default function Competitions() {
  const [modalityFilter, setModalityFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

    queryFn: () => base44.entities.CompetitionModality.list()
  });

  const { data: userEntries = [] } = useQuery({
    queryKey: ['my-entries', user?.email],
    queryFn: () => base44.entities.CompetitionEntry.filter({ rider_email: user.email }),
    enabled: !!user?.email
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

      {/* Cinematic Hero Section */}
      <section className="relative h-[50vh] flex items-center overflow-hidden bg-[#11180D]">
        <div className="absolute inset-0 z-0">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            className="w-full h-full"
          >
            <img
              src="https://images.unsplash.com/photo-1598974357851-98166a9399ff?w=1600&q=80"
              alt="Competições"
              className="w-full h-full object-cover opacity-30"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-3 px-6 py-2 bg-[#B8956A]/20 backdrop-blur-md rounded-full text-[#B8956A] text-xs font-black uppercase tracking-[0.4em] mb-8">
              <Trophy className="w-4 h-4" />
              Elite Competitiva
            </span>
            <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-tight mb-8">
              Grandes<br />
              <span className="text-[#B8956A] italic">Competições</span>
            </h1>
            <p className="text-xl text-stone-300 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
              Acompanhe as provas de maior prestígio e os resultados da nossa equipa.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to={createPageUrl('ClientDashboard')}>
                <Button className="h-16 px-10 rounded-2xl bg-white text-[#11180D] hover:bg-[#B8956A] hover:text-white font-black uppercase tracking-widest text-xs transition-all duration-500 shadow-2xl">
                  Minhas Inscrições
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* Advanced Filters */}
        <div className="mb-20">
          <div className="premium-card bg-white p-10 border border-stone-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-stone-50">
              <div className="w-12 h-12 bg-[#2C3E1F] rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-serif font-black text-[#2C3E1F]">Refinar Provas</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Modalidade</label>
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                  <SelectTrigger className="h-14 rounded-xl border-stone-100 bg-stone-50/50 font-bold text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-100 shadow-2xl">
                    <SelectItem value="all" className="font-bold py-3">Todas as modalidades</SelectItem>
                    {modalities.map(mod => (
                      <SelectItem key={mod.id} value={mod.name} className="font-bold py-3">{mod.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="h-14 rounded-xl border-stone-100 bg-stone-50/50 font-bold text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-100 shadow-2xl">
                    <SelectItem value="all" className="font-bold py-3">Todos os anos</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()} className="font-bold py-3">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-14 rounded-xl border-stone-100 bg-stone-50/50 font-bold text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-stone-100 shadow-2xl">
                    <SelectItem value="all" className="font-bold py-3">Todos os estados</SelectItem>
                    <SelectItem value="inscricoes_abertas" className="font-bold py-3">Inscrições Abertas</SelectItem>
                    <SelectItem value="inscricoes_encerradas" className="font-bold py-3">Inscrições Encerradas</SelectItem>
                    <SelectItem value="em_curso" className="font-bold py-3">Em Curso</SelectItem>
                    <SelectItem value="concluida" className="font-bold py-3">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-stone-50 animate-pulse" />
            ))}
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="text-center py-32 bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-100">
            <Trophy className="w-20 h-20 text-stone-200 mx-auto mb-6" />
            <p className="text-xl font-serif font-black text-stone-400">Sem resultados para os filtros aplicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredCompetitions.map((comp, index) => {
              const statusInfo = getStatusInfo(comp.status);
              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="premium-card bg-white border-white hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 h-full flex flex-col group">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <Badge className={`${statusInfo.color} border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest`}>
                          {statusInfo.label}
                        </Badge>
                        {userEntries.some(e => e.competition_id === comp.id) && (
                          <Badge className="bg-[#B8956A] text-white border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            Registado
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-serif text-3xl font-black text-[#2C3E1F] leading-tight group-hover:text-[#B8956A] transition-colors duration-500">
                        {comp.name}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-8 pt-0 flex-grow flex flex-col">
                      <div className="space-y-4 mb-8 text-sm font-bold text-stone-500">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-[#B8956A]" />
                          </div>
                          {format(new Date(comp.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-[#B8956A]" />
                          </div>
                          {comp.modality_name}
                        </div>
                        {comp.grade && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center">
                              <Trophy className="w-4 h-4 text-[#B8956A]" />
                            </div>
                            Grau: {comp.grade}
                          </div>
                        )}
                      </div>

                      {comp.description && (
                        <p className="text-sm text-stone-400 font-medium mb-10 line-clamp-3 leading-relaxed">
                          {comp.description}
                        </p>
                      )}

                      <div className="mt-auto">
                        <Link to={createPageUrl('CompetitionDetail') + `?id=${comp.id}`}>
                          <Button className="w-full bg-[#11180D] hover:bg-[#B8956A] text-white h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500 group-hover:scale-[1.02]">
                            Ver Detalhes
                            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
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