import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, CheckCircle, XCircle, Download, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function AdminFinancialReport() {
  const [selectedCompetition, setSelectedCompetition] = useState('');

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: allEntries = [] } = useQuery({
    queryKey: ['entries-financial'],
    queryFn: () => base44.entities.CompetitionEntry.list()
  });

  const selectedComp = competitions.find(c => c.id === selectedCompetition);
  const entries = selectedCompetition 
    ? allEntries.filter(e => e.competition_id === selectedCompetition && e.status === 'aprovada')
    : [];

  const entryFee = selectedComp?.entry_fee || 0;
  const totalParticipants = entries.length;
  const paidCount = entries.filter(e => e.paid).length;
  const unpaidCount = entries.filter(e => !e.paid).length;
  const presentCount = entries.filter(e => !e.absent).length;
  const absentCount = entries.filter(e => e.absent).length;
  
  const totalCollected = paidCount * entryFee;
  const totalPending = unpaidCount * entryFee;
  const totalExpected = totalParticipants * entryFee;

  const generatePDF = () => {
    if (!selectedComp) {
      toast.error('Selecione uma competição');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(45, 45, 45);
    doc.text('RELATÓRIO FINANCEIRO', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(184, 149, 106);
    doc.text(selectedComp.name, 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${format(new Date(selectedComp.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}`, 105, 35, { align: 'center' });

    // Summary box
    let y = 50;
    doc.setDrawColor(184, 149, 106);
    doc.setLineWidth(0.5);
    doc.rect(15, y - 5, 180, 50);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(45, 45, 45);
    doc.text('RESUMO FINANCEIRO', 20, y);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    y += 8;
    
    doc.text(`Valor por Inscrição: €${entryFee.toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Total de Participantes: ${totalParticipants}`, 20, y);
    y += 7;
    doc.text(`Pagamentos Recebidos: ${paidCount}`, 20, y);
    y += 7;
    doc.text(`Pagamentos Pendentes: ${unpaidCount}`, 20, y);
    
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(34, 139, 34);
    doc.text(`Total Arrecadado: €${totalCollected.toFixed(2)}`, 20, y);
    y += 7;
    doc.setTextColor(220, 38, 38);
    doc.text(`Total em Falta: €${totalPending.toFixed(2)}`, 20, y);
    y += 7;
    doc.setTextColor(45, 45, 45);
    doc.text(`Total Esperado: €${totalExpected.toFixed(2)}`, 20, y);

    // Participants table
    y += 15;
    doc.setFontSize(12);
    doc.text('DETALHAMENTO POR PARTICIPANTE', 20, y);
    
    y += 8;
    doc.setFillColor(184, 149, 106);
    doc.rect(15, y - 5, 180, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Cavaleiro', 20, y);
    doc.text('Cavalo', 90, y);
    doc.text('Pagamento', 140, y);
    doc.text('Presença', 170, y);
    
    y += 8;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(45, 45, 45);
    
    entries.forEach((entry, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y - 5, 180, 6, 'F');
      }
      
      doc.text(entry.rider_name.substring(0, 30), 20, y);
      doc.text(entry.horse_name.substring(0, 25), 90, y);
      
      doc.setTextColor(entry.paid ? 34 : 220, entry.paid ? 139 : 38, entry.paid ? 34 : 38);
      doc.text(entry.paid ? 'Pago' : 'Pendente', 140, y);
      
      doc.setTextColor(entry.absent ? 220 : 34, entry.absent ? 38 : 139, entry.absent ? 38 : 34);
      doc.text(entry.absent ? 'Ausente' : 'Presente', 170, y);
      
      doc.setTextColor(45, 45, 45);
      y += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 285, { align: 'center' });

    doc.save(`relatorio_financeiro_${selectedComp.name.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF gerado!');
  };

  const generateExcel = () => {
    if (!selectedComp) {
      toast.error('Selecione uma competição');
      return;
    }

    const summaryData = [
      { Campo: 'Competição', Valor: selectedComp.name },
      { Campo: 'Data', Valor: format(new Date(selectedComp.date), 'dd/MM/yyyy') },
      { Campo: 'Valor por Inscrição', Valor: `€${entryFee.toFixed(2)}` },
      { Campo: '', Valor: '' },
      { Campo: 'Total de Participantes', Valor: totalParticipants },
      { Campo: 'Pagamentos Recebidos', Valor: paidCount },
      { Campo: 'Pagamentos Pendentes', Valor: unpaidCount },
      { Campo: '', Valor: '' },
      { Campo: 'Total Arrecadado', Valor: `€${totalCollected.toFixed(2)}` },
      { Campo: 'Total em Falta', Valor: `€${totalPending.toFixed(2)}` },
      { Campo: 'Total Esperado', Valor: `€${totalExpected.toFixed(2)}` },
    ];

    const detailsData = entries.map(entry => ({
      'Cavaleiro': entry.rider_name,
      'Cavalo': entry.horse_name,
      'Valor': `€${entryFee.toFixed(2)}`,
      'Pagamento': entry.paid ? 'Pago' : 'Pendente',
      'Presença': entry.absent ? 'Ausente' : 'Presente'
    }));

    const workbook = XLSX.utils.book_new();
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
    
    const detailsSheet = XLSX.utils.json_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalhes');

    XLSX.writeFile(workbook, `relatorio_financeiro_${selectedComp.name.replace(/\s+/g, '_')}.xlsx`);
    toast.success('Excel gerado!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatório Financeiro</h1>
            <p className="text-stone-600 mt-1">Acompanhamento de pagamentos e presenças</p>
          </div>
          <div className="flex gap-2">
            {selectedCompetition && (
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

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Competição</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a prova" />
              </SelectTrigger>
              <SelectContent>
                {competitions.map(comp => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.name} - {format(new Date(comp.date), 'dd/MM/yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCompetition && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-600">Total Arrecadado</p>
                      <p className="text-2xl font-bold text-green-600">€{totalCollected.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-600">Total em Falta</p>
                      <p className="text-2xl font-bold text-red-600">€{totalPending.toFixed(2)}</p>
                    </div>
                    <XCircle className="w-10 h-10 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-600">Pagos</p>
                      <p className="text-2xl font-bold text-green-600">{paidCount}/{totalParticipants}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-600">Presentes</p>
                      <p className="text-2xl font-bold text-blue-600">{presentCount}/{totalParticipants}</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Participantes ({entries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-bold">{entry.rider_name}</p>
                        <p className="text-sm text-stone-600">{entry.horse_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {entry.paid ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Pago
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            Pendente
                          </span>
                        )}
                        {entry.absent ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            Ausente
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Presente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <div className="text-center py-8 text-stone-500">
                      Nenhum participante aprovado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}