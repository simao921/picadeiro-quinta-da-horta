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
    
    // Home - Hero
    hero_badge: 'Centro Equestre de Excelência',
    hero_title: 'Picadeiro',
    hero_title_highlight: 'Quinta da Horta',
    hero_description: 'Descubra a arte da equitação com o Bi-Campeão do Mundo Gilberto Filipe. Oferecemos aulas personalizadas, hipoterapia e experiências únicas com cavalos num ambiente natural e acolhedor.',
    hero_cta_primary: 'Reservar Aula',
    hero_cta_secondary: 'Conhecer Serviços',
    hero_stat_1: 'Anos de Experiência',
    hero_stat_2: 'Alunos Formados',
    hero_stat_3: 'Campeão Mundial',
    
    // Home - Services Preview
    services_preview_badge: 'Os Nossos Serviços',
    services_preview_title: 'Experiências Equestres de Excelência',
    services_preview_subtitle: 'Desde iniciantes a cavaleiros experientes, oferecemos programas personalizados para todas as idades e níveis.',
    service_1_title: 'Aulas Particulares',
    service_1_desc: 'Aulas individuais com monitores experientes ou com o Bi-Campeão Mundial Gilberto Filipe.',
    service_2_title: 'Aulas em Grupo',
    service_2_desc: 'Aulas com até 4 alunos, promovendo aprendizagem colaborativa e socialização.',
    service_3_title: 'Hipoterapia',
    service_3_desc: 'Terapia assistida por cavalos para desenvolvimento físico, emocional e cognitivo.',
    service_4_title: 'Aluguer de Espaço',
    service_4_desc: 'Espaço único para eventos, festas de aniversário e celebrações especiais.',
    services_view_all: 'Ver Todos os Serviços',
    
    // Home - About
    about_badge: 'Sobre Nós',
    about_title: 'Uma Tradição de Excelência Equestre',
    about_p1: 'O Picadeiro Quinta da Horta é mais do que um centro equestre — é um lugar onde a paixão pelos cavalos encontra a excelência no ensino. Localizado na bela região de Alcochete, oferecemos um ambiente natural e tranquilo para a prática da equitação.',
    about_p2: 'Sob a orientação do Bi-Campeão do Mundo Gilberto Filipe, desenvolvemos programas personalizados que respeitam o ritmo de cada aluno, desde iniciantes aos mais experientes.',
    about_feature_1: 'Bi-Campeão Mundial',
    about_feature_1_desc: 'Gilberto Filipe, instrutor principal',
    about_feature_2: 'Segurança Total',
    about_feature_2_desc: 'Protocolos rigorosos de segurança',
    about_feature_3: 'Paixão pelos Cavalos',
    about_feature_3_desc: 'Cuidado e respeito animal',
    about_feature_4: 'Comunidade',
    about_feature_4_desc: 'Ambiente familiar acolhedor',
    about_cta: 'Contacte-nos',
    about_years: 'Anos',
    about_experience: 'de Experiência',
    
    // Home - CTA
    cta_title: 'Pronto para Começar a Sua',
    cta_title_highlight: ' Jornada Equestre?',
    cta_subtitle: 'Dê o primeiro passo para uma experiência única com cavalos. Reserve a sua primeira aula experimental ou entre em contacto para mais informações.',
    cta_book: 'Reservar Aula',
    cta_call: 'Ligar Agora',
    cta_card_1: 'Aula Experimental',
    cta_card_1_desc: 'Experimente uma aula introdutória e descubra o mundo da equitação.',
    cta_card_2: 'Visita às Instalações',
    cta_card_2_desc: 'Agende uma visita para conhecer o nosso espaço e os nossos cavalos.',
    cta_card_3: 'Pacotes Mensais',
    cta_card_3_desc: 'Descubra os nossos planos com condições especiais para alunos regulares.',
    
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
    
    // Home Hero
    excellence_center: 'Centro Equestre de Excelência',
    world_champion_intro: 'Descubra a arte da equitação com o',
    world_champion_name: 'Bi-Campeão do Mundo Gilberto Filipe',
    hero_description: 'Oferecemos aulas personalizadas, hipoterapia e experiências únicas com cavalos num ambiente natural e acolhedor.',
    book_lesson: 'Reservar Aula',
    know_services: 'Conhecer Serviços',
    years_experience: 'Anos de Experiência',
    students_trained: 'Alunos Formados',
    world_champion: 'Campeão Mundial',
    
    // Services Preview
    our_services: 'Os Nossos Serviços',
    equestrian_experiences: 'Experiências Equestres de Excelência',
    services_description: 'Desde iniciantes a cavaleiros experientes, oferecemos programas personalizados para todas as idades e níveis.',
    private_lessons: 'Aulas Particulares',
    private_lessons_desc: 'Aulas individuais com monitores experientes ou com o Bi-Campeão Mundial Gilberto Filipe.',
    group_lessons: 'Aulas em Grupo',
    group_lessons_desc: 'Aulas com até 4 alunos, promovendo aprendizagem colaborativa e socialização.',
    hippotherapy: 'Hipoterapia',
    hippotherapy_desc: 'Terapia assistida por cavalos para desenvolvimento físico, emocional e cognitivo.',
    space_rental: 'Aluguer de Espaço',
    space_rental_desc: 'Espaço único para eventos, festas de aniversário e celebrações especiais.',
    view_all_services: 'Ver Todos os Serviços',
    
    // About
    about_us: 'Sobre Nós',
    excellence_tradition: 'Uma Tradição de Excelência Equestre',
    about_description_1: 'O Picadeiro Quinta da Horta é mais do que um centro equestre — é um lugar onde a paixão pelos cavalos encontra a excelência no ensino. Localizado na bela região de Alcochete, oferecemos um ambiente natural e tranquilo para a prática da equitação.',
    about_description_2: 'desenvolvemos programas personalizados que respeitam o ritmo de cada aluno, desde iniciantes aos mais experientes.',
    contact_us: 'Contacte-nos',
    
    // CTA
    ready_to_start: 'Pronto para Começar a Sua',
    equestrian_journey: 'Jornada Equestre?',
    cta_description: 'Dê o primeiro passo para uma experiência única com cavalos. Reserve a sua primeira aula experimental ou entre em contacto para mais informações.',
    call_now: 'Ligar Agora',
    trial_lesson: 'Aula Experimental',
    trial_lesson_desc: 'Experimente uma aula introdutória e descubra o mundo da equitação.',
    visit_facilities: 'Visita às Instalações',
    visit_facilities_desc: 'Agende uma visita para conhecer o nosso espaço e os nossos cavalos.',
    monthly_packages: 'Pacotes Mensais',
    monthly_packages_desc: 'Descubra os nossos planos com condições especiais para alunos regulares.',
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
    
    // Home - Hero
    hero_badge: 'Equestrian Center of Excellence',
    hero_title: 'Picadeiro',
    hero_title_highlight: 'Quinta da Horta',
    hero_description: 'Discover the art of horse riding with World Champion Gilberto Filipe. We offer personalized lessons, hippotherapy and unique experiences with horses in a natural and welcoming environment.',
    hero_cta_primary: 'Book Lesson',
    hero_cta_secondary: 'Discover Services',
    hero_stat_1: 'Years of Experience',
    hero_stat_2: 'Trained Students',
    hero_stat_3: 'World Champion',
    
    // Home - Services Preview
    services_preview_badge: 'Our Services',
    services_preview_title: 'Excellent Equestrian Experiences',
    services_preview_subtitle: 'From beginners to experienced riders, we offer personalized programs for all ages and levels.',
    service_1_title: 'Private Lessons',
    service_1_desc: 'Individual lessons with experienced instructors or World Champion Gilberto Filipe.',
    service_2_title: 'Group Lessons',
    service_2_desc: 'Lessons with up to 4 students, promoting collaborative learning and socialization.',
    service_3_title: 'Hippotherapy',
    service_3_desc: 'Horse-assisted therapy for physical, emotional and cognitive development.',
    service_4_title: 'Space Rental',
    service_4_desc: 'Unique space for events, birthday parties and special celebrations.',
    services_view_all: 'View All Services',
    
    // Home - About
    about_badge: 'About Us',
    about_title: 'A Tradition of Equestrian Excellence',
    about_p1: 'Picadeiro Quinta da Horta is more than an equestrian center — it\'s a place where passion for horses meets excellence in teaching. Located in the beautiful region of Alcochete, we offer a natural and peaceful environment for horse riding.',
    about_p2: 'Under the guidance of World Champion Gilberto Filipe, we develop personalized programs that respect each student\'s pace, from beginners to the most experienced.',
    about_feature_1: 'World Champion',
    about_feature_1_desc: 'Gilberto Filipe, lead instructor',
    about_feature_2: 'Total Safety',
    about_feature_2_desc: 'Rigorous safety protocols',
    about_feature_3: 'Passion for Horses',
    about_feature_3_desc: 'Animal care and respect',
    about_feature_4: 'Community',
    about_feature_4_desc: 'Welcoming family environment',
    about_cta: 'Contact Us',
    about_years: 'Years',
    about_experience: 'of Experience',
    
    // Home - CTA
    cta_title: 'Ready to Start Your',
    cta_title_highlight: ' Equestrian Journey?',
    cta_subtitle: 'Take the first step towards a unique experience with horses. Book your first trial lesson or contact us for more information.',
    cta_book: 'Book Lesson',
    cta_call: 'Call Now',
    cta_card_1: 'Trial Lesson',
    cta_card_1_desc: 'Try an introductory lesson and discover the world of horse riding.',
    cta_card_2: 'Facility Visit',
    cta_card_2_desc: 'Schedule a visit to see our space and meet our horses.',
    cta_card_3: 'Monthly Packages',
    cta_card_3_desc: 'Discover our plans with special conditions for regular students.',
    
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
    
    // Home Hero
    excellence_center: 'Equestrian Centre of Excellence',
    world_champion_intro: 'Discover the art of horse riding with',
    world_champion_name: '2x World Champion Gilberto Filipe',
    hero_description: 'We offer personalized lessons, hippotherapy and unique experiences with horses in a natural and welcoming environment.',
    book_lesson: 'Book Lesson',
    know_services: 'Discover Services',
    years_experience: 'Years of Experience',
    students_trained: 'Trained Students',
    world_champion: 'World Champion',
    
    // Services Preview
    our_services: 'Our Services',
    equestrian_experiences: 'Excellence Equestrian Experiences',
    services_description: 'From beginners to experienced riders, we offer personalized programs for all ages and levels.',
    private_lessons: 'Private Lessons',
    private_lessons_desc: 'Individual lessons with experienced instructors or with 2x World Champion Gilberto Filipe.',
    group_lessons: 'Group Lessons',
    group_lessons_desc: 'Classes with up to 4 students, promoting collaborative learning and socialization.',
    hippotherapy: 'Hippotherapy',
    hippotherapy_desc: 'Horse-assisted therapy for physical, emotional and cognitive development.',
    space_rental: 'Space Rental',
    space_rental_desc: 'Unique space for events, birthday parties and special celebrations.',
    view_all_services: 'View All Services',
    
    // About
    about_us: 'About Us',
    excellence_tradition: 'A Tradition of Equestrian Excellence',
    about_description_1: 'Picadeiro Quinta da Horta is more than an equestrian center — it is a place where passion for horses meets excellence in teaching. Located in the beautiful region of Alcochete, we offer a natural and peaceful environment for horse riding.',
    about_description_2: 'we develop personalized programs that respect the pace of each student, from beginners to the most experienced.',
    contact_us: 'Contact Us',
    
    // CTA
    ready_to_start: 'Ready to Start Your',
    equestrian_journey: 'Equestrian Journey?',
    cta_description: 'Take the first step towards a unique experience with horses. Book your first trial lesson or get in touch for more information.',
    call_now: 'Call Now',
    trial_lesson: 'Trial Lesson',
    trial_lesson_desc: 'Try an introductory lesson and discover the world of horse riding.',
    visit_facilities: 'Visit Facilities',
    visit_facilities_desc: 'Schedule a visit to see our space and our horses.',
    monthly_packages: 'Monthly Packages',
    monthly_packages_desc: 'Discover our plans with special conditions for regular students.',
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
    
    // Home - Hero
    hero_badge: 'Centro Ecuestre de Excelencia',
    hero_title: 'Picadeiro',
    hero_title_highlight: 'Quinta da Horta',
    hero_description: 'Descubre el arte de la equitación con el Bicampeón del Mundo Gilberto Filipe. Ofrecemos clases personalizadas, hipoterapia y experiencias únicas con caballos en un ambiente natural y acogedor.',
    hero_cta_primary: 'Reservar Clase',
    hero_cta_secondary: 'Conocer Servicios',
    hero_stat_1: 'Años de Experiencia',
    hero_stat_2: 'Alumnos Formados',
    hero_stat_3: 'Campeón Mundial',
    
    // Home - Services Preview
    services_preview_badge: 'Nuestros Servicios',
    services_preview_title: 'Experiencias Ecuestres de Excelencia',
    services_preview_subtitle: 'Desde principiantes a jinetes experimentados, ofrecemos programas personalizados para todas las edades y niveles.',
    service_1_title: 'Clases Particulares',
    service_1_desc: 'Clases individuales con instructores experimentados o con el Bicampeón Mundial Gilberto Filipe.',
    service_2_title: 'Clases en Grupo',
    service_2_desc: 'Clases con hasta 4 alumnos, promoviendo el aprendizaje colaborativo y la socialización.',
    service_3_title: 'Hipoterapia',
    service_3_desc: 'Terapia asistida por caballos para el desarrollo físico, emocional y cognitivo.',
    service_4_title: 'Alquiler de Espacio',
    service_4_desc: 'Espacio único para eventos, fiestas de cumpleaños y celebraciones especiales.',
    services_view_all: 'Ver Todos los Servicios',
    
    // Home - About
    about_badge: 'Sobre Nosotros',
    about_title: 'Una Tradición de Excelencia Ecuestre',
    about_p1: 'Picadeiro Quinta da Horta es más que un centro ecuestre — es un lugar donde la pasión por los caballos se encuentra con la excelencia en la enseñanza. Ubicado en la hermosa región de Alcochete, ofrecemos un ambiente natural y tranquilo para la práctica de la equitación.',
    about_p2: 'Bajo la dirección del Bicampeón del Mundo Gilberto Filipe, desarrollamos programas personalizados que respetan el ritmo de cada alumno, desde principiantes hasta los más experimentados.',
    about_feature_1: 'Bicampeón Mundial',
    about_feature_1_desc: 'Gilberto Filipe, instructor principal',
    about_feature_2: 'Seguridad Total',
    about_feature_2_desc: 'Protocolos rigurosos de seguridad',
    about_feature_3: 'Pasión por los Caballos',
    about_feature_3_desc: 'Cuidado y respeto animal',
    about_feature_4: 'Comunidad',
    about_feature_4_desc: 'Ambiente familiar acogedor',
    about_cta: 'Contáctenos',
    about_years: 'Años',
    about_experience: 'de Experiencia',
    
    // Home - CTA
    cta_title: 'Listo para Comenzar Tu',
    cta_title_highlight: ' Viaje Ecuestre?',
    cta_subtitle: 'Da el primer paso hacia una experiencia única con caballos. Reserva tu primera clase de prueba o contáctanos para más información.',
    cta_book: 'Reservar Clase',
    cta_call: 'Llamar Ahora',
    cta_card_1: 'Clase de Prueba',
    cta_card_1_desc: 'Prueba una clase introductoria y descubre el mundo de la equitación.',
    cta_card_2: 'Visita a las Instalaciones',
    cta_card_2_desc: 'Agenda una visita para conocer nuestro espacio y nuestros caballos.',
    cta_card_3: 'Paquetes Mensuales',
    cta_card_3_desc: 'Descubre nuestros planes con condiciones especiales para alumnos regulares.',
    
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
    
    // Home Hero
    excellence_center: 'Centro Ecuestre de Excelencia',
    world_champion_intro: 'Descubre el arte de la equitación con',
    world_champion_name: 'Bicampeón Mundial Gilberto Filipe',
    hero_description: 'Ofrecemos clases personalizadas, hipoterapia y experiencias únicas con caballos en un ambiente natural y acogedor.',
    book_lesson: 'Reservar Clase',
    know_services: 'Conocer Servicios',
    years_experience: 'Años de Experiencia',
    students_trained: 'Alumnos Formados',
    world_champion: 'Campeón Mundial',
    
    // Services Preview
    our_services: 'Nuestros Servicios',
    equestrian_experiences: 'Experiencias Ecuestres de Excelencia',
    services_description: 'Desde principiantes hasta jinetes experimentados, ofrecemos programas personalizados para todas las edades y niveles.',
    private_lessons: 'Clases Particulares',
    private_lessons_desc: 'Clases individuales con monitores experimentados o con el Bicampeón Mundial Gilberto Filipe.',
    group_lessons: 'Clases en Grupo',
    group_lessons_desc: 'Clases con hasta 4 alumnos, promoviendo el aprendizaje colaborativo y la socialización.',
    hippotherapy: 'Hipoterapia',
    hippotherapy_desc: 'Terapia asistida por caballos para desarrollo físico, emocional y cognitivo.',
    space_rental: 'Alquiler de Espacio',
    space_rental_desc: 'Espacio único para eventos, fiestas de cumpleaños y celebraciones especiales.',
    view_all_services: 'Ver Todos los Servicios',
    
    // About
    about_us: 'Sobre Nosotros',
    excellence_tradition: 'Una Tradición de Excelencia Ecuestre',
    about_description_1: 'El Picadeiro Quinta da Horta es más que un centro ecuestre — es un lugar donde la pasión por los caballos encuentra la excelencia en la enseñanza. Ubicado en la hermosa región de Alcochete, ofrecemos un ambiente natural y tranquilo para la práctica de la equitación.',
    about_description_2: 'desarrollamos programas personalizados que respetan el ritmo de cada alumno, desde principiantes hasta los más experimentados.',
    contact_us: 'Contáctenos',
    
    // CTA
    ready_to_start: 'Listo para Comenzar Tu',
    equestrian_journey: 'Viaje Ecuestre?',
    cta_description: 'Da el primer paso hacia una experiencia única con caballos. Reserva tu primera clase de prueba o ponte en contacto para más información.',
    call_now: 'Llamar Ahora',
    trial_lesson: 'Clase de Prueba',
    trial_lesson_desc: 'Prueba una clase introductoria y descubre el mundo de la equitación.',
    visit_facilities: 'Visita a las Instalaciones',
    visit_facilities_desc: 'Agenda una visita para conocer nuestro espacio y nuestros caballos.',
    monthly_packages: 'Paquetes Mensuales',
    monthly_packages_desc: 'Descubre nuestros planes con condiciones especiales para alumnos regulares.',
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
    
    // Home - Hero
    hero_badge: 'Centre Équestre d\'Excellence',
    hero_title: 'Picadeiro',
    hero_title_highlight: 'Quinta da Horta',
    hero_description: 'Découvrez l\'art de l\'équitation avec le double Champion du Monde Gilberto Filipe. Nous proposons des cours personnalisés, de l\'hippothérapie et des expériences uniques avec les chevaux dans un environnement naturel et accueillant.',
    hero_cta_primary: 'Réserver un Cours',
    hero_cta_secondary: 'Découvrir les Services',
    hero_stat_1: 'Ans d\'Expérience',
    hero_stat_2: 'Élèves Formés',
    hero_stat_3: 'Champion du Monde',
    
    // Home - Services Preview
    services_preview_badge: 'Nos Services',
    services_preview_title: 'Expériences Équestres d\'Excellence',
    services_preview_subtitle: 'Des débutants aux cavaliers expérimentés, nous proposons des programmes personnalisés pour tous les âges et niveaux.',
    service_1_title: 'Cours Particuliers',
    service_1_desc: 'Cours individuels avec des instructeurs expérimentés ou avec le double Champion du Monde Gilberto Filipe.',
    service_2_title: 'Cours en Groupe',
    service_2_desc: 'Cours avec jusqu\'à 4 élèves, favorisant l\'apprentissage collaboratif et la socialisation.',
    service_3_title: 'Hippothérapie',
    service_3_desc: 'Thérapie assistée par les chevaux pour le développement physique, émotionnel et cognitif.',
    service_4_title: 'Location d\'Espace',
    service_4_desc: 'Espace unique pour événements, fêtes d\'anniversaire et célébrations spéciales.',
    services_view_all: 'Voir Tous les Services',
    
    // Home - About
    about_badge: 'À Propos',
    about_title: 'Une Tradition d\'Excellence Équestre',
    about_p1: 'Picadeiro Quinta da Horta est plus qu\'un centre équestre — c\'est un lieu où la passion des chevaux rencontre l\'excellence dans l\'enseignement. Situé dans la belle région d\'Alcochete, nous offrons un environnement naturel et paisible pour la pratique de l\'équitation.',
    about_p2: 'Sous la direction du double Champion du Monde Gilberto Filipe, nous développons des programmes personnalisés qui respectent le rythme de chaque élève, des débutants aux plus expérimentés.',
    about_feature_1: 'Double Champion du Monde',
    about_feature_1_desc: 'Gilberto Filipe, instructeur principal',
    about_feature_2: 'Sécurité Totale',
    about_feature_2_desc: 'Protocoles de sécurité rigoureux',
    about_feature_3: 'Passion pour les Chevaux',
    about_feature_3_desc: 'Soins et respect des animaux',
    about_feature_4: 'Communauté',
    about_feature_4_desc: 'Environnement familial accueillant',
    about_cta: 'Contactez-nous',
    about_years: 'Ans',
    about_experience: 'd\'Expérience',
    
    // Home - CTA
    cta_title: 'Prêt à Commencer Votre',
    cta_title_highlight: ' Voyage Équestre?',
    cta_subtitle: 'Faites le premier pas vers une expérience unique avec les chevaux. Réservez votre premier cours d\'essai ou contactez-nous pour plus d\'informations.',
    cta_book: 'Réserver un Cours',
    cta_call: 'Appeler Maintenant',
    cta_card_1: 'Cours d\'Essai',
    cta_card_1_desc: 'Essayez un cours d\'initiation et découvrez le monde de l\'équitation.',
    cta_card_2: 'Visite des Installations',
    cta_card_2_desc: 'Planifiez une visite pour découvrir notre espace et rencontrer nos chevaux.',
    cta_card_3: 'Forfaits Mensuels',
    cta_card_3_desc: 'Découvrez nos plans avec des conditions spéciales pour les élèves réguliers.',
    
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
    
    // Home Hero
    excellence_center: 'Centre Équestre d\'Excellence',
    world_champion_intro: 'Découvrez l\'art de l\'équitation avec',
    world_champion_name: 'Double Champion du Monde Gilberto Filipe',
    hero_description: 'Nous proposons des cours personnalisés, de l\'hippothérapie et des expériences uniques avec les chevaux dans un environnement naturel et accueillant.',
    book_lesson: 'Réserver un Cours',
    know_services: 'Découvrir les Services',
    years_experience: 'Années d\'Expérience',
    students_trained: 'Élèves Formés',
    world_champion: 'Champion du Monde',
    
    // Services Preview
    our_services: 'Nos Services',
    equestrian_experiences: 'Expériences Équestres d\'Excellence',
    services_description: 'Des débutants aux cavaliers expérimentés, nous proposons des programmes personnalisés pour tous les âges et niveaux.',
    private_lessons: 'Cours Particuliers',
    private_lessons_desc: 'Cours individuels avec des moniteurs expérimentés ou avec le Double Champion du Monde Gilberto Filipe.',
    group_lessons: 'Cours en Groupe',
    group_lessons_desc: 'Cours avec jusqu\'à 4 élèves, favorisant l\'apprentissage collaboratif et la socialisation.',
    hippotherapy: 'Hippothérapie',
    hippotherapy_desc: 'Thérapie assistée par chevaux pour le développement physique, émotionnel et cognitif.',
    space_rental: 'Location d\'Espace',
    space_rental_desc: 'Espace unique pour événements, anniversaires et célébrations spéciales.',
    view_all_services: 'Voir Tous les Services',
    
    // About
    about_us: 'À Propos',
    excellence_tradition: 'Une Tradition d\'Excellence Équestre',
    about_description_1: 'Le Picadeiro Quinta da Horta est plus qu\'un centre équestre — c\'est un lieu où la passion des chevaux rencontre l\'excellence dans l\'enseignement. Situé dans la belle région d\'Alcochete, nous offrons un environnement naturel et paisible pour la pratique de l\'équitation.',
    about_description_2: 'nous développons des programmes personnalisés qui respectent le rythme de chaque élève, des débutants aux plus expérimentés.',
    contact_us: 'Contactez-nous',
    
    // CTA
    ready_to_start: 'Prêt à Commencer Votre',
    equestrian_journey: 'Aventure Équestre?',
    cta_description: 'Faites le premier pas vers une expérience unique avec les chevaux. Réservez votre premier cours d\'essai ou contactez-nous pour plus d\'informations.',
    call_now: 'Appeler Maintenant',
    trial_lesson: 'Cours d\'Essai',
    trial_lesson_desc: 'Essayez un cours d\'introduction et découvrez le monde de l\'équitation.',
    visit_facilities: 'Visite des Installations',
    visit_facilities_desc: 'Planifiez une visite pour découvrir notre espace et nos chevaux.',
    monthly_packages: 'Forfaits Mensuels',
    monthly_packages_desc: 'Découvrez nos plans avec conditions spéciales pour les élèves réguliers.',
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