import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch (err) {
      // always show success for security
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-[#2D2D2D]">Recuperar Palavra-passe</h1>
          <p className="text-stone-500 text-sm mt-1">Introduza o seu email para receber um link de recuperação</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                Se o email existir na nossa base de dados, receberá um link de recuperação em breve.
              </p>
            </div>
            <Link to="/login" className="text-[#B8956A] hover:underline text-sm">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="o-seu@email.com"
              />
            </div>
            <Button type="submit" className="w-full bg-[#2D2D2D] hover:bg-[#1A1A1A] h-11" disabled={loading}>
              {loading ? 'A enviar...' : 'Enviar Link de Recuperação'}
            </Button>
            <p className="text-center text-sm text-stone-500">
              <Link to="/login" className="text-[#B8956A] hover:underline">Voltar ao login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}