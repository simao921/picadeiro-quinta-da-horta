import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star, Search, AlertCircle, CheckCircle2, MessageSquare, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function AdminFeedback() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['admin-feedbacks'],
    queryFn: async () => {
      const data = await base44.entities.Feedback.list('-created_date');
      return data;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 1000),
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: () => base44.entities.Lesson.list('-date', 1000),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
  });

  const getBookingInfo = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return null;
    const lesson = lessons.find(l => l.id === booking.lesson_id);
    if (!lesson) return { booking };
    const service = services.find(s => s.id === lesson.service_id);
    return { booking, lesson, service };
  };

  const filteredFeedbacks = feedbacks.filter(f =>
    f.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-stone-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getSentimentBadge = (rating) => {
    if (rating >= 4) {
      return <Badge className="bg-green-100 text-green-800">Positivo</Badge>;
    } else if (rating === 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Neutro</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Negativo</Badge>;
    }
  };

  const stats = {
    total: feedbacks.length,
    positivos: feedbacks.filter(f => f.rating >= 4).length,
    neutros: feedbacks.filter(f => f.rating === 3).length,
    negativos: feedbacks.filter(f => f.rating <= 2).length,
    mediaAvaliacoes: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0
  };

  return (
    <AdminLayout currentPage="AdminFeedback">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E1F] flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-[#4A5D23]" />
              Feedbacks dos Alunos
            </h1>
            <p className="text-stone-500">Avaliações e comentários sobre as aulas</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-yellow-600 font-medium">Média</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  <p className="text-3xl font-bold text-yellow-900">{stats.mediaAvaliacoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">Positivos</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{stats.positivos}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-amber-600 font-medium">Neutros</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{stats.neutros}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium">Negativos</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{stats.negativos}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Pesquisar por email ou comentário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
        </Card>

        {/* Feedbacks List */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Feedbacks ({filteredFeedbacks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-stone-500">A carregar...</div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-stone-500">Nenhum feedback encontrado</div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback) => {
                  const info = getBookingInfo(feedback.booking_id);
                  return (
                    <Card key={feedback.id} className={`border-l-4 ${
                      feedback.rating >= 4 ? 'border-green-500' :
                      feedback.rating === 3 ? 'border-yellow-500' : 'border-red-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-[#2C3E1F]">{feedback.client_email}</h3>
                                {getSentimentBadge(feedback.rating)}
                                {feedback.action_required && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Ação Necessária
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-stone-500">
                                {format(new Date(feedback.created_date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {renderStars(feedback.rating)}
                              <span className="font-bold text-lg">{feedback.rating}/5</span>
                            </div>
                          </div>

                          {/* Lesson Info */}
                          {info?.lesson && (
                            <div className="p-3 bg-stone-50 rounded-lg">
                              <p className="text-sm font-medium text-stone-700 mb-1">
                                {info.service?.title || 'Serviço'}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-stone-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(info.lesson.date), "d 'de' MMMM", { locale: pt })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {info.lesson.start_time}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Comment */}
                          {feedback.comment && (
                            <div className="bg-white border border-stone-200 rounded-lg p-3">
                              <p className="text-sm text-stone-700 whitespace-pre-wrap">
                                "{feedback.comment}"
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}