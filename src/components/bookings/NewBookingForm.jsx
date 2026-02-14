import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays, Clock, Users, Euro, 
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

// Componente para seleção de aula semanal
function WeeklyLessonSelector({ 
  index, currentDate, currentTime, selectedDates, selectedTimes, 
  setSelectedDates, setSelectedTimes, blockedSlots, getAvailableSlots, getLessonsForDate 
}) {
  const [dateLessons, setDateLessons] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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
                if (date < new Date() || date.getDay() === 0) return true;
                // Bloquear agosto EXCETO para serviço de Proprietários
                if (date.getMonth() === 7 && selectedService?.title !== 'Proprietários') return true;
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
    
    if (!lessonsToCheck || lessonsToCheck.length === 0) {
      return timeSlots.filter(slot => {
        // Verificar se o horário específico está bloqueado
        return !blockedSlots.some(b => b.date === dateStr && b.time_slot === slot);
      });
    }
    
    const serviceDuration = selectedPlan?.duration || selectedService.duration;
    
    // Para serviços de 60 minutos, verificar se as duas meias horas estão disponíveis
    return timeSlots.filter(slot => {
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
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                      selectedService?.id === service.id 
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
                  onClick={() => setStep(2)}
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

      {/* Step 2: Select Plan */}
      {step === 2 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">{t('select_plan')}</h2>
          
          {selectedService?.title === 'Aulas de Escola' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 mb-4">Selecione o plano para alunos fixos. No próximo passo poderá escolher os horários.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { duration: 30, frequency: 1, price: 70, label: '30min - 1x/semana' },
                  { duration: 30, frequency: 2, price: 120, label: '30min - 2x/semana' },
                  { duration: 30, frequency: 3, price: 150, label: '30min - 3x/semana' },
                  { duration: 60, frequency: 1, price: 90, label: '60min - 1x/semana' },
                  { duration: 60, frequency: 2, price: 150, label: '60min - 2x/semana' },
                  { duration: 60, frequency: 3, price: 180, label: '60min - 3x/semana' }
                ].map((plan) => (
                  <Card
                    key={plan.label}
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                      selectedPlan?.label === plan.label 
                        ? 'border-[#B8956A] bg-[#B8956A]/5' 
                        : 'border-stone-200 hover:border-[#B8956A]/50'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">{plan.label}</h3>
                      <p className="text-sm text-stone-600">{plan.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedService?.title === 'Aulas Particulares' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedPlan?.label === 'Com Gilberto Filipe' 
                      ? 'border-[#B8956A] bg-[#B8956A]/5' 
                      : 'border-stone-200 hover:border-[#B8956A]/50'
                  }`}
                  onClick={() => {
                    setSelectedPlan({ label: 'Com Gilberto Filipe', price: 75 });
                    setShowPhotoVideoDialog(true);
                  }}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">Com Gilberto Filipe</h3>
                    <p className="text-sm text-stone-600">Aula particular com Gilberto Filipe</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedPlan?.label === 'Com Monitores/Team' 
                      ? 'border-[#B8956A] bg-[#B8956A]/5' 
                      : 'border-stone-200 hover:border-[#B8956A]/50'
                  }`}
                  onClick={() => setSelectedPlan({ label: 'Com Monitores/Team', price: 50 })}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">Com Monitores/Team</h3>
                    <p className="text-sm text-stone-600">Aula particular com Monitores/Team</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {selectedService?.title === 'Aulas em Grupo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedPlan?.duration === 30 
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
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedPlan?.duration === 60 
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
            </div>
          )}

          {(selectedService?.title === 'Sessões Fotográficas' || selectedService?.title?.toLowerCase().includes('fotográf')) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Pack 10 Fotografias', price: 50 },
                  { label: 'Pack 12 Fotografias', price: 60 },
                  { label: 'Pack 15 Fotografias', price: 70 },
                  { label: 'Pack 20 Fotografias', price: 95 }
                ].map((plan) => (
                  <Card
                    key={plan.label}
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                      selectedPlan?.label === plan.label 
                        ? 'border-[#B8956A] bg-[#B8956A]/5' 
                        : 'border-stone-200 hover:border-[#B8956A]/50'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">{plan.label}</h3>
                      <p className="text-2xl font-bold text-[#B8956A]">{plan.price}€</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedService?.title === 'Serviços de Proprietários' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-[#2C3E1F] mb-3">Em Grupo (com monitores)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { frequency: 1, price: 35, label: 'Grupo - 1x/semana' },
                  { frequency: 2, price: 60, label: 'Grupo - 2x/semana' },
                  { frequency: 3, price: 100, label: 'Grupo - 3x/semana' }
                ].map((plan) => (
                  <Card
                    key={plan.label}
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                      selectedPlan?.label === plan.label 
                        ? 'border-[#B8956A] bg-[#B8956A]/5' 
                        : 'border-stone-200 hover:border-[#B8956A]/50'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">{plan.label}</h3>
                      <p className="text-sm text-stone-600">{plan.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <h3 className="font-semibold text-lg text-[#2C3E1F] mb-3">Individual (com monitores/team)</h3>
              <Card
                className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                  selectedPlan?.label === 'Individual' 
                    ? 'border-[#B8956A] bg-[#B8956A]/5' 
                    : 'border-stone-200 hover:border-[#B8956A]/50'
                }`}
                onClick={() => setSelectedPlan({ label: 'Individual', price: 50 })}
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">Aula Individual</h3>
                  <p className="text-2xl font-bold text-[#B8956A]">50€<span className="text-sm text-stone-500">/aula</span></p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedService?.title === 'Hipoterapia' && (
            <div className="space-y-4">
              <Card className="border-[#B8956A] bg-[#B8956A]/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">Sessão de Hipoterapia</h3>
                  <p className="text-sm text-stone-600 mb-4">Terapia assistida por cavalos com profissionais especializados</p>
                  <p className="text-2xl font-bold text-[#B8956A]">50€<span className="text-sm text-stone-500">/sessão</span></p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Proprietários */}
          {selectedService?.title === 'Proprietários' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> As aulas em grupo têm prioridade no agendamento. Os horários para proprietários estão sujeitos à disponibilidade.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedPlan?.duration === 30 
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
                  className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                    selectedPlan?.duration === 60 
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

          {/* Fallback para outros serviços sem planos específicos */}
          {selectedService && 
           selectedService.title !== 'Aulas de Escola' && 
           selectedService.title !== 'Aulas Particulares' && 
           selectedService.title !== 'Aulas em Grupo' &&
           !selectedService.title?.toLowerCase().includes('fotográf') &&
           selectedService.title !== 'Serviços de Proprietários' &&
           selectedService.title !== 'Proprietários' &&
           selectedService.title !== 'Hipoterapia' && (
            <div className="space-y-4">
              <Card className="border-[#B8956A] bg-[#B8956A]/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">{selectedService.title}</h3>
                  {selectedService.description && (
                    <p className="text-sm text-stone-600 mb-4">{selectedService.description}</p>
                  )}
                  <p className="text-2xl font-bold text-[#B8956A]">{selectedService.price}€</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="border-stone-300">{t('back')}</Button>
            <Button
              onClick={() => {
               if (selectedService?.title === 'Hipoterapia') {
                 setSelectedPlan({ label: 'Sessão de Hipoterapia', price: 50 });
                 setStep(3);
               } else if (selectedService?.title === 'Proprietários' && !selectedPlan) {
                 // Para proprietários, exigir seleção de plano
                 toast.error('Por favor selecione a duração da sessão');
               } else if (!selectedPlan && selectedService) {
                 // Auto-selecionar plano para serviços genéricos
                 setSelectedPlan({ label: selectedService.title, price: selectedService.price });
                 setStep(3);
               } else {
                 setStep(3);
               }
              }}
              disabled={!selectedPlan && selectedService?.title !== 'Hipoterapia' && !selectedService?.price && selectedService?.title !== 'Proprietários'}
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Photo/Video Service Dialog */}
      <Dialog open={showPhotoVideoDialog} onOpenChange={setShowPhotoVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#B8956A]" />
              Serviço Extra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-stone-600">
              Deseja registo de fotos/vídeo da aula?
            </p>
            <div className="p-4 bg-[#B8956A]/10 rounded-lg border border-[#B8956A]/30">
              <p className="font-semibold text-[#2C3E1F]">Valor: 50€</p>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[#4A5D23] hover:bg-[#3A4A1B]"
                onClick={() => {
                  setWantsPhotoVideo(true);
                  setShowPhotoVideoDialog(false);
                }}
              >
                Sim
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setWantsPhotoVideo(false);
                  setShowPhotoVideoDialog(false);
                }}
              >
                Não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 3: Select Date & Time */}
      {step === 3 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">
            {t('select_date_time')}
          </h2>

          {selectedPlan?.frequency > 1 ? (
            <div className="space-y-6">
              <p className="text-stone-600">
                Selecione {selectedPlan.frequency} horários diferentes para as suas aulas semanais
              </p>
{[...Array(selectedPlan.frequency)].map((_, index) => {
                const currentTime = selectedTimes[index];
                const currentDate = selectedDates[index];
                
                return (
                  <WeeklyLessonSelector
                    key={index}
                    index={index}
                    currentDate={currentDate}
                    currentTime={currentTime}
                    selectedDates={selectedDates}
                    selectedTimes={selectedTimes}
                    setSelectedDates={setSelectedDates}
                    setSelectedTimes={setSelectedTimes}
                    blockedSlots={blockedSlots}
                    getAvailableSlots={getAvailableSlots}
                    getLessonsForDate={getLessonsForDate}
                  />
                );
              })}
              <p className="text-sm text-stone-500 italic">
                Nota: As aulas seguintes serão criadas automaticamente nas mesmas horas todas as semanas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-br from-stone-50 to-white border-b border-stone-200">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#B8956A]" />
                    Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={pt}
                    disabled={(date) => {
                      if (date < new Date() || date.getDay() === 0) return true;
                      // Bloquear agosto EXCETO para serviço de Proprietários
                      if (date.getMonth() === 7 && selectedService?.title !== 'Proprietários') return true;
                      return false;
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
                </CardContent>
              </Card>

              <Card className="border-2 border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-br from-stone-50 to-white border-b border-stone-200">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#B8956A]" />
                    Horários Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {!selectedDate ? (
                    <div className="text-center py-8 text-stone-500">
                      <CalendarDays className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <p>Por favor selecione uma data primeiro.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {getAvailableSlots().map((slot) => {
                          const isSelected = selectedTime === slot;
                          return (
                            <Button
                              key={slot}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              className={isSelected
                                ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A] font-semibold shadow-md' 
                                : 'border-stone-300 hover:border-[#B8956A] hover:text-[#B8956A] hover:bg-[#B8956A]/5 transition-all'
                              }
                              onClick={() => {
                                // Permitir deselecionar se já está selecionado
                                if (isSelected) {
                                  setSelectedTime(null);
                                } else {
                                  setSelectedTime(slot);
                                }
                              }}
                            >
                              {slot}
                            </Button>
                          );
                        })}
                      </div>
                      {getAvailableSlots().length === 0 && (
                        <div className="text-center py-8 text-stone-500">
                          <Clock className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                          <p>Não há horários disponíveis para esta data.</p>
                          <p className="text-sm mt-2">Por favor selecione outra data.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="border-stone-300">{t('back')}</Button>
            <Button
              onClick={() => setStep(4)}
              disabled={
                selectedPlan?.frequency > 1
                  ? selectedTimes.filter(Boolean).length !== selectedPlan.frequency
                  : !selectedTime
              }
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white disabled:bg-stone-300"
            >
              {t('continue')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div>
          <h2 className="font-serif text-xl font-bold text-[#2C3E1F] mb-4">{t('confirm_booking')}</h2>
          
          {/* Aviso Geral */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> As aulas devem ser previamente agendadas.
            </p>
          </div>

          {/* Aviso Proprietários */}
          {selectedService?.title === 'Proprietários' && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Nota para Proprietários:</strong> O cavalo deve apresentar-se limpo e equipado antes da aula.
              </p>
            </div>
          )}

          <Card className="border-stone-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#B8956A] to-[#8B7355] text-white">
              <CardTitle className="text-xl">Resumo da Reserva</CardTitle>
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
                
                {selectedPlan?.frequency > 1 ? (
                  <div className="py-3 border-b border-stone-200">
                    <p className="text-stone-600 mb-3">Horários Selecionados</p>
                    <div className="space-y-2">
                      {selectedDates.map((date, index) => selectedTimes[index] && date && (
                        <div key={index} className="flex items-center justify-between p-2 bg-stone-50 rounded">
                          <span className="text-sm font-medium text-[#2C3E1F]">Aula {index + 1}</span>
                          <span className="text-sm text-stone-700">
                            {format(new Date(date), "EEEE, d 'de' MMMM", { locale: pt })} às {selectedTimes[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-3 border-b border-stone-200">
                      <span className="text-stone-600">Data</span>
                      <span className="font-semibold text-[#2C3E1F]">
                        {selectedDate ? format(new Date(selectedDate), "d 'de' MMMM 'de' yyyy", { locale: pt }) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-stone-200">
                      <span className="text-stone-600">Horário</span>
                      <span className="font-semibold text-[#2C3E1F]">{selectedTime || '-'}</span>
                    </div>
                  </>
                )}
                {wantsPhotoVideo && selectedPlan?.label === 'Com Gilberto Filipe' && (
                  <div className="flex justify-between py-3 border-b border-stone-200">
                    <span className="text-stone-600">Registo Fotos/Vídeo</span>
                    <span className="font-semibold text-[#2C3E1F]">Sim</span>
                  </div>
                )}
                
                {selectedPlan?.frequency > 1 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Nota:</strong> As suas reservas ficarão pendentes de aprovação pela administração.
                    </p>
                  </div>
                )}
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