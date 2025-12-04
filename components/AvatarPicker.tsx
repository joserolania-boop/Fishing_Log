import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { AvatarType } from "@/hooks/useSettings";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AvatarPickerProps {
  value: AvatarType;
  onChange: (avatar: AvatarType) => void;
}

const avatarImages = {
  standing: require("../assets/images/avatars/standing.png"),
  boat: require("../assets/images/avatars/boat.png"),
  casting: require("../assets/images/avatars/casting.png"),
};

const avatarOptions: AvatarType[] = ["standing", "boat", "casting"];

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {avatarOptions.map((avatar) => {
        const isSelected = value === avatar;
        return (
          <Pressable
            key={avatar}
            onPress={() => onChange(avatar)}
            style={[
              styles.option,
              {
                borderColor: isSelected ? theme.link : theme.border,
                borderWidth: isSelected ? 3 : 1,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
          >
            <Image
              source={avatarImages[avatar]}
              style={styles.avatar}
              contentFit="cover"
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ type, size = 60 }: { type: AvatarType; size?: number }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.backgroundSecondary,
        },
      ]}
    >
      <Image
        source={avatarImages[type]}
        style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.lg,
    justifyContent: "center",
  },
  option: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
