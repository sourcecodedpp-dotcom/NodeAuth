import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { extractFaceEmbedding, loadModels } from '../lib/vision';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FaceScan'>;

export function FaceScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
  }, []);

  async function handleCapture() {
    if (!cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const base64 = `data:image/jpeg;base64,${photo?.base64}`;
      const embedding = await extractFaceEmbedding(base64);
      navigation.navigate('Liveness', {
        embedding: Array.from(embedding),
        capturedAt: Date.now()
      });
    } catch (err: any) {
      Alert.alert('Face Detection Failed', err.message || 'Could not detect a face. Please try again.');
    } finally {
      setScanning(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>FaceGuard needs camera access for facial recognition.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        {/* Sci-fi overlay */}
        <View style={styles.overlay}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />

          {/* Center oval */}
          <View style={styles.ovalFrame} />

          {/* Status text */}
          <View style={styles.statusBox}>
            <View style={[styles.dot, { backgroundColor: modelsLoaded ? '#00ffcc' : '#ff9900' }]} />
            <Text style={styles.statusText}>
              {!modelsLoaded ? 'Loading AI Models...' : scanning ? 'Processing...' : 'Position face in oval'}
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureBtn, scanning && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={scanning || !modelsLoaded}
        >
          {scanning
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.captureBtnText}>Scan Face</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  corner: {
    position: 'absolute', width: CORNER, height: CORNER, borderColor: '#00ffcc',
  },
  tl: { top: 60, left: 40, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 60, right: 40, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 80, left: 40, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 80, right: 40, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  ovalFrame: {
    width: 220, height: 280, borderRadius: 120,
    borderWidth: 2, borderColor: 'rgba(0,255,204,0.4)',
    shadowColor: '#00ffcc', shadowOpacity: 0.6, shadowRadius: 20,
  },
  statusBox: {
    position: 'absolute', bottom: 40,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  controls: {
    backgroundColor: '#000', padding: 24, paddingBottom: 40, gap: 12,
  },
  captureBtn: {
    backgroundColor: '#00ffcc', borderRadius: 20, paddingVertical: 18,
    alignItems: 'center',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  permSub: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  permBtn: { backgroundColor: '#00ffcc', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnText: { color: '#000', fontWeight: '700' },
});
