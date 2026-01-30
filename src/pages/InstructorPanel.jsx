import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import InstructorLayout from '@/components/instructor/InstructorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstructorPanel() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('instructor_keyboard_access');
    if (!hasAccess) {
      window.location.href = createPageUrl('Home');
    }
  }, []);

  return (
    <InstructorLayout currentPage="InstructorPanel">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            Painel do Instrutor
          </h1>
          <p className="text-stone-600 mt-2">
            Bem-vindo, {user?.full_name || 'Instrutor'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to={createPageUrl('InstructorLessons')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#B8956A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-3 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-xl">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  Aulas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600">
                  Gerir e visualizar todas as aulas agendadas
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('InstructorStudents')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#B8956A]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  Alunos Fixos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600">
                  Ver alunos com horários fixos semanais
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-2 bg-gradient-to-br from-stone-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                Acesso Rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-600">
                Use Ctrl+Shift+8 para aceder rapidamente
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </InstructorLayout>
  );
}