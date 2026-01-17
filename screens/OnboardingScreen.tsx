import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  titleKey: string;
  descriptionKey: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "anchor",
    titleKey: "onboarding.slide1Title",
    descriptionKey: "onboarding.slide1Desc",
    color: AppColors.primary,
  },
  {
    id: "2",
    icon: "camera",
    titleKey: "onboarding.slide2Title",
    descriptionKey: "onboarding.slide2Desc",
    color: AppColors.secondary,
  },
  {
    id: "3",
    icon: "map-pin",
    titleKey: "onboarding.slide3Title",
    descriptionKey: "onboarding.slide3Desc",
    color: AppColors.accent,
  },
  {
    id: "4",
    icon: "bar-chart-2",
    titleKey: "onboarding.slide4Title",
    descriptionKey: "onboarding.slide4Desc",
    color: "#9C27B0",
  },
  {
    id: "5",
    icon: "share-2",
    titleKey: "onboarding.slide5Title",
    descriptionKey: "onboarding.slide5Desc",
    color: "#00BCD4",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      onComplete();
    } catch (error) {
      console.error("Failed to save onboarding status:", error);
      onComplete();
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      // Use scrollToOffset for better web compatibility
      flatListRef.current?.scrollToOffset({ 
        offset: nextIndex * screenWidth, 
        animated: true 
      });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const getTranslation = (key: string): string => {
    const keys = key.split(".");
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={styles.slide}>
      <View style={[styles.iconCircle, { backgroundColor: item.color + "20" }]}>
        <View style={[styles.iconInner, { backgroundColor: item.color }]}>
          <Feather name={item.icon} size={64} color="#FFFFFF" />
        </View>
      </View>
      <ThemedText type="h1" style={styles.title}>
        {getTranslation(item.titleKey)}
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.description, { color: theme.textSecondary }]}
      >
        {getTranslation(item.descriptionKey)}
      </ThemedText>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? theme.link : theme.border,
                width: isActive ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        {!isLastSlide && (
          <Pressable onPress={handleSkip} hitSlop={8}>
            <ThemedText style={{ color: theme.textSecondary }}>
              {t.onboarding?.skip || "Skip"}
            </ThemedText>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {renderDots()}

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Button onPress={handleNext}>
          {isLastSlide
            ? t.onboarding?.getStarted || "Get Started"
            : t.onboarding?.next || "Next"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  slide: {
    width: screenWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl * 2,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["4xl"],
  },
  iconInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
});
