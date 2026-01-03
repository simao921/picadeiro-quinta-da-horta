import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import MetaTags from '@/components/seo/MetaTags';
import { useLanguage } from '@/components/LanguageProvider';

export default function Blog() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => base44.entities.BlogPost.filter({ is_published: true }),
    initialData: []
  });

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'dicas', label: 'Dicas' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'noticias', label: 'Notícias' },
    { value: 'cuidados', label: 'Cuidados' },
    { value: 'competicoes', label: 'Competições' },
    { value: 'iniciantes', label: 'Iniciantes' }
  ];

  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.published_date) - new Date(a.published_date));

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-stone-50">
      <MetaTags
        title="Blog - Picadeiro Quinta da Horta | Artigos sobre Equitação"
        description="Descubra dicas de equitação, notícias do picadeiro, cuidados com cavalos e guias para iniciantes. Blog do Picadeiro Quinta da Horta com conteúdo de qualidade."
        keywords="blog equitação, dicas cavalos, notícias picadeiro, guia iniciantes equitação, cuidados cavalos, competições equestres, eventos equitação Alcochete"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-[#2C3E1F] to-[#1A1A1A] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B8956A]/20 rounded-full mb-6">
              <BookOpen className="w-4 h-4 text-[#B8956A]" />
              <span className="text-[#B8956A] text-sm font-medium">Blog</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
              Artigos sobre Equitação
            </h1>
            <p className="text-xl text-stone-300 max-w-2xl mx-auto">
              Dicas, notícias e conteúdos de qualidade sobre o mundo equestre
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Pesquisar artigos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={selectedCategory === cat.value ? 'bg-[#4A5D23] hover:bg-[#3A4A1B]' : ''}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8956A]"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-stone-700 mb-2">Nenhum artigo encontrado</h3>
              <p className="text-stone-500">Tente ajustar os filtros de pesquisa</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Post */}
              {featuredPost && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link to={createPageUrl(`BlogPost?slug=${featuredPost.slug}`)}>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2 border-stone-200">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="aspect-video md:aspect-auto">
                          <img
                            src={featuredPost.featured_image || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&q=80'}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-8 flex flex-col justify-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B8956A]/10 rounded-full mb-4 w-fit">
                            <span className="text-[#B8956A] text-sm font-medium capitalize">
                              {featuredPost.category}
                            </span>
                          </div>
                          <h2 className="font-serif text-3xl font-bold text-[#2C3E1F] mb-4 hover:text-[#B8956A] transition-colors">
                            {featuredPost.title}
                          </h2>
                          <p className="text-stone-600 mb-6 line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-stone-500 mb-6">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(featuredPost.published_date), "d 'de' MMMM, yyyy", { locale: pt })}
                            </div>
                            {featuredPost.reading_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {featuredPost.reading_time} min
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[#B8956A] font-medium">
                            Ler artigo <ArrowRight className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              )}

              {/* Regular Posts Grid */}
              {regularPosts.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={createPageUrl(`BlogPost?slug=${post.slug}`)}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full border-2 border-stone-200 hover:border-[#B8956A]">
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={post.featured_image || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80'}
                              alt={post.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B8956A]/10 rounded-full mb-3 w-fit">
                              <span className="text-[#B8956A] text-xs font-medium capitalize">
                                {post.category}
                              </span>
                            </div>
                            <h3 className="font-serif text-xl font-bold text-[#2C3E1F] mb-3 line-clamp-2 hover:text-[#B8956A] transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-stone-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(post.published_date), "d MMM", { locale: pt })}
                              </div>
                              {post.reading_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {post.reading_time} min
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}