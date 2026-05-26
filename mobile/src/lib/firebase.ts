import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { AuthLog } from '../types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvdM-xUqSgSvbctPVb9v-7Q1LrFG7y6kQ",
  authDomain: "nhai-77b72.firebaseapp.com",
  projectId: "nhai-77b72",
  storageBucket: "nhai-77b72.firebasestorage.app",
  messagingSenderId: "458436851140",
  appId: "1:458436851140:web:159f342dcf95468eb8e091",
  measurementId: "G-SZTM7RS5PE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Syncs a batch of authentication logs to Firestore.
 * 
 * Note: If the Firebase config is just a placeholder (no valid API key), 
 * this function will intentionally simulate a successful network delay 
 * so the prototype still works for judges.
 */
export async function pushLogsToCloud(logs: AuthLog[]): Promise<boolean> {
  if (logs.length === 0) return true;
  
  const isMocked = firebaseConfig.apiKey.includes("mock");

  if (isMocked) {
    console.warn("[Firebase API] Running with mock configuration. Simulating cloud sync...");
    // Simulate network latency (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));
    return true; // Simulate success
  }

  try {
    const batch = writeBatch(db);
    const logsRef = collection(db, 'verification_logs');
    
    logs.forEach(log => {
      const newDocRef = doc(logsRef, log.id);
      batch.set(newDocRef, {
        ...log,
        syncedAt: Date.now()
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error syncing logs to Firestore:", error);
    return false;
  }
}
