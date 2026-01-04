import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Shield } from 'lucide-react';

export default function DeveloperLogin() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user.role === 'developer') {
            await base44.entities.AdminLog.create({
              action: 'developer_login',
              admin_email: user.email,
              ip_address: 'web',
              details: 'Developer panel access'
            });
            window.location.href = createPageUrl('DeveloperDashboard');
            return;
          } else {
            setIsAuthorized(false);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('DeveloperLogin'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-cyan-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center">
            <Code className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Developer Access</CardTitle>
          <CardDescription>
            Área de desenvolvimento e manutenção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthorized === false && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              ⚠️ Acesso restrito apenas ao developer
            </div>
          )}
          <Button 
            onClick={handleLogin}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            Developer Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}