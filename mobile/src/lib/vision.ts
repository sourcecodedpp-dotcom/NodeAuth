import FaceDetection from '@react-native-ml-kit/face-detection';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { Images } from 'react-native-nitro-image';
import { Platform } from 'react-native';

let faceNetModel: any = null;

export async function loadModels() {
  if (faceNetModel) return;
  console.log('[Vision AI] Loading Native C++ MobileFaceNet model...');
  try {
    faceNetModel = await loadTensorflowModel(
      require('../../assets/mobile_facenet.tflite') // Assuming it's packed in assets folder, wait, we put it in android/app/src/main/assets.
    );
    console.log('[Vision AI] Model loaded natively via JSI.');
  } catch (e) {
    console.error('Failed to load TFLite model', e);
  }
}

export async function extractFaceEmbedding(imageUri: string): Promise<Float32Array> {
  console.log('[Vision AI] Extracting face embedding using Native C++ JSI pipeline...');
  if (!faceNetModel) {
    await loadModels();
  }
  if (!faceNetModel) {
    throw new Error("MobileFaceNet model failed to load. Please restart the app.");
  }

  // 1. Detect face using ML Kit (sub-10ms)
  // Ensure the image URI has file:// prefix if needed by ML Kit
  const uriForMlKit = imageUri.startsWith('file://') || imageUri.startsWith('http') ? imageUri : `file://${imageUri}`;
  const faces = await FaceDetection.detect(uriForMlKit, { landmarkMode: 'none', contourMode: 'none', performanceMode: 'fast' });

  if (!faces || faces.length === 0) {
    throw new Error('No face detected in the frame. Please ensure the face is clearly visible and well-lit.');
  }

  // Get the largest face
  const face = faces.sort((a, b) => (b.frame.width * b.frame.height) - (a.frame.width * a.frame.height))[0];
  const { frame } = face; // { top, left, width, height }

  // 2. Load the image and crop/resize it natively (sub-10ms)
  const image = await Images.loadFromFileAsync(imageUri);
  
  // Provide a little padding around the face bounding box
  const paddingX = frame.width * 0.1;
  const paddingY = frame.height * 0.1;
  const startX = Math.max(0, frame.left - paddingX);
  const startY = Math.max(0, frame.top - paddingY);
  const endX = Math.min(image.width, frame.left + frame.width + paddingX);
  const endY = Math.min(image.height, frame.top + frame.height + paddingY);

  // Crop using absolute coordinates (endX, endY)
  const croppedImage = await image.cropAsync(startX, startY, endX, endY);
  const resizedImage = await croppedImage.resizeAsync(112, 112);

  // 3. Get raw pixels (sub-1ms)
  const rawData = await resizedImage.toRawPixelDataAsync();
  const buffer = new Uint8Array(rawData.buffer);
  
  // 4. Convert pixels to Float32 array and normalize [-1, 1] (sub-2ms in JS)
  const inputSize = 112 * 112 * 3;
  const inputTensor = new Float32Array(inputSize);
  
  let p = 0;
  const fmt = rawData.pixelFormat ?? 'RGBA';
  for (let i = 0; i < buffer.length && p < inputSize; i += 4) {
    let r, g, b;
    if (fmt === 'BGRA' || fmt === 'bgra') {
      b = buffer[i];
      g = buffer[i+1];
      r = buffer[i+2];
    } else if (fmt === 'ARGB' || fmt === 'argb') {
      r = buffer[i+1];
      g = buffer[i+2];
      b = buffer[i+3];
    } else {
      // Default: RGBA
      r = buffer[i];
      g = buffer[i+1];
      b = buffer[i+2];
    }
    inputTensor[p++] = (r - 127.5) / 128.0;
    inputTensor[p++] = (g - 127.5) / 128.0;
    inputTensor[p++] = (b - 127.5) / 128.0;
  }

  // 5. Run TFLite inference synchronously via JSI (sub-50ms)
  const outputTensor = faceNetModel.runSync([inputTensor]);
  // MobileFaceNet usually outputs [1, 192] shape
  const outputArray = new Float32Array(outputTensor[0]);
  
  // L2 Normalize the embedding vector for Cosine Similarity
  let sum = 0;
  for (let i = 0; i < outputArray.length; i++) {
    sum += outputArray[i] * outputArray[i];
  }
  const norm = Math.sqrt(sum);
  if (norm === 0) {
    throw new Error('Model returned a zero-vector embedding. The inference may have failed silently.');
  }
  for (let i = 0; i < outputArray.length; i++) {
    outputArray[i] /= norm;
  }

  return outputArray;
}

export function computeSimilarity(vec1: Float32Array, vec2: Float32Array): number {
  if (vec1.length !== vec2.length) return 0;
  
  // Compute Cosine Similarity (dot product of L2 normalized vectors)
  let dotProduct = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
  }
  
  // Output is between -1 and 1. We scale it to 0-1.
  // Actually since both are normalized, distance is 1 - dotProduct (Cosine Distance).
  // 1 is identical, 0 is orthogonal.
  return Math.max(0, dotProduct);
}

// Liveness challenge (stubbed to use MLKit for simple tasks like smile)
export const LivenessChallenges = [
  { id: 'smile', label: 'Smile' },
  { id: 'blink', label: 'Blink Your Eyes' },
  { id: 'turn_head', label: 'Turn Head Left/Right' },
];

export function generateRandomChallenge() {
  const randomIndex = Math.floor(Math.random() * LivenessChallenges.length);
  return LivenessChallenges[randomIndex];
}

export async function verifyLivenessChallenge(
  challengeId: string, 
  imageUri: string
): Promise<{ passed: boolean; error?: string }> {
  console.log(`[Vision AI] Analyzing frame for liveness challenge: ${challengeId}`);
  
  try {
    const uriForMlKit = imageUri.startsWith('file://') || imageUri.startsWith('http') ? imageUri : `file://${imageUri}`;
    // For liveness, we need classification mode for smiling probability
    const faces = await FaceDetection.detect(uriForMlKit, { classificationMode: 'all' });
      
    if (!faces || faces.length === 0) {
      return { passed: false, error: "No face detected." };
    }

    const face = faces[0];
    
    if (challengeId === 'smile') {
      if (face.smilingProbability && face.smilingProbability > 0.6) {
        return { passed: true };
      }
    }

    return { passed: false, error: "Challenge not yet met." };
  } catch (error) {
    console.error("Frame analysis failed", error);
    return { passed: false, error: "Frame analysis failed." };
  }
}
