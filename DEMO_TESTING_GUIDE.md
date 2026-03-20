# Soma AI Demo Testing Guide
## Vanessa MVP Version

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to http://localhost:3000

---

## What's New in This Demo

### 🎙️ **In-Browser Voice Coaching**
- **No more outbound calls!** Users click the floating voice button to start a conversation
- Pain context automatically passed to ElevenLabs agent
- Works directly in the browser - seamless UX

### 📊 **Progress Dashboard**
- Tracks pain reports over time
- Shows 7-day pain trend chart
- Exercise adherence tracking with streaks
- All data stored locally (localStorage for demo)

### 🔗 **Unity Integration**
- Unity can trigger voice conversations with pain context
- Unity can log pain reports and exercises
- Bidirectional communication between Unity WebGL and Next.js

### 🔐 **Security**
- API keys moved to `.env` file
- No hardcoded credentials in code
- Ready for production deployment

---

## Testing the Demo

### Test 1: Voice Coach (Manual)

1. Click the 🎙️ button in bottom-right corner
2. Should start a voice conversation with the AI coach
3. Speak about your pain (e.g., "I have sharp pain in my lower back")
4. Coach should respond naturally with PRT guidance
5. Click 🔴 to end conversation

**What to look for:**
- Button changes from 🎙️ to ⏳ (loading) to 🔴 (active)
- Voice conversation starts within 2-3 seconds
- Audio quality is clear
- Coach references Vanessa's workbook content

### Test 2: Progress Dashboard

1. Click "📊 Your Progress" button in bottom-left
2. Should open a dashboard panel
3. Initially will show empty state (no data yet)

**To populate with test data:**
Open browser console (F12) and run:
```javascript
// Log some pain reports
window.SomaAI.logPainReport("lower_back", "sharp", 7, 3, "After sitting");
window.SomaAI.logPainReport("lower_back", "dull", 5, 4, "Morning pain");
window.SomaAI.logPainReport("neck", "tight", 6, 2, "After work");

// Log exercises
window.SomaAI.logExercise("breath_60", "60-second longer exhale", true, 60);
window.SomaAI.logExercise("scan_90", "90-second body scan", true, 90);
```

Refresh the dashboard and you should see:
- Pain trend chart with your logged data
- Average pain score
- Exercise adherence rate
- Streak counter

### Test 3: Unity Integration (If Unity Build Available)

In Unity WebGL, test these JavaScript calls:

```javascript
// Start voice conversation with pain context
window.SomaAI.startVoiceConversation({
  region: "lower_back",
  quality: "sharp",
  severity: 6,
  days_since_onset: 3
});

// Log pain from Unity
window.SomaAI.logPainReport("shoulder", "aching", 5, 7);

// Log exercise completion
window.SomaAI.logExercise("neck_soften", "Neck soften & shoulder rolls", true, 120);
```

### Test 4: Pain Context Handoff

1. From browser console, send pain context:
```javascript
window.SomaAI.sendPainContext({
  region: "lower_back",
  quality: "stabbing",
  severity: 8,
  days_since_onset: 14
});
```

2. Then start voice conversation:
```javascript
window.SomaAI.startVoiceConversation({
  region: "lower_back",
  quality: "stabbing",
  severity: 8,
  days_since_onset: 14
});
```

3. Coach should acknowledge the pain context in first message

---

## Demo Flow for Vanessa

### Scenario: First-Time User Journey

**Setup (30 seconds):**
- Open app at http://localhost:3000
- Show the Unity game embedded in the page
- Point out the two floating buttons: Voice Coach & Progress

**Act 1: Initial Pain Report (2 minutes):**
1. "Let's say a patient just opened the app and reports lower back pain"
2. Run this in console:
   ```javascript
   window.SomaAI.logPainReport("lower_back", "sharp", 7, 2, "Pain after long drive");
   ```
3. Open Progress Dashboard - show the first data point

