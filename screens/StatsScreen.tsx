import React, { useState, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { AdBanner } from "@/components/AdBanner";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings, formatWeight } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { getStats, getAllCatches, getWeekdayStats, Catch } from "@/utils/database";

interface Stats {
  totalCatches: number;
  biggestCatch: Catch | null;
  topSpecies: { species: string; count: number } | null;
}

interface ChartData {
  monthlyData: { month: string; count: number }[];
  speciesData: { species: string; count: number; color: string }[];
  weekdayData: { day: string; count: number }[];
}

const CHART_COLORS = [
  AppColors.primary,
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
];

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ monthlyData: [], speciesData: [], weekdayData: [] });
  const [isLoading, setIsLoading] = useState(true);

  const processChartData = (catches: Catch[]): ChartData => {
    // Process monthly data
    const monthCounts: Record<string, number> = {};
    const speciesCounts: Record<string, number> = {};
    
    catches.forEach((c) => {
      const date = new Date(c.dateTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      
      const species = c.species.toLowerCase().trim();
      speciesCounts[species] = (speciesCounts[species] || 0) + 1;
    });

    // Get last 6 months
    const monthlyData: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthlyData.push({
        month: monthNames[d.getMonth()],
        count: monthCounts[key] || 0,
      });
    }

    // Get top 5 species
    const sortedSpecies = Object.entries(speciesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([species, count], index) => ({
        species: species.charAt(0).toUpperCase() + species.slice(1),
        count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

    return { monthlyData, speciesData: sortedSpecies, weekdayData: [] };
  };

  const loadStats = useCallback(async () => {
    try {
      const [data, catches, weekdayData] = await Promise.all([
        getStats(),
        getAllCatches(),
        getWeekdayStats(),
      ]);
      setStats(data);
      const processed = processChartData(catches);
      setChartData({ ...processed, weekdayData });
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
            styles.chartContainer,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <BarChart data={chartData.monthlyData} theme={theme} />
        </View>
      </View>

      <View style={styles.chartSection}>
        <ThemedText type="h4" style={styles.chartTitle}>
          {t.stats.speciesDistribution}
        </ThemedText>
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <PieChartSimple data={chartData.speciesData} theme={theme} />
        </View>
      </View>

      <View style={styles.chartSection}>
        <ThemedText type="h4" style={styles.chartTitle}>
          {t.stats.bestDays || "Best Fishing Days"}
        </ThemedText>
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <WeekdayChart data={chartData.weekdayData} theme={theme} />
        </View>
      </View>
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

// Simple Bar Chart component (no external library needed)
interface BarChartProps {
  data: { month: string; count: number }[];
  theme: any;
}

function BarChart({ data, theme }: BarChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barWidth = (screenWidth - Spacing.lg * 4 - Spacing.sm * 5) / 6;

  if (data.every(d => d.count === 0)) {
    return (
      <View style={chartStyles.emptyChart}>
        <Feather name="trending-up" size={32} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          No data yet
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={chartStyles.barChartContainer}>
      <View style={chartStyles.barsRow}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * 120;
          return (
            <View key={index} style={chartStyles.barColumn}>
              <View style={[chartStyles.barWrapper, { height: 120 }]}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      width: barWidth,
                      backgroundColor: AppColors.primary,
                    },
                  ]}
                />
                {item.count > 0 && (
                  <ThemedText type="small" style={chartStyles.barValue}>
                    {item.count}
                  </ThemedText>
                )}
              </View>
              <ThemedText type="small" style={[chartStyles.barLabel, { color: theme.textSecondary }]}>
                {item.month}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Simple Pie Chart component (horizontal legend style)
interface PieChartSimpleProps {
  data: { species: string; count: number; color: string }[];
  theme: any;
}

function PieChartSimple({ data, theme }: PieChartSimpleProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0 || total === 0) {
    return (
      <View style={chartStyles.emptyChart}>
        <Feather name="pie-chart" size={32} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          No data yet
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={chartStyles.pieChartContainer}>
      {/* Progress bar style distribution */}
      <View style={[chartStyles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          return (
            <View
              key={index}
              style={[
                chartStyles.progressSegment,
                { width: `${percentage}%`, backgroundColor: item.color },
              ]}
            />
          );
        })}
      </View>
      
      {/* Legend */}
      <View style={chartStyles.legendContainer}>
        {data.map((item, index) => {
          const percentage = ((item.count / total) * 100).toFixed(0);
          return (
            <View key={index} style={chartStyles.legendItem}>
              <View style={[chartStyles.legendDot, { backgroundColor: item.color }]} />
              <ThemedText type="small" style={{ flex: 1 }} numberOfLines={1}>
                {item.species}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {percentage}%
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Weekday chart component
interface WeekdayChartProps {
  data: { day: string; count: number }[];
  theme: any;
}

function WeekdayChart({ data, theme }: WeekdayChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  
  if (total === 0) {
    return (
      <View style={chartStyles.emptyChart}>
        <Feather name="calendar" size={32} color={theme.textSecondary} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          No data yet
        </ThemedText>
      </View>
    );
  }

  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bestDay = data.reduce((best, d) => d.count > best.count ? d : best, data[0]);

  return (
    <View style={chartStyles.pieChartContainer}>
      <View style={chartStyles.weekdayGrid}>
        {data.map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          const isBest = item.day === bestDay.day && item.count > 0;
          return (
            <View key={index} style={chartStyles.weekdayItem}>
              <View style={chartStyles.weekdayBarContainer}>
                <View
                  style={[
                    chartStyles.weekdayBar,
                    {
                      height: `${Math.max(percentage, 5)}%`,
                      backgroundColor: isBest ? AppColors.success : AppColors.primary,
                    },
                  ]}
                />
              </View>
              <ThemedText 
                type="small" 
                style={[
                  chartStyles.weekdayLabel, 
                  { color: isBest ? AppColors.success : theme.textSecondary }
                ]}
              >
                {shortDays[index]}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.count}
              </ThemedText>
            </View>
          );
        })}
      </View>
      {bestDay.count > 0 && (
        <View style={[chartStyles.bestDayBadge, { backgroundColor: AppColors.success + "20" }]}>
          <Feather name="award" size={14} color={AppColors.success} />
          <ThemedText type="small" style={{ color: AppColors.success, marginLeft: Spacing.xs }}>
            Best day: {bestDay.day}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  emptyChart: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  barChartContainer: {
    paddingVertical: Spacing.md,
  },
  barsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  barColumn: {
    alignItems: "center",
  },
  barWrapper: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    borderRadius: 4,
  },
  barValue: {
    position: "absolute",
    top: -18,
    fontSize: 10,
  },
  barLabel: {
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  pieChartContainer: {
    paddingVertical: Spacing.md,
  },
  progressBar: {
    height: 24,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  progressSegment: {
    height: "100%",
  },
  legendContainer: {
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  weekdayGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 120,
  },
  weekdayItem: {
    alignItems: "center",
    flex: 1,
  },
  weekdayBarContainer: {
    flex: 1,
    width: "60%",
    justifyContent: "flex-end",
    marginBottom: Spacing.xs,
  },
  weekdayBar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  weekdayLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  bestDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
});

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
  chartContainer: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
  },
});
