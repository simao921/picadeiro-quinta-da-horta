import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Menu, X, Phone, Mail, MapPin, Facebook, Instagram, 
  ChevronUp, User, LogOut, ShoppingCart 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
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
    { name: 'Início', page: 'Home' },
    { name: 'Serviços', page: 'Services' },
    { name: 'Galeria', page: 'Gallery' },
    { name: 'Loja', page: 'Shop' },
    { name: 'Reservas', page: 'Bookings' },
    { name: 'Contactos', page: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <style>{`
        :root {
          --color-primary: #4A5D23;
          --color-primary-light: #6B7F3A;
          --color-secondary: #8B7355;
          --color-accent: #C9A961;
          --color-dark: #2C3E1F;
          --color-cream: #F5F3EF;
          --color-stone: #E8E4DD;
        }
        
        .font-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }
        
        .gradient-gold {
          background: linear-gradient(135deg, #C9A961 0%, #DFC17A 50%, #C9A961 100%);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #4A5D23 0%, #6B7F3A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Top Bar */}
      <div className="bg-[#2C3E1F] text-white py-2 px-4 text-sm hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="tel:+351932111786" className="flex items-center gap-2 hover:text-[#C9A961] transition-colors">
              <Phone className="w-3.5 h-3.5" />
              +351 932 111 786
            </a>
            <a href="mailto:picadeiroquintadahortagf@gmail.com" className="flex items-center gap-2 hover:text-[#C9A961] transition-colors">
              <Mail className="w-3.5 h-3.5" />
              picadeiroquintadahortagf@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#C9A961] transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-[#C9A961] transition-colors">
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
              <div className="w-12 h-12 rounded-full bg-[#4A5D23] flex items-center justify-center">
                <span className="text-white font-serif text-lg font-bold">PH</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-serif font-bold text-[#2C3E1F]">Picadeiro</h1>
                <p className="text-xs text-[#8B7355] tracking-wider">QUINTA DA HORTA</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`text-sm font-medium transition-colors hover:text-[#4A5D23] pb-1 ${
                    currentPageName === link.page 
                      ? 'text-[#4A5D23] border-b-2 border-[#4A5D23]' 
                      : 'text-[#2C3E1F]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Cart')} className="relative p-2 hover:bg-stone-100 rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5 text-[#2C3E1F]" />
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#4A5D23] flex items-center justify-center">
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
                        Minha Conta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      Terminar Sessão
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-[#4A5D23] hover:bg-[#3A4A1B] text-white"
                >
                  Entrar
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
                      ? 'bg-[#4A5D23] text-white' 
                      : 'text-[#2C3E1F] hover:bg-stone-100'
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
      <footer className="bg-[#2C3E1F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#C9A961] flex items-center justify-center">
                  <span className="text-[#2C3E1F] font-serif text-xl font-bold">PH</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">Picadeiro</h3>
                  <p className="text-xs text-[#C9A961] tracking-wider">QUINTA DA HORTA</p>
                </div>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed">
                Centro equestre de excelência em Alcochete, oferecendo aulas de equitação, 
                hipoterapia e experiências únicas com cavalos.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#C9A961]">Links Rápidos</h4>
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
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#C9A961]">Serviços</h4>
              <ul className="space-y-3 text-sm text-stone-300">
                <li>Aulas Particulares</li>
                <li>Aulas em Grupo</li>
                <li>Hipoterapia</li>
                <li>Aluguer de Espaço</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-6 text-[#C9A961]">Contactos</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C9A961] flex-shrink-0 mt-0.5" />
                  <span className="text-stone-300 text-sm">
                    Rua das Hortas 83 – Fonte da Senhora<br />
                    Alcochete, Portugal
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#C9A961]" />
                  <a href="tel:+351932111786" className="text-stone-300 hover:text-white text-sm">
                    +351 932 111 786
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#C9A961]" />
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
              <a href="#" className="text-stone-400 hover:text-[#C9A961] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-stone-400 hover:text-[#C9A961] transition-colors">
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
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#4A5D23] text-white rounded-full shadow-lg 
                     flex items-center justify-center hover:bg-[#3A4A1B] transition-all duration-300
                     animate-in fade-in slide-in-from-bottom-4 z-50"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}