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

function nameMatch(studentName, entryName) {
  var sNorm = expandAbbreviations(normalizeName(studentName));
  var eNorm = expandAbbreviations(normalizeName(entryName));
  if (sNorm === eNorm) return true;
  var sParts = sNorm.split(' ').filter(Boolean);
  var eParts = eNorm.split(' ').filter(Boolean);
  var shorter = sParts.length < eParts.length ? sParts : eParts;
  var longer = sParts.length < eParts.length ? eParts : sParts;
  return shorter.every(function(part) {
    return longer.some(function(lp) { return lp.startsWith(part) || part.startsWith(lp); });
  });
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

      const result = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        prompt: 'Analisa este PDF de planificação de um picadeiro/centro equestre. O PDF tem uma tabela com colunas por dia da semana e linhas por horário. Cada coluna de dia está dividida em sub-colunas: "Júnior" e "Ângelo". Extrai os alunos de AMBAS as colunas. Para cada entrada que contenha nomes de alunos (pessoas reais), extrai: o nome, o dia (segunda|terca|quarta|quinta|sexta|sabado), o horário (HH:MM), e o instrutor (junior|angelo). Ignora tarefas/atividades e nomes com * (monitores). Sé exaustivo.',
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

      const matched = schedules.map(entry => {
        const dayEn = DAY_MAP[entry.day] || entry.day;
        const found = students.find(s => nameMatch(s.name, entry.name));
        return {
          ...entry,
          dayEn,
          studentId: found ? found.id : null,
          studentName: found ? found.name : entry.name,
          existingSchedule: found ? (found.fixed_schedule || []) : [],
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
      const byStudent = {};
      for (const entry of preview) {
        // Use studentId for matched, or a synthetic key from name for unmatched
        const key = entry.studentId || ('unmatched_' + entry.name);
        if (!byStudent[key]) {
          const st = entry.studentId ? students.find(s => s.id === entry.studentId) : null;
          byStudent[key] = {
            id: entry.studentId || null,
            name: entry.studentName,
            email: st ? (st.email || '') : '',
            schedules: entry.existingSchedule.slice()
          };
        }
        const exists = byStudent[key].schedules.some(
          s => s.day === entry.dayEn && s.time === entry.time
        );
        if (!exists) {
          byStudent[key].schedules.push({ day: entry.dayEn, time: entry.time, duration: 30 });
        }
      }

      const updates = Object.values(byStudent);
      for (const s of updates) {
        if (!s.id) {
          // Criar aluno novo do zero
          const newStudent = await base44.entities.PicadeiroStudent.create({
            name: s.name,
            student_type: 'fixo',
            student_level: 'iniciante',
            is_active: true,
            fixed_schedule: s.schedules
          });
          s.id = newStudent.id;
          s.email = newStudent.email || s.name;
        } else {
          await base44.entities.PicadeiroStudent.update(s.id, {
            fixed_schedule: s.schedules,
            student_type: 'fixo',
            is_active: true
          });
        }
      }

      const existingLessons = await base44.entities.Lesson.list('-date', 500);
      const lessonKey = (date, time) => date + '_' + time;
      const existingLessonMap = {};
      for (const l of existingLessons) {
        existingLessonMap[lessonKey(l.date, l.start_time)] = l.id;
      }

      const existingBookings = await base44.entities.Booking.list('-created_date', 1000);
      const bookingKey = (lessonId, email) => lessonId + '_' + email;
      const existingBookingSet = new Set(existingBookings.map(b => bookingKey(b.lesson_id, b.client_email)));

      const services = await base44.entities.Service.list();
      const defaultService = services.find(s => s.is_active) || services[0];
      const serviceId = defaultService ? defaultService.id : 'default';

      let lessonsCreated = 0;
      let bookingsCreated = 0;

      for (const entry of preview) {
        const key = entry.studentId || ('unmatched_' + entry.name);
        const studentData = byStudent[key];
        if (!studentData) continue;

        const dates = getDatesForNextMonths(entry.dayEn, 3);
        for (const date of dates) {
          const key = lessonKey(date, entry.time);
          let lessonId = existingLessonMap[key];

          if (!lessonId) {
            const parts = entry.time.split(':');
            const h = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const endDate = new Date(2000, 0, 1, h, m + 30);
            const endTime = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0');

            const newLesson = await base44.entities.Lesson.create({
              service_id: serviceId,
              date: date,
              start_time: entry.time,
              end_time: endTime,
              max_spots: 6,
              booked_spots: 0,
              fixed_students_count: 0,
              status: 'scheduled',
              is_auto_generated: true
            });
            lessonId = newLesson.id;
            existingLessonMap[key] = lessonId;
            lessonsCreated++;
          }

          // For unmatched students use name as identifier
          const clientId = studentData.email || studentData.name;
          const bKey = bookingKey(lessonId, clientId);
          if (!existingBookingSet.has(bKey)) {
            await base44.entities.Booking.create({
              lesson_id: lessonId,
              client_email: clientId,
              client_name: studentData.name,
              status: 'approved',
              is_fixed_student: true
            });
            existingBookingSet.add(bKey);
            bookingsCreated++;
          }
        }
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