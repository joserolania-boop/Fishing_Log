import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CatchesScreen from "@/screens/CatchesScreen";
import LogCatchScreen from "@/screens/LogCatchScreen";
import CatchDetailScreen from "@/screens/CatchDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Catch } from "@/utils/database";

export type CatchesStackParamList = {
  Catches: undefined;
  LogCatch: { editCatch?: Catch } | undefined;
  CatchDetail: { catchId: number };
};

const Stack = createNativeStackNavigator<CatchesStackParamList>();

export default function CatchesStackNavigator() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Catches"
        component={CatchesScreen}
        options={{
          headerTitle: () => <HeaderTitle title={t.appName} />,
        }}
      />
      <Stack.Screen
        name="LogCatch"
        component={LogCatchScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          presentation: "modal",
          title: t.logCatch.title,
        }}
      />
      <Stack.Screen
        name="CatchDetail"
        component={CatchDetailScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: false }),
          presentation: "modal",
          title: "",
        }}
      />
    </Stack.Navigator>
  );
}
