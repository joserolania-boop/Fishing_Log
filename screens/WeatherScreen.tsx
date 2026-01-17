import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Pressable, Linking, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as Location from "expo-location";

// Using Open-Meteo API - 100% FREE, no API key required!
// https://open-meteo.com/

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
}

interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
  wind_speed: number;
  is_good_for_fishing: boolean;
}

// WMO Weather interpretation codes to icons and descriptions
const wmoCodeToWeather: Record<number, { icon: string; description: string }> = {
  0: { icon: "weather-sunny", description: "Clear sky" },
  1: { icon: "weather-sunny", description: "Mainly clear" },
  2: { icon: "weather-partly-cloudy", description: "Partly cloudy" },
  3: { icon: "weather-cloudy", description: "Overcast" },
  45: { icon: "weather-fog", description: "Fog" },
  48: { icon: "weather-fog", description: "Depositing rime fog" },
  51: { icon: "weather-rainy", description: "Light drizzle" },
  53: { icon: "weather-rainy", description: "Moderate drizzle" },
  55: { icon: "weather-rainy", description: "Dense drizzle" },
  61: { icon: "weather-rainy", description: "Slight rain" },
  63: { icon: "weather-pouring", description: "Moderate rain" },
  65: { icon: "weather-pouring", description: "Heavy rain" },
  71: { icon: "weather-snowy", description: "Slight snow" },
  73: { icon: "weather-snowy", description: "Moderate snow" },
  75: { icon: "weather-snowy-heavy", description: "Heavy snow" },
  80: { icon: "weather-rainy", description: "Slight showers" },
  81: { icon: "weather-pouring", description: "Moderate showers" },
  82: { icon: "weather-pouring", description: "Violent showers" },
  95: { icon: "weather-lightning", description: "Thunderstorm" },
  96: { icon: "weather-lightning-rainy", description: "Thunderstorm with hail" },
  99: { icon: "weather-lightning-rainy", description: "Thunderstorm with heavy hail" },
};

const getWeatherFromCode = (code: number) => {
  return wmoCodeToWeather[code] || { icon: "weather-cloudy", description: "Unknown" };
};

