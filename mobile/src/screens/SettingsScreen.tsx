import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { performMasterSync } from '../lib/db';
import { TopBar } from '../components/TopBar';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { isOnline, pendingSyncCount, refreshPendingLogs, setSupervisorAuthed } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  async function handleSync() {
    if (!isOnline) {
      setSyncMessage('Cannot sync while offline.');
      return;
    }
    setSyncing(true);
    setSyncMessage('Connecting to cloud endpoint...');
    await new Promise(r => setTimeout(r, 600));
    setSyncMessage('Uploading encrypted logs...');

    try {
      const count = await performMasterSync();
      setSyncMessage(`✅ Sync complete. ${count} logs securely purged.`);
      await refreshPendingLogs();
    } catch (err) {
      setSyncMessage('❌ Sync failed. Logs retained safely offline.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cloud sync card */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{isOnline ? '☁️' : '📵'}</Text>
          </View>
          <Text style={styles.cardTitle}>Cloud Sync</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{pendingSyncCount} EVENTS PENDING</Text>
          </View>

          <TouchableOpacity
            style={[styles.syncBtn, (!isOnline || pendingSyncCount === 0 || syncing) && styles.syncBtnDisabled]}
            onPress={handleSync}
            disabled={!isOnline || pendingSyncCount === 0 || syncing}
          >
            {syncing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.syncBtnText}>Secure Upload</Text>}
          </TouchableOpacity>

          {!!syncMessage && (
            <View style={styles.logBox}>
              <Text style={styles.logText}>> {syncMessage}</Text>
            </View>
          )}
        </View>

        {/* Network status */}
        <View style={styles.row}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>NETWORK STATUS</Text>
            <Text style={styles.statusValue}>{isOnline ? 'Online' : 'Offline'}</Text>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>AI ENGINE</Text>
            <Text style={styles.statusValue}>On-Device</Text>
            <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signoutBtn}
          onPress={() => { setSupervisorAuthed(false); navigation.replace('SupervisorLogin'); }}
        >
          <Text style={styles.signoutText}>Supervisor Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
    alignItems: 'center', marginBottom: 16,
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  icon: { fontSize: 32 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 10 },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 20,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#333', letterSpacing: 1 },
  syncBtn: {
    backgroundColor: '#000', borderRadius: 20, paddingVertical: 16,
    width: '100%', alignItems: 'center',
  },
  syncBtnDisabled: { opacity: 0.4 },
  syncBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  logBox: {
    backgroundColor: '#f5f5f5', borderRadius: 16, padding: 14, width: '100%', marginTop: 14,
  },
  logText: { fontFamily: 'monospace', fontSize: 12, color: '#555' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statusCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  statusLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#999', marginBottom: 6 },
  statusValue: { fontSize: 15, fontWeight: '600', color: '#000' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  signoutBtn: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  signoutText: { fontWeight: '600', fontSize: 14, color: '#e74c3c' },
});
