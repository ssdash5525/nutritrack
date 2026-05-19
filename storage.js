/**
 * NutriTrack - Storage Module (Firestore)
 * All data lives under /users/{uid}/... so each user's data is isolated.
 * Requires auth.js to be loaded first.
 */

const { userCol, getUID } = FirebaseAuth;

// ── Internal helpers ───────────────────────────────────────────────────────

async function clearCollection(colName) {
  const snap = await userCol(colName).get();
  if (snap.empty) return;
  const batch = FirebaseAuth.db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

function docToObj(doc) {
  return { id: doc.id, ...doc.data() };
}

// ── Weight Logs ────────────────────────────────────────────────────────────

async function addWeightLog(entry) {
  const ref = await userCol('weightLogs').add({ ...entry, createdAt: Date.now() });
  return ref.id;
}

async function getAllWeightLogs() {
  const snap = await userCol('weightLogs').orderBy('date', 'asc').get();
  return snap.docs.map(docToObj);
}

async function deleteWeightLog(id) {
  await userCol('weightLogs').doc(id).delete();
}

async function updateWeightLog(entry) {
  const { id, ...data } = entry;
  await userCol('weightLogs').doc(id).set({ ...data, updatedAt: Date.now() });
}

// ── Meal Logs ──────────────────────────────────────────────────────────────
// Uses the ISO date string as the document ID for instant lookups.

async function getMealLogByDate(date) {
  const doc = await userCol('mealLogs').doc(date).get();
  if (doc.exists) return docToObj(doc);
  // Return an empty structure — same id shape so saveMealLog always works
  return { id: date, date, meals: { breakfast: [], lunch: [], snacks: [], dinner: [] } };
}

async function saveMealLog(mealLog) {
  const { date, meals } = mealLog;
  await userCol('mealLogs').doc(date).set({ date, meals, updatedAt: Date.now() });
}

async function getAllMealLogs() {
  const snap = await userCol('mealLogs').orderBy('date', 'asc').get();
  return snap.docs.map(docToObj);
}

// ── Food Database ──────────────────────────────────────────────────────────

async function getAllFoods() {
  const snap = await userCol('foodDatabase').orderBy('name', 'asc').get();
  return snap.docs.map(docToObj);
}

async function addFood(food) {
  const ref = await userCol('foodDatabase').add({ ...food, createdAt: Date.now() });
  return ref.id;
}

async function updateFood(food) {
  const { id, ...data } = food;
  await userCol('foodDatabase').doc(id).set({ ...data, updatedAt: Date.now() });
}

async function deleteFood(id) {
  await userCol('foodDatabase').doc(id).delete();
}

async function getFoodById(id) {
  const doc = await userCol('foodDatabase').doc(id).get();
  return doc.exists ? docToObj(doc) : null;
}

async function searchFoods(query) {
  // Firestore has no native full-text search; client-side filter is fine at this scale
  const all = await getAllFoods();
  const q = query.toLowerCase();
  return all.filter(f => f.name.toLowerCase().includes(q));
}

// ── Settings ───────────────────────────────────────────────────────────────
// All settings are fields on a single document: /users/{uid}/settings/preferences

async function getSetting(key) {
  try {
    const doc = await userCol('settings').doc('preferences').get();
    return doc.exists ? (doc.data()[key] ?? null) : null;
  } catch { return null; }
}

async function setSetting(key, value) {
  await userCol('settings').doc('preferences').set({ [key]: value }, { merge: true });
}

async function getAllSettings() {
  const doc = await userCol('settings').doc('preferences').get();
  return doc.exists ? doc.data() : {};
}

// ── Seed Default Foods ─────────────────────────────────────────────────────

async function seedDefaultFoods() {
  const settings = await getAllSettings();
  if (settings.foodsSeeded) return; // already seeded for this user

  const defaults = [
    { name: 'Chicken Breast (cooked)', calories: 165, protein: 31, carbs: 0,    fats: 3.6, fiber: 0,    unit: 'per 100g', category: 'Protein' },
    { name: 'Brown Rice (cooked)',      calories: 112, protein: 2.6,carbs: 23.5, fats: 0.9, fiber: 1.8,  unit: 'per 100g', category: 'Grains' },
    { name: 'Broccoli (raw)',           calories: 34,  protein: 2.8,carbs: 6.6,  fats: 0.4, fiber: 2.6,  unit: 'per 100g', category: 'Vegetables' },
    { name: 'Whole Egg',               calories: 72,  protein: 6.3,carbs: 0.4,  fats: 5.0, fiber: 0,    unit: 'per egg (50g)', category: 'Protein' },
    { name: 'Banana',                  calories: 89,  protein: 1.1,carbs: 23,   fats: 0.3, fiber: 2.6,  unit: 'per 100g', category: 'Fruits' },
    { name: 'Oats (dry)',              calories: 389, protein: 17, carbs: 66,   fats: 7,   fiber: 10.6, unit: 'per 100g', category: 'Grains' },
    { name: 'Whole Milk',              calories: 61,  protein: 3.2,carbs: 4.8,  fats: 3.3, fiber: 0,    unit: 'per 100ml', category: 'Dairy' },
    { name: 'Greek Yogurt (plain)',    calories: 59,  protein: 10, carbs: 3.6,  fats: 0.4, fiber: 0,    unit: 'per 100g', category: 'Dairy' },
    { name: 'Almonds',                 calories: 579, protein: 21, carbs: 22,   fats: 50,  fiber: 12.5, unit: 'per 100g', category: 'Nuts' },
    { name: 'Salmon (cooked)',         calories: 208, protein: 20, carbs: 0,    fats: 13,  fiber: 0,    unit: 'per 100g', category: 'Protein' },
    { name: 'Sweet Potato (cooked)',   calories: 86,  protein: 1.6,carbs: 20,   fats: 0.1, fiber: 3,    unit: 'per 100g', category: 'Vegetables' },
    { name: 'Olive Oil',              calories: 884, protein: 0,  carbs: 0,    fats: 100, fiber: 0,    unit: 'per 100ml', category: 'Fats' },
    { name: 'Apple',                   calories: 52,  protein: 0.3,carbs: 14,   fats: 0.2, fiber: 2.4,  unit: 'per 100g', category: 'Fruits' },
    { name: 'Spinach (raw)',           calories: 23,  protein: 2.9,carbs: 3.6,  fats: 0.4, fiber: 2.2,  unit: 'per 100g', category: 'Vegetables' },
    { name: 'White Rice (cooked)',     calories: 130, protein: 2.7,carbs: 28,   fats: 0.3, fiber: 0.4,  unit: 'per 100g', category: 'Grains' },
  ];

  const uid = getUID();
  const db  = FirebaseAuth.db;
  const batch = db.batch();
  for (const food of defaults) {
    const ref = db.collection('users').doc(uid).collection('foodDatabase').doc();
    batch.set(ref, { ...food, createdAt: Date.now() });
  }
  await batch.commit();
  await setSetting('foodsSeeded', true);
}

// ── Export / Import ────────────────────────────────────────────────────────

async function exportAllData() {
  const [weightLogs, mealLogs, foodDatabase, settings] = await Promise.all([
    getAllWeightLogs(), getAllMealLogs(), getAllFoods(), getAllSettings(),
  ]);
  return { weightLogs, mealLogs, foodDatabase, settings, exportedAt: new Date().toISOString() };
}

async function importAllData(data) {
  await Promise.all([
    clearCollection('weightLogs'),
    clearCollection('mealLogs'),
    clearCollection('foodDatabase'),
  ]);
  await userCol('settings').doc('preferences').delete().catch(() => {});

  if (data.weightLogs) {
    for (const log of data.weightLogs) {
      const { id, ...d } = log;
      await userCol('weightLogs').add(d);
    }
  }
  if (data.mealLogs) {
    for (const log of data.mealLogs) {
      const { id, ...d } = log;
      await userCol('mealLogs').doc(log.date).set(d);
    }
  }
  if (data.foodDatabase) {
    for (const food of data.foodDatabase) {
      const { id, ...d } = food;
      await userCol('foodDatabase').add(d);
    }
  }
  if (data.settings) {
    await userCol('settings').doc('preferences').set(data.settings);
  }
}

// ── Migration from local IndexedDB ─────────────────────────────────────────

/** Opens the old NutriTrackDB IndexedDB and reads all data. Returns null if DB didn't exist. */
function readOldIndexedDB() {
  return new Promise((resolve) => {
    try {
      let isNew = false;
      const request = indexedDB.open('NutriTrackDB'); // no version → open as-is

      request.onupgradeneeded = () => {
        // onupgradeneeded fires when DB is being created for the first time
        isNew = true;
        request.transaction.abort(); // abort creation so we don't make a new empty DB
      };

      request.onsuccess = async (e) => {
        if (isNew) { resolve(null); return; }
        const oldDB = e.target.result;

        if (!oldDB.objectStoreNames.contains('weightLogs')) {
          oldDB.close();
          resolve(null);
          return;
        }

        const storeNames = ['weightLogs', 'mealLogs', 'foodDatabase', 'settings'];
        const result = {};
        for (const name of storeNames) {
          if (!oldDB.objectStoreNames.contains(name)) { result[name] = []; continue; }
          result[name] = await new Promise((res, rej) => {
            const tx  = oldDB.transaction(name, 'readonly');
            const req = tx.objectStore(name).getAll();
            req.onsuccess = () => res(req.result);
            req.onerror  = () => rej(req.error);
          });
        }
        oldDB.close();
        resolve(result);
      };

      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function migrateFromIndexedDB() {
  const old = await readOldIndexedDB();
  const stats = { weightLogs: 0, mealLogs: 0, foods: 0 };
  if (!old) return stats;

  // Weight logs
  if (old.weightLogs.length > 0) {
    await clearCollection('weightLogs');
    for (const log of old.weightLogs) {
      const { id, ...d } = log;
      await userCol('weightLogs').add(d);
      stats.weightLogs++;
    }
  }

  // Meal logs
  if (old.mealLogs.length > 0) {
    await clearCollection('mealLogs');
    for (const log of old.mealLogs) {
      const { id, ...d } = log;
      await userCol('mealLogs').doc(log.date).set(d);
      stats.mealLogs++;
    }
  }

  // Foods (clear seeded defaults, replace with local database)
  if (old.foodDatabase.length > 0) {
    await clearCollection('foodDatabase');
    for (const food of old.foodDatabase) {
      const { id, ...d } = food;
      await userCol('foodDatabase').add(d);
      stats.foods++;
    }
  }

  // Settings (individual key-value rows from old storage)
  for (const row of old.settings || []) {
    await setSetting(row.key, row.value);
  }

  // Mark as done so the migration prompt doesn't reappear
  await setSetting('migrationDone', true);
  await setSetting('foodsSeeded', true);

  return stats;
}

/** Returns true if the old IndexedDB has data that hasn't been migrated yet. */
async function hasPendingMigration() {
  const done = await getSetting('migrationDone');
  if (done) return false;
  const old = await readOldIndexedDB();
  if (!old) return false;
  return old.weightLogs.length > 0 || old.mealLogs.length > 0;
}

// ── Public API ─────────────────────────────────────────────────────────────
// init() is a no-op — Firestore is initialized by auth.js.
// The same API surface is preserved so existing page code needs minimal changes.

window.Storage = {
  init: async () => {},
  // Weight
  addWeightLog, getAllWeightLogs, deleteWeightLog, updateWeightLog,
  // Meals
  getMealLogByDate, saveMealLog, getAllMealLogs,
  // Foods
  getAllFoods, addFood, updateFood, deleteFood, getFoodById, searchFoods,
  // Settings
  getSetting, setSetting, getAllSettings,
  // Data management
  exportAllData, importAllData, seedDefaultFoods,
  migrateFromIndexedDB, hasPendingMigration,
};
