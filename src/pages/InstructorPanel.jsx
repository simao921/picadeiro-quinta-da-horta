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
import { 
  CalendarDays, Users, UserCheck, Plus, Edit, Trash2, Search, 
  Clock, Eye, EyeOff, CheckCircle, XCircle, Loader2, AlertCircle, UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { toast } from 'sonner';

const horses = ["Vidre", "Borboleta", "Égua Louza", "U for me", "Faz de conta", "Domino", "Chá", "Árabe", "Floribela", "Joselito"];
const weekDays = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

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
  const [showAllBookings, setShowAllBookings] = useState(false);

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
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    initialData: []
  });

  const fixedStudentsFromUsers = allUsers.filter(u => u.student_type === 'fixo');
  const fixedStudentsFromPicadeiro = picadeiroStudents.filter(s => s.student_type === 'fixo').map(s => ({
    ...s,
    full_name: s.name,
    email: s.email || s.phone || ''
  }));
  const allFixedStudents = [...fixedStudentsFromUsers, ...fixedStudentsFromPicadeiro];

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

  const getDayName = (day) => {
    const days = {
      'monday': 'Segunda',
      'tuesday': 'Terça',
      'wednesday': 'Quarta',
      'thursday': 'Quinta',
      'friday': 'Sexta',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return days[day] || day;
  };

  const getLevelBadge = (level) => {
    const levels = {
      'iniciante': { bg: 'bg-blue-500', text: 'Iniciante' },
      'intermedio': { bg: 'bg-amber-500', text: 'Intermédio' },
      'avancado': { bg: 'bg-green-600', text: 'Avançado' }
    };
    return levels[level] || { bg: 'bg-stone-500', text: level };
  };

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
                              <Badge className="bg-amber-500 text-white mb-2">Aguarda Aprovação</Badge>
                              <p className="font-semibold text-[#2C3E1F] mb-1">{item.client_name}</p>
                              <p className="text-sm text-stone-500 mb-2">{item.client_email}</p>
                              {item.lesson && (
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
              <Card className="lg:col-span-2 border-2 border-stone-200/50 shadow-xl bg-white overflow-hidden rounded-2xl">
                <CardHeader className="bg-gradient-to-br from-[#B8956A] to-[#8B7355] text-white pb-5">
                  <CardTitle className="text-xl flex items-center gap-3 font-semibold">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <CalendarDays className="w-6 h-6" />
                    </div>
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
                </CardContent>
              </Card>

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
                  {lessonsLoading ? (
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
                            'border-l-[#4B6382] bg-gradient-to-br from-[#4B6382]/5 to-[#4B6382]/15'
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
                                  <div className="space-y-2">
                                    {lessonBookings.map((booking) => (
                                      <div key={booking.id} className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                                        booking.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                                        booking.status === 'approved' ? 'bg-[#4B6382]/10 border-[#4B6382]/30' :
                                        'bg-stone-50 border-stone-200'
                                      }`}>
                                        <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                            booking.status === 'pending' ? 'bg-amber-500' :
                                            booking.status === 'approved' ? 'bg-[#4B6382]' :
                                            'bg-red-500'
                                          }`}>
                                            {booking.client_name?.charAt(0) || '?'}
                                          </div>
                                          <div>
                                            <p className="font-semibold text-sm">{booking.client_name}</p>
                                            <p className="text-xs text-stone-500">{booking.client_email}</p>
                                          </div>
                                        </div>
                                        <Badge className={`font-semibold ${
                                          booking.status === 'approved' ? 'bg-[#4B6382] text-white' :
                                          booking.status === 'pending' ? 'bg-amber-500 text-white' :
                                          'bg-red-500 text-white'
                                        }`}>
                                          {booking.status === 'approved' ? '✓' : booking.status === 'pending' ? '⏱' : '✗'}
                                        </Badge>
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
                          <div className="space-y-2">
                            <Label>Nome *</Label>
                            <Input
                              placeholder="Nome completo"
                              value={picadeiroFormData.name}
                              onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input
                              placeholder="+351 912 345 678"
                              value={picadeiroFormData.phone}
                              onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Email (opcional)</Label>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={picadeiroFormData.email}
                            onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, email: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Cavalo Atribuído</Label>
                            <Select
                              value={picadeiroFormData.assigned_horse}
                              onValueChange={(v) => setPicadeiroFormData({ ...picadeiroFormData, assigned_horse: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar cavalo" />
                              </SelectTrigger>
                              <SelectContent>
                                {horses.map(h => (
                                  <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Nível</Label>
                            <Select
                              value={picadeiroFormData.student_level}
                              onValueChange={(v) => setPicadeiroFormData({ ...picadeiroFormData, student_level: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iniciante">Iniciante</SelectItem>
                                <SelectItem value="intermedio">Intermédio</SelectItem>
                                <SelectItem value="avancado">Avançado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Notas</Label>
                          <Textarea
                            placeholder="Informações adicionais sobre o aluno..."
                            value={picadeiroFormData.notes}
                            onChange={(e) => setPicadeiroFormData({ ...picadeiroFormData, notes: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <Button 
                          onClick={handleSavePicadeiro} 
                          className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                        >
                          Guardar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Pesquisar por nome, email ou telefone..."
                    value={picadeiroSearchQuery}
                    onChange={(e) => setPicadeiroSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredPicadeiroStudents.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">Nenhum aluno encontrado</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPicadeiroStudents.map(student => (
                      <Card key={student.id} className="border-2 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{student.name}</h3>
                              <Badge variant="outline" className="mt-1">{student.student_level}</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPicadeiro(student)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePicadeiro(student.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {student.phone && <p className="text-sm text-stone-600">{student.phone}</p>}
                          {student.email && <p className="text-sm text-stone-500">{student.email}</p>}
                          {student.assigned_horse && (
                            <p className="text-sm text-stone-600 mt-2">🐴 {student.assigned_horse}</p>
                          )}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-[#4A5D23]" />
                  Alunos Fixos ({allFixedStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allFixedStudents.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCheck className="w-12 h-12 text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-medium">Sem alunos fixos registados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {allFixedStudents.map((student) => {
                      const levelBadge = getLevelBadge(student.student_level);
                      return (
                        <Card key={student.id} className="border-2 hover:shadow-lg transition-all">
                          <CardHeader className="bg-gradient-to-br from-[#B8956A]/10 to-[#8B7355]/10">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#B8956A] text-white flex items-center justify-center font-bold text-lg">
                                  {(student.full_name || student.name)?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-[#2C3E1F]">{student.full_name || student.name}</p>
                                  <Badge className={`${levelBadge.bg} text-white mt-1`}>
                                    {levelBadge.text}
                                  </Badge>
                                </div>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            {(student.phone || student.email) && (
                              <div className="space-y-2 text-sm">
                                {student.phone && <p className="text-stone-600">📞 {student.phone}</p>}
                                {student.email && <p className="text-stone-600">✉️ {student.email}</p>}
                              </div>
                            )}

                            {student.assigned_horse && (
                              <div className="p-3 bg-stone-50 rounded-lg">
                                <p className="text-xs text-stone-500 mb-1">Cavalo Atribuído</p>
                                <p className="font-medium text-[#2C3E1F]">🐴 {student.assigned_horse}</p>
                              </div>
                            )}

                            {student.fixed_schedule && student.fixed_schedule.length > 0 && (
                              <div className="pt-4 border-t border-stone-200">
                                <p className="font-semibold text-sm text-[#2C3E1F] mb-3">Horário Fixo</p>
                                <div className="space-y-2">
                                  {student.fixed_schedule.map((schedule, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-[#4B6382]/10 rounded-lg">
                                      <span className="text-sm font-medium text-[#2C3E1F]">
                                        {getDayName(schedule.day)}
                                      </span>
                                      <Badge className="bg-[#B8956A] text-white">
                                        {schedule.time} · {schedule.duration}min
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {student.monthly_fee > 0 && (
                              <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                                <p className="text-xs text-green-700 mb-1">Mensalidade</p>
                                <p className="font-bold text-green-800 text-lg">€{student.monthly_fee}</p>
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
          </TabsContent>
        </Tabs>
      </div>
    </InstructorLayout>
  );
}