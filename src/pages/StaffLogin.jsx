import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users } from 'lucide-react';

export default function StaffLogin() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user.role === 'monitor' || user.role === 'owner') {
            await base44.entities.AdminLog.create({
              action: 'staff_login',
              admin_email: user.email,
              ip_address: 'web',
              details: `Staff access: ${user.role}`
            });
            window.location.href = createPageUrl('StaffDashboard');
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
    base44.auth.redirectToLogin(createPageUrl('StaffLogin'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#4A5D23] rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Staff</CardTitle>
          <CardDescription>
            Área reservada para monitores e proprietário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthorized === false && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              ⚠️ Acesso restrito a staff autorizado
            </div>
          )}
          <Button 
            onClick={handleLogin}
            className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            Iniciar Sessão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}