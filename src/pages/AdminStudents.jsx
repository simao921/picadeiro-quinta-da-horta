import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Search, Mail, AlertCircle, CheckCircle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createStudentDialog, setCreateStudentDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const { data: bookings } = useQuery({
    queryKey: ['admin-all-bookings'],
    queryFn: () => base44.entities.Booking.list(),
    initialData: []
  });

  const { data: payments } = useQuery({
    queryKey: ['admin-all-payments'],
    queryFn: () => base44.entities.Payment.list(),
    initialData: []
  });

  const students = users.filter(u => u.role !== 'admin');

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createStudentMutation = useMutation({
    mutationFn: async () => {
      await base44.users.inviteUser(newStudent.email, 'user');
      
      // Atualizar o user com informações adicionais
      const users = await base44.entities.User.filter({ email: newStudent.email });
      if (users.length > 0) {
        await base44.entities.User.update(users[0].id, {
          full_name: newStudent.full_name,
          phone: newStudent.phone
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setCreateStudentDialog(false);
      setNewStudent({ full_name: '', email: '', phone: '' });
      toast.success('Aluno criado e convite enviado!');
    },
    onError: () => {
      toast.error('Erro ao criar aluno');
    }
  });

  const getStudentStats = (email) => {
    const studentBookings = bookings.filter(b => b.client_email === email);
    const studentPayments = payments.filter(p => p.client_email === email);
    const pendingPayments = studentPayments.filter(p => p.status !== 'paid');
    const totalDebt = pendingPayments.reduce((sum, p) => sum + (p.total || p.amount + (p.penalty || 0)), 0);

    return {
      totalBookings: studentBookings.length,
      approvedBookings: studentBookings.filter(b => b.status === 'approved').length,
      totalDebt,
      isBlocked: totalDebt > 30
    };
  };

  return (
    <AdminLayout currentPage="AdminStudents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Alunos</h1>
            <p className="text-stone-500">{students.length} alunos registados</p>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Pesquisar alunos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              className="bg-[#4A5D23] hover:bg-[#3A4A1B] whitespace-nowrap"
              onClick={() => setCreateStudentDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Aluno
            </Button>
          </div>
        </div>

        {/* Students Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B8956A]" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Dívida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const stats = getStudentStats(student.email);
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#B8956A]/10 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-[#B8956A]">
                                {student.full_name?.charAt(0) || student.email?.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{student.full_name || 'Sem nome'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-500">{student.email}</TableCell>
                        <TableCell>{stats.approvedBookings}</TableCell>
                        <TableCell>
                          <span className={stats.totalDebt > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            {stats.totalDebt.toFixed(2)}€
                          </span>
                        </TableCell>
                        <TableCell>
                          {stats.isBlocked ? (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Bloqueado
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Student Details Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Aluno</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#B8956A] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {selectedStudent.full_name?.charAt(0) || selectedStudent.email?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedStudent.full_name || 'Sem nome'}</h3>
                    <p className="text-stone-500">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const stats = getStudentStats(selectedStudent.email);
                    return (
                      <>
                        <Card className="p-4">
                          <p className="text-sm text-stone-500">Total de Reservas</p>
                          <p className="text-2xl font-bold">{stats.totalBookings}</p>
                        </Card>
                        <Card className="p-4">
                          <p className="text-sm text-stone-500">Reservas Aprovadas</p>
                          <p className="text-2xl font-bold">{stats.approvedBookings}</p>
                        </Card>
                        <Card className="p-4">
                          <p className="text-sm text-stone-500">Dívida Atual</p>
                          <p className={`text-2xl font-bold ${stats.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.totalDebt.toFixed(2)}€
                          </p>
                        </Card>
                        <Card className="p-4">
                          <p className="text-sm text-stone-500">Estado da Conta</p>
                          <Badge className={stats.isBlocked ? 'bg-red-100 text-red-800 mt-1' : 'bg-green-100 text-green-800 mt-1'}>
                            {stats.isBlocked ? 'Bloqueada' : 'Ativa'}
                          </Badge>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Student Dialog */}
        <Dialog open={createStudentDialog} onOpenChange={setCreateStudentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone (opcional)</Label>
                <Input
                  type="tel"
                  placeholder="+351 912 345 678"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                />
              </div>
              <Button
                onClick={() => createStudentMutation.mutate()}
                disabled={!newStudent.full_name || !newStudent.email || createStudentMutation.isPending}
                className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
              >
                {createStudentMutation.isPending ? 'A criar...' : 'Criar Aluno'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}