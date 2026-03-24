export type UnityViewMode = 'safety' | 'alarm';
const UNITY_TARGET_GAME_OBJECT = 'App System';

/** GameObject that has `CameraOrbiter` + public `ResetView()` (see SampleScene: Main Camera). */
export function getUnityCameraGameObjectName(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_UNITY_CAMERA_OBJECT) {
    return process.env.NEXT_PUBLIC_UNITY_CAMERA_OBJECT.trim();
  }
  return 'Main Camera';
}

function getUnityInstance(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__unityInstance ?? null;
}

function getUnityIframeWindow(): Window | null {
  if (typeof window === 'undefined') return null;
  const iframe = document.getElementById('unity-iframe') as HTMLIFrameElement | null;
  return iframe?.contentWindow ?? null;
}

/**
 * Send a message to any Unity GameObject (must match the object name in the loaded scene).
 */
export function sendUnityMessageToGameObject(gameObjectName: string, method: string, arg: string) {
  const inst = getUnityInstance();
  if (inst?.SendMessage) {
    inst.SendMessage(gameObjectName, method, arg);
    return true;
  }

  const iframeWindow = getUnityIframeWindow();
  if (!iframeWindow) return false;

  iframeWindow.postMessage(
    {
      type: 'UNITY_HOST_MESSAGE',
      gameObject: gameObjectName,
      method,
      arg,
    },
    '*'
  );
  return true;
}

export function sendUnityMessage(method: string, arg: string) {
  return sendUnityMessageToGameObject(UNITY_TARGET_GAME_OBJECT, method, arg);
}

/** Calls `CameraOrbiter.ResetView()` on the main camera object. */
export function resetUnityCameraView() {
  return sendUnityMessageToGameObject(getUnityCameraGameObjectName(), 'ResetView', '');
}

export function setUnityViewMode(mode: UnityViewMode) {
  return sendUnityMessage('SetViewMode', mode);
}

export function setUnityBreathBpm(bpm: number) {
  // 0 => stop pacing cue
  const safe = Number.isFinite(bpm) ? Math.max(0, Math.min(12, bpm)) : 0;
  return sendUnityMessage('SetBreathBpm', String(safe));
}

export function focusUnityRegion(regionName: string) {
  return sendUnityMessage('FocusOnRegion', regionName);
}

