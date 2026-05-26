// Vision AI - React Native implementation
// Uses face detection mock for Expo Go compatibility

export async function loadModels() {
  console.log('[Vision AI] Models ready (offline on-device engine).');
}

export async function extractFaceEmbedding(imageBase64: string): Promise<Float32Array> {
  console.log('[Vision AI] Abstracting face mesh to 128D embedding...');
  // Simulating 128D offline extraction for Expo Go compatibility
  await new Promise(r => setTimeout(r, 600));
  return new Float32Array(128).fill(Math.random());
}

export function computeSimilarity(vec1: Float32Array, vec2: Float32Array): number {
  // Euclidean distance mock
  let distance = 0;
  for (let i = 0; i < vec1.length; i++) {
    distance += Math.pow(vec1[i] - vec2[i], 2);
  }
  distance = Math.sqrt(distance);
  return Math.max(0, 1 - distance);
}

export const LivenessChallenges = [
  { id: 'turn_left', label: 'Turn head slowly to the left' },
  { id: 'turn_right', label: 'Turn head slowly to the right' },
  { id: 'smile', label: 'Smile' }
];

export function generateRandomChallenge() {
  return LivenessChallenges[Math.floor(Math.random() * LivenessChallenges.length)];
}

// React Native doesn't have HTMLVideoElement, so we simulate the challenge verification
// by processing camera frame intervals or simulating a successful scan.
export async function verifyLivenessChallenge(
  challengeId: string, 
  onLandmarks?: (pts: any[], dims: {width: number, height: number}) => void
): Promise<{ passed: boolean; error?: string }> {
  console.log(`[Vision AI] Analyzing stream for challenge: ${challengeId}`);
  
  return new Promise((resolve) => {
    let frameCount = 0;
    const maxFrames = 150; 
    
    // Simulate generating landmark points for the sci-fi UI
    const checkFrame = () => {
      if (frameCount >= 60) {
        resolve({ passed: true });
        return;
      }
      
      if (onLandmarks) {
        // Generate mock face mesh points for the UI to draw
        const pts = [];
        for (let i=0; i<68; i++) {
          pts.push({
            x: 100 + Math.random() * 100,
            y: 100 + Math.random() * 100
          });
        }
        onLandmarks(pts, { width: 300, height: 400 });
      }
      
      frameCount++;
      setTimeout(checkFrame, 33); // 30fps
    };
    
    checkFrame();
  });
}
