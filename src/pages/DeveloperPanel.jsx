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
  FileCode, Eye, EyeOff, Lock, Unlock, Wrench
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
          // Auto-login para anuariosimao7@gmail.com
          if (userData.email === 'anuariosimao7@gmail.com') {
            console.log('Auto-login para anuariosimao7@gmail.com');
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
              {user?.role === 'admin' ? 'Admin detectado' : 'Requer acesso de admin'}
            </div>
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
          <TabsList className="bg-stone-800 border border-stone-700">
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Manutenção
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Code className="w-4 h-4 mr-2" />
              Editor de Código
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />
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