import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const CookieBanner = React.memo(() => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies_accepted');
    if (!accepted) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookies_accepted', 'false');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-2xl animate-in slide-in-from-bottom-4">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-lg text-[#1A1A1A] mb-2">
              🍪 Cookies e Privacidade
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Utilizamos cookies essenciais para garantir o funcionamento do site e melhorar a sua experiência. 
              Os seus dados são tratados com confidencialidade e não são partilhados com terceiros.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              className="text-sm"
            >
              Recusar
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-[#B8956A] hover:bg-[#8B7355] text-white text-sm"
            >
              Aceitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

CookieBanner.displayName = 'CookieBanner';

export default CookieBanner;