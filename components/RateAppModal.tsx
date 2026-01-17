import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

const RATE_PROMPT_KEY = "@fishing_log_rate_prompt";
const CATCHES_FOR_PROMPT = 5;

// Huawei AppGallery URL - Update with your app ID
const APPGALLERY_URL = "appmarket://details?id=YOUR_APP_ID";
const APPGALLERY_WEB_URL = "https://appgallery.huawei.com/app/YOUR_APP_ID";

interface RateAppModalProps {
  visible: boolean;
  onClose: () => void;
  onRate: () => void;
  onRemindLater: () => void;
  onNeverAsk: () => void;
}

export function RateAppModal({ visible, onClose, onRate, onRemindLater, onNeverAsk }: RateAppModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, { backgroundColor: theme.backgroundDefault }]}>
          {/* Stars animation */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Feather key={star} name="star" size={32} color={AppColors.warning} />
            ))}
          </View>

          <ThemedText style={styles.title}>
            {t.rateApp?.title || "Enjoying Fishing Log?"}
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
            {t.rateApp?.message || "If you're enjoying the app, please take a moment to rate us. Your feedback helps us improve!"}
          </ThemedText>

          {/* Rate Now Button */}
          <Pressable
            style={[styles.rateButton, { backgroundColor: theme.link }]}
            onPress={() => {
              hapticFeedback();
              onRate();
            }}
          >
            <Feather name="star" size={20} color="#fff" />
            <ThemedText style={styles.rateButtonText}>
              {t.rateApp?.rateNow || "Rate Now"}
            </ThemedText>
          </Pressable>

          {/* Remind Later */}
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              hapticFeedback();
              onRemindLater();
            }}
          >
            <ThemedText style={{ color: theme.link }}>
              {t.rateApp?.remindLater || "Remind Me Later"}
            </ThemedText>
          </Pressable>

          {/* Never Ask */}
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              hapticFeedback();
              onNeverAsk();
            }}
          >
            <ThemedText style={{ color: theme.textSecondary }}>
              {t.rateApp?.neverAsk || "Don't Ask Again"}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

interface RatePromptState {
  neverAsk: boolean;
  lastPromptDate: string | null;
  catchCountAtLastPrompt: number;
}

export async function shouldShowRatePrompt(totalCatches: number): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(RATE_PROMPT_KEY);
    
    if (!stored) {
      // First time - only show after 5 catches
      return totalCatches >= CATCHES_FOR_PROMPT;
    }
    
    const state: RatePromptState = JSON.parse(stored);
    
    // Never ask again was selected
    if (state.neverAsk) {
      return false;
    }
    
    // Check if enough time has passed (7 days) and enough new catches (5 more)
    if (state.lastPromptDate) {
      const lastDate = new Date(state.lastPromptDate);
      const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      const newCatches = totalCatches - state.catchCountAtLastPrompt;
      
      return daysSince >= 7 && newCatches >= CATCHES_FOR_PROMPT;
    }
    
    return false;
  } catch (error) {
    console.error("Failed to check rate prompt:", error);
    return false;
  }
}

export async function markRatePromptShown(totalCatches: number, neverAsk: boolean = false): Promise<void> {
  try {
    const state: RatePromptState = {
      neverAsk,
      lastPromptDate: new Date().toISOString(),
      catchCountAtLastPrompt: totalCatches,
    };
    await AsyncStorage.setItem(RATE_PROMPT_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save rate prompt state:", error);
  }
}

export async function openAppGalleryRating(): Promise<void> {
  // This would use Linking to open the app's AppGallery page
  // For now, just log - you would implement actual linking
  console.log("Opening AppGallery rating page...");
  
  // On a real device:
  // import * as Linking from "expo-linking";
  // try {
  //   await Linking.openURL(APPGALLERY_URL);
  // } catch {
  //   await Linking.openURL(APPGALLERY_WEB_URL);
  // }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  rateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: Spacing.sm,
  },
});
