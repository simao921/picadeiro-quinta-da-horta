import React, { useState } from 'react';
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
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

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

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      // Para proprietários, verificar se já existem 6 alunos nesse horário
      if (selectedService.is_owner_service || selectedService.title === 'Proprietários') {
        const existingLesson = lessons.find(l => l.start_time === selectedTime);
        if (existingLesson && existingLesson.booked_spots >= 6) {
          throw new Error('Horário indisponível - prioridade para alunos (máximo 6 alunos por sessão)');
        }
      }

      let lesson = lessons.find(l => 
        l.service_id === selectedService.id && 
        l.start_time === selectedTime
      );

      // Calcular duração baseado no plano (para proprietários)
      const duration = selectedPlan?.duration || selectedService.duration;

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
          is_owner_service: selectedService.is_owner_service || false
        });
      }

      const booking = await base44.entities.Booking.create({
        lesson_id: lesson.id,
        client_email: user.email,
        client_name: user.full_name,
        status: selectedService.auto_approve ? 'approved' : 'pending',
        is_owner_booking: selectedService.is_owner_service || selectedService.title === 'Proprietários'
      });

      await base44.entities.Lesson.update(lesson.id, {
        booked_spots: (lesson.booked_spots || 0) + 1
      });

      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Reserva ${selectedService.auto_approve ? 'Confirmada' : 'Pendente'} - ${selectedService.title}`,
        body: `
          <h2>Olá ${user.full_name}!</h2>
          <p>A sua reserva foi ${selectedService.auto_approve ? '<strong>confirmada</strong>' : 'registada e está <strong>pendente de aprovação</strong>'}.</p>
          <h3>Detalhes da Reserva</h3>
          <ul>
            <li><strong>Serviço:</strong> ${selectedService.title}</li>
            <li><strong>Data:</strong> ${format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}</li>
            <li><strong>Hora:</strong> ${selectedTime}</li>
            <li><strong>Duração:</strong> ${selectedService.duration} minutos</li>
          </ul>
          <p>Obrigado por escolher o Picadeiro Quinta da Horta!</p>
        `
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-bookings']);
      queryClient.invalidateQueries(['lessons']);
      setStep(5);
      toast.success('Reserva criada com sucesso!');
    }
  });

  const getAvailableSlots = () => {
    if (!selectedService) return timeSlots;
    if (!lessons || lessons.length === 0) return timeSlots;
    
    const bookedSlots = lessons
      .filter(l => l.service_id === selectedService.id && (l.booked_spots >= l.max_spots))
      .map(l => l.start_time);
    
    return timeSlots.filter(slot => !bookedSlots.includes(slot));
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
                      <p className="text-sm text-stone-600 mb-4 line-clamp-2">{service.short_description || service.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                        <span className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-[#B8956A]" />
                          <strong>{t('from_price')} {service.price}€</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-[#B8956A]" />
                          {service.duration} {t('min') || 'min'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-[#B8956A]" />
                          {t('max') || 'Máx.'} {service.max_participants}
                        </span>
                      </div>
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
                      <p className="text-2xl font-bold text-[#B8956A]">{plan.price}€<span className="text-sm text-stone-500">/mês</span></p>
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
                    <p className="text-2xl font-bold text-[#B8956A]">75€<span className="text-sm text-stone-500">/aula</span></p>
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
                    <p className="text-2xl font-bold text-[#B8956A]">50€<span className="text-sm text-stone-500">/aula</span></p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {selectedService?.title === 'Aulas em Grupo' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-[#2C3E1F] mb-3">30 minutos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { frequency: 1, price: 70, label: '1x/semana', duration: 30 },
                  { frequency: 2, price: 120, label: '2x/semana', duration: 30 },
                  { frequency: 3, price: 150, label: '3x/semana', duration: 30 }
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
                      <p className="text-2xl font-bold text-[#B8956A]">{plan.price}€<span className="text-sm text-stone-500">/mês</span></p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <h3 className="font-semibold text-lg text-[#2C3E1F] mb-3">60 minutos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { frequency: 1, price: 90, label: '1x/semana', duration: 60 },
                  { frequency: 2, price: 150, label: '2x/semana', duration: 60 },
                  { frequency: 3, price: 180, label: '3x/semana', duration: 60 }
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
                      <p className="text-2xl font-bold text-[#B8956A]">{plan.price}€<span className="text-sm text-stone-500">/mês</span></p>
                    </CardContent>
                  </Card>
                ))}
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
                      <p className="text-2xl font-bold text-[#B8956A]">{plan.price}€<span className="text-sm text-stone-500">/semana</span></p>
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
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Reservas de proprietários têm prioridade secundária. Se houver muitos alunos no dia escolhido, as reservas de proprietários podem não ser aceites (máximo 6 alunos por sessão).
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
                const currentDate = selectedDates[index] || new Date();
                return (
                  <Card key={index} className="border-stone-200">
                    <CardHeader className="bg-stone-50">
                      <CardTitle className="text-lg flex items-center justify-between">
                        Aula {index + 1}
                        {currentTime && currentDate && (
                          <span className="text-[#B8956A] text-sm font-normal">
                            {format(currentDate, "EEE dd/MM", { locale: pt })} às {currentTime}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Dia da Semana</Label>
                          <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={(date) => {
                              const newDates = [...selectedDates];
                              newDates[index] = date;
                              setSelectedDates(newDates);
                            }}
                            locale={pt}
                            disabled={(date) => date < new Date() || date > addDays(new Date(), 60) || date.getDay() === 0}
                            className="rounded-md border"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Horário</Label>
                          <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                            {getAvailableSlots().map((slot) => {
                              const isSelected = currentTime === slot;
                              const isAlreadyUsed = selectedTimes.includes(slot) && !isSelected;
                              return (
                                <Button
                                  key={slot}
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={isAlreadyUsed}
                                  className={
                                    isSelected
                                      ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A]'
                                      : isAlreadyUsed
                                      ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                                      : 'border-stone-300 hover:border-[#B8956A] hover:text-[#B8956A]'
                                  }
                                  onClick={() => {
                                    const newTimes = [...selectedTimes];
                                    newTimes[index] = slot;
                                    setSelectedTimes(newTimes);
                                  }}
                                >
                                  {slot}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <p className="text-sm text-stone-500 italic">
                Nota: As aulas seguintes serão criadas automaticamente nas mesmas horas todas as semanas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-stone-200">
                <CardHeader className="bg-stone-50">
                  <CardTitle className="text-lg">Data</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={pt}
                    disabled={(date) => date < new Date() || date > addDays(new Date(), 60) || date.getDay() === 0}
                    className="rounded-md border-0"
                  />
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader className="bg-stone-50">
                  <CardTitle className="text-lg">Horários Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-2">
                    {getAvailableSlots().map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        className={selectedTime === slot 
                          ? 'bg-[#B8956A] hover:bg-[#8B7355] text-white border-[#B8956A]' 
                          : 'border-stone-300 hover:border-[#B8956A] hover:text-[#B8956A]'
                        }
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                  {getAvailableSlots().length === 0 && (
                    <div className="text-center py-8 text-stone-500">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <p>Não há horários disponíveis para esta data.</p>
                      <p className="text-sm mt-2">Por favor selecione outra data.</p>
                    </div>
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
          {(selectedService?.title === 'Proprietários' || selectedService?.is_owner_service) && (
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
                <div className="flex justify-between py-3 border-b border-stone-200">
                  <span className="text-stone-600">Data</span>
                  <span className="font-semibold text-[#2C3E1F]">
                    {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-stone-200">
                  <span className="text-stone-600">Hora</span>
                  <span className="font-semibold text-[#2C3E1F]">{selectedTime}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-stone-200">
                  <span className="text-stone-600">Duração</span>
                  <span className="font-semibold text-[#2C3E1F]">{selectedService?.duration} minutos</span>
                </div>
                {wantsPhotoVideo && selectedPlan?.label === 'Com Gilberto Filipe' && (
                  <div className="flex justify-between py-3 border-b border-stone-200">
                    <span className="text-stone-600">Registo Fotos/Vídeo</span>
                    <span className="font-semibold text-[#2C3E1F]">50€</span>
                  </div>
                )}
                <div className="flex justify-between py-4 bg-stone-50 -mx-8 px-8 mt-4">
                  <span className="text-lg font-medium text-stone-700">Total</span>
                  <span className="font-bold text-2xl text-[#B8956A]">
                    {(selectedPlan?.price || 0) + (wantsPhotoVideo && selectedPlan?.label === 'Com Gilberto Filipe' ? 50 : 0)}€
                  </span>
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