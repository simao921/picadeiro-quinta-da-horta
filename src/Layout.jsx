import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Menu, X, Phone, Mail, MapPin, Facebook, Instagram, 
  ChevronUp, User, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageProvider, useLanguage } from '@/components/LanguageProvider';
import LanguageSelector from '@/components/LanguageSelector';
import LazyImage from '@/components/ui/LazyImage';
import { getSiteImage, DEFAULT_IMAGES } from '@/components/lib/siteImages';
import CookieBanner from '@/components/CookieBanner';
import { Home as HomeIcon, Calendar as CalendarIcon, User as UserIcon, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';


const LayoutContent = React.memo(({ children, currentPageName }) => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStart = React.useRef(0);
  const isPulling = React.useRef(false);
  const mainContentRef = React.useRef(null);

  const [logoUrl, setLogoUrl] = useState('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG');

  const isAdminPage = currentPageName?.startsWith('Admin');
  const isDeveloperPage = currentPageName === 'DeveloperPanel';
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = React.useState('');
  const [maintenanceChecked, setMaintenanceChecked] = React.useState(false);

  useEffect(() => {
    // Check maintenance mode - simplified and faster
    const checkMaintenance = async () => {
      try {
        const settings = await base44.entities.SiteSettings.filter({ key: 'maintenance_mode' });
        const isMaintenanceOn = settings.length > 0 && settings[0].value === 'true';
        
        if (!isMaintenanceOn) {
          setMaintenanceChecked(true);
          return;
        }

        const msgSettings = await base44.entities.SiteSettings.filter({ key: 'maintenance_message' });
        const msg = msgSettings.length > 0 ? msgSettings[0].value : 'Site em manutenção. Voltamos em breve!';
        
        // Quick admin check
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          if (userData.role === 'admin') {
            setMaintenanceChecked(true);
            return;
          }
        }
        
        setMaintenanceMode(true);
        setMaintenanceMessage(msg);
      } catch (e) {
        console.error('Error checking maintenance:', e);
      } finally {
        setMaintenanceChecked(true);
      }
    };
    checkMaintenance();
  }, []);

  useEffect(() => {
    // Check auth asynchronously without blocking
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) {
        base44.auth.me().then(setUser).catch(() => setUser(null));
      } else {
        setUser(null);
      }
    }).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    let ticking = false;
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Só atualiza se mudou significativamente
      if (Math.abs(currentScroll - lastScroll) < 10 && ticking) return;
      
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(currentScroll > 50);
          setShowScrollTop(currentScroll > 400);
          lastScroll = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Usar e.code para compatibilidade entre Windows e Mac
      // Digit6 e Digit9 são consistentes independentemente do layout de teclado
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'Digit6' || e.key === '6')) {
        e.preventDefault();
        sessionStorage.setItem('admin_keyboard_access', 'true');
        window.location.href = createPageUrl('AdminLogin');
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === 'Digit9' || e.key === '9')) {
        e.preventDefault();
        sessionStorage.setItem('dev_keyboard_access', 'true');
        window.location.href = createPageUrl('DeveloperPanel');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Atalho para tablets/mobile: tocar 5 vezes no logo em 2 segundos
  const [logoTaps, setLogoTaps] = React.useState([]);
  
  const handleLogoTap = () => {
    const now = Date.now();
    const recentTaps = [...logoTaps, now].filter(t => now - t < 2000);
    setLogoTaps(recentTaps);
    
    if (recentTaps.length >= 7) {
      sessionStorage.setItem('admin_keyboard_access', 'true');
      window.location.href = createPageUrl('AdminLogin');
      setLogoTaps([]);
    }
  };



  useEffect(() => {
    // Load logo image
    getSiteImage('logo', DEFAULT_IMAGES.logo).then(setLogoUrl);

    // Check if can go back (for mobile back button)
    setCanGoBack(window.history.length > 1 && currentPageName !== 'Home');
  }, [currentPageName]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Pull-to-refresh handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger reload of current page data
    window.location.reload();
  };

  const handleTouchStart = (e) => {
    if (window.scrollY === 0 && mainContentRef.current) {
      touchStart.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current || window.scrollY > 0) return;

    const distance = e.touches[0].clientY - touchStart.current;
    if (distance > 0 && distance < 120) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
    isPulling.current = false;
  };

  const handleLogout = useCallback(() => {
    base44.auth.logout();
  }, []);

  if (isAdminPage || isDeveloperPage) {
    return <>{children}</>;
  }

  // Don't block rendering, let page load while checking maintenance
  if (!maintenanceChecked && !maintenanceMode) {
    // Continue rendering while checking
  }

  // Maintenance mode screen
  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white">{maintenanceMessage}</h1>
          <p className="text-stone-400">
            Estamos a trabalhar para melhorar a sua experiência.
            Por favor, volte mais tarde.
          </p>
          <div className="pt-4">
            <div className="animate-pulse flex space-x-2 justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animation-delay-200"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animation-delay-400"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: t('nav_home'), page: 'Home' },
    { name: t('nav_services'), page: 'Services' },
    { name: t('nav_gallery') || 'Galeria', page: 'Gallery' },
    { name: t('nav_bookings'), page: 'Bookings' },
    { name: 'Competições', page: 'Competitions' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --color-primary: #2D2D2D;
          --color-primary-light: #4A4A4A;
          --color-secondary: #8B7355;
          --color-accent: #B8956A;
          --color-dark: #1A1A1A;
          --color-cream: #F5F3EF;
          --color-stone: #E8E4DD;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        
        .gradient-gold {
          background: linear-gradient(135deg, #B8956A 0%, #C9A961 50%, #B8956A 100%);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #B8956A 0%, #8B7355 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        * {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Top Bar */}
      <div className="bg-[#1A1A1A] text-white py-2 px-4 text-sm hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="tel:+351932111786" className="flex items-center gap-2 hover:text-[#B8956A] transition-colors">
              <Phone className="w-3.5 h-3.5" />
              +351 932 111 786
            </a>
            <a href="mailto:picadeiroquintadahorta.gf@gmail.com" className="flex items-center gap-2 hover:text-[#B8956A] transition-colors">
              <Mail className="w-3.5 h-3.5" />
              picadeiroquintadahorta.gf@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/Picadeiroquintadahortaoficial/" target="_blank" rel="noopener noreferrer" className="hover:text-[#B8956A] transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/picadeiro.quinta.da.horta/" target="_blank" rel="noopener noreferrer" className="hover:text-[#B8956A] transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-500 safe-top ${
          isScrolled 
            ? 'bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-lg py-2' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Mobile Back Button */}
            {canGoBack && (
              <button
                onClick={() => window.history.back()}
                className="lg:hidden p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors mr-2"
                aria-label="Voltar"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* Logo */}
            <Link 
              to={createPageUrl('Home')} 
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
              aria-label="Ir para página inicial"
              onClick={(e) => {
                handleLogoTap();
              }}
            >
              <LazyImage
                src={logoUrl}
                alt="Picadeiro Quinta da Horta"
                className="h-16 w-16 object-cover rounded-full"
                priority={true}
              />
              <div className="hidden md:block">
                <h1 className="text-xl font-serif font-bold text-[#1A1A1A]">Picadeiro</h1>
                <p className="text-sm text-[#8B7355] tracking-wider">QUINTA DA HORTA</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`text-sm font-medium transition-all duration-200 pb-1 border-b-2 ${
                    currentPageName === link.page 
                      ? 'text-[#B8956A] border-[#B8956A]' 
                      : 'text-[#1A1A1A] hover:text-[#B8956A] border-transparent'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <LanguageSelector />



              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#2D2D2D] flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-sm">{user.full_name?.split(' ')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('UserProfile')} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('my_account')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white"
                >
                  {t('login')}
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg animate-in slide-in-from-top-2">
            <nav className="flex flex-col p-4 gap-2" role="navigation" aria-label="Menu principal">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8956A] focus:ring-offset-2 ${
                    currentPageName === link.page 
                      ? 'bg-[#B8956A] text-white' 
                      : 'text-[#2D2D2D] hover:bg-stone-100'
                  }`}
                  aria-current={currentPageName === link.page ? 'page' : undefined}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main 
        ref={mainContentRef}
        className="flex-1 pb-20 lg:pb-0 relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {pullDistance > 0 && (
          <div 
            className="fixed top-16 left-0 right-0 flex items-center justify-center z-40 pointer-events-none"
            style={{ 
              transform: `translateY(${Math.min(pullDistance - 50, 0)}px)`,
              opacity: Math.min(pullDistance / 80, 1)
            }}
          >
            <div className={`p-3 bg-white dark:bg-stone-800 rounded-full shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}>
              <svg className="w-6 h-6 text-[#B8956A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}

        <motion.div
          key={currentPageName}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 safe-bottom no-select">
        <div className="flex justify-around items-center h-16">
          <Link
            to={createPageUrl('Home')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPageName === 'Home'
                ? 'text-[#B8956A]'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">{t('nav_home')}</span>
          </Link>
          <Link
            to={createPageUrl('Services')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPageName === 'Services'
                ? 'text-[#B8956A]'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-xs mt-1">{t('nav_services')}</span>
          </Link>
          <Link
            to={createPageUrl('Bookings')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentPageName === 'Bookings'
                ? 'text-[#B8956A]'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="text-xs mt-1">{t('nav_bookings')}</span>
          </Link>
          {user && (
            <Link
              to={createPageUrl('UserProfile')}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                currentPageName === 'UserProfile'
                  ? 'text-[#B8956A]'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <UserIcon className="w-6 h-6" />
              <span className="text-xs mt-1">{t('my_account')}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white safe-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <Link to={createPageUrl('Home')} className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
                <div className="w-20 h-20 rounded-full bg-white p-2 flex items-center justify-center">
                  <LazyImage
                    src={logoUrl}
                    alt="Picadeiro Quinta da Horta"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </Link>
              <p className="text-stone-300 text-sm leading-relaxed">
                {t('footer_description')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#B8956A]">{t('quick_links')}</h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                <li key={link.page}>
                  <Link 
                    to={createPageUrl(link.page)}
                    className="text-stone-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#B8956A]">{t('services_title')}</h4>
              <ul className="space-y-3 text-sm text-stone-300">
                <li>{t('service_private_title')}</li>
                <li>{t('service_group_title')}</li>
                <li>{t('service_rental_title')}</li>
                <li>{t('service_owners_title')}</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#B8956A]">Contactos</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#B8956A] flex-shrink-0 mt-0.5" />
                  <span className="text-stone-300 text-sm">
                    Rua das Hortas - Picadeiro Quinta da Horta - Fonte da Senhora<br />
                    2890-106 Alcochete
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#B8956A]" />
                  <a href="tel:+351932111786" className="text-stone-300 hover:text-white text-sm">
                    +351 932 111 786
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#B8956A]" />
                  <a href="mailto:picadeiroquintadahorta.gf@gmail.com" className="text-stone-300 hover:text-white text-sm break-all">
                    picadeiroquintadahorta.gf@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-stone-400 text-xs sm:text-sm text-center md:text-left">
              © {new Date().getFullYear()} Picadeiro Quinta da Horta - Rua das Hortas - Fonte da Senhora, 2890-106 Alcochete
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/Picadeiroquintadahortaoficial/" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#B8956A] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/picadeiro.quinta.da.horta/" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#B8956A] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Voltar ao topo"
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 
                     bg-[#2D2D2D] text-white rounded-full shadow-lg 
                     flex items-center justify-center hover:bg-[#1A1A1A] transition-all duration-300
                     hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#B8956A] focus:ring-offset-2
                     animate-in fade-in slide-in-from-bottom-4 z-40"
        >
          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Cookie Banner */}
      <CookieBanner />
      </div>
      );
      });

      const Layout = ({ children, currentPageName }) => {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
};

export default Layout;