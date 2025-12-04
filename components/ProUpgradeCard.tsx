import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ProBadge } from "@/components/ProBadge";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

interface ProUpgradeCardProps {
  title: string;
  description: string;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProUpgradeCard({ title, description }: ProUpgradeCardProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = () => {
    Alert.alert(
      t.profile.upgradeToPro,
      "Pro upgrade will be available soon!",
      [{ text: "OK" }]
    );
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: AppColors.proBadge,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <ProBadge size="large" />
      </View>
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.description, { color: theme.textSecondary }]}
      >
        {description}
      </ThemedText>
      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.link }}>
          {t.profile.upgradeToPro}
        </ThemedText>
        <Feather name="arrow-right" size={16} color={theme.link} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
