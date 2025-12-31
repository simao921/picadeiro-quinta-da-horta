import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import CalendarView from '@/components/calendar/CalendarView';
import EventForm from '@/components/calendar/EventForm';
import SyncCalendarDialog from '@/components/calendar/SyncCalendarDialog';

export default function Calendar() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-start_date'),
    enabled: !!user,
    initialData: []
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings-calendar'],
    queryFn: async () => {
      const bookingsData = await base44.entities.Booking.list('-date');
      return bookingsData.map(b => ({
        ...b,
        isBooking: true,
        title: `Aula: ${b.service_name || 'Reserva'}`,
        start_date: `${b.date}T${b.time_slot}`,
        end_date: `${b.date}T${b.time_slot}`,
        color: '#4A5D23'
      }));
    },
    enabled: !!user,
    initialData: []
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.CalendarEvent.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowForm(false);
      setEditingEvent(null);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, eventData }) => base44.entities.CalendarEvent.update(id, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowForm(false);
      setEditingEvent(null);
    }
  });

  const handleSubmit = (eventData) => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const allEvents = [...events, ...bookings];

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative py-16 bg-[#2D2D2D] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#B8956A] rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
                <span className="text-[#B8956A]">Calendário</span> de Eventos
              </h1>
              <p className="text-stone-300">
                Visualize e gerencie todos os eventos e reservas
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSync(true)}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#2D2D2D]"
              >
                <Download className="w-4 h-4 mr-2" />
                Sincronizar
              </Button>
              <Button
                onClick={() => {
                  setEditingEvent(null);
                  setShowForm(!showForm);
                }}
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Evento
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <EventForm
                event={editingEvent}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
              />
            </motion.div>
          )}

          <CalendarView 
            events={allEvents} 
            onEventClick={(event) => {
              if (!event.isBooking) {
                setEditingEvent(event);
                setShowForm(true);
              }
            }}
          />
        </div>
      </section>

      {showSync && (
        <SyncCalendarDialog 
          events={allEvents}
          onClose={() => setShowSync(false)} 
        />
      )}
    </div>
  );
}