import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Catch {
  id: number;
  species: string;
  weight: number;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  dateTime: string;
  photoUri: string | null;
  photoUris: string[] | null; // Multiple photos support
  bait: string | null;
  weather: "sunny" | "cloudy" | "rainy" | "windy" | null;
  notes: string | null;
  tags: string[] | null; // Custom tags support
  createdAt: string;
  updatedAt: string;
}

export type NewCatch = Omit<Catch, "id" | "createdAt" | "updatedAt">;

let db: SQLite.SQLiteDatabase | null = null;
let dbInitialized = false;
let dbError = false;

// Web storage key
const WEB_CATCHES_KEY = "@fishing_log_catches";
let webCatches: Catch[] = [];
let webNextId = 1;

export function isWebPlatform(): boolean {
  return Platform.OS === "web";
}

// Load catches from AsyncStorage for web
async function loadWebCatches(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(WEB_CATCHES_KEY);
    if (stored) {
      webCatches = JSON.parse(stored);
      webNextId = webCatches.length > 0 ? Math.max(...webCatches.map(c => c.id)) + 1 : 1;
    }
  } catch (error) {
    console.error("Failed to load web catches:", error);
  }
}

// Save catches to AsyncStorage for web
async function saveWebCatches(): Promise<void> {
  try {
    await AsyncStorage.setItem(WEB_CATCHES_KEY, JSON.stringify(webCatches));
  } catch (error) {
    console.error("Failed to save web catches:", error);
  }
}

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  if (dbError) return;
  
  if (isWebPlatform()) {
    console.log("Using AsyncStorage for web - data will persist in browser");
    await loadWebCatches();
    dbInitialized = true;
    return;
  }
  
  try {
    db = await SQLite.openDatabaseAsync("fishing_log.db");
    
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS catches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        species TEXT NOT NULL,
        weight REAL NOT NULL,
        latitude REAL,
        longitude REAL,
        locationName TEXT,
        dateTime TEXT NOT NULL,
        photoUri TEXT,
        photoUris TEXT,
        bait TEXT,
        weather TEXT,
        notes TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_catches_dateTime ON catches(dateTime DESC);
      CREATE INDEX IF NOT EXISTS idx_catches_species ON catches(species);
    `);
    
    // Try to add new columns if they don't exist (for existing databases)
    try {
      await db.execAsync(`ALTER TABLE catches ADD COLUMN photoUris TEXT;`);
    } catch {}
    try {
      await db.execAsync(`ALTER TABLE catches ADD COLUMN tags TEXT;`);
    } catch {}
    
    dbInitialized = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    dbError = true;
    dbInitialized = true;
  }
}

export async function getAllCatches(): Promise<Catch[]> {
  await initDatabase();
  
  if (isWebPlatform()) {
    return [...webCatches].sort((a, b) => 
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }
  
  if (dbError || !db) {
    return [];
  }
  
  try {
    const result = await db.getAllAsync<Catch>(
      "SELECT * FROM catches ORDER BY dateTime DESC"
    );
    return result;
  } catch (error) {
    console.error("Failed to get catches:", error);
    return [];
  }
}

export async function getCatchById(id: number): Promise<Catch | null> {
  await initDatabase();
  
  if (isWebPlatform()) {
    return webCatches.find(c => c.id === id) || null;
  }
  
  if (dbError || !db) {
    return null;
  }
  
  try {
    const result = await db.getFirstAsync<Catch>(
      "SELECT * FROM catches WHERE id = ?",
      [id]
    );
    return result || null;
  } catch (error) {
    console.error("Failed to get catch:", error);
    return null;
  }
}

export async function addCatch(catchData: NewCatch): Promise<number> {
  await initDatabase();
  
  if (isWebPlatform()) {
    const now = new Date().toISOString();
    const newCatch: Catch = {
      ...catchData,
      id: webNextId++,
      createdAt: now,
      updatedAt: now,
    };
    webCatches.push(newCatch);
    await saveWebCatches();
    console.log("Catch saved to web storage:", newCatch.id);
    return newCatch.id;
  }
  
  if (dbError || !db) {
    return -1;
  }
  
  try {
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      `INSERT INTO catches (species, weight, latitude, longitude, locationName, dateTime, photoUri, photoUris, bait, weather, notes, tags, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        catchData.species,
        catchData.weight,
        catchData.latitude,
        catchData.longitude,
        catchData.locationName,
        catchData.dateTime,
        catchData.photoUri,
        catchData.photoUris ? JSON.stringify(catchData.photoUris) : null,
        catchData.bait,
        catchData.weather,
        catchData.notes,
        catchData.tags ? JSON.stringify(catchData.tags) : null,
        now,
        now,
      ]
    );
    
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Failed to add catch:", error);
    return -1;
  }
}

