import * as faceapi from '@vladmandic/face-api';

export async function loadModels() {
  console.log('[Vision AI] Loading Face API models from local storage...');
  const modelUrl = '/models';
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
  ]);
  console.log('[Vision AI] Models loaded successfully.');
}

export async function extractFaceEmbedding(imageBase64: string): Promise<Float32Array> {
  console.log('[Vision AI] Abstracting face mesh to 128D embedding...');
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
          
        if (detection) {
          resolve(detection.descriptor as Float32Array);
        } else {
          reject(new Error("No face detected in the frame. Please try again."));
        }
      } catch(err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for processing."));
    img.src = imageBase64;
  });
}

export function computeSimilarity(vec1: Float32Array, vec2: Float32Array): number {
  // Compute euclidean distance
  const distance = faceapi.euclideanDistance(vec1, vec2);
  
  // Convert distance to similarity score (0 to 1)
  // Distance usually ranges from 0 (perfect match) to ~1.0 for different people
  // We'll normalize it so > 0.8 is a good match.
  const similarity = Math.max(0, 1 - distance);
  return similarity;
}

export const LivenessChallenges = [
  { id: 'turn_left', label: 'Turn head slowly to the left' },
  { id: 'turn_right', label: 'Turn head slowly to the right' },
  { id: 'smile', label: 'Smile' }
];

export function generateRandomChallenge() {
  return LivenessChallenges[Math.floor(Math.random() * LivenessChallenges.length)];
}

// Function to calculate Eye Aspect Ratio (EAR)
function calculateEAR(pts: faceapi.Point[], startIndex: number): number {
  const v1 = faceapi.euclideanDistance([pts[startIndex + 1].x, pts[startIndex + 1].y], [pts[startIndex + 5].x, pts[startIndex + 5].y]);
  const v2 = faceapi.euclideanDistance([pts[startIndex + 2].x, pts[startIndex + 2].y], [pts[startIndex + 4].x, pts[startIndex + 4].y]);
  const h = faceapi.euclideanDistance([pts[startIndex].x, pts[startIndex].y], [pts[startIndex + 3].x, pts[startIndex + 3].y]);
  return (v1 + v2) / (2.0 * h);
}

// Function to calculate Mouth Aspect Ratio (MAR)
function calculateMAR(pts: faceapi.Point[]): number {
  // Inner mouth landmarks: 60 to 67 in the 68-point system
  const v = faceapi.euclideanDistance([pts[62].x, pts[62].y], [pts[66].x, pts[66].y]);
  const h = faceapi.euclideanDistance([pts[60].x, pts[60].y], [pts[64].x, pts[64].y]);
  return v / h;
}

export async function verifyLivenessChallenge(
  challengeId: string, 
  videoElement: HTMLVideoElement,
  onLandmarks?: (pts: faceapi.Point[], dims: {width: number, height: number}) => void
): Promise<{ passed: boolean; error?: string }> {
  console.log(`[Vision AI] Analyzing stream for challenge: ${challengeId}`);
  
  return new Promise((resolve) => {
    let frameCount = 0;
    const maxFrames = 150; // Approx 5 seconds at 30fps
    let passed = false;
    
    // Baselines for relative movement
    let initialNoseX = -1;
    let baselineEAR = -1;
    let baselineMAR = -1;

    const checkFrame = async () => {
      if (frameCount >= maxFrames) {
        resolve({ passed: false, error: 'Challenge time expired. Please try again.' });
        return;
      }
      if (passed) {
        resolve({ passed: true });
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
        if (detection) {
          const landmarks = detection.landmarks;
          const pts = landmarks.positions;
          
          if (onLandmarks) {
            onLandmarks(pts, { width: videoElement.videoWidth, height: videoElement.videoHeight });
          }

          if (initialNoseX === -1) initialNoseX = pts[30].x; // Nose tip is 30
          
          const currentEAR = (calculateEAR(pts, 36) + calculateEAR(pts, 42)) / 2; // Left eye starts at 36, Right eye starts at 42
          if (baselineEAR === -1) baselineEAR = currentEAR;

          const currentMAR = calculateMAR(pts);
          if (baselineMAR === -1) baselineMAR = currentMAR;

          switch (challengeId) {
            case 'blink':
              // EAR drops significantly during a blink (relative check and absolute check)
              if (currentEAR < baselineEAR * 0.75 || currentEAR < 0.18) {
                passed = true;
              }
              break;
            case 'smile':
              // MAR increases when smiling
              if (currentMAR > baselineMAR * 1.25 || currentMAR > 0.35) {
                passed = true;
              }
              break;
            case 'turn_left':
              // Nose shifts right in the image (since mirrored webcam shows left turn as rightward motion)
              if (pts[30].x > initialNoseX + 15) {
                passed = true;
              }
              break;
            case 'turn_right':
              if (pts[30].x < initialNoseX - 15) {
                passed = true;
              }
              break;
          }
        }
      } catch (err) {
        console.error("Frame processing error", err);
      }
      
      frameCount++;
      requestAnimationFrame(checkFrame);
    };
    
    checkFrame();
  });
}
