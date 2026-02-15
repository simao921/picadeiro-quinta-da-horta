import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award } from 'lucide-react';

export default function RiderProgressModal({ rider, results, competitions, isOpen, onClose }) {
  if (!rider || !results || !competitions) return null;

  // Filtra resultados do atleta
  const riderResults = results
    .filter(r => r.rider_name === rider.rider_name)
    .sort((a, b) => {
      const compA = competitions.find(c => c.id === a.competition_id);
      const compB = competitions.find(c => c.id === b.competition_id);
      return new Date(compA?.date || 0) - new Date(compB?.date || 0);
    })
    .map(r => ({
      ...r,
      competition: competitions.find(c => c.id === r.competition_id),
      date: competitions.find(c => c.id === r.competition_id)?.date
    }));

  // Dados para gráfico de evolução (linha)
  const chartData = riderResults.map((r, idx) => ({
    name: r.competition?.name || `Comp ${idx + 1}`,
    data: new Date(r.date),
    pontuação: r.score || 0,
    percentagem: r.percentage || 0,
    posição: r.position || '-'
  })).sort((a, b) => a.data - b.data);

  // Estatísticas
  const stats = {
    total_competitions: riderResults.length,
    average_score: riderResults.length > 0 
      ? (riderResults.reduce((sum, r) => sum + (r.score || 0), 0) / riderResults.length).toFixed(2)
      : 0,
    best_score: riderResults.length > 0 
      ? Math.max(...riderResults.map(r => r.score || 0))
      : 0,
    best_position: riderResults.length > 0 
      ? Math.min(...riderResults.map(r => r.position || 999))
      : '-'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{rider.rider_name} - Progresso e Histórico</DialogTitle>
        </DialogHeader>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">Competições</p>
                <p className="text-2xl font-bold text-[#B8956A]">{stats.total_competitions}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">Média</p>
                <p className="text-2xl font-bold text-[#B8956A]">{stats.average_score}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">Melhor Marca</p>
                <p className="text-2xl font-bold text-[#2D2D2D]">{stats.best_score}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">Melhor Pos.</p>
                <p className="text-2xl font-bold text-[#4A5D23]">{stats.best_position}º</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Evolução de Pontuação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    formatter={(value) => value.toFixed(2)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pontuação" 
                    stroke="#B8956A" 
                    dot={{ fill: '#B8956A', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Histórico Detalhado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Histórico de Competições
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riderResults.length === 0 ? (
              <p className="text-center text-stone-500 py-4">Sem competições registadas</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {riderResults.map((result, idx) => (
                  <div 
                    key={idx}
                    className="p-3 border rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-sm">{result.competition?.name || 'Competição'}</h4>
                      <span className="text-xs text-stone-500">
                        {result.date ? new Date(result.date).toLocaleDateString('pt-PT') : '-'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-stone-600">Pontuação: </span>
                        <span className="font-semibold text-[#B8956A]">{result.score || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-600">Percentagem: </span>
                        <span className="font-semibold">{result.percentage || '-'}%</span>
                      </div>
                      <div>
                        <span className="text-stone-600">Posição: </span>
                        <span className="font-semibold">{result.position || '-'}º</span>
                      </div>
                      <div>
                        <span className="text-stone-600">Cavalo: </span>
                        <span className="font-semibold">{result.horse_name || '-'}</span>
                      </div>
                    </div>
                    {result.notes && (
                      <p className="text-xs text-stone-600 mt-2 italic">{result.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}