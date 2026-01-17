import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { getAllTags } from "@/utils/database";

const SUGGESTED_TAGS = [
  "competition",
  "vacation",
  "personal best",
  "catch & release",
  "night fishing",
  "boat",
  "shore",
  "river",
  "lake",
  "ocean",
];

interface TagPickerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagPicker({ selectedTags, onTagsChange }: TagPickerProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [newTag, setNewTag] = useState("");
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadRecentTags();
  }, []);

  const loadRecentTags = async () => {
    const tags = await getAllTags();
    setRecentTags(tags);
  };

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const toggleTag = (tag: string) => {
    hapticFeedback();
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      hapticFeedback();
      onTagsChange([...selectedTags, trimmedTag]);
      setNewTag("");
      setShowInput(false);
    }
  };

  const removeTag = (tag: string) => {
    hapticFeedback();
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  // Combine recent tags with suggested, removing duplicates
  const allSuggestions = [...new Set([...recentTags, ...SUGGESTED_TAGS])].slice(0, 12);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {t.logCatch?.tags || "Tags"}
        </ThemedText>
        <Pressable onPress={() => setShowInput(!showInput)}>
          <Feather name={showInput ? "x" : "plus"} size={18} color={theme.link} />
        </Pressable>
      </View>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedRow}>
          {selectedTags.map(tag => (
            <Pressable
              key={tag}
              style={[styles.selectedTag, { backgroundColor: theme.link }]}
              onPress={() => removeTag(tag)}
            >
              <ThemedText style={styles.selectedTagText}>#{tag}</ThemedText>
              <Feather name="x" size={14} color="#fff" />
            </Pressable>
          ))}
        </View>
      )}

      {/* Custom Tag Input */}
      {showInput && (
        <View style={[styles.inputRow, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t.logCatch?.addTag || "Add a tag..."}
            placeholderTextColor={theme.textSecondary}
            value={newTag}
            onChangeText={setNewTag}
            onSubmitEditing={addCustomTag}
            autoFocus
            autoCapitalize="none"
          />
          <Pressable onPress={addCustomTag} disabled={!newTag.trim()}>
            <Feather 
              name="check" 
              size={20} 
              color={newTag.trim() ? theme.link : theme.textSecondary} 
            />
          </Pressable>
        </View>
      )}

      {/* Suggestions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsRow}
      >
        {allSuggestions
          .filter(tag => !selectedTags.includes(tag))
          .map(tag => (
            <Pressable
              key={tag}
              style={[styles.suggestionTag, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => toggleTag(tag)}
            >
              <ThemedText style={[styles.suggestionText, { color: theme.text }]}>
                #{tag}
              </ThemedText>
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  selectedTagText: {
    color: "#fff",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  suggestionsRow: {
    flexDirection: "row",
  },
  suggestionTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  suggestionText: {
    fontSize: 13,
  },
});
