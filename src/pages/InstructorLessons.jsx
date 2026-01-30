import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import InstructorLayout from '@/components/instructor/InstructorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays, Clock, Users, 
  CheckCircle, XCircle, Loader2, AlertCircle,
  UserCheck, UserX, Eye, EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { toast } from 'sonner';

export default function InstructorLessons() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllBookings, setShowAllBookings] = useState(false);

  const queryClient = useQueryClient();

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['instructor-lessons', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const result = await base44.entities.Lesson.filter({ date: format(selectedDate, 'yyyy-MM-dd') });
      return result.sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });
    },
    initialData: []
  });

  const { data: allLessons } = useQuery({
    queryKey: ['instructor-all-lessons'],
    queryFn: () => base44.entities.Lesson.list('-created_date', 1000),
    initialData: []
  });

  const { data: bookings } = useQuery({
    queryKey: ['instructor-all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 500),
    initialData: []
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Service.list('-created_date', 100);
        return result || [];
      } catch (error) {
        console.error('Error loading services:', error);
        return [];
      }
    }
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Instructor.list('-created_date', 100);
        return result || [];
      } catch (error) {
        console.error('Error loading instructors:', error);
        return [];
      }
    }
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  
  const getPendingBookingsWithLessons = () => {
    return pendingBookings.map(booking => {
      const lesson = allLessons.find(l => l.id === booking.lesson_id);
      return { ...booking, lesson };
    });
  };

  const getServiceName = (serviceId) => {
    if (!services || !Array.isArray(services)) return 'Serviço não encontrado';
    return services.find(s => s.id === serviceId)?.title || 'Serviço não encontrado';
  };

  const getInstructorName = (instructorId) => {
    if (!instructors || !Array.isArray(instructors)) return 'Não atribuído';
    return instructors.find(i => i.id === instructorId)?.name || 'Não atribuído';
  };

  const getLessonBookings = (lessonId) => {
    if (!bookings || !Array.isArray(bookings)) return [];
    return bookings.filter(b => b.lesson_id === lessonId);
  };

  const getAttendanceStats = (lessonBookings) => {
    const approvedBookings = lessonBookings.filter(b => b.status === 'approved');
    const present = approvedBookings.filter(b => b.attendance_status === 'present' || b.attendance === 'present').length;
    const absent = approvedBookings.filter(b => b.attendance_status === 'absent' || b.attendance === 'absent').length;
    const unmarked = approvedBookings.filter(b => !b.attendance_status && !b.attendance).length;
    
    return { present, absent, unmarked, total: approvedBookings.length };
  };

  const isLessonCompleted = (lesson) => {
    if (!lesson?.date || !lesson?.end_time) return false;
    const lessonDateTime = new Date(`${lesson.date}T${lesson.end_time}:00`);
    return lessonDateTime < new Date();
  };

  return (
    <InstructorLayout currentPage="InstructorLessons">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E1F]">Aulas</h1>
          <p className="text-stone-500">Visualizar aulas e reservas</p>
        </div>

        {/* Pending Bookings Section */}
        {pendingBookings.length > 0 && (
          <Card className="border-amber-300 bg-amber-50/50 shadow-lg">
            <CardHeader className="bg-amber-100">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Reservas Pendentes de Aprovação
                </span>
                <Badge className="bg-amber-600 text-white">
                  {pendingBookings.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getPendingBookingsWithLessons().map((item) => (
                  <Card key={item.id} className="border-amber-200 bg-white">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-amber-500 text-white">Aguarda Aprovação</Badge>
                          </div>
                          <p className="font-semibold text-[#2C3E1F] mb-1">{item.client_name}</p>
                          <p className="text-sm text-stone-500 mb-2">{item.client_email}</p>
                          {item.lesson ? (
                            <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4 text-[#B8956A]" />
                                {format(new Date(item.lesson.date), "d 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-[#B8956A]" />
                                {item.lesson.start_time}
                              </span>
                              <span className="text-stone-500">
                                {getServiceName(item.lesson.service_id)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-400">ID da Aula: {item.lesson_id}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-2 border-stone-200/50 shadow-xl bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white pb-5">
              <CardTitle className="text-xl flex items-center gap-3 font-semibold">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CalendarDays className="w-6 h-6" />
                </div>
                Calendário
              </CardTitle>
              <p className="text-sm text-white/90 mt-1 ml-1">Selecione uma data para ver as aulas</p>
            </CardHeader>
            <CardContent className="p-5">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                className="rounded-xl border-0 w-full"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center mb-5",
                  caption_label: "text-lg font-bold text-[#2C3E1F]",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-9 w-9 bg-stone-100 hover:bg-[#B8956A] hover:text-white rounded-xl transition-all duration-300 border-0 shadow-sm hover:shadow-md",
                  nav_button_previous: "absolute left-0",
                  nav_button_next: "absolute right-0",
                  table: "w-full border-collapse mt-2",
                  head_row: "flex justify-between mb-3",
                  head_cell: "text-stone-500 rounded-lg w-11 font-bold text-xs uppercase tracking-wide",
                  row: "flex w-full mt-1.5 justify-between",
                  cell: "text-center text-sm p-0.5 relative",
                  day: "h-11 w-11 p-0 font-semibold hover:bg-[#B8956A]/15 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md",
                  day_selected: "bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white hover:from-[#8B7355] hover:to-[#6B5845] shadow-lg scale-110 font-bold",
                  day_today: "bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold ring-2 ring-blue-400 ring-offset-2 shadow-lg",
                  day_outside: "text-stone-300 opacity-40",
                  day_disabled: "text-stone-200 opacity-25 hover:bg-transparent cursor-not-allowed hover:scale-100",
                  day_hidden: "invisible",
                }}
              />
              <div className="mt-5 pt-5 border-t-2 border-stone-100">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm"></div>
                    <span className="text-stone-700 font-medium">Hoje</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-[#B8956A] to-[#8B7355] rounded-lg shadow-sm"></div>
                    <span className="text-stone-700 font-medium">Selecionado</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons List */}
          <Card className="lg:col-span-3 border-0 shadow-xl bg-gradient-to-br from-white to-stone-50 overflow-hidden max-h-[800px]">
            <CardHeader className="bg-gradient-to-r from-[#4B6382] to-[#5B7392] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold mb-1">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </CardTitle>
                  <p className="text-white/80 text-sm">
                    {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllBookings(!showAllBookings)}
                    className="text-white hover:bg-white/20"
                  >
                    {showAllBookings ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showAllBookings ? 'Ocultar' : 'Mostrar'} Reservas
                  </Button>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-2xl font-bold">{lessons.length}</span>
                    <span className="text-sm ml-1 text-white/80">aulas</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[650px]">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-12 h-12 text-stone-300" />
                  </div>
                  <p className="text-stone-500 font-medium">Sem aulas agendadas para este dia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson) => {
                    const lessonBookings = getLessonBookings(lesson.id);
                    const hasPending = lessonBookings.some(b => b.status === 'pending');
                    const isFull = (lesson.booked_spots || 0) >= 6;
                    const isCompleted = isLessonCompleted(lesson);
                    const attendanceStats = getAttendanceStats(lessonBookings);
                    return (
                      <Card key={lesson.id} className={`border-l-4 shadow-md hover:shadow-lg transition-all ${
                        isCompleted ? 'border-l-green-500 bg-green-50/30' :
                        hasPending ? 'border-l-amber-500 bg-amber-50/50' : 
                        isFull ? 'border-l-red-500 bg-red-50/30' : 
                        'border-l-[#4B6382] bg-gradient-to-br from-[#4B6382]/5 to-[#4B6382]/15 hover:from-[#4B6382]/10 hover:to-[#4B6382]/20'
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white rounded-lg px-3 py-2 font-bold text-lg shadow-md">
                                  {lesson.start_time}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-[#2C3E1F] text-lg">{getServiceName(lesson.service_id)}</p>
                                  <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                                    <span>Monitor: {getInstructorName(lesson.instructor_id)}</span>
                                    <span className="text-stone-300">•</span>
                                    <span>{lesson.end_time || '--:--'}</span>
                                  </div>
                                  {attendanceStats.total > 0 && (
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="flex items-center gap-1 text-xs">
                                        <UserCheck className="w-3 h-3 text-green-600" />
                                        <span className="text-green-600 font-medium">{attendanceStats.present}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <UserX className="w-3 h-3 text-red-600" />
                                        <span className="text-red-600 font-medium">{attendanceStats.absent}</span>
                                      </div>
                                      {attendanceStats.unmarked > 0 && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <AlertCircle className="w-3 h-3 text-amber-600" />
                                          <span className="text-amber-600 font-medium">{attendanceStats.unmarked} pendente</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isCompleted && (
                                <Badge className="bg-green-600 text-white shadow-lg">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Efetuada
                                </Badge>
                              )}
                              {hasPending && !isCompleted && (
                                <Badge className="bg-amber-500 text-white animate-pulse shadow-lg">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                              <Badge className={`text-base px-4 py-2 font-bold shadow-md ${
                                isFull ? 'bg-red-500 text-white' : 
                                (lesson.booked_spots || 0) > 3 ? 'bg-amber-500 text-white' :
                                'bg-[#4B6382] text-white'
                              }`}>
                                <Users className="w-4 h-4 mr-2" />
                                {lesson.booked_spots || 0}/6
                              </Badge>
                            </div>
                          </div>

                          {showAllBookings && lessonBookings.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-stone-200">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-[#2C3E1F] flex items-center gap-2">
                                  <Users className="w-4 h-4 text-[#B8956A]" />
                                  Reservas ({lessonBookings.length})
                                </p>
                              </div>
                              <div className="space-y-2">
                                {lessonBookings.map((booking) => (
                                  <div key={booking.id} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                    booking.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                                    booking.status === 'approved' ? 'bg-[#4B6382]/10 border-[#4B6382]/30' :
                                    'bg-stone-50 border-stone-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                        booking.status === 'pending' ? 'bg-amber-500' :
                                        booking.status === 'approved' ? 'bg-[#4B6382]' :
                                        booking.status === 'rejected' ? 'bg-red-500' :
                                        'bg-stone-400'
                                      }`}>
                                        {booking.client_name?.charAt(0) || '?'}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-sm text-[#2C3E1F]">{booking.client_name}</p>
                                        <p className="text-xs text-stone-500">{booking.client_email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`font-semibold px-3 py-1 ${
                                        booking.status === 'approved' ? 'bg-[#4B6382] text-white' :
                                        booking.status === 'rejected' ? 'bg-red-500 text-white' :
                                        booking.status === 'pending' ? 'bg-amber-500 text-white' :
                                        'bg-stone-400 text-white'
                                      }`}>
                                        {booking.status === 'approved' ? '✓ Aprovada' :
                                         booking.status === 'rejected' ? '✗ Rejeitada' :
                                         booking.status === 'pending' ? 'Pendente' : 'Cancelada'}
                                      </Badge>
                                      
                                      {booking.status === 'approved' && (booking.attendance_status || booking.attendance) && (
                                        <Badge className={`px-2 py-1 text-xs ${
                                          (booking.attendance_status === 'present' || booking.attendance === 'present') 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-red-500 text-white'
                                        }`}>
                                          {(booking.attendance_status === 'present' || booking.attendance === 'present') 
                                            ? <><UserCheck className="w-3 h-3 mr-1 inline" />Presente</> 
                                            : <><UserX className="w-3 h-3 mr-1 inline" />Ausente</>
                                          }
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </InstructorLayout>
  );
}