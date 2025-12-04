import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";

type WeatherType = "sunny" | "cloudy" | "rainy" | "windy";

interface WeatherPickerProps {
  value: WeatherType | null;
  onChange: (weather: WeatherType | null) => void;
}

const weatherOptions: { type: WeatherType; icon: keyof typeof Feather.glyphMap }[] = [
  { type: "sunny", icon: "sun" },
  { type: "cloudy", icon: "cloud" },
  { type: "rainy", icon: "cloud-rain" },
  { type: "windy", icon: "wind" },
];

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
      {weatherOptions.map((option) => {
        const isSelected = value === option.type;
        return (
          <Pressable
            key={option.type}
            onPress={() => handlePress(option.type)}
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
            <Feather
              name={option.icon}
              size={24}
              color={isSelected ? "#FFFFFF" : theme.text}
            />
            <ThemedText
              type="small"
              style={[
                styles.label,
                { color: isSelected ? "#FFFFFF" : theme.text },
              ]}
            >
              {t.weather[option.type]}
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
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  label: {
    marginTop: Spacing.xs,
    fontSize: 11,
  },
});
