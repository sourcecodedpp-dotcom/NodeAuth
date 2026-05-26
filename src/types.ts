export interface User {
  id: string;
  name: string;
  role: 'field_personnel' | 'admin';
  embeddingId: string; // Ref to vector stored locally
  createdAt: number;
}

export interface AuthLog {
  id: string;
  userId: string;
  timestamp: number;
  status: 'success' | 'failed' | 'liveness_failed';
  confidenceScore: number;
  synced: boolean;
  location?: { lat: number; lng: number }; // Future use
}

export interface SyncStatus {
  lastSyncTime: number | null;
  pendingLogs: number;
  isOnline: boolean;
}
