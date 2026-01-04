import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Code, Settings, Database, FileText, AlertTriangle,
  LogOut, Shield, Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function DeveloperDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Site em manutenção. Voltaremos em breve!');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('DeveloperLogin');
          return;
        }
        const userData = await base44.auth.me();
        if (userData.role !== 'developer') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(userData);

        // Load maintenance status
        const settings = await base44.entities.SiteSettings.filter({ key: 'maintenance_mode' });
        if (settings.length > 0) {
          setMaintenanceMode(settings[0].value === 'true');
        }
        const msgSettings = await base44.entities.SiteSettings.filter({ key: 'maintenance_message' });
        if (msgSettings.length > 0) {
          setMaintenanceMessage(msgSettings[0].value);
        }
      } catch (e) {
        window.location.href = createPageUrl('DeveloperLogin');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const toggleMaintenance = async () => {
    try {
      const settings = await base44.entities.SiteSettings.filter({ key: 'maintenance_mode' });
      const newValue = !maintenanceMode;
      
      if (settings.length > 0) {
        await base44.entities.SiteSettings.update(settings[0].id, { value: String(newValue) });
      } else {
        await base44.entities.SiteSettings.create({ 
          key: 'maintenance_mode', 
          value: String(newValue),
          category: 'maintenance'
        });
      }
      
      setMaintenanceMode(newValue);
      toast.success(newValue ? 'Modo de manutenção ativado' : 'Modo de manutenção desativado');
    } catch (e) {
      toast.error('Erro ao alterar modo de manutenção');
    }
  };

  const updateMaintenanceMessage = async () => {
    try {
      const settings = await base44.entities.SiteSettings.filter({ key: 'maintenance_message' });
      
      if (settings.length > 0) {
        await base44.entities.SiteSettings.update(settings[0].id, { value: maintenanceMessage });
      } else {
        await base44.entities.SiteSettings.create({ 
          key: 'maintenance_message', 
          value: maintenanceMessage,
          category: 'maintenance'
        });
      }
      
      toast.success('Mensagem atualizada');
    } catch (e) {
      toast.error('Erro ao atualizar mensagem');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!user) return null;

  const devTools = [
    { name: 'Painel Admin Completo', icon: Shield, page: 'AdminDashboard', color: 'from-purple-500 to-purple-600' },
    { name: 'Conteúdo do Site', icon: FileText, page: 'AdminContent', color: 'from-blue-500 to-blue-600' },
    { name: 'Galeria', icon: Database, page: 'AdminGallery', color: 'from-green-500 to-green-600' },
    { name: 'Configurações', icon: Settings, page: 'AdminSettings', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-cyan-500/20 shadow-lg sticky top-0 z-10 backdrop-blur">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">Developer Panel</h1>
              <p className="text-sm text-slate-400">{user.full_name}</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Maintenance Mode */}
          <Card className="bg-slate-800/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <AlertTriangle className="w-5 h-5" />
                Modo de Manutenção
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ativar quando precisar fazer alterações no site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className={`w-5 h-5 ${maintenanceMode ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="font-medium">
                    {maintenanceMode ? 'Site em Manutenção' : 'Site Online'}
                  </span>
                </div>
                <Switch 
                  checked={maintenanceMode}
                  onCheckedChange={toggleMaintenance}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Mensagem de Manutenção</Label>
                <Input
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="bg-slate-900/50 border-cyan-500/20 text-white"
                />
                <Button 
                  onClick={updateMaintenanceMessage}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Atualizar Mensagem
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Developer Tools */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-cyan-400">Ferramentas de Desenvolvimento</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {devTools.map((tool) => (
                <Link key={tool.page} to={createPageUrl(tool.page)}>
                  <Card className="bg-slate-800/50 border-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg text-cyan-400">{tool.name}</CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}