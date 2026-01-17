import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, formatWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { getStats, getAllCatches, Catch } from "@/utils/database";

interface Achievement {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  requirement: number;
  current: number;
  unlocked: boolean;
  color: string;
}

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCatches: 0,
    uniqueSpecies: 0,
    biggestWeight: 0,
    totalWeight: 0,
    daysActive: 0,
  });

  const calculateAchievements = useCallback(async () => {
    try {
      const catches = await getAllCatches();
      const statsData = await getStats();

      // Calculate unique species
      const uniqueSpecies = new Set(catches.map((c) => c.species.toLowerCase())).size;

      // Calculate total weight
      const totalWeight = catches.reduce((sum, c) => sum + c.weight, 0);

      // Calculate unique days
      const uniqueDays = new Set(
        catches.map((c) => new Date(c.dateTime).toDateString())
      ).size;

      // Biggest catch weight
      const biggestWeight = statsData.biggestCatch?.weight || 0;

      setStats({
        totalCatches: statsData.totalCatches,
        uniqueSpecies,
        biggestWeight,
        totalWeight,
        daysActive: uniqueDays,
      });

      // Define achievements
      const achievementsList: Achievement[] = [
        {
          id: "first_catch",
          icon: "fish",
          titleKey: "achievements.firstCatch",
          descriptionKey: "achievements.firstCatchDesc",
          requirement: 1,
          current: statsData.totalCatches,
          unlocked: statsData.totalCatches >= 1,
          color: "#4CAF50",
        },
        {
          id: "catch_10",
          icon: "fish",
          titleKey: "achievements.catch10",
          descriptionKey: "achievements.catch10Desc",
          requirement: 10,
          current: statsData.totalCatches,
          unlocked: statsData.totalCatches >= 10,
          color: "#2196F3",
        },
        {
          id: "catch_50",
          icon: "fish",
          titleKey: "achievements.catch50",
          descriptionKey: "achievements.catch50Desc",
          requirement: 50,
          current: statsData.totalCatches,
          unlocked: statsData.totalCatches >= 50,
          color: "#9C27B0",
        },
        {
          id: "catch_100",
          icon: "trophy",
          titleKey: "achievements.catch100",
          descriptionKey: "achievements.catch100Desc",
          requirement: 100,
          current: statsData.totalCatches,
          unlocked: statsData.totalCatches >= 100,
          color: "#FF9800",
        },
        {
          id: "species_5",
          icon: "fish",
          titleKey: "achievements.species5",
          descriptionKey: "achievements.species5Desc",
          requirement: 5,
          current: uniqueSpecies,
          unlocked: uniqueSpecies >= 5,
          color: "#00BCD4",
        },
        {
          id: "species_10",
          icon: "fish",
          titleKey: "achievements.species10",
          descriptionKey: "achievements.species10Desc",
          requirement: 10,
          current: uniqueSpecies,
          unlocked: uniqueSpecies >= 10,
          color: "#E91E63",
        },
        {
          id: "big_catch",
          icon: "scale",
          titleKey: "achievements.bigCatch",
          descriptionKey: "achievements.bigCatchDesc",
          requirement: 5,
          current: biggestWeight,
          unlocked: biggestWeight >= 5,
          color: "#FF5722",
        },
        {
          id: "monster_catch",
          icon: "scale",
          titleKey: "achievements.monsterCatch",
          descriptionKey: "achievements.monsterCatchDesc",
          requirement: 20,
          current: biggestWeight,
          unlocked: biggestWeight >= 20,
          color: "#673AB7",
        },
        {
          id: "week_streak",
          icon: "calendar",
          titleKey: "achievements.weekStreak",
          descriptionKey: "achievements.weekStreakDesc",
          requirement: 7,
          current: uniqueDays,
          unlocked: uniqueDays >= 7,
          color: "#795548",
        },
        {
          id: "month_streak",
          icon: "calendar",
          titleKey: "achievements.monthStreak",
          descriptionKey: "achievements.monthStreakDesc",
          requirement: 30,
          current: uniqueDays,
          unlocked: uniqueDays >= 30,
          color: "#607D8B",
        },
      ];

      setAchievements(achievementsList);
    } catch (error) {
      console.error("Failed to calculate achievements:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      calculateAchievements();
    }, [calculateAchievements])
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercentage = achievements.length > 0 
    ? Math.round((unlockedCount / achievements.length) * 100) 
    : 0;

  const getTranslation = (key: string): string => {
    const keys = key.split(".");
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <ThemedText>{t.common.loading}</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      {/* Progress Summary */}
      <View style={[styles.progressCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.progressHeader}>
          <MaterialCommunityIcons name="trophy" size={28} color={AppColors.proBadge} />
          <ThemedText type="h3" style={styles.progressTitle}>
            {t.achievements?.title || "Achievements"}
          </ThemedText>
        </View>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <ThemedText type="h2" style={{ color: theme.link }}>
              {unlockedCount}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.achievements?.unlocked || "Unlocked"}
            </ThemedText>
          </View>
          <View style={styles.progressStat}>
            <ThemedText type="h2">
              {achievements.length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.achievements?.total || "Total"}
            </ThemedText>
          </View>
          <View style={styles.progressStat}>
            <ThemedText type="h2" style={{ color: AppColors.proBadge }}>
              {progressPercentage}%
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.achievements?.complete || "Complete"}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%`, backgroundColor: theme.link }
            ]} 
          />
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <StatBadge
          icon="anchor"
          value={stats.totalCatches.toString()}
          label={t.achievements?.catches || "Catches"}
          theme={theme}
        />
        <StatBadge
          icon="list"
          value={stats.uniqueSpecies.toString()}
          label={t.achievements?.species || "Species"}
          theme={theme}
        />
        <StatBadge
          icon="calendar"
          value={stats.daysActive.toString()}
          label={t.achievements?.days || "Days"}
          theme={theme}
        />
      </View>

      {/* Achievements List */}
      <ThemedText type="h4" style={styles.sectionTitle}>
        {t.achievements?.allBadges || "All Badges"}
      </ThemedText>

      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          theme={theme}
          getTranslation={getTranslation}
        />
      ))}
    </ScreenScrollView>
  );
}

function StatBadge({ icon, value, label, theme }: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  theme: any;
}) {
  return (
    <View style={[styles.statBadge, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
      <Feather name={icon} size={18} color={theme.link} />
      <ThemedText type="h4" style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>{label}</ThemedText>
    </View>
  );
}

function AchievementCard({ achievement, theme, getTranslation }: {
  achievement: Achievement;
  theme: any;
  getTranslation: (key: string) => string;
}) {
  const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);

  return (
    <View
      style={[
        styles.achievementCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: achievement.unlocked ? achievement.color : theme.border,
          opacity: achievement.unlocked ? 1 : 0.7,
        },
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          {
            backgroundColor: achievement.unlocked ? achievement.color : theme.backgroundSecondary,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={achievement.icon as any}
          size={24}
          color={achievement.unlocked ? "#FFFFFF" : theme.textSecondary}
        />
      </View>
      <View style={styles.achievementContent}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {getTranslation(achievement.titleKey)}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {getTranslation(achievement.descriptionKey)}
        </ThemedText>
        {!achievement.unlocked && (
          <View style={styles.achievementProgress}>
            <View style={[styles.achievementProgressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.achievementProgressFill,
                  { width: `${progress}%`, backgroundColor: achievement.color },
                ]}
              />
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
              {achievement.current}/{achievement.requirement}
            </ThemedText>
          </View>
        )}
      </View>
      {achievement.unlocked && (
        <Feather name="check-circle" size={24} color={achievement.color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  progressTitle: {
    marginLeft: Spacing.md,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  progressStat: {
    alignItems: "center",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBadge: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  statValue: {
    marginVertical: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  achievementProgress: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  achievementProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  achievementProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
