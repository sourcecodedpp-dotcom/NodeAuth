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
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FaceScan'>;

const { height: windowHeight } = Dimensions.get('window');

export function FaceScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Animation values
  const laserPos = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    loadModels().then(() => setModelsLoaded(true));

    // Sweeping laser
    laserPos.value = withRepeat(
      withSequence(
        withTiming(280, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserPos.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value
  }));

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
      <View style={{ flex: 1, position: 'relative' }}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
        
        {/* Sci-fi overlay */}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.overlay}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />

            {/* Center oval with animated glow and laser */}
            <View style={styles.scanArea}>
              <Animated.View style={[styles.ovalFrame, glowStyle]} />
              
              <View style={styles.laserContainer}>
                <Animated.View style={[styles.laser, laserStyle]}>
                  <LinearGradient
                    colors={['rgba(0,255,204,0)', 'rgba(0,255,204,0.8)', 'rgba(0,255,204,0)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Status text */}
            <View style={styles.statusBox}>
              <View style={[styles.dot, { backgroundColor: modelsLoaded ? '#00ffcc' : '#ff9900' }]} />
              <Text style={styles.statusText}>
                {!modelsLoaded ? 'Loading AI Models...' : scanning ? 'Processing...' : 'Position face in oval'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureBtn, scanning && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={scanning || !modelsLoaded}
        >
          {scanning
            ? <ActivityIndicator color="#000" size="small" />
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

const CORNER = 30;
const BORDER = 4;

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
  scanArea: {
    width: 220, height: 280,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative'
  },
  ovalFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 120,
    borderWidth: 2, borderColor: '#00ffcc',
    shadowColor: '#00ffcc', shadowOpacity: 0.8, shadowRadius: 20,
  },
  laserContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 120,
    overflow: 'hidden',
  },
  laser: {
    width: '100%',
    height: 3,
    backgroundColor: '#00ffcc',
    shadowColor: '#00ffcc',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  statusBox: {
    position: 'absolute', bottom: 40,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(0,255,204,0.3)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { color: '#00ffcc', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
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
