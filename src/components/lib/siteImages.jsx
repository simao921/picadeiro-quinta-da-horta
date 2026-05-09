import { base44 } from '@/api/base44Client';

export const DEFAULT_IMAGES = {
  hero_home: 'https://cdn.cmjornal.pt/images/2022-07/img_1500x1000uu2022-07-24-16-46-48-1171717.png',
  hero_services: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1920&q=80',
  hero_gallery: 'https://www.image2url.com/r2/default/images/1778342419244-815fb73f-d3a7-4e27-b4d5-c775902ec137.jpeg',
  hero_bookings: 'https://www.image2url.com/r2/default/images/1778343352791-01060006-cecf-42f3-825e-84be1520b831.jpeg',
  hero_competitions: 'https://www.image2url.com/r2/default/images/1778343423932-38a4fa65-e18f-4810-9010-8c7851804b2e.jpeg',
  about_section: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=1200&q=80',
  about_grid_1: 'https://www.image2url.com/r2/default/images/1778336960071-9cfe2be2-7f9e-4c9d-9237-e2b1840dc241.jpeg',
  about_grid_2: 'https://www.image2url.com/r2/default/images/1778336372916-4a48fbd9-1fec-4852-ad75-a2d30fb4556b.jpeg',
  about_grid_3: 'https://www.image2url.com/r2/default/images/1778336317638-1f9a2d9b-b407-4310-8966-491e164a040d.jpeg',
  about_grid_4: 'https://www.image2url.com/r2/default/images/1778336895303-972e3964-2dd8-45de-b91f-432635c1f8dd.jpeg',
  logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG',
  testimonials_bg: 'https://images.unsplash.com/photo-1598662779094-d8de6b04f1c5?auto=format&fit=crop&w=1920&q=80',
  cta_section: 'https://images.unsplash.com/photo-1560925691-17f5b06af77a?auto=format&fit=crop&w=1920&q=80'
};


// SEM CACHE - buscar sempre direto
export async function getSiteImage(imageKey, fallbackUrl) {
  try {
    const images = await base44.entities.SiteImage.list();
    const image = images.find(img => img.image_key === imageKey);
    return image?.image_url || fallbackUrl || DEFAULT_IMAGES[imageKey] || '';
  } catch (error) {
    console.error('Erro ao carregar imagem:', error);
    return fallbackUrl || DEFAULT_IMAGES[imageKey] || '';
  }
}

export function clearImageCache() {
  // Não faz nada - sem cache
}