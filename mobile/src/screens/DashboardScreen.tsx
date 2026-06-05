import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { getAllUsers, performMasterSync } from '../lib/db';
import { Dock } from '../components/Dock';
import { 
  ShieldCheck, 
  ScanFace, 
  Users, 
  Server, 
  Cpu, 
  Camera, 
  User, 
  Fingerprint,
  Activity,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  CloudOff
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;


export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { isOnline, pendingSyncCount, isSyncing, setIsSyncing, refreshPendingLogs } = useAppStore();
  const [userCount, setUserCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<'success' | 'fail' | 'empty' | null>(null);
  const prevOnlineRef = useRef<boolean>(isOnline);

  useEffect(() => {
    refreshPendingLogs();
    getAllUsers().then(users => setUserCount(users.length));
  }, []);

  // Auto-sync when device transitions from offline → online with pending logs
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline && pendingSyncCount > 0 && !isSyncing) {
      handleSync();
    }
  }, [isOnline, handleSync]);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setSyncResult(null);
    setIsSyncing(true);
    try {
      const synced = await performMasterSync();
      await refreshPendingLogs();
      if (synced === 0) {
        setSyncResult('empty');
      } else {
        setSyncResult('success');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      setSyncResult('fail');
    } finally {
      setIsSyncing(false);
      // Clear the result badge after 4 seconds
      setTimeout(() => setSyncResult(null), 4000);
    }
  }, [isSyncing, setIsSyncing, refreshPendingLogs]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* HEADER */}
        <View style={styles.header}>
          <Animated.View entering={FadeInUp.delay(0)}>
            <View style={styles.headerTitleRow}>
              <ShieldCheck size={20} color="#171717" />
              <Text style={styles.headerTitle}>Operations</Text>
            </View>
            <Text style={styles.headerSubtitle}>SECURE OFFLINE AUTH</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(50)} style={styles.headerRight}>
            <View style={styles.networkPill}>
              <View style={[styles.dot, { backgroundColor: isOnline ? '#34d399' : '#a3a3a3' }]} />
              <Text style={styles.networkText}>{isOnline ? 'NETWORK' : 'OFFLINE'}</Text>
            </View>
            <View style={styles.avatar}>
              <User size={20} color="#a3a3a3" strokeWidth={2} />
            </View>
          </Animated.View>
        </View>

        <View style={styles.contentGrid}>
          {/* MAIN ACTION */}
          <Animated.View entering={FadeInUp.delay(100)}>
          <TouchableOpacity
            style={styles.primaryCard}
            onPress={() => {
              navigation.navigate('FaceScan');
            }}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.primaryLabelRow}>
                <Fingerprint size={20} color="#a3a3a3" strokeWidth={1.5} />
                <Text style={styles.primaryLabel}>PRIMARY ACTION</Text>
              </View>
              <Text style={styles.primaryTitle}>Employee Verification</Text>
              <Text style={styles.primarySub}>Offline Face & Liveness Detection</Text>
            </View>
            <View style={styles.primaryIconBox}>
              <ScanFace size={28} color="#fff" strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
          </Animated.View>

          {/* STATS GRID */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.statsRow}>
            {/* Local Users Card */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.iconCircle}>
                  <Users size={16} color="#525252" strokeWidth={2} />
                </View>
                <View style={styles.liveBadge}>
                  <Activity size={12} color="#525252" />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <View style={styles.statBody}>
                <Text style={styles.statNumber}>{userCount}</Text>
                <Text style={styles.statLabel}>LOCAL USERS</Text>
              </View>
            </View>

            {/* Offline Queue Card */}
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.iconCircle}>
                  <Server size={16} color="#525252" strokeWidth={2} />
                </View>
                {pendingSyncCount > 0 && <View style={styles.pulseDot} />}
              </View>
              <View style={styles.statBody}>
                <Text style={styles.statNumber}>{pendingSyncCount}</Text>
                <Text style={styles.statLabel}>OFFLINE QUEUE</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: pendingSyncCount > 0 ? '60%' : '0%' }]} />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* SYNC & PURGE CARD */}
          <Animated.View entering={FadeInUp.delay(250)}>
            <View style={styles.syncCard}>
              {/* Card Header */}
              <View style={styles.syncHeader}>
                <View style={styles.syncTitleRow}>
                  <View style={styles.syncIconCircle}>
                    <RefreshCw size={16} color="#525252" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.syncTitle}>SYNC & PURGE</Text>
                    <Text style={styles.syncSubtitle}>
                      {pendingSyncCount > 0
                        ? `${pendingSyncCount} log${pendingSyncCount !== 1 ? 's' : ''} pending sync`
                        : 'All logs synced'}
                    </Text>
                  </View>
                </View>
                {/* Status indicator */}
                <View style={[
                  styles.syncStatusBadge,
                  { backgroundColor: isOnline ? '#ecfdf5' : '#fafafa',
                    borderColor: isOnline ? '#d1fae5' : '#e5e5e5' },
                ]}>
                  {isOnline
                    ? <Activity size={10} color="#059669" />
                    : <CloudOff size={10} color="#a3a3a3" />}
                  <Text style={[
                    styles.syncStatusText,
                    { color: isOnline ? '#059669' : '#a3a3a3' },
                  ]}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>

              {/* Last Sync Time */}
              {lastSyncTime && (
                <Text style={styles.lastSyncText}>Last synced: {lastSyncTime}</Text>
              )}

              {/* Result Feedback */}
              {syncResult && (
                <View style={[
                  styles.syncFeedback,
                  syncResult === 'success' && { backgroundColor: '#ecfdf5', borderColor: '#d1fae5' },
                  syncResult === 'empty' && { backgroundColor: '#fafafa', borderColor: '#e5e5e5' },
                  syncResult === 'fail' && { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
                ]}>
                  {syncResult === 'success' && <CheckCircle size={14} color="#059669" />}
                  {syncResult === 'empty' && <CheckCircle size={14} color="#737373" />}
                  {syncResult === 'fail' && <AlertCircle size={14} color="#dc2626" />}
                  <Text style={[
                    styles.syncFeedbackText,
                    syncResult === 'success' && { color: '#059669' },
                    syncResult === 'empty' && { color: '#737373' },
                    syncResult === 'fail' && { color: '#dc2626' },
                  ]}>
                    {syncResult === 'success' && 'Sync complete — logs purged'}
                    {syncResult === 'empty' && 'No pending logs to sync'}
                    {syncResult === 'fail' && 'Sync failed — will retry'}
                  </Text>
                </View>
              )}

              {/* Sync Button */}
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  (isSyncing || !isOnline) && styles.syncButtonDisabled,
                ]}
                onPress={handleSync}
                disabled={isSyncing || !isOnline}
                activeOpacity={0.8}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#a3a3a3" />
                ) : (
                  <RefreshCw size={14} color={isOnline ? '#fff' : '#737373'} strokeWidth={2.5} />
                )}
                <Text style={[
                  styles.syncButtonText,
                  !isOnline && { color: '#737373' },
                ]}>
                  {isSyncing ? 'Syncing…' : 'Sync & Purge'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* SYSTEM STATUS PILLS */}
          <Animated.View entering={FadeInUp.delay(350)} style={styles.pillsRow}>
            <View style={styles.sysPill}>
              <Cpu size={14} color="#525252" />
              <Text style={styles.sysPillText}>CONFIG: READY</Text>
            </View>
            <View style={styles.sysPill}>
              <Camera size={14} color="#525252" />
              <Text style={styles.sysPillText}>CAM: ACTIVE</Text>
            </View>
            <View style={styles.sysPill}>
              <ShieldCheck size={14} color="#525252" />
              <Text style={styles.sysPillText}>SYS: SECURED</Text>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
      
      <Dock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 16,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#171717', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontWeight: '600', color: '#737373', letterSpacing: 2, marginLeft: 28 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  networkPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#e5e5e5',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  networkText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#525252' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center',
  },
  contentGrid: { paddingHorizontal: 24, paddingBottom: 24, gap: 24 },
  primaryCard: {
    backgroundColor: '#171717', borderRadius: 24, padding: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  primaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  primaryLabel: { fontSize: 10, fontWeight: '700', color: '#a3a3a3', letterSpacing: 2 },
  primaryTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  primarySub: { fontSize: 11, fontWeight: '500', color: '#a3a3a3', letterSpacing: 0.5 },
  primaryIconBox: {
    width: 56, height: 56, borderRadius: 20, backgroundColor: '#262626',
    borderWidth: 1, borderColor: '#404040', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fafafa', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 18, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: '#e5e5e5',
  },
  liveText: { fontSize: 9, fontWeight: '700', color: '#525252', letterSpacing: 1 },
  statBody: { marginTop: 4 },
  statNumber: { fontSize: 30, fontWeight: '700', color: '#171717', letterSpacing: -1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#737373', letterSpacing: 1.5, marginTop: 2 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#737373', marginTop: 4, marginRight: 4 },
  progressBar: { height: 4, backgroundColor: '#e5e5e5', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#525252', borderRadius: 2 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  sysPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fafafa', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e5e5',
  },
  sysPillText: { fontSize: 9, fontWeight: '700', color: '#525252', letterSpacing: 1 },

  /* ── Sync & Purge Card ── */
  syncCard: {
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: 24,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  syncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#404040',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a3a3a3',
    letterSpacing: 2,
    marginBottom: 2,
  },
  syncSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4d4d4',
    letterSpacing: -0.2,
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  syncStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lastSyncText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#737373',
    marginTop: 12,
    marginLeft: 56,
  },
  syncFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  syncFeedbackText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#404040',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  syncButtonDisabled: {
    backgroundColor: '#262626',
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
