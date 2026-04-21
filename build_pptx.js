// SomaAI Vanessa Presentation — pptxgenjs
// Run: NODE_PATH="C:\Program Files (x86)\nodejs\node_modules" node build_pptx.js

const G = "C:/Program Files (x86)/nodejs/node_modules/";
const pptxgen = require(G + "pptxgenjs");
const React = require(G + "react");
const ReactDOMServer = require(G + "react-dom/server");
const sharp = require(G + "sharp");

// ─── Icon helpers ────────────────────────────────────────────────────────────
const {
  FaHeartbeat, FaBrain, FaGamepad, FaChartLine, FaMicrophone,
  FaShieldAlt, FaBook, FaExclamationTriangle, FaCertificate,
  FaUserMd, FaDatabase, FaCode, FaCheckCircle, FaArrowRight,
  FaClock, FaUsers, FaStar, FaLock, FaFlask
} = require(G + "react-icons/fa");

async function iconPng(IconComp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  navy:      "1A3A4A",
  teal:      "0D7A8A",
  mint:      "00B4A0",
  mintLight: "E0F5F3",
  white:     "FFFFFF",
  offWhite:  "F7FBFC",
  darkText:  "1A2E35",
  midText:   "4A6572",
  muted:     "7A9BAA",
  red:       "E05252",
  amber:     "E09A22",
  green:     "2ECC71",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.10 };
}

function card(slide, x, y, w, h, accentColor) {
  // white card + left accent bar
  slide.addShape(slide.pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.white },
    line: { color: "E8F0F3", width: 1 },
    shadow: makeShadow(),
  });
  slide.addShape(slide.pres.shapes.RECTANGLE, {
    x, y, w: 0.07, h,
    fill: { color: accentColor },
    line: { color: accentColor, width: 0 },
  });
}

function sectionTitle(slide, text) {
  slide.addText(text, {
    x: 0.5, y: 0.22, w: 9, h: 0.55,
    fontSize: 26, fontFace: "Trebuchet MS", bold: true,
    color: C.darkText, align: "left", margin: 0,
  });
  // subtle teal dot accent
  slide.addShape(slide.pres.shapes.OVAL, {
    x: 0.5, y: 0.32, w: 0.08, h: 0.08,
    fill: { color: C.mint }, line: { color: C.mint, width: 0 },
  });
}