**Act 2: Voice Coaching (3 minutes):**
1. Click the Voice Coach button
2. When connected, say: "I have sharp pain in my lower back, severity 7, started 2 days ago after a long drive"
3. Coach responds with:
   - Acknowledgment of pain
   - Safety reappraisal language (from Vanessa's workbook)
   - Guided exercise suggestion
4. Demonstrate the natural conversation flow
5. End conversation

**Act 3: Exercise Completion (1 minute):**
1. Simulate exercise completion:
   ```javascript
   window.SomaAI.logExercise("catcow_light", "Gentle spine wave", true, 90);
   ```
2. Open Progress Dashboard again
3. Show exercise logged and adherence updated

**Act 4: Longitudinal Tracking (2 minutes):**
1. Add more data points to show trend:
   ```javascript
   // Day 1 (2 days ago)
   localStorage.setItem('soma_ai_session', JSON.stringify({
     sessionId: "demo-session",
     startedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
     lastActive: Date.now(),
     painLogs: [
       { id: "1", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), region: "lower_back", quality: "sharp", severity: 7 },
       { id: "2", timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000), region: "lower_back", quality: "dull", severity: 5 },
       { id: "3", timestamp: Date.now(), region: "lower_back", quality: "mild", severity: 3 }
     ],
     exerciseLogs: [
       { id: "1", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), exerciseId: "catcow", exerciseTitle: "Spine wave", completed: true },
       { id: "2", timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000), exerciseId: "breath", exerciseTitle: "Breathing", completed: true },
       { id: "3", timestamp: Date.now(), exerciseId: "scan", exerciseTitle: "Body scan", completed: true }
     ],
     conversationLogs: []
   }));
   ```
2. Refresh dashboard - show:
   - Pain trending down from 7 → 5 → 3
   - 3-day exercise streak
   - 100% adherence rate

**Closing (1 minute):**
- "This demonstrates how we can track patient progress over time"
- "All data would be stored securely in production"
- "Ready to integrate with your research protocols"

---

## Troubleshooting

### Voice button doesn't work
- Check browser console for errors
- Verify `.env` has `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`
- Check microphone permissions in browser

### Progress dashboard shows no data
- Run test data scripts from console
- Check localStorage: `localStorage.getItem('soma_ai_session')`

### Unity can't call SomaAI methods
- Ensure `unity-bridge.js` is loaded: check `window.SomaAI.isReady()`
- Check browser console for error messages
- Verify iframe is same-origin

### API errors
- Check `.env` file exists and has correct keys
- Restart dev server after .env changes
- Check terminal for backend errors

---

## Next Steps After Vanessa Approval

1. **IRB Compliance**: Add informed consent flow
2. **User Accounts**: Implement authentication
3. **Database**: Replace localStorage with PostgreSQL
4. **Outcome Measures**: Add standardized pain assessments
5. **Data Export**: Build researcher dashboard
6. **Deployment**: Deploy to production environment

---

## Questions for Vanessa

During the demo, ask:
1. Does the coach's language match your therapeutic approach?
2. Are the safety escalations appropriate?
3. What outcome measures would you want tracked?
4. How long should the intervention period be?
5. What sample size are you planning?
6. Any specific exercises from your workbook we should add?

---

## Technical Notes

**Architecture:**
- Next.js 14 (React 18)
- TypeScript for type safety
- ElevenLabs Conversational AI for voice
- GPT-OSS (via Baseten) for text coaching
- ChromaDB + RAG for Vanessa's workbook content
- Unity WebGL for gamified interface

**Data Flow:**
```
Unity → Pain Report → localStorage → Progress Dashboard
Unity → Voice Button → ElevenLabs Agent (with pain context)
Unity → Exercise Complete → localStorage → Streak Tracking
```

**Deployment Ready:**
- Environment variables configured
- Security best practices
- Scalable architecture
- Ready for Vercel/AWS deployment
