---
name: unity-webgl-integration
description: Guide for embedding Unity WebGL builds into web frontends (e.g., React/Next.js) and enabling reliable two-way communication between the host app and the Unity content. Use when the user mentions Unity WebGL, Unity builds, game canvases, jslib plugins, or wants the web app to send data to or receive events from Unity.
---

# Unity WebGL Integration

## When to Use This Skill

Use this skill whenever:

- You see a Unity WebGL build (files like `Build/*.wasm`, `Build/*.data`, `index.html`, `UnityLoader.js`).
- The user asks to "embed", "display", or "hook up" a Unity WebGL experience inside a React/Next.js app.
- The user wants JavaScript <-> Unity communication (sending data, events, or telemetry to/from the game).
- The user wants to gate web features behind Unity data (e.g., enable a widget only after user completes a Unity flow).

---

## Project Architecture (Soma AI)

This project uses **direct canvas embedding** (not iframe). Unity runs in the same window as the Next.js app.

Key files:
- `app/components/UnityWebGLPlayer.tsx` - Loads Unity via `createUnityInstance` on a `<canvas>`
- `public/unity-bridge.js` - Defines `window.SomaAI` namespace with bridge functions
- `Unity Project/Soma+/Assets/Plugins/WebBridge.jslib` - Unity-side JS interop (called from C#)
- `Unity Project/Soma+/Assets/Scripts/AppContoller.cs` - Main C# controller that calls the jslib

Data flow:

```
Unity C# (AppController.SetParameters)
  -> DllImport -> WebBridge.jslib (SendPainContextToWeb)
    -> window.SomaAI.sendPainContext() (unity-bridge.js)
      -> window.postMessage({ type: 'PAIN_CONTEXT_UPDATE', painContext })
        -> VoiceCoachWidget listens via addEventListener('message')
```

---

## Unity -> Web Communication (jslib Pattern)

This is the **recommended pattern** for direct-embedded Unity (no iframe). Unity C# calls JavaScript functions defined in a `.jslib` plugin.

### Step 1: Create the `.jslib` plugin

Place in `Assets/Plugins/WebBridge.jslib`:

```js
mergeInto(LibraryManager.library, {

  SendPainContextToWeb: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    var data = JSON.parse(json);

    if (window.SomaAI && window.SomaAI.sendPainContext) {
      window.SomaAI.sendPainContext(data);
    } else {
      window.postMessage({ type: "PAIN_CONTEXT_UPDATE", painContext: data }, "*");
    }
  },

  StartVoiceConversationFromWeb: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    var data = JSON.parse(json);

    if (window.SomaAI && window.SomaAI.startVoiceConversation) {
      window.SomaAI.startVoiceConversation(data);
    } else {
      window.postMessage({ type: "START_VOICE_CONVERSATION", painContext: data }, "*");
    }
  },
});
```

Rules for `.jslib` files:
- Use `UTF8ToString(ptr)` to convert C# string pointers to JS strings
- Always check for the bridge namespace before calling (fallback to raw `postMessage`)
- Keep functions simple -- just convert data and forward it

### Step 2: Declare DllImport in C#

In the C# script that needs to call the bridge:

```csharp
using System.Runtime.InteropServices;

public class AppContoller : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void SendPainContextToWeb(string json);

    [DllImport("__Internal")]
    private static extern void StartVoiceConversationFromWeb(string json);
#endif
```

The `#if UNITY_WEBGL && !UNITY_EDITOR` guard is **required** -- these functions only exist in WebGL builds, not in the Unity Editor.

### Step 3: Call the bridge from C#

Use `JsonUtility.ToJson()` to serialize a payload class, then call the extern function:

```csharp
[System.Serializable]
private class PainContextPayload
{
    public string region;
    public string quality;
    public float severity;
    public string days_since_onset;
}

private void NotifyWebBridge()
{
    var payload = JsonUtility.ToJson(new PainContextPayload
    {
        region = pain_region,
        quality = pain_quality,
        severity = pain_severity,
        days_since_onset = days_since_onset
    });

#if UNITY_WEBGL && !UNITY_EDITOR
    SendPainContextToWeb(payload);
#endif
}
```

### Step 4: Receive in the web app (React/Next.js)

Listen for `message` events on `window`:

```tsx
useEffect(() => {
  const handleUnityMessage = (event: MessageEvent) => {
    if (event.data?.type === 'PAIN_CONTEXT_UPDATE') {
      setPainContext(event.data.painContext);
    } else if (event.data?.type === 'START_VOICE_CONVERSATION') {
      setPainContext(event.data.painContext);
      startConversation(event.data.painContext);
    }
  };

  window.addEventListener('message', handleUnityMessage);
  return () => window.removeEventListener('message', handleUnityMessage);
}, []);
```

Since Unity is in the same window (direct canvas, not iframe), `window.postMessage` sends to self and `addEventListener('message')` catches it.

---

## The Bridge Script (unity-bridge.js)

Loaded via `<Script src="/unity-bridge.js" strategy="afterInteractive" />` in the Next.js page. Defines `window.SomaAI` namespace:

- `window.SomaAI.sendPainContext(data)` - Forwards pain context via `postMessage`
- `window.SomaAI.startVoiceConversation(data)` - Triggers voice conversation with context
- `window.SomaAI.logPainReport(...)` - Logs to localStorage for the progress dashboard
- `window.SomaAI.logExercise(...)` - Logs exercise completion to localStorage
- `window.SomaAI.isReady()` - Returns `true` when bridge is loaded

The bridge script must be loaded **before** Unity tries to call it.

---

## Web -> Unity Communication (SendMessage)

When Unity is loaded via `createUnityInstance`, you get a `UnityInstance` reference:

```tsx
const instance = await window.createUnityInstance(canvas, config, onProgress);
// Store the instance
unityRef.current = instance;
```

To call a C# method from the web app:

```tsx
unityRef.current.SendMessage("GameObjectName", "MethodName", "stringArg");
```

The target must be an active GameObject with a MonoBehaviour that has a public method matching the name. Payloads are always strings (use JSON for complex data).

---

## Direct Canvas Embedding (UnityWebGLPlayer)

This project embeds Unity directly on the page (not in an iframe):

```tsx
const UNITY_CONFIG = {
  dataUrl: '/unity/Build/SoraAI_HTML.data.br',
  frameworkUrl: '/unity/Build/SoraAI_HTML.framework.js.br',
  codeUrl: '/unity/Build/SoraAI_HTML.wasm.br',
  streamingAssetsUrl: '/unity/StreamingAssets',
  companyName: 'DefaultCompany',
  productName: 'Soma+',
  productVersion: '0.1.0',
};

// Load the Unity loader script, then:
const instance = await window.createUnityInstance(canvasRef.current, config, onProgress);
```

Unity build files are served via a Next.js catch-all route at `app/unity/[[...path]]/route.ts` that reads from the local build output directory.

---

## Gating Web Features Behind Unity Data

Pattern: disable a web widget until Unity sends required data.

1. Widget starts with `hasData = false`, button disabled
2. Unity user completes a flow (e.g., pain check-in) -> C# calls jslib -> `postMessage`
3. Widget receives `PAIN_CONTEXT_UPDATE`, sets `hasData = true`, enables button
4. When the feature starts (e.g., voice conversation), pass the data as context

```tsx
const [hasData, setHasData] = useState(false);
const [painContext, setPainContext] = useState(null);

// In message handler:
if (event.data?.type === 'PAIN_CONTEXT_UPDATE') {
  setPainContext(event.data.painContext);
  setHasData(true);
}

// In JSX:
<button disabled={!hasData}>Start voice coach</button>
```

---

## Message Protocol

All Unity->Web messages use this shape:

```ts
type UnityMessage = {
  type: 'PAIN_CONTEXT_UPDATE' | 'START_VOICE_CONVERSATION';
  painContext: {
    region: string;
    quality: string;
    severity: number;
    days_since_onset: string;
  };
};
```

To add a new message type:
1. Add a new function in `WebBridge.jslib`
2. Add `[DllImport("__Internal")]` in the C# script
3. Add a handler case in the React component's `handleUnityMessage`
4. Rebuild the Unity WebGL build

---

## Rebuild Checklist

After changing `.cs` or `.jslib` files:

1. Open Unity Editor with the project
2. File -> Build Settings -> WebGL -> Build
3. Copy the build output to the directory served by the Next.js catch-all route
4. Restart the dev server or hard-refresh the browser

Frontend changes (`.tsx`, `.css`) hot-reload automatically in dev mode.

---

## Troubleshooting

- **jslib function not found at runtime**: Ensure the `.jslib` is in `Assets/Plugins/` and you rebuilt the WebGL build
- **`postMessage` not received**: Check that the listener is on `window` (not `document`), and Unity is in the same window (not iframe)
- **C# compile error on DllImport**: Make sure the `#if UNITY_WEBGL && !UNITY_EDITOR` guard wraps the declarations
- **Bridge not ready**: Ensure `unity-bridge.js` loads before Unity via `strategy="afterInteractive"`
- **AudioContext warnings**: Normal for Unity WebGL -- browsers block audio until user gesture; Unity auto-retries
