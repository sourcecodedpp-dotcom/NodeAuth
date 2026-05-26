import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { extractFaceEmbedding, loadModels } from '../lib/vision';
import { saveUser } from '../lib/db';
import { TopBar } from '../components/TopBar';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'field_personnel' | 'admin'>('field_personnel');
  const [step, setStep] = useState<'form' | 'camera' | 'saving'>('form');
  const [saved, setSaved] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    loadModels();
  }, []);

  async function startCapture() {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter the personnel name.');
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setStep('camera');
  }

  async function captureAndSave() {
    if (!cameraRef.current) return;
    setStep('saving');
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const base64 = `data:image/jpeg;base64,${photo?.base64}`;
      const embedding = await extractFaceEmbedding(base64);

      const userId = `USER-${Date.now()}`;
      await saveUser({
        id: userId,
        name: name.trim(),
        role,
        embeddingId: `emb-${userId}`,
        createdAt: Date.now(),
      }, embedding);

      setSaved(true);
    } catch (err: any) {
      Alert.alert('Enrollment Failed', err.message || 'Could not process face. Please try again.');
      setStep('camera');
    }
  }

  if (saved) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Enrolled!</Text>
          <Text style={styles.successSub}>{name} has been successfully registered.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.doneBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.anotherBtn} onPress={() => { setName(''); setStep('form'); setSaved(false); }}>
            <Text style={styles.anotherText}>Enroll Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'camera' || step === 'saving') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.camOverlay}>
            <View style={styles.ovalFrame} />
            <Text style={styles.camLabel}>Center face in oval</Text>
            <Text style={styles.camName}>{name}</Text>
          </View>
        </CameraView>
        <View style={styles.camControls}>
          <TouchableOpacity
            style={[styles.captureBtn, step === 'saving' && { opacity: 0.5 }]}
            onPress={captureAndSave}
            disabled={step === 'saving'}
          >
            {step === 'saving'
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.captureBtnText}>Capture & Enroll</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('form')}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Enroll Personnel" showBack />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rajesh Kumar"
              placeholderTextColor="#aaa"
              autoFocus
            />

            <Text style={styles.label}>ROLE</Text>
            <View style={styles.roleRow}>
              {(['field_personnel', 'admin'] as const).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                    {r === 'field_personnel' ? '👷 Field Personnel' : '🔑 Admin'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.enrollBtn} onPress={startCapture}>
              <Text style={styles.enrollBtnText}>📷  Proceed to Face Capture</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#999', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 14,
    padding: 14, fontSize: 16, color: '#000',
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleBtn: {
    flex: 1, padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  roleBtnText: { fontSize: 12, fontWeight: '600', color: '#666' },
  roleBtnTextActive: { color: '#fff' },
  enrollBtn: {
    backgroundColor: '#000', borderRadius: 20, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
  },
  enrollBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Camera
  camera: { flex: 1 },
  camOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ovalFrame: {
    width: 220, height: 280, borderRadius: 120,
    borderWidth: 2.5, borderColor: '#00ffcc',
    shadowColor: '#00ffcc', shadowOpacity: 0.6, shadowRadius: 20, marginBottom: 20,
  },
  camLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  camName: { color: '#00ffcc', fontSize: 18, fontWeight: '700', marginTop: 4 },
  camControls: { backgroundColor: '#000', padding: 24, gap: 12 },
  captureBtn: {
    backgroundColor: '#00ffcc', borderRadius: 20, paddingVertical: 18, alignItems: 'center',
  },
  captureBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  cancelText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 14 },
  // Success
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 30, fontWeight: '700', color: '#000' },
  successSub: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 20 },
  doneBtn: { backgroundColor: '#000', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 12 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  anotherBtn: { paddingVertical: 10 },
  anotherText: { color: '#999', fontSize: 14 },
});
