import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getAllUsers, saveAuthLog } from '../lib/db';
import { computeSimilarity, verifyLivenessChallenge, generateRandomChallenge } from '../lib/vision';
import { useAppStore } from '../store';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Liveness'>;
type Route = RouteProp<RootStackParamList, 'Liveness'>;

type Phase = 'recognizing' | 'challenge' | 'success' | 'failed';

export function LivenessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { embedding, capturedAt } = route.params;

  const { refreshPendingLogs } = useAppStore();
  const [phase, setPhase] = useState<Phase>('recognizing');
  const [matchedUser, setMatchedUser] = useState<{ name: string; id: string; score: number } | null>(null);
  const [challenge, setChallenge] = useState(generateRandomChallenge());
  const [message, setMessage] = useState('Analyzing biometric data...');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for scanning
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    runRecognition();
  }, []);

  async function runRecognition() {
    setMessage('Analyzing biometric data...');
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
      setMessage('❌ Face not recognized. Access denied.');
      setPhase('failed');
      return;
    }

    setMatchedUser(matched);
    setMessage(`Identity confirmed: ${matched.name}`);
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
      setMessage(`✅ Welcome, ${matched.name}!`);
      setPhase('success');
    } else {
      setMessage('Liveness check failed. Please try again.');
      setPhase('failed');
    }
  }

  const bgColor = phase === 'success' ? '#022c1a' : phase === 'failed' ? '#2c0202' : '#000';
  const accentColor = phase === 'success' ? '#00ff88' : phase === 'failed' ? '#ff4444' : '#00ffcc';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Sci-fi HUD circle */}
      <View style={styles.hudContainer}>
        <Animated.View style={[styles.hudRing, { borderColor: accentColor, transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.hudInner, { borderColor: `${accentColor}44` }]}>
            {phase === 'recognizing' || phase === 'challenge' ? (
              <ActivityIndicator color={accentColor} size="large" />
            ) : (
              <Text style={[styles.hudIcon, { color: accentColor }]}>
                {phase === 'success' ? '✓' : '✗'}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Decorative dots */}
        {[...Array(8)].map((_, i) => (
          <View
            key={i}
            style={[styles.orbitDot, {
              backgroundColor: accentColor,
              transform: [
                { rotate: `${i * 45}deg` },
                { translateX: 80 },
              ],
            }]}
          />
        ))}
      </View>

      {/* Phase label */}
      <Text style={[styles.phaseLabel, { color: accentColor }]}>
        {phase === 'recognizing' ? 'BIOMETRIC SCAN' :
          phase === 'challenge' ? 'LIVENESS CHECK' :
          phase === 'success' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
      </Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Challenge instruction */}
      {phase === 'challenge' && (
        <View style={[styles.challengeBox, { borderColor: accentColor + '44' }]}>
          <Text style={[styles.challengeLabel, { color: accentColor }]}>CHALLENGE</Text>
          <Text style={styles.challengeText}>{challenge.label}</Text>
        </View>
      )}

      {/* Match info */}
      {matchedUser && phase !== 'recognizing' && (
        <View style={styles.matchInfo}>
          <Text style={styles.matchLabel}>IDENTITY</Text>
          <Text style={styles.matchName}>{matchedUser.name}</Text>
          <Text style={styles.matchScore}>Confidence: {(matchedUser.score * 100).toFixed(1)}%</Text>
        </View>
      )}

      {/* Done button */}
      {(phase === 'success' || phase === 'failed') && (
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: accentColor }]}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={[styles.doneBtnText, { color: phase === 'success' ? '#000' : '#fff' }]}>
            {phase === 'success' ? 'Continue' : 'Try Again'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hudContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  hudRing: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.6, shadowRadius: 20,
  },
  hudInner: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  hudIcon: { fontSize: 56, fontWeight: '300' },
  orbitDot: {
    position: 'absolute', width: 5, height: 5, borderRadius: 2.5,
    opacity: 0.5,
  },
  phaseLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 12,
  },
  message: {
    fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  challengeBox: {
    borderWidth: 1, borderRadius: 20, padding: 20, width: '100%',
    alignItems: 'center', marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  challengeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  challengeText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  matchInfo: {
    alignItems: 'center', marginBottom: 24,
  },
  matchLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 4 },
  matchName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  matchScore: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  doneBtn: {
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 48,
    position: 'absolute', bottom: 60,
  },
  doneBtnText: { fontWeight: '700', fontSize: 15 },
});
