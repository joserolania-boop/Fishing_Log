import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

// Dynamic import for notifications (only available on mobile)
let Notifications: any = null;
if (Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
  } catch (e) {
    console.log("expo-notifications not available");
  }
}

const REMINDERS_KEY = "@fishing_log_reminders";

interface ReminderSettings {
  enabled: boolean;
  weeklyReminder: boolean;
  weatherReminder: boolean;
  lastScheduled: string | null;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  weeklyReminder: true,
  weatherReminder: false,
  lastScheduled: null,
};

// Configure notification handler (only on mobile)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function useReminders() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(REMINDERS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load reminder settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: ReminderSettings) => {
    try {
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save reminder settings:", error);
    }
  };

  const toggleReminders = async (enabled: boolean) => {
    if (Platform.OS === "web" || !Notifications) {
      return;
    }

    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      await scheduleReminders();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    const newSettings = { ...settings, enabled, lastScheduled: enabled ? new Date().toISOString() : null };
    await saveSettings(newSettings);
  };

  const scheduleReminders = async () => {
    if (!Notifications) return;
    
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (settings.weeklyReminder) {
      // Schedule weekly reminder for Sunday morning
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎣 Time to Fish!",
          body: "The weekend is here! Perfect time to log some catches.",
          data: { type: "weekly" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday
          hour: 9,
          minute: 0,
        },
      });
    }

    // Schedule a gentle reminder after 3 days of inactivity
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🐟 Miss fishing?",
        body: "Don't forget to log your latest catches!",
        data: { type: "inactive" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3 * 24 * 60 * 60, // 3 days
        repeats: true,
      },
    });
  };

  return {
    settings,
    isLoading,
    toggleReminders,
    updateSettings: saveSettings,
  };
}

interface RemindersModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RemindersModal({ visible, onClose }: RemindersModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings, toggleReminders } = useReminders();

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {t.reminders?.title || "Fishing Reminders"}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.description}>
            <Feather name="bell" size={40} color={theme.link} />
            <ThemedText style={[styles.descText, { color: theme.textSecondary }]}>
              {t.reminders?.description || "Get gentle reminders to log your catches and never miss a fishing day."}
            </ThemedText>
          </View>

          {/* Enable Reminders */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Feather name="bell" size={20} color={theme.text} />
              <ThemedText style={styles.settingLabel}>
                {t.reminders?.enable || "Enable Reminders"}
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => {
                hapticFeedback();
                toggleReminders(value);
              }}
              trackColor={{ false: theme.border, true: theme.success }}
              thumbColor={Platform.OS === "android" ? "#fff" : undefined}
            />
          </View>

          {settings.enabled && (
            <>
              {/* Weekly Reminder */}
              <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
                <View style={styles.settingInfo}>
                  <Feather name="calendar" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.settingLabel}>
                      {t.reminders?.weekly || "Weekly Reminder"}
                    </ThemedText>
                    <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                      {t.reminders?.weeklyDesc || "Sunday morning reminder"}
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={settings.weeklyReminder}
                  onValueChange={(value) => {
                    hapticFeedback();
                  }}
                  trackColor={{ false: theme.border, true: theme.success }}
                  thumbColor={Platform.OS === "android" ? "#fff" : undefined}
                />
              </View>

              {/* Inactivity Reminder */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Feather name="clock" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.settingLabel}>
                      {t.reminders?.inactivity || "Inactivity Reminder"}
                    </ThemedText>
                    <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                      {t.reminders?.inactivityDesc || "After 3 days without logging"}
                    </ThemedText>
                  </View>
                </View>
                <Feather name="check" size={20} color={theme.success} />
              </View>
            </>
          )}

          {Platform.OS === "web" && (
            <ThemedText style={[styles.webNote, { color: theme.textSecondary }]}>
              {t.reminders?.webNote || "Reminders are only available on mobile devices."}
            </ThemedText>
          )}

          <Pressable
            style={[styles.closeButton, { backgroundColor: theme.link }]}
            onPress={onClose}
          >
            <ThemedText style={styles.closeButtonText}>
              {t.common.done || "Done"}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  descText: {
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  webNote: {
    textAlign: "center",
    marginTop: Spacing.lg,
    fontStyle: "italic",
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
