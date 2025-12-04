import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, RefreshControl, TextInput, Pressable } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ScreenFlatList } from "@/components/ScreenFlatList";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { CatchCard } from "@/components/CatchCard";
import { AdBanner } from "@/components/AdBanner";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Catch, getAllCatches, initDatabase } from "@/utils/database";
import { CatchesStackParamList } from "@/navigation/CatchesStackNavigator";

type NavigationProp = NativeStackNavigationProp<CatchesStackParamList>;

export default function CatchesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [catches, setCatches] = useState<Catch[]>([]);
  const [filteredCatches, setFilteredCatches] = useState<Catch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const loadCatches = useCallback(async () => {
    try {
      await initDatabase();
      const data = await getAllCatches();
      setCatches(data);
      setFilteredCatches(data);
    } catch (error) {
      console.error("Failed to load catches:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCatches();
    }, [loadCatches])
  );

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCatches(catches);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = catches.filter(
        (c) =>
          c.species.toLowerCase().includes(query) ||
          c.locationName?.toLowerCase().includes(query) ||
          c.bait?.toLowerCase().includes(query)
      );
      setFilteredCatches(filtered);
    }
  }, [searchQuery, catches]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCatches();
  };

  const handleAddCatch = () => {
    navigation.navigate("LogCatch");
  };

  const handleCatchPress = (catchId: number) => {
    navigation.navigate("CatchDetail", { catchId });
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
    }
  };

  const renderItem = ({ item, index }: { item: Catch; index: number }) => {
    const showAd = (index + 1) % 5 === 0 && index !== 0;
    return (
      <>
        <CatchCard
          catchItem={item}
          onPress={() => handleCatchPress(item.id)}
        />
        {showAd ? <AdBanner /> : null}
      </>
    );
  };

  const ListHeader = () => (
    <>
      {showSearch ? (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={theme.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t.catches.search}
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );

  const ListEmpty = () =>
    !isLoading ? (
      <EmptyState
        icon="anchor"
        title={t.catches.empty}
        subtitle={t.catches.emptySubtitle}
      />
    ) : null;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={toggleSearch} hitSlop={8}>
          <Feather
            name={showSearch ? "x" : "search"}
            size={22}
            color={theme.text}
          />
        </Pressable>
      ),
    });
  }, [navigation, theme.text, showSearch]);

  return (
    <View style={styles.container}>
      <ScreenFlatList
        data={filteredCatches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.link}
          />
        }
        contentContainerStyle={
          filteredCatches.length === 0 ? styles.emptyContent : undefined
        }
      />
      <FloatingActionButton onPress={handleAddCatch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
