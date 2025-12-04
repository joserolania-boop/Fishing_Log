import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { AvatarPicker, Avatar } from "@/components/AvatarPicker";
import { FormInput } from "@/components/FormInput";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ProBadge } from "@/components/ProBadge";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, AvatarType, UnitSystem } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Language } from "@/constants/i18n";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { settings, updateSettings } = useSettings();

  const handleAvatarChange = (avatar: AvatarType) => {
    updateSettings({ avatar });
  };

  const handleNameChange = (name: string) => {
    updateSettings({ displayName: name });
  };

  const handleUnitsChange = (units: string) => {
    updateSettings({ units: units as UnitSystem });
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as Language);
  };

  const handleRateApp = () => {
    Alert.alert("Rate App", "This feature will be available when the app is published.");
  };

  const handleUpgradeToPro = () => {
    Alert.alert(
      t.profile.upgradeToPro,
      "Pro upgrade will be available soon!",
      [{ text: "OK" }]
    );
  };

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Espanol" },
  ];

  const unitOptions = [
    { value: "metric", label: t.profile.metric },
    { value: "imperial", label: t.profile.imperial },
  ];

  const proFeatures = [
    { icon: "bar-chart-2" as const, text: t.profile.proFeature1 },
    { icon: "cloud" as const, text: t.profile.proFeature2 },
    { icon: "slash" as const, text: t.profile.proFeature3 },
    { icon: "headphones" as const, text: t.profile.proFeature4 },
  ];

  return (
    <ScreenScrollView>
      <View style={styles.avatarSection}>
        <Avatar type={settings.avatar} size={80} />
        <ThemedText type="h3" style={styles.displayName}>
          {settings.displayName || t.profile.displayNamePlaceholder}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Choose Avatar
        </ThemedText>
        <AvatarPicker value={settings.avatar} onChange={handleAvatarChange} />
      </View>

      <FormInput
        label={t.profile.displayName}
        placeholder={t.profile.displayNamePlaceholder}
        value={settings.displayName}
        onChangeText={handleNameChange}
        autoCapitalize="words"
      />

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t.profile.language}
        </ThemedText>
        <SegmentedControl
          options={languageOptions}
          value={language}
          onChange={handleLanguageChange}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t.profile.units}
        </ThemedText>
        <SegmentedControl
          options={unitOptions}
          value={settings.units}
          onChange={handleUnitsChange}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <Pressable
        onPress={handleUpgradeToPro}
        style={[
          styles.proCard,
          { backgroundColor: theme.backgroundDefault, borderColor: AppColors.proBadge },
        ]}
      >
        <View style={styles.proHeader}>
          <ProBadge size="large" />
          <ThemedText type="h4" style={styles.proTitle}>
            {t.profile.upgradeToPro}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          {t.profile.proFeatures}
        </ThemedText>
        {proFeatures.map((feature, index) => (
          <View key={index} style={styles.proFeatureRow}>
            <Feather name="check" size={16} color={theme.link} style={styles.proFeatureIcon} />
            <ThemedText type="body">{feature.text}</ThemedText>
          </View>
        ))}
      </Pressable>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t.profile.about}
        </ThemedText>
        <SettingsRow
          icon="info"
          label={t.profile.version}
          value="1.0.0"
          theme={theme}
        />
        <Pressable onPress={handleRateApp}>
          <SettingsRow
            icon="star"
            label={t.profile.rateApp}
            showChevron
            theme={theme}
          />
        </Pressable>
      </View>
    </ScreenScrollView>
  );
}

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  showChevron?: boolean;
  theme: any;
}

function SettingsRow({ icon, label, value, showChevron, theme }: SettingsRowProps) {
  return (
    <View
      style={[
        settingsStyles.row,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
    >
      <Feather name={icon} size={18} color={theme.textSecondary} style={settingsStyles.icon} />
      <ThemedText type="body" style={settingsStyles.label}>
        {label}
      </ThemedText>
      {value ? (
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {value}
        </ThemedText>
      ) : null}
      {showChevron ? (
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      ) : null}
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  displayName: {
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
  },
  proCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  proTitle: {
    marginLeft: Spacing.md,
  },
  proFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  proFeatureIcon: {
    marginRight: Spacing.sm,
  },
});
