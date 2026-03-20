export type UnityViewMode = 'safety' | 'alarm';
const UNITY_TARGET_GAME_OBJECT = 'App System';

function getUnityInstance(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__unityInstance ?? null;
}

function getUnityIframeWindow(): Window | null {
  if (typeof window === 'undefined') return null;
  const iframe = document.getElementById('unity-iframe') as HTMLIFrameElement | null;
  return iframe?.contentWindow ?? null;
}

export function sendUnityMessage(method: string, arg: string) {
  const inst = getUnityInstance();
  if (inst?.SendMessage) {
    inst.SendMessage(UNITY_TARGET_GAME_OBJECT, method, arg);
    return true;
  }

  const iframeWindow = getUnityIframeWindow();
  if (!iframeWindow) return false;

  iframeWindow.postMessage(
    {
      type: 'UNITY_HOST_MESSAGE',
      gameObject: UNITY_TARGET_GAME_OBJECT,
      method,
      arg,
    },
    '*'
  );
  return true;
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

