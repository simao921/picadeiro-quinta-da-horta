import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, User, Mail, Phone, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function AdminCompetitionEntries() {
  const [selectedTab, setSelectedTab] = useState('pendente');
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['all-competition-entries'],
    queryFn: () => base44.entities.CompetitionEntry.list('-created_date')
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list()
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompetitionEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-competition-entries']);
      toast.success('Inscrição atualizada!');
    }
  });

  const handleApprove = async (entry) => {
    const user = await base44.auth.me();
    updateEntry.mutate({
      id: entry.id,
      data: {
        status: 'aprovada',
        approved_at: new Date().toISOString(),
        approved_by: user.email
      }
    });
  };

  const handleReject = (entry) => {
    if (confirm('Tem certeza que deseja rejeitar esta inscrição?')) {
      updateEntry.mutate({
        id: entry.id,
        data: { status: 'rejeitada' }
      });
    }
  };

  const getCompetitionName = (compId) => {
    const comp = competitions.find(c => c.id === compId);
    return comp?.name || 'Prova desconhecida';
  };

  const filteredEntries = entries.filter(e => e.status === selectedTab);

  const statusCounts = {
    pendente: entries.filter(e => e.status === 'pendente').length,
    aprovada: entries.filter(e => e.status === 'aprovada').length,
    rejeitada: entries.filter(e => e.status === 'rejeitada').length
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Inscrições</h1>
          <p className="text-stone-600 mt-1">Aprovar ou rejeitar inscrições de competições</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendente">
              Pendentes ({statusCounts.pendente})
            </TabsTrigger>
            <TabsTrigger value="aprovada">
              Aprovadas ({statusCounts.aprovada})
            </TabsTrigger>
            <TabsTrigger value="rejeitada">
              Rejeitadas ({statusCounts.rejeitada})
            </TabsTrigger>
          </TabsList>

          {['pendente', 'aprovada', 'rejeitada'].map(status => (
            <TabsContent key={status} value={status}>
              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-stone-500">Nenhuma inscrição {status}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{getCompetitionName(entry.competition_id)}</CardTitle>
                            <p className="text-sm text-stone-600 mt-1">
                              Inscrito em {format(new Date(entry.created_date), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <Badge className={
                            entry.status === 'aprovada' ? 'bg-green-100 text-green-800' :
                            entry.status === 'rejeitada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {entry.status === 'aprovada' ? 'Aprovada' : entry.status === 'rejeitada' ? 'Rejeitada' : 'Pendente'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-stone-500" />
                              <span className="font-medium">{entry.rider_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-stone-500" />
                              <span className="text-sm">{entry.rider_email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-stone-500" />
                              <span className="text-sm">{entry.rider_phone}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm text-stone-600">Cavalo:</span>
                              <p className="font-medium">{entry.horse_name}</p>
                            </div>
                            {entry.grade && (
                              <div>
                                <span className="text-sm text-stone-600">Grau:</span>
                                <p className="font-medium">{entry.grade}</p>
                              </div>
                            )}
                            {entry.federal_number && (
                              <div>
                                <span className="text-sm text-stone-600">Nº Federado:</span>
                                <p className="font-medium">{entry.federal_number}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {entry.notes && (
                          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
                            <p className="text-sm text-stone-700">{entry.notes}</p>
                          </div>
                        )}

                        {entry.proof_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mb-4"
                            onClick={() => window.open(entry.proof_url, '_blank')}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Comprovativo
                          </Button>
                        )}

                        {entry.status === 'pendente' && (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(entry)}
                              disabled={updateEntry.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleReject(entry)}
                              disabled={updateEntry.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        )}

                        {entry.status === 'aprovada' && entry.approved_at && (
                          <div className="text-xs text-stone-500">
                            Aprovada em {format(new Date(entry.approved_at), 'dd/MM/yyyy HH:mm')}
                            {entry.approved_by && ` por ${entry.approved_by}`}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}