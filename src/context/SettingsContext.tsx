import React, { createContext, useState, useContext } from 'react';

// Define the shape of our settings
interface SettingsContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: string;
  changeLanguage: (lang: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const changeLanguage = (lang: string) => setLanguage(lang);

  return (
    <SettingsContext.Provider value={{ isDarkMode, toggleDarkMode, language, changeLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to be used in Profile, Dashboard, and History screens
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};