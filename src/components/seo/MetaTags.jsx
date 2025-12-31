import { useEffect } from 'react';

export default function MetaTags({ 
  title = "Picadeiro Quinta da Horta - Centro Equestre de Excelência",
  description = "Centro equestre em Alcochete com aulas de equitação, hipoterapia e eventos. Treine com o Bi-Campeão Mundial Gilberto Filipe.",
  keywords = "equitação, aulas de equitação, hipoterapia, cavalos, picadeiro, Alcochete, Gilberto Filipe, centro equestre",
  image = "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1200&q=80"
}) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ];

    metaTags.forEach(({ name, property, content }) => {
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
  }, [title, description, keywords, image]);

  return null;
}