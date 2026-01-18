import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se chegou pelo atalho de teclado
    const keyboardAccess = sessionStorage.getItem('admin_keyboard_access');
    if (!keyboardAccess) {
      window.location.href = createPageUrl('Home');
      return;
    }

    const checkAuth = async () => {
      sessionStorage.removeItem('admin_keyboard_access');
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user.role === 'admin') {
            // Log admin access
            await base44.entities.AdminLog.create({
              action: 'login',
              admin_email: user.email,
              ip_address: 'N/A',
              details: 'Admin login successful',
              success: true
            });
            window.location.href = createPageUrl('AdminDashboard');
            return;
          }
        }
        setIsAuthenticated(false);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('AdminLogin'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2C3E1F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A961]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C3E1F] to-[#1A2912] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-[#4A5D23] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#C9A961]" />
            </div>
            <CardTitle className="font-serif text-2xl text-[#2C3E1F]">
              Área de Administração
            </CardTitle>
            <p className="text-stone-500 text-sm mt-2">
              Picadeiro Quinta da Horta
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Acesso restrito a administradores. Todas as tentativas de acesso são registadas.
                </p>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B] h-12"
            >
              <Shield className="w-5 h-5 mr-2" />
              Entrar como Administrador
            </Button>

            <p className="text-center text-xs text-stone-400">
              Atalho rápido: CTRL + SHIFT + 6
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}