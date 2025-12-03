import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Cache for loaded translations
const translationsCache: { [key in Language]?: Record<string, string> } = {};

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTranslations = async (lang: Language) => {
      if (translationsCache[lang]) {
        setTranslations(translationsCache[lang]!);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Using a relative path from the root of the site where index.html is served
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        translationsCache[lang] = data;
        setTranslations(data);
      } catch (error) {
        console.error("Failed to fetch translations:", error);
        setTranslations({}); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations(language);
  }, [language]);

  const t = useCallback((key: string, params?: { [key:string]: string | number }): string => {
    let translation = translations[key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    return translation;
  }, [translations]);

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  // A simple loading state to prevent rendering the app with untranslated keys
  if (isLoading && !Object.keys(translations).length) {
    return <div>Loading language...</div>;
  }

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
