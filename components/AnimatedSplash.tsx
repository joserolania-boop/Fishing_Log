import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";

import { ThemedText } from "@/components/ThemedText";
import { AppColors } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface AnimatedSplashProps {
  isReady: boolean;
  onAnimationComplete: () => void;
  children: React.ReactNode;
}

export function AnimatedSplash({
  isReady,
  onAnimationComplete,
  children,
}: AnimatedSplashProps) {
  const [showSplash, setShowSplash] = useState(true);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(1);
  const logoRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const splashOpacity = useSharedValue(1);

  const hideSplash = useCallback(() => {
    setShowSplash(false);
    onAnimationComplete();
  }, [onAnimationComplete]);

  useEffect(() => {
    if (isReady) {
      // Start the animation sequence
      SplashScreen.hideAsync();

      // Logo bounce in
      logoScale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );

      // Subtle rotation wiggle
      logoRotation.value = withSequence(
        withDelay(200, withTiming(-5, { duration: 100 })),
        withTiming(5, { duration: 100 }),
        withTiming(-3, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      // Text fade in
      textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
      textTranslateY.value = withDelay(
        300,
        withSpring(0, { damping: 15, stiffness: 120 })
      );

      // Fade out splash after animation
      splashOpacity.value = withDelay(
        1200,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, () => {
          runOnJS(hideSplash)();
        })
      );
    }
  }, [isReady]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const splashContainerStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  if (!showSplash) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {isReady && children}
      <Animated.View
        style={[
          styles.splashContainer,
          { backgroundColor: AppColors.primary },
          splashContainerStyle,
        ]}
        pointerEvents="none"
      >
        <View style={styles.content}>
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={require("../assets/images/splash-icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View style={textAnimatedStyle}>
            <ThemedText style={styles.title}>Fishing Log</ThemedText>
            <ThemedText style={styles.subtitle}>Track your catches</ThemedText>
          </Animated.View>
        </View>

        {/* Animated wave decoration at bottom */}
        <View style={styles.waveContainer}>
          <View style={[styles.wave, styles.wave1]} />
          <View style={[styles.wave, styles.wave2]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 24,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: "hidden",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: -50,
    right: -50,
    height: 80,
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
  },
  wave1: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    bottom: -20,
  },
  wave2: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: -40,
  },
});