export async function updateCatch(id: number, catchData: Partial<NewCatch>): Promise<void> {
  await initDatabase();
  
  if (isWebPlatform()) {
    const index = webCatches.findIndex(c => c.id === id);
    if (index !== -1) {
      webCatches[index] = {
        ...webCatches[index],
        ...catchData,
        updatedAt: new Date().toISOString(),
      };
      await saveWebCatches();
    }
    return;
  }
  
  if (dbError || !db) {
    return;
  }
  
  try {
    const now = new Date().toISOString();
    
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (catchData.species !== undefined) {
      fields.push("species = ?");
      values.push(catchData.species);
    }
    if (catchData.weight !== undefined) {
      fields.push("weight = ?");
      values.push(catchData.weight);
    }
    if (catchData.latitude !== undefined) {
      fields.push("latitude = ?");
      values.push(catchData.latitude);
    }
    if (catchData.longitude !== undefined) {
      fields.push("longitude = ?");
      values.push(catchData.longitude);
    }
    if (catchData.locationName !== undefined) {
      fields.push("locationName = ?");
      values.push(catchData.locationName);
    }
    if (catchData.dateTime !== undefined) {
      fields.push("dateTime = ?");
      values.push(catchData.dateTime);
    }
    if (catchData.photoUri !== undefined) {
      fields.push("photoUri = ?");
      values.push(catchData.photoUri);
    }
    if (catchData.bait !== undefined) {
      fields.push("bait = ?");
      values.push(catchData.bait);
    }
    if (catchData.weather !== undefined) {
      fields.push("weather = ?");
      values.push(catchData.weather);
    }
    if (catchData.notes !== undefined) {
      fields.push("notes = ?");
      values.push(catchData.notes);
    }
    
    if (fields.length === 0) return;
    
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);
    
    await db.runAsync(
      `UPDATE catches SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Failed to update catch:", error);
  }
}

export async function deleteCatch(id: number): Promise<void> {
  await initDatabase();
  
  if (isWebPlatform()) {
    webCatches = webCatches.filter(c => c.id !== id);
    await saveWebCatches();
    return;
  }
  
  if (dbError || !db) {
    return;
  }
  
  try {
    await db.runAsync("DELETE FROM catches WHERE id = ?", [id]);
  } catch (error) {
    console.error("Failed to delete catch:", error);
  }
}

export async function getCatchesByDateRange(startDate: string, endDate: string): Promise<Catch[]> {
  await initDatabase();
  
  if (isWebPlatform()) {
    return webCatches.filter(c => 
      c.dateTime >= startDate && c.dateTime <= endDate
    ).sort((a, b) => 
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }
  
  if (dbError || !db) {
    return [];
  }
  
  try {
    const result = await db.getAllAsync<Catch>(
      "SELECT * FROM catches WHERE dateTime >= ? AND dateTime <= ? ORDER BY dateTime DESC",
      [startDate, endDate]
    );
    return result;
  } catch (error) {
    console.error("Failed to get catches by date range:", error);
    return [];
  }
}

export async function getStats(): Promise<{
  totalCatches: number;
  biggestCatch: Catch | null;
  topSpecies: { species: string; count: number } | null;
}> {
  await initDatabase();
  
  if (isWebPlatform()) {
    const totalCatches = webCatches.length;
    
    const biggestCatch = webCatches.length > 0 
      ? webCatches.reduce((max, c) => c.weight > max.weight ? c : max, webCatches[0])
      : null;
    
    // Calculate top species
    const speciesCount: Record<string, number> = {};
    for (const c of webCatches) {
      speciesCount[c.species] = (speciesCount[c.species] || 0) + 1;
    }
    const topSpeciesEntry = Object.entries(speciesCount).sort((a, b) => b[1] - a[1])[0];
    const topSpecies = topSpeciesEntry ? { species: topSpeciesEntry[0], count: topSpeciesEntry[1] } : null;
    
    return { totalCatches, biggestCatch, topSpecies };
  }
  
  if (dbError || !db) {
    return { totalCatches: 0, biggestCatch: null, topSpecies: null };
  }
  
  try {
    const countResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM catches"
    );
    const totalCatches = countResult?.count || 0;
    
    const biggestCatch = await db.getFirstAsync<Catch>(
      "SELECT * FROM catches ORDER BY weight DESC LIMIT 1"
    );
    
    const topSpeciesResult = await db.getFirstAsync<{ species: string; count: number }>(
      "SELECT species, COUNT(*) as count FROM catches GROUP BY species ORDER BY count DESC LIMIT 1"
    );
    
    return {
      totalCatches,
      biggestCatch: biggestCatch || null,
      topSpecies: topSpeciesResult || null,
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return { totalCatches: 0, biggestCatch: null, topSpecies: null };
  }
}

// Backup all catches to JSON string
export async function exportBackup(): Promise<string> {
  const catches = await getAllCatches();
  const backup = {
    version: "2.1.0",
    exportDate: new Date().toISOString(),
    catchCount: catches.length,
    catches,
  };
  return JSON.stringify(backup, null, 2);
}

// Restore catches from JSON backup
export async function importBackup(jsonString: string): Promise<{ success: boolean; imported: number; error?: string }> {
  try {
    const backup = JSON.parse(jsonString);
    
    if (!backup.catches || !Array.isArray(backup.catches)) {
      return { success: false, imported: 0, error: "Invalid backup format" };
    }
    
    let imported = 0;
    
    for (const catchItem of backup.catches) {
      const newCatch: NewCatch = {
        species: catchItem.species,
        weight: catchItem.weight,
        latitude: catchItem.latitude,
        longitude: catchItem.longitude,
        locationName: catchItem.locationName,
        dateTime: catchItem.dateTime,
        photoUri: catchItem.photoUri,
        photoUris: catchItem.photoUris,
        bait: catchItem.bait,
        weather: catchItem.weather,
        notes: catchItem.notes,
        tags: catchItem.tags,
      };
      
      const id = await addCatch(newCatch);
      if (id > 0) {
        imported++;
      }
    }
    
    return { success: true, imported };
  } catch (error) {
    console.error("Failed to import backup:", error);
    return { success: false, imported: 0, error: "Failed to parse backup file" };
  }
}

// Search catches by query
export async function searchCatches(query: string): Promise<Catch[]> {
  const allCatches = await getAllCatches();
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return allCatches;
  }
  
  return allCatches.filter(c => 
    c.species.toLowerCase().includes(lowerQuery) ||
    c.locationName?.toLowerCase().includes(lowerQuery) ||
    c.bait?.toLowerCase().includes(lowerQuery) ||
    c.notes?.toLowerCase().includes(lowerQuery) ||
    c.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Filter catches by criteria
export interface CatchFilters {
  species?: string;
  minWeight?: number;
  maxWeight?: number;
  startDate?: string;
  endDate?: string;
  weather?: "sunny" | "cloudy" | "rainy" | "windy";
  tags?: string[];
}

export async function filterCatches(filters: CatchFilters): Promise<Catch[]> {
  const allCatches = await getAllCatches();
  
  return allCatches.filter(c => {
    if (filters.species && c.species.toLowerCase() !== filters.species.toLowerCase()) {
      return false;
    }
    if (filters.minWeight && c.weight < filters.minWeight) {
      return false;
    }
    if (filters.maxWeight && c.weight > filters.maxWeight) {
      return false;
    }
    if (filters.startDate && c.dateTime < filters.startDate) {
      return false;
    }
    if (filters.endDate && c.dateTime > filters.endDate) {
      return false;
    }
    if (filters.weather && c.weather !== filters.weather) {
      return false;
    }
    if (filters.tags && filters.tags.length > 0) {
      if (!c.tags || !filters.tags.some(tag => c.tags?.includes(tag))) {
        return false;
      }
    }
    return true;
  });
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const allCatches = await getAllCatches();
  const tagsSet = new Set<string>();
  
  for (const c of allCatches) {
    if (c.tags) {
      for (const tag of c.tags) {
        tagsSet.add(tag);
      }
    }
  }
  
  return Array.from(tagsSet).sort();
}

// Get monthly stats for charts
export async function getMonthlyStats(): Promise<{ month: string; count: number; totalWeight: number }[]> {
  const allCatches = await getAllCatches();
  const monthlyData: Record<string, { count: number; totalWeight: number }> = {};
  
  for (const c of allCatches) {
    const date = new Date(c.dateTime);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, totalWeight: 0 };
    }
    
    monthlyData[monthKey].count++;
    monthlyData[monthKey].totalWeight += c.weight;
  }
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Get weekday stats for charts
export async function getWeekdayStats(): Promise<{ day: string; count: number }[]> {
  const allCatches = await getAllCatches();
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
  
  for (const c of allCatches) {
    const date = new Date(c.dateTime);
    counts[date.getDay()]++;
  }
  
  return weekdays.map((day, index) => ({ day, count: counts[index] }));
}
