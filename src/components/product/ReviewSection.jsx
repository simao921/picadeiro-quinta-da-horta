import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';

export default function ReviewSection({ entityType, entityId }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {}
    };
    checkAuth();
  }, []);

  const { data: reviews } = useQuery({
    queryKey: ['reviews', entityType, entityId],
    queryFn: () => base44.entities.Review.filter({ 
      entity_type: entityType, 
      entity_id: entityId,
      is_approved: true 
    }),
    initialData: []
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']);
      setRating(0);
      setTitle('');
      setComment('');
      toast.success(t('review_sent'));
    }
  });

  const handleSubmit = () => {
    if (!user) {
      toast.error(t('login_to_review'));
      return;
    }
    if (rating === 0 || !comment) {
      toast.error(t('fill_all_fields'));
      return;
    }

    createReviewMutation.mutate({
      entity_type: entityType,
      entity_id: entityId,
      rating,
      title,
      comment,
      client_name: user.full_name,
      client_email: user.email,
      is_approved: false
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#B8956A] mb-2">{avgRating}</div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= avgRating ? 'fill-[#B8956A] text-[#B8956A]' : 'text-stone-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-stone-500">{reviews.length} {t('reviews')}</p>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter(r => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-8">{star}★</span>
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#B8956A]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-stone-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review */}
      {user && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg text-[#2C3E1F] mb-4">{t('write_review')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('rating')}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-[#B8956A] text-[#B8956A]'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('review_title')}</label>
                <Input
                  placeholder={t('review_title')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('review_comment')}</label>
                <Textarea
                  placeholder={t('review_placeholder')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createReviewMutation.isPending}
                className="bg-[#B8956A] hover:bg-[#8B7355] text-white"
              >
                {createReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  t('publish_review')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence>
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#2C3E1F]">{review.client_name}</span>
                        {review.is_verified && (
                          <CheckCircle className="w-4 h-4 text-green-600" title={t('verified_purchase')} />
                        )}
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'fill-[#B8956A] text-[#B8956A]' : 'text-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-stone-500">
                      {new Date(review.created_date).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-[#2C3E1F] mb-2">{review.title}</h4>
                  )}
                  <p className="text-stone-600">{review.comment}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}