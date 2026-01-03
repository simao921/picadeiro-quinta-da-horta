import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import MetaTags from '@/components/seo/MetaTags';

export default function BlogPost() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ slug, is_published: true });
      return posts[0];
    },
    enabled: !!slug
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.category],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ 
        category: post.category, 
        is_published: true 
      });
      return posts.filter(p => p.id !== post.id).slice(0, 3);
    },
    enabled: !!post?.category
  });

  const incrementViewsMutation = useMutation({
    mutationFn: () => base44.entities.BlogPost.update(post.id, {
      views: (post.views || 0) + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['blog-post', slug]);
    }
  });

  useEffect(() => {
    if (post) {
      incrementViewsMutation.mutate();
    }
  }, [post?.id]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-700 mb-4">Artigo não encontrado</h2>
          <Link to={createPageUrl('Blog')}>
            <Button className="bg-[#4A5D23] hover:bg-[#3A4A1B]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <MetaTags
        title={`${post.title} - Blog Picadeiro Quinta da Horta`}
        description={post.meta_description || post.excerpt}
        keywords={(post.meta_keywords || []).join(', ')}
        image={post.featured_image}
        type="article"
        publishedTime={post.published_date}
        modifiedTime={post.updated_date}
      />

      {/* Header */}
      <div className="bg-white border-b border-stone-200 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Blog')}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Category */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/10 rounded-full mb-6">
              <span className="text-[#B8956A] font-medium capitalize">{post.category}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#2C3E1F] mb-6">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-stone-600 mb-8 pb-8 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(post.published_date), "d 'de' MMMM, yyyy", { locale: pt })}</span>
              </div>
              {post.reading_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.reading_time} minutos de leitura</span>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Share2 className="w-4 h-4" />
                <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#B8956A]">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-[#B8956A]">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#B8956A]">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="aspect-video rounded-2xl overflow-hidden mb-8 shadow-lg">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg prose-stone max-w-none
                         prose-headings:font-serif prose-headings:text-[#2C3E1F]
                         prose-p:text-stone-700 prose-p:leading-relaxed
                         prose-a:text-[#B8956A] prose-a:no-underline hover:prose-a:underline
                         prose-img:rounded-xl prose-img:shadow-md
                         prose-strong:text-[#2C3E1F]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-stone-200">
                <h3 className="text-sm font-semibold text-stone-600 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-12 bg-white border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-2xl font-bold text-[#2C3E1F] mb-8">Artigos Relacionados</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} to={createPageUrl(`BlogPost?slug=${relatedPost.slug}`)}>
                  <div className="group cursor-pointer">
                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                      <img
                        src={relatedPost.featured_image || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80'}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#2C3E1F] mb-2 group-hover:text-[#B8956A] transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-stone-600 line-clamp-2">{relatedPost.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}