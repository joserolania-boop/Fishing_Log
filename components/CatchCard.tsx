import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSettings, formatWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Catch } from "@/utils/database";

interface CatchCardProps {
  catchItem: Catch;
  onPress: () => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CatchCard({ catchItem, onPress }: CatchCardProps) {
  const { theme } = useTheme();
  const { settings } = useSettings();
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

  const formattedDate = new Date(catchItem.dateTime).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const formattedWeight = formatWeight(catchItem.weight, settings.units);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.photoContainer}>
        {catchItem.photoUri ? (
          <Image
            source={{ uri: catchItem.photoUri }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="image" size={32} color={theme.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <ThemedText type="h4" numberOfLines={1}>
          {catchItem.species}
        </ThemedText>
        <View style={styles.detailRow}>
          <Feather
            name="activity"
            size={14}
            color={theme.textSecondary}
            style={styles.detailIcon}
          />
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            {formattedWeight}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather
            name="calendar"
            size={14}
            color={theme.textSecondary}
            style={styles.detailIcon}
          />
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            {formattedDate}
          </ThemedText>
        </View>
        {catchItem.locationName ? (
          <View style={styles.detailRow}>
            <Feather
              name="map-pin"
              size={14}
              color={theme.textSecondary}
              style={styles.detailIcon}
            />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
              numberOfLines={1}
            >
              {catchItem.locationName}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={theme.textSecondary}
        style={styles.chevron}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  photoContainer: {
    width: Spacing.cardPhotoSize,
    height: Spacing.cardPhotoSize,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  detailIcon: {
    marginRight: Spacing.xs,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
});
