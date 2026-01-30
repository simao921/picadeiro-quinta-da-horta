import { base44 } from '@/api/base44Client';

// Imagens padrão do site (fallback)
export const DEFAULT_IMAGES = {
  logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG',
  hero_background: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1920&q=80',
  about_image: 'https://images.unsplash.com/photo-1534281988033-a5011e1e8f44?w=800&q=80',
  testimonials_background: 'https://images.unsplash.com/photo-1568570822771-d94e01c17a4f?w=1920&q=80',
  service_private: 'https://images.unsplash.com/photo-1551990174-e6ee9a87c04b?w=800&q=80',
  service_group: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  service_rental: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=800&q=80',
  service_owners: 'https://images.unsplash.com/photo-1546445317-27e60e716bae?w=800&q=80',
  gallery_hero: 'https://images.unsplash.com/photo-1530993461969-d6e0f97a67a8?w=1920&q=80',
  bookings_hero: 'https://images.unsplash.com/photo-1533692621860-eb2f0a92e4c7?w=1920&q=80',
  placeholder: 'https://images.unsplash.com/photo-1535109663-192bc26b6332?w=800&q=80',
  background_pattern: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80',
  cta_background: 'https://images.unsplash.com/photo-1546445317-27e60e716bae?w=1920&q=80'
};

// Obter imagem do site
export const getSiteImage = async (key, fallback = null) => {
  try {
    const settings = await base44.entities.SiteSettings.filter({ 
      key: `site_image_${key}` 
    });
    
    if (settings && settings.length > 0 && settings[0].value) {
      return settings[0].value;
    }
    
    return fallback || DEFAULT_IMAGES[key] || DEFAULT_IMAGES.placeholder;
  } catch (error) {
    console.error(`Erro ao carregar imagem ${key}:`, error);
    return fallback || DEFAULT_IMAGES[key] || DEFAULT_IMAGES.placeholder;
  }
};

// Atualizar imagem do site
export const updateSiteImage = async (key, imageUrl) => {
  try {
    const existing = await base44.entities.SiteSettings.filter({ 
      key: `site_image_${key}` 
    });
    
    if (existing && existing.length > 0) {
      await base44.entities.SiteSettings.update(existing[0].id, { 
        value: imageUrl 
      });
    } else {
      await base44.entities.SiteSettings.create({ 
        key: `site_image_${key}`,
        value: imageUrl,
        category: 'general'
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar imagem ${key}:`, error);
    throw error;
  }
};