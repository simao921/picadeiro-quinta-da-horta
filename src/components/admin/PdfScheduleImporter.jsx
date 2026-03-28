import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUp, Sparkles, CheckCircle, AlertCircle, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

// Common Portuguese name abbreviation expansions
const ABBREV_MAP = {
  'mª': 'maria', 'ma': 'maria',
  'jº': 'joao', 'jo': 'joao', 'joão': 'joao',
  'aº': 'antonio', 'ant': 'antonio', 'antónio': 'antonio',
  'fº': 'francisco', 'fco': 'francisco',
  'mº': 'mario', 'má': 'mario',
  'jª': 'josefa',
  'dº': 'domingos',
};

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9 ]/g, '') // remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

function expandAbbreviations(name) {
  return name.split(' ').map(part => {
    const norm = normalizeName(part);
    return ABBREV_MAP[norm] || norm;
  }).join(' ');
}

function nameMatch(studentName, entryName) {
  const sNorm = expandAbbreviations(normalizeName(studentName));
  const eNorm = expandAbbreviations(normalizeName(entryName));
  if (sNorm === eNorm) return true;
  // Check if all parts of the shorter name are in the longer one
  const sParts = sNorm.split(' ').filter(Boolean);
  const eParts = eNorm.split(' ').filter(Boolean);
  const shorter = sParts.length < eParts.length ? sParts : eParts;
  const longer = sParts.length < eParts.length ? eParts : sParts;
  // All parts of the shorter name must match a part of the longer
  return shorter.every(part => longer.some(lp => lp.startsWith(part) || part.startsWith(lp)));
}

const DAY_MAP = {
  'segunda': 'monday',
  'terca': 'tuesday',
  'quarta': 'wednesday',
  'quinta': 'thursday',
  'sexta': 'friday',
  'sabado': 'saturday',
};

const DAY_LABELS = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
};

