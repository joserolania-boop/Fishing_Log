import * as FileSystemModule from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Catch, getAllCatches, getCatchesByDateRange } from "./database";

// Cast FileSystem to any to avoid TypeScript issues with dynamic module exports
const FileSystem = FileSystemModule as any;

export type ExportFormat = "csv" | "json";
export type DateRangeType = "all" | "month" | "year" | "custom";

function getDateRange(rangeType: DateRangeType, customStart?: Date, customEnd?: Date): { start: string; end: string } | null {
  const now = new Date();
  
  switch (rangeType) {
    case "all":
      return null;
    case "month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      };
    case "year":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return {
        start: yearStart.toISOString(),
        end: yearEnd.toISOString(),
      };
    case "custom":
      if (customStart && customEnd) {
        return {
          start: customStart.toISOString(),
          end: customEnd.toISOString(),
        };
      }
      return null;
    default:
      return null;
  }
}

async function getCatchesForExport(
  rangeType: DateRangeType,
  customStart?: Date,
  customEnd?: Date
): Promise<Catch[]> {
  const dateRange = getDateRange(rangeType, customStart, customEnd);
  
  if (dateRange) {
    return getCatchesByDateRange(dateRange.start, dateRange.end);
  }
  
  return getAllCatches();
}

function catchesToCSV(catches: Catch[]): string {
  const headers = [
    "ID",
    "Species",
    "Weight (kg)",
    "Latitude",
    "Longitude",
    "Location Name",
    "Date Time",
    "Bait",
    "Weather",
    "Notes",
  ];
  
  const rows = catches.map((c) => [
    c.id.toString(),
    `"${c.species.replace(/"/g, '""')}"`,
    c.weight.toString(),
    c.latitude?.toString() || "",
    c.longitude?.toString() || "",
    c.locationName ? `"${c.locationName.replace(/"/g, '""')}"` : "",
    c.dateTime,
    c.bait ? `"${c.bait.replace(/"/g, '""')}"` : "",
    c.weather || "",
    c.notes ? `"${c.notes.replace(/"/g, '""')}"` : "",
  ]);
  
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function catchesToJSON(catches: Catch[]): string {
  const exportData = catches.map((c) => ({
    id: c.id,
    species: c.species,
    weight: c.weight,
    location: {
      latitude: c.latitude,
      longitude: c.longitude,
      name: c.locationName,
    },
    dateTime: c.dateTime,
    bait: c.bait,
    weather: c.weather,
    notes: c.notes,
  }));
  
  return JSON.stringify(exportData, null, 2);
}

export async function exportData(
  format: ExportFormat,
  rangeType: DateRangeType = "all",
  customStart?: Date,
  customEnd?: Date
): Promise<{ uri: string; filename: string } | null> {
  const catches = await getCatchesForExport(rangeType, customStart, customEnd);
  
  if (catches.length === 0) {
    return null;
  }
  
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `fishing_log_${timestamp}.${format}`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  
  let content: string;
  if (format === "csv") {
    content = catchesToCSV(catches);
  } else {
    content = catchesToJSON(catches);
  }
  
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  
  return { uri: fileUri, filename };
}

export async function shareFile(uri: string): Promise<boolean> {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (!isAvailable) {
    return false;
  }
  
  await Sharing.shareAsync(uri, {
    mimeType: uri.endsWith(".csv") ? "text/csv" : "application/json",
  });
  
  return true;
}
