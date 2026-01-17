import { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

const THEME_KEY = "@fishing_log_theme";

export type ThemePreference = "auto" | "light" | "dark";

interface ThemeContextType {
  theme: typeof Colors.light;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export function useThemeProvider() {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("auto");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === "auto" || stored === "light" || stored === "dark") {
          setThemePreferenceState(stored);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, pref);
      setThemePreferenceState(pref);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  }, []);

  // Determine effective theme
  const effectiveTheme = themePreference === "auto" 
    ? (systemColorScheme ?? "light")
    : themePreference;
  
  const isDark = effectiveTheme === "dark";
  const theme = Colors[effectiveTheme];

  return {
    theme,
    isDark,
    themePreference,
    setThemePreference,
    isLoaded,
  };
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context) {
    return context;
  }
  
  // Fallback for components not wrapped in ThemeProvider
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = Colors[colorScheme ?? "light"];

  return {
    theme,
    isDark,
    themePreference: "auto" as ThemePreference,
    setThemePreference: async () => {},
  };
}
