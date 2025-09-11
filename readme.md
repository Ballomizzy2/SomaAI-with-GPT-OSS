# Soma+ Demo — Pain Tracking & Coaching App

Soma+ is a prototype that combines a Unity front-end with a Python AI backend (GPT-OSS).  
Users can log pain details and receive concise, supportive coaching advice.

⚠️ **Disclaimer**: This demo is for **research and education only**.  
It does **not** provide medical advice. Always seek a healthcare professional if pain is severe or worsening.

---

## 🚀 Quick Start (for Testers)
0. **Get a Hugging Face Access Token**
   - Make sure to get a Hugging Face Access Token and plug it into the `.env` file
2. **Start the Engine**
   - Double-click **`start_server.bat`** (Windows) or **`start_server.sh`** (Mac/Linux).
   - Or open your terminal and run main.py after installing uvicorn and fastapi
   - A black window will open - leave it running.

3. **Open the App**
   - Go to Unity Project > Soma+ > Builds
   - Run **`.exe`** (Windows) or **`.html`** (SoraAI_HTML).
   - The Soma+ demo will open full screen.

4. **Use the App**
   - **Onboarding** → read disclaimer and continue.
   - **Pain Tracker** → click the body figure where you feel pain.  
     Enter **severity (0–10)**, **quality** (sharp, dull, burning), and **days since onset**.  
     Add extra notes if you like.
   - **Coaching Screen** → Soma+ replies with:
     - A short acknowledgment
     - A simple exercise (1–4 steps)
     - A disclaimer
   - Log more entries anytime. Make sure the server is running!

5. **Tips**
   - Stay online (internet required).  
   - If you see “trouble connecting,” restart the app after ensuring the server is running.  

---

## 🛠️ Developer Instructions

### Requirements
- Python **3.9+**
- Install dependencies:
  ```bash
  pip install fastapi uvicorn httpx pydantic python-dotenv
