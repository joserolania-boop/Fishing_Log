import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemedView } from "@/components/ThemedView";
import { ToastProvider } from "@/components/Toast";
import { ThemeContext, useThemeProvider } from "@/hooks/useTheme";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import {
  LanguageContext,
  useLanguageProvider,
} from "@/hooks/useLanguage";
import {
  SettingsContext,
  useSettingsProvider,
} from "@/hooks/useSettings";

const ONBOARDING_COMPLETE_KEY = "@fishing_log_onboarding_complete";

function AppContent() {
  const themeProvider = useThemeProvider();
  const languageProvider = useLanguageProvider();
  const settingsProvider = useSettingsProvider();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      const [privacyAccepted, onboardingComplete] = await Promise.all([
        AsyncStorage.getItem("privacyPolicyAccepted"),
        AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
      ]);
      
      if (!privacyAccepted) {
        setShowPrivacyModal(true);
      }
      
      if (!onboardingComplete) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking initial state:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePrivacyAccept = async () => {
    try {
      await AsyncStorage.setItem("privacyPolicyAccepted", "true");
      setShowPrivacyModal(false);
    } catch (error) {
      console.error("Error saving privacy acceptance:", error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  };

  if (!languageProvider.isLoaded || !settingsProvider.isLoaded || !themeProvider.isLoaded || isInitializing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeProvider.theme.link} />
      </ThemedView>
    );
  }

  // Show onboarding for new users
  if (showOnboarding && !showPrivacyModal) {
    return (
      <ThemeContext.Provider value={themeProvider}>
        <LanguageContext.Provider value={languageProvider}>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
          <StatusBar style={themeProvider.isDark ? "light" : "dark"} />
        </LanguageContext.Provider>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={themeProvider}>
      <LanguageContext.Provider value={languageProvider}>
        <SettingsContext.Provider value={settingsProvider}>
          <ToastProvider>
            <NavigationContainer>
              <MainTabNavigator />
            </NavigationContainer>
            <PrivacyPolicyModal
              visible={showPrivacyModal}
              onAccept={handlePrivacyAccept}
            />
          </ToastProvider>
          <StatusBar style={themeProvider.isDark ? "light" : "dark"} />
        </SettingsContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <AppContent />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
