import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import MapScreen from "@/screens/MapScreen";
import WeatherScreen from "@/screens/WeatherScreen";
import AchievementsScreen from "@/screens/AchievementsScreen";
import SpeciesGuideScreen from "@/screens/SpeciesGuideScreen";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Map: undefined;
  Weather: undefined;
  Achievements: undefined;
  SpeciesGuide: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t.profile.title,
        }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          title: t.map?.title || "Fishing Map",
        }}
      />
      <Stack.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          title: t.weather?.title || "Weather",
        }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          title: t.achievements?.title || "Achievements",
        }}
      />
      <Stack.Screen
        name="SpeciesGuide"
        component={SpeciesGuideScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          title: t.species?.title || "Species Guide",
        }}
      />
    </Stack.Navigator>
  );
}
