import { base44 } from '@/api/base44Client';

export const DEFAULT_IMAGES = {
  hero_home: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1920&q=80',
  hero_services: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1920&q=80',
  hero_gallery: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80',
  hero_bookings: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80',
  about_section: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=1200&q=80',
  logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG',
  testimonials_bg: 'https://images.unsplash.com/photo-1598662779094-d8de6b04f1c5?auto=format&fit=crop&w=1920&q=80',
  cta_section: 'https://images.unsplash.com/photo-1560925691-17f5b06af77a?auto=format&fit=crop&w=1920&q=80'
};

let imageCache = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function getSiteImage(imageKey, fallbackUrl) {
  try {
    // Usar cache se disponível e não expirado
    const now = Date.now();
    if (imageCache && (now - cacheTime) < CACHE_DURATION) {
      const cached = imageCache.find(img => img.image_key === imageKey);
      if (cached) return cached.image_url;
    }

    // Buscar do banco de dados
    if (!imageCache || (now - cacheTime) >= CACHE_DURATION) {
      imageCache = await base44.entities.SiteImage.list();
      cacheTime = now;
    }

    const image = imageCache.find(img => img.image_key === imageKey);
    return image?.image_url || fallbackUrl || DEFAULT_IMAGES[imageKey] || '';
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    return fallbackUrl || DEFAULT_IMAGES[imageKey] || '';
  }
}

export function clearImageCache() {
  imageCache = null;
  cacheTime = 0;
}