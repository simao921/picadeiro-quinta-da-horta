import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ListTodo, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';
import TaskCalendar from '@/components/tasks/TaskCalendar';

export default function Tasks() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
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

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      const allTasks = await base44.entities.Task.list('-created_date');
      return allTasks.filter(t => 
        t.assigned_to === user?.email || 
        t.assigned_by === user?.email ||
        user?.role === 'admin'
      );
    },
    enabled: !!user,
    initialData: []
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create({
      ...taskData,
      assigned_by: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setEditingTask(null);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setEditingTask(null);
    }
  });

  const handleSubmit = (taskData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

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
          <div className="absolute top-20 right-20 w-72 h-72 bg-[#B8956A] rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
                Gestão de <span className="text-[#B8956A]">Tarefas</span>
              </h1>
              <p className="text-stone-300">
                Organize e acompanhe todas as tarefas da equipa
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingTask(null);
                setShowForm(!showForm);
              }}
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Tarefa
            </Button>
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
              <TaskForm
                task={editingTask}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                currentUser={user}
              />
            </motion.div>
          )}

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger 
                value="list" 
                className="data-[state=active]:bg-[#2D2D2D] data-[state=active]:text-white"
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Lista de Tarefas
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="data-[state=active]:bg-[#2D2D2D] data-[state=active]:text-white"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <TaskList 
                tasks={tasks} 
                onEdit={handleEdit} 
                onStatusChange={updateTaskMutation.mutate}
                currentUser={user}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <TaskCalendar tasks={tasks} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}