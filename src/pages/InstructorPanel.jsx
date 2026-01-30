import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import InstructorLayout from '@/components/instructor/InstructorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import FixedStudentsManager from '@/components/admin/FixedStudentsManager';
import { 
  CalendarDays, Users, UserCheck, Plus, Edit, Trash2, Search, 
  Clock, Eye, EyeOff, CheckCircle, XCircle, Loader2, AlertCircle, UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { toast } from 'sonner';

const horses = ["Vidre", "Borboleta", "Égua Louza", "U for me", "Faz de conta", "Domino", "Chá", "Árabe", "Floribela", "Joselito"];

export default function InstructorPanel() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  // States para Alunos do Picadeiro
  const [picadeiroDialogOpen, setPicadeiroDialogOpen] = useState(false);
  const [editingPicadeiroStudent, setEditingPicadeiroStudent] = useState(null);
  const [picadeiroSearchQuery, setPicadeiroSearchQuery] = useState('');
  const [picadeiroFormData, setPicadeiroFormData] = useState({
    name: '',
    phone: '',
    email: '',
    assigned_horse: '',
    student_level: 'iniciante',
    notes: ''
  });

  // States para Aulas
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllBookings, setShowAllBookings] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [newLesson, setNewLesson] = useState({
    service_id: '',
    instructor_id: '',
    start_time: '09:00',
    duration: 30,
    client_email: '',
    client_name: ''
  });
  const [selectedAbsentBooking, setSelectedAbsentBooking] = useState(null);
  const [showCompensableDialog, setShowCompensableDialog] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('instructor_keyboard_access');
    if (!hasAccess) {
      window.location.href = createPageUrl('Home');
    }
  }, []);

  // === QUERIES ===
  const { data: picadeiroStudents = [] } = useQuery({
    queryKey: ['picadeiro-students'],
    queryFn: () => base44.entities.PicadeiroStudent.list('-created_date'),
    initialData: []
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-picadeiro-students-for-booking'],
    queryFn: () => base44.entities.PicadeiroStudent.list('-created_date', 500),
    initialData: []
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
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
    queryFn: () => base44.entities.Service.list('-created_date', 100),
    initialData: []
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => base44.entities.Instructor.list('-created_date', 100),
    initialData: []
  });

  // === MUTATIONS PICADEIRO STUDENTS ===
  const createPicadeiroMutation = useMutation({
    mutationFn: (data) => base44.entities.PicadeiroStudent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['picadeiro-students']);
      setPicadeiroDialogOpen(false);
      resetPicadeiroForm();
      toast.success('Aluno criado com sucesso!');
    }
  });

  const updatePicadeiroMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PicadeiroStudent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['picadeiro-students']);
      setPicadeiroDialogOpen(false);
      resetPicadeiroForm();
      toast.success('Aluno atualizado!');
    }
  });

  const deletePicadeiroMutation = useMutation({
    mutationFn: (id) => base44.entities.PicadeiroStudent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['picadeiro-students']);
      toast.success('Aluno removido!');
    }
  });

  // === MUTATIONS AULAS ===
  const createLessonMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.service_id) {
        toast.error('Selecione um serviço');
        throw new Error('Service required');
      }
      
      const duration = data.duration || 30;
      const startTime = new Date(`2000-01-01T${data.start_time}:00`);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      const existingLessonsAtTime = lessons.filter(l => l.start_time === data.start_time);
      const totalBookedAtTime = existingLessonsAtTime.reduce((sum, l) => sum + (l.booked_spots || 0), 0);
      
      if (totalBookedAtTime >= 6) {
        toast.error('Horário indisponível - máximo 6 alunos por meia hora');
        throw new Error('Time slot full');
      }
      
      const lessonData = {
        service_id: data.service_id,
        instructor_id: data.instructor_id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: data.start_time,
        end_time: format(endTime, 'HH:mm'),
        max_spots: 6,
        status: 'scheduled',
        booked_spots: data.client_email ? 1 : 0
      };
      
      const lesson = await base44.entities.Lesson.create(lessonData);
      
      if (data.client_email && data.client_name) {
        await base44.entities.Booking.create({
          lesson_id: lesson.id,
          client_email: data.client_email,
          client_name: data.client_name,
          status: 'approved',
          approved_at: new Date().toISOString()
        });
      }
      
      return lesson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-all-lessons'] });
      setDialogOpen(false);
      setNewLesson({ service_id: '', instructor_id: '', start_time: '09:00', duration: 30, client_email: '', client_name: '' });
      toast.success('Aula criada com sucesso!');
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status, booking }) => {
      const lesson = allLessons.find(l => l.id === booking.lesson_id);
      
      await base44.entities.Booking.update(id, { 
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approved_by: status === 'approved' ? 'instructor' : null
      });

      if (lesson) {
        const allBookingsForLesson = await base44.entities.Booking.filter({ lesson_id: lesson.id });
        const approvedBookings = allBookingsForLesson.filter(b => b.status === 'approved');
        const fixedStudentsCount = approvedBookings.filter(b => b.is_fixed_student).length;
        
        await base44.entities.Lesson.update(lesson.id, {
          booked_spots: approvedBookings.length,
          fixed_students_count: fixedStudentsCount
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-all-lessons'] });
      toast.success('Reserva atualizada!');
    }
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ bookingId, attendance, absenceCompensable }) => {
      const updateData = { 
        attendance_status: attendance,
        attendance: attendance,
        attendance_marked_at: attendance ? new Date().toISOString() : null,
        attendance_marked_by: attendance ? 'instructor' : null
      };
      
      if (attendance === 'absent' && absenceCompensable !== undefined) {
        updateData.absence_compensable = absenceCompensable;
      } else if (attendance === null) {
        updateData.absence_compensable = null;
      }
      
      await base44.entities.Booking.update(bookingId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-lessons'] });
      setShowCompensableDialog(false);
      setSelectedAbsentBooking(null);
      toast.success('Presença marcada com sucesso!');
    }
  });

  // === HELPERS ===
  const resetPicadeiroForm = () => {
    setPicadeiroFormData({
      name: '',
      phone: '',
      email: '',
      assigned_horse: '',
      student_level: 'iniciante',
      notes: ''
    });
    setEditingPicadeiroStudent(null);
  };

  const handleSavePicadeiro = () => {
    if (!picadeiroFormData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingPicadeiroStudent) {
      updatePicadeiroMutation.mutate({ id: editingPicadeiroStudent.id, data: picadeiroFormData });
    } else {
      createPicadeiroMutation.mutate(picadeiroFormData);
    }
  };

  const handleEditPicadeiro = (student) => {
    setEditingPicadeiroStudent(student);
    setPicadeiroFormData({
      name: student.name || '',
      phone: student.phone || '',
      email: student.email || '',
      assigned_horse: student.assigned_horse || '',
      student_level: student.student_level || 'iniciante',
      notes: student.notes || ''
    });
    setPicadeiroDialogOpen(true);
  };

  const handleDeletePicadeiro = (id) => {
    if (confirm('Tem certeza que deseja remover este aluno?')) {
      deletePicadeiroMutation.mutate(id);
    }
  };

  const filteredPicadeiroStudents = picadeiroStudents.filter(s => 
    s.name?.toLowerCase().includes(picadeiroSearchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(picadeiroSearchQuery.toLowerCase()) ||
    s.phone?.includes(picadeiroSearchQuery)
  );

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

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  
  const getPendingBookingsWithLessons = () => {
    return pendingBookings.map(booking => {
      const lesson = allLessons.find(l => l.id === booking.lesson_id);
      return { ...booking, lesson };
    });
  };

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    u.phone?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <InstructorLayout currentPage="InstructorPanel">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            Painel do Instrutor
          </h1>
          <p className="text-stone-600 mt-2">
            Bem-vindo, {user?.full_name || 'Instrutor'} · Ctrl+Shift+8
          </p>
        </div>

        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="lessons">
              <CalendarDays className="w-4 h-4 mr-2" />
              Aulas
            </TabsTrigger>
            <TabsTrigger value="picadeiro">
              <Users className="w-4 h-4 mr-2" />
              Alunos Picadeiro
            </TabsTrigger>
            <TabsTrigger value="fixed">
              <UserCheck className="w-4 h-4 mr-2" />
              Alunos Fixos
            </TabsTrigger>
          </TabsList>

          {/* TAB AULAS */}
          <TabsContent value="lessons" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gestão de Aulas</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#B8956A] hover:bg-[#8B7355] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Aula
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Aula</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-[#4B6382]/10 rounded-lg border-2 border-[#4B6382]/30">
                      <p className="text-sm font-bold text-[#2C3E1F] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Selecionar Cliente (opcional)
                      </p>
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <Input
                            placeholder="Pesquisar por nome ou email..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        <Select 
                          value={newLesson.client_email || undefined}
                          onValueChange={(v) => {
                            const student = allUsers.find(u => (u.email && u.email === v) || (u.phone && u.phone === v));
                            setNewLesson({
                              ...newLesson, 
                              client_email: student?.email || student?.phone || v,
                              client_name: student?.name || ''
                            });
                            setClientSearch('');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar aluno..." />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUsers.length === 0 ? (
                              <SelectItem value="none" disabled>
                                {clientSearch ? 'Nenhum aluno encontrado' : 'Sem alunos disponíveis'}
                              </SelectItem>
                            ) : (
                              filteredUsers.map(u => (
                                <SelectItem key={u.id} value={(u.email || u.phone || u.id)}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{u.name}</span>
                                    <span className="text-xs text-stone-500">{u.email || u.phone || 'Sem contacto'}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        {newLesson.client_email && (
                          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-[#4B6382]">
                            <div className="w-8 h-8 rounded-full bg-[#4B6382] text-white flex items-center justify-center font-bold">
                              {newLesson.client_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-[#2C3E1F]">{newLesson.client_name}</p>
                              <p className="text-xs text-stone-500">{newLesson.client_email}</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setNewLesson({...newLesson, client_email: '', client_name: ''})}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Serviço *</Label>
                      <Select 
                        value={newLesson.service_id || undefined}
                        onValueChange={(v) => setNewLesson({...newLesson, service_id: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Monitor</Label>
                      <Select 
                        value={newLesson.instructor_id || undefined}
                        onValueChange={(v) => setNewLesson({...newLesson, instructor_id: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar monitor (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hora de Início</Label>
                        <Select
                          value={newLesson.start_time}
                          onValueChange={(v) => setNewLesson({...newLesson, start_time: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Duração</Label>
                        <Select
                          value={String(newLesson.duration)}
                          onValueChange={(v) => setNewLesson({...newLesson, duration: parseInt(v)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutos</SelectItem>
                            <SelectItem value="60">60 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={() => createLessonMutation.mutate(newLesson)}
                      disabled={createLessonMutation.isPending}
                      className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
                    >
                      {createLessonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Criar Aula
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {pendingBookings.length > 0 && (
              <Card className="border-amber-300 bg-amber-50/50 shadow-lg">
                <CardHeader className="bg-amber-100">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      Reservas Pendentes
                    </span>
                    <Badge className="bg-amber-600 text-white">{pendingBookings.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {getPendingBookingsWithLessons().map((item) => (
                      <Card key={item.id} className="border-amber-200 bg-white">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-[#2C3E1F] mb-1">{item.client_name}</p>
                              <p className="text-sm text-stone-500 mb-2">{item.client_email}</p>
                              {item.lesson && (
                                <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                                  <span>{format(new Date(item.lesson.date), "d 'de' MMMM", { locale: ptBR })}</span>
                                  <span>{item.lesson.start_time}</span>
                                  <span>{getServiceName(item.lesson.service_id)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-[#4B6382] hover:bg-[#3B5372] text-white"
                                onClick={() => updateBookingMutation.mutate({ id: item.id, status: 'approved', booking: item })}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600"
                                onClick={() => updateBookingMutation.mutate({ id: item.id, status: 'rejected', booking: item })}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
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
              <Card className="lg:col-span-2">
                <CardHeader className="bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <CalendarDays className="w-6 h-6" />
                    Calendário
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="rounded-xl border-0 w-full"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader className="bg-gradient-to-r from-[#4B6382] to-[#5B7392] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </CardTitle>
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
                      <Badge className="bg-white/20 px-4 py-2 text-lg">
                        {lessons.length} aulas
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto max-h-[650px]">
                  {lessonsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
                    </div>
                  ) : lessons.length === 0 ? (
                    <div className="text-center py-16">
                      <CalendarDays className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                      <p className="text-stone-500">Sem aulas para este dia</p>
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
                          <Card key={lesson.id} className={`border-l-4 ${
                            isCompleted ? 'border-l-green-500 bg-green-50/30' :
                            hasPending ? 'border-l-amber-500 bg-amber-50/50' : 
                            isFull ? 'border-l-red-500 bg-red-50/30' : 
                            'border-l-[#4B6382]'
                          }`}>
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white rounded-lg px-3 py-2 font-bold text-lg">
                                    {lesson.start_time}
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg">{getServiceName(lesson.service_id)}</p>
                                    <p className="text-sm text-stone-500">Monitor: {getInstructorName(lesson.instructor_id)}</p>
                                    {attendanceStats.total > 0 && (
                                      <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-green-600">✓ {attendanceStats.present}</span>
                                        <span className="text-xs text-red-600">✗ {attendanceStats.absent}</span>
                                        {attendanceStats.unmarked > 0 && (
                                          <span className="text-xs text-amber-600">⏱ {attendanceStats.unmarked}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className={`text-base px-4 py-2 ${
                                  isFull ? 'bg-red-500' : 
                                  (lesson.booked_spots || 0) > 3 ? 'bg-amber-500' : 'bg-[#4B6382]'
                                } text-white`}>
                                  {lesson.booked_spots || 0}/6
                                </Badge>
                              </div>

                              {showAllBookings && lessonBookings.length > 0 && (
                                <div className="pt-4 border-t space-y-2">
                                  {lessonBookings.map((booking) => (
                                    <div key={booking.id} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                      booking.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                                      booking.status === 'approved' ? 'bg-[#4B6382]/10 border-[#4B6382]/30' :
                                      'bg-stone-50 border-stone-200'
                                    }`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                          booking.status === 'pending' ? 'bg-amber-500' :
                                          booking.status === 'approved' ? 'bg-[#4B6382]' : 'bg-red-500'
                                        }`}>
                                          {booking.client_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-sm">{booking.client_name}</p>
                                          <p className="text-xs text-stone-500">{booking.client_email}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {booking.status === 'pending' ? (
                                          <>
                                            <Button size="sm" className="bg-[#4B6382]" onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'approved', booking })}>
                                              <CheckCircle className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" className="bg-red-600" onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'rejected', booking })}>
                                              <XCircle className="w-4 h-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Badge className={booking.status === 'approved' ? 'bg-[#4B6382] text-white' : 'bg-red-500 text-white'}>
                                              {booking.status === 'approved' ? '✓ Aprovada' : '✗ Rejeitada'}
                                            </Badge>
                                            
                                            {booking.status === 'approved' && (
                                              <div className="flex gap-1">
                                                {(() => {
                                                  const lessonDate = new Date(lesson.date);
                                                  const now = new Date();
                                                  const cutoffTime = new Date(lessonDate);
                                                  cutoffTime.setHours(20, 0, 0, 0);
                                                  const canEdit = now <= cutoffTime;

                                                  const hasMarked = booking.attendance_status || booking.attendance;

                                                  if (hasMarked === 'present') {
                                                    return (
                                                      <div className="flex gap-1">
                                                        <Badge className="bg-green-600 text-white">
                                                          <UserCheck className="w-3 h-3 mr-1" />Presente
                                                        </Badge>
                                                        {canEdit && (
                                                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => markAttendanceMutation.mutate({ bookingId: booking.id, attendance: null })}>
                                                            ✕
                                                          </Button>
                                                        )}
                                                      </div>
                                                    );
                                                  } else if (hasMarked === 'absent') {
                                                    return (
                                                      <div className="flex gap-1">
                                                        <Badge className="bg-red-500 text-white">
                                                          <UserX className="w-3 h-3 mr-1" />Ausente
                                                        </Badge>
                                                        {canEdit && (
                                                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => markAttendanceMutation.mutate({ bookingId: booking.id, attendance: null })}>
                                                            ✕
                                                          </Button>
                                                        )}
                                                      </div>
                                                    );
                                                  } else if (canEdit) {
                                                    return (
                                                      <>
                                                        <Button size="sm" variant="outline" className="h-6 px-2 border-green-500 text-green-600" onClick={() => markAttendanceMutation.mutate({ bookingId: booking.id, attendance: 'present' })}>
                                                          <UserCheck className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-6 px-2 border-red-500 text-red-600" onClick={() => { setSelectedAbsentBooking(booking.id); setShowCompensableDialog(true); }}>
                                                          <UserX className="w-3 h-3" />
                                                        </Button>
                                                      </>
                                                    );
                                                  }
                                                })()}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
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

            <Dialog open={showCompensableDialog} onOpenChange={setShowCompensableDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Marcar como Ausente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p>A ausência é compensável?</p>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-blue-600" onClick={() => markAttendanceMutation.mutate({ bookingId: selectedAbsentBooking, attendance: 'absent', absenceCompensable: true })}>
                      Sim, Compensável
                    </Button>
                    <Button className="flex-1 bg-stone-600" onClick={() => markAttendanceMutation.mutate({ bookingId: selectedAbsentBooking, attendance: 'absent', absenceCompensable: false })}>
                      Não Compensável
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB ALUNOS PICADEIRO */}
          <TabsContent value="picadeiro">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#4A5D23]" />
                    Alunos do Picadeiro ({picadeiroStudents.length})
                  </CardTitle>
                  <Dialog open={picadeiroDialogOpen} onOpenChange={setPicadeiroDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]" onClick={resetPicadeiroForm}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Aluno
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingPicadeiroStudent ? 'Editar Aluno' : 'Criar Novo Aluno'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nome *</Label>
                            <Input
                              value={picadeiroFormData.name}
                              onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Telefone</Label>
                            <Input
                              value={picadeiroFormData.phone}
                              onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={picadeiroFormData.email}
                            onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, email: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Cavalo</Label>
                            <Select value={picadeiroFormData.assigned_horse} onValueChange={(v) => setPicadeiroFormData({ ...picadeiroFormData, assigned_horse: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {horses.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Nível</Label>
                            <Select value={picadeiroFormData.student_level} onValueChange={(v) => setPicadeiroFormData({ ...picadeiroFormData, student_level: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iniciante">Iniciante</SelectItem>
                                <SelectItem value="intermedio">Intermédio</SelectItem>
                                <SelectItem value="avancado">Avançado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Notas</Label>
                          <Textarea value={picadeiroFormData.notes} onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, notes: e.target.value })} rows={3} />
                        </div>
                        <Button onClick={handleSavePicadeiro} className="w-full bg-[#4A5D23]">
                          Guardar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Pesquisar..."
                    value={picadeiroSearchQuery}
                    onChange={(e) => setPicadeiroSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredPicadeiroStudents.length === 0 ? (
                  <div className="text-center py-8">Nenhum aluno encontrado</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPicadeiroStudents.map(student => (
                      <Card key={student.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{student.name}</h3>
                              <Badge variant="outline">{student.student_level}</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditPicadeiro(student)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeletePicadeiro(student.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {student.phone && <p className="text-sm">{student.phone}</p>}
                          {student.email && <p className="text-sm text-stone-500">{student.email}</p>}
                          {student.assigned_horse && <p className="text-sm mt-2">🐴 {student.assigned_horse}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB ALUNOS FIXOS */}
          <TabsContent value="fixed">
            <FixedStudentsManager />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorLayout>
  );
}