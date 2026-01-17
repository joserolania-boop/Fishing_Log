import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Linking, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { AvatarPicker, Avatar } from "@/components/AvatarPicker";
import { FormInput } from "@/components/FormInput";
import { SegmentedControl } from "@/components/SegmentedControl";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, AvatarType, UnitSystem } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Language } from "@/constants/i18n";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, setThemePreference, themePreference } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(null);

  // Get version from expo-constants
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const handleAvatarChange = (avatar: AvatarType) => {
    setCustomAvatarUri(null); // Clear custom avatar when selecting predefined
    updateSettings({ avatar });
  };

  const handleCustomAvatarPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissions.camera, t.permissions.openSettings);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setCustomAvatarUri(result.assets[0].uri);
      // Store custom avatar URI in settings
      updateSettings({ customAvatarUri: result.assets[0].uri });
    }
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

  const handleThemeChange = (value: string) => {
    setThemePreference(value as "auto" | "light" | "dark");
  };

  const handleRateApp = () => {
    // Open Huawei AppGallery or app store link
    Linking.openURL("https://appgallery.huawei.com/app/C112345678");
  };

  const handlePrivacyPolicy = () => {
    setPrivacyModalVisible(true);
  };

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "zh", label: "中文" },
  ];

  const unitOptions = [
    { value: "metric", label: t.profile.metric },
    { value: "imperial", label: t.profile.imperial },
  ];

  const themeOptions = [
    { value: "auto", label: t.profile.themeAuto },
    { value: "light", label: t.profile.themeLight },
    { value: "dark", label: t.profile.themeDark },
  ];

  // Get current avatar URI (custom or predefined)
  const currentAvatarUri = settings.customAvatarUri || customAvatarUri;

  return (
    <ScreenScrollView>
      <View style={styles.avatarSection}>
        {currentAvatarUri ? (
          <Pressable onPress={handleCustomAvatarPick}>
            <Image 
              source={{ uri: currentAvatarUri }} 
              style={styles.customAvatar} 
            />
          </Pressable>
        ) : (
          <Avatar type={settings.avatar} size={80} />
        )}
        <ThemedText type="h3" style={styles.displayName}>
          {settings.displayName || t.profile.displayNamePlaceholder}
        </ThemedText>
        <Pressable onPress={handleCustomAvatarPick} style={styles.customAvatarButton}>
          <Feather name="camera" size={16} color={theme.link} />
          <ThemedText type="small" style={{ color: theme.link, marginLeft: Spacing.xs }}>
            {t.profile.customAvatar}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t.profile.chooseAvatar}
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

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t.profile.theme}
        </ThemedText>
        <SegmentedControl
          options={themeOptions}
          value={themePreference}
          onChange={handleThemeChange}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Features Section */}
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.featuresTitle}>
          {t.tabs?.map || "Features"}
        </ThemedText>
        <Pressable onPress={() => navigation.navigate("Map")}>
          <FeatureRow
            icon="map"
            label={t.map?.title || "Fishing Map"}
            color={AppColors.primary}
            theme={theme}
          />
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Weather")}>
          <FeatureRow
            icon="cloud"
            label={t.weather?.title || "Weather"}
            color="#4ECDC4"
            theme={theme}
          />
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Achievements")}>
          <FeatureRow
            icon="award"
            label={t.achievements?.title || "Achievements"}
            color="#FFD93D"
            theme={theme}
          />
        </Pressable>
        <Pressable onPress={() => navigation.navigate("SpeciesGuide")}>
          <FeatureRow
            icon="book-open"
            label={t.species?.title || "Species Guide"}
            color="#6BCB77"
            theme={theme}
          />
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t.profile.about}
        </ThemedText>
        <SettingsRow
          icon="info"
          label={t.profile.version}
          value={appVersion}
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
        <Pressable onPress={handlePrivacyPolicy}>
          <SettingsRow
            icon="shield"
            label={t.profile.privacyPolicy}
            showChevron
            theme={theme}
          />
        </Pressable>
      </View>

      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
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

interface FeatureRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  theme: any;
}

function FeatureRow({ icon, label, color, theme }: FeatureRowProps) {
  return (
    <View
      style={[
        featureStyles.row,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
    >
      <View style={[featureStyles.iconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <ThemedText type="body" style={featureStyles.label}>
        {label}
      </ThemedText>
      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontWeight: "500",
  },
});

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
  customAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  customAvatarButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    padding: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    fontWeight: "500",
  },
  featuresTitle: {
    marginBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
  },
});
