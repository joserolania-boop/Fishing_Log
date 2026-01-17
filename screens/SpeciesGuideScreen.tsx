import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable, TextInput, FlatList, Linking } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  habitat: string;
  avgWeight: string;
  maxWeight: string;
  season: string;
  tips: string;
  image?: string;
}

// Common freshwater and saltwater fish species
const fishDatabase: FishSpecies[] = [
  {
    id: "1",
    name: "Largemouth Bass",
    scientificName: "Micropterus salmoides",
    family: "Centrarchidae",
    habitat: "Freshwater lakes, ponds, rivers",
    avgWeight: "1-2 kg",
    maxWeight: "10+ kg",
    season: "Spring to Fall",
    tips: "Best caught early morning or evening. Use plastic worms, crankbaits, or spinnerbaits.",
  },
  {
    id: "2",
    name: "Rainbow Trout",
    scientificName: "Oncorhynchus mykiss",
    family: "Salmonidae",
    habitat: "Cold freshwater streams and lakes",
    avgWeight: "0.5-2 kg",
    maxWeight: "10+ kg",
    season: "Year-round, best in Spring",
    tips: "Use flies, spinners, or live bait. Fish in cold, oxygenated water.",
  },
  {
    id: "3",
    name: "Common Carp",
    scientificName: "Cyprinus carpio",
    family: "Cyprinidae",
    habitat: "Lakes, rivers, ponds",
    avgWeight: "2-5 kg",
    maxWeight: "30+ kg",
    season: "Spring to Fall",
    tips: "Use corn, bread, or boilies. Be patient and use heavy tackle.",
  },
  {
    id: "4",
    name: "Bluegill",
    scientificName: "Lepomis macrochirus",
    family: "Centrarchidae",
    habitat: "Freshwater ponds and lakes",
    avgWeight: "0.1-0.3 kg",
    maxWeight: "2 kg",
    season: "Spring to Summer",
    tips: "Great for beginners. Use worms, crickets, or small jigs.",
  },
  {
    id: "5",
    name: "Channel Catfish",
    scientificName: "Ictalurus punctatus",
    family: "Ictaluridae",
    habitat: "Rivers, lakes, reservoirs",
    avgWeight: "1-5 kg",
    maxWeight: "25+ kg",
    season: "Spring to Fall",
    tips: "Best at night. Use stink bait, cut bait, or live bait on bottom.",
  },
  {
    id: "6",
    name: "Northern Pike",
    scientificName: "Esox lucius",
    family: "Esocidae",
    habitat: "Lakes and slow rivers",
    avgWeight: "1-5 kg",
    maxWeight: "25+ kg",
    season: "Spring and Fall",
    tips: "Use large spoons, jerkbaits, or live bait. Wire leader recommended.",
  },
  {
    id: "7",
    name: "Walleye",
    scientificName: "Sander vitreus",
    family: "Percidae",
    habitat: "Large lakes and rivers",
    avgWeight: "0.5-2 kg",
    maxWeight: "10+ kg",
    season: "Spring and Fall",
    tips: "Best at dawn/dusk. Use jigs, minnows, or crankbaits in deep water.",
  },
  {
    id: "8",
    name: "Striped Bass",
    scientificName: "Morone saxatilis",
    family: "Moronidae",
    habitat: "Coastal waters, estuaries",
    avgWeight: "2-10 kg",
    maxWeight: "50+ kg",
    season: "Spring and Fall",
    tips: "Use live bait, plugs, or jigs. Fish near structure and current.",
  },
  {
    id: "9",
    name: "Red Drum",
    scientificName: "Sciaenops ocellatus",
    family: "Sciaenidae",
    habitat: "Coastal waters, estuaries",
    avgWeight: "2-8 kg",
    maxWeight: "40+ kg",
    season: "Year-round",
    tips: "Use cut bait, shrimp, or artificial lures. Fish near oyster beds.",
  },
  {
    id: "10",
    name: "Salmon (Atlantic)",
    scientificName: "Salmo salar",
    family: "Salmonidae",
    habitat: "Ocean, rivers (spawning)",
    avgWeight: "3-10 kg",
    maxWeight: "35+ kg",
    season: "Summer to Fall",
    tips: "Use flies, spoons, or spinners. Fish during runs.",
  },
  {
    id: "11",
    name: "Perch (European)",
    scientificName: "Perca fluviatilis",
    family: "Percidae",
    habitat: "Lakes and slow rivers",
    avgWeight: "0.2-0.5 kg",
    maxWeight: "3 kg",
    season: "Year-round",
    tips: "Use worms, small fish, or spinners. Fish near structure.",
  },
  {
    id: "12",
    name: "Tuna (Yellowfin)",
    scientificName: "Thunnus albacares",
    family: "Scombridae",
    habitat: "Open ocean",
    avgWeight: "20-50 kg",
    maxWeight: "180+ kg",
    season: "Summer",
    tips: "Trolling with lures or live bait. Heavy tackle required.",
  },
];

