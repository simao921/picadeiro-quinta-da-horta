import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Code, Settings, AlertTriangle, Play, Database, 
  FileCode, Lock, Unlock, Wrench, Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function DeveloperPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Code Editor
  const [code, setCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [executing, setExecuting] = useState(false);

  // Site Settings
  const [siteSettings, setSiteSettings] = useState({});
  const [editingKey, setEditingKey] = useState('');
  const [editingValue, setEditingValue] = useState('');

  // Database Tools
  const [selectedEntity, setSelectedEntity] = useState('User');
  const [queryFilter, setQueryFilter] = useState('{}');
  const [queryResults, setQueryResults] = useState(null);
  const [bulkDeleteEntity, setBulkDeleteEntity] = useState('');
  const [bulkDeleteFilter, setBulkDeleteFilter] = useState('{}');

  // User Management
  const [userEmail, setUserEmail] = useState('');
  const [userAction, setUserAction] = useState('promote');

  // System Stats
  const [systemStats, setSystemStats] = useState(null);

  const entities = ['User', 'Service', 'Lesson', 'Booking', 'Payment', 'Horse', 'Instructor', 
                    'PicadeiroStudent', 'BlockedSlot', 'Order', 'Product', 'GalleryImage', 
                    'ContactMessage', 'Review', 'SiteSettings'];

  useEffect(() => {
    // Verificar se chegou pelo atalho de teclado OU tem acesso concedido
    const keyboardAccess = sessionStorage.getItem('dev_keyboard_access');
    const grantedAccess = localStorage.getItem('dev_panel_access');
    
    if (!keyboardAccess && grantedAccess !== 'granted') {
      window.location.href = createPageUrl('Home');
      return;
    }
    
    checkAuth();
    loadSettings();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        
        if (userData.role === 'admin') {
          // Auto-login para januariosimao7@gmail.com
          if (userData.email === 'januariosimao7@gmail.com') {
            console.log('Auto-login para januariosimao7@gmail.com');
            localStorage.setItem('dev_panel_access', 'granted');
            setIsAuthenticated(true);
            return; // Importante: retornar aqui
          }
          
          // Para outros admins, verificar se já tem acesso concedido
          const devAccess = localStorage.getItem('dev_panel_access');
          if (devAccess === 'granted') {
            setIsAuthenticated(true);
          }
        } else {
          // Não é admin, redirecionar
          window.location.href = createPageUrl('Home');
        }
      }
    } catch (e) {
      console.error('Auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.SiteSettings.list();
      const settingsObj = {};
      settings.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      setSiteSettings(settingsObj);
      setMaintenanceMode(settingsObj.maintenance_mode === 'true');
      setMaintenanceMessage(settingsObj.maintenance_message || 'Site em manutenção. Voltamos em breve!');
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const handleLogin = async () => {
    // Senha de desenvolvedor
    if (password === 'DevSimão26!') {
      if (!user || user.role !== 'admin') {
        toast.error('Apenas admins podem aceder ao painel de desenvolvedor!');
        return;
      }
      localStorage.setItem('dev_panel_access', 'granted');
      sessionStorage.removeItem('dev_keyboard_access');
      setIsAuthenticated(true);
      toast.success('Acesso de desenvolvedor concedido!');
    } else {
      toast.error('Senha incorreta!');
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const newMode = !maintenanceMode;
      
      // Atualizar ou criar configuração
      const existing = await base44.entities.SiteSettings.filter({ key: 'maintenance_mode' });
      if (existing.length > 0) {
        await base44.entities.SiteSettings.update(existing[0].id, {
          value: String(newMode),
          category: 'maintenance'
        });
      } else {
        await base44.entities.SiteSettings.create({
          key: 'maintenance_mode',
          value: String(newMode),
          category: 'maintenance'
        });
      }

      // Atualizar mensagem
      const existingMsg = await base44.entities.SiteSettings.filter({ key: 'maintenance_message' });
      if (existingMsg.length > 0) {
        await base44.entities.SiteSettings.update(existingMsg[0].id, {
          value: maintenanceMessage,
          category: 'maintenance'
        });
      } else {
        await base44.entities.SiteSettings.create({
          key: 'maintenance_message',
          value: maintenanceMessage,
          category: 'maintenance'
        });
      }

      setMaintenanceMode(newMode);
      toast.success(`Modo de manutenção ${newMode ? 'ativado' : 'desativado'}!`);
      
      // Recarregar página após 1 segundo
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      toast.error('Erro ao alterar modo de manutenção: ' + e.message);
    }
  };

  const executeCode = async () => {
    setExecuting(true);
    setCodeOutput('Executando...\n');
    
    try {
      // Criar um contexto seguro para executar código
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const func = new AsyncFunction('base44', 'toast', code);
      
      const result = await func(base44, toast);
      setCodeOutput('✅ Executado com sucesso!\n\nResultado:\n' + JSON.stringify(result, null, 2));
      toast.success('Código executado!');
    } catch (e) {
      setCodeOutput('❌ Erro:\n' + e.message);
      toast.error('Erro na execução!');
      } finally {
      setExecuting(false);
      }
      };

      const executeQuery = async () => {
      try {
      let filter = {};
      try {
        filter = JSON.parse(queryFilter);
      } catch (e) {
        toast.error('JSON inválido no filtro!');
        return;
      }

      const results = await base44.entities[selectedEntity].filter(filter);
      setQueryResults(results);
      toast.success(`Encontrados ${results.length} registros!`);
      } catch (e) {
      toast.error('Erro na query: ' + e.message);
      setQueryResults({ error: e.message });
      }
      };

      const bulkDeleteRecords = async () => {
      if (!confirm(`Tem certeza que deseja deletar registros de ${bulkDeleteEntity}? Esta ação é IRREVERSÍVEL!`)) {
      return;
      }

      try {
      let filter = {};
      try {
        filter = JSON.parse(bulkDeleteFilter);
      } catch (e) {
        toast.error('JSON inválido no filtro!');
        return;
      }

      toast.loading('Deletando registros...');
      const records = await base44.entities[bulkDeleteEntity].filter(filter);

      for (const record of records) {
        await base44.entities[bulkDeleteEntity].delete(record.id);
      }

      toast.dismiss();
      toast.success(`${records.length} registros deletados!`);
      setBulkDeleteEntity('');
      setBulkDeleteFilter('{}');
      } catch (e) {
      toast.dismiss();
      toast.error('Erro ao deletar: ' + e.message);
      }
      };

      const manageUser = async () => {
      try {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) {
        toast.error('Usuário não encontrado!');
        return;
      }

      const user = users[0];

      if (userAction === 'promote') {
        await base44.entities.User.update(user.id, { role: 'admin' });
        toast.success('Usuário promovido a admin!');
      } else if (userAction === 'demote') {
        await base44.entities.User.update(user.id, { role: 'user' });
        toast.success('Usuário rebaixado a user!');
      } else if (userAction === 'delete') {
        if (!confirm(`Deletar usuário ${userEmail}? IRREVERSÍVEL!`)) return;
        await base44.entities.User.delete(user.id);
        toast.success('Usuário deletado!');
      }

      setUserEmail('');
      } catch (e) {
      toast.error('Erro: ' + e.message);
      }
      };

      const loadSystemStats = async () => {
      try {
      toast.loading('Carregando estatísticas...');

      const [users, bookings, lessons, payments, orders, services] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Booking.list(),
        base44.entities.Lesson.list(),
        base44.entities.Payment.list(),
        base44.entities.Order.list(),
        base44.entities.Service.list()
      ]);

      setSystemStats({
        totalUsers: users.length,
        totalAdmins: users.filter(u => u.role === 'admin').length,
        totalBookings: bookings.length,
        approvedBookings: bookings.filter(b => b.status === 'approved').length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        totalLessons: lessons.length,
        autoGeneratedLessons: lessons.filter(l => l.is_auto_generated).length,
        totalPayments: payments.length,
        paidPayments: payments.filter(p => p.status === 'paid').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.total || 0), 0),
        totalOrders: orders.length,
        totalServices: services.length
      });

      toast.dismiss();
      toast.success('Estatísticas carregadas!');
      } catch (e) {
      toast.dismiss();
      toast.error('Erro ao carregar: ' + e.message);
      }
      };

      const clearTestData = async () => {
      if (!confirm('Deletar TODOS os dados de teste? Esta ação é IRREVERSÍVEL!')) return;
      if (!confirm('Tem CERTEZA ABSOLUTA? Vai deletar bookings, lessons e payments pendentes!')) return;

      try {
      toast.loading('Limpando dados de teste...');

      // Deletar bookings pendentes
      const pendingBookings = await base44.entities.Booking.filter({ status: 'pending' });
      for (const b of pendingBookings) {
        await base44.entities.Booking.delete(b.id);
      }

      // Deletar lessons auto-geradas sem bookings
      const lessons = await base44.entities.Lesson.filter({ is_auto_generated: true });
      for (const l of lessons) {
        const bookings = await base44.entities.Booking.filter({ lesson_id: l.id });
        if (bookings.length === 0) {
          await base44.entities.Lesson.delete(l.id);
        }
      }

      toast.dismiss();
      toast.success('Dados de teste limpos!');
      } catch (e) {
      toast.dismiss();
      toast.error('Erro: ' + e.message);
      }
      };

  const updateSiteSetting = async () => {
    if (!editingKey || !editingValue) {
      toast.error('Preencha a chave e o valor!');
      return;
    }

    try {
      const existing = await base44.entities.SiteSettings.filter({ key: editingKey });
      if (existing.length > 0) {
        await base44.entities.SiteSettings.update(existing[0].id, {
          value: editingValue,
          category: 'general'
        });
      } else {
        await base44.entities.SiteSettings.create({
          key: editingKey,
          value: editingValue,
          category: 'general'
        });
      }
      
      toast.success('Configuração atualizada!');
      loadSettings();
      setEditingKey('');
      setEditingValue('');
    } catch (e) {
      toast.error('Erro ao atualizar: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-500/20 bg-stone-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-mono text-green-500">Developer Panel</CardTitle>
            <p className="text-stone-400 text-sm">Acesso restrito a desenvolvedores</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400 text-center">
                    Por favor, faça login com uma conta de admin
                  </p>
                </div>
                <Button 
                  type="button"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('DeveloperPanel'))}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Login com Google
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dev-password" className="text-stone-300">Senha de Desenvolvedor</Label>
                  <Input
                    id="dev-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Digite a senha"
                    className="bg-stone-900 border-stone-700 text-white font-mono"
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
                <div className="text-xs text-stone-500 text-center">
                  Logado como: {user.email}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mono text-green-500 flex items-center gap-3">
              <Wrench className="w-8 h-8" />
              Developer Panel
            </h1>
            <p className="text-stone-400 mt-1">Controle total do sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-500 border-green-500">
              {user?.email}
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('dev_panel_access');
                window.location.href = createPageUrl('Home');
              }}
              className="border-red-500 text-red-500 hover:bg-red-500/10"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Maintenance Mode Alert */}
        {maintenanceMode && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-500">Site em Modo de Manutenção</h3>
                <p className="text-sm text-stone-400">Os utilizadores não conseguem aceder ao site</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="maintenance" className="space-y-6">
          <TabsList className="bg-stone-800 border border-stone-700 flex-wrap h-auto">
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Manutenção
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Code className="w-4 h-4 mr-2" />
              Código
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Wrench className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card className="border-stone-700 bg-stone-800/50">
              <CardHeader>
                <CardTitle className="text-green-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Modo de Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-stone-900/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">Status do Site</h3>
                    <p className="text-sm text-stone-400">
                      {maintenanceMode ? 'Site offline para manutenção' : 'Site online e operacional'}
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={() => {}}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-msg" className="text-stone-300">Mensagem de Manutenção</Label>
                  <Textarea
                    id="maintenance-msg"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Digite a mensagem a mostrar aos utilizadores..."
                    className="bg-stone-900 border-stone-700 text-white min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={toggleMaintenanceMode}
                  className={`w-full ${maintenanceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  {maintenanceMode ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {maintenanceMode ? 'Ativar Site' : 'Colocar em Manutenção'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Editor Tab */}
          <TabsContent value="code">
            <Card className="border-stone-700 bg-stone-800/50">
              <CardHeader>
                <CardTitle className="text-green-500 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Console JavaScript
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-stone-300">Código (JavaScript Async)</Label>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Exemplo: criar dados
const users = await base44.entities.User.list();
toast.success('Total: ' + users.length);
return users;"
                    className="bg-stone-900 border-stone-700 text-green-400 font-mono min-h-[200px]"
                  />
                  <p className="text-xs text-stone-500">
                    Disponível: base44, toast. Exemplo: await base44.entities.Service.list()
                  </p>
                </div>

                <Button
                  onClick={executeCode}
                  disabled={executing || !code}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {executing ? 'Executando...' : 'Executar Código'}
                </Button>

                {codeOutput && (
                  <div className="space-y-2">
                    <Label className="text-stone-300">Output</Label>
                    <pre className="bg-stone-900 border border-stone-700 rounded-lg p-4 text-green-400 text-xs font-mono overflow-auto max-h-[300px]">
                      {codeOutput}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Query Builder */}
              <Card className="border-stone-700 bg-stone-800/50">
                <CardHeader>
                  <CardTitle className="text-green-500 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Query Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-stone-300">Entidade</Label>
                    <select
                      value={selectedEntity}
                      onChange={(e) => setSelectedEntity(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg p-2"
                    >
                      {entities.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-stone-300">Filtro (JSON)</Label>
                    <Textarea
                      value={queryFilter}
                      onChange={(e) => setQueryFilter(e.target.value)}
                      placeholder='{"status": "pending"}'
                      className="bg-stone-900 border-stone-700 text-green-400 font-mono"
                    />
                    <p className="text-xs text-stone-500">
                      Exemplos: {'{}'} (tudo), {`{"status": "pending"}`}, {`{"role": "admin"}`}
                    </p>
                  </div>

                  <Button
                    onClick={executeQuery}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Executar Query
                  </Button>

                  {queryResults && (
                    <div className="space-y-2">
                      <Label className="text-stone-300">Resultados</Label>
                      <pre className="bg-stone-900 border border-stone-700 rounded-lg p-4 text-green-400 text-xs font-mono overflow-auto max-h-[400px]">
                        {JSON.stringify(queryResults, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bulk Delete */}
              <Card className="border-red-700 bg-stone-800/50">
                <CardHeader>
                  <CardTitle className="text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Deletar em Massa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">
                      ⚠️ PERIGO: Esta ação é IRREVERSÍVEL!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-stone-300">Entidade</Label>
                    <select
                      value={bulkDeleteEntity}
                      onChange={(e) => setBulkDeleteEntity(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg p-2"
                    >
                      <option value="">Selecione...</option>
                      {entities.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-stone-300">Filtro (JSON)</Label>
                    <Textarea
                      value={bulkDeleteFilter}
                      onChange={(e) => setBulkDeleteFilter(e.target.value)}
                      placeholder='{"status": "test"}'
                      className="bg-stone-900 border-stone-700 text-red-400 font-mono"
                    />
                  </div>

                  <Button
                    onClick={bulkDeleteRecords}
                    disabled={!bulkDeleteEntity}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Deletar Registros
                  </Button>

                  <Button
                    onClick={clearTestData}
                    variant="outline"
                    className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                  >
                    Limpar Dados de Teste
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-stone-700 bg-stone-800/50">
              <CardHeader>
                <CardTitle className="text-green-500 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestão de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-stone-300">Email do Usuário</Label>
                    <Input
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="bg-stone-900 border-stone-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-stone-300">Ação</Label>
                    <select
                      value={userAction}
                      onChange={(e) => setUserAction(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg p-2"
                    >
                      <option value="promote">Promover a Admin</option>
                      <option value="demote">Rebaixar a User</option>
                      <option value="delete">Deletar Usuário</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={manageUser}
                  disabled={!userEmail}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Executar Ação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <Card className="border-stone-700 bg-stone-800/50">
              <CardHeader>
                <CardTitle className="text-green-500 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Estatísticas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={loadSystemStats}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Carregar Estatísticas
                </Button>

                {systemStats && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Total Usuários</p>
                      <p className="text-2xl font-bold text-white">{systemStats.totalUsers}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Admins</p>
                      <p className="text-2xl font-bold text-green-500">{systemStats.totalAdmins}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Total Reservas</p>
                      <p className="text-2xl font-bold text-white">{systemStats.totalBookings}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Aprovadas</p>
                      <p className="text-2xl font-bold text-green-500">{systemStats.approvedBookings}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-500">{systemStats.pendingBookings}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Total Aulas</p>
                      <p className="text-2xl font-bold text-white">{systemStats.totalLessons}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Auto-Geradas</p>
                      <p className="text-2xl font-bold text-blue-500">{systemStats.autoGeneratedLessons}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Pagamentos</p>
                      <p className="text-2xl font-bold text-white">{systemStats.totalPayments}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Pagos</p>
                      <p className="text-2xl font-bold text-green-500">{systemStats.paidPayments}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Receita Total</p>
                      <p className="text-2xl font-bold text-green-500">{systemStats.totalRevenue}€</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Encomendas</p>
                      <p className="text-2xl font-bold text-white">{systemStats.totalOrders}</p>
                    </div>
                    <div className="p-4 bg-stone-900/50 rounded-lg border border-stone-700">
                      <p className="text-xs text-stone-400">Serviços</p>
                      <p className="text-2xl font-bold text-white">{systemStats.totalServices}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-stone-700 bg-stone-800/50">
              <CardHeader>
                <CardTitle className="text-green-500 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Configurações do Site
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-stone-300">Chave</Label>
                      <Input
                        value={editingKey}
                        onChange={(e) => setEditingKey(e.target.value)}
                        placeholder="ex: site_title"
                        className="bg-stone-900 border-stone-700 text-white font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-stone-300">Valor</Label>
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        placeholder="ex: Meu Site"
                        className="bg-stone-900 border-stone-700 text-white"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={updateSiteSetting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Adicionar/Atualizar Configuração
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Configurações Atuais</h3>
                  <div className="space-y-2 max-h-[400px] overflow-auto">
                    {Object.entries(siteSettings).map(([key, value]) => (
                      <div key={key} className="p-3 bg-stone-900/50 rounded-lg border border-stone-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-green-400 text-sm">{key}</p>
                            <p className="text-stone-400 text-xs mt-1">{value}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingKey(key);
                              setEditingValue(value);
                            }}
                            className="border-stone-600 text-stone-400 hover:bg-stone-800"
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}