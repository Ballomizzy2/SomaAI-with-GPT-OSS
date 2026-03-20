# SomaAI: A Gamified, AI-Guided Somatic Tracking Application for Chronic Pain Self-Management

**Oluwatobiloba Olaoye**
California State University, Monterey Bay

**Mentor: Professor Michael Guerrero**

---

## Abstract

Chronic pain affects approximately one in five Americans and frequently persists despite conventional biomedical treatment, suggesting that central neuroplastic processes—rather than ongoing tissue damage—sustain the pain experience. Somatic tracking, the anchor technique of Pain Reprocessing Therapy (PRT), teaches individuals to observe bodily sensations with curiosity and safety, gradually retraining the brain's threat response. However, guided somatic practice remains largely confined to clinical settings. This paper presents SomaAI, a prototype web application that combines real-time somatic check-ins, an AI-powered voice coach, an interactive 3D body map rendered via Unity WebGL, and gamification mechanics to deliver PRT-informed self-management outside the clinic. We describe the theoretical foundations, system architecture, and planned evaluation methodology, and discuss implications for scalable, neuroscience-based digital pain interventions.

**Keywords:** chronic pain, somatic tracking, Pain Reprocessing Therapy, gamification, mHealth, AI coaching, neuroplasticity

---

## 1. Introduction

Chronic pain is a pervasive global health burden, imposing substantial personal, social, and economic costs (Treede et al., 2015). Traditional biomedical models attribute pain to structural pathology, yet a growing body of neuroscience research demonstrates that many chronic pain conditions are driven by maladaptive central processing—termed *neuroplastic pain*—in which the brain misinterprets safe bodily signals as dangerous (Blackstone & Sinaiko, 2024; Ashar et al., 2022). As Blackstone and Sinaiko (2024) explain, a hallmark of neuroplastic pain is its inconsistency: if pain were purely structural, it would be constant, but when pain fluctuates or vanishes during periods of absorption, this is evidence that the brain is generating a protective alarm rather than reporting tissue damage. This reconceptualization has given rise to brain-targeted interventions, chief among them Pain Reprocessing Therapy (PRT).

PRT, developed by Alan Gordon and colleagues, is a structured psychological treatment grounded in the principle that chronic pain often represents a signal of danger rather than a signal of damage (Gordon & Ziv, 2021; Blackstone & Sinaiko, 2024). Through techniques such as somatic tracking, PRT helps patients retrain the brain to interpret sensations as safe rather than threatening. In a landmark randomized controlled trial, Ashar et al. (2022) found that 66% of PRT participants were pain-free or nearly pain-free after treatment, compared to 20% of placebo controls, with gains maintained at one-year follow-up. Somatic tracking—the mindful, curious observation of pain sensations without reactivity—serves as PRT's core corrective experience. Blackstone and Sinaiko (2024) describe this process as enabling the brain to update its threat predictions through repeated exposure to non-harmful signals: the individual feels the pain but simultaneously learns that the sensation is safe, gradually dismantling the fear–pain cycle that sustains chronicity.

Despite its efficacy, PRT and somatic tracking remain largely inaccessible outside of specialized clinics and trained therapists. Mobile health (mHealth) interventions offer a promising delivery mechanism, and gamification has shown potential for sustaining engagement in chronic disease self-management (Johnson et al., 2016). AI-driven conversational agents further enable personalized, scalable guidance without continuous clinician involvement (Fitzpatrick et al., 2017). Yet no widely available application integrates somatic tracking, gamification, and AI coaching into a single platform. SomaAI was designed to fill this gap.

## 2. System Design and Architecture

SomaAI is a web-based prototype built on **Next.js 14** (React, TypeScript) with an embedded **Unity WebGL** 3D body map and an in-browser voice-coaching workflow powered by **ElevenLabs Conversational AI**. The architecture enables three core modules:

**Interactive Body Map.** A Unity WebGL scene renders a 3D anatomical model that users interact with to indicate where they are receiving pain signals. The Unity canvas communicates bidirectionally with the web layer through a custom JavaScript bridge (`unity-bridge.js`), dispatching events such as `PAIN_CONTEXT_UPDATE` and `START_VOICE_CONVERSATION` via `postMessage`. This bridge allows the web application to receive pain context data—including body region, sensation quality (e.g., pressure, tightness, warmth), and self-reported severity—in real time.

