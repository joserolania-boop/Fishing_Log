import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { AdBanner } from "@/components/AdBanner";
import { ProUpgradeCard } from "@/components/ProUpgradeCard";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, formatWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getStats, Catch } from "@/utils/database";

interface Stats {
  totalCatches: number;
  biggestCatch: Catch | null;
  topSpecies: { species: string; count: number } | null;
}

export default function StatsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <ThemedText>{t.common.loading}</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  if (!stats || stats.totalCatches === 0) {
    return (
      <ScreenScrollView contentContainerStyle={styles.emptyContainer}>
        <EmptyState
          icon="bar-chart-2"
          title={t.stats.noData}
          subtitle={t.catches.emptySubtitle}
        />
      </ScreenScrollView>
    );
  }

  const biggestWeight = stats.biggestCatch
    ? formatWeight(stats.biggestCatch.weight, settings.units)
    : t.stats.noData;

  return (
    <ScreenScrollView>
      <View style={styles.summaryCards}>
        <StatCard
          icon="anchor"
          label={t.stats.totalCatches}
          value={stats.totalCatches.toString()}
          theme={theme}
        />
        <StatCard
          icon="award"
          label={t.stats.biggestCatch}
          value={biggestWeight}
          subtitle={stats.biggestCatch?.species}
          theme={theme}
        />
        <StatCard
          icon="trending-up"
          label={t.stats.topSpecies}
          value={stats.topSpecies?.species || t.stats.noData}
          subtitle={stats.topSpecies ? `${stats.topSpecies.count} catches` : undefined}
          theme={theme}
        />
      </View>

      <AdBanner />

      <View style={styles.chartSection}>
        <ThemedText type="h4" style={styles.chartTitle}>
          {t.stats.catchesOverTime}
        </ThemedText>
        <View
          style={[
            styles.chartPlaceholder,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="trending-up" size={48} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Chart coming soon
          </ThemedText>
        </View>
      </View>

      <View style={styles.chartSection}>
        <ThemedText type="h4" style={styles.chartTitle}>
          {t.stats.speciesDistribution}
        </ThemedText>
        <View
          style={[
            styles.chartPlaceholder,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="pie-chart" size={48} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Chart coming soon
          </ThemedText>
        </View>
      </View>

      <ProUpgradeCard
        title={t.stats.proFeature}
        description={t.stats.proDescription}
      />
    </ScreenScrollView>
  );
}

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  subtitle?: string;
  theme: any;
}

function StatCard({ icon, label, value, subtitle, theme }: StatCardProps) {
  return (
    <View
      style={[
        statStyles.card,
        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
      ]}
    >
      <View style={[statStyles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={20} color={theme.link} />
      </View>
      <ThemedText type="small" style={[statStyles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <ThemedText type="h3" numberOfLines={1}>
        {value}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 100,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
  },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  summaryCards: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  chartSection: {
    marginTop: Spacing.xl,
  },
  chartTitle: {
    marginBottom: Spacing.md,
  },
  chartPlaceholder: {
    height: 180,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
