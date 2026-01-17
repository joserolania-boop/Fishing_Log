import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAllCatches, Catch } from "@/utils/database";

export default function MapScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const [catches, setCatches] = useState<Catch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCatches = useCallback(async () => {
    try {
      const data = await getAllCatches();
      setCatches(data.filter((c) => c.latitude && c.longitude));
    } catch (error) {
      console.error("Failed to load catches:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCatches();
    }, [loadCatches])
  );

  const openInMaps = (latitude: number, longitude: number, name?: string) => {
    const label = encodeURIComponent(name || "Fishing Spot");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });
    if (url) {
      Linking.openURL(url).catch((err) => console.error("Error opening maps:", err));
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>{t.common.loading}</ThemedText>
      </ThemedView>
    );
  }

  if (catches.length === 0) {
    return (
      <ScreenScrollView contentContainerStyle={styles.emptyContainer}>
        <EmptyState
          icon="map"
          title={t.map?.noLocations || "No locations yet"}
          subtitle={t.map?.noLocationsSubtitle || "Log catches with location to see them on the map"}
        />
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <Feather name="map" size={24} color={theme.link} />
        <ThemedText type="h3" style={styles.headerTitle}>
          {t.map?.yourSpots || "Your Fishing Spots"}
        </ThemedText>
      </View>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t.map?.tapToOpen || "Tap a location to open in maps"}
      </ThemedText>

      {catches.map((catchItem) => (
        <Pressable
          key={catchItem.id}
          onPress={() =>
            openInMaps(catchItem.latitude!, catchItem.longitude!, catchItem.locationName || catchItem.species)
          }
          style={[
            styles.locationCard,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <View style={styles.locationContent}>
            {catchItem.photoUri ? (
              <Image
                source={{ uri: catchItem.photoUri }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="image" size={20} color={theme.textSecondary} />
              </View>
            )}
            <View style={styles.locationInfo}>
              <ThemedText type="body" style={styles.species}>
                {catchItem.species}
              </ThemedText>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                  {catchItem.locationName || `${catchItem.latitude?.toFixed(4)}, ${catchItem.longitude?.toFixed(4)}`}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {new Date(catchItem.dateTime).toLocaleDateString()}
              </ThemedText>
            </View>
            <Feather name="external-link" size={20} color={theme.link} />
          </View>
        </Pressable>
      ))}

      <View style={styles.mapNote}>
        <Feather name="info" size={16} color={theme.textSecondary} />
        <ThemedText type="small" style={[styles.noteText, { color: theme.textSecondary }]}>
          {t.map?.mapsNote || "Opens in your default maps application"}
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    marginLeft: Spacing.md,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  locationCard: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xs,
  },
  thumbnailPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  species: {
    fontWeight: "600",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  mapNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  noteText: {
    marginLeft: Spacing.sm,
  },
});
