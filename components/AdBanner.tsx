import React from "react";
import { View, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";

export function AdBanner() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.adPlaceholder },
      ]}
    >
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary }}
      >
        {t.common.ad}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.md,
  },
});
