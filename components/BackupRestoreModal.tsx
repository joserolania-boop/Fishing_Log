import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/components/Toast";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { exportBackup, importBackup } from "@/utils/database";

// Dynamic import for DocumentPicker
let DocumentPicker: any = null;
if (Platform.OS !== "web") {
  try {
    DocumentPicker = require("expo-document-picker");
  } catch (e) {
    console.log("expo-document-picker not available");
  }
}

interface BackupRestoreModalProps {
  visible: boolean;
  onClose: () => void;
  onRestoreComplete?: () => void;
}

export function BackupRestoreModal({ visible, onClose, onRestoreComplete }: BackupRestoreModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const hapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleExport = async () => {
    hapticFeedback();
    setIsExporting(true);
    
    try {
      const backupJson = await exportBackup();
      const fileName = `fishing_log_backup_${new Date().toISOString().split("T")[0]}.json`;
      
      if (Platform.OS === "web") {
        // Web: Download as file
        const blob = new Blob([backupJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        showToast(t.backup?.exportSuccess || "Backup exported successfully!", "success");
      } else {
        // Mobile: Use dynamic import for FileSystem
        const FileSystemModule = await import("expo-file-system");
        const FS = FileSystemModule.default || FileSystemModule;
        const cacheDir = (FS as any).cacheDirectory || (FS as any).documentDirectory || "";
        const filePath = `${cacheDir}${fileName}`;
        await (FS as any).writeAsStringAsync(filePath, backupJson);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: "application/json",
            dialogTitle: "Export Fishing Log Backup",
          });
        }
        showToast(t.backup?.exportSuccess || "Backup exported successfully!", "success");
      }
    } catch (error) {
      console.error("Export failed:", error);
      showToast(t.backup?.exportError || "Failed to export backup", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    hapticFeedback();
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      // Confirm before importing
      Alert.alert(
        t.backup?.confirmImport || "Import Backup",
        t.backup?.confirmImportMessage || "This will add all catches from the backup file. Continue?",
        [
          { text: t.common.cancel, style: "cancel" },
          {
            text: t.backup?.import || "Import",
            onPress: async () => {
              setIsImporting(true);
              try {
                let content: string;
                
                if (Platform.OS === "web") {
                  const response = await fetch(file.uri);
                  content = await response.text();
                } else {
                  const FileSystemModule = await import("expo-file-system");
                  const FS = FileSystemModule.default || FileSystemModule;
                  content = await (FS as any).readAsStringAsync(file.uri);
                }
                
                const result = await importBackup(content);
                
                if (result.success) {
                  showToast(
                    `${t.backup?.importSuccess || "Imported"} ${result.imported} ${t.backup?.catches || "catches"}!`,
                    "success"
                  );
                  onRestoreComplete?.();
                  onClose();
                } else {
                  showToast(result.error || "Import failed", "error");
                }
              } catch (error) {
                console.error("Import failed:", error);
                showToast(t.backup?.importError || "Failed to import backup", "error");
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Document picker failed:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modal, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {t.backup?.title || "Backup & Restore"}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {t.backup?.description || "Export your catches to a file or restore from a previous backup."}
          </ThemedText>

          {/* Export Button */}
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.link }]}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="upload" size={22} color="#fff" />
                <View style={styles.actionTextContainer}>
                  <ThemedText style={styles.actionTitle}>
                    {t.backup?.export || "Export Backup"}
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    {t.backup?.exportDesc || "Save all catches to a file"}
                  </ThemedText>
                </View>
              </>
            )}
          </Pressable>

          {/* Import Button */}
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color={theme.link} />
            ) : (
              <>
                <Feather name="download" size={22} color={theme.link} />
                <View style={styles.actionTextContainer}>
                  <ThemedText style={styles.actionTitleDark}>
                    {t.backup?.import || "Import Backup"}
                  </ThemedText>
                  <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                    {t.backup?.importDesc || "Restore catches from a file"}
                  </ThemedText>
                </View>
              </>
            )}
          </Pressable>

          {/* Warning */}
          <View style={[styles.warning, { backgroundColor: theme.warning + "15" }]}>
            <Feather name="info" size={16} color={theme.warning} />
            <ThemedText style={[styles.warningText, { color: theme.warning }]}>
              {t.backup?.warning || "Photos are not included in the backup. Only catch data is saved."}
            </ThemedText>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionTitleDark: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
