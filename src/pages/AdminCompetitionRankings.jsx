import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Award, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import RiderProgressModal from '@/components/admin/RiderProgressModal';

export default function AdminCompetitionRankings() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedRider, setSelectedRider] = useState(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  const { data: results = [] } = useQuery({
    queryKey: ['all-results'],
    queryFn: () => base44.entities.CompetitionResult.list()
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list()
  });

  // Calculate rankings
  const calculateRankings = () => {
    const yearResults = results.filter(r => {
      const comp = competitions.find(c => c.id === r.competition_id);
      return comp && comp.year === parseInt(selectedYear);
    });

    const riderStats = {};

    yearResults.forEach(result => {
      const rider = result.rider_name;
      // Ignora resultados com score 0 (ainda não registados)
      if (result.score === null || result.score === undefined || result.score === 0) {
        return;
      }
      
      if (!riderStats[rider]) {
        riderStats[rider] = {
          rider_name: rider,
          competitions: 0,
          total_score: 0,
          best_score: 0,
          positions: []
        };
      }

      riderStats[rider].competitions += 1;
      riderStats[rider].total_score += result.score;
      riderStats[rider].best_score = Math.max(riderStats[rider].best_score, result.score);
      riderStats[rider].positions.push(result.position);
    });

    // Calculate averages and sort
    return Object.values(riderStats)
      .map(stat => ({
        ...stat,
        average_score: stat.total_score / stat.competitions,
        best_position: Math.min(...stat.positions)
      }))
      .sort((a, b) => b.average_score - a.average_score)
      .map((stat, index) => ({
        ...stat,
        rank: index + 1
      }));
  };

  const rankings = calculateRankings();
  const topPerformers = rankings.slice(0, 10);

  const chartData = topPerformers.map(r => ({
   name: r.rider_name.split(' ')[0], // First name only for chart
   total: r.total_score,
   melhor: r.best_score
  }));

  const years = [...new Set(competitions.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rankings e Estatísticas</h1>
            <p className="text-stone-600 mt-1">Classificação anual de cavaleiros</p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Top 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankings.slice(0, 3).map((rider, index) => (
            <Card key={rider.rider_name} className={`border-2 ${
              index === 0 ? 'border-yellow-400 bg-yellow-50' :
              index === 1 ? 'border-gray-400 bg-gray-50' :
              'border-amber-600 bg-amber-50'
            }`}>
              <CardContent className="pt-6 text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-400 text-gray-900' :
                  'bg-amber-600 text-amber-900'
                }`}>
                  {rider.rank}
                </div>
                <h3 className="text-lg font-bold mb-1">{rider.rider_name}</h3>
                <p className="text-2xl font-bold text-[#B8956A] mb-2">
                  {Math.round(rider.total_score)} pts
                </p>
                <div className="text-sm text-stone-600 space-y-1">
                  <p>{rider.competitions} competições</p>
                  <p>Melhor: {rider.best_score}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#B8956A]" />
                Top 10 Cavaleiros - {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total Pontos" fill="#B8956A" />
                  <Bar dataKey="melhor" name="Melhor Score" fill="#2D2D2D" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Full Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#B8956A]" />
              Classificação Completa - {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <p className="text-center text-stone-500 py-8">Sem resultados para {selectedYear}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Pos.</th>
                      <th className="text-left p-3">Cavaleiro</th>
                      <th className="text-center p-3">Competições</th>
                        <th className="text-center p-3">Total Pontos</th>
                        <th className="text-center p-3">Melhor</th>
                      <th className="text-center p-3">Melhor Pos.</th>
                      <th className="text-center p-3">Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((rider) => (
                      <tr key={rider.rider_name} className="border-b hover:bg-stone-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{rider.rank}</span>
                            {rider.rank <= 3 && (
                              <Award className={`w-5 h-5 ${
                                rider.rank === 1 ? 'text-yellow-500' :
                                rider.rank === 2 ? 'text-gray-400' :
                                'text-amber-600'
                              }`} />
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{rider.rider_name}</td>
                        <td className="p-3 text-center">{rider.competitions}</td>
                        <td className="p-3 text-center font-bold text-[#B8956A]">
                          {Math.round(rider.total_score)} pts
                        </td>
                        <td className="p-3 text-center">{rider.best_score}</td>
                        <td className="p-3 text-center">{rider.best_position}º</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRider(rider);
                              setProgressModalOpen(true);
                            }}
                            className="text-[#B8956A] hover:text-[#8B7355]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Progresso do Atleta */}
        <RiderProgressModal
          rider={selectedRider}
          results={results}
          competitions={competitions}
          isOpen={progressModalOpen}
          onClose={() => setProgressModalOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}