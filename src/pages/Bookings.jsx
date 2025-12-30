import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarDays, Clock, Users, Euro, 
  CheckCircle, AlertCircle, Loader2, Calendar as CalendarIcon 
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const defaultServices = [
  { id: '1', title: 'Aulas Particulares', price: 45, duration: 60, max_participants: 1 },
  { id: '2', title: 'Aulas em Grupo', price: 30, duration: 60, max_participants: 4 },
  { id: '3', title: 'Hipoterapia', price: 50, duration: 45, max_participants: 1 },
  { id: '4', title: 'Aluguer de Espaço', price: 200, duration: 180, max_participants: 30 }
];

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function Bookings() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState(1);

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: []
  });

  const { data: lessons } = useQuery({
    queryKey: ['lessons', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Lesson.filter({
      date: format(selectedDate, 'yyyy-MM-dd')
    }),
    initialData: []
  });

  const displayServices = services.length > 0 ? services : defaultServices;

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      // Create lesson if it doesn't exist
      let lesson = lessons.find(l => 
        l.service_id === selectedService.id && 
        l.start_time === selectedTime
      );

      if (!lesson) {
        lesson = await base44.entities.Lesson.create({
          service_id: selectedService.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime,
          end_time: format(
            new Date(`2000-01-01T${selectedTime}:00`).getTime() + selectedService.duration * 60000,
            'HH:mm'
          ),
          max_spots: selectedService.max_participants || 4,
          booked_spots: 0
        });
      }

      // Create booking
      const booking = await base44.entities.Booking.create({
        lesson_id: lesson.id,
        client_email: user.email,
        client_name: user.full_name,
        status: selectedService.auto_approve ? 'approved' : 'pending'
      });

      // Update lesson spots
      await base44.entities.Lesson.update(lesson.id, {
        booked_spots: (lesson.booked_spots || 0) + 1
      });

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Reserva ${selectedService.auto_approve ? 'Confirmada' : 'Pendente'} - ${selectedService.title}`,
        body: `
          <h2>Olá ${user.full_name}!</h2>
          <p>A sua reserva foi ${selectedService.auto_approve ? 'confirmada' : 'registada e está pendente de aprovação'}.</p>
          <h3>Detalhes da Reserva</h3>
          <ul>
            <li><strong>Serviço:</strong> ${selectedService.title}</li>
            <li><strong>Data:</strong> ${format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}</li>
            <li><strong>Hora:</strong> ${selectedTime}</li>
            <li><strong>Duração:</strong> ${selectedService.duration} minutos</li>
            <li><strong>Preço:</strong> ${selectedService.price}€</li>
          </ul>
          <p>Obrigado por escolher o Picadeiro Quinta da Horta!</p>
        `
      });

      return booking;
    },
    onSuccess: () => {
      toast.success('Reserva criada com sucesso!');
      queryClient.invalidateQueries(['lessons']);
      setStep(4);
    },
    onError: () => {
      toast.error('Erro ao criar reserva. Tente novamente.');
    }
  });

  const handleBooking = () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    createBookingMutation.mutate();
  };

  const getAvailableSlots = () => {
    const bookedSlots = lessons
      .filter(l => l.service_id === selectedService?.id)
      .map(l => l.start_time);
    
    return timeSlots.filter(slot => !bookedSlots.includes(slot));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative py-24 bg-[#2C3E1F] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A961]/20 
                           rounded-full text-[#C9A961] text-sm font-medium mb-6">
              <CalendarDays className="w-4 h-4" />
              Reservas Online
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Reserve a Sua
              <span className="text-[#C9A961]"> Experiência</span>
            </h1>
            <p className="text-lg text-stone-300 max-w-2xl mx-auto">
              Escolha o serviço, data e horário que melhor se adapta às suas necessidades.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Booking Steps */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= s ? 'bg-[#4A5D23] text-white' : 'bg-stone-200 text-stone-500'}`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-24 sm:w-32 h-1 mx-2 rounded
                    ${step > s ? 'bg-[#4A5D23]' : 'bg-stone-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Service */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">
                1. Escolha o Serviço
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayServices.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer border-2 transition-all hover:shadow-lg ${
                      selectedService?.id === service.id 
                        ? 'border-[#4A5D23] bg-[#4A5D23]/5' 
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg text-[#2C3E1F] mb-2">
                        {service.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                        <span className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          {service.price}€
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Máx. {service.max_participants}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">
                2. Escolha a Data e Hora
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarIcon className="w-5 h-5 text-[#4A5D23]" />
                      Selecione a Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={pt}
                      disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5 text-[#4A5D23]" />
                      Selecione a Hora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {getAvailableSlots().map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? 'default' : 'outline'}
                          className={selectedTime === slot 
                            ? 'bg-[#4A5D23] hover:bg-[#3A4A1B]' 
                            : ''
                          }
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                    {getAvailableSlots().length === 0 && (
                      <p className="text-center text-stone-500 py-8">
                        Não há horários disponíveis para esta data.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">
                3. Confirme a Reserva
              </h2>
              <Card>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-stone-600">Serviço</span>
                      <span className="font-semibold">{selectedService?.title}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-stone-600">Data</span>
                      <span className="font-semibold">
                        {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-stone-600">Hora</span>
                      <span className="font-semibold">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-stone-600">Duração</span>
                      <span className="font-semibold">{selectedService?.duration} minutos</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-stone-600">Preço</span>
                      <span className="font-bold text-xl text-[#4A5D23]">{selectedService?.price}€</span>
                    </div>
                  </div>

                  {!isAuthenticated && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        É necessário fazer login para completar a reserva.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={createBookingMutation.isPending}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      A processar...
                    </>
                  ) : isAuthenticated ? (
                    'Confirmar Reserva'
                  ) : (
                    'Fazer Login para Reservar'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-4">
                Reserva Confirmada!
              </h2>
              <p className="text-stone-600 mb-8 max-w-md mx-auto">
                A sua reserva foi registada com sucesso. Enviámos um email de confirmação 
                para o seu endereço de email.
              </p>
              <Button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedTime(null);
                }}
                className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
              >
                Fazer Nova Reserva
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}