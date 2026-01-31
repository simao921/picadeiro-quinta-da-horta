import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const horses = ["Vidre", "Borboleta", "Égua Louza", "U for me", "Faz de conta", "Domino", "Chá", "Árabe", "Floribela", "Joselito"];

export default function AdminPicadeiroStudents() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    assigned_horse: '',
    student_level: 'iniciante',
    notes: ''
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['picadeiro-students'],
    queryFn: async () => {
      const data = await base44.entities.PicadeiroStudent.list('-created_date');
      return data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PicadeiroStudent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['picadeiro-students']);
      setDialogOpen(false);
      resetForm();
      toast.success('Aluno criado com sucesso!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PicadeiroStudent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['picadeiro-students']);
      setDialogOpen(false);
      resetForm();
      toast.success('Aluno atualizado!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PicadeiroStudent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['picadeiro-students']);
      toast.success('Aluno removido!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      assigned_horse: '',
      student_level: 'iniciante',
      notes: ''
    });
    setEditingStudent(null);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      phone: student.phone || '',
      email: student.email || '',
      assigned_horse: student.assigned_horse || '',
      student_level: student.student_level || 'iniciante',
      notes: student.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja remover este aluno?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  return (
    <AdminLayout currentPage="AdminPicadeiroStudents">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
              <Users className="w-7 h-7 text-[#4A5D23]" />
              Alunos do Picadeiro
            </h1>
            <p className="text-stone-500">{students.length} alunos registados</p>
          </div>
          <Button 
            className="bg-[#4A5D23] hover:bg-[#3A4A1B]"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Aluno
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Pesquisar por nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-stone-500">A carregar...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-stone-500">Nenhum aluno encontrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Cavalo</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.phone && <div>{student.phone}</div>}
                          {student.email && <div className="text-stone-500">{student.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{student.assigned_horse || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.student_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={student.student_type === 'fixo' ? 'bg-[#4A5D23]' : 'bg-stone-500'}>
                          {student.student_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Criar Novo Aluno'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="+351 912 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cavalo Atribuído</Label>
                  <Select
                    value={formData.assigned_horse}
                    onValueChange={(v) => setFormData({ ...formData, assigned_horse: v })}
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
                    value={formData.student_level}
                    onValueChange={(v) => setFormData({ ...formData, student_level: v })}
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
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}