import * as SQLite from "expo-sqlite";

export interface Catch {
  id: number;
  species: string;
  weight: number;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  dateTime: string;
  photoUri: string | null;
  bait: string | null;
  weather: "sunny" | "cloudy" | "rainy" | "windy" | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewCatch = Omit<Catch, "id" | "createdAt" | "updatedAt">;

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (db) return;
  
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
      bait TEXT,
      weather TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_catches_dateTime ON catches(dateTime DESC);
    CREATE INDEX IF NOT EXISTS idx_catches_species ON catches(species);
  `);
}

export async function getAllCatches(): Promise<Catch[]> {
  if (!db) await initDatabase();
  const result = await db!.getAllAsync<Catch>(
    "SELECT * FROM catches ORDER BY dateTime DESC"
  );
  return result;
}

export async function getCatchById(id: number): Promise<Catch | null> {
  if (!db) await initDatabase();
  const result = await db!.getFirstAsync<Catch>(
    "SELECT * FROM catches WHERE id = ?",
    [id]
  );
  return result || null;
}

export async function addCatch(catchData: NewCatch): Promise<number> {
  if (!db) await initDatabase();
  const now = new Date().toISOString();
  
  const result = await db!.runAsync(
    `INSERT INTO catches (species, weight, latitude, longitude, locationName, dateTime, photoUri, bait, weather, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      catchData.species,
      catchData.weight,
      catchData.latitude,
      catchData.longitude,
      catchData.locationName,
      catchData.dateTime,
      catchData.photoUri,
      catchData.bait,
      catchData.weather,
      catchData.notes,
      now,
      now,
    ]
  );
  
  return result.lastInsertRowId;
}

export async function updateCatch(id: number, catchData: Partial<NewCatch>): Promise<void> {
  if (!db) await initDatabase();
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
  
  fields.push("updatedAt = ?");
  values.push(now);
  values.push(id);
  
  await db!.runAsync(
    `UPDATE catches SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteCatch(id: number): Promise<void> {
  if (!db) await initDatabase();
  await db!.runAsync("DELETE FROM catches WHERE id = ?", [id]);
}

export async function getCatchesByDateRange(startDate: string, endDate: string): Promise<Catch[]> {
  if (!db) await initDatabase();
  const result = await db!.getAllAsync<Catch>(
    "SELECT * FROM catches WHERE dateTime >= ? AND dateTime <= ? ORDER BY dateTime DESC",
    [startDate, endDate]
  );
  return result;
}

export async function getStats(): Promise<{
  totalCatches: number;
  biggestCatch: Catch | null;
  topSpecies: { species: string; count: number } | null;
}> {
  if (!db) await initDatabase();
  
  const countResult = await db!.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM catches"
  );
  const totalCatches = countResult?.count || 0;
  
  const biggestCatch = await db!.getFirstAsync<Catch>(
    "SELECT * FROM catches ORDER BY weight DESC LIMIT 1"
  );
  
  const topSpeciesResult = await db!.getFirstAsync<{ species: string; count: number }>(
    "SELECT species, COUNT(*) as count FROM catches GROUP BY species ORDER BY count DESC LIMIT 1"
  );
  
  return {
    totalCatches,
    biggestCatch: biggestCatch || null,
    topSpecies: topSpeciesResult || null,
  };
}
