'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';
import { toBanglaDigits, formatCurrency } from '@/lib/numbers';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: typeof translations['bn'];
  formatMoney: (amount: number) => string;
  formatNumber: (num: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('bn'); // Bangla is default as per requirements

  useEffect(() => {
    const saved = localStorage.getItem('sayedi_lang') as Language;
    if (saved && (saved === 'bn' || saved === 'en')) {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('sayedi_lang', newLang);
  };

  const toggleLang = () => {
    handleSetLang(lang === 'bn' ? 'en' : 'bn');
  };

  const formatMoney = (amount: number) => {
    return formatCurrency(amount, lang === 'bn');
  };

  const formatNumber = (num: number | string) => {
    return lang === 'bn' ? toBanglaDigits(num) : num.toString();
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: handleSetLang,
        toggleLang,
        t: translations[lang],
        formatMoney,
        formatNumber,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
