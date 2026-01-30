import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import InstructorLayout from '@/components/instructor/InstructorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Calendar, Phone, Mail, Loader2 } from 'lucide-react';

export default function InstructorStudents() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['instructor-fixed-students'],
    queryFn: async () => {
      const result = await base44.entities.PicadeiroStudent.filter({ 
        student_type: 'fixo',
        is_active: true 
      });
      return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    initialData: []
  });

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDayName = (day) => {
    const days = {
      'monday': 'Segunda',
      'tuesday': 'Terça',
      'wednesday': 'Quarta',
      'thursday': 'Quinta',
      'friday': 'Sexta',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return days[day] || day;
  };

  const getLevelBadge = (level) => {
    const levels = {
      'iniciante': { bg: 'bg-blue-500', text: 'Iniciante' },
      'intermedio': { bg: 'bg-amber-500', text: 'Intermédio' },
      'avancado': { bg: 'bg-green-600', text: 'Avançado' }
    };
    return levels[level] || { bg: 'bg-stone-500', text: level };
  };

  return (
    <InstructorLayout currentPage="InstructorStudents">
      <div className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Alunos Fixos</h1>
            <p className="text-stone-500">Alunos com horários fixos semanais</p>
          </div>
          <Badge className="bg-[#B8956A] text-white px-4 py-2 text-lg">
            <Users className="w-4 h-4 mr-2" />
            {students.length} alunos
          </Badge>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Pesquisar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A] mb-4" />
            <p className="text-stone-500">A carregar alunos...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-stone-300" />
              </div>
              <p className="text-stone-500 font-medium">
                {searchTerm ? 'Nenhum aluno encontrado' : 'Sem alunos fixos registados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStudents.map((student) => {
              const levelBadge = getLevelBadge(student.student_level);
              return (
                <Card key={student.id} className="border-2 hover:shadow-lg transition-all">
                  <CardHeader className="bg-gradient-to-br from-[#B8956A]/10 to-[#8B7355]/10">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#B8956A] text-white flex items-center justify-center font-bold text-lg">
                          {student.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#2C3E1F]">{student.name}</p>
                          <Badge className={`${levelBadge.bg} text-white mt-1`}>
                            {levelBadge.text}
                          </Badge>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      {student.phone && (
                        <div className="flex items-center gap-2 text-stone-600">
                          <Phone className="w-4 h-4 text-[#B8956A]" />
                          {student.phone}
                        </div>
                      )}
                      {student.email && (
                        <div className="flex items-center gap-2 text-stone-600">
                          <Mail className="w-4 h-4 text-[#B8956A]" />
                          {student.email}
                        </div>
                      )}
                    </div>

                    {/* Horse Assignment */}
                    {student.assigned_horse && (
                      <div className="p-3 bg-stone-50 rounded-lg">
                        <p className="text-xs text-stone-500 mb-1">Cavalo Atribuído</p>
                        <p className="font-medium text-[#2C3E1F]">{student.assigned_horse}</p>
                      </div>
                    )}

                    {/* Schedule */}
                    {student.fixed_schedule && student.fixed_schedule.length > 0 && (
                      <div className="pt-4 border-t border-stone-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-[#B8956A]" />
                          <p className="font-semibold text-sm text-[#2C3E1F]">Horário Fixo</p>
                        </div>
                        <div className="space-y-2">
                          {student.fixed_schedule.map((schedule, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-[#4B6382]/10 rounded-lg">
                              <span className="text-sm font-medium text-[#2C3E1F]">
                                {getDayName(schedule.day)}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-[#B8956A] text-white">
                                  {schedule.time}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {schedule.duration}min
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Monthly Fee */}
                    {student.monthly_fee > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                        <p className="text-xs text-green-700 mb-1">Mensalidade</p>
                        <p className="font-bold text-green-800 text-lg">€{student.monthly_fee}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {student.notes && (
                      <div className="pt-4 border-t border-stone-200">
                        <p className="text-xs text-stone-500 mb-1">Notas</p>
                        <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded">{student.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}