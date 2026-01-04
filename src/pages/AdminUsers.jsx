import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Shield, UserPlus, Trash2, Mail, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        const result = await base44.entities.User.list('-created_date', 500);
        return result || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      return await base44.users.inviteUser(email, role);
    },
    onSuccess: () => {
      toast.success('Convite enviado!');
      setInviteEmail('');
      setDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error('Erro ao enviar convite: ' + error.message);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      await base44.entities.User.update(userId, { role: newRole });
      return { userId, newRole };
    },
    onSuccess: async (data) => {
      await refetch();
      const roleNames = { user: 'Cliente', monitor: 'Monitor', owner: 'Proprietário', developer: 'Developer' };
      toast.success(`Utilizador agora é ${roleNames[data.newRole]}!`);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Erro ao atualizar permissões');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
      return userId;
    },
    onSuccess: async () => {
      await refetch();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success('Utilizador removido com sucesso!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Erro ao remover utilizador');
    }
  });

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: users.length,
    owners: users.filter(u => u.role === 'owner').length,
    monitors: users.filter(u => u.role === 'monitor').length,
    developers: users.filter(u => u.role === 'developer').length,
    clients: users.filter(u => u.role === 'user').length
  };

  return (
    <AdminLayout currentPage="AdminUsers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F]">Gestão de Utilizadores</h1>
            <p className="text-stone-500">Gerir utilizadores e permissões</p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Utilizador
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#2C3E1F]">{stats.total}</p>
                <p className="text-xs text-stone-500">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.owners}</p>
                <p className="text-xs text-stone-500">Proprietário</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.monitors}</p>
                <p className="text-xs text-stone-500">Monitores</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{stats.developers}</p>
                <p className="text-xs text-stone-500">Developer</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.clients}</p>
                <p className="text-xs text-stone-500">Clientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Input
              placeholder="Pesquisar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Users Table */}
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Registado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === 'owner' ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Proprietário
                          </Badge>
                        ) : user.role === 'monitor' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Users className="w-3 h-3 mr-1" />
                            Monitor
                          </Badge>
                        ) : user.role === 'developer' ? (
                          <Badge className="bg-cyan-100 text-cyan-800">
                            Developer
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Cliente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.created_date && new Date(user.created_date).toLocaleDateString('pt-PT')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => {
                              if (e.target.value !== user.role) {
                                updateRoleMutation.mutate({ userId: user.id, newRole: e.target.value });
                              }
                            }}
                            disabled={updateRoleMutation.isPending || user.role === 'developer'}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="user">Cliente</option>
                            <option value="monitor">Monitor</option>
                            <option value="owner">Proprietário</option>
                            {user.role === 'developer' && <option value="developer">Developer</option>}
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={user.role === 'developer'}
                            className="text-red-600 border-red-600 hover:bg-red-50"
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Utilizador?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem a certeza que deseja remover <strong>{userToDelete?.full_name || userToDelete?.email}</strong>? 
                Esta ação não pode ser revertida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUserMutation.mutate(userToDelete?.id)}
                disabled={deleteUserMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A remover...
                  </>
                ) : (
                  'Remover'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Invite Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Utilizador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="utilizador@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Função</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="user">Cliente</option>
                  <option value="monitor">Monitor</option>
                  <option value="owner">Proprietário</option>
                </select>
              </div>
              <Button
                onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="w-full bg-[#B8956A] hover:bg-[#8B7355] text-white"
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}