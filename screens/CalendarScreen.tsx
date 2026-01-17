import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CatchCard } from "@/components/CatchCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAllCatches, Catch } from "@/utils/database";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DAY_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - 6 * 4) / 7;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Calendar">;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const [catches, setCatches] = useState<Catch[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useFocusEffect(
    useCallback(() => {
      loadCatches();
    }, [])
  );

  const loadCatches = async () => {
    const data = await getAllCatches();
    setCatches(data);
  };

  const handleCatchPress = (catchId: number) => {
    // Navigate to catch detail - for now just log, we can add full navigation later
    console.log("Navigate to catch:", catchId);
  };

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  // Get catches for a specific date
  const getCatchesForDate = (dateStr: string): Catch[] => {
    return catches.filter(c => c.dateTime.split("T")[0] === dateStr);
  };

  // Get all days in the current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    
    const days: { date: string | null; day: number | null }[] = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startWeekday; i++) {
      days.push({ date: null, day: null });
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ date: dateStr, day: i });
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    hapticFeedback();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    hapticFeedback();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const selectDate = (dateStr: string) => {
    hapticFeedback();
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  const days = getDaysInMonth();
  const selectedCatches = selectedDate ? getCatchesForDate(selectedDate) : [];
  const monthName = MONTHS[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();

  return (
    <ScreenScrollView>
      {/* Month Navigation */}
      <ThemedView style={[styles.monthNav, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable onPress={goToPreviousMonth} hitSlop={8}>
          <Feather name="chevron-left" size={28} color={theme.link} />
        </Pressable>
        <ThemedText style={styles.monthTitle}>
          {monthName} {year}
        </ThemedText>
        <Pressable onPress={goToNextMonth} hitSlop={8}>
          <Feather name="chevron-right" size={28} color={theme.link} />
        </Pressable>
      </ThemedView>

      {/* Weekday Headers */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={[styles.weekdayCell, { width: DAY_SIZE }]}>
            <ThemedText style={[styles.weekdayText, { color: theme.textSecondary }]}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((item, index) => {
          if (!item.date) {
            return <View key={`empty-${index}`} style={[styles.dayCell, { width: DAY_SIZE, height: DAY_SIZE }]} />;
          }
          
          const catchCount = getCatchesForDate(item.date).length;
          const isSelected = item.date === selectedDate;
          const isToday = item.date === new Date().toISOString().split("T")[0];
          
          return (
            <Pressable
              key={item.date}
              style={[
                styles.dayCell,
                { width: DAY_SIZE, height: DAY_SIZE },
                isSelected && { backgroundColor: theme.link },
                isToday && !isSelected && { borderColor: theme.link, borderWidth: 2 },
              ]}
              onPress={() => selectDate(item.date!)}
            >
              <ThemedText
                style={[
                  styles.dayText,
                  isSelected && { color: "#fff" },
                ]}
              >
                {item.day}
              </ThemedText>
              {catchCount > 0 && (
                <View
                  style={[
                    styles.catchDot,
                    { backgroundColor: isSelected ? "#fff" : theme.link },
                  ]}
                >
                  {catchCount > 1 && (
                    <ThemedText style={[styles.catchCount, { color: isSelected ? theme.link : "#fff" }]}>
                      {catchCount}
                    </ThemedText>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected Date Catches */}
      {selectedDate && (
        <View style={styles.selectedSection}>
          <ThemedText style={styles.sectionTitle}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
          
          {selectedCatches.length === 0 ? (
            <ThemedView style={[styles.emptyDay, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="calendar" size={32} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                {t.calendar?.noCatches || "No catches on this day"}
              </ThemedText>
            </ThemedView>
          ) : (
            selectedCatches.map((item) => (
              <CatchCard 
                key={item.id} 
                catchItem={item}
                onPress={() => handleCatchPress(item.id)}
              />
            ))
          )}
        </View>
      )}

      {/* Monthly Summary */}
      <ThemedView style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.summaryTitle}>
          {t.calendar?.monthlySummary || "Monthly Summary"}
        </ThemedText>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <ThemedText style={[styles.summaryValue, { color: theme.link }]}>
              {catches.filter(c => {
                const d = new Date(c.dateTime);
                return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
              }).length}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {t.stats.totalCatches}
            </ThemedText>
          </View>
          <View style={styles.summaryStat}>
            <ThemedText style={[styles.summaryValue, { color: theme.link }]}>
              {new Set(days.filter(d => d.date && getCatchesForDate(d.date).length > 0).map(d => d.date)).size}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {t.calendar?.daysWithCatches || "Days fishing"}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xs,
  },
  weekdayCell: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    borderRadius: BorderRadius.md,
  },
  dayText: {
    fontSize: 16,
  },
  catchDot: {
    position: "absolute",
    bottom: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  catchCount: {
    fontSize: 10,
    fontWeight: "bold",
  },
  selectedSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  emptyDay: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
});
