import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { extractFaceEmbedding, loadModels } from '../lib/vision';
import { ScanFace, SwitchCamera } from 'lucide-react-native';
import { TopBar } from '../components/TopBar';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FaceScan'>;

const { height: windowHeight } = Dimensions.get('window');

export function FaceScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));
  }, []);

  async function handleCapture() {
    if (!cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const base64 = `data:image/jpeg;base64,${photo?.base64}`;
      const embedding = await extractFaceEmbedding(base64);
      if (typeof document !== 'undefined' && document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }
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

  function toggleCamera() {
    setFacing(prev => prev === 'front' ? 'back' : 'front');
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Face Scan" />
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar title="Face Scan" />
      
      {/* Camera Section */}
      <View style={styles.cameraWrapper}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        
        {/* Camera Overlay */}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.overlay}>
            
            {/* Top Indicators */}
            <View style={styles.topOverlay}>
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </View>
              <TouchableOpacity style={styles.switchCamBtn} onPress={toggleCamera}>
                <SwitchCamera color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Corner brackets */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            
            {/* FPS Indicator near bottom right bracket */}
            <View style={styles.fpsBadge}>
              <Text style={styles.fpsText}>FPS: 30</Text>
            </View>

            {/* Center oval */}
            <View style={styles.scanArea}>
              <View style={styles.ovalFrame} />
              <View style={styles.centerDot} />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomSection}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Identity Scan</Text>
          <Text style={styles.subtitle}>Position face in the frame</Text>
        </View>

        <TouchableOpacity
          style={[styles.captureBtn, scanning && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={scanning || !modelsLoaded}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <ScanFace color="#fff" size={20} strokeWidth={1.5} style={{ marginRight: 8 }} />
              <Text style={styles.captureBtnText}>Match Face</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CORNER = 40;
const BORDER = 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  cameraWrapper: {
    height: windowHeight * 0.6,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  topOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 32,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff4444' },
  recText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  switchCamBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  corner: {
    position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff', borderRadius: 12,
  },
  tl: { top: 120, left: 40, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 120, right: 40, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 60, left: 40, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 60, right: 40, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  fpsBadge: {
    position: 'absolute', bottom: 70, right: 55,
  },
  fpsText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  scanArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  ovalFrame: {
    width: 200, height: 260,
    borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  centerDot: {
    position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bottomSection: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#000', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', fontWeight: '400' },
  captureBtn: {
    backgroundColor: '#171717', borderRadius: 28, paddingVertical: 18,
    width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    marginBottom: 20,
  },
  captureBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  captureBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: '#888', fontSize: 14, fontWeight: '500' },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 12 },
  permSub: { color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  permBtn: { backgroundColor: '#171717', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  permBtnText: { color: '#fff', fontWeight: '700' },
});
