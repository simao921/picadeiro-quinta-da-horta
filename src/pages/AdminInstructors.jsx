import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCog, Plus, Edit, Trash2, Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInstructors() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    photo_url: '',
    email: '',
    phone: '',
    is_champion: false,
    is_active: true,
    specialties: [],
    certifications: []
  });

  const queryClient = useQueryClient();

  const { data: instructors, isLoading } = useQuery({
    queryKey: ['admin-instructors'],
    queryFn: () => base44.entities.Instructor.list(),
    initialData: []
  });

  const createInstructorMutation = useMutation({
    mutationFn: (data) => base44.entities.Instructor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-instructors']);
      setDialogOpen(false);
      resetForm();
      toast.success('Monitor criado!');
    }
  });

  const updateInstructorMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Instructor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-instructors']);
      setDialogOpen(false);
      resetForm();
      toast.success('Monitor atualizado!');
    }
  });

  const deleteInstructorMutation = useMutation({
    mutationFn: (id) => base44.entities.Instructor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-instructors']);
      toast.success('Monitor eliminado!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      bio: '',
      photo_url: '',
      email: '',
      phone: '',
      is_champion: false,
      is_active: true,
      specialties: [],
      certifications: []
    });
    setEditingInstructor(null);
  };

  const openEditDialog = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      name: instructor.name,
      bio: instructor.bio || '',
      photo_url: instructor.photo_url || '',
      email: instructor.email || '',
      phone: instructor.phone || '',
      is_champion: instructor.is_champion || false,
      is_active: instructor.is_active !== false,
      specialties: instructor.specialties || [],
      certifications: instructor.certifications || []
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingInstructor) {
      updateInstructorMutation.mutate({ id: editingInstructor.id, data: formData });
    } else {
      createInstructorMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout currentPage="AdminInstructors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Monitores</h1>
            <p className="text-stone-500">{instructors.length} monitores</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Monitor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingInstructor ? 'Editar Monitor' : 'Novo Monitor'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Biografia</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Sobre o monitor..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL da Foto</Label>
                  <Input
                    value={formData.photo_url}
                    onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Campeão Mundial</Label>
                  <Switch
                    checked={formData.is_champion}
                    onCheckedChange={(v) => setFormData({...formData, is_champion: v})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                  />
                </div>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name || createInstructorMutation.isPending || updateInstructorMutation.isPending}
                  className="w-full bg-[#4A5D23] hover:bg-[#3A4A1B]"
                >
                  {(createInstructorMutation.isPending || updateInstructorMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingInstructor ? 'Atualizar Monitor' : 'Criar Monitor'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Instructors Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#4A5D23]" />
          </div>
        ) : instructors.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UserCog className="w-12 h-12 mx-auto mb-2 text-stone-300" />
              <p className="text-stone-500">Nenhum monitor cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="border-0 shadow-md overflow-hidden">
                <div className="aspect-[4/3] bg-stone-100">
                  {instructor.photo_url ? (
                    <img 
                      src={instructor.photo_url} 
                      alt={instructor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCog className="w-16 h-16 text-stone-300" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{instructor.name}</h3>
                      <div className="flex gap-2 mt-1">
                        {instructor.is_champion && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Award className="w-3 h-3 mr-1" />
                            Campeão
                          </Badge>
                        )}
                        <Badge className={instructor.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'}>
                          {instructor.is_active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {instructor.bio && (
                    <p className="text-sm text-stone-600 line-clamp-2 mb-3">{instructor.bio}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(instructor)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteInstructorMutation.mutate(instructor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}