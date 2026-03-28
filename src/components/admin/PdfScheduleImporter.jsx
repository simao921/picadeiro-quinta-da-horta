import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUp, Sparkles, CheckCircle, AlertCircle, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandAbbreviations(name) {
  return name.split(' ').map(function(part) {
    var norm = normalizeName(part);
    return ABBREV_MAP[norm] || norm;
  }).join(' ');
}

function firstLast(name) {
  var parts = name.split(' ').filter(Boolean);
  if (parts.length <= 1) return parts;
  return [parts[0], parts[parts.length - 1]];
}

function nameMatch(studentName, entryName) {
  var sNorm = expandAbbreviations(normalizeName(studentName));
  var eNorm = expandAbbreviations(normalizeName(entryName));
  if (sNorm === eNorm) return true;
  // Compare first+last name
  var sFL = firstLast(sNorm);
  var eFL = firstLast(eNorm);
  if (sFL.length >= 2 && eFL.length >= 2) {
    return sFL[0] === eFL[0] && sFL[sFL.length-1] === eFL[eFL.length-1];
  }
  // Fallback: first name only
  return sFL[0] === eFL[0];
}

var DAY_MAP = {
  'segunda': 'monday',
  'terca': 'tuesday',
  'quarta': 'wednesday',
  'quinta': 'thursday',
  'sexta': 'friday',
  'sabado': 'saturday',
};

var DAY_LABELS = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
};

var DAY_OF_WEEK = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function bulkCreateInBatches(entity, items, batchSize = 20) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const created = await entity.bulkCreate(batch);
    results.push(...(Array.isArray(created) ? created : []));
    if (i + batchSize < items.length) await sleep(500);
  }
  return results;
}

function getDatesForNextMonths(dayEn, months) {
  var dates = [];
  var today = new Date();
  var end = new Date();
  end.setMonth(end.getMonth() + months);
  var targetDow = DAY_OF_WEEK[dayEn];
  if (targetDow === undefined) return dates;
  var cur = new Date(today);
  while (cur.getDay() !== targetDow) cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 7);
  }
  return dates;
}

