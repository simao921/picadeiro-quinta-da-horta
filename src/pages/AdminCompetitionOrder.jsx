import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, User, Trophy, Download, Save, Plus, UserPlus, Trash2, FileText, Sparkles, UserCheck, UserX, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function AdminCompetitionOrder() {
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showPDFDialog, setShowPDFDialog] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({ rider_name: '', horse_name: '', grade: '', entry_time: '' });
  const queryClient = useQueryClient();

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['entries', selectedCompetition],
    queryFn: () => base44.entities.CompetitionEntry.filter({ 
      competition_id: selectedCompetition,
      status: 'aprovada'
    }),
    enabled: !!selectedCompetition
  });

  const { data: picadeiroStudents = [] } = useQuery({
    queryKey: ['picadeiro-students'],
    queryFn: () => base44.entities.PicadeiroStudent.list()
  });

  const [orderedEntries, setOrderedEntries] = useState([]);

  React.useEffect(() => {
    if (entries.length > 0) {
      setOrderedEntries(entries.map((entry, index) => ({
        ...entry,
        order_number: entry.order_number || index + 1,
        absent: entry.absent || false,
        paid: entry.paid || false
      })).sort((a, b) => a.order_number - b.order_number));
      return;
    }

    setOrderedEntries([]);
  }, [entries]);

  const updateOrder = useMutation({
    mutationFn: async (orderedList) => {
      const updates = orderedList.map((entry, index) => 
        base44.entities.CompetitionEntry.update(entry.id, { order_number: index + 1 })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      toast.success('Ordem guardada!');
    }
  });

  const addEntry = useMutation({
    mutationFn: (data) => base44.entities.CompetitionEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      setShowAddDialog(false);
      setEditingEntry(null);
      setNewEntry({ rider_name: '', horse_name: '', grade: '', entry_time: '' });
      toast.success('Participante adicionado!');
    }
  });

  const importFromPicadeiro = useMutation({
    mutationFn: async (studentIds) => {
      const newEntries = studentIds.map(studentId => {
        const student = picadeiroStudents.find(s => s.id === studentId);
        return {
          competition_id: selectedCompetition,
          rider_name: student.name,
          rider_email: student.email || 'sem-email@picadeiro.pt',
          horse_name: student.horse_name || 'A definir',
          grade: student.grade || '',
          status: 'aprovada',
          order_number: entries.length + studentIds.indexOf(studentId) + 1
        };
      });
      return await base44.entities.CompetitionEntry.bulkCreate(newEntries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      setShowImportDialog(false);
      toast.success('Alunos importados!');
    }
  });

  const deleteEntry = useMutation({
    mutationFn: (id) => base44.entities.CompetitionEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      toast.success('Participante removido!');
    }
  });

  const toggleAbsent = useMutation({
    mutationFn: async ({ id, absent }) => {
      await base44.entities.CompetitionEntry.update(id, { absent });
      return { id, absent };
    },
    onSuccess: ({ id, absent }) => {
      setOrderedEntries(prev => prev.map(e => 
        e.id === id ? { ...e, absent } : e
      ));
      queryClient.invalidateQueries(['entries', selectedCompetition]);
      toast.success(absent ? 'Marcado como ausente' : 'Marcado como presente');
    }
  });

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }) => {
      await base44.entities.CompetitionEntry.update(id, { paid });
      return { id, paid };
    },
    onSuccess: ({ id, paid }) => {
      setOrderedEntries(prev => prev.map(e => 
        e.id === id ? { ...e, paid } : e
      ));
      queryClient.invalidateQueries(['entries', selectedCompetition]);
      toast.success(paid ? 'Marcado como pago' : 'Marcado como não pago');
    }
  });

  const handleAddManual = () => {
    if (!newEntry.rider_name || !newEntry.horse_name) {
      toast.error('Preencha cavaleiro e cavalo');
      return;
    }
    
    const notes = newEntry.entry_time ? `Horário: ${newEntry.entry_time}` : '';
    
    if (editingEntry) {
      updateEntry.mutate({
        id: editingEntry.id,
        data: {
          rider_name: newEntry.rider_name,
          horse_name: newEntry.horse_name,
          grade: newEntry.grade,
          notes: notes
        }
      });
    } else {
      addEntry.mutate({
        competition_id: selectedCompetition,
        rider_name: newEntry.rider_name,
        rider_email: 'manual@picadeiro.pt',
        horse_name: newEntry.horse_name,
        grade: newEntry.grade,
        notes: notes,
        status: 'aprovada',
        order_number: entries.length + 1
      });
    }
  };

  const handleStartEdit = (entry) => {
    const timeMatch = entry.notes?.match(/Horário:\s*(\d{2}:\d{2})/);
    setEditingEntry(entry);
    setNewEntry({
      rider_name: entry.rider_name || '',
      horse_name: entry.horse_name || '',
      grade: entry.grade || '',
      entry_time: timeMatch?.[1] || ''
    });
    setShowAddDialog(true);
  };

  const updateEntry = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompetitionEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['entries']);
      setShowAddDialog(false);
      setEditingEntry(null);
      setNewEntry({ rider_name: '', horse_name: '', grade: '', entry_time: '' });
      toast.success('Participante atualizado!');
    }
  });

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const processPDFEntries = useMutation({
    mutationFn: async (fileUrl) => {
      const schema = {
        type: "object",
        properties: {
          participants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                order: { type: "number", description: "Número de ordem na lista" },
                entry_time: { type: "string", description: "Horário de entrada (HH:MM)" },
                rider_name: { type: "string", description: "Nome completo do cavaleiro" },
                federal_number: { type: "string", description: "Número federado do cavaleiro" },
                horse_name: { type: "string", description: "Nome do cavalo" },
                grade: { type: "string", description: "Grau/Escalão/Categoria" },
                club: { type: "string", description: "Clube/Associação" },
                nif: { type: "string", description: "NIF do cavaleiro" },
                base_score: { type: "number", description: "Pontuação base/inicial (se visível)" }
              }
            }
          }
        }
      };

      const prompt = `
Analisa este documento de ORDEM DE ENTRADA de competição equestre e extrai TODOS os participantes.

🔍 CAMPOS A EXTRAIR (para cada participante na lista):

1. ⏰ HORÁRIO DE ENTRADA - CRÍTICO!
   - Formato HH:MM obrigatório (ex: 09:30, 14:45, 16:20)
   - Procura em colunas tipo "Hora", "Horário", "Time", ou simplesmente números como "9:30"
   - Se estiver em formato de 24h ou 12h (AM/PM), converte para HH:MM
   - SEMPRE inclui este campo se estiver visível no documento!

2. 🔢 Número de ordem - posição na lista (1, 2, 3...)

3. 👤 Nome do cavaleiro - nome completo do participante/atleta

4. 🐴 Nome do cavalo - nome completo do equino

5. 📋 Número federado - pode aparecer como "Fed.", "N. Fed.", "Nº Federado", número de inscrição

6. 🏆 Grau/Escalão - categoria ("Iniciado 1", "Elementar", "GP", "Preliminar", etc)

7. 🏛️ Clube/Associação - entidade representada

8. 📄 NIF - número de identificação fiscal (se disponível)

9. 💯 Pontuação base - nota inicial (se disponível)

⚠️ REGRAS CRÍTICAS:
✓ PRIORIDADE MÁXIMA: Extrair horários! São essenciais!
✓ Verifica TODAS as colunas do documento para encontrar horários
✓ Extrai TODOS os participantes, linha por linha
✓ Mantém ordem EXATA do documento
✓ Se um campo não existir, usa string vazia "" (nunca null)
✓ Horários SEMPRE em formato HH:MM (ex: "09:00" não "9:00")
✓ Se houver múltiplas páginas, extrai de TODAS

📊 Estrutura no formato JSON com array "participants".
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        response_json_schema: schema
      });

      return result;
    }
  });

  const handleProcessPDF = async () => {
    if (!pdfFile) {
      toast.error('Selecione um PDF');
      return;
    }

    setIsProcessingPDF(true);
    try {
      // Upload PDF
      const fileUrl = await uploadFile.mutateAsync(pdfFile);
      
      // Process with AI
      const extracted = await processPDFEntries.mutateAsync(fileUrl);

      if (!extracted.participants || extracted.participants.length === 0) {
        toast.error('Nenhum participante encontrado no PDF');
        return;
      }

      // Create entries com todos os campos
      const newEntries = extracted.participants.map((p, index) => ({
        competition_id: selectedCompetition,
        rider_name: p.rider_name,
        rider_email: 'pdf-import@picadeiro.pt',
        horse_name: p.horse_name,
        federal_number: p.federal_number || '',
        nif: p.nif || '',
        grade: p.grade || '',
        notes: [
          p.entry_time ? `Horário: ${p.entry_time}` : '',
          p.club ? `Clube: ${p.club}` : '',
          p.base_score ? `Pontuação Base: ${p.base_score}` : ''
        ].filter(Boolean).join(' | '),
        status: 'aprovada',
        order_number: p.order || (index + 1)
      }));

      await base44.entities.CompetitionEntry.bulkCreate(newEntries);
      queryClient.invalidateQueries(['entries']);

      setShowPDFDialog(false);
      setPdfFile(null);
      toast.success(`${newEntries.length} participantes importados do PDF!`);

    } catch (error) {
      toast.error('Erro ao processar PDF: ' + error.message);
    } finally {
      setIsProcessingPDF(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(orderedEntries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedEntries(items);
  };

  const handleSaveOrder = () => {
    updateOrder.mutate(orderedEntries);
  };

  const generatePDF = async () => {
    const comp = competitions.find(c => c.id === selectedCompetition);
    if (!comp) return;

    const doc = new jsPDF();
    
    // Golden decorative line at top
    doc.setDrawColor(184, 149, 106);
    doc.setLineWidth(0.5);
    doc.line(20, 20, 190, 20);
    
    // Header
    doc.setTextColor(45, 45, 45);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('ORDEM DE ENTRADA', 105, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(184, 149, 106);
    doc.text(comp.name, 105, 38, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${format(new Date(comp.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}`, 105, 45, { align: 'center' });
    if (comp.location) {
      doc.text(`Local: ${comp.location}`, 105, 50, { align: 'center' });
    }

    // Golden line
    doc.setDrawColor(184, 149, 106);
    doc.line(20, 53, 190, 53);

    // Table headers with golden background
    let y = 63;
    doc.setFillColor(184, 149, 106);
    doc.rect(15, y - 5, 180, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Nº', 18, y);
    doc.text('Horário', 30, y);
    doc.text('Cavaleiro', 55, y);
    doc.text('Cavalo', 115, y);
    doc.text('Grau', 170, y);

    // Table content
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(45, 45, 45);
    y += 10;

    orderedEntries.forEach((entry, index) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y - 5, 180, 7, 'F');
      }

      // Extract time from notes
      const timeMatch = entry.notes?.match(/Horário:\s*(\d{2}:\d{2})/);
      const entryTime = timeMatch?.[1] || '-';

      doc.text((index + 1).toString(), 18, y);
      doc.setTextColor(184, 149, 106);
      doc.setFont(undefined, 'bold');
      doc.text(entryTime, 30, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(45, 45, 45);
      doc.text(entry.rider_name, 55, y);
      doc.text(entry.horse_name, 115, y);
      doc.text(entry.grade || '-', 170, y);
      
      y += 7;
    });

    // Footer with golden line
    doc.setDrawColor(184, 149, 106);
    doc.setLineWidth(0.3);
    doc.line(20, 280, 190, 280);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 285, { align: 'center' });
    doc.setTextColor(184, 149, 106);
    doc.setFont(undefined, 'bold');
    doc.text('Picadeiro Quinta da Horta - Gilberto Filipe', 105, 290, { align: 'center' });

    doc.save(`ordem_entrada_${comp.name.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF gerado!');
  };

  const generateExcelReport = () => {
    const comp = competitions.find(c => c.id === selectedCompetition);
    if (!comp) return;

    const data = orderedEntries.map((entry, index) => {
      const timeMatch = entry.notes?.match(/Horário:\s*(\d{2}:\d{2})/);
      return {
        'Nº': index + 1,
        'Horário': timeMatch?.[1] || '-',
        'Cavaleiro': entry.rider_name,
        'Cavalo': entry.horse_name,
        'Grau': entry.grade || '-',
        'Presença': entry.absent ? 'Ausente' : 'Presente',
        'Pagamento': entry.paid ? 'Pago' : 'Não Pago'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');

    // Auto-size columns
    const max_width = data.reduce((w, r) => Math.max(w, r['Cavaleiro'].length), 10);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 10 },
      { wch: max_width },
      { wch: max_width },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 }
    ];

    XLSX.writeFile(workbook, `relatorio_${comp.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.xlsx`);
    toast.success('Relatório Excel gerado!');
  };

  const selectedComp = competitions.find(c => c.id === selectedCompetition);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Ordem de Entrada</h1>
            <p className="text-stone-600 mt-1">Organizar ordem dos participantes</p>
          </div>
          <div className="flex gap-2">
            {selectedCompetition && (
              <>
                <Button onClick={() => setShowPDFDialog(true)} className="bg-gradient-to-r from-[#B8956A] to-[#8B7355]">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Importar PDF
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="bg-[#B8956A] hover:bg-[#8B7355]">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
                <Button onClick={() => setShowImportDialog(true)} variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Importar Alunos
                </Button>
              </>
            )}
            {orderedEntries.length > 0 && (
              <>
                <Button onClick={handleSaveOrder} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Ordem
                </Button>
                <Button onClick={generatePDF} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={generateExcelReport} variant="outline" className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100">
                  <Download className="w-4 h-4 mr-2" />
                  Relatório Excel
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#B8956A]" />
              Selecionar Competição
            </CardTitle>
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Participantes ({orderedEntries.length})</CardTitle>
                {selectedComp && (
                  <div className="text-sm text-stone-600">
                    {selectedComp.name} - {format(new Date(selectedComp.date), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8956A] mx-auto"></div>
                </div>
              ) : orderedEntries.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-stone-500">Nenhum participante adicionado</p>
                  <Button onClick={() => setShowAddDialog(true)} className="mt-4 bg-[#B8956A]">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Participante
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="entries">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {orderedEntries.map((entry, index) => (
                          <Draggable key={entry.id} draggableId={entry.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-4 p-4 bg-white border-2 rounded-lg transition-all ${
                                  snapshot.isDragging ? 'shadow-xl border-[#B8956A] scale-105' : 'border-stone-200'
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5 text-stone-400" />
                                </div>
                                
                                <div className="w-12 h-12 rounded-full bg-[#B8956A] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {index + 1}
                                </div>

                                <div className="flex-1 grid grid-cols-4 gap-3">
                                  <div>
                                    <div className="text-stone-600 text-xs mb-1">⏰ Horário</div>
                                    <p className="font-bold text-[#B8956A]">
                                      {(() => {
                                        const timeMatch = entry.notes?.match(/Horário:\s*(\d{2}:\d{2})/);
                                        return timeMatch?.[1] || '-';
                                      })()}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 text-stone-600 text-xs mb-1">
                                      <User className="w-3 h-3" />
                                      Cavaleiro
                                    </div>
                                    <p className="font-bold text-[#2D2D2D]">{entry.rider_name}</p>
                                  </div>
                                  <div>
                                    <div className="text-stone-600 text-xs mb-1">Cavalo</div>
                                    <p className="font-medium">{entry.horse_name}</p>
                                  </div>
                                  <div>
                                    <div className="text-stone-600 text-xs mb-1">Grau</div>
                                    <p className="font-medium">{entry.grade || '-'}</p>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  {entry.absent ? (
                                    <div className="flex items-center gap-1">
                                      <Badge className="bg-red-500 text-white px-2 py-1 text-xs font-bold">
                                        <UserX className="w-3 h-3 mr-1" />
                                        Ausente
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs hover:bg-green-50"
                                        onClick={() => toggleAbsent.mutate({ id: entry.id, absent: false })}
                                        title="Marcar como presente"
                                      >
                                        ✓ Presente
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Badge className="bg-green-500 text-white px-2 py-1 text-xs font-bold">
                                        <UserCheck className="w-3 h-3 mr-1" />
                                        Presente
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs hover:bg-red-50"
                                        onClick={() => toggleAbsent.mutate({ id: entry.id, absent: true })}
                                        title="Marcar como ausente"
                                      >
                                        ✕ Ausente
                                      </Button>
                                    </div>
                                  )}

                                  <Button
                                    variant={entry.paid ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => togglePaid.mutate({ id: entry.id, paid: !entry.paid })}
                                    className={entry.paid ? "bg-green-600 hover:bg-green-700 text-xs h-7 font-bold" : "text-xs h-7 border-stone-300"}
                                  >
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {entry.paid ? 'Pago' : 'Não Pago'}
                                  </Button>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartEdit(entry)}
                                >
                                  Editar
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm('Remover este participante?')) {
                                      deleteEntry.mutate(entry.id);
                                    }
                                  }}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        </div>
                        )}
                        </Droppable>
                        </DragDropContext>
                        )}

                        {entries.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                        💡 <strong>Dica:</strong> Arraste para reordenar ou clique num participante para editar horário
                        </p>
                        </div>
                        )}
            </CardContent>
          </Card>
        )}

        {/* Add Manual Dialog */}
        <Dialog
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setEditingEntry(null);
              setNewEntry({ rider_name: '', horse_name: '', grade: '', entry_time: '' });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Editar Participante' : 'Adicionar Participante'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Cavaleiro *</Label>
                <Input
                  value={newEntry.rider_name}
                  onChange={(e) => setNewEntry({ ...newEntry, rider_name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Nome do Cavalo *</Label>
                <Input
                  value={newEntry.horse_name}
                  onChange={(e) => setNewEntry({ ...newEntry, horse_name: e.target.value })}
                  placeholder="Nome do cavalo"
                />
              </div>
              <div>
                <Label>Grau/Escalão</Label>
                <Input
                  value={newEntry.grade}
                  onChange={(e) => setNewEntry({ ...newEntry, grade: e.target.value })}
                  placeholder="Ex: Iniciado, Elementar, etc"
                />
              </div>
              <div>
                <Label>Horário de Entrada (HH:MM)</Label>
                <Input
                  value={newEntry.entry_time}
                  onChange={(e) => setNewEntry({ ...newEntry, entry_time: e.target.value })}
                  placeholder="Ex: 09:30"
                />
              </div>
              <Button onClick={handleAddManual} className="w-full bg-[#B8956A]">
                <Plus className="w-4 h-4 mr-2" />
                {editingEntry ? 'Guardar Alterações' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Import Dialog */}
        <Dialog open={showPDFDialog} onOpenChange={setShowPDFDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#B8956A]" />
                Importar Ordem de Entrada (PDF)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Como funciona:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Faça upload do PDF com a ordem de entrada</li>
                      <li>A IA extrai automaticamente todos os participantes</li>
                      <li>Os participantes são adicionados com a ordem correta</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <Label>Upload do PDF</Label>
                <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#B8956A] transition-colors mt-2">
                  <div className="text-center">
                    <FileText className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                    <p className="text-sm text-stone-600 font-medium">
                      {pdfFile ? pdfFile.name : 'Clique para selecionar PDF'}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">PDF com ordem de entrada</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                  />
                </label>
              </div>

              <Button
                onClick={handleProcessPDF}
                disabled={!pdfFile || isProcessingPDF}
                className="w-full bg-gradient-to-r from-[#B8956A] to-[#8B7355]"
              >
                {isProcessingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    A processar PDF...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Processar com IA
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Students Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importar Alunos do Picadeiro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {picadeiroStudents.length === 0 ? (
                <p className="text-center text-stone-500 py-8">Nenhum aluno registado</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {picadeiroStudents.map(student => (
                      <div key={student.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-stone-50">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          className="w-4 h-4"
                          onChange={(e) => {
                            const checkbox = e.target;
                            const studentIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                              .map(cb => cb.id.replace('student-', ''));
                            checkbox.dataset.selected = checkbox.checked;
                          }}
                        />
                        <label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-stone-600">
                            Cavalo: {student.horse_name || 'N/A'} {student.grade && `• ${student.grade}`}
                          </p>
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      const studentIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                        .map(cb => cb.id.replace('student-', ''));
                      if (studentIds.length === 0) {
                        toast.error('Selecione pelo menos um aluno');
                        return;
                      }
                      importFromPicadeiro.mutate(studentIds);
                    }}
                    className="w-full bg-[#B8956A]"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Importar Selecionados
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}