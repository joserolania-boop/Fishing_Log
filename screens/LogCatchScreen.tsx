import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
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
import { Spacing, BorderRadius } from "@/constants/theme";
import { addCatch, updateCatch, NewCatch, Catch } from "@/utils/database";
import { CatchesStackParamList } from "@/navigation/CatchesStackNavigator";

type NavigationProp = NativeStackNavigationProp<CatchesStackParamList, "LogCatch">;
type RouteType = RouteProp<CatchesStackParamList, "LogCatch">;

export default function LogCatchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();

  const editCatch = route.params?.editCatch;
  const isEditing = !!editCatch;

  const [species, setSpecies] = useState(editCatch?.species || "");
  const [weight, setWeight] = useState(editCatch?.weight?.toString() || "");
  const [photoUri, setPhotoUri] = useState<string | null>(editCatch?.photoUri || null);
  const [latitude, setLatitude] = useState<number | null>(editCatch?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(editCatch?.longitude || null);
  const [locationName, setLocationName] = useState(editCatch?.locationName || "");
  const [dateTime, setDateTime] = useState(editCatch?.dateTime || new Date().toISOString());
  const [bait, setBait] = useState(editCatch?.bait || "");
  const [weather, setWeather] = useState<"sunny" | "cloudy" | "rainy" | "windy" | null>(
    editCatch?.weather || null
  );
  const [notes, setNotes] = useState(editCatch?.notes || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  const canSave = species.trim() !== "" && weight.trim() !== "" && !isSaving;

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
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
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
    } catch (error) {
      console.error("Failed to get location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
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
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleChoosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(t.logCatch.addPhoto, "", [
      { text: t.logCatch.takePhoto, onPress: handleTakePhoto },
      { text: t.logCatch.choosePhoto, onPress: handleChoosePhoto },
      { text: t.common.cancel, style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      const catchData: NewCatch = {
        species: species.trim(),
        weight: parseWeight(weight, settings.units),
        photoUri,
        latitude,
        longitude,
        locationName: locationName.trim() || null,
        dateTime,
        bait: bait.trim() || null,
        weather,
        notes: notes.trim() || null,
      };

      if (isEditing && editCatch) {
        await updateCatch(editCatch.id, catchData);
      } else {
        await addCatch(catchData);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save catch:", error);
      Alert.alert(t.common.error, t.common.retry);
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
      <Pressable
        onPress={showPhotoOptions}
        style={[
          styles.photoButton,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        ]}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Feather name="camera" size={40} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              {t.logCatch.addPhoto}
            </ThemedText>
          </View>
        )}
      </Pressable>

      <FormInput
        label={t.logCatch.species}
        required
        placeholder={t.logCatch.speciesPlaceholder}
        value={species}
        onChangeText={setSpecies}
        autoCapitalize="words"
      />

      <FormInput
        label={`${t.logCatch.weight} (${unitLabel})`}
        required
        placeholder={t.logCatch.weightPlaceholder}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
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
