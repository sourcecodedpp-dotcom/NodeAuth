import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';
import { TopBar } from '../components/TopBar';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { isOnline, pendingSyncCount, refreshPendingLogs } = useAppStore();

  useEffect(() => {
    refreshPendingLogs();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar title="Dashboard" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isOnline ? 'System Online' : 'Offline Mode'}</Text>
          {pendingSyncCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingSyncCount} pending</Text>
            </View>
          )}
        </View>

        {/* Main Action */}
        <TouchableOpacity
          style={styles.primaryCard}
          onPress={() => navigation.navigate('FaceScan')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryIcon}>🔍</Text>
          <Text style={styles.primaryTitle}>Verify Employee</Text>
          <Text style={styles.primarySub}>Start facial recognition scan</Text>
          <View style={styles.arrow}><Text style={styles.arrowText}>→</Text></View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionTitle}>Enroll</Text>
            <Text style={styles.actionSub}>New personnel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>☁️</Text>
            <Text style={styles.actionTitle}>Sync</Text>
            <Text style={styles.actionSub}>{pendingSyncCount} logs</Text>
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Fully Offline</Text>
          <Text style={styles.infoText}>
            All facial recognition and liveness detection runs entirely on this device using an embedded AI model. No internet is required for authentication.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 20, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#000' },
  badge: { backgroundColor: '#000', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  primaryCard: {
    backgroundColor: '#000', borderRadius: 28, padding: 28, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  primaryIcon: { fontSize: 36, marginBottom: 12 },
  primaryTitle: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  primarySub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  arrow: {
    position: 'absolute', right: 24, bottom: 28,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { color: '#fff', fontSize: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#000' },
  actionSub: { fontSize: 12, color: '#999', marginTop: 2 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#666', lineHeight: 20 },
});
