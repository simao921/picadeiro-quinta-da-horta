import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Download, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';

export default function AdminCompetitionRankings() {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: results = [] } = useQuery({
    queryKey: ['competition-results'],
    queryFn: () => base44.entities.CompetitionResult.list()
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['entries-for-rankings'],
    queryFn: () => base44.entities.CompetitionEntry.list()
  });

  // Filter competitions by year
  const yearCompetitions = useMemo(() => {
    return competitions.filter(c => {
      const compYear = new Date(c.date).getFullYear();
      return compYear.toString() === selectedYear && c.status === 'concluida';
    });
  }, [competitions, selectedYear]);

  // Get all unique grades
  const allGrades = useMemo(() => {
    const grades = new Set();
    entries.forEach(e => {
      if (e.grade) grades.add(e.grade);
    });
    return Array.from(grades).sort();
  }, [entries]);

  // Calculate rankings
  const rankings = useMemo(() => {
    const riderPoints = {};

    yearCompetitions.forEach(comp => {
      const compResults = results.filter(r => r.competition_id === comp.id);
      const compEntries = entries.filter(e => e.competition_id === comp.id && e.status === 'aprovada');
      
      // Filter by grade if selected
      const filteredEntries = selectedGrade 
        ? compEntries.filter(e => e.grade === selectedGrade)
        : compEntries;

      const totalParticipants = filteredEntries.length;

      compResults.forEach(result => {
        // Check if this rider is in the filtered entries
        const entry = filteredEntries.find(e => e.rider_name === result.rider_name);
        if (!entry) return;

        const position = result.position;
        if (!position || position > totalParticipants) return;

        // Formula: Points = (Number of Participants + 1) - Position
        const points = (totalParticipants + 1) - position;

        if (!riderPoints[result.rider_name]) {
          riderPoints[result.rider_name] = {
            rider_name: result.rider_name,
            grade: entry.grade || 'N/A',
            total_points: 0,
            competitions_count: 0,
            competitions: []
          };
        }

        riderPoints[result.rider_name].total_points += points;
        riderPoints[result.rider_name].competitions_count += 1;
        riderPoints[result.rider_name].competitions.push({
          comp_name: comp.name,
          comp_date: comp.date,
          position: position,
          points: points,
          total_participants: totalParticipants
        });
      });
    });

    return Object.values(riderPoints)
      .sort((a, b) => b.total_points - a.total_points)
      .map((rider, index) => ({ ...rider, rank: index + 1 }));
  }, [yearCompetitions, results, entries, selectedGrade]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(45, 45, 45);
    doc.text('RANKING GERAL', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(184, 149, 106);
    doc.text(`Ano: ${selectedYear}`, 105, 28, { align: 'center' });
    if (selectedGrade) {
      doc.text(`Escalão: ${selectedGrade}`, 105, 35, { align: 'center' });
    }

    let y = 50;
    
    // Headers
    doc.setFillColor(184, 149, 106);
    doc.rect(15, y - 5, 180, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Pos', 20, y);
    doc.text('Cavaleiro', 40, y);
    doc.text('Escalão', 110, y);
    doc.text('Provas', 145, y);
    doc.text('Pontos', 170, y);
    
    y += 10;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(45, 45, 45);
    
    rankings.forEach((rider, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Highlight top 3
      if (rider.rank <= 3) {
        const colors = {
          1: [255, 215, 0],
          2: [192, 192, 192],
          3: [205, 127, 50]
        };
        const color = colors[rider.rank];
        if (color) {
          doc.setFillColor(...color);
          doc.rect(15, y - 5, 180, 7, 'F');
          doc.setFont(undefined, 'bold');
        }
      } else if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y - 5, 180, 7, 'F');
      }
      
      doc.setFontSize(9);
      doc.text(rider.rank.toString(), 20, y);
      doc.text(rider.rider_name.substring(0, 30), 40, y);
      doc.text(rider.grade, 110, y);
      doc.text(rider.competitions_count.toString(), 145, y);
      doc.text(rider.total_points.toString(), 170, y);
      
      doc.setFont(undefined, 'normal');
      y += 7;
    });

    doc.save(`ranking_${selectedYear}${selectedGrade ? `_${selectedGrade}` : ''}.pdf`);
    toast.success('PDF gerado!');
  };

  const generateExcel = () => {
    const data = rankings.map(rider => ({
      'Posição': rider.rank,
      'Cavaleiro': rider.rider_name,
      'Escalão': rider.grade,
      'Nº Provas': rider.competitions_count,
      'Total Pontos': rider.total_points
    }));

    const detailsData = [];
    rankings.forEach(rider => {
      rider.competitions.forEach(comp => {
        detailsData.push({
          'Cavaleiro': rider.rider_name,
          'Competição': comp.comp_name,
          'Data': format(new Date(comp.comp_date), 'dd/MM/yyyy'),
          'Posição': comp.position,
          'Participantes': comp.total_participants,
          'Pontos': comp.points
        });
      });
    });

    const workbook = XLSX.utils.book_new();
    
    const summarySheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ranking');
    
    const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalhes');

    XLSX.writeFile(workbook, `ranking_${selectedYear}${selectedGrade ? `_${selectedGrade}` : ''}.xlsx`);
    toast.success('Excel gerado!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rankings de Competição</h1>
            <p className="text-stone-600 mt-1">Classificação geral por pontos acumulados</p>
          </div>
          <div className="flex gap-2">
            {rankings.length > 0 && (
              <>
                <Button onClick={generatePDF} variant="outline" className="border-red-500 text-red-700">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={generateExcel} variant="outline" className="border-green-500 text-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024, 2023].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalão (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os escalões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos os escalões</SelectItem>
                  {allGrades.map(grade => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {rankings.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#B8956A]" />
                Classificação Geral ({rankings.length} atletas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankings.map((rider) => (
                  <div 
                    key={rider.rider_name}
                    className={`p-4 rounded-lg border-2 ${
                      rider.rank === 1 ? 'bg-yellow-50 border-yellow-400' :
                      rider.rank === 2 ? 'bg-gray-50 border-gray-400' :
                      rider.rank === 3 ? 'bg-orange-50 border-orange-400' :
                      'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          rider.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                          rider.rank === 2 ? 'bg-gray-400 text-gray-900' :
                          rider.rank === 3 ? 'bg-orange-400 text-orange-900' :
                          'bg-[#B8956A] text-white'
                        }`}>
                          {rider.rank === 1 ? '🥇' : rider.rank === 2 ? '🥈' : rider.rank === 3 ? '🥉' : rider.rank}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{rider.rider_name}</p>
                          <p className="text-sm text-stone-600">{rider.grade}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#B8956A]">{rider.total_points} pts</p>
                        <p className="text-sm text-stone-600">{rider.competitions_count} provas</p>
                      </div>
                    </div>
                    
                    {rider.competitions.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-[#B8956A] hover:underline">
                          Ver detalhes das {rider.competitions.length} provas
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                          {rider.competitions
                            .sort((a, b) => new Date(b.comp_date) - new Date(a.comp_date))
                            .map((comp, idx) => (
                            <div key={idx} className="text-sm flex justify-between py-1 border-b border-stone-100">
                              <span>
                                {comp.comp_name} - {format(new Date(comp.comp_date), 'dd/MM/yyyy')}
                              </span>
                              <span className="font-medium">
                                {comp.position}º de {comp.total_participants} = {comp.points} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-600">Nenhum ranking disponível para os filtros selecionados</p>
              <p className="text-sm text-stone-500 mt-2">
                Certifique-se de que existem competições concluídas com resultados para o ano/escalão selecionado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}