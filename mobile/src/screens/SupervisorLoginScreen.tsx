import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SupervisorLogin'>;

const SUPERVISOR_PIN = '1234';

export function SupervisorLoginScreen() {
  const navigation = useNavigation<Nav>();
  const { setSupervisorAuthed } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    if (pin === SUPERVISOR_PIN) {
      setSupervisorAuthed(true);
      navigation.replace('Dashboard');
    } else {
      setError('Invalid PIN. Try 1234.');
      setPin('');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔐</Text>
            </View>
            <Text style={styles.title}>Supervisor Access</Text>
            <Text style={styles.subtitle}>Enter your 4-digit PIN to unlock the system</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>SUPERVISOR PIN</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={t => { setPin(t); setError(''); }}
              placeholder="••••"
              placeholderTextColor="rgba(0,0,0,0.25)"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Authenticate</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>Default PIN: 1234</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  badge: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  badgeText: { fontSize: 28 },
  title: { fontSize: 26, fontWeight: '700', color: '#000', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#999', marginBottom: 10 },
  input: {
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 16,
    padding: 16, fontSize: 28, letterSpacing: 12, color: '#000',
    textAlign: 'center', marginBottom: 16,
  },
  error: { color: '#e74c3c', fontSize: 12, textAlign: 'center', marginBottom: 12 },
  button: {
    backgroundColor: '#000', borderRadius: 20, paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  hint: { textAlign: 'center', color: '#aaa', fontSize: 11, marginTop: 24 },
});
