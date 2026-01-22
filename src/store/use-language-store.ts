import { create } from 'zustand';
import { translations, Language, TranslationKey } from '@/i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en', // Default to English
  setLanguage: (language) => set({ language }),
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || key;
  },
}));
