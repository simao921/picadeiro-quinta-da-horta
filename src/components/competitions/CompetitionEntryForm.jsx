import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { X, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CompetitionEntryForm({ competitionId, competitionName, onClose }) {
  const [formData, setFormData] = useState({
    rider_name: '',
    rider_email: '',
    rider_phone: '',
    horse_name: '',
    nif: '',
    federal_number: '',
    grade: '',
    notes: ''
  });
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const createEntry = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CompetitionEntry.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-entries']);
      setIsSubmitted(true);
      toast.success('Inscrição enviada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar inscrição. Tente novamente.');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let proofUrl = null;
    if (proofFile) {
      try {
        proofUrl = await uploadFile.mutateAsync(proofFile);
      } catch (error) {
        toast.error('Erro ao fazer upload do comprovativo');
        return;
      }
    }

    createEntry.mutate({
      competition_id: competitionId,
      ...formData,
      proof_url: proofUrl,
      status: 'pendente'
    });
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-500 border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-bold text-green-700">Inscrição Enviada!</h3>
            <p className="text-stone-600">
              A sua inscrição foi recebida e está pendente de aprovação.
              Receberá um email de confirmação em breve.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inscrição - {competitionName}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rider_name">Nome do Cavaleiro *</Label>
            <Input
              id="rider_name"
              required
              value={formData.rider_name}
              onChange={(e) => setFormData({ ...formData, rider_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="rider_email">Email *</Label>
            <Input
              id="rider_email"
              type="email"
              required
              value={formData.rider_email}
              onChange={(e) => setFormData({ ...formData, rider_email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="rider_phone">Telefone *</Label>
            <Input
              id="rider_phone"
              required
              value={formData.rider_phone}
              onChange={(e) => setFormData({ ...formData, rider_phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="horse_name">Nome do Cavalo *</Label>
            <Input
              id="horse_name"
              required
              value={formData.horse_name}
              onChange={(e) => setFormData({ ...formData, horse_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nif">NIF</Label>
              <Input
                id="nif"
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="federal_number">Nº Federado</Label>
              <Input
                id="federal_number"
                value={formData.federal_number}
                onChange={(e) => setFormData({ ...formData, federal_number: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="grade">Grau / Escalão</Label>
            <Input
              id="grade"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="proof">Comprovativo (Opcional)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#B8956A] transition-colors">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm text-stone-600">
                    {proofFile ? proofFile.name : 'Clique para selecionar ficheiro'}
                  </p>
                </div>
                <input
                  id="proof"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas / Observações</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] px-3 py-2 border rounded-md"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <Alert>
            <p className="text-sm">
              A sua inscrição ficará pendente de aprovação. Receberá um email de confirmação.
            </p>
          </Alert>

          <Button
            type="submit"
            className="w-full bg-[#B8956A] hover:bg-[#8B7355]"
            disabled={createEntry.isPending || uploadFile.isPending}
          >
            {createEntry.isPending || uploadFile.isPending ? 'A enviar...' : 'Confirmar Inscrição'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}