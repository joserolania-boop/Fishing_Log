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
  nameKey: string;
  scientificName: string;
  familyKey: string;
  habitatKey: string;
  avgWeight: string;
  maxWeight: string;
  seasonKey: string;
  tipsKey: string;
  emoji: string;
}

// Comprehensive fish database with translation keys
const fishDatabase: FishSpecies[] = [
  // FRESHWATER - BASS & SUNFISH
  { id: "1", nameKey: "largemouthBass", scientificName: "Micropterus salmoides", familyKey: "centrarchidae", habitatKey: "freshwaterLakes", avgWeight: "1-2 kg", maxWeight: "10+ kg", seasonKey: "springToFall", tipsKey: "bassLargeTips", emoji: "🐟" },
  { id: "2", nameKey: "smallmouthBass", scientificName: "Micropterus dolomieu", familyKey: "centrarchidae", habitatKey: "coolStreams", avgWeight: "0.5-1.5 kg", maxWeight: "5 kg", seasonKey: "springToFall", tipsKey: "bassSmallTips", emoji: "🐟" },
  { id: "3", nameKey: "bluegill", scientificName: "Lepomis macrochirus", familyKey: "centrarchidae", habitatKey: "freshwaterPonds", avgWeight: "0.1-0.3 kg", maxWeight: "2 kg", seasonKey: "springToSummer", tipsKey: "bluegillTips", emoji: "🐟" },
  { id: "4", nameKey: "crappie", scientificName: "Pomoxis spp.", familyKey: "centrarchidae", habitatKey: "freshwaterLakes", avgWeight: "0.2-0.5 kg", maxWeight: "2 kg", seasonKey: "springToFall", tipsKey: "crappieTips", emoji: "🐟" },
  
  // FRESHWATER - TROUT & SALMON
  { id: "5", nameKey: "rainbowTrout", scientificName: "Oncorhynchus mykiss", familyKey: "salmonidae", habitatKey: "coldStreams", avgWeight: "0.5-2 kg", maxWeight: "10+ kg", seasonKey: "yearRoundSpring", tipsKey: "rainbowTroutTips", emoji: "🐟" },
  { id: "6", nameKey: "brownTrout", scientificName: "Salmo trutta", familyKey: "salmonidae", habitatKey: "coldStreams", avgWeight: "0.5-3 kg", maxWeight: "15+ kg", seasonKey: "yearRound", tipsKey: "brownTroutTips", emoji: "🐟" },
  { id: "7", nameKey: "brookTrout", scientificName: "Salvelinus fontinalis", familyKey: "salmonidae", habitatKey: "coldMountainStreams", avgWeight: "0.2-1 kg", maxWeight: "6 kg", seasonKey: "springToFall", tipsKey: "brookTroutTips", emoji: "🐟" },
  { id: "8", nameKey: "atlanticSalmon", scientificName: "Salmo salar", familyKey: "salmonidae", habitatKey: "oceanRivers", avgWeight: "3-10 kg", maxWeight: "35+ kg", seasonKey: "summerToFall", tipsKey: "atlanticSalmonTips", emoji: "🐟" },
  { id: "9", nameKey: "chinookSalmon", scientificName: "Oncorhynchus tshawytscha", familyKey: "salmonidae", habitatKey: "pacificOcean", avgWeight: "5-15 kg", maxWeight: "60+ kg", seasonKey: "summerToFall", tipsKey: "chinookTips", emoji: "🐟" },
  { id: "10", nameKey: "cohoSalmon", scientificName: "Oncorhynchus kisutch", familyKey: "salmonidae", habitatKey: "pacificOcean", avgWeight: "3-6 kg", maxWeight: "15+ kg", seasonKey: "fallToWinter", tipsKey: "cohoTips", emoji: "🐟" },
  
  // FRESHWATER - CATFISH
  { id: "11", nameKey: "channelCatfish", scientificName: "Ictalurus punctatus", familyKey: "ictaluridae", habitatKey: "riversLakes", avgWeight: "1-5 kg", maxWeight: "25+ kg", seasonKey: "springToFall", tipsKey: "channelCatTips", emoji: "🐡" },
  { id: "12", nameKey: "blueCatfish", scientificName: "Ictalurus furcatus", familyKey: "ictaluridae", habitatKey: "largeRivers", avgWeight: "5-20 kg", maxWeight: "65+ kg", seasonKey: "yearRound", tipsKey: "blueCatTips", emoji: "🐡" },
  { id: "13", nameKey: "flatheadCatfish", scientificName: "Pylodictis olivaris", familyKey: "ictaluridae", habitatKey: "largeRivers", avgWeight: "5-15 kg", maxWeight: "55+ kg", seasonKey: "summerToFall", tipsKey: "flatheadTips", emoji: "🐡" },
  { id: "14", nameKey: "welsCatfish", scientificName: "Silurus glanis", familyKey: "siluridae", habitatKey: "europeanRivers", avgWeight: "10-50 kg", maxWeight: "300+ kg", seasonKey: "springToFall", tipsKey: "welsTips", emoji: "🐡" },
  
  // FRESHWATER - PIKE & MUSKIE
  { id: "15", nameKey: "northernPike", scientificName: "Esox lucius", familyKey: "esocidae", habitatKey: "lakesSlowRivers", avgWeight: "1-5 kg", maxWeight: "25+ kg", seasonKey: "springAndFall", tipsKey: "pikeTips", emoji: "🐊" },
  { id: "16", nameKey: "muskellunge", scientificName: "Esox masquinongy", familyKey: "esocidae", habitatKey: "clearLakes", avgWeight: "5-10 kg", maxWeight: "30+ kg", seasonKey: "fallToWinter", tipsKey: "muskieTips", emoji: "🐊" },
  { id: "17", nameKey: "tigerMuskie", scientificName: "Esox masquinongy × lucius", familyKey: "esocidae", habitatKey: "stockedLakes", avgWeight: "3-8 kg", maxWeight: "15+ kg", seasonKey: "springAndFall", tipsKey: "tigerMuskieTips", emoji: "🐊" },
  
  // FRESHWATER - WALLEYE & PERCH
  { id: "18", nameKey: "walleye", scientificName: "Sander vitreus", familyKey: "percidae", habitatKey: "largeLakesRivers", avgWeight: "0.5-2 kg", maxWeight: "10+ kg", seasonKey: "springAndFall", tipsKey: "walleyeTips", emoji: "🐟" },
  { id: "19", nameKey: "yellowPerch", scientificName: "Perca flavescens", familyKey: "percidae", habitatKey: "lakesAndPonds", avgWeight: "0.1-0.3 kg", maxWeight: "1 kg", seasonKey: "yearRound", tipsKey: "yellowPerchTips", emoji: "🐟" },
  { id: "20", nameKey: "europeanPerch", scientificName: "Perca fluviatilis", familyKey: "percidae", habitatKey: "europeanLakes", avgWeight: "0.2-0.5 kg", maxWeight: "3 kg", seasonKey: "yearRound", tipsKey: "europeanPerchTips", emoji: "🐟" },
  { id: "21", nameKey: "zander", scientificName: "Sander lucioperca", familyKey: "percidae", habitatKey: "europeanLakes", avgWeight: "1-4 kg", maxWeight: "15+ kg", seasonKey: "yearRound", tipsKey: "zanderTips", emoji: "🐟" },
  
  // FRESHWATER - CARP & CYPRINIDS
  { id: "22", nameKey: "commonCarp", scientificName: "Cyprinus carpio", familyKey: "cyprinidae", habitatKey: "lakesRiversPonds", avgWeight: "2-5 kg", maxWeight: "30+ kg", seasonKey: "springToFall", tipsKey: "carpTips", emoji: "🐡" },
  { id: "23", nameKey: "mirrorCarp", scientificName: "Cyprinus carpio carpio", familyKey: "cyprinidae", habitatKey: "lakesRiversPonds", avgWeight: "3-8 kg", maxWeight: "35+ kg", seasonKey: "springToFall", tipsKey: "mirrorCarpTips", emoji: "🐡" },
  { id: "24", nameKey: "grassCarp", scientificName: "Ctenopharyngodon idella", familyKey: "cyprinidae", habitatKey: "warmLakes", avgWeight: "5-15 kg", maxWeight: "40+ kg", seasonKey: "summerToFall", tipsKey: "grassCarpTips", emoji: "🐡" },
  { id: "25", nameKey: "barbel", scientificName: "Barbus barbus", familyKey: "cyprinidae", habitatKey: "europeanRivers", avgWeight: "1-3 kg", maxWeight: "10+ kg", seasonKey: "summerToFall", tipsKey: "barbelTips", emoji: "🐟" },
  { id: "26", nameKey: "tench", scientificName: "Tinca tinca", familyKey: "cyprinidae", habitatKey: "weedyPonds", avgWeight: "0.5-2 kg", maxWeight: "7+ kg", seasonKey: "summerToFall", tipsKey: "tenchTips", emoji: "🐟" },
  { id: "27", nameKey: "bream", scientificName: "Abramis brama", familyKey: "cyprinidae", habitatKey: "slowRivers", avgWeight: "0.5-2 kg", maxWeight: "8+ kg", seasonKey: "springToFall", tipsKey: "breamTips", emoji: "🐟" },
  { id: "28", nameKey: "roach", scientificName: "Rutilus rutilus", familyKey: "cyprinidae", habitatKey: "europeanWaters", avgWeight: "0.1-0.5 kg", maxWeight: "2 kg", seasonKey: "yearRound", tipsKey: "roachTips", emoji: "🐟" },
  
  // SALTWATER - GAMEFISH
  { id: "29", nameKey: "stripedBass", scientificName: "Morone saxatilis", familyKey: "moronidae", habitatKey: "coastalEstuaries", avgWeight: "2-10 kg", maxWeight: "50+ kg", seasonKey: "springAndFall", tipsKey: "stripedBassTips", emoji: "🐟" },
  { id: "30", nameKey: "redDrum", scientificName: "Sciaenops ocellatus", familyKey: "sciaenidae", habitatKey: "coastalEstuaries", avgWeight: "2-8 kg", maxWeight: "40+ kg", seasonKey: "yearRound", tipsKey: "redDrumTips", emoji: "🐟" },
  { id: "31", nameKey: "blackDrum", scientificName: "Pogonias cromis", familyKey: "sciaenidae", habitatKey: "coastalWaters", avgWeight: "5-15 kg", maxWeight: "45+ kg", seasonKey: "springToFall", tipsKey: "blackDrumTips", emoji: "🐟" },
  { id: "32", nameKey: "snook", scientificName: "Centropomus undecimalis", familyKey: "centropomidae", habitatKey: "tropicalCoasts", avgWeight: "2-8 kg", maxWeight: "25+ kg", seasonKey: "summerToFall", tipsKey: "snookTips", emoji: "🐟" },
  { id: "33", nameKey: "tarpon", scientificName: "Megalops atlanticus", familyKey: "megalopidae", habitatKey: "tropicalCoasts", avgWeight: "20-50 kg", maxWeight: "130+ kg", seasonKey: "springToSummer", tipsKey: "tarponTips", emoji: "🐟" },
  { id: "34", nameKey: "bonefish", scientificName: "Albula vulpes", familyKey: "albulidae", habitatKey: "tropicalFlats", avgWeight: "1-4 kg", maxWeight: "8+ kg", seasonKey: "yearRound", tipsKey: "bonefishTips", emoji: "🐟" },
  { id: "35", nameKey: "permit", scientificName: "Trachinotus falcatus", familyKey: "carangidae", habitatKey: "tropicalFlats", avgWeight: "3-10 kg", maxWeight: "25+ kg", seasonKey: "yearRound", tipsKey: "permitTips", emoji: "🐟" },
  
  // SALTWATER - TUNA & BILLFISH
  { id: "36", nameKey: "yellowfinTuna", scientificName: "Thunnus albacares", familyKey: "scombridae", habitatKey: "openOcean", avgWeight: "20-50 kg", maxWeight: "180+ kg", seasonKey: "summer", tipsKey: "yellowfinTips", emoji: "🐟" },
  { id: "37", nameKey: "bluefinTuna", scientificName: "Thunnus thynnus", familyKey: "scombridae", habitatKey: "openOcean", avgWeight: "50-150 kg", maxWeight: "680+ kg", seasonKey: "summerToFall", tipsKey: "bluefinTips", emoji: "🐟" },
  { id: "38", nameKey: "skipjackTuna", scientificName: "Katsuwonus pelamis", familyKey: "scombridae", habitatKey: "tropicalOcean", avgWeight: "2-6 kg", maxWeight: "15+ kg", seasonKey: "yearRound", tipsKey: "skipjackTips", emoji: "🐟" },
  { id: "39", nameKey: "albacore", scientificName: "Thunnus alalunga", familyKey: "scombridae", habitatKey: "temperateOcean", avgWeight: "5-15 kg", maxWeight: "40+ kg", seasonKey: "summerToFall", tipsKey: "albacoreTips", emoji: "🐟" },
  { id: "40", nameKey: "bluemarlin", scientificName: "Makaira nigricans", familyKey: "istiophoridae", habitatKey: "tropicalOcean", avgWeight: "100-200 kg", maxWeight: "600+ kg", seasonKey: "summer", tipsKey: "bluemarlinTips", emoji: "🐟" },
  { id: "41", nameKey: "sailfish", scientificName: "Istiophorus platypterus", familyKey: "istiophoridae", habitatKey: "tropicalOcean", avgWeight: "25-50 kg", maxWeight: "100+ kg", seasonKey: "winterToSpring", tipsKey: "sailfishTips", emoji: "🐟" },
  { id: "42", nameKey: "swordfish", scientificName: "Xiphias gladius", familyKey: "xiphiidae", habitatKey: "openOcean", avgWeight: "50-100 kg", maxWeight: "450+ kg", seasonKey: "summerToFall", tipsKey: "swordfishTips", emoji: "🐟" },
  
  // SALTWATER - REEF & BOTTOM
  { id: "43", nameKey: "redSnapper", scientificName: "Lutjanus campechanus", familyKey: "lutjanidae", habitatKey: "gulfReefs", avgWeight: "2-5 kg", maxWeight: "20+ kg", seasonKey: "summerToFall", tipsKey: "redSnapperTips", emoji: "🐟" },
  { id: "44", nameKey: "yellowtailSnapper", scientificName: "Ocyurus chrysurus", familyKey: "lutjanidae", habitatKey: "tropicalReefs", avgWeight: "0.5-2 kg", maxWeight: "4+ kg", seasonKey: "yearRound", tipsKey: "yellowtailSnapperTips", emoji: "🐟" },
  { id: "45", nameKey: "grouper", scientificName: "Epinephelus spp.", familyKey: "serranidae", habitatKey: "tropicalReefs", avgWeight: "5-20 kg", maxWeight: "100+ kg", seasonKey: "springToFall", tipsKey: "grouperTips", emoji: "🐟" },
  { id: "46", nameKey: "hogfish", scientificName: "Lachnolaimus maximus", familyKey: "labridae", habitatKey: "atlanticReefs", avgWeight: "1-3 kg", maxWeight: "10+ kg", seasonKey: "yearRound", tipsKey: "hogfishTips", emoji: "🐟" },
  { id: "47", nameKey: "halibut", scientificName: "Hippoglossus spp.", familyKey: "pleuronectidae", habitatKey: "coldOceanFloors", avgWeight: "10-30 kg", maxWeight: "300+ kg", seasonKey: "summerToFall", tipsKey: "halibutTips", emoji: "🐟" },
  { id: "48", nameKey: "flounder", scientificName: "Paralichthys spp.", familyKey: "paralichthyidae", habitatKey: "coastalSandyBottoms", avgWeight: "0.5-2 kg", maxWeight: "10+ kg", seasonKey: "fallToWinter", tipsKey: "flounderTips", emoji: "🐟" },
  
  // SALTWATER - PELAGIC
  { id: "49", nameKey: "mahimahi", scientificName: "Coryphaena hippurus", familyKey: "coryphaenidae", habitatKey: "tropicalOcean", avgWeight: "5-15 kg", maxWeight: "40+ kg", seasonKey: "springToFall", tipsKey: "mahiTips", emoji: "🐟" },
  { id: "50", nameKey: "wahoo", scientificName: "Acanthocybium solandri", familyKey: "scombridae", habitatKey: "tropicalOcean", avgWeight: "10-25 kg", maxWeight: "80+ kg", seasonKey: "yearRound", tipsKey: "wahooTips", emoji: "🐟" },
  { id: "51", nameKey: "kingMackerel", scientificName: "Scomberomorus cavalla", familyKey: "scombridae", habitatKey: "atlanticCoast", avgWeight: "5-15 kg", maxWeight: "40+ kg", seasonKey: "springToFall", tipsKey: "kingMackerelTips", emoji: "🐟" },
  { id: "52", nameKey: "spanishMackerel", scientificName: "Scomberomorus maculatus", familyKey: "scombridae", habitatKey: "coastalWaters", avgWeight: "1-3 kg", maxWeight: "6+ kg", seasonKey: "springToFall", tipsKey: "spanishMackerelTips", emoji: "🐟" },
  { id: "53", nameKey: "cobia", scientificName: "Rachycentron canadum", familyKey: "rachycentridae", habitatKey: "tropicalCoasts", avgWeight: "5-20 kg", maxWeight: "60+ kg", seasonKey: "springToSummer", tipsKey: "cobiaTips", emoji: "🐟" },
  { id: "54", nameKey: "amberjack", scientificName: "Seriola dumerili", familyKey: "carangidae", habitatKey: "reefStructures", avgWeight: "10-30 kg", maxWeight: "70+ kg", seasonKey: "springToFall", tipsKey: "amberjackTips", emoji: "🐟" },
  
  // SHARKS
  { id: "55", nameKey: "blacktipShark", scientificName: "Carcharhinus limbatus", familyKey: "carcharhinidae", habitatKey: "coastalWaters", avgWeight: "10-30 kg", maxWeight: "120+ kg", seasonKey: "springToFall", tipsKey: "blacktipTips", emoji: "🦈" },
  { id: "56", nameKey: "bullShark", scientificName: "Carcharhinus leucas", familyKey: "carcharhinidae", habitatKey: "coastalFreshwater", avgWeight: "50-100 kg", maxWeight: "300+ kg", seasonKey: "summerToFall", tipsKey: "bullSharkTips", emoji: "🦈" },
  { id: "57", nameKey: "hammerheadShark", scientificName: "Sphyrna spp.", familyKey: "sphyrnidae", habitatKey: "tropicalWaters", avgWeight: "50-150 kg", maxWeight: "450+ kg", seasonKey: "summerToFall", tipsKey: "hammerheadTips", emoji: "🦈" },
  { id: "58", nameKey: "makoShark", scientificName: "Isurus oxyrinchus", familyKey: "lamnidae", habitatKey: "openOcean", avgWeight: "50-150 kg", maxWeight: "500+ kg", seasonKey: "summerToFall", tipsKey: "makoTips", emoji: "🦈" },
  
  // ASIAN SPECIES
  { id: "59", nameKey: "asianSeaBass", scientificName: "Lates calcarifer", familyKey: "latidae", habitatKey: "indoPacific", avgWeight: "5-20 kg", maxWeight: "60+ kg", seasonKey: "yearRound", tipsKey: "barramundiTips", emoji: "🐟" },
  { id: "60", nameKey: "giantTrevally", scientificName: "Caranx ignobilis", familyKey: "carangidae", habitatKey: "indoPacificReefs", avgWeight: "10-30 kg", maxWeight: "80+ kg", seasonKey: "yearRound", tipsKey: "gtTips", emoji: "🐟" },
];

