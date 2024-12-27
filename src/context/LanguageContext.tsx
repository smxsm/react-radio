import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Language = {
  code: string;
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'en', name: 'English', flag: 'GB' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
];

type LanguageContextType = {
  currentLanguage: Language;
  languages: Language[];
  changeLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages.find((lang) => lang.code === i18n.language) || languages[0]
  );

  const changeLanguage = (code: string) => {
    const newLang = languages.find((lang) => lang.code === code);
    if (newLang) {
      i18n.changeLanguage(code);
      setCurrentLanguage(newLang);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languages,
        changeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
