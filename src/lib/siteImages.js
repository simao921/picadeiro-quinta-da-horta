import { base44 } from '@/api/base44Client';

let siteImagesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSiteImage(key, defaultUrl) {
  try {
    // Use cache if available and fresh
    const now = Date.now();
    if (siteImagesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      const image = siteImagesCache.find(img => img.key === key);
      return image?.url || defaultUrl;
    }

    // Fetch from database
    const images = await base44.entities.SiteImage?.list() || [];
    siteImagesCache = images;
    cacheTimestamp = now;

    const image = images.find(img => img.key === key);
    return image?.url || defaultUrl;
  } catch (error) {
    console.warn('Error fetching site image:', error);
    return defaultUrl;
  }
}

export function clearSiteImagesCache() {
  siteImagesCache = null;
  cacheTimestamp = null;
}

// Default image URLs
export const DEFAULT_IMAGES = {
  logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG',
  hero: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80',
  cta: 'https://images.unsplash.com/photo-1460134846237-51c777df6111?w=1920&q=80',
  service_1: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  service_2: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=600&q=80',
  service_3: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=600&q=80',
  about_decorative: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800&q=80',
  about_grid_1: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&q=80',
  about_grid_2: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  about_grid_3: 'https://images.unsplash.com/photo-1534307671554-9a6d81f4d629?w=400&q=80',
  about_grid_4: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=600&q=80',
  gallery_background: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80',
};

