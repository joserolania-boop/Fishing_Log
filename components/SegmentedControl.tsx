import React from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundSecondary },
      ]}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              isSelected && {
                backgroundColor: theme.backgroundDefault,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.label,
                {
                  color: isSelected ? theme.text : theme.textSecondary,
                  fontWeight: isSelected ? "600" : "400",
                },
              ]}
            >
              {option.label}
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
    borderRadius: BorderRadius.xs,
    padding: Spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs - 2,
    alignItems: "center",
  },
  label: {
    textAlign: "center",
  },
});
