import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays, Clock, Users, Euro, 
  CheckCircle, Loader2, AlertCircle 
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function NewBookingForm({ user, isBlocked }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);

  const queryClient = useQueryClient();

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.filter({ is_active: true }),
    initialData: []
  });

  const { data: lessons } = useQuery({
    queryKey: ['lessons', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Lesson.filter({ date: format(selectedDate, 'yyyy-MM-dd') }),
    initialData: []
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
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

      const booking = await base44.entities.Booking.create({
        lesson_id: lesson.id,
        client_email: user.email,
        client_name: user.full_name,
        status: selectedService.auto_approve ? 'approved' : 'pending'
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
      setStep(4);
      toast.success('Reserva criada com sucesso!');
    }
  });

  const getAvailableSlots = () => {
    if (!selectedService) return [];
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
            <h3 className="font-semibold text-red-800 mb-2">Conta Bloqueada</h3>
            <p className="text-red-700 text-sm">
              Não pode fazer novas reservas devido a pagamentos em atraso superiores a 30€. 
              Por favor regularize a sua situação financeira na aba "Pagamentos".
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
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
          Reserva Confirmada!
        </h2>
        <p className="text-stone-600 mb-8 max-w-md mx-auto">
          A sua reserva foi registada. Enviámos um email de confirmação.
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
              ${step >= s ? 'bg-[#4A5D23] text-white' : 'bg-stone-200 text-stone-500'}`}
            >
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-24 sm:w-32 h-1 mx-2 rounded transition-all
                ${step > s ? 'bg-[#4A5D23]' : 'bg-stone-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">Escolha o Serviço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
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
                  <h3 className="font-semibold text-lg text-[#2C3E1F] mb-3">{service.title}</h3>
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
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedService}
              className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">Escolha a Data e Hora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data</CardTitle>
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
                <CardTitle className="text-lg">Hora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {getAvailableSlots().map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      className={selectedTime === slot ? 'bg-[#4A5D23] hover:bg-[#3A4A1B]' : ''}
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
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedTime}
              className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-6">Confirme a Reserva</h2>
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
                <div className="flex justify-between py-3">
                  <span className="text-stone-600">Preço</span>
                  <span className="font-bold text-xl text-[#4A5D23]">{selectedService?.price}€</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button
              onClick={() => createBookingMutation.mutate()}
              disabled={createBookingMutation.isPending}
              className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  A processar...
                </>
              ) : (
                'Confirmar Reserva'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}