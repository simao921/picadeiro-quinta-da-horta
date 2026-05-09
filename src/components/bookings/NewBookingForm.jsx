import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarDays, Clock,
  CheckCircle, Loader2, AlertCircle, Camera
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';

// Segunda-feira: 09:00 - 19:00 (último slot 19:00)
const mondayTimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

// Terça a Sexta: 09:00 - 19:30 (último slot 19:30)
const weekdayTimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

// Sábado: 09:00 - 16:00 (último slot 16:00)
const saturdayTimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '15:00', '15:30', '16:00'
];

const getTimeSlotsForDay = (dayOfWeek) => {
  if (dayOfWeek === 6) return saturdayTimeSlots;
  if (dayOfWeek === 1) return mondayTimeSlots;
  return weekdayTimeSlots;
};

// Componente para seleção de aula semanal
function WeeklyLessonSelector({
  index, currentDate, currentTime, selectedDates, selectedTimes,
  setSelectedDates, setSelectedTimes, blockedSlots, getAvailableSlots, getLessonsForDate, isOwnerService
}) {
  const [dateLessons, setDateLessons] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar aulas quando a data muda
  useEffect(() => {
    if (currentDate) {
      setIsLoadingSlots(true);
      getLessonsForDate(currentDate).then(lessons => {
        setDateLessons(lessons);
        setIsLoadingSlots(false);
      }).catch(() => {
        setDateLessons([]);
        setIsLoadingSlots(false);
      });
    } else {
      setDateLessons([]);
    }
  }, [currentDate]);

  const availableSlots = getAvailableSlots(currentDate, dateLessons);

  return (
    <Card className="border-2 border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-br from-[#B8956A]/5 to-white border-b border-stone-200">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#B8956A]" />
            Aula {index + 1}
          </span>
          {currentTime && currentDate && !isNaN(new Date(currentDate)) && (
            <span className="text-[#B8956A] text-sm font-normal bg-[#B8956A]/10 px-3 py-1 rounded-full">
              {format(new Date(currentDate), "EEE dd/MM", { locale: pt })} às {currentTime}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label className="mb-3 block font-semibold text-[#2C3E1F]">Dia da Semana</Label>
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                const newDates = [...selectedDates];
                newDates[index] = date;
                setSelectedDates(newDates);
                // Limpar o horário quando a data muda
                const newTimes = [...selectedTimes];
                newTimes[index] = null;
                setSelectedTimes(newTimes);
              }}
              locale={pt}
              disabled={(date) => {
                if (date < today || date.getDay() === 0) return true;
                // Bloquear agosto EXCETO para serviço de Proprietários
                if (date.getMonth() === 7 && !isOwnerService) return true;
                // Verificar se o dia está bloqueado
                const dateStr = format(date, 'yyyy-MM-dd');
                if (blockedSlots.some(b => b.date === dateStr && !b.time_slot)) return true;
                // Verificar se o dia já foi selecionado em outro calendário
                return selectedDates.some((selectedDate, i) => {
                  if (i === index || !selectedDate) return false;
                  return format(new Date(selectedDate), 'yyyy-MM-dd') === dateStr;
                });
              }}
              className="rounded-md border-0 mx-auto"
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-semibold text-[#2C3E1F]",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent hover:bg-stone-100 rounded-md transition-colors",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-between",
                head_cell: "text-stone-500 rounded-md w-9 font-medium text-[0.8rem]",
                row: "flex w-full mt-2 justify-between",
                cell: "text-center text-sm p-0 relative",
                day: "h-9 w-9 p-0 font-normal hover:bg-[#B8956A]/10 rounded-md transition-colors",
                day_selected: "bg-[#B8956A] text-white hover:bg-[#8B7355] hover:text-white focus:bg-[#B8956A] focus:text-white",
                day_today: "bg-stone-100 text-[#2C3E1F] font-semibold",
                day_outside: "text-stone-400 opacity-50",
                day_disabled: "text-stone-300 opacity-50 hover:bg-transparent cursor-not-allowed",
                day_hidden: "invisible",
              }}
            />
          </div>
          <div>
            <Label className="mb-3 block font-semibold text-[#2C3E1F]">Horário</Label>
            {isLoadingSlots ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-[#B8956A]" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 bg-stone-50 rounded-lg">
                {availableSlots.map((slot) => {
                  const isSelected = currentTime === slot;
                  return (
                    <Button
                      key={slot}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={
                        isSelected
                          ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A] font-semibold shadow-md'
                          : 'border-stone-300 hover:border-[#B8956A] hover:text-[#B8956A] hover:bg-[#B8956A]/5 transition-all bg-white'
                      }
                      onClick={() => {
                        const newTimes = [...selectedTimes];
                        // Permitir deselecionar se já está selecionado
                        if (currentTime === slot) {
                          newTimes[index] = null;
                        } else {
                          newTimes[index] = slot;
                        }
                        setSelectedTimes(newTimes);
                      }}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            )}
            {!isLoadingSlots && currentDate && availableSlots.length === 0 && (
              <div className="text-center py-4 text-sm text-stone-500">
                Sem horários disponíveis para este dia.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NewBookingForm({ user, isBlocked }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedModalidade, setSelectedModalidade] = useState(null); // 'avulso' | 'fixo'
  const [fixoDaysSelected, setFixoDaysSelected] = useState([]); // [{day: 1, time: '10:00'}, ...]
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null); // para Proprietários fixo
  const [avulsoFrequency, setAvulsoFrequency] = useState(1); // 1, 2 ou 3 vezes/semana para avulso
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedPhotoPackage, setSelectedPhotoPackage] = useState(null);
  const [showPhotoVideoDialog, setShowPhotoVideoDialog] = useState(false);
  const [wantsPhotoVideo, setWantsPhotoVideo] = useState(false);

  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stepMeta = [
    { id: 1, label: 'Serviço' },
    { id: 2, label: 'Plano' },
    { id: 3, label: 'Data e Hora' },
    { id: 4, label: 'Confirmação' }
  ];

  // Reset selected time when date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  // Reset selected times when dates array changes
  useEffect(() => {
    const newTimes = [];
    selectedDates.forEach((_, index) => {
      newTimes[index] = selectedTimes[index] || null;
    });
    if (selectedDates.length < selectedTimes.length) {
      setSelectedTimes(newTimes.slice(0, selectedDates.length));
    }
  }, [selectedDates]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const defaultServices = [
    { id: '1', title: t('service_private_title'), price: 45, duration: 60, max_participants: 1, short_description: t('service_private_short') },
    { id: '2', title: t('service_group_title'), price: 30, duration: 60, max_participants: 4, short_description: t('service_group_short') },
    { id: '5', title: t('service_owners_title'), price: null, duration: 30, max_participants: 1, short_description: t('service_owners_short'), is_owner_service: true }
  ];

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }),
    initialData: defaultServices
  });

  const displayServices = (services && services.length > 0) ? services : defaultServices;

  const { data: lessons } = useQuery({
    queryKey: ['lessons', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      try {
        return await base44.entities.Lesson.filter({ date: format(selectedDate, 'yyyy-MM-dd') });
      } catch (e) {
        return [];
      }
    },
    enabled: !!selectedDate,
    initialData: []
  });

  // Buscar aulas para cada data selecionada no plano semanal
  const getLessonsForDate = async (date) => {
    if (!date) return [];
    try {
      const dateStr = format(new Date(date), 'yyyy-MM-dd');
      return await base44.entities.Lesson.filter({ date: dateStr });
    } catch (e) {
      return [];
    }
  };

  const { data: blockedSlots = [] } = useQuery({
    queryKey: ['blocked-slots'],
    queryFn: async () => {
      try {
        return await base44.entities.BlockedSlot.filter({ is_active: true });
      } catch (e) {
        return [];
      }
    }
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const duration = selectedPlan?.duration || selectedService.duration;
      const bookingsToCreate = [];

      // Se tem múltiplos horários (planos com frequency > 1)
      if (selectedPlan?.frequency > 1) {
        for (let i = 0; i < selectedPlan.frequency; i++) {
          const date = selectedDates[i];
          const time = selectedTimes[i];

          if (!date || !time) {
            throw new Error('Por favor selecione todos os horários');
          }

          // Buscar aulas para esta data
          const dateLessons = await base44.entities.Lesson.filter({ date: format(new Date(date), 'yyyy-MM-dd') });

          // Verificar disponibilidade
          const lessonsAtTime = dateLessons.filter(l => l.start_time === time);
          const totalBooked = lessonsAtTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

          if (totalBooked >= 6) {
            throw new Error(`Horário ${time} de ${format(new Date(date), "dd/MM")} indisponível - máximo 6 alunos`);
          }

          // Se for 60 minutos, verificar próxima meia hora
          if (duration === 60) {
            const timeSlots = getTimeSlotsForDay(date.getDay());
            const slotIndex = timeSlots.indexOf(time);
            const nextSlot = timeSlots[slotIndex + 1];

            if (nextSlot) {
              const lessonsAtNextTime = dateLessons.filter(l => l.start_time === nextSlot);
              const totalBookedNext = lessonsAtNextTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

              if (totalBookedNext >= 6) {
                throw new Error(`Horário ${time} de ${format(new Date(date), "dd/MM")} indisponível - próxima meia hora cheia`);
              }
            }
          }

          // Criar ou encontrar a lição
          let lesson = dateLessons.find(l =>
            l.service_id === selectedService.id &&
            l.start_time === time
          );

          if (!lesson) {
            const startTime = new Date(`2000-01-01T${time}:00`);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            lesson = await base44.entities.Lesson.create({
              service_id: selectedService.id,
              date: format(new Date(date), 'yyyy-MM-dd'),
              start_time: time,
              end_time: format(endTime, 'HH:mm'),
              max_spots: 6,
              booked_spots: 0,
              is_owner_service: selectedService.title === 'Proprietários'
            });
          }

          // Se for 60 minutos, criar/atualizar próxima meia hora
          if (duration === 60) {
            const timeSlots = getTimeSlotsForDay(date.getDay());
            const slotIndex = timeSlots.indexOf(time);
            const nextSlot = timeSlots[slotIndex + 1];

            if (nextSlot) {
              let nextLesson = dateLessons.find(l =>
                l.service_id === selectedService.id &&
                l.start_time === nextSlot
              );

              if (!nextLesson) {
                const startTime = new Date(`2000-01-01T${nextSlot}:00`);
                const endTime = new Date(startTime.getTime() + 30 * 60000);

                nextLesson = await base44.entities.Lesson.create({
                  service_id: selectedService.id,
                  date: format(new Date(date), 'yyyy-MM-dd'),
                  start_time: nextSlot,
                  end_time: format(endTime, 'HH:mm'),
                  max_spots: 6,
                  booked_spots: 0,
                  is_owner_service: selectedService.title === 'Proprietários'
                });
              }

              await base44.entities.Lesson.update(nextLesson.id, {
                booked_spots: (nextLesson.booked_spots || 0) + 1
              });
            }
          }

          // Criar reserva (sempre pendente para planos múltiplos)
          const booking = await base44.entities.Booking.create({
            lesson_id: lesson.id,
            client_email: user.email,
            client_name: user.full_name,
            status: 'pending',
            is_owner_booking: selectedService.title === 'Proprietários'
          });

          await base44.entities.Lesson.update(lesson.id, {
            booked_spots: (lesson.booked_spots || 0) + 1
          });

          bookingsToCreate.push({ date, time, booking });
        }

        // Enviar email com todas as reservas
        const bookingsList = bookingsToCreate.map(b =>
          `<li>${format(new Date(b.date), "EEEE, d 'de' MMMM", { locale: pt })} às ${b.time}</li>`
        ).join('');

        await base44.functions.invoke('sendBookingConfirmation', {
          bookingId: bookingsToCreate[0].booking.id,
          lessonId: bookingsToCreate[0].booking.lesson_id,
          clientEmail: user.email,
          clientName: user.full_name,
          lessonDate: format(new Date(bookingsToCreate[0].date), 'yyyy-MM-dd'),
          lessonTime: bookingsToCreate[0].time,
          serviceName: selectedService.title
        });

        return bookingsToCreate;
      } else {
        const isStandardService = selectedService?.title !== 'Proprietários';
        // Aulas fixas: criar todas as reservas para os proximos 1 mês
        if (isStandardService && selectedModalidade === 'fixo') {
          if (!fixoDaysSelected || fixoDaysSelected.length === 0 || fixoDaysSelected.some(s => s.day === null || s.time === null)) {
            throw new Error('Por favor selecione pelo menos um dia e horário');
          }

          const duration = selectedPlan?.duration || 30;
          const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

          // Gerar todas as datas para os proximos 1 mês
          const allDatesToCreate = [];
          for (const sched of fixoDaysSelected) {
            if (sched.day === null || sched.day === undefined) continue;

            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const targetDay = typeof sched.day === 'number' ? sched.day : 0;
            while (start.getDay() !== targetDay) start.setDate(start.getDate() + 1);
            if (start <= new Date()) start.setDate(start.getDate() + 7);

            const end = new Date();
            end.setMonth(end.getMonth() + 1);

            const cur = new Date(start);
            while (cur <= end) {
              allDatesToCreate.push({ date: format(cur, 'yyyy-MM-dd'), time: sched.time, day: sched.day });
              cur.setDate(cur.getDate() + 7);
            }
          }

          // Buscar aulas ja existentes para evitar duplicados
          const existingLessonsForFixo = await base44.entities.Lesson.list('-date', 3000);
          const lsnMapFixo = {};
          for (const l of existingLessonsForFixo) lsnMapFixo[l.date + '_' + l.start_time] = l;

          // Buscar reservas ja existentes
          const existingBookingsFixo = await base44.entities.Booking.filter({ client_email: user.email });
          const bkgSetFixo = new Set(existingBookingsFixo.map(b => b.lesson_id));

          // Criar aulas em falta
          const lessonsToMake = [];
          const pendingKeys = {};
          for (const item of allDatesToCreate) {
            const key = item.date + '_' + item.time;
            if (!lsnMapFixo[key] && !(key in pendingKeys)) {
              pendingKeys[key] = lessonsToMake.length;
              const st = new Date(`2000-01-01T${item.time}:00`);
              const et = new Date(st.getTime() + duration * 60000);
              lessonsToMake.push({
                service_id: selectedService.id,
                date: item.date,
                start_time: item.time,
                end_time: format(et, 'HH:mm'),
                max_spots: 6,
                booked_spots: 0,
                is_auto_generated: true
              });
            }
          }

          // Criar em lotes
          for (let i = 0; i < lessonsToMake.length; i += 10) {
            const batch = lessonsToMake.slice(i, i + 10);
            const created = await base44.entities.Lesson.bulkCreate(batch);
            for (const l of (Array.isArray(created) ? created : [])) {
              if (l && l.id) lsnMapFixo[l.date + '_' + l.start_time] = l;
            }
            if (i + 10 < lessonsToMake.length) await new Promise(r => setTimeout(r, 2000));
          }

          // Criar reservas
          const bookingsToMake = [];
          for (const item of allDatesToCreate) {
            const lesson = lsnMapFixo[item.date + '_' + item.time];
            if (!lesson) continue;
            if (bkgSetFixo.has(lesson.id)) continue;
            bkgSetFixo.add(lesson.id);
            bookingsToMake.push({
              lesson_id: lesson.id,
              client_email: user.email,
              client_name: user.full_name,
              status: 'pending',
              is_fixed_student: true
            });
          }

          for (let i = 0; i < bookingsToMake.length; i += 10) {
            const batch = bookingsToMake.slice(i, i + 10);
            await base44.entities.Booking.bulkCreate(batch);
            if (i + 10 < bookingsToMake.length) await new Promise(r => setTimeout(r, 2000));
          }

          // Atualizar booked_spots em paralelo
          const spotsByLesson = {};
          for (const b of bookingsToMake) spotsByLesson[b.lesson_id] = (spotsByLesson[b.lesson_id] || 0) + 1;
          await Promise.all(Object.entries(spotsByLesson).map(([lessonId, count]) => {
            const l = lsnMapFixo[Object.keys(lsnMapFixo).find(k => lsnMapFixo[k].id === lessonId)];
            return base44.entities.Lesson.update(lessonId, { booked_spots: (l?.booked_spots || 0) + count });
          }));

          // Registar como aluno fixo
          const newSchedule = fixoDaysSelected.map(s => ({ day: dayNames[s.day], time: s.time, duration }));
          const existingStudents = await base44.entities.PicadeiroStudent.filter({ email: user.email });
          if (existingStudents.length > 0) {
            const existing = existingStudents[0];
            const schedule = existing.fixed_schedule || [];
            for (const ns of newSchedule) {
              if (!schedule.some(s => s.day === ns.day && s.time === ns.time)) schedule.push(ns);
            }
            await base44.entities.PicadeiroStudent.update(existing.id, { student_type: 'fixo', fixed_schedule: schedule, is_active: true });
          } else {
            await base44.entities.PicadeiroStudent.create({
              name: user.full_name, email: user.email,
              student_type: 'fixo', fixed_schedule: newSchedule, is_active: true
            });
          }

          return bookingsToMake;
        }

        // Proprietários fixo: criar todas as reservas para os proximos 1 mês
        if (selectedService?.title === 'Proprietários' && selectedModalidade === 'fixo') {
          if (selectedDayOfWeek === null || !selectedTime) {
            throw new Error('Por favor selecione o dia da semana e horário');
          }

          const duration = selectedPlan?.duration || 30;

          // Gerar todas as datas para os proximos 1 mês
          const allDatesToCreate = [];
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          while (start.getDay() !== selectedDayOfWeek) start.setDate(start.getDate() + 1);
          if (start <= new Date()) start.setDate(start.getDate() + 7);

          const end = new Date();
          end.setMonth(end.getMonth() + 1);

          const cur = new Date(start);
          while (cur <= end) {
            allDatesToCreate.push({ date: format(cur, 'yyyy-MM-dd'), time: selectedTime });
            cur.setDate(cur.getDate() + 7);
          }

          // Buscar aulas ja existentes
          const existingLessonsFixo = await base44.entities.Lesson.list('-date', 3000);
          const lsnMapFixo = {};
          for (const l of existingLessonsFixo) lsnMapFixo[l.date + '_' + l.start_time] = l;

          // Buscar reservas ja existentes
          const existingBookingsFixo = await base44.entities.Booking.filter({ client_email: user.email });
          const bkgSetFixo = new Set(existingBookingsFixo.map(b => b.lesson_id));

          // Criar aulas em falta
          const lessonsToMake = [];
          for (const item of allDatesToCreate) {
            const key = item.date + '_' + item.time;
            if (!lsnMapFixo[key]) {
              const st = new Date(`2000-01-01T${item.time}:00`);
              const et = new Date(st.getTime() + duration * 60000);
              lessonsToMake.push({
                service_id: selectedService.id,
                date: item.date,
                start_time: item.time,
                end_time: format(et, 'HH:mm'),
                max_spots: 6,
                booked_spots: 0,
                is_auto_generated: true,
                is_owner_service: true
              });
            }
          }

          // Criar em lotes
          for (let i = 0; i < lessonsToMake.length; i += 10) {
            const batch = lessonsToMake.slice(i, i + 10);
            const created = await base44.entities.Lesson.bulkCreate(batch);
            for (const l of (Array.isArray(created) ? created : [])) {
              if (l && l.id) lsnMapFixo[l.date + '_' + l.start_time] = l;
            }
            if (i + 10 < lessonsToMake.length) await new Promise(r => setTimeout(r, 2000));
          }

          // Criar reservas
          const bookingsToMake = [];
          for (const item of allDatesToCreate) {
            const lesson = lsnMapFixo[item.date + '_' + item.time];
            if (!lesson) continue;
            if (bkgSetFixo.has(lesson.id)) continue;
            bkgSetFixo.add(lesson.id);
            bookingsToMake.push({
              lesson_id: lesson.id,
              client_email: user.email,
              client_name: user.full_name,
              status: 'pending',
              is_owner_booking: true
            });
          }

          // Criar em lotes
          for (let i = 0; i < bookingsToMake.length; i += 10) {
            const batch = bookingsToMake.slice(i, i + 10);
            await base44.entities.Booking.bulkCreate(batch);
            if (i + 10 < bookingsToMake.length) await new Promise(r => setTimeout(r, 2000));
          }

          return bookingsToMake;
        }

        // Reserva para 4 semanas consecutivas
        if (selectedDayOfWeek === null || !selectedTime) {
          throw new Error('Por favor selecione o dia da semana e horário');
        }

        const duration = selectedPlan?.duration || selectedService.duration;

        // Determinar as próximas 4 datas para o dia da semana escolhido
        const allDatesToCreate = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        while (start.getDay() !== selectedDayOfWeek) start.setDate(start.getDate() + 1);
        
        // Se a data de início calhar no próprio dia, verificar se a hora já passou
        if (start.getTime() === new Date(new Date().setHours(0,0,0,0)).getTime()) {
           const now = new Date();
           const currentHourMinute = format(now, 'HH:mm');
           if (selectedTime <= currentHourMinute) {
             // O horário de hoje já passou, começar na próxima semana
             start.setDate(start.getDate() + 7);
           }
        } else if (start <= new Date()) {
           // Fallback de segurança (se por alguma razão start ficar no passado, o que não devia acontecer com o while)
           start.setDate(start.getDate() + 7);
        }

        const cur = new Date(start);
        for (let i = 0; i < 4; i++) {
          allDatesToCreate.push({ date: format(cur, 'yyyy-MM-dd'), time: selectedTime });
          cur.setDate(cur.getDate() + 7);
        }

        // Buscar aulas ja existentes para os próximos 30 dias aproximadamente
        const existingLessons = await base44.entities.Lesson.list('-date', 1000);
        const lsnMap = {};
        for (const l of existingLessons) lsnMap[l.date + '_' + l.start_time] = l;

        const lessonsToMake = [];
        for (const item of allDatesToCreate) {
          const key = item.date + '_' + item.time;
          if (!lsnMap[key]) {
            const st = new Date(`2000-01-01T${item.time}:00`);
            const et = new Date(st.getTime() + duration * 60000);
            lessonsToMake.push({
              service_id: selectedService.id,
              date: item.date,
              start_time: item.time,
              end_time: format(et, 'HH:mm'),
              max_spots: 6,
              booked_spots: 0,
              is_auto_generated: true,
              is_owner_service: selectedService.title === 'Proprietários'
            });
          }
        }

        // Criar aulas em falta em lotes
        for (let i = 0; i < lessonsToMake.length; i += 10) {
          const batch = lessonsToMake.slice(i, i + 10);
          const created = await base44.entities.Lesson.bulkCreate(batch);
          for (const l of (Array.isArray(created) ? created : [])) {
            if (l && l.id) lsnMap[l.date + '_' + l.start_time] = l;
          }
          if (i + 10 < lessonsToMake.length) await new Promise(r => setTimeout(r, 2000));
        }

        // Criar reservas e atualizar booked_spots
        const bookingsToMake = [];
        for (const item of allDatesToCreate) {
          const lesson = lsnMap[item.date + '_' + item.time];
          if (!lesson) continue;
          
          bookingsToMake.push({
            lesson_id: lesson.id,
            client_email: user.email,
            client_name: user.full_name,
            status: selectedService.auto_approve ? 'approved' : 'pending',
            is_owner_booking: selectedService.title === 'Proprietários'
          });
        }

        const createdBookings = [];
        for (let i = 0; i < bookingsToMake.length; i += 10) {
          const batch = bookingsToMake.slice(i, i + 10);
          const result = await base44.entities.Booking.bulkCreate(batch);
          if (Array.isArray(result)) {
            createdBookings.push(...result);
          } else if (result && result.id) {
            createdBookings.push(result);
          }
          if (i + 10 < bookingsToMake.length) await new Promise(r => setTimeout(r, 2000));
        }

        // Atualizar booked_spots para aulas de 30 minutos (aulas iniciais)
        const spotsByLesson = {};
        for (const b of bookingsToMake) spotsByLesson[b.lesson_id] = (spotsByLesson[b.lesson_id] || 0) + 1;
        await Promise.all(Object.entries(spotsByLesson).map(([lessonId, count]) => {
          const l = lsnMap[Object.keys(lsnMap).find(k => lsnMap[k].id === lessonId)];
          return base44.entities.Lesson.update(lessonId, { booked_spots: (l?.booked_spots || 0) + count });
        }));

        // Se a duração for 60 minutos, precisamos tratar a próxima meia hora
        if (duration === 60) {
           const timeSlots = getTimeSlotsForDay(selectedDayOfWeek);
           const slotIndex = timeSlots.indexOf(selectedTime);
           const nextSlot = timeSlots[slotIndex + 1];

           if (nextSlot) {
             const nextLessonsToMake = [];
             for (const item of allDatesToCreate) {
                const key = item.date + '_' + nextSlot;
                if (!lsnMap[key]) {
                  const st = new Date(`2000-01-01T${nextSlot}:00`);
                  const et = new Date(st.getTime() + 30 * 60000);
                  nextLessonsToMake.push({
                    service_id: selectedService.id,
                    date: item.date,
                    start_time: nextSlot,
                    end_time: format(et, 'HH:mm'),
                    max_spots: 6,
                    booked_spots: 0,
                    is_auto_generated: true,
                    is_owner_service: selectedService.title === 'Proprietários'
                  });
                }
             }

             // Criar aulas em falta da próxima meia hora
             for (let i = 0; i < nextLessonsToMake.length; i += 10) {
                const batch = nextLessonsToMake.slice(i, i + 10);
                const created = await base44.entities.Lesson.bulkCreate(batch);
                for (const l of (Array.isArray(created) ? created : [])) {
                  if (l && l.id) lsnMap[l.date + '_' + l.start_time] = l;
                }
                if (i + 10 < nextLessonsToMake.length) await new Promise(r => setTimeout(r, 2000));
             }

             // Atualizar booked spots da próxima meia hora
             const nextSpotsByLesson = {};
             for (const item of allDatesToCreate) {
                const lesson = lsnMap[item.date + '_' + nextSlot];
                if (lesson) {
                   nextSpotsByLesson[lesson.id] = (nextSpotsByLesson[lesson.id] || 0) + 1;
                }
             }
             await Promise.all(Object.entries(nextSpotsByLesson).map(([lessonId, count]) => {
                const l = lsnMap[Object.keys(lsnMap).find(k => lsnMap[k].id === lessonId)];
                return base44.entities.Lesson.update(lessonId, { booked_spots: (l?.booked_spots || 0) + count });
             }));
           }
        }

        // Tentar enviar email de confirmação para a primeira aula
        if (createdBookings.length > 0) {
          const firstBooking = createdBookings[0] || bookingsToMake[0];
          try {
            await base44.functions.invoke('sendBookingConfirmation', {
              bookingId: firstBooking.id || 'bulk',
              lessonId: firstBooking.lesson_id || firstBooking.lessonId,
              clientEmail: user.email,
              clientName: user.full_name,
              lessonDate: allDatesToCreate[0].date,
              lessonTime: selectedTime,
              serviceName: selectedService.title
            });
          } catch (e) {
            console.log('Erro ao enviar email:', e);
          }
        }

        return createdBookings;

      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-bookings']);
      queryClient.invalidateQueries(['lessons']);
      setStep(5);
      toast.success('Reserva criada com sucesso!');
    },
    onError: (error) => {
      toast.error(error?.message || 'Não foi possível concluir a reserva. Tente novamente.');
    }
  });

  const getAvailableSlots = (date = selectedDate, dateLessons = null) => {
    if (!date) return [];

    const dayOfWeek = date.getDay();
    const timeSlots = getTimeSlotsForDay(dayOfWeek);

    if (!selectedService) return timeSlots;

    // Verificar se o dia está bloqueado
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    const dayBlocked = blockedSlots.some(b => b.date === dateStr && !b.time_slot);
    if (dayBlocked) return [];

    // Usar as lições fornecidas ou as lições do dia selecionado
    const lessonsToCheck = dateLessons !== null ? dateLessons : lessons;

    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    const now = new Date();
    const isToday = selectedDay.getTime() === today.getTime();
    const currentTime = format(now, 'HH:mm');

    if (!lessonsToCheck || lessonsToCheck.length === 0) {
      return timeSlots.filter(slot => {
        if (isToday && slot <= currentTime) return false;
        // Verificar se o horário específico está bloqueado
        return !blockedSlots.some(b => b.date === dateStr && b.time_slot === slot);
      });
    }

    const serviceDuration = selectedPlan?.duration || selectedService.duration;

    // Para serviços de 60 minutos, verificar se as duas meias horas estão disponíveis
    return timeSlots.filter(slot => {
      if (isToday && slot <= currentTime) return false;
      // Verificar se o horário específico está bloqueado
      if (blockedSlots.some(b => b.date === dateStr && b.time_slot === slot)) {
        return false;
      }

      const lessonsAtTime = lessonsToCheck.filter(l => l.start_time === slot);
      const totalBooked = lessonsAtTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

      // Máximo 6 alunos por horário (incluindo fixos e avulsos)
      // Se já tem 6 pessoas (fixos + avulsos), bloquear
      if (totalBooked >= 6) {
        return false;
      }

      // Se o serviço dura 60 minutos, verificar a meia hora seguinte
      if (serviceDuration === 60) {
        const slotIndex = timeSlots.indexOf(slot);
        const nextSlot = timeSlots[slotIndex + 1];

        if (nextSlot) {
          const lessonsAtNextTime = lessonsToCheck.filter(l => l.start_time === nextSlot);
          const totalBookedNext = lessonsAtNextTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

          // Se a próxima meia hora tem 6 pessoas (fixos + avulsos), bloquear
          if (totalBookedNext >= 6) return false;
        }
      }

      return true;
    });
  };

  const singleDayAvailableSlots = useMemo(
    () => (selectedDate ? getAvailableSlots(selectedDate) : []),
    [selectedDate, selectedService, selectedPlan, lessons, blockedSlots]
  );

  const selectedWeeklyCount = selectedTimes.filter(Boolean).length;
  const needsWeeklySlots = selectedPlan?.frequency > 1;

  const goToStep2 = () => {
    if (!selectedService) {
      toast.error('Selecione um serviço para continuar.');
      return;
    }
    setStep(2);
  };

  const goToStep3 = () => {
    const isStandardService = selectedService?.title !== 'Proprietários';

    if (isStandardService && !selectedModalidade) {
      toast.error('Por favor escolha entre Aula Avulso ou Aula Fixa.');
      return;
    }

    if (selectedService?.title === 'Proprietários' && !selectedPlan) {
      toast.error('Por favor selecione a duração da sessão.');
      return;
    }

    if (!selectedPlan && selectedService) {
      setSelectedPlan({ label: selectedService.title, price: selectedService.price });
    }
    // Reset para fixo
    if (isStandardService && selectedModalidade === 'fixo') {
      setFixoDaysSelected([]);
    } else {
      // Reset avulso
      setAvulsoFrequency(1);
      setSelectedDayOfWeek(null);
      setSelectedTime(null);
    }
    setStep(3);
  };

  const goToStep4 = () => {
    const isStandardService = selectedService?.title !== 'Proprietários';

    // Aulas fixas: validar seleção de dias
    if (isStandardService && selectedModalidade === 'fixo') {
      if (fixoDaysSelected.length === 0 || fixoDaysSelected.some(d => d.day === null || !d.time)) {
        toast.error('Por favor selecione pelo menos um dia e horário.');
        return;
      }
      setStep(4);
      return;
    }

    // Proprietários fixo: validar dia selecionado
    if (selectedService?.title === 'Proprietários' && selectedModalidade === 'fixo') {
      if (selectedDayOfWeek === null || !selectedTime) {
        toast.error('Por favor selecione um dia da semana e horário.');
        return;
      }
      setStep(4);
      return;
    }

    // Avulso múltiplo
    if (avulsoFrequency > 1) {
      const filledTimes = selectedTimes.filter(Boolean).length;
      const filledDates = selectedDates.filter(Boolean).length;
      if (filledDates < avulsoFrequency || filledTimes < avulsoFrequency) {
        toast.error(`Faltam ${avulsoFrequency - filledTimes} horário(s) para completar.`);
        return;
      }
      setStep(4);
      return;
    }

    // Avulso simples (agora 4 semanas)
    if (selectedDayOfWeek === null) {
      toast.error('Selecione um dia da semana para continuar.');
      return;
    }
    if (!selectedTime) {
      toast.error('Selecione um horário para continuar.');
      return;
    }
    setStep(4);
  }

  if (isBlocked) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 mb-2">{t('account_blocked')}</h3>
            <p className="text-red-700 text-sm">
              {t('debt_warning')} {t('regularize_warning')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-4">
          {t('booking_confirmed')}
        </h2>
        <p className="text-stone-600 mb-8 max-w-md mx-auto">
          {t('booking_confirmation_message')}
        </p>
        <Button
          onClick={() => {
            setStep(1);
            setSelectedService(null);
            setSelectedPlan(null);
            setSelectedTime(null);
            setSelectedTimes([]);
            setSelectedDates([]);
            setSelectedModalidade(null);
            setSelectedDayOfWeek(null);
            setFixoDaysSelected([]);
          }}
          className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
        >
          {t('new_booking')}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-center mb-8 max-w-xl mx-auto">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
              ${step >= s ? 'bg-[#4A5D23] text-white' : 'bg-stone-200 text-stone-500'}`}
            >
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-12 sm:w-20 h-1 mx-2 rounded transition-all
                ${step > s ? 'bg-[#4A5D23]' : 'bg-stone-200'}`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-stone-600 -mt-4 mb-4">
        Passo {step} de 4: {stepMeta[step - 1].label}
      </p>

      <Card className="border-stone-200 bg-white/90">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center justify-between sm:block">
              <span className="text-stone-500">Serviço</span>
              <p className="font-medium text-[#2C3E1F]">{selectedService?.title || 'Por selecionar'}</p>
            </div>
            <div className="flex items-center justify-between sm:block">
              <span className="text-stone-500">Plano</span>
              <p className="font-medium text-[#2C3E1F]">{selectedPlan?.label || 'Por selecionar'}</p>
            </div>
            <div className="flex items-center justify-between sm:block">
              <span className="text-stone-500">Horário</span>
              <p className="font-medium text-[#2C3E1F]">
                {needsWeeklySlots
                  ? `${selectedWeeklyCount}/${selectedPlan?.frequency || 0} selecionados`
                  : selectedTime && selectedDayOfWeek !== null
                    ? `${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][selectedDayOfWeek]} às ${selectedTime}`
                    : 'Por selecionar'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">{t('select_service')}</h2>
          {displayServices.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-stone-500">Nenhum serviço disponível no momento. Por favor contacte-nos.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayServices.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedService?.id === service.id
                        ? 'border-[#B8956A] bg-[#B8956A]/5'
                        : 'border-stone-200 hover:border-[#B8956A]/50'
                      }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-3">{service.title}</h3>
                      <p className="text-sm text-stone-600 line-clamp-2">{service.short_description || service.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={goToStep2}
                  disabled={!selectedService}
                  className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
                >
                  {t('continue')}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Select Plan - simplified */}
      {step === 2 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">{t('select_plan')}</h2>

          {selectedService?.title !== 'Proprietários' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#2C3E1F] mb-3">Tipo de aula</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedModalidade === 'avulso'
                        ? 'border-[#B8956A] bg-[#B8956A]/5'
                        : 'border-stone-200 hover:border-[#B8956A]/50'
                      }`}
                    onClick={() => setSelectedModalidade('avulso')}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">Aula Avulso</h3>
                      <p className="text-sm text-stone-600">Marca uma única aula à escolha</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedModalidade === 'fixo'
                        ? 'border-[#B8956A] bg-[#B8956A]/5'
                        : 'border-stone-200 hover:border-[#B8956A]/50'
                      }`}
                    onClick={() => setSelectedModalidade('fixo')}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">Aula Fixa</h3>
                      <p className="text-sm text-stone-600">Aulas semanais fixas durante 1 mês</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {selectedModalidade && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                      className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedPlan?.duration === 30
                          ? 'border-[#B8956A] bg-[#B8956A]/5'
                          : 'border-stone-200 hover:border-[#B8956A]/50'
                        }`}
                      onClick={() => setSelectedPlan({ label: '30 minutos', duration: 30, frequency: 1 })}
                    >
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">30 minutos</h3>
                        <p className="text-sm text-stone-600">Aula de meia hora</p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedPlan?.duration === 60
                          ? 'border-[#B8956A] bg-[#B8956A]/5'
                          : 'border-stone-200 hover:border-[#B8956A]/50'
                        }`}
                      onClick={() => setSelectedPlan({ label: '60 minutos', duration: 60, frequency: 1 })}
                    >
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">60 minutos</h3>
                        <p className="text-sm text-stone-600">Aula de uma hora</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}

          {selectedService?.title === 'Proprietários' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> As aulas em grupo têm prioridade no agendamento. Os horários para proprietários estão sujeitos à disponibilidade.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedPlan?.duration === 30
                      ? 'border-[#B8956A] bg-[#B8956A]/5'
                      : 'border-stone-200 hover:border-[#B8956A]/50'
                    }`}
                  onClick={() => setSelectedPlan({ label: '30 minutos', price: 0, duration: 30 })}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">30 minutos</h3>
                    <p className="text-sm text-stone-600">Sessão de meia hora</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${selectedPlan?.duration === 60
                      ? 'border-[#B8956A] bg-[#B8956A]/5'
                      : 'border-stone-200 hover:border-[#B8956A]/50'
                    }`}
                  onClick={() => setSelectedPlan({ label: '60 minutos', price: 0, duration: 60 })}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">60 minutos</h3>
                    <p className="text-sm text-stone-600">Sessão de uma hora</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}





          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="border-stone-300">{t('back')}</Button>
            <Button
              onClick={goToStep3}
              disabled={!selectedPlan}
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 3 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">
            {t('select_date_time')}
          </h2>

          {/* Aviso Proprietários */}
          {selectedService?.title === 'Proprietários' && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Nota para Proprietários:</strong> O cavalo deve apresentar-se limpo e equipado antes da aula. Os horários estão sujeitos à disponibilidade após as aulas em grupo.
              </p>
            </div>
          )}

          {/* Aulas Fixo: selecionar dia(s) da semana */}
          {selectedService?.title !== 'Proprietários' && selectedModalidade === 'fixo' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">Selecione os dias da semana e horários para as suas aulas fixas (durante 1 mês).</p>
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayLabel, idx) => {
                const dayNum = idx + 1; // 1=Segunda...6=Sábado
                const selected = fixoDaysSelected.find(s => s.day === dayNum);
                const daySlots = getTimeSlotsForDay(dayNum);
                return (
                  <Card key={dayNum} className={`border-2 transition-all ${selected ? 'border-[#B8956A] bg-[#B8956A]/5' : 'border-stone-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          id={`day-${dayNum}`}
                          checked={!!selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFixoDaysSelected(prev => [...prev, { day: dayNum, time: null }]);
                            } else {
                              setFixoDaysSelected(prev => prev.filter(s => s.day !== dayNum));
                            }
                          }}
                          className="w-4 h-4 accent-[#B8956A]"
                        />
                        <label htmlFor={`day-${dayNum}`} className="font-semibold text-[#2C3E1F] cursor-pointer">{dayLabel}</label>
                      </div>
                      {selected && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {daySlots.map(slot => (
                            <Button
                              key={slot}
                              size="sm"
                              variant={selected.time === slot ? 'default' : 'outline'}
                              className={selected.time === slot
                                ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A] text-xs'
                                : 'border-stone-300 hover:border-[#B8956A] text-xs'
                              }
                              onClick={() => {
                                setFixoDaysSelected(prev => prev.map(s => s.day === dayNum ? { ...s, time: slot } : s));
                              }}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Proprietários Fixo: selecionar dia da semana + horário */}
          {selectedService?.title === 'Proprietários' && selectedModalidade === 'fixo' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">Selecione o dia da semana e o horário para as suas sessões fixas (durante 1 mês).</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayLabel, idx) => {
                  const dayNum = idx + 1;
                  return (
                    <Button
                      key={dayNum}
                      variant={selectedDayOfWeek === dayNum ? 'default' : 'outline'}
                      className={selectedDayOfWeek === dayNum
                        ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A]'
                        : 'border-stone-300 hover:border-[#B8956A]'
                      }
                      onClick={() => { setSelectedDayOfWeek(dayNum); setSelectedTime(null); }}
                    >
                      {dayLabel}
                    </Button>
                  );
                })}
              </div>
              {selectedDayOfWeek !== null && (
                <div>
                  <Label className="mb-2 block font-semibold text-[#2C3E1F]">Horário</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {getTimeSlotsForDay(selectedDayOfWeek).map(slot => (
                      <Button
                        key={slot}
                        size="sm"
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        className={selectedTime === slot
                          ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A] text-xs'
                          : 'border-stone-300 hover:border-[#B8956A] text-xs'
                        }
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Avulso múltiplo (frequency > 1) */}
          {selectedPlan?.frequency > 1 && (
            <div className="space-y-4">
              {Array.from({ length: selectedPlan.frequency }).map((_, index) => (
                <WeeklyLessonSelector
                  key={index}
                  index={index}
                  currentDate={selectedDates[index]}
                  currentTime={selectedTimes[index]}
                  selectedDates={selectedDates}
                  selectedTimes={selectedTimes}
                  setSelectedDates={setSelectedDates}
                  setSelectedTimes={setSelectedTimes}
                  blockedSlots={blockedSlots}
                  getAvailableSlots={getAvailableSlots}
                  getLessonsForDate={getLessonsForDate}
                  isOwnerService={selectedService?.title === 'Proprietários'}
                />
              ))}
            </div>
          )}

          {/* Avulso simples (agora 4 semanas) */}
          {(!selectedModalidade || selectedModalidade === 'avulso') && (!selectedPlan?.frequency || selectedPlan?.frequency === 1) && (
            <Card className="border-2 border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 p-4 bg-[#B8956A]/10 border border-[#B8956A]/20 rounded-lg flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-[#B8956A] mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#2C3E1F]">Reserva Mensal (4 Semanas)</p>
                    <p className="text-xs text-stone-600 mt-1">Ao selecionar um dia e horário, será automaticamente agendado para as próximas 4 semanas consecutivas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-3 block font-semibold text-[#2C3E1F]">Dia da Semana</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((dayLabel, idx) => {
                        const dayNum = idx + 1;
                        return (
                          <Button
                            key={dayNum}
                            variant={selectedDayOfWeek === dayNum ? 'default' : 'outline'}
                            className={selectedDayOfWeek === dayNum
                              ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A] shadow-md transition-all'
                              : 'border-stone-200 hover:border-[#B8956A] text-stone-600 bg-stone-50 hover:bg-white transition-all'
                            }
                            onClick={() => { setSelectedDayOfWeek(dayNum); setSelectedTime(null); }}
                          >
                            {dayLabel}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-3 block font-semibold text-[#2C3E1F]">Horário</Label>
                    {selectedDayOfWeek === null ? (
                      <div className="text-center py-10 bg-stone-50 rounded-lg border border-dashed border-stone-200 text-sm text-stone-500">
                        Selecione um dia da semana para ver os horários.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto p-3 bg-stone-50 rounded-lg border border-stone-100">
                        {getTimeSlotsForDay(selectedDayOfWeek).map(slot => {
                          // Se o dia da semana for hoje, desativar os horários que já passaram
                          const isToday = today.getDay() === selectedDayOfWeek;
                          const now = new Date();
                          const currentHourMinute = format(now, 'HH:mm');
                          const isPast = isToday && slot <= currentHourMinute;

                          return (
                            <Button
                              key={slot}
                              size="sm"
                              disabled={isPast}
                              variant={selectedTime === slot ? 'default' : 'outline'}
                              className={selectedTime === slot
                                ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A] font-semibold shadow-md'
                                : isPast
                                  ? 'border-stone-200 text-stone-300 bg-stone-100 cursor-not-allowed'
                                  : 'border-stone-200 hover:border-[#B8956A] hover:text-[#B8956A] text-stone-600 bg-white hover:bg-stone-50 transition-all'
                              }
                              onClick={() => setSelectedTime(slot)}
                            >
                              {slot}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="border-stone-300">{t('back')}</Button>
            <Button
              onClick={goToStep4}
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
            >
              {t('continue')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">Confirmar Reserva</h2>

          <Card className="border-stone-200 overflow-hidden mb-6">
            <CardHeader className="bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white">
              <CardTitle className="text-xl">Resumo Final</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-stone-200">
                  <span className="text-stone-600">Serviço</span>
                  <span className="font-semibold text-[#2C3E1F]">{selectedService?.title}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-stone-200">
                  <span className="text-stone-600">Plano</span>
                  <span className="font-semibold text-[#2C3E1F]">{selectedPlan?.label}</span>
                </div>
                {selectedModalidade && (
                  <div className="flex justify-between py-3 border-b border-stone-200">
                    <span className="text-stone-600">Modalidade</span>
                    <span className="font-semibold text-[#2C3E1F]">
                      {selectedModalidade === 'fixo' ? 'Aula Fixa (1 mês)' : 'Aula Avulso'}
                    </span>
                  </div>
                )}
                {/* Datas/horários selecionados */}
                {selectedModalidade === 'fixo' && fixoDaysSelected.some(s => s.time) && (() => {
                  const dayNamesDisplay = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                  return (
                    <div className="py-3 border-b border-stone-200">
                      <p className="text-stone-600 mb-2">Horários Fixos</p>
                      {fixoDaysSelected.filter(s => s.time).map((s, i) => (
                        <p key={i} className="font-semibold text-[#2C3E1F]">{dayNamesDisplay[s.day]} às {s.time}</p>
                      ))}
                    </div>
                  );
                })()}
                {selectedModalidade === 'fixo' && selectedService?.title === 'Proprietários' && selectedDayOfWeek !== null && selectedTime && (() => {
                  const dayNamesDisplay = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                  return (
                    <div className="flex justify-between py-3 border-b border-stone-200">
                      <span className="text-stone-600">Horário Fixo</span>
                      <span className="font-semibold text-[#2C3E1F]">{dayNamesDisplay[selectedDayOfWeek]} às {selectedTime}</span>
                    </div>
                  );
                })()}
                {(!selectedModalidade || selectedModalidade === 'avulso') && selectedDayOfWeek !== null && selectedTime && (
                  <>
                    <div className="flex justify-between py-3 border-b border-stone-200">
                      <span className="text-stone-600">Frequência</span>
                      <span className="font-semibold text-[#2C3E1F]">4 semanas consecutivas</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-stone-200">
                      <span className="text-stone-600">Dia e Horário</span>
                      <span className="font-semibold text-[#2C3E1F]">
                        {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][selectedDayOfWeek]} às {selectedTime}
                      </span>
                    </div>
                  </>
                )}
                {selectedPlan?.frequency > 1 && selectedDates.filter(Boolean).length > 0 && (
                  <div className="py-3 border-b border-stone-200">
                    <p className="text-stone-600 mb-2">Aulas Selecionadas</p>
                    {selectedDates.map((date, i) => date && selectedTimes[i] && (
                      <p key={i} className="font-semibold text-[#2C3E1F]">
                        {format(new Date(date), "EEEE, d 'de' MMMM", { locale: pt })} às {selectedTimes[i]}
                      </p>
                    ))}
                  </div>
                )}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    A reserva ficará <strong>pendente de aprovação</strong> pela administração. Receberá confirmação por email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)} className="border-stone-300">{t('back')}</Button>
            <Button
              onClick={() => createBookingMutation.mutate()}
              disabled={createBookingMutation.isPending}
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  A processar...
                </>
              ) : (
                t('confirm_booking')
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}