export default function SpeciesGuideScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);

  const filteredSpecies = useMemo(() => {
    if (!searchQuery.trim()) return fishDatabase;
    const query = searchQuery.toLowerCase();
    return fishDatabase.filter(
      (fish) =>
        fish.name.toLowerCase().includes(query) ||
        fish.family.toLowerCase().includes(query) ||
        fish.habitat.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const renderSpeciesCard = ({ item }: { item: FishSpecies }) => (
    <Pressable
      onPress={() => setSelectedSpecies(item)}
      style={[
        styles.speciesCard,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
    >
      <View style={[styles.speciesIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="anchor" size={24} color={theme.link} />
      </View>
      <View style={styles.speciesInfo}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, fontStyle: "italic" }}>
          {item.scientificName}
        </ThemedText>
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.family}
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  if (selectedSpecies) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: paddingTop + Spacing.md }]}>
          <Pressable onPress={() => setSelectedSpecies(null)} hitSlop={8}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>
            {selectedSpecies.name}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={[selectedSpecies]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom }}
          renderItem={() => (
            <View>
              <View style={[styles.detailIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="anchor" size={48} color={theme.link} />
              </View>

              <ThemedText type="small" style={[styles.scientificName, { color: theme.textSecondary }]}>
                {selectedSpecies.scientificName}
              </ThemedText>

              <View style={styles.detailSection}>
                <DetailRow
                  icon="layers"
                  label={t.species?.family || "Family"}
                  value={selectedSpecies.family}
                  theme={theme}
                />
                <DetailRow
                  icon="map-pin"
                  label={t.species?.habitat || "Habitat"}
                  value={selectedSpecies.habitat}
                  theme={theme}
                />
                <DetailRow
                  icon="activity"
                  label={t.species?.avgWeight || "Average Weight"}
                  value={selectedSpecies.avgWeight}
                  theme={theme}
                />
                <DetailRow
                  icon="award"
                  label={t.species?.maxWeight || "Maximum Weight"}
                  value={selectedSpecies.maxWeight}
                  theme={theme}
                />
                <DetailRow
                  icon="calendar"
                  label={t.species?.bestSeason || "Best Season"}
                  value={selectedSpecies.season}
                  theme={theme}
                />
              </View>

              <View style={[styles.tipsCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.link }]}>
                <View style={styles.tipsHeader}>
                  <Feather name="info" size={20} color={theme.link} />
                  <ThemedText type="h4" style={styles.tipsTitle}>
                    {t.species?.fishingTips || "Fishing Tips"}
                  </ThemedText>
                </View>
                <ThemedText type="body" style={{ lineHeight: 24 }}>
                  {selectedSpecies.tips}
                </ThemedText>
              </View>
            </View>
          )}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: paddingTop + Spacing.md }]}>
        <View
          style={[
            styles.searchInput,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={t.species?.search || "Search species..."}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filteredSpecies}
        keyExtractor={(item) => item.id}
        renderItem={renderSpeciesCard}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Feather name="book-open" size={20} color={theme.link} />
            <ThemedText type="h4" style={styles.listTitle}>
              {t.species?.guide || "Species Guide"}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {filteredSpecies.length} {t.species?.speciesCount || "species"}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
              {t.species?.noResults || "No species found"}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

function DetailRow({ icon, label, value, theme }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={18} color={theme.link} style={styles.detailRowIcon} />
      <View style={styles.detailRowContent}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
        <ThemedText type="body">{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  listTitle: {
    flex: 1,
  },
  speciesCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  speciesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  speciesInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  detailIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  scientificName: {
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: Spacing.xl,
  },
  detailSection: {
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  detailRowIcon: {
    marginRight: Spacing.md,
  },
  detailRowContent: {
    flex: 1,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    marginLeft: Spacing.sm,
  },
});
