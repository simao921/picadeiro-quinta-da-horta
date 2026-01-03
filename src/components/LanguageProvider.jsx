import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const translations = {
  pt: {
    // Navigation
    nav_home: 'Início',
    nav_services: 'Serviços',
    nav_gallery: 'Galeria',
    nav_shop: 'Loja',
    nav_bookings: 'Reservas',
    nav_contact: 'Contactos',
    
    // Auth
    login: 'Entrar',
    logout: 'Terminar Sessão',
    my_account: 'Minha Conta',
    
    // Home
    hero_title: 'Experiências Personalizadas',
    hero_subtitle: 'Descubra a equitação num ambiente único',
    
    // Services
    services_title: 'Nossos Serviços',
    book_now: 'Reservar Agora',
    learn_more: 'Saber Mais',
    from_price: 'Desde',
    
    // Bookings
    my_lessons: 'Minhas Aulas',
    new_booking: 'Nova Reserva',
    payments: 'Pagamentos',
    select_service: 'Escolha o Serviço',
    select_plan: 'Escolha o Plano',
    select_date_time: 'Escolha a Data e Hora',
    confirm_booking: 'Confirme a Reserva',
    booking_confirmed: 'Reserva Confirmada!',
    
    // Shop
    shop_title: 'Loja',
    add_to_cart: 'Adicionar ao Carrinho',
    view_cart: 'Ver Carrinho',
    checkout: 'Finalizar Compra',
    
    // Contact
    contact_title: 'Contactos',
    name: 'Nome',
    email: 'Email',
    phone: 'Telefone',
    message: 'Mensagem',
    send_message: 'Enviar Mensagem',
    
    // Common
    continue: 'Continuar',
    back: 'Voltar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Apagar',
    edit: 'Editar',
    search: 'Pesquisar',
    loading: 'A carregar...',
    error: 'Erro',
    success: 'Sucesso',
    confirm: 'Confirmar',
    price: 'Preço',
    duration: 'Duração',
    date: 'Data',
    time: 'Hora',
    status: 'Estado',
  },
  
  en: {
    // Navigation
    nav_home: 'Home',
    nav_services: 'Services',
    nav_gallery: 'Gallery',
    nav_shop: 'Shop',
    nav_bookings: 'Bookings',
    nav_contact: 'Contact',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    my_account: 'My Account',
    
    // Home
    hero_title: 'Personalized Experiences',
    hero_subtitle: 'Discover horse riding in a unique environment',
    
    // Services
    services_title: 'Our Services',
    book_now: 'Book Now',
    learn_more: 'Learn More',
    from_price: 'From',
    
    // Bookings
    my_lessons: 'My Lessons',
    new_booking: 'New Booking',
    payments: 'Payments',
    select_service: 'Select Service',
    select_plan: 'Select Plan',
    select_date_time: 'Select Date & Time',
    confirm_booking: 'Confirm Booking',
    booking_confirmed: 'Booking Confirmed!',
    
    // Shop
    shop_title: 'Shop',
    add_to_cart: 'Add to Cart',
    view_cart: 'View Cart',
    checkout: 'Checkout',
    
    // Contact
    contact_title: 'Contact',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message',
    send_message: 'Send Message',
    
    // Common
    continue: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    price: 'Price',
    duration: 'Duration',
    date: 'Date',
    time: 'Time',
    status: 'Status',
  },
  
  es: {
    // Navigation
    nav_home: 'Inicio',
    nav_services: 'Servicios',
    nav_gallery: 'Galería',
    nav_shop: 'Tienda',
    nav_bookings: 'Reservas',
    nav_contact: 'Contacto',
    
    // Auth
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    my_account: 'Mi Cuenta',
    
    // Home
    hero_title: 'Experiencias Personalizadas',
    hero_subtitle: 'Descubre la equitación en un entorno único',
    
    // Services
    services_title: 'Nuestros Servicios',
    book_now: 'Reservar Ahora',
    learn_more: 'Saber Más',
    from_price: 'Desde',
    
    // Bookings
    my_lessons: 'Mis Clases',
    new_booking: 'Nueva Reserva',
    payments: 'Pagos',
    select_service: 'Seleccionar Servicio',
    select_plan: 'Seleccionar Plan',
    select_date_time: 'Seleccionar Fecha y Hora',
    confirm_booking: 'Confirmar Reserva',
    booking_confirmed: '¡Reserva Confirmada!',
    
    // Shop
    shop_title: 'Tienda',
    add_to_cart: 'Añadir al Carrito',
    view_cart: 'Ver Carrito',
    checkout: 'Finalizar Compra',
    
    // Contact
    contact_title: 'Contacto',
    name: 'Nombre',
    email: 'Correo',
    phone: 'Teléfono',
    message: 'Mensaje',
    send_message: 'Enviar Mensaje',
    
    // Common
    continue: 'Continuar',
    back: 'Volver',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    search: 'Buscar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    price: 'Precio',
    duration: 'Duración',
    date: 'Fecha',
    time: 'Hora',
    status: 'Estado',
  },
  
  fr: {
    // Navigation
    nav_home: 'Accueil',
    nav_services: 'Services',
    nav_gallery: 'Galerie',
    nav_shop: 'Boutique',
    nav_bookings: 'Réservations',
    nav_contact: 'Contact',
    
    // Auth
    login: 'Connexion',
    logout: 'Déconnexion',
    my_account: 'Mon Compte',
    
    // Home
    hero_title: 'Expériences Personnalisées',
    hero_subtitle: 'Découvrez l\'équitation dans un environnement unique',
    
    // Services
    services_title: 'Nos Services',
    book_now: 'Réserver Maintenant',
    learn_more: 'En Savoir Plus',
    from_price: 'À partir de',
    
    // Bookings
    my_lessons: 'Mes Cours',
    new_booking: 'Nouvelle Réservation',
    payments: 'Paiements',
    select_service: 'Sélectionner le Service',
    select_plan: 'Sélectionner le Plan',
    select_date_time: 'Sélectionner Date et Heure',
    confirm_booking: 'Confirmer la Réservation',
    booking_confirmed: 'Réservation Confirmée!',
    
    // Shop
    shop_title: 'Boutique',
    add_to_cart: 'Ajouter au Panier',
    view_cart: 'Voir le Panier',
    checkout: 'Passer Commande',
    
    // Contact
    contact_title: 'Contact',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    message: 'Message',
    send_message: 'Envoyer Message',
    
    // Common
    continue: 'Continuer',
    back: 'Retour',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    search: 'Rechercher',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    price: 'Prix',
    duration: 'Durée',
    date: 'Date',
    time: 'Heure',
    status: 'Statut',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}