export default function WeatherScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [useMetric, setUseMetric] = useState(true);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(t.weather?.locationRequired || "Location permission required");
        setIsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get location name
      const addresses = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const locationName = addresses[0]?.city || addresses[0]?.region || "Unknown";
      setLocation({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        name: locationName,
      });

      // Fetch weather data from Open-Meteo (FREE, no API key needed!)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto`
      );

      if (!response.ok) {
        throw new Error("Weather API error");
      }

      const data = await response.json();
      
      // Current weather
      const currentCode = data.current.weather_code;
      const currentWeatherInfo = getWeatherFromCode(currentCode);
      
      setCurrentWeather({
        temp: Math.round(data.current.temperature_2m),
        feels_like: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        wind_speed: Math.round(data.current.wind_speed_10m),
        description: currentWeatherInfo.description,
        icon: currentWeatherInfo.icon,
        pressure: Math.round(data.current.pressure_msl),
        visibility: 10, // Open-Meteo doesn't provide visibility in free tier
      });

      // Process daily forecast
      const dailyForecast: ForecastDay[] = [];
      for (let i = 0; i < Math.min(5, data.daily.time.length); i++) {
        const dateStr = data.daily.time[i];
        const date = new Date(dateStr).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        
        const weatherCode = data.daily.weather_code[i];
        const weatherInfo = getWeatherFromCode(weatherCode);
        const windSpeed = Math.round(data.daily.wind_speed_10m_max[i]);
        
        // Fishing conditions: not too windy, no rain/storms
        const badCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]; // rain/storm codes
        const isGoodForFishing = windSpeed < 30 && !badCodes.includes(weatherCode);

        dailyForecast.push({
          date,
          temp_max: Math.round(data.daily.temperature_2m_max[i]),
          temp_min: Math.round(data.daily.temperature_2m_min[i]),
          description: weatherInfo.description,
          icon: weatherInfo.icon,
          wind_speed: windSpeed,
          is_good_for_fishing: isGoodForFishing,
        });
      }

      setForecast(dailyForecast);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(t.weather?.fetchError || "Failed to load weather data");
    } finally {
      setIsLoading(false);
    }
  };

  const tempUnit = useMetric ? "°C" : "°F";
  const speedUnit = useMetric ? "km/h" : "mph";

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.link} />
        <ThemedText style={{ marginTop: Spacing.lg }}>
          {t.weather?.loading || "Loading weather..."}
        </ThemedText>
      </View>
    );
  }

  if (error || !currentWeather) {
    return (
      <ScreenScrollView contentContainerStyle={styles.errorContainer}>
        <Feather name="cloud-off" size={64} color={theme.textSecondary} />
        <ThemedText type="h4" style={styles.errorTitle}>
          {error || t.weather?.unavailable || "Weather unavailable"}
        </ThemedText>
        <ThemedText type="small" style={[styles.errorSubtitle, { color: theme.textSecondary }]}>
          {t.weather?.checkConnection || "Check your connection and try again"}
        </ThemedText>
        <Button onPress={fetchWeatherData} style={{ marginTop: Spacing.xl }}>
          {t.common.retry}
        </Button>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      {/* Current Weather */}
      <View style={[styles.currentCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.currentHeader}>
          <View>
            <ThemedText type="h3">{location?.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </ThemedText>
          </View>
          <Pressable onPress={fetchWeatherData}>
            <Feather name="refresh-cw" size={20} color={theme.link} />
          </Pressable>
        </View>

        <View style={styles.currentMain}>
          <MaterialCommunityIcons
            name={currentWeather.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={80}
            color={theme.link}
          />
          <View style={styles.tempContainer}>
            <ThemedText style={styles.tempText}>{currentWeather.temp}{tempUnit}</ThemedText>
            <ThemedText type="body" style={{ textTransform: "capitalize" }}>
              {currentWeather.description}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <WeatherDetail
            icon="thermometer"
            label={t.weather?.feelsLike || "Feels like"}
            value={`${currentWeather.feels_like}${tempUnit}`}
            theme={theme}
          />
          <WeatherDetail
            icon="droplet"
            label={t.weather?.humidity || "Humidity"}
            value={`${currentWeather.humidity}%`}
            theme={theme}
          />
          <WeatherDetail
            icon="wind"
            label={t.weather?.wind || "Wind"}
            value={`${currentWeather.wind_speed} ${speedUnit}`}
            theme={theme}
          />
        </View>
      </View>

      {/* Fishing Conditions */}
      <View style={[styles.fishingCard, { 
        backgroundColor: theme.backgroundDefault, 
        borderColor: currentWeather.wind_speed < 20 ? "#4CAF50" : "#FF9800" 
      }]}>
        <Feather 
          name="anchor" 
          size={24} 
          color={currentWeather.wind_speed < 20 ? "#4CAF50" : "#FF9800"} 
        />
        <View style={styles.fishingContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {currentWeather.wind_speed < 20 
              ? (t.weather?.goodFishing || "Good conditions for fishing!")
              : (t.weather?.badFishing || "Challenging conditions today")}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {currentWeather.wind_speed < 20
              ? (t.weather?.goodFishingTip || "Low wind and stable pressure - fish are likely active")
              : (t.weather?.badFishingTip || "High winds may make fishing difficult")}
          </ThemedText>
        </View>
      </View>

      {/* 5-Day Forecast */}
      <ThemedText type="h4" style={styles.sectionTitle}>
        {t.weather?.forecast || "5-Day Forecast"}
      </ThemedText>

      {forecast.map((day, index) => (
        <View
          key={index}
          style={[styles.forecastRow, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <View style={styles.forecastDate}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {index === 0 ? (t.weather?.today || "Today") : day.date.split(",")[0]}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {day.date.split(",")[1]}
            </ThemedText>
          </View>
          
          <MaterialCommunityIcons
            name={day.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={32}
            color={theme.textSecondary}
          />
          
          <View style={styles.forecastTemp}>
            <ThemedText type="body">{day.temp_max}°</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {day.temp_min}°
            </ThemedText>
          </View>
          
          {day.is_good_for_fishing && (
            <View style={styles.fishingBadge}>
              <Feather name="anchor" size={14} color="#4CAF50" />
            </View>
          )}
        </View>
      ))}

      <View style={styles.attribution}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {t.weather?.poweredBy || "Powered by OpenWeather"}
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

function WeatherDetail({ icon, label, value, theme }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.detailItem}>
      <Feather name={icon} size={18} color={theme.textSecondary} />
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
        {label}
      </ThemedText>
      <ThemedText type="body" style={{ fontWeight: "600" }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  errorSubtitle: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  currentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  currentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  currentMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  tempContainer: {
    marginLeft: Spacing.lg,
  },
  tempText: {
    fontSize: 48,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailItem: {
    alignItems: "center",
  },
  fishingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    marginBottom: Spacing.xl,
  },
  fishingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  forecastDate: {
    flex: 1,
  },
  forecastTemp: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginLeft: Spacing.lg,
    minWidth: 60,
  },
  fishingBadge: {
    marginLeft: Spacing.md,
  },
  attribution: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
