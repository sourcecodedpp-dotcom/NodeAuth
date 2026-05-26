import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getAllUsers, saveAuthLog } from '../lib/db';
import { computeSimilarity, verifyLivenessChallenge, generateRandomChallenge } from '../lib/vision';
import { useAppStore } from '../store';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing, 
  useAnimatedStyle 
} from 'react-native-reanimated';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Liveness'>;
type Route = RouteProp<RootStackParamList, 'Liveness'>;

type Phase = 'recognizing' | 'challenge' | 'success' | 'failed';

export function LivenessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { embedding, capturedAt } = route.params;

  const { refreshPendingLogs } = useAppStore();
  const [permission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('recognizing');
  const [matchedUser, setMatchedUser] = useState<{ name: string; id: string; score: number } | null>(null);
  const [challenge, setChallenge] = useState(generateRandomChallenge());

  // Spin animation for loaders
  const spinVal = useSharedValue(0);
  
  useEffect(() => {
    spinVal.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinVal.value}deg` }]
  }));
  const spinStyleReverse = useAnimatedStyle(() => ({
    transform: [{ rotate: `-${spinVal.value}deg` }]
  }));

  useEffect(() => {
    runRecognition();
  }, []);

  async function runRecognition() {
    await new Promise(r => setTimeout(r, 1200));

    const users = await getAllUsers();
    const queryVec = new Float32Array(embedding);

    let highestScore = 0;
    let matched = null;

    for (const user of users) {
      if (!user.vector) continue;
      const storedVec = new Float32Array(user.vector as unknown as number[]);
      const score = computeSimilarity(queryVec, storedVec);
      if (score > 0.55 && score > highestScore) {
        highestScore = score;
        matched = { name: user.name, id: user.id, score };
      }
    }

    if (!matched) {
      await saveAuthLog({
        id: Date.now().toString(),
        userId: 'UNKNOWN',
        timestamp: capturedAt,
        status: 'failed',
        confidenceScore: 0,
      });
      await refreshPendingLogs();
      setPhase('failed');
      setTimeout(() => navigation.navigate('Dashboard'), 2500);
      return;
    }

    setMatchedUser(matched);
    await new Promise(r => setTimeout(r, 800));
    setPhase('challenge');
    runChallenge(matched);
  }

  async function runChallenge(matched: { name: string; id: string; score: number }) {
    const result = await verifyLivenessChallenge(challenge.id);

    await saveAuthLog({
      id: Date.now().toString(),
      userId: matched.id,
      timestamp: capturedAt,
      status: result.passed ? 'success' : 'liveness_failed',
      confidenceScore: matched.score,
    });
    await refreshPendingLogs();

    if (result.passed) {
      setPhase('success');
    } else {
      setPhase('failed');
    }
    setTimeout(() => navigation.navigate('Dashboard'), 2500);
  }

  if (!permission?.granted) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Camera */}
      <View style={StyleSheet.absoluteFill}>
        <CameraView style={{ flex: 1 }} facing="front" />
      </View>

      {/* Top Bar matching web MobileContainer structure */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liveness Test</Text>
      </View>

      {/* Floating Card at Bottom */}
      <View style={styles.bottomContainer}>
        <Animated.View entering={FadeInUp.springify().mass(0.8)} style={styles.cardContainer}>
          <BlurView intensity={80} tint="light" style={styles.glassCard}>
            
            {(phase === 'recognizing' || phase === 'challenge') && (
              <View style={styles.contentWrapper}>
                {/* Loader Rings */}
                <View style={styles.loaderContainer}>
                  <Animated.View style={[styles.outerRing, spinStyle]} />
                  <Animated.View style={[styles.innerRing, spinStyleReverse]} />
                </View>

                <Text style={styles.title}>Security Protocol</Text>
                <Text style={styles.subtitle}>
                  {phase === 'recognizing' ? 'Analyzing biometric feed...' : 'Awaiting physical confirmation'}
                </Text>

                {phase === 'challenge' && (
                  <Animated.View entering={FadeInDown} style={styles.challengeBox}>
                    <Text style={styles.challengeText}>{challenge.label}</Text>
                  </Animated.View>
                )}

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Analyzing Feed</Text>
                </View>
              </View>
            )}

            {phase === 'success' && (
              <Animated.View entering={FadeInDown.springify()} style={styles.contentWrapper}>
                <View style={styles.successIconBox}>
                  <Text style={styles.iconText}>✓</Text>
                </View>
                <Text style={styles.title}>Verified</Text>
                {matchedUser && (
                  <Text style={styles.matchName}>{matchedUser.name}</Text>
                )}
                <View style={styles.accessBadge}>
                  <Text style={styles.accessBadgeText}>ACCESS GRANTED</Text>
                </View>
              </Animated.View>
            )}

            {phase === 'failed' && (
              <Animated.View entering={FadeInDown.springify()} style={styles.contentWrapper}>
                <View style={styles.failIconBox}>
                  <Text style={styles.iconText}>✗</Text>
                </View>
                <Text style={styles.title}>Challenge Failed</Text>
                <Text style={styles.subtitle}>Attempt securely logged.</Text>
              </Animated.View>
            )}

          </BlurView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    width: '100%', maxWidth: 400,
    borderRadius: 44,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  glassCard: {
    padding: 32,
    alignItems: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  loaderContainer: {
    width: 64, height: 64,
    marginBottom: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: '100%', height: '100%',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    borderTopColor: 'rgba(0,0,0,0.4)',
  },
  innerRing: {
    position: 'absolute',
    width: 32, height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 6, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13, color: '#666', marginBottom: 20,
  },
  challengeBox: {
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 20, paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  challengeText: {
    color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#000',
  },
  statusText: {
    fontSize: 10, color: '#666', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase',
  },
  successIconBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  failIconBox: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  iconText: {
    fontSize: 40, color: '#fff',
  },
  matchName: {
    fontSize: 16, fontWeight: '500', color: '#666', marginBottom: 12,
  },
  accessBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8,
  },
  accessBadgeText: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#000',
  },
});
