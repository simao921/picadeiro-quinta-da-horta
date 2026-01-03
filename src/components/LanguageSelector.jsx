import React, { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

const languages = [
  { 
    code: 'pt', 
    name: 'Português', 
    flag: '🇵🇹'
  },
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇬🇧'
  },
  { 
    code: 'es', 
    name: 'Español', 
    flag: '🇪🇸'
  },
  { 
    code: 'fr', 
    name: 'Français', 
    flag: '🇫🇷'
  }
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const currentLang = languages.find(l => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center gap-2 hover:bg-stone-100"
        >
          <span className="text-2xl">{currentLang?.flag}</span>
          <span className="hidden sm:inline text-sm font-medium">{currentLang?.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              language === lang.code ? 'bg-stone-100 font-semibold' : ''
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}