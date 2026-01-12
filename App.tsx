import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkPrivacyPolicyAcceptance();
  }, []);

  const checkPrivacyPolicyAcceptance = async () => {
    try {
      const accepted = await AsyncStorage.getItem("privacyPolicyAccepted");
      if (!accepted) {
        setShowPrivacyModal(true);
      }
    } catch (error) {
      console.error("Error checking privacy policy:", error);
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

  if (!languageProvider.isLoaded || !settingsProvider.isLoaded || isInitializing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.link} />
      </ThemedView>
    );
  }

  return (
    <>
      <LanguageContext.Provider value={languageProvider}>
        <SettingsContext.Provider value={settingsProvider}>
          <NavigationContainer>
            <MainTabNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </SettingsContext.Provider>
      </LanguageContext.Provider>
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onAccept={handlePrivacyAccept}
      />
    </>
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