**AI Voice Coach.** SomaAI integrates the **ElevenLabs Conversational AI** platform to provide an in-browser voice coach. When a user initiates a check-in or a pain flare is detected, the system generates a signed URL through a secure API route, passing the current pain context to a fine-tuned AI agent. The agent guides users through micro somatic-tracking exercises (30–60 seconds of body scanning, curiosity prompts, and safety reframing), following a structured therapeutic contract adapted from the PRT framework detailed by Blackstone and Sinaiko (2024). Critically, the coach emphasizes *outcome independence*—a concept central to PRT in which recovery is measured by the quality of one's awareness and relationship to sensation, not by immediate pain reduction (Blackstone & Sinaiko, 2024)—and includes safety disclaimers directing users to seek professional care when appropriate.

**Gamification and Progress Tracking.** A floating overlay dashboard displays a 7-day pain signal trend, exercise adherence rate, and a streak counter for consecutive check-in days. Session data—pain logs, exercise completions, and conversation records—are stored locally (localStorage for the prototype) and visualized to reinforce engagement. Rather than daily 0–10 pain ratings, which can reinforce the hypervigilance that Blackstone and Sinaiko (2024) identify as a key driver of the overprotective nervous system, the system prompts users to log "safety signals noticed" (e.g., warmth, looseness, calm breath) and functional achievements ("Did I do a valued activity despite sensations?"), aligning the tracking model with PRT's emphasis on building safety predictions rather than monitoring threats. A reframing library, drawn directly from Blackstone and Sinaiko's (2024) cognitive reappraisal framework, provides tap-to-expand cards that translate common sensations into safety interpretations (e.g., *pressure* reframed as "massage-like pressure" because compression can soothe receptors; *throbbing* reframed as "heartbeat signal" because the user is simply noticing vascular rhythm; *tightness* reframed as "gentle muscle engagement" because muscles can hold tone and still be safe).

## 3. Theoretical Foundations

SomaAI rests on three pillars. First, **pain neuroscience and PRT** posit that chronic pain is a brain-generated perceptual inference shaped by context, expectation, and prior learning, not a direct mirror of tissue state (Blackstone & Sinaiko, 2024; Moseley & Butler, 2015). Blackstone and Sinaiko (2024) detail how the nervous system becomes overprotective—key brain regions including the insula, anterior cingulate cortex, and prefrontal cortex misclassify safe sensory input as threatening, sustaining a cycle of amplification and fear. PRT intervenes by building a foundation of safety: patients learn to approach sensations with curiosity, reframe them using evidence-based cognitive reappraisals, and practice rewiring pain pathways through corrective experiences such as somatic tracking (Blackstone & Sinaiko, 2024; Ashar et al., 2022). Second, **gamification and behavior change** theory suggests that game mechanics (streaks, badges, progress visualization) transform routine health behaviors into intrinsically motivating activities, counteracting the engagement drop-off common in digital health tools (Johnson et al., 2016). Third, **AI-augmented therapy** research demonstrates that conversational agents can deliver cognitive-behavioral and acceptance-based interventions non-inferiorly to therapist-led formats while reducing clinician burden (Fitzpatrick et al., 2017), justifying the use of an AI coach for somatic guidance at scale.

## 4. Methods: Evaluation Plan

Evaluation proceeds in two phases designed to iteratively validate the system before introduction to clinical populations.

**Phase 1: Synthetic User Testing (Current).** To stress-test the prototype prior to live deployment, we developed five synthetic user profiles representing distinct chronic pain presentations: (1) a 35-year-old with chronic lower back pain and high pain catastrophizing; (2) a 22-year-old with fibromyalgia and high technology familiarity; (3) a 50-year-old with osteoarthritis and limited digital literacy; (4) a 28-year-old with complex regional pain syndrome and prior PRT exposure; and (5) a 45-year-old with migraines and moderate catastrophizing. Each profile was used to simulate a complete user journey through the interactive body map, AI voice coach, and gamification dashboard, generating structured observations across task completion, therapeutic fidelity of coach responses, and usability friction points. This phase informed iterative refinements to the Unity WebGL bridge, the ElevenLabs agent prompt architecture, and the safety-signal tracking interface.

