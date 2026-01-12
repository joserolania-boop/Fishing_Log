import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
  TouchableOpacity,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const [language, setLanguage] = useState<"en" | "zh">("en");

  const styles = createStyles(theme);

  const privacyPolicyEN = `
PRIVACY POLICY
Fishing Log App - Version 1.0.0

Developer: Teresa y Jose
App Name: Fishing Log

Last Updated: January 2026

1. INTRODUCTION
Fishing Log ("we," "our," or "the App") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise handle your personal information when you use our mobile application.

2. INFORMATION WE COLLECT
- Location data: Your GPS location when you log a catch
- Camera and Photos: When you capture or select photos of your fishing catches
- Device Information: Information about your device, operating system, and app version

3. HOW WE USE YOUR INFORMATION
- To store and display your fishing records
- To provide location-based features
- To improve the app experience
- For analytics and bug fixing

4. DATA STORAGE
- All data is stored locally on your device
- Camera photos and location data are only saved when you explicitly choose to attach them to a catch

5. PERMISSIONS
The App requires the following permissions:
- Camera: To capture photos of your catches
- Location: To record where you caught your fish
- Photo Library: To select existing photos
- Audio: For enhanced features

6. CHILDREN'S PRIVACY
This App is not intended for use by children under 13. We do not knowingly collect information from children.

7. CHANGES TO THIS PRIVACY POLICY
We may update this Privacy Policy from time to time. Your continued use of the App constitutes your acceptance of the updated policy.

8. CONTACT US
For privacy concerns, please contact the developer through the app support channels.
`;

  const privacyPolicyCH = `
隐私政策
Fishing Log 应用程序 - 版本 1.0.0

开发者: Teresa y Jose
应用名称: Fishing Log

最后更新: 2026年1月

1. 介绍
Fishing Log（"我们"或"该应用"）尊重您的隐私。本隐私政策说明我们在您使用我们的移动应用程序时如何收集、使用、披露和以其他方式处理您的个人信息。

2. 我们收集的信息
- 位置数据: 您记录捕获时的GPS位置
- 相机和照片: 当您拍摄或选择您捕获的鱼的照片时
- 设备信息: 有关您的设备、操作系统和应用版本的信息

3. 我们如何使用您的信息
- 存储和显示您的钓鱼记录
- 提供基于位置的功能
- 改进应用体验
- 用于分析和错误修复

4. 数据存储
- 所有数据存储在您的设备本地
- 相机照片和位置数据仅在您明确选择将其附加到捕获时保存

5. 权限
该应用程序需要以下权限:
- 相机: 拍摄您的捕获照片
- 位置: 记录您捕获鱼的位置
- 照片库: 选择现有照片
- 音频: 用于增强功能

6. 儿童隐私
本应用程序不适合13岁以下的儿童使用。我们不会故意从儿童收集信息。

7. 隐私政策的变更
我们可能会不时更新本隐私政策。您对该应用程序的继续使用构成对更新政策的接受。

8. 联系我们
如有隐私问题，请通过应用支持渠道与开发者联系。
`;

  const currentPolicy = language === "en" ? privacyPolicyEN : privacyPolicyCH;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.header}>
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
      </ThemedView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedText style={styles.policyText}>{currentPolicy}</ThemedText>
      </ScrollView>
    </SafeAreaView>
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
  });
}
