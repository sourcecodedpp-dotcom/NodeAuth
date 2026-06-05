import { create } from 'zustand';
import { getPendingLogs } from './lib/db';

interface AppState {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  isSupervisorAuthed: boolean;
  activeUserId: string | null;
  setOnlineStatus: (status: boolean) => void;
  refreshPendingLogs: () => Promise<void>;
  setIsSyncing: (status: boolean) => void;
  setSupervisorAuthed: (status: boolean) => void;
  setActiveUser: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true, // Will be updated by NetInfo listener
  pendingSyncCount: 0,
  isSyncing: false,
  isSupervisorAuthed: false,
  activeUserId: null,
  setOnlineStatus: (status) => set({ isOnline: status }),
  refreshPendingLogs: async () => {
    try {
      const logs = await getPendingLogs();
      set({ pendingSyncCount: logs.length });
    } catch (e) {
      console.error('Failed to refresh logs:', e);
    }
  },
  setIsSyncing: (status) => set({ isSyncing: status }),
  setSupervisorAuthed: (status) => set({ isSupervisorAuthed: status }),
  setActiveUser: (id) => set({ activeUserId: id }),
}));

// End of store.