**Phase 2: Real-Participant Pilot Study (Planned).** Following synthetic testing, a mixed-methods pilot study will recruit 5–10 adults with chronic pain, in collaboration with the Pain Psychology Center, for 2–4 weeks of in-home use. Quantitative measures will include check-in frequency, adherence (days used / total days), session duration, and pre/post self-report instruments (Pain Catastrophizing Scale, pain self-efficacy, emotional distress). Qualitative semi-structured interviews will explore user experience, perceived benefits and barriers, and suggestions for refinement. Exploratory analyses will examine whether gamification elements are cited as motivators, which micro-exercises correlate with short-term benefit, and whether higher adherence predicts reductions in catastrophizing. IRB approval will be sought through the relevant institutional review board prior to participant recruitment.

## 5. Discussion and Limitations

Several design decisions warrant discussion. Compressing somatic tracking into brief digital flows risks losing therapeutic depth; SomaAI addresses this through structured micro-exercise contracts adapted from the PRT framework, outcome-independent framing, and a reframing library grounded in Blackstone and Sinaiko's (2024) cognitive reappraisal techniques, rather than open-ended unguided prompts. Gamification mechanics may sustain short-term engagement but attenuate after novelty wears off; future iterations will evaluate whether safety-signal streaks—tracking positive sensory experiences rather than pain ratings—maintain motivational salience over longer windows. Without clinician oversight, users may over-monitor symptoms or misinterpret guidance—a concern Blackstone and Sinaiko (2024) raise explicitly—underscoring the safety disclaimers and clear scope boundaries embedded throughout the application. Selection bias toward tech-savvy early adopters may limit generalizability in Phase 2, and meaningful neuroplastic change may require longer observation windows or neuroimaging validation (e.g., fMRI, EEG) beyond the scope of the current pilot. Data privacy is paramount given the sensitivity of health information; future iterations must implement secure, HIPAA-aligned storage to replace the prototype's local storage approach.

## 6. Conclusion

SomaAI represents a proof-of-concept that somatic tracking—a neuroscience-grounded technique for rewiring the brain's chronic pain response, as systematized by Blackstone and Sinaiko (2024)—can be meaningfully embedded within a gamified, AI-guided digital platform. By combining an interactive 3D body map, real-time voice coaching, safety-oriented tracking rooted in PRT's reframing and corrective-experience framework, and motivational game mechanics, the application aims to bridge the accessibility gap between clinical PRT and daily self-management. If validated, this paradigm could democratize access to brain-based pain recovery, making the evidence-based techniques described by Blackstone and Sinaiko (2024) available to the millions who currently lack access to specialized therapy.

---

## References

Ashar, Y. K., Gordon, A., Schubiner, H., Uipi, C., Knight, K., Anderson, Z., ... & Wager, T. D. (2022). Effect of Pain Reprocessing Therapy vs placebo and usual care for patients with chronic back pain: A randomized clinical trial. *JAMA Psychiatry*, 79(1), 13–23.

Blackstone, V. M., & Sinaiko, O. S. (2024). *The Pain Reprocessing Therapy Workbook: Using the Brain's Neuroplasticity to Break the Cycle of Chronic Pain*. New Harbinger Publications.

Fitzpatrick, K. K., Darcy, A., & Vierhile, M. (2017). Delivering cognitive behavior therapy to young adults with symptoms of depression via a fully automated conversational agent (Woebot). *JMIR Mental Health*, 4(2), e19.

Gordon, A., & Ziv, A. (2021). *The Way Out: A Revolutionary, Scientifically Proven Approach to Healing Chronic Pain*. Avery.

Johnson, D., Deterding, S., Kuhn, K. A., Staneva, A., Stoyanov, S., & Hides, L. (2016). Gamification for health and wellbeing: A systematic review of the literature. *Internet Interventions*, 6, 89–106.

Moseley, G. L., & Butler, D. S. (2015). Fifteen years of explaining pain: The past, present, and future. *The Journal of Pain*, 16(9), 807–813.

Treede, R. D., Rief, W., Barke, A., Aziz, Q., Bennett, M. I., Benoliel, R., ... & Wang, S. J. (2015). A classification of chronic pain for ICD-11. *Pain*, 156(6), 1003–1007.
