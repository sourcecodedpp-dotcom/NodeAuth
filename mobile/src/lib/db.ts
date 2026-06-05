import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthLog } from '../types';
import { pushLogsToAWS } from './aws';

const USERS_KEY = '@faceguard_users';
const LOGS_KEY = '@faceguard_logs';

class Mutex {
  private mutex = Promise.resolve();
  lock(): Promise<() => void> {
    let begin: (unlock: () => void) => void;
    this.mutex = this.mutex.then(() => new Promise(begin));
    return new Promise(res => {
      begin = res;
    });
  }
}
const dbMutex = new Mutex();

function safeParse(json: string | null, fallback: any = []) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('AsyncStorage JSON parse error:', e);
    return fallback;
  }
}

export async function getAllUsers(): Promise<User[]> {
  const json = await AsyncStorage.getItem(USERS_KEY);
  return safeParse(json, []);
}

export async function getUser(id: string): Promise<User | undefined> {
  const users = await getAllUsers();
  return users.find(u => u.id === id);
}

// In RN, we can store the Float32Array as a normal array in JSON
export async function saveUser(user: User, vector: Float32Array) {
  const unlock = await dbMutex.lock();
  try {
    const json = await AsyncStorage.getItem(USERS_KEY);
    let users = safeParse(json, []);
    // Deduplicate: remove any existing entry with same id before adding
    users = users.filter((u: any) => u.id !== user.id);
    users.push({ ...user, vector: Array.from(vector) as any });
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } finally {
    unlock();
  }
}

export async function saveAuthLog(log: Omit<AuthLog, 'synced'>) {
  const unlock = await dbMutex.lock();
  try {
    const json = await AsyncStorage.getItem(LOGS_KEY);
    const logs = safeParse(json, []);
    logs.push({ ...log, synced: false });
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } finally {
    unlock();
  }
}

export async function getPendingLogs(): Promise<AuthLog[]> {
  const json = await AsyncStorage.getItem(LOGS_KEY);
  const logs = safeParse(json, []);
  return logs.filter((l: any) => !l.synced) as AuthLog[];
}

export async function purgeLogs(logIds: string[]) {
  const unlock = await dbMutex.lock();
  try {
    const json = await AsyncStorage.getItem(LOGS_KEY);
    let logs: any[] = safeParse(json, []);
    logs = logs.filter(l => !logIds.includes(l.id));
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } finally {
    unlock();
  }
}

export async function performMasterSync() {
  const pendingLogs = await getPendingLogs();
  if (pendingLogs.length === 0) return 0;

  const success = await pushLogsToAWS(pendingLogs);
  if (success) {
    const logIds = pendingLogs.map(l => l.id);
    await purgeLogs(logIds);
    return logIds.length;
  } else {
    throw new Error("Failed to sync to AWS backend");
  }
}

// Seeding standard Demo User
export async function seedDemoData() {
  const unlock = await dbMutex.lock();
  try {
    const json = await AsyncStorage.getItem(USERS_KEY);
    const users = safeParse(json, []);
    if (users.length === 0) {
      const mockVector = new Float32Array(128).fill(0.1);
      users.push({
        id: 'DEMO-001',
        name: 'Field Officer A',
        role: 'field_personnel',
        embeddingId: 'emb-001',
        createdAt: Date.now(),
        vector: Array.from(mockVector) as any
      });
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  } finally {
    unlock();
  }
}
