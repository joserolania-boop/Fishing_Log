import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Linking from "expo-linking";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { FormInput } from "@/components/FormInput";
import { FormTextArea } from "@/components/FormTextArea";
import { WeatherPicker } from "@/components/WeatherPicker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, parseWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { addCatch, updateCatch, getStats, NewCatch, Catch } from "@/utils/database";
import { CatchesStackParamList } from "@/navigation/CatchesStackNavigator";
import { compressImage } from "@/utils/imageUtils";
import { useToast } from "@/components/Toast";
import { haptics } from "@/utils/haptics";

const MAX_PHOTOS = 5; // Maximum number of photos per catch

type NavigationProp = NativeStackNavigationProp<CatchesStackParamList, "LogCatch">;
type RouteType = RouteProp<CatchesStackParamList, "LogCatch">;

export default function LogCatchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const editCatch = route.params?.editCatch;
  const isEditing = !!editCatch;

  const [species, setSpecies] = useState(editCatch?.species || "");
  const [weight, setWeight] = useState(editCatch?.weight?.toString() || "");
  // Support for multiple photos (photoUris array)
  const [photoUris, setPhotoUris] = useState<string[]>(() => {
    if (editCatch?.photoUris && editCatch.photoUris.length > 0) {
      return editCatch.photoUris;
    }
    // Fallback to single photo for backward compatibility
    if (editCatch?.photoUri) {
      return [editCatch.photoUri];
    }
    return [];
  });
  const [latitude, setLatitude] = useState<number | null>(editCatch?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(editCatch?.longitude || null);
  const [locationName, setLocationName] = useState(editCatch?.locationName || "");
  const [dateTime, setDateTime] = useState(editCatch?.dateTime || new Date().toISOString());
  const [bait, setBait] = useState(editCatch?.bait || "");
  const [weather, setWeather] = useState<"sunny" | "cloudy" | "rainy" | "windy" | null>(
    editCatch?.weather || null
  );
  const [notes, setNotes] = useState(editCatch?.notes || "");
  const [tags, setTags] = useState<string[]>(editCatch?.tags || []);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  
  // Validation errors
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // Check for new achievements after saving a catch
  const checkNewAchievements = (catchesBefore: number, catchesAfter: number, catchWeight: number) => {
    const milestones = [1, 10, 50, 100];
    
    for (const milestone of milestones) {
      if (catchesBefore < milestone && catchesAfter >= milestone) {
        let message = "";
        if (milestone === 1) {
          message = "🎣 First Catch! You've logged your first fish!";
        } else if (milestone === 10) {
          message = "🏆 Getting Started! You've logged 10 catches!";
        } else if (milestone === 50) {
          message = "⭐ Experienced Angler! 50 catches logged!";
        } else if (milestone === 100) {
          message = "👑 Master Fisher! 100 catches achieved!";
        }
        showToast(message, "success", 4000);
        return; // Only show one achievement at a time
      }
    }
    
    // Check for big catch achievement
    if (catchWeight >= 5) {
      showToast("🐟 Big Catch! You caught a fish over 5kg!", "success", 4000);
    } else if (catchWeight >= 20) {
      showToast("🦈 Monster Catch! You caught a fish over 20kg!", "success", 4000);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate species
    if (!species.trim()) {
      setSpeciesError(t.logCatch.validation?.speciesRequired || "Species is required");
      isValid = false;
    } else {
      setSpeciesError(null);
    }
    
    // Validate weight
    if (!weight.trim()) {
      setWeightError(t.logCatch.validation?.weightRequired || "Weight is required");
      isValid = false;
    } else {
      const weightNum = parseFloat(weight.replace(",", "."));
      if (isNaN(weightNum) || weightNum <= 0) {
        setWeightError(t.logCatch.validation?.weightPositive || "Weight must be positive");
        isValid = false;
      } else if (weightNum > 500) {
        setWeightError(t.logCatch.validation?.weightTooHigh || "Weight seems too high");
        isValid = false;
      } else {
        setWeightError(null);
      }
    }
    
    return isValid;
  };

  const canSave = species.trim() !== "" && weight.trim() !== "" && !isSaving && !isCompressingImage;

  useEffect(() => {
    if (!isEditing && !latitude && !longitude) {
      requestLocationAndFetch();
    }
  }, []);

  const requestLocationAndFetch = async () => {
    setIsLoadingLocation(true);
    try {
      let permission = locationPermission;
      if (!permission?.granted) {
        permission = await requestLocationPermission();
      }

      if (permission?.granted) {
        // Use lower accuracy on web for faster response
        const accuracyLevel = Platform.OS === "web" 
          ? Location.Accuracy.Low 
          : Location.Accuracy.Balanced;
        
        // Add timeout for web platform (10 seconds)
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: accuracyLevel,
        });
        
        let location;
        if (Platform.OS === "web") {
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error("Location timeout")), 10000)
          );
          try {
            location = await Promise.race([locationPromise, timeoutPromise]);
          } catch (timeoutError) {
            console.log("Location timed out on web, continuing without location");
            setIsLoadingLocation(false);
            return;
          }
        } else {
          location = await locationPromise;
        }
        
        if (location) {
          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);

          const addresses = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (addresses.length > 0) {
            const addr = addresses[0];
            const parts = [addr.city, addr.region, addr.country].filter(Boolean);
            setLocationName(parts.join(", "));
          }
        }
      }
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    if (photoUris.length >= MAX_PHOTOS) {
      Alert.alert(
        t.logCatch.maxPhotos || "Maximum Photos",
        t.logCatch.maxPhotosMessage || `You can only add up to ${MAX_PHOTOS} photos per catch.`
      );
      return;
    }
    
    let permission = cameraPermission;
    if (!permission?.granted) {
      permission = await requestCameraPermission();
    }

    if (!permission?.granted) {
      if (permission?.status === "denied" && !permission?.canAskAgain) {
        Alert.alert(
          t.permissions.camera,
          "",
          Platform.OS !== "web"
            ? [
                { text: t.common.cancel, style: "cancel" },
                {
                  text: t.permissions.openSettings,
                  onPress: async () => {
                    try {
                      await Linking.openSettings();
                    } catch (error) {
                      console.error("Failed to open settings:", error);
                    }
                  },
                },
              ]
            : [{ text: "OK" }]
        );
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Compress image before saving
      setIsCompressingImage(true);
      try {
        const compressedUri = await compressImage(result.assets[0].uri);
        setPhotoUris(prev => [...prev, compressedUri]);
        haptics.light();
      } catch (error) {
        console.error("Failed to compress image:", error);
        setPhotoUris(prev => [...prev, result.assets[0].uri]); // Use original if compression fails
      } finally {
        setIsCompressingImage(false);
      }
    }
  };

  const handleChoosePhoto = async () => {
    if (photoUris.length >= MAX_PHOTOS) {
      Alert.alert(
        t.logCatch.maxPhotos || "Maximum Photos",
        t.logCatch.maxPhotosMessage || `You can only add up to ${MAX_PHOTOS} photos per catch.`
      );
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Compress image before saving
      setIsCompressingImage(true);
      try {
        const compressedUri = await compressImage(result.assets[0].uri);
        setPhotoUris(prev => [...prev, compressedUri]);
        haptics.light();
      } catch (error) {
        console.error("Failed to compress image:", error);
        setPhotoUris(prev => [...prev, result.assets[0].uri]); // Use original if compression fails
      } finally {
        setIsCompressingImage(false);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    haptics.light();
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const showPhotoOptions = () => {
    if (Platform.OS === "web") {
      // En web, ir directamente a elegir de galería (no hay cámara)
      handleChoosePhoto();
    } else {
      Alert.alert(t.logCatch.addPhoto, "", [
        { text: t.logCatch.takePhoto, onPress: handleTakePhoto },
        { text: t.logCatch.choosePhoto, onPress: handleChoosePhoto },
        { text: t.common.cancel, style: "cancel" },
      ]);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (isSaving) return;

    setIsSaving(true);
    haptics.light();
    try {
      // Get stats before saving to check for new achievements
      const statsBefore = await getStats();
      
      const catchData: NewCatch = {
        species: species.trim(),
        weight: parseWeight(weight, settings.units),
        photoUri: photoUris.length > 0 ? photoUris[0] : null, // Keep first photo for backward compatibility
        photoUris: photoUris.length > 0 ? photoUris : null, // All photos
        latitude,
        longitude,
        locationName: locationName.trim() || null,
        dateTime,
        bait: bait.trim() || null,
        weather,
        notes: notes.trim() || null,
        tags: tags.length > 0 ? tags : null,
      };

      if (isEditing && editCatch) {
        await updateCatch(editCatch.id, catchData);
      } else {
        await addCatch(catchData);
        
        // Check for new achievements
        const statsAfter = await getStats();
        checkNewAchievements(statsBefore.totalCatches, statsAfter.totalCatches, catchData.weight);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save catch:", error);
      Alert.alert(t.common.error, t.errors?.saveFailed || t.common.retry);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={handleCancel} hitSlop={8}>
          <ThemedText style={{ color: theme.link }}>{t.logCatch.cancel}</ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={handleSave} hitSlop={8} disabled={!canSave}>
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.link} />
          ) : (
            <ThemedText
              style={{
                color: canSave ? theme.link : theme.textSecondary,
                fontWeight: "600",
              }}
            >
              {t.logCatch.save}
            </ThemedText>
          )}
        </Pressable>
      ),
    });
  }, [navigation, theme, t, canSave, isSaving]);

  const unitLabel = settings.units === "metric" ? "kg" : "lb";
  const formattedDate = new Date(dateTime).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ScreenKeyboardAwareScrollView>
      {/* Photos Gallery */}
      <View style={styles.photosSection}>
        <View style={styles.photosSectionHeader}>
          <ThemedText type="small" style={styles.sectionLabel}>
            {t.logCatch.addPhoto} ({photoUris.length}/{MAX_PHOTOS})
          </ThemedText>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosContainer}
        >
          {/* Existing photos */}
          {photoUris.map((uri, index) => (
            <View key={`photo-${index}`} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photoThumbnail} contentFit="cover" />
              <Pressable
                onPress={() => handleRemovePhoto(index)}
                style={[styles.removePhotoButton, { backgroundColor: theme.error }]}
                hitSlop={8}
              >
                <Feather name="x" size={14} color="white" />
              </Pressable>
            </View>
          ))}
          
          {/* Add photo button */}
          {photoUris.length < MAX_PHOTOS && (
            <Pressable
              onPress={showPhotoOptions}
              style={[
                styles.addPhotoButton,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
              ]}
            >
              {isCompressingImage ? (
                <ActivityIndicator size="small" color={theme.link} />
              ) : (
                <>
                  <Feather name="plus" size={24} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                    {t.common.add || "Add"}
                  </ThemedText>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
      </View>

      <FormInput
        label={t.logCatch.species}
        required
        placeholder={t.logCatch.speciesPlaceholder}
        value={species}
        onChangeText={(text) => {
          setSpecies(text);
          if (speciesError && text.trim()) setSpeciesError(null);
        }}
        autoCapitalize="words"
        error={speciesError || undefined}
      />

      <FormInput
        label={`${t.logCatch.weight} (${unitLabel})`}
        required
        placeholder={t.logCatch.weightPlaceholder}
        value={weight}
        onChangeText={(text) => {
          setWeight(text);
          if (weightError && text.trim()) setWeightError(null);
        }}
        keyboardType="decimal-pad"
        error={weightError || undefined}
      />

      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionLabel}>
          {t.logCatch.location}
        </ThemedText>
        <Pressable
          onPress={requestLocationAndFetch}
          style={[
            styles.locationButton,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={theme.link} />
          ) : (
            <>
              <Feather name="map-pin" size={18} color={theme.link} style={styles.locationIcon} />
              <ThemedText
                type="body"
                style={{ flex: 1, color: locationName ? theme.text : theme.textSecondary }}
                numberOfLines={1}
              >
                {locationName || t.logCatch.locationAuto}
              </ThemedText>
              <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
            </>
          )}
        </Pressable>
        <FormInput
          label=""
          placeholder={t.logCatch.locationManual}
          value={locationName}
          onChangeText={setLocationName}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionLabel}>
          {t.logCatch.dateTime}
        </ThemedText>
        <View
          style={[
            styles.dateDisplay,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="calendar" size={18} color={theme.textSecondary} style={styles.dateIcon} />
          <ThemedText type="body">{formattedDate}</ThemedText>
        </View>
      </View>

      <FormInput
        label={t.logCatch.bait}
        placeholder={t.logCatch.baitPlaceholder}
        value={bait}
        onChangeText={setBait}
        autoCapitalize="sentences"
      />

      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionLabel}>
          {t.logCatch.weather}
        </ThemedText>
        <WeatherPicker value={weather} onChange={setWeather} />
      </View>

      <FormTextArea
        label={t.logCatch.notes}
        placeholder={t.logCatch.notesPlaceholder}
        value={notes}
        onChangeText={setNotes}
      />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  photosSection: {
    marginBottom: Spacing.xl,
  },
  photosSectionHeader: {
    marginBottom: Spacing.sm,
  },
  photosContainer: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  photoThumbnail: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoButton: {
    height: 200,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  locationIcon: {
    marginRight: Spacing.sm,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  dateIcon: {
    marginRight: Spacing.sm,
  },
});
