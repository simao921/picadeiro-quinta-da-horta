import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Shield } from 'lucide-react';

export default function DeveloperLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-red-500/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Área Desativada</CardTitle>
          <CardDescription>
            Esta funcionalidade foi removida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            ⚠️ O acesso developer foi desativado
          </div>
          <Button 
            onClick={() => window.location.href = createPageUrl('Home')}
            className="w-full bg-cyan-500 hover:bg-cyan-600"
            size="lg"
          >
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}