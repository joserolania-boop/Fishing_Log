import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export function FormInput({
  label,
  required = false,
  error,
  style,
  ...inputProps
}: FormInputProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText type="small" style={styles.label}>
          {label}
        </ThemedText>
        {required ? (
          <ThemedText
            type="small"
            style={[styles.required, { color: theme.destructive }]}
          >
            *
          </ThemedText>
        ) : null}
      </View>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: error ? theme.destructive : theme.border,
            color: theme.text,
          },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        {...inputProps}
      />
      {error ? (
        <ThemedText
          type="small"
          style={[styles.error, { color: theme.destructive }]}
        >
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  label: {
    fontWeight: "500",
  },
  required: {
    marginLeft: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
