import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Menu, X, Phone, Mail, MapPin, Facebook, Instagram, 
  ChevronUp, User, LogOut, ShoppingCart, Heart 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from '@/components/LanguageProvider';
import LanguageSelector from '@/components/LanguageSelector';

export default function Layout({ children, currentPageName }) {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {
        console.log('Not authenticated');
      }
    };
    checkAuth();

    // Update cart count
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      const countEl = document.getElementById('cart-count');
      if (countEl) countEl.textContent = count;
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Admin shortcut CTRL+SHIFT+6
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === '6') {
        window.location.href = createPageUrl('AdminLogin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdminPage = currentPageName?.startsWith('Admin');
  if (isAdminPage) {
    return <>{children}</>;
  }

  const navLinks = [
    { name: t('nav_home'), page: 'Home' },
    { name: t('nav_services'), page: 'Services' },
    { name: t('nav_gallery'), page: 'Gallery' },
    { name: t('nav_shop'), page: 'Shop' },
    { name: t('nav_bookings'), page: 'Bookings' },
    { name: t('nav_contact'), page: 'Contact' },
  ];

  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateWishlistCount = async () => {
      if (user?.email) {
        try {
          const wishlist = await base44.entities.Wishlist.filter({ client_email: user.email });
          setWishlistCount(wishlist.length);
        } catch (e) {}
      }
    };
    updateWishlistCount();
  }, [user]);

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
            <a href="mailto:picadeiroquintadahortagf@gmail.com" className="flex items-center gap-2 hover:text-[#B8956A] transition-colors">
              <Mail className="w-3.5 h-3.5" />
              picadeiroquintadahortagf@gmail.com
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
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                alt="Picadeiro Quinta da Horta"
                className="h-14 w-14 object-cover rounded-full"
              />
              <div className="hidden md:block">
                <h1 className="text-lg font-serif font-bold text-[#1A1A1A]">Picadeiro</h1>
                <p className="text-xs text-[#8B7355] tracking-wider">QUINTA DA HORTA</p>
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

              {user && (
                <Link to={createPageUrl('Wishlist')} className="relative p-2 hover:bg-stone-100 rounded-full transition-colors group">
                  <Heart className="w-5 h-5 text-[#2C3E1F] group-hover:text-[#B8956A] transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              <Link to={createPageUrl('Cart')} className="relative p-2 hover:bg-stone-100 rounded-full transition-colors group">
                <ShoppingCart className="w-5 h-5 text-[#2C3E1F] group-hover:text-[#B8956A] transition-colors" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B8956A] text-white text-xs rounded-full flex items-center justify-center font-semibold" id="cart-count">
                  0
                </span>
              </Link>

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
                      <Link to={createPageUrl('ClientDashboard')} className="flex items-center gap-2">
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
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg">
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors ${
                    currentPageName === link.page 
                      ? 'bg-[#B8956A] text-white' 
                      : 'text-[#2D2D2D] hover:bg-stone-100'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <Link to={createPageUrl('Home')} className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
                <div className="w-20 h-20 rounded-full bg-white p-2 flex items-center justify-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695506be843687b2f61b8758/8b9c42396_944BDCD3-BD5F-45A8-A0F7-F73EB7F7BE9B2.PNG" 
                    alt="Picadeiro Quinta da Horta"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </Link>
              <p className="text-stone-300 text-sm leading-relaxed">
                Centro equestre de excelência em Alcochete, oferecendo aulas de equitação, 
                hipoterapia e experiências únicas com cavalos.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#B8956A]">{t('nav_home')}</h4>
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
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#B8956A]">Serviços</h4>
              <ul className="space-y-3 text-sm text-stone-300">
                <li>Aulas Particulares</li>
                <li>Aulas em Grupo</li>
                <li>Hipoterapia</li>
                <li>Aluguer de Espaço</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#B8956A]">Contactos</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#B8956A] flex-shrink-0 mt-0.5" />
                  <span className="text-stone-300 text-sm">
                    Rua das Hortas 83 – Fonte da Senhora<br />
                    Alcochete, Portugal
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
                  <a href="mailto:picadeiroquintadahortagf@gmail.com" className="text-stone-300 hover:text-white text-sm break-all">
                    picadeiroquintadahortagf@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-stone-400 text-sm">
              © {new Date().getFullYear()} Picadeiro Quinta da Horta. Todos os direitos reservados.
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
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#2D2D2D] text-white rounded-full shadow-lg 
                     flex items-center justify-center hover:bg-[#1A1A1A] transition-all duration-300
                     animate-in fade-in slide-in-from-bottom-4 z-50"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}