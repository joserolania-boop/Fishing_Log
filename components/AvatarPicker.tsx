import React from "react";
import { View, StyleSheet, Pressable, Text, ScrollView } from "react-native";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { AvatarType } from "@/hooks/useSettings";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AvatarPickerProps {
  value: AvatarType;
  onChange: (avatar: AvatarType) => void;
}

// Image-based avatars
const avatarImages: Record<string, any> = {
  standing: require("../assets/images/avatars/standing.png"),
  boat: require("../assets/images/avatars/boat.png"),
  casting: require("../assets/images/avatars/casting.png"),
};

// Emoji-based avatars
const emojiAvatars: Record<string, string> = {
  fish: "🐟",
  shark: "🦈",
  whale: "🐋",
  octopus: "🐙",
  crab: "🦀",
  lobster: "🦞",
  anchor: "⚓",
  ship: "🚢",
  hook: "🪝",
  net: "🥅",
};

const imageAvatarOptions: AvatarType[] = ["standing", "boat", "casting"];
const emojiAvatarOptions: AvatarType[] = ["fish", "shark", "whale", "octopus", "crab", "lobster", "anchor", "ship", "hook", "net"];

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { theme } = useTheme();

  const renderAvatarOption = (avatar: AvatarType, isEmoji: boolean) => {
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
        {isEmoji ? (
          <Text style={styles.emoji}>{emojiAvatars[avatar]}</Text>
        ) : (
          <Image
            source={avatarImages[avatar]}
            style={styles.avatar}
            contentFit="cover"
          />
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {imageAvatarOptions.map((avatar) => renderAvatarOption(avatar, false))}
      {emojiAvatarOptions.map((avatar) => renderAvatarOption(avatar, true))}
    </ScrollView>
  );
}

export function Avatar({ type, size = 60 }: { type: AvatarType; size?: number }) {
  const { theme } = useTheme();
  const isEmoji = emojiAvatarOptions.includes(type);

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
      {isEmoji ? (
        <Text style={{ fontSize: size * 0.5 }}>{emojiAvatars[type] || "🐟"}</Text>
      ) : (
        <Image
          source={avatarImages[type] || avatarImages.standing}
          style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }}
          contentFit="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  option: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  emoji: {
    fontSize: 28,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
