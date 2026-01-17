import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, RefreshControl, TextInput, Pressable, Dimensions, Modal, ScrollView, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { ScreenFlatList } from "@/components/ScreenFlatList";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { CatchCard } from "@/components/CatchCard";
import { AdBanner } from "@/components/AdBanner";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Catch, getAllCatches, initDatabase, CatchFilters, filterCatches } from "@/utils/database";
import { CatchesStackParamList } from "@/navigation/CatchesStackNavigator";

type NavigationProp = NativeStackNavigationProp<CatchesStackParamList>;

const { width: screenWidth } = Dimensions.get("window");

const WEATHER_OPTIONS: Array<"sunny" | "cloudy" | "rainy" | "windy"> = ["sunny", "cloudy", "rainy", "windy"];

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
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<CatchFilters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

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
    applyFiltersAndSearch();
  }, [searchQuery, catches, activeFilters]);

  const applyFiltersAndSearch = async () => {
    let result = catches;
    
    // Apply filters first
    if (Object.keys(activeFilters).length > 0) {
      result = await filterCatches(activeFilters);
    }
    
    // Then apply search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.species.toLowerCase().includes(query) ||
          c.locationName?.toLowerCase().includes(query) ||
          c.bait?.toLowerCase().includes(query) ||
          c.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredCatches(result);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCatches();
  };

  const handleAddCatch = () => {
    hapticFeedback();
    navigation.navigate("LogCatch");
  };

  const handleCatchPress = (catchId: number) => {
    hapticFeedback();
    navigation.navigate("CatchDetail", { catchId });
  };

  const toggleSearch = () => {
    hapticFeedback();
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
    }
  };

  const toggleFilters = () => {
    hapticFeedback();
    setShowFilters(!showFilters);
  };

  const applyFilter = (key: keyof CatchFilters, value: any) => {
    hapticFeedback();
    const newFilters = { ...activeFilters };
    if (value === null || value === undefined || value === "") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    setHasActiveFilters(Object.keys(newFilters).length > 0);
  };

  const clearFilters = () => {
    hapticFeedback();
    setActiveFilters({});
    setHasActiveFilters(false);
    setShowFilters(false);
  };

  // Get unique species from catches
  const uniqueSpecies = [...new Set(catches.map(c => c.species))].sort();

  const renderItem = ({ item, index }: { item: Catch; index: number }) => {
    const showAd = (index + 1) % 5 === 0 && index !== 0;
    return (
      <>
        <CatchCard
          catchItem={item}
          onPress={() => handleCatchPress(item.id)}
          index={index}
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
          {/* Filter button */}
          <Pressable 
            style={[
              styles.filterButton, 
              { backgroundColor: hasActiveFilters ? theme.link : theme.backgroundDefault, borderColor: theme.border }
            ]}
            onPress={toggleFilters}
          >
            <Feather name="sliders" size={18} color={hasActiveFilters ? "#fff" : theme.text} />
          </Pressable>
        </View>
      ) : null}
      {/* Active filters chips */}
      {hasActiveFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersChipsRow}>
          {activeFilters.species && (
            <Pressable style={[styles.filterChip, { backgroundColor: theme.link + "20" }]} onPress={() => applyFilter("species", null)}>
              <ThemedText style={[styles.filterChipText, { color: theme.link }]}>🐟 {activeFilters.species}</ThemedText>
              <Feather name="x" size={14} color={theme.link} />
            </Pressable>
          )}
          {activeFilters.weather && (
            <Pressable style={[styles.filterChip, { backgroundColor: theme.link + "20" }]} onPress={() => applyFilter("weather", null)}>
              <ThemedText style={[styles.filterChipText, { color: theme.link }]}>🌤 {activeFilters.weather}</ThemedText>
              <Feather name="x" size={14} color={theme.link} />
            </Pressable>
          )}
          <Pressable style={[styles.clearFiltersChip, { borderColor: theme.border }]} onPress={clearFilters}>
            <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>{t.catches.clearFilters || "Clear all"}</ThemedText>
          </Pressable>
        </ScrollView>
      )}
    </>
  );

  const ListEmpty = () =>
    !isLoading ? (
      <View style={styles.emptyStateContainer}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../assets/images/empty-state-fishing.png")}
            style={styles.illustration}
            contentFit="cover"
          />
        </View>
        <View style={styles.emptyTextContainer}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="anchor" size={32} color={theme.link} />
          </View>
          <ThemedText type="h3" style={styles.emptyTitle}>
            {t.catches.empty}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.emptySubtitle, { color: theme.textSecondary }]}
          >
            {t.catches.emptySubtitle}
          </ThemedText>
        </View>
      </View>
    ) : null;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: Spacing.md }}>
          <Pressable onPress={toggleSearch} hitSlop={8}>
            <Feather
              name={showSearch ? "x" : "search"}
              size={22}
              color={theme.text}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, theme.text, showSearch]);

  return (
    <View style={styles.container}>
      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.filtersOverlay}>
          <ThemedView style={[styles.filtersModal, { backgroundColor: theme.card }]}>
            <View style={styles.filtersHeader}>
              <ThemedText style={styles.filtersTitle}>{t.catches.filters || "Filters"}</ThemedText>
              <Pressable onPress={() => setShowFilters(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            
            {/* Species Filter */}
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
              {t.logCatch.species}
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsRow}>
              <Pressable 
                style={[styles.filterOption, !activeFilters.species && { backgroundColor: theme.link }]}
                onPress={() => applyFilter("species", null)}
              >
                <ThemedText style={!activeFilters.species ? styles.filterOptionTextActive : undefined}>
                  {t.common.all || "All"}
                </ThemedText>
              </Pressable>
              {uniqueSpecies.map(species => (
                <Pressable 
                  key={species}
                  style={[styles.filterOption, activeFilters.species === species && { backgroundColor: theme.link }]}
                  onPress={() => applyFilter("species", species)}
                >
                  <ThemedText style={activeFilters.species === species ? styles.filterOptionTextActive : undefined}>
                    {species}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
            
            {/* Weather Filter */}
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
              {t.logCatch.weather}
            </ThemedText>
            <View style={styles.filterOptionsRow}>
              <Pressable 
                style={[styles.filterOption, !activeFilters.weather && { backgroundColor: theme.link }]}
                onPress={() => applyFilter("weather", null)}
              >
                <ThemedText style={!activeFilters.weather ? styles.filterOptionTextActive : undefined}>
                  {t.common.all || "All"}
                </ThemedText>
              </Pressable>
              {WEATHER_OPTIONS.map(weather => (
                <Pressable 
                  key={weather}
                  style={[styles.filterOption, activeFilters.weather === weather && { backgroundColor: theme.link }]}
                  onPress={() => applyFilter("weather", weather)}
                >
                  <ThemedText style={activeFilters.weather === weather ? styles.filterOptionTextActive : undefined}>
                    {t.weather[weather]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            
            {/* Apply Button */}
            <Pressable 
              style={[styles.applyFiltersButton, { backgroundColor: theme.link }]}
              onPress={() => setShowFilters(false)}
            >
              <ThemedText style={styles.applyFiltersText}>{t.catches.applyFilters || "Apply Filters"}</ThemedText>
            </Pressable>
            
            {hasActiveFilters && (
              <Pressable style={styles.clearAllButton} onPress={clearFilters}>
                <ThemedText style={{ color: theme.textSecondary }}>{t.catches.clearFilters || "Clear All Filters"}</ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </View>
      </Modal>

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
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: -Spacing.xl,
    paddingTop: Spacing.xl,
  },
  illustrationContainer: {
    width: screenWidth - Spacing.xl * 2,
    height: 220,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  illustration: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  emptyTextContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  filtersChipsRow: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChipText: {
    fontSize: 13,
  },
  clearFiltersChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filtersOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  filtersModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  filterOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  filterOptionTextActive: {
    color: "#fff",
  },
  applyFiltersButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  applyFiltersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  clearAllButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
});
