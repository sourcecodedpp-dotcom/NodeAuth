import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { User, AuthLog } from '../types';
import { pushLogsToCloud } from './firebase';

interface FaceGuardDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-role': string };
  };
  embeddings: {
    key: string;
    value: { id: string; vector: Float32Array };
  };
  auth_logs: {
    key: string;
    value: AuthLog;
    indexes: { 'by-sync-status': number }; // 0 for false, 1 for true
  };
}

let dbPromise: Promise<IDBPDatabase<FaceGuardDB>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<FaceGuardDB>('FaceGuardDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-role', 'role');
        }
        if (!db.objectStoreNames.contains('embeddings')) {
          db.createObjectStore('embeddings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('auth_logs')) {
          const logStore = db.createObjectStore('auth_logs', { keyPath: 'id' });
          logStore.createIndex('by-sync-status', 'synced');
        }
      },
    });
  }
  return dbPromise;
}

// User Operations
export async function saveUser(user: User, vector: Float32Array) {
  const db = await initDB();
  const tx = db.transaction(['users', 'embeddings'], 'readwrite');
  await tx.objectStore('users').put(user);
  await tx.objectStore('embeddings').put({ id: user.embeddingId, vector });
  await tx.done;
}

export async function getAllUsers() {
  const db = await initDB();
  return db.getAll('users');
}

export async function getUser(id: string) {
  const db = await initDB();
  return db.get('users', id);
}

export async function getEmbedding(id: string) {
  const db = await initDB();
  return db.get('embeddings', id);
}

// Logging Operations
export async function logAuthEvent(log: AuthLog) {
  const db = await initDB();
  // Using 0/1 for sync status since boolean idb indexing can sometimes be tricky based on version
  const dbLog = { ...log, synced: log.synced ? 1 as any : 0 as any };
  await db.put('auth_logs', dbLog);
}

export async function getPendingLogs() {
  const db = await initDB();
  const logs = await db.getAllFromIndex('auth_logs', 'by-sync-status', 0);
  return logs.map((l: any) => ({ ...l, synced: false })) as AuthLog[];
}

export async function purgeLogs(logIds: string[]) {
  const db = await initDB();
  const tx = db.transaction('auth_logs', 'readwrite');
  for (const id of logIds) {
    await tx.store.delete(id);
  }
  await tx.done;
}

export async function performMasterSync() {
  const pendingLogs = await getPendingLogs();
  if (pendingLogs.length === 0) return 0; // Nothing to sync

  const success = await pushLogsToCloud(pendingLogs);
  if (success) {
    // If successfully pushed to cloud backend (or simulated), PURGE local logs
    const logIds = pendingLogs.map(l => l.id);
    await purgeLogs(logIds);
    return logIds.length;
  } else {
    throw new Error("Failed to sync to cloud backend");
  }
}

// Seeding standard Demo User
export async function seedDemoData() {
  const users = await getAllUsers();
  if (users.length === 0) {
    // Generate some mock standard vector
    const mockVector = new Float32Array(128).fill(0.1);
    await saveUser(
      {
        id: 'DEMO-001',
        name: 'Field Officer A',
        role: 'field_personnel',
        embeddingId: 'emb-001',
        createdAt: Date.now(),
      },
      mockVector
    );
  }
}
