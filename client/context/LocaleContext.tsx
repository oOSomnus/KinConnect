import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
  TranslationKey,
  getTranslation,
} from "../i18n/translations";

const LANGUAGE_STORAGE_KEY = "kinconnect_language";

type LocaleContextValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey | string) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (
          stored &&
          LANGUAGE_OPTIONS.some((option) => option.code === stored)
        ) {
          setLanguageState(stored as LanguageCode);
        }
      } catch {
        // ignore hydration errors
      }
    })();
  }, []);

  const handleSetLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code).catch(() => {});
  }, []);

  const translator = useCallback(
    (key: TranslationKey | string) => getTranslation(language, key),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t: translator,
    }),
    [language, handleSetLanguage, translator]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => useContext(LocaleContext);