export default function PdfScheduleImporter({ students, onImportDone }) {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('idle');
  const [preview, setPreview] = useState([]);
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
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStep('analyzing');

      // Extract schedule data directly from PDF
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            schedules: {
              type: 'array',
              description: 'Extrai TODOS os nomes de alunos da tabela de horarios. A tabela tem linhas com horas (ex: 8:00, 8:30, 9:00...) e colunas com instrutores (ex: Junior, Angelo, Tiago). Cada celula pode conter um ou mais nomes de alunos. Para CADA celula que contenha um nome: cria uma entrada com o nome, o dia da semana dessa coluna, a hora dessa linha, e o instrutor dessa coluna. Se uma celula tiver 2 nomes, cria 2 entradas separadas. NUNCA incluas os nomes dos instrutores (Junior, Angelo, Tiago, etc.) como alunos - esses sao cabecalhos de coluna. Nao saltes nenhuma celula preenchida.',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nome do aluno exatamente como aparece na celula, sem asterisco' },
                  day: { type: 'string', description: 'Dia da semana em portugues minusculas sem acento: segunda, terca, quarta, quinta, sexta, sabado' },
                  time: { type: 'string', description: 'Hora no formato HH:MM' },
                  instructor: { type: 'string', description: 'Nome do instrutor responsavel por essa coluna' },
                  duration: { type: 'number', description: '60 se o nome tinha asterisco (*), caso contrario 30' }
                }
              }
            }
          }
        }
      });

      const schedules = (extracted?.output?.schedules) || [];

      const matched = schedules.map(entry => {
        const dayEn = DAY_MAP[entry.day] || entry.day;
        const cleanName = entry.name ? entry.name.replace(/\*/g, '').trim() : entry.name;
        const duration = entry.duration === 60 ? 60 : 30;
        const found = students.find(s => nameMatch(s.name, cleanName));
        return {
          ...entry,
          name: cleanName,
          dayEn,
          duration,
          studentId: found ? found.id : null,
          studentName: found ? found.name : cleanName,
          existingSchedule: found ? (found.fixed_schedule || []) : [],
          found: !!found
        };
      });

      // Dedup: same student + day + time = keep only first
      const seen = new Set();
      const deduped = matched.filter(entry => {
        const key = (entry.studentId || normalizeName(entry.name)) + '_' + entry.dayEn + '_' + entry.time;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setPreview(deduped);
      setStep('preview');
    } catch (e) {
      setError(e.message || 'Erro ao analisar PDF');
      setStep('idle');
    }
  };

  const handleConfirm = async () => {
    setStep('saving');

    try {
      // 1. Agrupar horários por aluno
      const byStudent = {};
      for (const entry of preview) {
        const studentKey = entry.studentId || ('new_' + normalizeName(entry.name));
        if (!byStudent[studentKey]) {
          const st = entry.studentId ? students.find(s => s.id === entry.studentId) : null;
          byStudent[studentKey] = {
            id: entry.studentId || null,
            name: entry.studentName,
            email: st ? (st.email || '') : '',
            schedules: entry.existingSchedule ? entry.existingSchedule.slice() : []
          };
        }
        const exists = byStudent[studentKey].schedules.some(
          s => s.day === entry.dayEn && s.time === entry.time
        );
        if (!exists) {
          byStudent[studentKey].schedules.push({ day: entry.dayEn, time: entry.time, duration: entry.duration || 30 });
        }
      }

      // 2. Criar/atualizar alunos do picadeiro
      const newlyCreatedStudentIds = new Set();
      const updates = Object.values(byStudent);
      for (const s of updates) {
        if (!s.id) {
          const newStudent = await base44.entities.PicadeiroStudent.create({
            name: s.name,
            student_type: 'fixo',
            student_level: 'iniciante',
            is_active: true,
            fixed_schedule: s.schedules
          });
          s.id = newStudent.id;
          s.clientId = s.name; // usar nome como identificador de booking
          newlyCreatedStudentIds.add(s.id);
        } else {
          await base44.entities.PicadeiroStudent.update(s.id, {
            fixed_schedule: s.schedules,
            student_type: 'fixo',
            is_active: true
          });
          const st = students.find(x => x.id === s.id);
          s.clientId = (st && st.email) ? st.email : s.name;
        }
      }

      // 3. Carregar aulas e reservas existentes
      const existingLessons = await base44.entities.Lesson.list('-date', 2000);
      const lsnMap = {}; // 'date_time' -> lessonId
      for (const l of existingLessons) {
        lsnMap[l.date + '_' + l.start_time] = l.id;
      }

      const existingBookings = await base44.entities.Booking.list('-created_date', 2000);
      const bkgSet = new Set(existingBookings.map(b => b.lesson_id + '_' + b.client_email));

      const services = await base44.entities.Service.list();
      // Preferir servico de aulas em grupo
      const defaultService = services.find(s => s.is_active && s.title && s.title.toLowerCase().includes('grupo'))
        || services.find(s => s.is_active && s.title && s.title.toLowerCase().includes('aula'))
        || services.find(s => s.is_active && !s.is_owner_service)
        || services[0];
      const serviceId = defaultService ? defaultService.id : 'default_service';

      // 4. Preparar todas as aulas e reservas a criar
      let lessonsCreated = 0;
      let bookingsCreated = 0;

      // Primeiro: descobrir quais aulas precisam ser criadas
      const lessonsToCreate = [];
      // mapa provisório: lsnKey -> índice em lessonsToCreate (para depois associar o id)
      const pendingLsnKeys = {};

      for (const entry of preview) {
        const dates = getDatesForNextMonths(entry.dayEn, 3);
        const parts = entry.time.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const lessonDuration = entry.duration || 30;
        const endDate = new Date(2000, 0, 1, h, m + lessonDuration);
        const endTime = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0');

        for (const date of dates) {
          const lsnKey = date + '_' + entry.time;
          if (!lsnMap[lsnKey] && !(lsnKey in pendingLsnKeys)) {
            pendingLsnKeys[lsnKey] = lessonsToCreate.length;
            lessonsToCreate.push({
              service_id: serviceId,
              date,
              start_time: entry.time,
              end_time: endTime,
              max_spots: 6,
              booked_spots: 0,
              fixed_students_count: 0,
              status: 'scheduled',
              is_auto_generated: true
            });
          }
        }
      }

      // Criar todas as aulas em lotes
      if (lessonsToCreate.length > 0) {
        const created = await bulkCreateInBatches(base44.entities.Lesson, lessonsToCreate, 20);
        lessonsCreated = created.length;
        // Mapear os ids criados de volta ao lsnMap
        // bulkCreate devolve os items na mesma ordem
        for (const [lsnKey, idx] of Object.entries(pendingLsnKeys)) {
          if (created[idx] && created[idx].id) {
            lsnMap[lsnKey] = created[idx].id;
          }
        }
      }

      // Segundo: preparar reservas
      const bookingsToCreate = [];

      for (const entry of preview) {
        const studentKey = entry.studentId || ('new_' + normalizeName(entry.name));
        const studentData = byStudent[studentKey];
        if (!studentData) continue;

        const clientId = studentData.clientId || studentData.name;
        const dates = getDatesForNextMonths(entry.dayEn, 3);

        for (const date of dates) {
          const lsnKey = date + '_' + entry.time;
          const lessonId = lsnMap[lsnKey];
          if (!lessonId) continue;

          const bkgKey = lessonId + '_' + clientId;
          if (!bkgSet.has(bkgKey)) {
            bkgSet.add(bkgKey);
            bookingsToCreate.push({
              lesson_id: lessonId,
              client_email: clientId,
              client_name: studentData.name,
              status: 'approved',
              is_fixed_student: true
            });
          }
        }
      }

      // Criar todas as reservas em lotes
      if (bookingsToCreate.length > 0) {
        await bulkCreateInBatches(base44.entities.Booking, bookingsToCreate, 20);
        bookingsCreated = bookingsToCreate.length;
      }

      toast.success(updates.length + ' alunos atualizados \u2022 ' + lessonsCreated + ' aulas criadas \u2022 ' + bookingsCreated + ' reservas geradas');
      setStep('idle');
      setFile(null);
      setPreview([]);
      if (onImportDone) onImportDone();
    } catch (e) {
      console.error('handleConfirm error:', e);
      setError(e.message || 'Erro desconhecido');
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
        <p className="text-sm text-stone-500">Anexa o PDF da planificação e a IA extrai automaticamente todos os horários fixos e gera aulas para os próximos 3 meses.</p>
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
              <Button onClick={analyze} className="bg-[#4A5D23] hover:bg-[#3A4A1B]" size="sm">
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
            <span className="text-sm text-stone-600">A guardar horários e gerar aulas...</span>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-stone-700">
                {found.length} correspondidos &bull; {notFound.length} não encontrados (também serão criados)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setStep('idle'); setPreview([]); }}>
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
                <Button size="sm" className="bg-[#4A5D23] hover:bg-[#3A4A1B]" onClick={handleConfirm} disabled={preview.length === 0}>
                  <Check className="w-4 h-4 mr-1" /> Confirmar ({preview.length})
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {found.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded bg-green-50 border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{entry.studentName}{entry.duration === 60 && <span className="ml-1 text-xs text-blue-600 font-bold">60min</span>}</span>
                  <Badge variant="outline" className="text-xs capitalize">{entry.instructor || '-'}</Badge>
                  <Badge variant="outline" className="text-xs">{DAY_LABELS[entry.dayEn] || entry.day}</Badge>
                  <Badge variant="outline" className="text-xs">{entry.time}</Badge>
                </div>
              ))}
              {notFound.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded bg-amber-50 border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-amber-800 flex-1">{entry.name}{entry.duration === 60 && <span className="ml-1 text-xs text-blue-600 font-bold">60min</span>} <span className="text-xs">(não encontrado)</span></span>
                  <Badge variant="outline" className="text-xs capitalize">{entry.instructor || '-'}</Badge>
                  <Badge variant="outline" className="text-xs">{DAY_LABELS[entry.dayEn] || entry.day}</Badge>
                  <Badge variant="outline" className="text-xs">{entry.time}</Badge>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded p-2">{error}</p>
            )}
            {notFound.length > 0 && (
              <p className="text-xs text-amber-600">Os alunos a amarelo não existem ainda — serão criados automaticamente como alunos novos (nível iniciante, horário fixo).</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}