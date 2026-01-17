import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Alert, ScrollView, Share, Dimensions, FlatList, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { weatherIcons, WeatherType } from "@/components/WeatherPicker";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, formatWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Catch, getCatchById, deleteCatch } from "@/utils/database";
import { CatchesStackParamList } from "@/navigation/CatchesStackNavigator";

const { width: screenWidth } = Dimensions.get("window");

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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Get all photos (from photoUris array or fallback to single photoUri)
  const photos: string[] = React.useMemo(() => {
    if (!catchItem) return [];
    if (catchItem.photoUris && catchItem.photoUris.length > 0) {
      return catchItem.photoUris;
    }
    if (catchItem.photoUri) {
      return [catchItem.photoUri];
    }
    return [];
  }, [catchItem]);

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

  const handleDelete = async () => {
    const confirmMessage = `${t.catchDetail.deleteConfirm}\n${t.catchDetail.deleteMessage}`;
    
    // Use window.confirm for web, Alert.alert for native
    if (Platform.OS === "web") {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        try {
          await deleteCatch(catchId);
          navigation.goBack();
        } catch (error) {
          console.error("Failed to delete catch:", error);
        }
      }
    } else {
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
    }
  };

  const handleShare = async () => {
    if (!catchItem) return;
    
    const weightText = formatWeight(catchItem.weight, settings.units);
    const locationText = catchItem.locationName || "a great fishing spot";
    
    // Create share message using translation template
    let shareMessage = t.catchDetail.shareText || "I caught a {weight} {species} at {location}! 🎣";
    shareMessage = shareMessage
      .replace("{weight}", weightText)
      .replace("{species}", catchItem.species)
      .replace("{location}", locationText);
    
    try {
      // Try to share with image if available
      if (catchItem.photoUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(catchItem.photoUri, {
          dialogTitle: t.catchDetail.share || "Share your catch",
          mimeType: "image/jpeg",
        });
      } else {
        // Share text only
        await Share.share({
          message: shareMessage,
          title: `${catchItem.species} - ${weightText}`,
        });
      }
    } catch (error) {
      console.error("Failed to share:", error);
      Alert.alert(t.common.error, t.errors?.shareFailed || "Failed to share");
    }
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl + 80 },
        ]}
      >
        {photos.length > 0 ? (
          <View style={styles.photoGalleryContainer}>
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => `photo-${index}`}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - Spacing.xl * 2));
                setCurrentPhotoIndex(index);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.photo, { width: screenWidth - Spacing.xl * 2 }]}
                  contentFit="cover"
                />
              )}
            />
            {photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoIndicator,
                      {
                        backgroundColor: index === currentPhotoIndex 
                          ? theme.link 
                          : theme.textSecondary,
                        opacity: index === currentPhotoIndex ? 1 : 0.4,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
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
              <WeatherDetailRow
                weather={catchItem.weather as WeatherType}
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
        <View style={styles.buttonRow}>
          <Button
            onPress={handleShare}
            style={[styles.shareButton, { backgroundColor: AppColors.primary }]}
          >
            <View style={styles.buttonContent}>
              <Feather name="share-2" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {t.catchDetail.share || t.common.share}
              </ThemedText>
            </View>
          </Button>
          <Button
            onPress={handleDelete}
            style={[styles.deleteButton, { backgroundColor: theme.destructive }]}
          >
            <View style={styles.buttonContent}>
              <Feather name="trash-2" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {t.catchDetail.delete}
              </ThemedText>
            </View>
          </Button>
        </View>
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

interface WeatherDetailRowProps {
  weather: WeatherType;
  label: string;
  value: string;
  theme: any;
}

function WeatherDetailRow({ weather, label, value, theme }: WeatherDetailRowProps) {
  return (
    <View style={detailStyles.row}>
      <View style={[detailStyles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <MaterialCommunityIcons 
          name={weatherIcons[weather]} 
          size={22} 
          color={theme.link} 
        />
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
  photoGalleryContainer: {
    marginTop: Spacing.lg,
  },
  photo: {
    height: 250,
    borderRadius: BorderRadius.sm,
  },
  photoIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  shareButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