function iconCircle(slide, iconData, x, y, r, bg) {
  slide.addShape(slide.pres.shapes.OVAL, {
    x: x - r, y: y - r, w: r * 2, h: r * 2,
    fill: { color: bg }, line: { color: bg, width: 0 },
  });
  const iconSize = r * 1.0;
  slide.addImage({
    data: iconData,
    x: x - iconSize / 2, y: y - iconSize / 2,
    w: iconSize, h: iconSize,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 × 5.625

  // Pre-render icons
  const icons = {
    heartbeat:   await iconPng(FaHeartbeat,         "#FFFFFF"),
    brain:       await iconPng(FaBrain,             "#FFFFFF"),
    gamepad:     await iconPng(FaGamepad,           "#FFFFFF"),
    chart:       await iconPng(FaChartLine,         "#FFFFFF"),
    mic:         await iconPng(FaMicrophone,        "#FFFFFF"),
    shield:      await iconPng(FaShieldAlt,         "#FFFFFF"),
    book:        await iconPng(FaBook,              "#FFFFFF"),
    warning:     await iconPng(FaExclamationTriangle, "#FFFFFF"),
    cert:        await iconPng(FaCertificate,       "#FFFFFF"),
    userMd:      await iconPng(FaUserMd,            "#FFFFFF"),
    db:          await iconPng(FaDatabase,          "#FFFFFF"),
    code:        await iconPng(FaCode,              "#FFFFFF"),
    check:       await iconPng(FaCheckCircle,       "#FFFFFF"),
    arrow:       await iconPng(FaArrowRight,        "#FFFFFF"),
    clock:       await iconPng(FaClock,             "#FFFFFF"),
    users:       await iconPng(FaUsers,             "#FFFFFF"),
    star:        await iconPng(FaStar,              "#FFFFFF"),
    lock:        await iconPng(FaLock,              "#FFFFFF"),
    flask:       await iconPng(FaFlask,             "#FFFFFF"),
    // dark variants for light circles
    micDark:     await iconPng(FaMicrophone,        "#0D7A8A"),
    chartDark:   await iconPng(FaChartLine,         "#0D7A8A"),
    checkDark:   await iconPng(FaCheckCircle,       "#0D7A8A"),
    heartDark:   await iconPng(FaHeartbeat,         "#1A3A4A"),
    brainDark:   await iconPng(FaBrain,             "#1A3A4A"),
    gameDark:    await iconPng(FaGamepad,           "#1A3A4A"),
    shieldDark:  await iconPng(FaShieldAlt,         "#0D7A8A"),
    bookDark:    await iconPng(FaBook,              "#0D7A8A"),
    certDark:    await iconPng(FaCertificate,       "#0D7A8A"),
    clockDark:   await iconPng(FaClock,             "#0D7A8A"),
    userDark:    await iconPng(FaUserMd,            "#0D7A8A"),
    flaskDark:   await iconPng(FaFlask,             "#0D7A8A"),
    dbDark:      await iconPng(FaDatabase,          "#0D7A8A"),
    lockDark:    await iconPng(FaLock,              "#0D7A8A"),
    starDark:    await iconPng(FaStar,              "#0D7A8A"),
  };

  // ── Slide 1: Title ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.navy };

    // Left accent panel
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: C.teal }, line: { color: C.teal, width: 0 },
    });
    // Mint circle accent (top right)
    s.addShape(pres.shapes.OVAL, {
      x: 7.8, y: -1.1, w: 3.5, h: 3.5,
      fill: { color: C.mint, transparency: 85 },
      line: { color: C.mint, width: 0 },
    });
    // Smaller circle
    s.addShape(pres.shapes.OVAL, {
      x: 8.5, y: 3.8, w: 2.0, h: 2.0,
      fill: { color: C.teal, transparency: 75 },
      line: { color: C.teal, width: 0 },
    });

    // SOMA AI name
    s.addText("SomaAI", {
      x: 0.5, y: 1.0, w: 7, h: 1.0,
      fontSize: 52, fontFace: "Trebuchet MS", bold: true,
      color: C.white, align: "left", margin: 0,
    });
    // Mint underline
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.02, w: 3.2, h: 0.045,
      fill: { color: C.mint }, line: { color: C.mint, width: 0 },
    });
    // Tagline
    s.addText("A Gamified Somatic Tracking App\nfor Chronic Pain Management", {
      x: 0.5, y: 2.15, w: 7.5, h: 1.0,
      fontSize: 20, fontFace: "Trebuchet MS", bold: false,
      color: C.mintLight, align: "left", margin: 0,
    });
    // Divider line
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 3.3, w: 3.5, h: 0.02,
      fill: { color: C.teal, transparency: 40 }, line: { color: C.teal, width: 0 },
    });
    // Subtitle / presenter info
    s.addText("Clinical Demo  ·  Vanessa Blackstone  ·  2026", {
      x: 0.5, y: 3.45, w: 7, h: 0.45,
      fontSize: 13, fontFace: "Calibri", bold: false,
      color: C.muted, align: "left", margin: 0,
    });
    // Heart icon
    iconCircle(s, icons.heartbeat, 8.8, 1.4, 0.52, C.teal);

    s.addNotes(`Welcome and thank you for your time today.

My name is [your name], and I'm here to walk you through SomaAI — a gamified somatic tracking application we've built to support patients managing chronic pain through Pain Reprocessing Therapy.

Today's session will be about 15 minutes. I'll cover the problem we're solving, our clinical approach, a live demo of what we've built, and a specific ask for your approval to move forward with a 5–10 patient pilot.

Please feel free to ask questions at any point.`);
  }

  // ── Slide 2: The Problem ────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.white };

    sectionTitle(s, "  Chronic Pain Is Undertreated & Misunderstood");

    // Left column: narrative
    card(s, 0.38, 0.95, 5.1, 3.9, C.teal);
    s.addText("The Scale of the Problem", {
      x: 0.62, y: 1.08, w: 4.7, h: 0.38,
      fontSize: 14, fontFace: "Trebuchet MS", bold: true,
      color: C.darkText, margin: 0,
    });
    const problems = [
      "50 million Americans live with chronic pain — the #1 cause of disability in the US",
      "Patients wait an average of 5–7 years for a correct diagnosis",
      "Opioid prescriptions remain a default, despite limited long-term efficacy",
      "Most digital health tools track symptoms, but don't address the central sensitization driving the pain",
      "Fear-avoidance behaviors reinforce the pain cycle — no current app breaks this loop",
    ];
    s.addText(problems.map((t, i) => ({
      text: t,
      options: { bullet: true, breakLine: i < problems.length - 1, paraSpaceAfter: 6 }
    })), {
      x: 0.62, y: 1.55, w: 4.7, h: 3.1,
      fontSize: 12, fontFace: "Calibri", color: C.midText, margin: 0,
    });

    // Right column: stat callouts
    const stats = [
      { val: "50M",  sub: "Americans with chronic pain", color: C.teal },
      { val: "5–7",  sub: "years avg. to correct diagnosis", color: C.amber },
      { val: "~30%", sub: "of patients improve with current standard care", color: C.red },
    ];
    stats.forEach((st, i) => {
      const sy = 0.95 + i * 1.32;
      card(s, 5.7, sy, 3.9, 1.18, st.color);
      s.addText(st.val, {
        x: 5.95, y: sy + 0.08, w: 3.4, h: 0.65,
        fontSize: 40, fontFace: "Trebuchet MS", bold: true,
        color: st.color, margin: 0,
      });
      s.addText(st.sub, {
        x: 5.95, y: sy + 0.72, w: 3.4, h: 0.36,
        fontSize: 11, fontFace: "Calibri", color: C.midText, margin: 0,
      });
    });

    s.addNotes(`This is the challenge we set out to address.

Chronic pain affects 50 million Americans and is the leading cause of long-term disability in the country. Despite its prevalence, patients often wait years for a correct diagnosis, and when they do get one, the options are limited.

What's missing isn't just treatment — it's *understanding*. Most patients don't have tools to track their somatic experience over time, and clinicians lack longitudinal data to inform decisions.

Current digital health tools treat pain as a number on a scale. They don't engage with the psychological and somatic dimensions that Pain Reprocessing Therapy addresses.

SomaAI was built to fill that gap.`);
  }

  // ── Slide 3: Our Approach ───────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.white };

    sectionTitle(s, "  Pain Reprocessing Therapy + Gamification");

    const cols = [
      {
        icon: icons.brain, label: "PRT Clinical Framework",
        lines: [
          "All coaching is grounded in Pain Reprocessing Therapy (Yoni Gordons lab, 2021)",
          "Patients learn to reinterpret pain signals as non-threatening",
          "Reduces fear-avoidance and catastrophizing",
          "Policy v2 defines safety escalation rules for the AI coach",
        ],
        bg: C.mintLight, accent: C.teal,
      },
      {
        icon: icons.gamepad, label: "Gamified Engagement",
        lines: [
          "Unity WebGL game (Soma+) provides the patient-facing experience",
          "Body-map interface for somatic tracking",
          "Session streaks, adherence scoring, and progress feedback",
          "Designed to improve retention vs. standard symptom diaries",
        ],
        bg: C.mintLight, accent: C.teal,
      },
      {
        icon: icons.chart, label: "Longitudinal Tracking",
        lines: [
          "7-day pain trend visualization (color-coded severity)",
          "Exercise adherence and streak counters",
          "Pain quality, region, and onset data per session",
          "Designed for eventual BPI + PCS-4 outcome integration",
        ],
        bg: C.mintLight, accent: C.teal,
      },
    ];

    cols.forEach((col, i) => {
      const cx = 0.38 + i * 3.22;
      card(s, cx, 0.88, 3.0, 4.3, col.accent);
      // icon circle
      s.addShape(pres.shapes.OVAL, {
        x: cx + 0.22, y: 1.02, w: 0.52, h: 0.52,
        fill: { color: C.teal }, line: { color: C.teal, width: 0 },
      });
      s.addImage({ data: col.icon, x: cx + 0.28, y: 1.08, w: 0.40, h: 0.40 });

      s.addText(col.label, {
        x: cx + 0.2, y: 1.65, w: 2.65, h: 0.52,
        fontSize: 12, fontFace: "Trebuchet MS", bold: true,
        color: C.darkText, margin: 0, wrap: true,
      });
      s.addText(col.lines.map((t, j) => ({
        text: t,
        options: { bullet: true, breakLine: j < col.lines.length - 1, paraSpaceAfter: 4 }
      })), {
        x: cx + 0.2, y: 2.25, w: 2.65, h: 2.8,
        fontSize: 10.5, fontFace: "Calibri", color: C.midText, margin: 0,
      });
    });

    s.addNotes(`Let me explain the three pillars of our approach.

First, the clinical framework. Everything in SomaAI is grounded in Pain Reprocessing Therapy — the same approach validated in Ashar et al.'s 2022 JAMA Psychiatry RCT, which showed ~66% of participants achieving pain-free or near-pain-free outcomes. Our AI coaching policy is explicitly defined around PRT principles: reattribution, somatic tracking, and safety escalation rules.

Second, gamification. We know that symptom journals have terrible adherence. By embedding the somatic tracking experience inside a Unity-built game — with streaks, body-map interaction, and visual feedback — we create meaningful engagement that a plain form never could.

Third, longitudinal data. The real clinical value is the trend data. A single pain session tells you very little. Seven days of region-specific, quality-coded pain reports — combined with exercise adherence — starts to tell a real clinical story. That's what the progress dashboard captures.`);
  }

  // ── Slide 4: How It Works ───────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.offWhite };

    sectionTitle(s, "  How It Works: A Three-Layer System");

    const steps = [
      {
        num: "01", title: "Unity Game (Soma+)",
        sub: "Patient experience",
        desc: "The patient opens the app and interacts with a body-map to locate and describe their pain. The game tracks somatic signals in real time.",
        icon: icons.gameDark, color: C.teal,
      },
      {
        num: "02", title: "Voice Coach",
        sub: "AI-powered conversation",
        desc: "A floating mic button launches an ElevenLabs voice session. The AI coach receives pain context from Unity and guides the patient through a PRT exercise.",
        icon: icons.micDark, color: C.teal,
      },
      {
        num: "03", title: "Progress Dashboard",
        sub: "Longitudinal insight",
        desc: "Every session logs a pain report. The dashboard shows a 7-day trend chart, exercise adherence %, streak count, and average severity — visible to patient and clinician.",
        icon: icons.chartDark, color: C.teal,
      },
    ];

    // Arrow connectors
    [0, 1].forEach(i => {
      const ax = 0.38 + (i + 1) * 3.22 - 0.22;
      s.addShape(pres.shapes.RECTANGLE, {
        x: ax, y: 2.6, w: 0.35, h: 0.03,
        fill: { color: C.muted }, line: { color: C.muted, width: 0 },
      });
      s.addText("›", {
        x: ax + 0.15, y: 2.42, w: 0.25, h: 0.35,
        fontSize: 20, fontFace: "Trebuchet MS", color: C.muted, align: "center", margin: 0,
      });
    });

    steps.forEach((st, i) => {
      const cx = 0.38 + i * 3.22;
      // Card
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 0.92, w: 3.0, h: 4.28,
        fill: { color: C.white }, line: { color: "E0EAEC", width: 1 },
        shadow: makeShadow(),
      });
      // Number badge
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 0.92, w: 3.0, h: 0.52,
        fill: { color: st.color }, line: { color: st.color, width: 0 },
      });
      s.addText(st.num, {
        x: cx + 0.12, y: 0.94, w: 0.5, h: 0.46,
        fontSize: 22, fontFace: "Trebuchet MS", bold: true,
        color: C.white, margin: 0,
      });
      s.addText(st.sub.toUpperCase(), {
        x: cx + 0.6, y: 0.98, w: 2.25, h: 0.4,
        fontSize: 9, fontFace: "Calibri", bold: true,
        color: C.mintLight, charSpacing: 1.5, margin: 0,
      });

      // Icon
      s.addShape(pres.shapes.OVAL, {
        x: cx + 1.1, y: 1.55, w: 0.8, h: 0.8,
        fill: { color: C.mintLight }, line: { color: C.mintLight, width: 0 },
      });
      s.addImage({ data: st.icon, x: cx + 1.2, y: 1.65, w: 0.6, h: 0.6 });

      s.addText(st.title, {
        x: cx + 0.18, y: 2.5, w: 2.7, h: 0.48,
        fontSize: 13, fontFace: "Trebuchet MS", bold: true,
        color: C.darkText, align: "center", margin: 0,
      });
      s.addText(st.desc, {
        x: cx + 0.18, y: 3.05, w: 2.7, h: 1.95,
        fontSize: 11, fontFace: "Calibri", color: C.midText,
        align: "left", margin: 0, wrap: true,
      });
    });

    s.addNotes(`The system has three interconnected layers.

Layer one is the Unity game — this is what the patient sees. Soma+ is a web-based game that opens in a browser tab. The patient uses a body-map interface to tag their pain's location, quality, and severity. This data is captured in real time.

Layer two is the voice coach. When the patient or the game triggers it, a voice session starts — right in the browser. No app to download, no phone call to answer. The voice coach receives the pain context that Unity just captured, so the conversation starts from a clinically informed place: "I see you're reporting sharp lower-back pain at a 7 — let's work through that."

Layer three is the dashboard. Every interaction gets logged. Over days and weeks, the patient and their clinician can see whether pain is trending down, whether exercises are being completed, and whether the streak counter is climbing. This is the longitudinal data that clinical decisions need.`);
  }

  // ── Slide 5: Live Demo Preview ──────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.white };

    sectionTitle(s, "  Built & Ready to Demo");

    // 2-up top row + 1 wide bottom
    const features = [
      {
        icon: icons.micDark, title: "In-Browser Voice Coaching",
        tag: "TASK #3 — COMPLETE",
        desc: "Patient clicks the mic button → ElevenLabs starts a voice session in the browser. Pain context (region, quality, severity, onset) is automatically injected so the AI coach begins with clinical grounding. No phone calls. No app installs.",
        color: C.teal,
      },
      {
        icon: icons.chartDark, title: "7-Day Progress Dashboard",
        tag: "TASK #4 — COMPLETE",
        desc: "Color-coded pain trend chart (green → yellow → red by severity), exercise adherence percentage, streak counter, and rolling average. Updated automatically after each logged session.",
        color: C.teal,
      },
      {
        icon: icons.checkDark, title: "Unity ↔ Web Bridge",
        tag: "INTEGRATION — COMPLETE",
        desc: "window.SomaAI.* API bridges the Unity game and the web layer. Unity triggers voice sessions, logs pain reports, and records exercise completions — all through a clean JavaScript contract. Testable from the browser console.",
        color: C.teal,
      },
    ];

    features.forEach((f, i) => {
      const positions = [
        { x: 0.38, y: 0.92, w: 4.6, h: 2.1 },
        { x: 5.12, y: 0.92, w: 4.5, h: 2.1 },
        { x: 0.38, y: 3.12, w: 9.24, h: 2.0 },
      ];
      const pos = positions[i];
      card(s, pos.x, pos.y, pos.w, pos.h, f.color);

      // Tag pill
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: pos.x + 0.18, y: pos.y + 0.12, w: 1.8, h: 0.28,
        fill: { color: C.mint, transparency: 25 },
        line: { color: C.mint, width: 0 },
        rectRadius: 0.05,
      });
      s.addText(f.tag, {
        x: pos.x + 0.18, y: pos.y + 0.11, w: 1.8, h: 0.28,
        fontSize: 7.5, fontFace: "Calibri", bold: true,
        color: C.teal, align: "center", margin: 0,
      });

      // Icon + title row
      s.addShape(pres.shapes.OVAL, {
        x: pos.x + 0.18, y: pos.y + 0.5, w: 0.42, h: 0.42,
        fill: { color: C.mintLight }, line: { color: C.mintLight, width: 0 },
      });
      s.addImage({ data: f.icon, x: pos.x + 0.24, y: pos.y + 0.56, w: 0.30, h: 0.30 });
      s.addText(f.title, {
        x: pos.x + 0.72, y: pos.y + 0.48, w: pos.w - 0.9, h: 0.45,
        fontSize: 13, fontFace: "Trebuchet MS", bold: true,
        color: C.darkText, margin: 0,
      });

      s.addText(f.desc, {
        x: pos.x + 0.18, y: pos.y + 0.98, w: pos.w - 0.3, h: 1.0,
        fontSize: 11, fontFace: "Calibri", color: C.midText,
        margin: 0, wrap: true,
      });
    });

    s.addNotes(`Let me show you what's actually built.

[DEMO MOMENT: This is where you'd do the live demo. Walk through the three features in this order:]

Feature one — Voice coaching. Open http://localhost:3000. Point out the microphone button in the bottom-right corner. Click it. Within a few seconds you'll hear the AI coach's voice. Introduce yourself as a patient with lower-back pain. The coach responds with PRT-grounded guidance — asking you to observe the sensation with curiosity rather than fear.

Feature two — Pain logging and the dashboard. From the browser console, run:
  window.SomaAI.logPainReport("lower_back", "sharp", 7, 2, "After sitting");
Then click the progress button. The dashboard populates with the data point.

Feature three — The Unity bridge. This is the technical foundation for how Unity and the web layer talk. Show window.SomaAI.isReady() returning true. This means any button inside the Unity game can fire the voice coach or log data.

[If demoing live, add multi-day data before the call to show trend lines. See DEMO_TESTING_GUIDE.md for the script.]`);
  }

  // ── Slide 6: The Technology ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.offWhite };

    sectionTitle(s, "  Clinical Intelligence Under the Hood");

    // Subtitle
    s.addText("Three layers, each owning its domain — designed to scale into a clinical product.", {
      x: 0.5, y: 0.85, w: 9.0, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.midText, margin: 0,
    });

    const layers = [
      {
        icon: icons.gamepad, label: "PATIENT LAYER",
        title: "Unity WebGL (Soma+)",
        points: ["Body-map somatic tracking UI", "Session flow & gamification", "Streak, adherence & feedback", "Triggers voice & data logging via bridge"],
        color: C.navy,
      },
      {
        icon: icons.mic, label: "COACHING LAYER",
        title: "Next.js 14 + ElevenLabs",
        points: ["Streams Unity build (no copy needed)", "ElevenLabs signed-URL voice sessions", "Pain context injected into every conversation", "Progress dashboard + session storage"],
        color: C.teal,
      },
      {
        icon: icons.brain, label: "INTELLIGENCE LAYER",
        title: "Python ML / RAG",
        points: ["RAG over PRT clinical materials", "Policy v2 — safety rules & scope guards", "10k-row PRT dataset for coaching grounding", "Deepgram STT · Baseten GPT-OSS · HuggingFace"],
        color: C.mint,
      },
    ];

    layers.forEach((l, i) => {
      const sy = 1.3 + i * 1.37;
      // Background bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.38, y: sy, w: 9.24, h: 1.22,
        fill: { color: C.white }, line: { color: "DDE8EA", width: 1 },
        shadow: makeShadow(),
      });
      // Left color tab
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.38, y: sy, w: 0.10, h: 1.22,
        fill: { color: l.color }, line: { color: l.color, width: 0 },
      });
      // Icon
      s.addShape(pres.shapes.OVAL, {
        x: 0.60, y: sy + 0.26, w: 0.70, h: 0.70,
        fill: { color: l.color }, line: { color: l.color, width: 0 },
      });
      s.addImage({ data: l.icon, x: 0.68, y: sy + 0.34, w: 0.54, h: 0.54 });

      // Labels
      s.addText(l.label, {
        x: 1.48, y: sy + 0.10, w: 2.2, h: 0.28,
        fontSize: 9, fontFace: "Calibri", bold: true,
        color: l.color, charSpacing: 1.5, margin: 0,
      });
      s.addText(l.title, {
        x: 1.48, y: sy + 0.36, w: 2.4, h: 0.4,
        fontSize: 14, fontFace: "Trebuchet MS", bold: true,
        color: C.darkText, margin: 0,
      });

      // Bullet points (2+2 columns)
      const half = Math.ceil(l.points.length / 2);
      [0, 1].forEach(col => {
        const pts = l.points.slice(col * half, (col + 1) * half);
        if (!pts.length) return;
        s.addText(pts.map((p, j) => ({
          text: p,
          options: { bullet: true, breakLine: j < pts.length - 1, paraSpaceAfter: 2 }
        })), {
          x: 3.9 + col * 2.75, y: sy + 0.16, w: 2.6, h: 0.9,
          fontSize: 10.5, fontFace: "Calibri", color: C.midText, margin: 0,
        });
      });
    });

    s.addNotes(`For context — and I'll keep this brief because this is a clinical conversation, not an engineering one.

The system has three clean layers.

The patient layer is the Unity game. This is what patients see. It's a browser-based experience, no install required. We chose Unity specifically for the body-map and somatic feedback loops — it lets us build interactions that a web form simply cannot.

The coaching layer is Next.js hosting everything together, plus ElevenLabs for the voice sessions. ElevenLabs was chosen because it supports "signed URLs" — we can inject clinical context (region, quality, severity) into the conversation before the patient even says a word.

The intelligence layer is Python. We've built a RAG pipeline over PRT clinical materials, a policy document (version 2) that defines what the coach can and can't say, and a 10,000-row dataset of PRT-grounded coaching scenarios. This is what makes the coach sound like a PRT practitioner rather than a generic chatbot.

The important thing for today: this architecture is production-scalable. The demo uses browser-side session storage; the post-approval roadmap adds a real database and user accounts.`);
  }

  // ── Slide 7: Clinical Safeguards ────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.white };

    sectionTitle(s, "  Safety by Design");

    s.addText("Clinical safeguards are not an afterthought — they are encoded in the system from day one.", {
      x: 0.5, y: 0.85, w: 9.0, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: C.midText, margin: 0,
    });

    const guards = [
      {
        icon: icons.book, title: "PRT Clinical Grounding",
        desc: "All coaching content derives from Pain Reprocessing Therapy (Ashar et al., 2022 JAMA Psychiatry). The AI coach uses PRT-specific language: somatic tracking, reattribution, safe messaging. No generic pain advice.",
        color: C.teal,
      },
      {
        icon: icons.shield, title: "Structured Coaching Policy (v2)",
        desc: "policy_v2.json is a versioned, human-readable file that defines the coach's scope, escalation rules, and forbidden topics. It is reviewed and edited separately from code — a clinician can audit it directly.",
        color: C.teal,
      },
      {
        icon: icons.lock, title: "Safety Escalation Rules",
        desc: "The policy includes explicit escalation triggers: suicidality, reports of worsening neurological symptoms, descriptions of acute injury, and expressions of medication misuse. These redirect to emergency resources immediately.",
        color: C.amber,
      },
      {
        icon: icons.cert, title: "CITI Health Privacy Compliance",
        desc: "CITI Human Subjects training (Health & Privacy track) is completed. The demo uses browser localStorage with no PII transmitted to external servers. IRB-compliant consent flow is the first post-approval step.",
        color: C.teal,
      },
    ];

    guards.forEach((g, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const gx = 0.38 + col * 4.74;
      const gy = 1.28 + row * 2.0;
      card(s, gx, gy, 4.52, 1.78, g.color);

      s.addShape(pres.shapes.OVAL, {
        x: gx + 0.18, y: gy + 0.15, w: 0.56, h: 0.56,
        fill: { color: g.color === C.amber ? C.amber : C.teal },
        line: { color: g.color === C.amber ? C.amber : C.teal, width: 0 },
      });
      s.addImage({ data: g.icon, x: gx + 0.26, y: gy + 0.23, w: 0.40, h: 0.40 });

      s.addText(g.title, {
        x: gx + 0.88, y: gy + 0.14, w: 3.45, h: 0.40,
        fontSize: 13, fontFace: "Trebuchet MS", bold: true,
        color: C.darkText, margin: 0,
      });
      s.addText(g.desc, {
        x: gx + 0.18, y: gy + 0.7, w: 4.15, h: 0.98,
        fontSize: 10.5, fontFace: "Calibri", color: C.midText,
        margin: 0, wrap: true,
      });
    });

    s.addNotes(`I want to spend a moment on safeguards, because I know this matters to you.

First: clinical grounding. The AI coach doesn't free-form. It operates within a defined PRT framework. The coaching language mirrors what a trained PRT therapist would say — focusing on curiosity, safety, and somatic awareness rather than pain management in the traditional sense.

Second: the policy document. policy_v2.json is the coach's rulebook. It's a structured JSON file, not buried in code. You can open it in any text editor. It defines what topics the coach can address, what it must redirect, and how it should respond to clinical risk signals. This is auditable.

Third: escalation. If a patient mentions anything in the safety-critical list — suicidal ideation, acute neurological symptoms, medication misuse — the coach does not continue the conversation. It redirects to appropriate emergency resources. This is hard-coded in the policy, not dependent on the LLM.

Fourth: privacy. We've completed CITI Health Privacy training. The demo transmits no PII to external servers. The informed consent flow is a required step before any patient data is collected in the real pilot.`);
  }

  // ── Slide 8: Pilot Proposal ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.offWhite };

    sectionTitle(s, "  Proposed Pilot: 5–10 Patients");

    // Left: What we'd measure
    card(s, 0.38, 0.95, 5.1, 4.3, C.teal);
    s.addText("What We Would Measure", {
      x: 0.62, y: 1.08, w: 4.65, h: 0.38,
      fontSize: 14, fontFace: "Trebuchet MS", bold: true,
      color: C.darkText, margin: 0,
    });
    const measures = [
      { label: "Primary:", val: "Pain severity trend over 4 weeks (0–10 NRS)" },
      { label: "Primary:", val: "App engagement & session completion rate" },
      { label: "Secondary:", val: "BPI (Brief Pain Inventory) — pre/post" },
      { label: "Secondary:", val: "PCS-4 (Pain Catastrophizing Scale) — pre/post" },
      { label: "Secondary:", val: "Exercise adherence rate (%) per week" },
      { label: "Qualitative:", val: "Patient-reported experience (semi-structured interview)" },
      { label: "Safety:", val: "Adverse event monitoring — escalations logged and reviewed" },
    ];
    measures.forEach((m, i) => {
      const my = 1.56 + i * 0.49;
      s.addText(m.label, {
        x: 0.62, y: my, w: 0.88, h: 0.36,
        fontSize: 10, fontFace: "Calibri", bold: true,
        color: C.teal, margin: 0,
      });
      s.addText(m.val, {
        x: 1.50, y: my, w: 3.8, h: 0.42,
        fontSize: 10.5, fontFace: "Calibri", color: C.midText, margin: 0, wrap: true,
      });
    });

    // Right: Timeline
    card(s, 5.62, 0.95, 4.0, 4.3, C.mint);
    s.addText("Pilot Timeline", {
      x: 5.85, y: 1.08, w: 3.6, h: 0.38,
      fontSize: 14, fontFace: "Trebuchet MS", bold: true,
      color: C.darkText, margin: 0,
    });
    const timeline = [
      { phase: "Weeks 1–2", desc: "IRB submission & consent flow development" },
      { phase: "Week 3",    desc: "Participant recruitment (chronic pain patients, 18+)" },
      { phase: "Weeks 4–5", desc: "Onboarding, baseline BPI & PCS-4 assessments" },
      { phase: "Weeks 6–9", desc: "4-week active pilot — daily app use + weekly check-in" },
      { phase: "Week 10",   desc: "Post-intervention assessments + qualitative interviews" },
      { phase: "Week 11",   desc: "Data analysis, safety review, pilot report" },
    ];
    timeline.forEach((t, i) => {
      const ty = 1.58 + i * 0.58;
      // Dot
      s.addShape(pres.shapes.OVAL, {
        x: 5.85, y: ty + 0.09, w: 0.14, h: 0.14,
        fill: { color: C.mint }, line: { color: C.mint, width: 0 },
      });
      // Vertical line between dots (except last)
      if (i < timeline.length - 1) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: 5.913, y: ty + 0.23, w: 0.02, h: 0.44,
          fill: { color: C.mint, transparency: 50 },
          line: { color: C.mint, width: 0 },
        });
      }
      s.addText(t.phase, {
        x: 6.1, y: ty, w: 1.35, h: 0.32,
        fontSize: 10, fontFace: "Calibri", bold: true,
        color: C.teal, margin: 0,
      });
      s.addText(t.desc, {
        x: 6.1, y: ty + 0.28, w: 3.3, h: 0.28,
        fontSize: 9.5, fontFace: "Calibri", color: C.midText, margin: 0, wrap: true,
      });
    });

    s.addNotes(`Here's what a pilot would actually look like.

We're proposing 5 to 10 patients, recruiting from a chronic pain population — adults 18 and over. This is a feasibility and safety pilot, not a powered efficacy trial. The goal is to validate the system's usability, safety, and preliminary signal on pain outcomes.

The primary outcomes are pain trend over 4 weeks using the Numeric Rating Scale, and engagement metrics — how often patients show up, and whether they complete sessions. We'd add BPI and PCS-4 as secondary measures before and after.

The timeline is roughly 11 weeks from IRB submission to pilot report. We could potentially run the active patient phase in Weeks 6–9 if IRB moves quickly.

I want to be clear about what this pilot is not: it's not powered for statistical significance, it doesn't include a control arm, and it won't produce publication-ready efficacy data. It will produce: a safety record, usability data, and preliminary outcome signal that will inform a Phase 2 design.`);
  }

  // ── Slide 9: Post-Approval Roadmap ──────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.white };

    sectionTitle(s, "  If You Approve: What Comes Next");

    const steps = [
      { num: "1", title: "IRB & Consent",         desc: "Submit IRB protocol, build informed consent flow into the app, finalize participant screening criteria.", icon: icons.certDark, color: C.teal },
      { num: "2", title: "Authentication",         desc: "User accounts so each patient's data is separate and secure. NextAuth v5 is already in the tech stack.", icon: icons.lockDark, color: C.teal },
      { num: "3", title: "Database Persistence",   desc: "Replace localStorage with PostgreSQL. Enables multi-user, multi-session longitudinal data for real outcomes analysis.", icon: icons.dbDark, color: C.teal },
      { num: "4", title: "Outcome Measures",       desc: "BPI and PCS-4 standardized assessments integrated into the app. Auto-scored and stored per participant.", icon: icons.flaskDark, color: C.teal },
      { num: "5", title: "Researcher Portal",      desc: "Admin dashboard for data export, safety monitoring, session transcripts review, and aggregate trend analysis.", icon: icons.userDark, color: C.teal },
    ];

    steps.forEach((st, i) => {
      const sx = 0.38 + i * 1.9;
      // Card
      s.addShape(pres.shapes.RECTANGLE, {
        x: sx, y: 0.92, w: 1.75, h: 4.3,
        fill: { color: C.white }, line: { color: "DDE8EA", width: 1 },
        shadow: makeShadow(),
      });
      // Top color bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: sx, y: 0.92, w: 1.75, h: 0.55,
        fill: { color: st.color }, line: { color: st.color, width: 0 },
      });
      s.addText(st.num, {
        x: sx + 0.12, y: 0.94, w: 0.4, h: 0.48,
        fontSize: 22, fontFace: "Trebuchet MS", bold: true,
        color: C.white, margin: 0,
      });

      // Icon
      s.addShape(pres.shapes.OVAL, {
        x: sx + 0.5, y: 1.6, w: 0.72, h: 0.72,
        fill: { color: C.mintLight }, line: { color: C.mintLight, width: 0 },
      });
      s.addImage({ data: st.icon, x: sx + 0.57, y: 1.67, w: 0.58, h: 0.58 });

      s.addText(st.title, {
        x: sx + 0.1, y: 2.44, w: 1.55, h: 0.55,
        fontSize: 11.5, fontFace: "Trebuchet MS", bold: true,
        color: C.darkText, align: "center", margin: 0, wrap: true,
      });
      s.addText(st.desc, {
        x: sx + 0.1, y: 3.06, w: 1.55, h: 2.0,
        fontSize: 10, fontFace: "Calibri", color: C.midText,
        align: "left", margin: 0, wrap: true,
      });
    });

    s.addNotes(`Assuming you approve the pilot, here's the sequenced roadmap.

These five steps are in dependency order. You can't run a real pilot without IRB clearance and consent — so that's first and not optional. Authentication comes next because you can't collect real patient data in a shared browser session. Database persistence follows authentication because you need a real user before you can tie data to them.

Steps 4 and 5 — the standardized outcome measures and the researcher portal — are the components that turn this from a demo into a clinical research instrument.

I want to be honest: this roadmap is approximately 6–8 weeks of development work after IRB approval is received. The infrastructure is designed for exactly this path — we're not rebuilding anything, we're adding to what exists.

One thing I'd welcome your guidance on: are there specific outcome instruments you'd prefer for this population beyond BPI and PCS-4? That's a clinical judgment I'd want your input on before we build the assessment screens.`);
  }

  // ── Slide 10: Ask / Next Steps ──────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.pres = pres;
    s.background = { color: C.navy };

    // Accent shapes
    s.addShape(pres.shapes.OVAL, {
      x: -0.8, y: 3.5, w: 3.5, h: 3.5,
      fill: { color: C.teal, transparency: 82 }, line: { color: C.teal, width: 0 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: 8.2, y: -0.5, w: 2.8, h: 2.8,
      fill: { color: C.mint, transparency: 80 }, line: { color: C.mint, width: 0 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.18, h: 5.625,
      fill: { color: C.mint }, line: { color: C.mint, width: 0 },
    });

    // The ask
    s.addText("One Question.", {
      x: 0.5, y: 0.55, w: 9, h: 0.75,
      fontSize: 38, fontFace: "Trebuchet MS", bold: true,
      color: C.white, align: "left", margin: 0,
    });

    // Big ask card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.4, w: 9.0, h: 1.08,
      fill: { color: C.teal, transparency: 20 },
      line: { color: C.mint, width: 1.5 },
    });
    s.addText("Can we move forward with a 5–10 patient pilot?", {
      x: 0.62, y: 1.44, w: 8.75, h: 0.98,
      fontSize: 22, fontFace: "Trebuchet MS", bold: true,
      color: C.white, align: "left", valign: "middle", margin: 0,
    });

    // Three next steps
    const nexts = [
      { num: "A", text: "Your approval in principle to proceed" },
      { num: "B", text: "Guidance on outcome measures (BPI, PCS-4, or alternatives)" },
      { num: "C", text: "IRB submission — we're ready to draft the protocol" },
    ];
    nexts.forEach((n, i) => {
      const nx = 0.5 + i * 3.12;
      s.addShape(pres.shapes.RECTANGLE, {
        x: nx, y: 2.72, w: 2.95, h: 1.65,
        fill: { color: C.white, transparency: 92 },
        line: { color: C.teal, transparency: 50, width: 1 },
      });
      s.addShape(pres.shapes.OVAL, {
        x: nx + 0.18, y: 2.85, w: 0.46, h: 0.46,
        fill: { color: C.mint }, line: { color: C.mint, width: 0 },
      });
      s.addText(n.num, {
        x: nx + 0.18, y: 2.85, w: 0.46, h: 0.46,
        fontSize: 15, fontFace: "Trebuchet MS", bold: true,
        color: C.navy, align: "center", valign: "middle", margin: 0,
      });
      s.addText(n.text, {
        x: nx + 0.18, y: 3.42, w: 2.6, h: 0.85,
        fontSize: 11, fontFace: "Calibri", color: C.mintLight,
        align: "left", margin: 0, wrap: true,
      });
    });

    // Thank you
    s.addText("Thank you, Vanessa.", {
      x: 0.5, y: 4.6, w: 4, h: 0.38,
      fontSize: 13, fontFace: "Calibri", italic: true,
      color: "A8C8D0", align: "left", margin: 0,
    });
    s.addText("Questions & Discussion", {
      x: 5.5, y: 4.6, w: 4, h: 0.38,
      fontSize: 12, fontFace: "Calibri",
      color: "A8C8D0", align: "right", margin: 0,
    });

    s.addNotes(`This is the close — keep it simple and direct.

[Pause. Let the room settle.]

We've built a working system grounded in PRT, with in-browser voice coaching, longitudinal pain tracking, and clinical safety baked in from day one. It works. You can try it today.

The only thing standing between this demo and a real clinical trial is your approval.

I have three asks:
A — Your approval in principle to proceed with the pilot design. That's the gate.
B — Your guidance on outcome instruments. BPI and PCS-4 are our current plan, but if you have a preferred tool for this population, I want to build around it.
C — IRB submission. We are ready to draft the protocol as soon as we leave this room.

[Leave time for questions. Suggested questions to prepare for:]
- "What does the coach say if a patient is in severe pain?" → Walk through the escalation policy.
- "How do you handle data privacy?" → CITI training, localStorage only in demo, IRB consent flow is the first post-approval step.
- "What if ElevenLabs goes down?" → The app degrades gracefully; voice is a feature, not the only interaction.
- "Have you done any user testing?" → Demo-ready, no patient testing yet — that's the pilot.`);
  }

  // ── Write file ──────────────────────────────────────────────────────────────
  await pres.writeFile({ fileName: "C:\\Users\\Owner\\Documents\\Work\\Research\\SomaAI_Vanessa_Presentation.pptx" });
  console.log("✅ Saved: SomaAI_Vanessa_Presentation.pptx");
}

build().catch(err => { console.error(err); process.exit(1); });
