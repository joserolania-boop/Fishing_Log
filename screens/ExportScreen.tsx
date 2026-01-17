import React, { useState, useCallback } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAllCatches } from "@/utils/database";
import { exportData, shareFile, ExportFormat, DateRangeType } from "@/utils/export";

export default function ExportScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [dateRange, setDateRange] = useState<DateRangeType>("all");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [hasCatches, setHasCatches] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUri, setExportedUri] = useState<string | null>(null);

  const checkCatches = useCallback(async () => {
    try {
      const catches = await getAllCatches();
      setHasCatches(catches.length > 0);
    } catch (error) {
      console.error("Failed to check catches:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkCatches();
      setExportedUri(null);
    }, [checkCatches])
  );

  const dateRangeOptions = [
    { value: "all", label: t.export.allTime },
    { value: "month", label: t.export.thisMonth },
    { value: "year", label: t.export.thisYear },
  ];

  const formatOptions = [
    { value: "csv", label: t.export.csv },
    { value: "json", label: t.export.json },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportData(format, dateRange);
      if (result) {
        setExportedUri(result.uri);
        Alert.alert(t.export.success, result.filename);
      } else {
        Alert.alert(t.export.noData);
      }
    } catch (error) {
      console.error("Failed to export:", error);
      Alert.alert(t.common.error, t.common.retry);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!exportedUri) {
      await handleExport();
      return;
    }

    try {
      const success = await shareFile(exportedUri);
      if (!success) {
        Alert.alert(t.common.error, "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Failed to share:", error);
      Alert.alert(t.common.error, t.common.retry);
    }
  };

  if (!hasCatches) {
    return (
      <ThemedView
        style={[
          styles.container,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="download"
            title={t.export.noData}
            subtitle={t.catches.emptySubtitle}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.export.dateRange}
          </ThemedText>
          <SegmentedControl
            options={dateRangeOptions}
            value={dateRange}
            onChange={(v) => {
              setDateRange(v as DateRangeType);
              setExportedUri(null);
            }}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {t.export.format}
          </ThemedText>
          <SegmentedControl
            options={formatOptions}
            value={format}
            onChange={(v) => {
              setFormat(v as ExportFormat);
              setExportedUri(null);
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button onPress={handleExport} disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              t.export.exportButton
            )}
          </Button>
          <View style={styles.buttonSpacer} />
          <Button
            onPress={handleShare}
            style={{ backgroundColor: theme.backgroundSecondary }}
            disabled={isExporting}
          >
            <ThemedText style={{ color: theme.text, fontWeight: "600" }}>
              {t.export.shareButton}
            </ThemedText>
          </Button>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  buttonSpacer: {
    height: Spacing.md,
  },
});
