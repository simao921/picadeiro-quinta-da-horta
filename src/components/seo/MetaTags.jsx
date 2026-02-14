import { useEffect } from 'react';

export default function MetaTags({ 
  title = "Picadeiro Quinta da Horta - Centro Equestre de Excelência em Alcochete",
  description = "Centro equestre de referência em Alcochete. Aulas de equitação para todas as idades com o Bi-Campeão Mundial Gilberto Filipe. Hipoterapia, eventos e treino profissional.",
  keywords = "equitação Alcochete, aulas de equitação, hipoterapia, centro equestre Portugal, Gilberto Filipe, picadeiro, cavalos, aulas particulares equitação, aulas grupo equitação, treino cavalos",
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG",
  url = typeof window !== 'undefined' ? window.location.href : 'https://picadeiroquintadahorta.com',
  type = 'website',
  author = 'Picadeiro Quinta da Horta',
  publishedTime,
  modifiedTime
}) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Update meta tags
    const metaTags = [
      // Basic meta tags
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: author },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'language', content: 'pt-PT' },
      { name: 'geo.region', content: 'PT-15' },
      { name: 'geo.placename', content: 'Alcochete' },
      { name: 'geo.position', content: '38.7558;-8.9611' },
      
      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'Picadeiro Quinta da Horta' },
      { property: 'og:locale', content: 'pt_PT' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:site', content: '@picadeiro.quinta.da.horta' },
      
      // Mobile
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
      { name: 'theme-color', content: '#2C3E1F' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ];

    // Add article-specific tags
    if (type === 'article') {
      if (publishedTime) {
        metaTags.push({ property: 'article:published_time', content: publishedTime });
      }
      if (modifiedTime) {
        metaTags.push({ property: 'article:modified_time', content: modifiedTime });
      }
      metaTags.push({ property: 'article:author', content: author });
    }

    metaTags.forEach(({ name, property, content }) => {
      if (!content) return;
      
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);
      
      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    });

    // Add structured data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Picadeiro Quinta da Horta",
      "description": description,
      "image": image,
      "url": "https://picadeiroquintadahorta.com",
      "telephone": "+351932111786",
      "email": "picadeiroquintadahortagf@gmail.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rua das Hortas - Fonte da Senhora",
        "addressLocality": "Alcochete",
        "postalCode": "2890-106",
        "addressCountry": "PT"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 38.7558,
        "longitude": -8.9611
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "19:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "09:00",
          "closes": "17:00"
        }
      ],
      "priceRange": "€€",
      "sameAs": [
        "https://www.facebook.com/Picadeiroquintadahortaoficial/",
        "https://www.instagram.com/picadeiro.quinta.da.horta/"
      ]
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime]);

  return null;
}