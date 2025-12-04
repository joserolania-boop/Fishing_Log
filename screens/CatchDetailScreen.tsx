import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, formatWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Catch, getCatchById, deleteCatch } from "@/utils/database";
import { CatchesStackParamList } from "@/navigation/CatchesStackNavigator";

type NavigationProp = NativeStackNavigationProp<CatchesStackParamList, "CatchDetail">;
type RouteType = RouteProp<CatchesStackParamList, "CatchDetail">;

export default function CatchDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  const { catchId } = route.params;
  const [catchItem, setCatchItem] = useState<Catch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCatch();
  }, [catchId]);

  const loadCatch = async () => {
    try {
      const data = await getCatchById(catchId);
      setCatchItem(data);
    } catch (error) {
      console.error("Failed to load catch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (catchItem) {
      navigation.navigate("LogCatch", { editCatch: catchItem });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t.catchDetail.deleteConfirm,
      t.catchDetail.deleteMessage,
      [
        { text: t.catchDetail.deleteCancel, style: "cancel" },
        {
          text: t.catchDetail.deleteOk,
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCatch(catchId);
              navigation.goBack();
            } catch (error) {
              console.error("Failed to delete catch:", error);
            }
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleEdit} hitSlop={8}>
          <ThemedText style={{ color: theme.link }}>{t.catchDetail.edit}</ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, theme, t, catchItem]);

  if (isLoading || !catchItem) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>{t.common.loading}</ThemedText>
      </ThemedView>
    );
  }

  const formattedDate = new Date(catchItem.dateTime).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(catchItem.dateTime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedWeight = formatWeight(catchItem.weight, settings.units);

  const weatherLabels: Record<string, string> = {
    sunny: t.weather.sunny,
    cloudy: t.weather.cloudy,
    rainy: t.weather.rainy,
    windy: t.weather.windy,
  };

  const weatherIcons: Record<string, keyof typeof Feather.glyphMap> = {
    sunny: "sun",
    cloudy: "cloud",
    rainy: "cloud-rain",
    windy: "wind",
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl + 80 },
        ]}
      >
        {catchItem.photoUri ? (
          <Image
            source={{ uri: catchItem.photoUri }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View
            style={[styles.photoPlaceholder, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="image" size={64} color={theme.textSecondary} />
          </View>
        )}

        <View style={styles.content}>
          <ThemedText type="h1" style={styles.species}>
            {catchItem.species}
          </ThemedText>

          <View style={styles.detailsGrid}>
            <DetailRow
              icon="activity"
              label={t.catchDetail.weight}
              value={formattedWeight}
              theme={theme}
            />
            <DetailRow
              icon="calendar"
              label={t.catchDetail.date}
              value={formattedDate}
              theme={theme}
            />
            <DetailRow
              icon="clock"
              label={t.catchDetail.time}
              value={formattedTime}
              theme={theme}
            />
            {catchItem.locationName ? (
              <DetailRow
                icon="map-pin"
                label={t.catchDetail.location}
                value={catchItem.locationName}
                theme={theme}
              />
            ) : null}
            {catchItem.bait ? (
              <DetailRow
                icon="target"
                label={t.catchDetail.bait}
                value={catchItem.bait}
                theme={theme}
              />
            ) : null}
            {catchItem.weather ? (
              <DetailRow
                icon={weatherIcons[catchItem.weather]}
                label={t.catchDetail.weather}
                value={weatherLabels[catchItem.weather]}
                theme={theme}
              />
            ) : null}
          </View>

          {catchItem.notes ? (
            <View style={styles.notesSection}>
              <ThemedText type="h4" style={styles.notesTitle}>
                {t.catchDetail.notes}
              </ThemedText>
              <View
                style={[
                  styles.notesCard,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                ]}
              >
                <ThemedText type="body">{catchItem.notes}</ThemedText>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.deleteButtonContainer,
          { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot },
        ]}
      >
        <Button
          onPress={handleDelete}
          style={{ backgroundColor: theme.destructive }}
        >
          {t.catchDetail.delete}
        </Button>
      </View>
    </ThemedView>
  );
}

interface DetailRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  theme: any;
}

function DetailRow({ icon, label, value, theme }: DetailRowProps) {
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={18} color={theme.link} />
      </View>
      <View style={detailStyles.textContainer}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {label}
        </ThemedText>
        <ThemedText type="body">{value}</ThemedText>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  photo: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  photoPlaceholder: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    marginTop: Spacing.xl,
  },
  species: {
    marginBottom: Spacing.xl,
  },
  detailsGrid: {
    marginBottom: Spacing.lg,
  },
  notesSection: {
    marginTop: Spacing.md,
  },
  notesTitle: {
    marginBottom: Spacing.md,
  },
  notesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  deleteButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
});
