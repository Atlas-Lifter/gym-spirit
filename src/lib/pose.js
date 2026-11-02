// 휴대폰 안에서 관절 위치 읽기 — Google MediaPipe Pose Landmarker (Apache-2.0)
// 엔진(wasm)과 모델은 처음 쓸 때 CDN 에서 한 번 받는다 (약 10~20MB, 이후 브라우저 캐시). 영상은 밖으로 나가지 않는다
const VERSION = '1.1.0';
const BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// 관절 번호 (MediaPipe 33점 중 쓰는 것)
export const LM = {
  nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28, lHeel: 29, rHeel: 30, lToe: 31, rToe: 32,
};
// 뼈대 선
export const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [28, 30], [30, 32],
];

let landmarker = null;
let lastTs = 0;
// VIDEO 모드에 넘길 시각: 화면이 여러 곳이어도 늘 앞으로만 가게 (MediaPipe 요구)
export const nextTs = () => { lastTs = Math.max(lastTs + 1, performance.now()); return lastTs; };
let mode = null;

// runningMode: 'VIDEO'(카메라) | 'IMAGE'(사진). GPU 가 안 되면 CPU 로
export async function loadPose(runningMode = 'VIDEO') {
  if (!landmarker) {
    landmarker = (async () => {
      const vision = await import(/* @vite-ignore */ `${BASE}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${BASE}/wasm`);
      const make = (delegate) => vision.PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode, numPoses: 1,
        minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      mode = runningMode;
      return make('GPU').catch(() => make('CPU'));
    })().catch((e) => { landmarker = null; throw e; });
  }
  const lm = await landmarker;
  if (mode !== runningMode) { await lm.setOptions({ runningMode }); mode = runningMode; }
  return lm;
}
