import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
}

export default function PrivacyPolicyModal({
  visible,
  onAccept,
}: PrivacyPolicyModalProps) {
  const { theme } = useTheme();
  const [language, setLanguage] = useState<"en" | "zh">("en");

  const styles = createStyles(theme);

  const privacyPolicyEN = `PRIVACY POLICY

Developer: Teresa y Jose
App Name: Fishing Log
Version: 1.0.0

The Fishing Log app collects your location data, photos, and device information to provide fishing logging functionality. All data is stored locally on your device.

By continuing to use this app, you agree to our privacy policy.`;

  const privacyPolicyCH = `隐私政策

开发者: Teresa y Jose
应用名称: Fishing Log
版本: 1.0.0

Fishing Log应用程序收集您的位置数据、照片和设备信息以提供钓鱼日志功能。所有数据存储在您的设备本地。

继续使用此应用程序，即表示您同意我们的隐私政策。`;

  const currentPolicy = language === "en" ? privacyPolicyEN : privacyPolicyCH;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => {}}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {language === "en" ? "Privacy Policy" : "隐私政策"}
          </ThemedText>

          {/* Language Toggle */}
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[
                styles.langButton,
                language === "en" && { backgroundColor: theme.link },
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text
                style={[
                  styles.langButtonText,
                  { color: language === "en" ? "#fff" : theme.text },
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langButton,
                language === "zh" && { backgroundColor: theme.link },
              ]}
              onPress={() => setLanguage("zh")}
            >
              <Text
                style={[
                  styles.langButtonText,
                  { color: language === "zh" ? "#fff" : theme.text },
                ]}
              >
                中文
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.contentContainer}
        >
          <ThemedText style={styles.policyText}>{currentPolicy}</ThemedText>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.link }]}
            onPress={onAccept}
          >
            <Text style={styles.buttonText}>
              {language === "en" ? "I Agree" : "我同意"}
            </Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    languageToggle: {
      flexDirection: "row",
      gap: 8,
    },
    langButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.tabBarInactiveTintColor,
    },
    langButtonText: {
      fontSize: 12,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    contentContainer: {
      paddingVertical: 16,
    },
    policyText: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.text,
    },
    footer: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    button: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
}
