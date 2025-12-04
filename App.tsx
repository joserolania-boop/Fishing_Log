import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import {
  LanguageContext,
  useLanguageProvider,
} from "@/hooks/useLanguage";
import {
  SettingsContext,
  useSettingsProvider,
} from "@/hooks/useSettings";

function AppContent() {
  const { theme } = useTheme();
  const languageProvider = useLanguageProvider();
  const settingsProvider = useSettingsProvider();

  if (!languageProvider.isLoaded || !settingsProvider.isLoaded) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.link} />
      </ThemedView>
    );
  }

  return (
    <LanguageContext.Provider value={languageProvider}>
      <SettingsContext.Provider value={settingsProvider}>
        <NavigationContainer>
          <MainTabNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </SettingsContext.Provider>
    </LanguageContext.Provider>
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
