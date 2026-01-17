import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

const WHATS_NEW_KEY = "@fishing_log_whats_new_version";
const CURRENT_VERSION = "2.1.0";

interface WhatsNewFeature {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const FEATURES: WhatsNewFeature[] = [
  {
    icon: "calendar",
    title: "Calendar View",
    description: "View your catches organized by day and month",
  },
  {
    icon: "search",
    title: "Search & Filters",
    description: "Quickly find catches by species, location or date",
  },
  {
    icon: "bar-chart-2",
    title: "More Charts",
    description: "New monthly and weekly statistics",
  },
  {
    icon: "star",
    title: "Rate the App",
    description: "Help us grow by rating in AppGallery",
  },
  {
    icon: "bell",
    title: "Fishing Reminders",
    description: "Never forget to log your catches",
  },
  {
    icon: "zap",
    title: "Haptic Feedback",
    description: "Feel satisfying vibrations on actions",
  },
  {
    icon: "image",
    title: "Multiple Photos",
    description: "Add up to 5 photos per catch",
  },
  {
    icon: "tag",
    title: "Custom Tags",
    description: "Organize catches with your own tags",
  },
  {
    icon: "download",
    title: "Backup & Restore",
    description: "Export and import all your data",
  },
];

interface WhatsNewModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WhatsNewModal({ visible, onClose }: WhatsNewModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClose = async () => {
    hapticFeedback();
    await markWhatsNewSeen();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, { backgroundColor: theme.backgroundDefault }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.versionBadge, { backgroundColor: theme.link }]}>
              <ThemedText style={styles.versionText}>v{CURRENT_VERSION}</ThemedText>
            </View>
            <ThemedText style={styles.title}>
              {t.whatsNew?.title || "What's New"}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t.whatsNew?.subtitle || "Check out the latest features"}
            </ThemedText>
          </View>

          {/* Features List */}
          <ScrollView 
            style={styles.featuresList}
            showsVerticalScrollIndicator={false}
          >
            {FEATURES.map((feature, index) => (
              <View 
                key={index} 
                style={[styles.featureItem, { borderBottomColor: theme.border }]}
              >
                <View style={[styles.featureIcon, { backgroundColor: theme.link + "20" }]}>
                  <Feather name={feature.icon} size={22} color={theme.link} />
                </View>
                <View style={styles.featureText}>
                  <ThemedText style={styles.featureTitle}>
                    {feature.title}
                  </ThemedText>
                  <ThemedText style={[styles.featureDesc, { color: theme.textSecondary }]}>
                    {feature.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            style={[styles.closeButton, { backgroundColor: theme.link }]}
            onPress={handleClose}
          >
            <ThemedText style={styles.closeButtonText}>
              {t.whatsNew?.getStarted || "Get Started"}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

export async function shouldShowWhatsNew(): Promise<boolean> {
  try {
    const lastSeenVersion = await AsyncStorage.getItem(WHATS_NEW_KEY);
    return lastSeenVersion !== CURRENT_VERSION;
  } catch {
    return true;
  }
}

export async function markWhatsNewSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(WHATS_NEW_KEY, CURRENT_VERSION);
  } catch (error) {
    console.error("Failed to mark whats new as seen:", error);
  }
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
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  versionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  versionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.xs,
  },
  featuresList: {
    flexGrow: 0,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  featureDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
