# Voice Coach Integration Guide

## Overview
The voice coach widget allows users to have voice conversations with the AI coach directly in the browser, without phone calls.

## How It Works

### 1. Voice Widget Button
A floating button appears in the bottom-right corner of the app:
- 🎙️ Click to start voice conversation
- 🔴 Click to end active conversation
- ⏳ Loading state while initializing

### 2. Pain Context Integration

The voice coach automatically receives pain context from Unity:

```javascript
// From Unity WebGL, call:
window.SomaAI.startVoiceConversation({
  region: "lower_back",
  quality: "sharp",
  severity: 6,
  days_since_onset: 3
});
```

This will:
1. Generate a signed URL with the pain context
2. Start an ElevenLabs voice conversation
3. The AI coach will reference the pain information naturally

### 3. Unity Integration Steps

**Step 1:** Include the bridge script in your Unity WebGL index.html
```html
<script src="/unity-bridge.js"></script>
```

**Step 2:** In Unity C#, create a method to trigger voice conversation:
```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class VoiceCoachTrigger : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void StartVoiceConversationJS(string painContextJson);

    public void StartVoiceConversation(string region, string quality, int severity, int daysSinceOnset)
    {
        var painContext = new {
            region = region,
            quality = quality,
            severity = severity,
            days_since_onset = daysSinceOnset
        };

        string json = JsonUtility.ToJson(painContext);

        #if UNITY_WEBGL && !UNITY_EDITOR
            StartVoiceConversationJS(json);
        #endif
    }
}
```

**Step 3:** Add the JavaScript function to your Unity WebGL template or use the mergeInto approach:
```javascript
mergeInto(LibraryManager.library, {
    StartVoiceConversationJS: function(painContextJsonPtr) {
        var painContextJson = UTF8ToString(painContextJsonPtr);
        var painContext = JSON.parse(painContextJson);

        if (window.SomaAI && window.SomaAI.startVoiceConversation) {
            window.SomaAI.startVoiceConversation(painContext);
        }
    }
});
```

## API Endpoint

### POST `/api/elevenlabs/signed-url`

Generates a signed URL for ElevenLabs conversation with pain context.

**Request:**
```json
{
  "painContext": {
    "region": "lower_back",
    "quality": "sharp",
    "severity": 6,
    "days_since_onset": 3
  }
}
```

**Response:**
```json
{
  "signedUrl": "https://api.elevenlabs.io/...",
  "conversationId": "conv_abc123"
}
```

## Environment Variables Required

Add to `.env`:
```
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

## Testing

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Click the voice coach button (🎙️)
4. Should start voice conversation
5. From Unity, call `window.SomaAI.startVoiceConversation({...})`

## Troubleshooting

- **Button doesn't appear**: Check that VoiceCoachWidget is imported in page.tsx
- **API errors**: Verify ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in .env
- **No sound**: Check browser microphone permissions
- **Unity can't call SomaAI**: Make sure unity-bridge.js is loaded before Unity WebGL

## Next Steps

- Add visual feedback when Unity sends pain context
- Store conversation transcripts for research
- Add session persistence to track user history
