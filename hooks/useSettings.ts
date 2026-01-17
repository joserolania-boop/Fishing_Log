import { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@fishing_log_settings";

export type UnitSystem = "metric" | "imperial";
export type AvatarType = "standing" | "boat" | "casting";

export interface Settings {
  displayName: string;
  avatar: AvatarType;
  units: UnitSystem;
  customAvatarUri?: string | null;
}

const defaultSettings: Settings = {
  displayName: "Angler",
  avatar: "standing",
  units: "metric",
  customAvatarUri: null,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  isLoaded: boolean;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettingsProvider() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function formatWeight(weight: number, units: UnitSystem): string {
  if (units === "imperial") {
    const lbs = weight * 2.20462;
    return `${lbs.toFixed(2)} lb`;
  }
  return `${weight.toFixed(2)} kg`;
}

export function parseWeight(value: string, units: UnitSystem): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  if (units === "imperial") {
    return num / 2.20462;
  }
  return num;
}
