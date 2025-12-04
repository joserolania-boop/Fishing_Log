import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

interface ProBadgeProps {
  size?: "small" | "large";
}

export function ProBadge({ size = "small" }: ProBadgeProps) {
  const { t } = useLanguage();
  const isLarge = size === "large";

  return (
    <View
      style={[
        styles.container,
        isLarge ? styles.containerLarge : null,
      ]}
    >
      <Feather
        name="award"
        size={isLarge ? 14 : 10}
        color="#1A1A1A"
        style={styles.icon}
      />
      <ThemedText
        style={[
          styles.text,
          isLarge ? styles.textLarge : null,
        ]}
      >
        {t.common.pro}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.proBadge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  containerLarge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  textLarge: {
    fontSize: 12,
  },
});