export default function PdfScheduleImporter({ students, onImportDone }) {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('idle'); // idle | uploading | analyzing | preview | saving
  const [preview, setPreview] = useState([]); // [{name, day, time, studentId, found}]
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setError(null);
    } else {
      toast.error('Por favor selecione um ficheiro PDF');
    }
  };

  const analyze = async () => {
    if (!file) return;
    setError(null);
    setStep('uploading');

    try {
      // 1. Upload PDF
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStep('analyzing');

      // 2. Ask AI to extract schedules from Angelo's column only
      const result = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        add_context_from_internet: false,
        prompt: `Analisa este PDF de planificação de um picadeiro/centro equestre.
        
O PDF tem uma tabela com colunas por dia da semana (Segunda-Feira, Terça-Feira, Quarta-Feira, Quinta-Feira, Sexta-Feira, Sábado) e linhas por horário.
Cada coluna de dia está dividida em sub-colunas: "Júnior" e "Ângelo".

INSTRUÇÕES MUITO IMPORTANTES:
- Extrai os alunos de AMBAS as colunas: tanto "Júnior" como "Ângelo".
- Para cada entrada que contenha nomes de alunos (pessoas reais), extrai:
  - O nome(s) do(s) aluno(s)
  - O dia da semana
  - O horário (hora de início, formato HH:MM)
  - O instrutor: "junior" ou "angelo"
- Ignora entradas que sejam tarefas/atividades (limpeza, máquinas, regar, etc.) e não nomes de pessoas.
- Nomes com * são monitores/ajudantes - IGNORA-OS (ex: Maria Pinheiro *, Emília Borges *, João Rasquinho *).
- Para o Sábado, extrai igualmente todos os alunos.
- Sê exaustivo - extrai TODOS os alunos de TODOS os horários de ambas as colunas.

Retorna um JSON com a estrutura:
{
  "schedules": [
    {
      "name": "Nome Apelido",
      "day": "segunda|terca|quarta|quinta|sexta|sabado",
      "time": "HH:MM",
      "instructor": "junior|angelo"
    }
  ]
}`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            schedules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  day: { type: 'string' },
                  time: { type: 'string' },
                  instructor: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const schedules = result.schedules || [];

      // 3. Match with existing students
      const matched = schedules.map(entry => {
        const dayEn = DAY_MAP[entry.day] || entry.day;
        // Try to find student by name with abbreviation expansion
        const found = students.find(s => nameMatch(s.name, entry.name));
        return {
          ...entry,
          dayEn,
          studentId: found?.id || null,
          studentName: found?.name || entry.name,
          existingSchedule: found?.fixed_schedule || [],
          found: !!found
        };
      });

      setPreview(matched);
      setStep('preview');
    } catch (e) {
      setError(e.message || 'Erro ao analisar PDF');
      setStep('idle');
    }
  };

  const handleConfirm = async () => {
    setStep('saving');

    try {
      // Group by studentId
      const byStudent = {};
      for (const entry of preview) {
        if (!entry.studentId) continue;
        if (!byStudent[entry.studentId]) {
          byStudent[entry.studentId] = {
            id: entry.studentId,
            name: entry.studentName,
            schedules: [...entry.existingSchedule]
          };
        }
        // Add slot if not duplicate
        const exists = byStudent[entry.studentId].schedules.some(
          s => s.day === entry.dayEn && s.time === entry.time
        );
        if (!exists) {
          byStudent[entry.studentId].schedules.push({ day: entry.dayEn, time: entry.time, duration: 30 });
        }
      }

      // Update each student
      const updates = Object.values(byStudent);
      for (const s of updates) {
        await base44.entities.PicadeiroStudent.update(s.id, {
          fixed_schedule: s.schedules,
          student_type: 'fixo',
          is_active: true
        });
      }

      toast.success(`${updates.length} alunos atualizados com sucesso!`);
      setStep('idle');
      setFile(null);
      setPreview([]);
      onImportDone?.();
    } catch (e) {
      setError(e.message);
      setStep('preview');
    }
  };

  const notFound = preview.filter(p => !p.found);
  const found = preview.filter(p => p.found);

  return (
    <Card className="border-2 border-dashed border-[#4A5D23]/30 bg-[#4A5D23]/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#4A5D23]" />
          <h3 className="font-semibold text-[#2C3E1F]">Importar Horários por IA (PDF)</h3>
        </div>
        <p className="text-sm text-stone-500">Anexa o PDF da planificação e a IA extrai automaticamente todos os horários fixos do Ângelo.</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {step === 'idle' && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="cursor-pointer">
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
              <div className="flex items-center gap-2 px-4 py-2 border border-[#4A5D23] rounded-lg text-[#4A5D23] hover:bg-[#4A5D23]/10 transition-colors text-sm font-medium">
                <FileUp className="w-4 h-4" />
                {file ? file.name : 'Selecionar PDF'}
              </div>
            </label>
            {file && (
              <Button
                onClick={analyze}
                className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analisar com IA
              </Button>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}

        {(step === 'uploading' || step === 'analyzing') && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#4A5D23]" />
            <span className="text-sm text-stone-600">
              {step === 'uploading' ? 'A carregar PDF...' : 'A analisar com IA (pode demorar ~30s)...'}
            </span>
          </div>
        )}

        {step === 'saving' && (
          <div className="flex items-center gap-3 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#4A5D23]" />
            <span className="text-sm text-stone-600">A guardar horários...</span>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-stone-700">
                {found.length} horários encontrados • {notFound.length} alunos não encontrados no sistema
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setStep('idle'); setPreview([]); }}>
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
                <Button size="sm" className="bg-[#4A5D23] hover:bg-[#3A4A1B]" onClick={handleConfirm} disabled={found.length === 0}>
                  <Check className="w-4 h-4 mr-1" /> Confirmar ({found.length})
                </Button>
              </div>
            </div>

            {/* Found students */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {found.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded bg-green-50 border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{entry.studentName}</span>
                  <Badge variant="outline" className="text-xs capitalize">{entry.instructor || '-'}</Badge>
                  <Badge variant="outline" className="text-xs">{DAY_LABELS[entry.dayEn] || entry.day}</Badge>
                  <Badge variant="outline" className="text-xs">{entry.time}</Badge>
                </div>
              ))}

              {notFound.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded bg-amber-50 border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-amber-800 flex-1">{entry.name} <span className="text-xs">(não encontrado)</span></span>
                  <Badge variant="outline" className="text-xs capitalize">{entry.instructor || '-'}</Badge>
                  <Badge variant="outline" className="text-xs">{DAY_LABELS[entry.dayEn] || entry.day}</Badge>
                  <Badge variant="outline" className="text-xs">{entry.time}</Badge>
                </div>
              ))}
            </div>

            {notFound.length > 0 && (
              <p className="text-xs text-amber-600">⚠️ Os alunos a amarelo não foram encontrados no sistema e não serão atualizados.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}