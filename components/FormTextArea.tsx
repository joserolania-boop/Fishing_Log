import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FormTextAreaProps extends TextInputProps {
  label: string;
}

export function FormTextArea({
  label,
  style,
  ...inputProps
}: FormTextAreaProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            color: theme.text,
          },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        multiline
        textAlignVertical="top"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: 100,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
});