export default function SpeciesGuideScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { paddingTop, paddingBottom } = useScreenInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<FishSpecies | null>(null);

  // Helper to get translated text with fallback
  const getText = (key: string, fallback: string): string => {
    const speciesData = (t as any).speciesData;
    return speciesData?.[key] || fallback;
  };

  // Get display data for a fish
  const getFishDisplay = (fish: FishSpecies) => ({
    name: getText(fish.nameKey, fish.nameKey.replace(/([A-Z])/g, ' $1').trim()),
    family: getText(fish.familyKey, fish.familyKey),
    habitat: getText(fish.habitatKey, fish.habitatKey),
    season: getText(fish.seasonKey, fish.seasonKey),
    tips: getText(fish.tipsKey, "Use appropriate tackle and techniques for this species."),
  });

  const filteredSpecies = useMemo(() => {
    if (!searchQuery.trim()) return fishDatabase;
    const query = searchQuery.toLowerCase();
    return fishDatabase.filter((fish) => {
      const display = getFishDisplay(fish);
      return (
        display.name.toLowerCase().includes(query) ||
        display.family.toLowerCase().includes(query) ||
        display.habitat.toLowerCase().includes(query) ||
        fish.scientificName.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, t]);

  const renderSpeciesCard = ({ item }: { item: FishSpecies }) => {
    const display = getFishDisplay(item);
    return (
      <Pressable
        onPress={() => setSelectedSpecies(item)}
        style={[
          styles.speciesCard,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        <View style={[styles.speciesIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={{ fontSize: 24 }}>{item.emoji}</ThemedText>
        </View>
        <View style={styles.speciesInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {display.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, fontStyle: "italic" }}>
            {item.scientificName}
          </ThemedText>
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {display.family}
              </ThemedText>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  if (selectedSpecies) {
    const selectedDisplay = getFishDisplay(selectedSpecies);
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: paddingTop + Spacing.md }]}>
          <Pressable onPress={() => setSelectedSpecies(null)} hitSlop={8}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>
            {selectedDisplay.name}
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
                <ThemedText style={{ fontSize: 48 }}>{selectedSpecies.emoji}</ThemedText>
              </View>

              <ThemedText type="small" style={[styles.scientificName, { color: theme.textSecondary }]}>
                {selectedSpecies.scientificName}
              </ThemedText>

              <View style={styles.detailSection}>
                <DetailRow
                  icon="layers"
                  label={t.species?.family || "Family"}
                  value={selectedDisplay.family}
                  theme={theme}
                />
                <DetailRow
                  icon="map-pin"
                  label={t.species?.habitat || "Habitat"}
                  value={selectedDisplay.habitat}
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
                  value={selectedDisplay.season}
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
                  {selectedDisplay.tips}
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
