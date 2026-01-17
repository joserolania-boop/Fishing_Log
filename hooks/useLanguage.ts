import { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { Language, translations, TranslationKeys } from "@/constants/i18n";

const LANGUAGE_KEY = "@fishing_log_language";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
  isLoaded: boolean;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguageProvider() {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored === "en" || stored === "es" || stored === "zh") {
          setLanguageState(stored);
        } else {
          const deviceLocale = Localization.getLocales()[0]?.languageCode;
          if (deviceLocale === "es") {
            setLanguageState("es");
          } else if (deviceLocale === "zh") {
            setLanguageState("zh");
          }
        }
      } catch (error) {
        console.error("Failed to load language:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  }, []);

  return {
    language,
    setLanguage,
    t: translations[language] as TranslationKeys,
    isLoaded,
  };
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
