import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";

export type WeatherType = "sunny" | "cloudy" | "rainy" | "windy";

interface WeatherPickerProps {
  value: WeatherType | null;
  onChange: (weather: WeatherType | null) => void;
}

export const weatherIcons: Record<WeatherType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  sunny: "weather-sunny",
  cloudy: "weather-cloudy",
  rainy: "weather-pouring",
  windy: "weather-windy",
};

const weatherOptions: WeatherType[] = ["sunny", "cloudy", "rainy", "windy"];

export function WeatherPicker({ value, onChange }: WeatherPickerProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handlePress = (weather: WeatherType) => {
    if (value === weather) {
      onChange(null);
    } else {
      onChange(weather);
    }
  };

  return (
    <View style={styles.container}>
      {weatherOptions.map((weatherType) => {
        const isSelected = value === weatherType;
        return (
          <Pressable
            key={weatherType}
            onPress={() => handlePress(weatherType)}
            style={[
              styles.option,
              {
                backgroundColor: isSelected
                  ? theme.link
                  : theme.backgroundSecondary,
                borderColor: isSelected ? theme.link : theme.border,
              },
            ]}
          >
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name={weatherIcons[weatherType]}
                size={28}
                color={isSelected ? "#FFFFFF" : theme.link}
              />
            </View>
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: isSelected ? "#FFFFFF" : theme.text },
              ]}
            >
              {t.weather[weatherType]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    minHeight: 80,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: Spacing.xs,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
