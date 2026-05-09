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

const weekdayTimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

const saturdayTimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:30', '15:00', '15:30', '16:00'
];

const weekDays = [
  { id: 1, label: 'Segunda-feira' },
  { id: 2, label: 'Terça-feira' },
  { id: 3, label: 'Quarta-feira' },
  { id: 4, label: 'Quinta-feira' },
  { id: 5, label: 'Sexta-feira' },
  { id: 6, label: 'Sábado' },
];

const getNextDayOfWeek = (dayIndex) => {
  const result = new Date();
  const currentDay = result.getDay(); // 0 is Sunday, 1 is Monday...
  let daysUntil = (dayIndex - currentDay + 7) % 7;
  // Se for hoje, agendar para a próxima semana para garantir disponibilidade
  if (daysUntil === 0) daysUntil = 7;
  result.setDate(result.getDate() + daysUntil);
  result.setHours(0, 0, 0, 0);
  return result;
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
          {currentTime && currentDate && (
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
            const timeSlots = date.getDay() === 6 ? saturdayTimeSlots : weekdayTimeSlots;
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
            const timeSlots = date.getDay() === 6 ? saturdayTimeSlots : weekdayTimeSlots;
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

        /* await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Reservas Registadas - ${selectedService.title}`,
          body: `
            <h2>Olá ${user.full_name}!</h2>
            <p>As suas reservas foram registadas e estão <strong>pendentes de aprovação</strong>.</p>
            <h3>Detalhes das Reservas</h3>
            <ul>
              <li><strong>Serviço:</strong> ${selectedService.title}</li>
              <li><strong>Plano:</strong> ${selectedPlan.label}</li>
              <li><strong>Duração:</strong> ${duration} minutos</li>
            </ul>
            <h3>Horários Selecionados</h3>
            <ul>
              ${bookingsList}
            </ul>
            <p>Aguarde a confirmação da nossa equipa.</p>
            <p>Obrigado por escolher o Picadeiro Quinta da Horta!</p>
          `
        }); */

        return bookingsToCreate;
      } else if (selectedPlan?.isRecurringFourWeeks) {
        // Reserva para as próximas 4 semanas
        if (!selectedTime) throw new Error('Por favor selecione um horário');
        if (!selectedDate) throw new Error('Por favor selecione um dia');

        const bookingsToCreate = [];

        for (let i = 0; i < 4; i++) {
          const targetDate = new Date(selectedDate);
          targetDate.setDate(targetDate.getDate() + (i * 7));
          const dateStr = format(targetDate, 'yyyy-MM-dd');

          // Buscar lições para esta data específica para verificar disponibilidade
          const dateLessons = await base44.entities.Lesson.filter({ date: dateStr });
          const lessonsAtTime = dateLessons.filter(l => l.start_time === selectedTime);
          const totalBooked = lessonsAtTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

          if (totalBooked >= 6) {
            throw new Error(`Horário indisponível na semana ${i + 1} (${format(targetDate, 'dd/MM')}) - máximo de 6 alunos`);
          }

          if (duration === 60) {
            const timeSlots = targetDate.getDay() === 6 ? saturdayTimeSlots : weekdayTimeSlots;
            const slotIndex = timeSlots.indexOf(selectedTime);
            const nextSlot = timeSlots[slotIndex + 1];

            if (nextSlot) {
              const lessonsAtNextTime = dateLessons.filter(l => l.start_time === nextSlot);
              const totalBookedNext = lessonsAtNextTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

              if (totalBookedNext >= 6) {
                throw new Error(`Horário indisponível na semana ${i + 1} (${format(targetDate, 'dd/MM')}) - próxima meia hora cheia`);
              }
            }
          }

          let lesson = dateLessons.find(l =>
            l.service_id === selectedService.id &&
            l.start_time === selectedTime
          );

          if (!lesson) {
            const startTime = new Date(`2000-01-01T${selectedTime}:00`);
            const endTime = new Date(startTime.getTime() + duration * 60000);

            lesson = await base44.entities.Lesson.create({
              service_id: selectedService.id,
              date: dateStr,
              start_time: selectedTime,
              end_time: format(endTime, 'HH:mm'),
              max_spots: 6,
              booked_spots: 0,
              is_owner_service: selectedService.title === 'Proprietários'
            });
          }

          if (duration === 60) {
            const timeSlots = targetDate.getDay() === 6 ? saturdayTimeSlots : weekdayTimeSlots;
            const slotIndex = timeSlots.indexOf(selectedTime);
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
                  date: dateStr,
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

          const booking = await base44.entities.Booking.create({
            lesson_id: lesson.id,
            client_email: user.email,
            client_name: user.full_name,
            status: selectedService.auto_approve ? 'approved' : 'pending',
            is_owner_booking: selectedService.title === 'Proprietários'
          });

          await base44.entities.Lesson.update(lesson.id, {
            booked_spots: (lesson.booked_spots || 0) + 1
          });

          bookingsToCreate.push({ date: targetDate, time: selectedTime, booking });
        }

        // Enviar email com todas as reservas
        try {
          await base44.functions.invoke('sendBookingConfirmation', {
            bookingId: bookingsToCreate[0].booking.id,
            lessonId: bookingsToCreate[0].booking.lesson_id,
            clientEmail: user.email,
            clientName: user.full_name,
            lessonDate: format(new Date(bookingsToCreate[0].date), 'yyyy-MM-dd'),
            lessonTime: bookingsToCreate[0].time,
            serviceName: `${selectedService.title}`
          });
        } catch (e) {
          console.log('Erro ao enviar email:', e);
        }

        return bookingsToCreate;
      } else {
        // Reserva única
        if (!selectedTime) {
          throw new Error('Por favor selecione um horário');
        }

        if (!selectedDate) {
          throw new Error('Por favor selecione uma data');
        }

        const lessonsAtTime = lessons.filter(l => l.start_time === selectedTime);
        const totalBooked = lessonsAtTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

        if (totalBooked >= 6) {
          throw new Error('Horário indisponível - máximo de 6 alunos por meia hora');
        }

        if (duration === 60) {
          const timeSlots = selectedDate.getDay() === 6 ? saturdayTimeSlots : weekdayTimeSlots;
          const slotIndex = timeSlots.indexOf(selectedTime);
          const nextSlot = timeSlots[slotIndex + 1];

          if (nextSlot) {
            const lessonsAtNextTime = lessons.filter(l => l.start_time === nextSlot);
            const totalBookedNext = lessonsAtNextTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);

            if (totalBookedNext >= 6) {
              throw new Error('Horário indisponível - próxima meia hora está cheia (máximo 6 alunos)');
            }
          }
        }

        let lesson = lessons.find(l =>
          l.service_id === selectedService.id &&
          l.start_time === selectedTime
        );

        if (!lesson) {
          const startTime = new Date(`2000-01-01T${selectedTime}:00`);
          const endTime = new Date(startTime.getTime() + duration * 60000);

          lesson = await base44.entities.Lesson.create({
            service_id: selectedService.id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            start_time: selectedTime,
            end_time: format(endTime, 'HH:mm'),
            max_spots: 6,
            booked_spots: 0,
            is_owner_service: selectedService.title === 'Proprietários'
          });
        }

        if (duration === 60) {
          const timeSlots = selectedDate.getDay() === 6 ? saturdayTimeSlots : weekdayTimeSlots;
          const slotIndex = timeSlots.indexOf(selectedTime);
          const nextSlot = timeSlots[slotIndex + 1];

          if (nextSlot) {
            let nextLesson = lessons.find(l =>
              l.service_id === selectedService.id &&
              l.start_time === nextSlot
            );

            if (!nextLesson) {
              const startTime = new Date(`2000-01-01T${nextSlot}:00`);
              const endTime = new Date(startTime.getTime() + 30 * 60000);

              nextLesson = await base44.entities.Lesson.create({
                service_id: selectedService.id,
                date: format(selectedDate, 'yyyy-MM-dd'),
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

        const booking = await base44.entities.Booking.create({
          lesson_id: lesson.id,
          client_email: user.email,
          client_name: user.full_name,
          status: selectedService.auto_approve ? 'approved' : 'pending',
          is_owner_booking: selectedService.title === 'Proprietários'
        });

        // Enviar email de confirmação
        try {
          await base44.functions.invoke('sendBookingConfirmation', {
            bookingId: booking.id,
            lessonId: lesson.id,
            clientEmail: user.email,
            clientName: user.full_name,
            lessonDate: format(selectedDate, 'yyyy-MM-dd'),
            lessonTime: selectedTime,
            serviceName: selectedService.title
          });
        } catch (e) {
          console.log('Erro ao enviar email:', e);
        }

        await base44.entities.Lesson.update(lesson.id, {
          booked_spots: (lesson.booked_spots || 0) + 1
        });

        return booking;
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
    const timeSlots = dayOfWeek === 6 ? saturdayTimeSlots : weekdayTimeSlots;

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
    if (!selectedService) {
      toast.error('Selecione um serviço para continuar.');
      return;
    }

    if (selectedService?.title === 'Hipoterapia') {
      setSelectedPlan({ label: 'Sessão de Hipoterapia', price: 50 });
      setStep(3);
      return;
    }

    if (selectedService?.title === 'Proprietários' && !selectedPlan) {
      toast.error('Por favor selecione a duração da sessão.');
      return;
    }

    if (!selectedPlan && selectedService) {
      setSelectedPlan({ label: selectedService.title, price: selectedService.price });
    }
    setStep(3);
  };

  const goToStep4 = () => {
    if (needsWeeklySlots) {
      if (selectedWeeklyCount !== selectedPlan.frequency) {
        toast.error(`Faltam ${selectedPlan.frequency - selectedWeeklyCount} horário(s) para completar o plano.`);
        return;
      }
      setStep(4);
      return;
    }

    if (!selectedDate) {
      toast.error('Selecione uma data para continuar.');
      return;
    }
    if (!selectedTime) {
      toast.error('Selecione um horário para continuar.');
      return;
    }
    setStep(4);
  };

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
          }}
          className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
        >
          {t('new_booking')}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-stone-200/50 relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#B8956A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#2C3E1F]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Progress Indicator */}
      <div className="mb-12 relative px-4 sm:px-10">
        <div className="flex justify-between relative z-10">
          {[1, 2, 3, 4].map((s) => {
            const isActive = step >= s;
            const isCompleted = step > s;
            return (
              <div key={s} className="flex flex-col items-center group">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isActive ? '#B8956A' : '#f5f5f4',
                    borderColor: isActive ? '#B8956A' : '#e7e5e4',
                    scale: step === s ? 1.1 : 1
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${isActive ? 'text-white shadow-[#B8956A]/20' : 'text-stone-400'
                    }`}
                >
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold text-lg">{s}</span>}
                </motion.div>
                <span className={`mt-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-[#B8956A]' : 'text-stone-400'
                  }`}>
                  {s === 1 ? 'Serviço' : s === 2 ? 'Plano' : s === 3 ? 'Horário' : 'Confirmar'}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-6 left-14 right-14 h-[3px] bg-stone-100 rounded-full -z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-[#B8956A] to-[#8B7355] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / 3) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* Steps Content with AnimatePresence for smooth transitions */}
      <div className="relative min-h-[400px]">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <h2 className="font-serif text-4xl font-bold text-[#2C3E1F] tracking-tight">O que deseja reservar?</h2>
              <p className="text-stone-500 text-lg">Selecione uma das nossas experiências equestres premium</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayServices.map((service) => (
                <motion.div
                  key={service.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`group cursor-pointer border-2 transition-all duration-500 h-full overflow-hidden relative rounded-[2rem] p-1 ${selectedService?.id === service.id
                        ? 'border-[#B8956A] bg-[#B8956A]/5 shadow-2xl shadow-[#B8956A]/10'
                        : 'border-stone-100 hover:border-[#B8956A]/30 hover:shadow-xl'
                      }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 ${selectedService?.id === service.id
                          ? 'bg-[#B8956A] text-white rotate-12 shadow-lg shadow-[#B8956A]/30'
                          : 'bg-stone-50 text-stone-400 group-hover:bg-[#B8956A]/10 group-hover:text-[#B8956A] group-hover:rotate-6'
                        }`}>
                        {service.title.includes('Escola') ? <CalendarDays className="w-7 h-7" /> :
                          service.title.includes('Grupo') ? <Clock className="w-7 h-7" /> :
                            <CheckCircle className="w-7 h-7" />}
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-4 group-hover:text-[#B8956A] transition-colors">{service.title}</h3>
                      <p className="text-stone-500 leading-relaxed mb-6 h-12 overflow-hidden line-clamp-2">
                        {service.short_description || service.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        {service.price > 0 ? (
                          <span className="text-xl font-bold text-[#B8956A]">Desde {service.price}€</span>
                        ) : (
                          <span className="text-stone-400 text-sm italic">Sob consulta</span>
                        )}
                        <motion.div
                          animate={{ x: selectedService?.id === service.id ? 0 : 20, opacity: selectedService?.id === service.id ? 1 : 0 }}
                          className="bg-[#B8956A] p-2 rounded-full text-white"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-end pt-8">
              <Button
                onClick={goToStep2}
                disabled={!selectedService}
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white h-16 px-12 rounded-2xl text-xl font-bold shadow-2xl shadow-[#B8956A]/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
              >
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="space-y-10"
          >
            <div className="text-center space-y-3">
              <h2 className="font-serif text-4xl font-bold text-[#2C3E1F] tracking-tight">Personalize o seu Plano</h2>
              <p className="text-stone-500 text-lg">Detalhes para {selectedService?.title}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logic for different services remains the same but with enhanced UI */}
              {selectedService?.title === 'Aulas de Escola' && [
                { duration: 30, frequency: 1, price: 70, label: '30min - 1x/semana' },
                { duration: 30, frequency: 2, price: 120, label: '30min - 2x/semana' },
                { duration: 30, frequency: 3, price: 150, label: '30min - 3x/semana' },
                { duration: 60, frequency: 1, price: 90, label: '60min - 1x/semana' },
                { duration: 60, frequency: 2, price: 150, label: '60min - 2x/semana' },
                { duration: 60, frequency: 3, price: 180, label: '60min - 3x/semana' }
              ].map((plan) => (
                <Card
                  key={plan.label}
                  className={`cursor-pointer border-2 transition-all duration-300 rounded-[1.5rem] p-1 ${selectedPlan?.label === plan.label
                      ? 'border-[#B8956A] bg-[#B8956A]/5 shadow-xl shadow-[#B8956A]/5'
                      : 'border-stone-100 hover:border-[#B8956A]/30 hover:shadow-lg'
                    }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-[#2C3E1F]">{plan.label}</h3>
                      <p className="text-sm text-stone-500">{plan.duration} min por aula</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#B8956A]">{plan.price}€</p>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">por mês</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {selectedService?.title === 'Aulas Particulares' && (
                <>
                  <Card
                    className={`cursor-pointer border-2 transition-all duration-500 rounded-[2rem] overflow-hidden ${selectedPlan?.label === 'Com Gilberto Filipe'
                        ? 'border-[#B8956A] bg-[#B8956A]/5 shadow-2xl shadow-[#B8956A]/5'
                        : 'border-stone-100 hover:border-[#B8956A]/30 hover:shadow-xl'
                      }`}
                    onClick={() => {
                      setSelectedPlan({ label: 'Com Gilberto Filipe', price: 75, isRecurringFourWeeks: true, duration: 60 });
                      setShowPhotoVideoDialog(true);
                    }}
                  >
                    <div className="h-3 w-full bg-gradient-to-r from-[#B8956A] to-[#8B7355]" />
                    <CardContent className="p-8">
                      <h3 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-3">Gilberto Filipe</h3>
                      <p className="text-stone-500 mb-8 leading-relaxed">Experiência exclusiva com o Mestre. Foco em alta performance.</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[#B8956A]">75€</span>
                        <span className="text-stone-400 font-medium">/aula</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-2 transition-all duration-500 rounded-[2rem] overflow-hidden ${selectedPlan?.label === 'Com Monitores/Team'
                        ? 'border-[#B8956A] bg-[#B8956A]/5 shadow-2xl shadow-[#B8956A]/5'
                        : 'border-stone-100 hover:border-[#B8956A]/30 hover:shadow-xl'
                      }`}
                    onClick={() => setSelectedPlan({ label: 'Com Monitores/Team', price: 50, isRecurringFourWeeks: true, duration: 60 })}
                  >
                    <div className="h-3 w-full bg-stone-100 group-hover:bg-[#B8956A]/20 transition-all" />
                    <CardContent className="p-8">
                      <h3 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-3">Monitores/Team</h3>
                      <p className="text-stone-500 mb-8 leading-relaxed">Acompanhamento técnico premium pela nossa equipa certificada.</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-[#B8956A]">50€</span>
                        <span className="text-stone-400 font-medium">/aula</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {selectedService?.title === 'Aulas em Grupo' && (
                <>
                  <Card
                    className={`cursor-pointer border-2 transition-all duration-500 rounded-[2rem] ${selectedPlan?.duration === 30
                        ? 'border-[#B8956A] bg-[#B8956A]/5 shadow-2xl shadow-[#B8956A]/5'
                        : 'border-stone-100 hover:border-[#B8956A]/30'
                      }`}
                    onClick={() => setSelectedPlan({ label: '30 minutos', duration: 30, frequency: 1, isRecurringFourWeeks: true })}
                  >
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-[#B8956A]">
                        <Clock className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-[#2C3E1F]">30 min</h3>
                      <p className="text-stone-500">Sessão dinâmica e focada</p>
                      <p className="text-4xl font-bold text-[#B8956A]">40€</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-2 transition-all duration-500 rounded-[2rem] ${selectedPlan?.duration === 60
                        ? 'border-[#B8956A] bg-[#B8956A]/5 shadow-2xl shadow-[#B8956A]/5'
                        : 'border-stone-100 hover:border-[#B8956A]/30'
                      }`}
                    onClick={() => setSelectedPlan({ label: '60 minutos', duration: 60, frequency: 1, isRecurringFourWeeks: true })}
                  >
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-[#B8956A]">
                        <Clock className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-[#2C3E1F]">60 min</h3>
                      <p className="text-stone-500">Imersão completa no treino</p>
                      <p className="text-4xl font-bold text-[#B8956A]">60€</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="flex justify-between items-center pt-10 border-t border-stone-100">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-stone-400 hover:text-[#2C3E1F] hover:bg-stone-50 h-14 px-8 rounded-xl font-bold"
              >
                Voltar
              </Button>
              <Button
                onClick={goToStep3}
                disabled={!selectedPlan && selectedService?.title !== 'Hipoterapia' && !selectedService?.price && selectedService?.title !== 'Proprietários'}
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white h-16 px-12 rounded-2xl text-xl font-bold shadow-2xl shadow-[#B8956A]/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              >
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="space-y-10"
          >
            <div className="text-center space-y-3">
              <h2 className="font-serif text-4xl font-bold text-[#2C3E1F] tracking-tight">Quando deseja vir?</h2>
              <p className="text-stone-500 text-lg">Selecione o melhor horário para si</p>
            </div>

            {selectedPlan?.isRecurringFourWeeks && (
              <div className="p-6 bg-[#B8956A]/5 border border-[#B8956A]/20 rounded-3xl flex items-center gap-4">
                <div className="bg-[#B8956A] p-3 rounded-2xl text-white">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm text-[#2C3E1F] leading-relaxed font-medium">
                  Agendamento automático para as próximas <span className="text-[#B8956A] font-bold text-lg">4 semanas</span> no mesmo horário selecionado.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <Card className="border-2 border-stone-100 rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-stone-200/50">
                <CardHeader className="bg-stone-50/80 border-b border-stone-100 p-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-[#2C3E1F]">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <CalendarDays className="w-5 h-5 text-[#B8956A]" />
                    </div>
                    {selectedPlan?.isRecurringFourWeeks ? 'Dia da Semana' : 'Selecione a Data'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {selectedPlan?.isRecurringFourWeeks ? (
                    <div className="grid grid-cols-1 gap-3">
                      {weekDays.map((day) => {
                        const isSelected = selectedDate && selectedDate.getDay() === day.id;
                        return (
                          <motion.div key={day.id} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="outline"
                              className={`w-full h-16 rounded-2xl justify-start px-6 transition-all duration-300 ${isSelected
                                  ? 'bg-[#B8956A] text-white border-[#B8956A] shadow-lg shadow-[#B8956A]/30'
                                  : 'border-stone-100 hover:border-[#B8956A]/30 hover:bg-[#B8956A]/5 text-[#2C3E1F] font-bold'
                                }`}
                              onClick={() => setSelectedDate(getNextDayOfWeek(day.id))}
                            >
                              <div className={`p-2 rounded-lg mr-4 ${isSelected ? 'bg-white/20' : 'bg-stone-50 text-[#B8956A]'}`}>
                                <CalendarDays className="w-4 h-4" />
                              </div>
                              <span className="flex-1 text-left">{day.label}</span>
                              {isSelected && (
                                <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                                  Inicia {format(selectedDate, "dd/MM")}
                                </span>
                              )}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={pt}
                      disabled={(date) => {
                        if (date < today || date.getDay() === 0) return true;
                        if (date.getMonth() === 7 && selectedService?.title !== 'Proprietários') return true;
                        return false;
                      }}
                      className="mx-auto"
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-stone-100 rounded-[2rem] overflow-hidden bg-white shadow-xl shadow-stone-200/50">
                <CardHeader className="bg-stone-50/80 border-b border-stone-100 p-6">
                  <CardTitle className="text-xl flex items-center gap-3 text-[#2C3E1F]">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Clock className="w-5 h-5 text-[#B8956A]" />
                    </div>
                    Horários
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {!selectedDate ? (
                    <div className="text-center py-20 space-y-4">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
                        <CalendarDays className="w-8 h-8" />
                      </div>
                      <p className="text-stone-400 font-medium">Selecione o dia primeiro</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {singleDayAvailableSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <motion.div key={slot} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant={isSelected ? 'default' : 'outline'}
                              className={`w-full h-14 rounded-xl transition-all duration-300 font-bold ${isSelected
                                  ? 'bg-[#2C3E1F] text-white border-[#2C3E1F] shadow-lg'
                                  : 'border-stone-100 hover:border-[#B8956A] hover:bg-[#B8956A]/5'
                                }`}
                              onClick={() => setSelectedTime(isSelected ? null : slot)}
                            >
                              {slot}
                            </Button>
                          </motion.div>
                        );
                      })}
                      {singleDayAvailableSlots.length === 0 && (
                        <div className="col-span-full py-10 text-center text-stone-400 italic">
                          Não existem horários disponíveis para este dia.
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center pt-10 border-t border-stone-100">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="text-stone-400 hover:text-[#2C3E1F] hover:bg-stone-50 h-14 px-8 rounded-xl font-bold"
              >
                Voltar
              </Button>
              <Button
                onClick={goToStep4}
                disabled={!selectedTime}
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white h-16 px-12 rounded-2xl text-xl font-bold shadow-2xl shadow-[#B8956A]/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              >
                Rever Reserva
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="text-center space-y-3">
              <h2 className="font-serif text-4xl font-bold text-[#2C3E1F] tracking-tight">Quase pronto!</h2>
              <p className="text-stone-500 text-lg">Confirme os detalhes da sua reserva de luxo</p>
            </div>

            <Card className="border-none rounded-[2.5rem] bg-gradient-to-br from-[#2C3E1F] to-[#1A2613] text-white overflow-hidden shadow-2xl">
              <CardContent className="p-10 space-y-8 relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <CheckCircle className="w-40 h-40" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Serviço</p>
                      <h3 className="text-2xl font-serif font-bold">{selectedService?.title}</h3>
                    </div>
                    <div className="space-y-1">
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Plano Selecionado</p>
                      <p className="text-xl font-semibold text-[#B8956A]">{selectedPlan?.label}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Datas do Agendamento</p>
                      {selectedPlan?.isRecurringFourWeeks ? (
                        <div className="space-y-3">
                          {[0, 1, 2, 3].map((i) => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + i * 7);
                            return (
                              <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                <CheckCircle className="w-4 h-4 text-[#B8956A]" />
                                <span className="text-sm font-medium">
                                  {format(d, "EEEE, d 'de' MMMM", { locale: pt })} às {selectedTime}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                          <Clock className="w-6 h-6 text-[#B8956A]" />
                          <div>
                            <p className="text-lg font-semibold">
                              {selectedDate && format(new Date(selectedDate), "EEEE, d 'de' MMMM", { locale: pt })}
                            </p>
                            <p className="text-[#B8956A] font-bold tracking-widest text-sm uppercase">às {selectedTime}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-stone-400 text-xs font-black uppercase tracking-[0.3em] mb-1">Total da Reserva</p>
                    <p className="text-4xl font-serif font-black text-white">€{selectedPlan?.price || '0.00'}</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#B8956A] hover:bg-white hover:text-[#11180D] text-white h-20 px-16 rounded-2xl text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      'Confirmar e Agendar'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="ghost"
              onClick={() => setStep(3)}
              className="text-stone-500 hover:text-[#2C3E1F] font-black uppercase tracking-widest text-xs h-14 mx-auto block"
            >
              ← Voltar para seleção de horário
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

