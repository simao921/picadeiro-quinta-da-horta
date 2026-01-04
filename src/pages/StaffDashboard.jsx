import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, Users, UserCheck, Mail, Bell, Settings, 
  LogOut, Menu, X 
} from 'lucide-react';

export default function StaffDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('StaffLogin');
          return;
        }
        const userData = await base44.auth.me();
        if (userData.role !== 'monitor' && userData.role !== 'owner') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(userData);
      } catch (e) {
        window.location.href = createPageUrl('StaffLogin');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  if (!user) return null;

  const staffPages = [
    { name: 'Aulas', icon: Calendar, page: 'AdminLessons', color: 'from-blue-500 to-blue-600' },
    { name: 'Alunos Picadeiro', icon: Users, page: 'AdminPicadeiroStudents', color: 'from-green-500 to-green-600' },
    { name: 'Alunos Fixos', icon: UserCheck, page: 'AdminStudentSchedules', color: 'from-purple-500 to-purple-600' },
    { name: 'Emails', icon: Mail, page: 'AdminEmails', color: 'from-orange-500 to-orange-600' },
    { name: 'Notificações', icon: Bell, page: 'AdminNotifications', color: 'from-red-500 to-red-600' },
    { name: 'Definições', icon: Settings, page: 'AdminSettings', color: 'from-gray-500 to-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-stone-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#4A5D23]">Painel Staff</h1>
              <p className="text-sm text-stone-600">
                {user.role === 'owner' ? 'Proprietário' : 'Monitor'} • {user.full_name}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staffPages.map((item) => (
              <Link key={item.page} to={createPageUrl(item.page)}>
                <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-stone-600">
                      Gerir {item.name.toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {user.role === 'owner' && (
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                🏆 Acesso de Proprietário
              </h3>
              <p className="text-amber-800 mb-4">
                Como proprietário, você tem acesso completo ao painel administrativo.
              </p>
              <Link to={createPageUrl('AdminDashboard')}>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Abrir Painel Completo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}