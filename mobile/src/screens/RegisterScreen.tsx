import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { extractFaceEmbedding, loadModels } from '../lib/vision';
import { saveUser } from '../lib/db';
import { TopBar } from '../components/TopBar';
import { Dock } from '../components/Dock';
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const { width, height } = Dimensions.get('window');

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Position face in the frame');
  const [facingMode, setFacingMode] = useState<CameraType>('front');
  const [isSuccess, setIsSuccess] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'front' ? 'back' : 'front');
  }, []);

  const handleRegister = useCallback(async () => {
    if (!name.trim()) {
      setStatus('Please enter a name first.');
      return;
    }
    
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }

    if (!cameraRef.current) return;

    setIsProcessing(true);
    setStatus('Loading System...');

    try {
      setStatus('Extracting Features...');
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      const base64 = `data:image/jpeg;base64,${photo?.base64}`;
      const embedding = await extractFaceEmbedding(base64);

      const userId = `EMP-${Math.floor(Math.random() * 90000) + 10000}`;
      
      await saveUser({
        id: userId,
        name: name.trim(),
        role: 'field_personnel',
        embeddingId: `emb-${userId}`,
        createdAt: Date.now(),
      }, embedding);

      setStatus('Registration Complete');
      setIsSuccess(true);
      
      setTimeout(() => {
        navigation.navigate('Dashboard');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatus('Registration error.');
      setIsProcessing(false);
    }
  }, [name, permission, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Register Personnel" />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          
          {/* Top Half: Camera */}
          <View style={styles.cameraContainer}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.camera} facing={facingMode} />
            ) : (
              <View style={styles.cameraPlaceholder} />
            )}
            
            {/* Camera Overlay */}
            <View style={styles.cameraOverlay}>
              {/* Toggle Camera Button */}
              <TouchableOpacity style={styles.toggleBtn} onPress={toggleCamera}>
                <Text style={styles.toggleBtnText}>Flip</Text>
              </TouchableOpacity>

              {/* Dashed Circle */}
              <View style={styles.dashedCircle} />

              {/* Scanner Line Animation */}
              {isProcessing && !isSuccess && (
                <View style={styles.scannerLineWrapper}>
                  <ScannerLine />
                </View>
              )}

              {/* Success Checkmark */}
              {isSuccess && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.successCircle}>
                  <Text style={styles.successCheck}>✓</Text>
                </Animated.View>
              )}

              {/* Status Pill */}
              <View style={[styles.statusPill, isSuccess && styles.statusPillSuccess]}>
                <Text style={[styles.statusText, isSuccess && styles.statusTextSuccess]}>{status}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Half: Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#999"
                editable={!isProcessing}
              />
              <Text style={styles.inputHint}>
                Ensure the personnel's face is clearly visible without sunglasses or hats.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.enrollBtn, (isProcessing || !name.trim()) && styles.enrollBtnDisabled]}
              onPress={handleRegister}
              disabled={isProcessing || !name.trim()}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.enrollBtnText}>Enroll Personnel</Text>
              )}
            </TouchableOpacity>
          </View>
          
        </View>
      </KeyboardAvoidingView>

      <Dock />
    </SafeAreaView>
  );
}

// Scanner Line Animation Component
function ScannerLine() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(height * 0.4, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={[styles.scannerLine, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingBottom: 80 }, // Leave room for dock
  
  // Camera Section
  cameraContainer: {
    height: height * 0.45,
    width: '100%',
    backgroundColor: '#f5f5f5',
    position: 'relative',
    overflow: 'hidden',
  },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, backgroundColor: '#e5e5e5' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  toggleBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  toggleBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dashedCircle: {
    width: width * 0.6, height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  scannerLineWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scannerLine: {
    width: '100%', height: 2,
    backgroundColor: '#60a5fa',
    shadowColor: '#60a5fa', shadowOpacity: 1, shadowRadius: 10, elevation: 5,
  },
  successCircle: {
    position: 'absolute',
    width: width * 0.6, height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  successCheck: { fontSize: 64, color: '#fff', fontWeight: 'bold' },
  statusPill: {
    position: 'absolute', bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  statusTextSuccess: { color: '#ecfdf5' },

  // Form Section
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'space-between',
  },
  inputWrapper: {
    marginTop: 20,
  },
  input: {
    borderBottomWidth: 1, borderBottomColor: '#e5e5e5',
    paddingVertical: 12, fontSize: 18, color: '#000', fontWeight: '500',
  },
  inputHint: {
    color: '#999', fontSize: 12, marginTop: 12, lineHeight: 18,
  },
  enrollBtn: {
    backgroundColor: '#737373', // Gray to match design
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  enrollBtnDisabled: { opacity: 0.5 },
  enrollBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
