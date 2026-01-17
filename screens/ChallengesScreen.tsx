import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Share, Platform, Alert } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/hooks/useSettings";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { getAllCatches, getStats } from "@/utils/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FRIENDS_KEY = "@fishing_log_friends";
const CHALLENGES_KEY = "@fishing_log_challenges";

interface FriendStats {
  id: string;
  name: string;
  avatar: string;
  totalCatches: number;
  biggestWeight: number;
  uniqueSpecies: number;
  importedAt: string;
}

interface Challenge {
  id: string;
  type: "catches" | "weight" | "species" | "daily";
  target: number;
  current: number;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export default function ChallengesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { settings } = useSettings();
  
  const [myStats, setMyStats] = useState({
    totalCatches: 0,
    biggestWeight: 0,
    uniqueSpecies: 0,
  });
  const [friends, setFriends] = useState<FriendStats[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "challenges">("leaderboard");
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load my stats
      const catches = await getAllCatches();
      const stats = await getStats();
      const uniqueSpecies = new Set(catches.map((c) => c.species.toLowerCase())).size;
      
      setMyStats({
        totalCatches: stats.totalCatches || 0,
        biggestWeight: stats.biggestCatch?.weight || 0,
        uniqueSpecies,
      });

      // Load friends
      const storedFriends = await AsyncStorage.getItem(FRIENDS_KEY);
      if (storedFriends) {
        setFriends(JSON.parse(storedFriends));
      }

      // Load or generate weekly challenges
      await loadOrGenerateChallenges(stats.totalCatches || 0, uniqueSpecies);
    } catch (error) {
      console.error("Failed to load challenges data:", error);
    }
  };

  const loadOrGenerateChallenges = async (totalCatches: number, uniqueSpecies: number) => {
    try {
      const stored = await AsyncStorage.getItem(CHALLENGES_KEY);
      const now = new Date();
      const weekStart = getWeekStart(now);
      
      if (stored) {
        const challenges: Challenge[] = JSON.parse(stored);
        const firstChallenge = challenges[0];
        
        // Check if challenges are from this week
        if (firstChallenge && new Date(firstChallenge.startDate) >= weekStart) {
          // Update current progress
          const updated = challenges.map(c => ({
            ...c,
            current: c.type === "catches" ? totalCatches : 
                     c.type === "species" ? uniqueSpecies : c.current,
            completed: c.type === "catches" ? totalCatches >= c.target :
                       c.type === "species" ? uniqueSpecies >= c.target : c.completed,
          }));
          setWeeklyChallenges(updated);
          await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
          return;
        }
      }

      // Generate new weekly challenges
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const newChallenges: Challenge[] = [
        {
          id: "weekly_catches",
          type: "catches",
          target: Math.max(5, Math.ceil((totalCatches + 5) / 5) * 5),
          current: totalCatches,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          completed: false,
        },
        {
          id: "weekly_species",
          type: "species",
          target: Math.max(3, uniqueSpecies + 2),
          current: uniqueSpecies,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          completed: false,
        },
        {
          id: "weekly_big",
          type: "weight",
          target: 5,
          current: 0,
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          completed: false,
        },
      ];

      setWeeklyChallenges(newChallenges);
      await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(newChallenges));
    } catch (error) {
      console.error("Failed to load challenges:", error);
    }
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const generateShareCode = async () => {
    const myData: FriendStats = {
      id: `user_${Date.now()}`,
      name: settings.displayName || "Angler",
      avatar: settings.avatar || "fish",
      totalCatches: myStats.totalCatches,
      biggestWeight: myStats.biggestWeight,
      uniqueSpecies: myStats.uniqueSpecies,
      importedAt: new Date().toISOString(),
    };

    const code = btoa(JSON.stringify(myData));
    
    try {
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(code);
        alert(t.challenges?.codeCopied || "Code copied to clipboard! Share it with your friends.");
      } else {
        await Share.share({
          message: `${t.challenges?.shareMessage || "Join my fishing challenge!"}\n\nCode: ${code}`,
          title: "FishLogger Challenge",
        });
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const importFriendCode = async () => {
    const promptMessage = t.challenges?.enterCode || "Enter your friend's code:";
    
    if (Platform.OS === "web") {
      const code = window.prompt(promptMessage);
      if (code) {
        await processImportCode(code);
      }
    } else {
      Alert.prompt(
        t.challenges?.importFriend || "Import Friend",
        promptMessage,
        async (code) => {
          if (code) {
            await processImportCode(code);
          }
        }
      );
    }
  };

  const processImportCode = async (code: string) => {
    try {
      const decoded = JSON.parse(atob(code.trim()));
      
      if (!decoded.name || decoded.totalCatches === undefined) {
        throw new Error("Invalid code");
      }

      const newFriend: FriendStats = {
        ...decoded,
        id: decoded.id || `friend_${Date.now()}`,
        importedAt: new Date().toISOString(),
      };

      // Check if already exists
      const existingIndex = friends.findIndex(f => f.name === newFriend.name);
      let updatedFriends: FriendStats[];
      
      if (existingIndex >= 0) {
        updatedFriends = [...friends];
        updatedFriends[existingIndex] = newFriend;
      } else {
        updatedFriends = [...friends, newFriend];
      }

      setFriends(updatedFriends);
      await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(updatedFriends));

      const successMsg = t.challenges?.friendAdded || "Friend added to leaderboard!";
      if (Platform.OS === "web") {
        alert(successMsg);
      } else {
        Alert.alert("✅", successMsg);
      }
    } catch (error) {
      const errorMsg = t.challenges?.invalidCode || "Invalid code. Please try again.";
      if (Platform.OS === "web") {
        alert(errorMsg);
      } else {
        Alert.alert(t.common?.error || "Error", errorMsg);
      }
    }
  };

  const removeFriend = async (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(updatedFriends));
  };

  // Combine my stats with friends for leaderboard
  const leaderboard = [
    {
      id: "me",
      name: settings.displayName || "You",
      avatar: settings.avatar || "fish",
      totalCatches: myStats.totalCatches,
      biggestWeight: myStats.biggestWeight,
      uniqueSpecies: myStats.uniqueSpecies,
      isMe: true,
    },
    ...friends.map(f => ({ ...f, isMe: false })),
  ].sort((a, b) => b.totalCatches - a.totalCatches);

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "catches": return "fish";
      case "weight": return "scale";
      case "species": return "fishbowl";
      case "daily": return "calendar";
      default: return "trophy";
    }
  };

  const getChallengeTitle = (challenge: Challenge) => {
    switch (challenge.type) {
      case "catches":
        return t.challenges?.catchTarget?.replace("{n}", String(challenge.target)) || 
               `Catch ${challenge.target} fish`;
      case "species":
        return t.challenges?.speciesTarget?.replace("{n}", String(challenge.target)) || 
               `Catch ${challenge.target} different species`;
      case "weight":
        return t.challenges?.weightTarget?.replace("{n}", String(challenge.target)) || 
               `Catch a fish over ${challenge.target}kg`;
      default:
        return "Complete challenge";
    }
  };

  const getDaysRemaining = () => {
    if (weeklyChallenges.length === 0) return 0;
    const endDate = new Date(weeklyChallenges[0].endDate);
    const now = new Date();
    const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "leaderboard" && { backgroundColor: theme.backgroundDefault },
            ]}
            onPress={() => setActiveTab("leaderboard")}
          >
            <Feather 
              name="award" 
              size={18} 
              color={activeTab === "leaderboard" ? theme.link : theme.textSecondary} 
            />
            <ThemedText 
              style={[
                styles.tabText, 
                { color: activeTab === "leaderboard" ? theme.link : theme.textSecondary }
              ]}
            >
              {t.challenges?.leaderboard || "Leaderboard"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              activeTab === "challenges" && { backgroundColor: theme.backgroundDefault },
            ]}
            onPress={() => setActiveTab("challenges")}
          >
            <Feather 
              name="target" 
              size={18} 
              color={activeTab === "challenges" ? theme.link : theme.textSecondary} 
            />
            <ThemedText 
              style={[
                styles.tabText, 
                { color: activeTab === "challenges" ? theme.link : theme.textSecondary }
              ]}
            >
              {t.challenges?.weeklyTitle || "Weekly Challenges"}
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "leaderboard" ? (
          <>
            {/* Share/Import Buttons */}
            <View style={styles.buttonRow}>
              <Button
                onPress={generateShareCode}
                style={[styles.actionButton, { backgroundColor: AppColors.primary }]}
              >
                <View style={styles.buttonContent}>
                  <Feather name="share-2" size={16} color="#FFF" />
                  <ThemedText style={styles.buttonText}>
                    {t.challenges?.shareStats || "Share My Stats"}
                  </ThemedText>
                </View>
              </Button>
              <Button
                onPress={importFriendCode}
                style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border }]}
              >
                <View style={styles.buttonContent}>
                  <Feather name="user-plus" size={16} color={theme.text} />
                  <ThemedText style={[styles.buttonText, { color: theme.text }]}>
                    {t.challenges?.addFriend || "Add Friend"}
                  </ThemedText>
                </View>
              </Button>
            </View>

            {/* Leaderboard */}
            <ThemedText type="h4" style={styles.sectionTitle}>
              {t.challenges?.rankings || "Rankings"} 🏆
            </ThemedText>

            {leaderboard.map((player, index) => (
              <LeaderboardRow
                key={player.id}
                rank={index + 1}
                player={player}
                theme={theme}
                onRemove={player.isMe ? undefined : () => removeFriend(player.id)}
              />
            ))}

            {friends.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="users" size={40} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
                  {t.challenges?.noFriends || "No friends yet!\nShare your code and import your friends' codes to compete."}
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Weekly Challenges */}
            <View style={[styles.weekHeader, { backgroundColor: theme.backgroundSecondary }]}>
              <View>
                <ThemedText type="h4">{t.challenges?.thisWeek || "This Week's Challenges"}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {getDaysRemaining()} {t.challenges?.daysLeft || "days remaining"}
                </ThemedText>
              </View>
              <View style={[styles.weekBadge, { backgroundColor: AppColors.primary }]}>
                <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>
                  {weeklyChallenges.filter(c => c.completed).length}/{weeklyChallenges.length}
                </ThemedText>
              </View>
            </View>

            {weeklyChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                title={getChallengeTitle(challenge)}
                icon={getChallengeIcon(challenge.type)}
                theme={theme}
              />
            ))}

            {/* Tips */}
            <View style={[styles.tipsCard, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="info" size={20} color={theme.link} />
              <ThemedText type="small" style={{ color: theme.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
                {t.challenges?.tipText || "Complete challenges to improve your fishing skills! New challenges every Monday."}
              </ThemedText>
            </View>
          </>
        )}
      </ScreenScrollView>
    </ThemedView>
  );
}

function LeaderboardRow({ rank, player, theme, onRemove }: {
  rank: number;
  player: any;
  theme: any;
  onRemove?: () => void;
}) {
  const getRankStyle = () => {
    if (rank === 1) return { backgroundColor: "#FFD700" };
    if (rank === 2) return { backgroundColor: "#C0C0C0" };
    if (rank === 3) return { backgroundColor: "#CD7F32" };
    return { backgroundColor: theme.backgroundSecondary };
  };

  const getRankEmoji = () => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <View
      style={[
        styles.leaderboardRow,
        {
          backgroundColor: player.isMe ? theme.link + "20" : theme.backgroundDefault,
          borderColor: player.isMe ? theme.link : theme.border,
        },
      ]}
    >
      <View style={[styles.rankBadge, getRankStyle()]}>
        <ThemedText style={styles.rankText}>{getRankEmoji()}</ThemedText>
      </View>
      <View style={styles.playerInfo}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {player.name} {player.isMe ? "⭐" : ""}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {player.totalCatches} catches • {player.uniqueSpecies} species • {player.biggestWeight.toFixed(1)}kg best
        </ThemedText>
      </View>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Feather name="x" size={18} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

function ChallengeCard({ challenge, title, icon, theme }: {
  challenge: Challenge;
  title: string;
  icon: string;
  theme: any;
}) {
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);

  return (
    <View
      style={[
        styles.challengeCard,
        {
          backgroundColor: challenge.completed ? AppColors.success + "20" : theme.backgroundDefault,
          borderColor: challenge.completed ? AppColors.success : theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.challengeIcon,
          { backgroundColor: challenge.completed ? AppColors.success : theme.backgroundSecondary },
        ]}
      >
        {challenge.completed ? (
          <Feather name="check" size={24} color="#FFF" />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={24} color={theme.link} />
        )}
      </View>
      <View style={styles.challengeContent}>
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {title}
        </ThemedText>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: challenge.completed ? AppColors.success : AppColors.primary,
                },
              ]}
            />
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
            {challenge.current}/{challenge.target}
          </ThemedText>
        </View>
      </View>
      {challenge.completed && (
        <ThemedText style={{ fontSize: 24 }}>🏆</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  tabText: {
    fontWeight: "600",
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
  },
  playerInfo: {
    flex: 1,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  weekBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  challengeContent: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  tipsCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
    alignItems: "flex-start",
  },
});
