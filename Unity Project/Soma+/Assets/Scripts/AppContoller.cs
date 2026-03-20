using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using System.Text;
using System.Runtime.InteropServices;
using UnityEngine.Networking;
using UnityEngine.UI;
using TMPro;

public class AppContoller : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void SendPainContextToWeb(string json);

    [DllImport("__Internal")]
    private static extern void StartVoiceConversationFromWeb(string json);

    [DllImport("__Internal")]
    private static extern void SendUnityEventToWeb(string json);
#endif

    //parameters to keep track of
    /***
                *region="leg",         # fill from Unity UI
                quality=None,         # e.g., "sharp","burning","dull","throbbing"
                severity=None,        # 0..10
                days_since_onset=None,
                ema_trend=None,
                neuro=False,
                trauma=False,
     * *
     */

    //UI STuff
    [SerializeField] private TMP_InputField contextInput, qualityInput, daysInput;
    [SerializeField] private Slider severitySlider;
    // UI Output
    [SerializeField] private TextMeshProUGUI AIoutput;
    
    // UI Manager reference
    private UIManager uiManager;
    
    [SerializeField] private string pain_context;
    [SerializeField] private string pain_region;
    [SerializeField] private string pain_quality;
    [SerializeField] [Range(0,10)] private float pain_severity;
    [SerializeField] private string days_since_onset = "0";
    [SerializeField] [Range(0,1)] private float ema_trend = 0.0f;

    [Header("Somatic 3D Experience (Unity-only)")]
    [SerializeField] private Transform anatomyRoot;
    [SerializeField] private Camera mainCam;
    [SerializeField] private Color spotlightColor = new Color(0.25f, 0.85f, 0.75f, 1f);
    [SerializeField] [Range(0f, 4f)] private float spotlightMaxEmission = 1.6f;
    [SerializeField] [Range(0.2f, 2.5f)] private float focusMoveSeconds = 0.6f;
    [SerializeField] private Vector3 focusOffset = new Vector3(0f, 0.2f, -1.6f);

    private string viewMode = "safety"; // 'safety' | 'alarm'
    private float breathBpm = 6f;
    private float breathPhase01 = 0f;
    private Transform selectedRegion;
    private Renderer[] selectedRenderers;
    private float selectedSince;
    private float dwellSeconds;
    private Coroutine focusRoutine;

    private struct MaterialSnapshot
    {
        public bool hasEmission;
        public Color emissionColor;
        public bool hasBaseColor;
        public Color baseColor;
    }
    private readonly Dictionary<Material, MaterialSnapshot> materialSnapshots = new Dictionary<Material, MaterialSnapshot>();
    
    // Store AI recommendation for streak screen
    private string latestRecommendation = "";

    public void SetParameters()
    {
        pain_context = contextInput.text;
        pain_quality = qualityInput.text;
        pain_severity = severitySlider.value;
        days_since_onset = daysInput.text;
        
        // Record check-in for gamification
        if (GamificationManager.Instance != null)
        {
            GamificationManager.Instance.RecordCheckIn();
        }
        
        // Start voice conversation via the web bridge (auto-starts the call)
        NotifyWebBridge();
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
        StartVoiceConversationFromWeb(payload);
        Debug.Log("[WebBridge] Started voice conversation with context: " + payload);
#else
        Debug.Log("[WebBridge] Skipped (not WebGL): " + payload);
#endif
    }

    [System.Serializable]
    private class PainContextPayload
    {
        public string region;
        public string quality;
        public float severity;
        public string days_since_onset;
    }

    public void SetPainRegionFromAnatomy(string regionName)
    {
        pain_region = regionName;
        OnRegionSelected(regionName);
        SendPainContextUpdate();
    }

    // Called from web via SendMessage, or from click handler.
    public void OnRegionSelected(string regionName)
    {
        var go = GameObject.Find(regionName);
        if (go == null)
        {
            Debug.LogWarning("[Somatic3D] Region GameObject not found: " + regionName);
            selectedRegion = null;
            selectedRenderers = null;
            return;
        }

        selectedRegion = go.transform;
        selectedRenderers = go.GetComponentsInChildren<Renderer>(true);
        selectedSince = Time.time;
        dwellSeconds = 0f;

        FocusOnRegion(regionName);

        EmitUnityEvent("region_selected", new Dictionary<string, object> { { "region", regionName } });
    }

    // Called from web (Next.js) via UnityInstance.SendMessage("AppContoller", "SetViewMode", "safety")
    public void SetViewMode(string mode)
    {
        if (string.IsNullOrEmpty(mode)) return;
        viewMode = mode.Trim().ToLowerInvariant();
        EmitUnityEvent("view_mode_set", new Dictionary<string, object> { { "mode", viewMode } });
    }

    // Called from web via SendMessage with bpm as string (e.g. "6")
    public void SetBreathBpm(string bpm)
    {
        if (string.IsNullOrEmpty(bpm)) return;
        if (float.TryParse(bpm, out var parsed))
        {
            if (parsed <= 0f)
            {
                breathBpm = 0f;
                EmitUnityEvent("breath_bpm_set", new Dictionary<string, object> { { "bpm", 0 } });
                return;
            }

            breathBpm = Mathf.Clamp(parsed, 2f, 12f);
            EmitUnityEvent("breath_bpm_set", new Dictionary<string, object> { { "bpm", breathBpm } });
        }
    }

    public void FocusOnRegion(string regionName)
    {
        if (mainCam == null) mainCam = Camera.main;
        if (mainCam == null) return;

        var go = GameObject.Find(regionName);
        if (go == null) return;

        var target = go.transform;
        if (focusRoutine != null) StopCoroutine(focusRoutine);
        focusRoutine = StartCoroutine(SmoothFocus(target));
    }

    private IEnumerator SmoothFocus(Transform target)
    {
        var camT = mainCam.transform;
        var startPos = camT.position;
        var startRot = camT.rotation;

        var targetPos = target.position + focusOffset;
        var targetRot = Quaternion.LookRotation((target.position - targetPos).normalized, Vector3.up);

        var t = 0f;
        while (t < 1f)
        {
            t += Time.deltaTime / Mathf.Max(0.01f, focusMoveSeconds);
            var eased = Mathf.SmoothStep(0f, 1f, t);
            camT.position = Vector3.Lerp(startPos, targetPos, eased);
            camT.rotation = Quaternion.Slerp(startRot, targetRot, eased);
            yield return null;
        }
    }

    private void SendPainContextUpdate()
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
        Debug.Log("[WebBridge] Sent pain context update: " + payload);
#else
        Debug.Log("[WebBridge] Skipped context update (not WebGL): " + payload);
#endif
    }
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        uiManager = FindObjectOfType<UIManager>();
        if (mainCam == null) mainCam = Camera.main;
        if (anatomyRoot == null)
        {
            var anatomy = GameObject.Find("Anatomy Figure");
            if (anatomy != null) anatomyRoot = anatomy.transform;
        }
        /*StartCoroutine(PostSomaCoachAPI(
            pain_context,
            pain_region,
            pain_quality,
            pain_severity.ToString(),
            days_since_onset.ToString(),
            ema_trend.ToString()
        ));
        StartCoroutine("GetSomaCoachAPIResponse");*/
    }

    // Update is called once per frame
    void Update()
    {
        // Breath-synced body wave (subtle, safe "regulation" cue)
        if (anatomyRoot != null)
        {
            if (breathBpm > 0.001f)
            {
                var hz = breathBpm / 60f; // breaths per second
                breathPhase01 = (breathPhase01 + Time.deltaTime * hz) % 1f;
                var wave = Mathf.Sin(breathPhase01 * Mathf.PI * 2f) * 0.5f + 0.5f; // 0..1

                // Alarm mode is a bit faster + tighter; safety mode is smoother.
                var amp = viewMode == "alarm" ? 0.0045f : 0.0075f;
                var scale = 1f + (wave - 0.5f) * amp;
                anatomyRoot.localScale = new Vector3(scale, scale, scale);
            }
            else
            {
                anatomyRoot.localScale = Vector3.one;
            }
        }

        // Presence reward + attention spotlight
        if (selectedRegion != null && selectedRenderers != null && selectedRenderers.Length > 0)
        {
            dwellSeconds = Mathf.Max(0f, Time.time - selectedSince);
            var presence01 = Mathf.Clamp01(dwellSeconds / 20f); // 0..1 over 20s

            // In alarm mode, spotlight is higher contrast but less "beautiful";
            // in safety mode, it becomes warmer/smoother as presence builds.
            var baseIntensity = viewMode == "alarm" ? 0.75f : 0.55f;
            var presenceIntensity = baseIntensity + presence01 * 0.9f;
            ApplySpotlight(selectedRenderers, presenceIntensity);

            // Emit a milestone event so the web app can log it server-side.
            if (Mathf.Abs(dwellSeconds - 10f) < Time.deltaTime)
            {
                EmitUnityEvent("presence_milestone", new Dictionary<string, object> {
                    { "region", pain_region },
                    { "seconds", 10 }
                });
            }
            if (Mathf.Abs(dwellSeconds - 20f) < Time.deltaTime)
            {
                EmitUnityEvent("presence_milestone", new Dictionary<string, object> {
                    { "region", pain_region },
                    { "seconds", 20 }
                });
            }
        }
    }

    private void ApplySpotlight(Renderer[] renderers, float intensity01)
    {
        var clamped = Mathf.Clamp01(intensity01);
        var emission = spotlightColor * (spotlightMaxEmission * clamped);
        var baseTint = viewMode == "alarm" ? new Color(0.9f, 0.5f, 0.45f, 1f) : spotlightColor;

        foreach (var r in renderers)
        {
            if (r == null) continue;
            var mats = r.materials;
            for (int i = 0; i < mats.Length; i++)
            {
                var m = mats[i];
                if (m == null) continue;
                if (!materialSnapshots.ContainsKey(m))
                {
                    var snap = new MaterialSnapshot();
                    snap.hasEmission = m.HasProperty("_EmissionColor");
                    if (snap.hasEmission) snap.emissionColor = m.GetColor("_EmissionColor");

                    snap.hasBaseColor = m.HasProperty("_BaseColor") || m.HasProperty("_Color");
                    if (m.HasProperty("_BaseColor")) snap.baseColor = m.GetColor("_BaseColor");
                    else if (m.HasProperty("_Color")) snap.baseColor = m.GetColor("_Color");

                    materialSnapshots[m] = snap;
                }

                if (m.HasProperty("_EmissionColor"))
                {
                    m.EnableKeyword("_EMISSION");
                    m.SetColor("_EmissionColor", emission);
                }

                // "Non-damage aesthetic": shift gently toward clarity/safety tint.
                if (m.HasProperty("_BaseColor"))
                {
                    var orig = materialSnapshots[m].baseColor;
                    m.SetColor("_BaseColor", Color.Lerp(orig, baseTint, clamped * 0.35f));
                }
                else if (m.HasProperty("_Color"))
                {
                    var orig = materialSnapshots[m].baseColor;
                    m.SetColor("_Color", Color.Lerp(orig, baseTint, clamped * 0.35f));
                }
            }
        }
    }

    private void EmitUnityEvent(string eventName, Dictionary<string, object> payload)
    {
        var json = MiniJson.Serialize(new Dictionary<string, object> {
            { "eventName", eventName },
            { "payload", payload }
        });

#if UNITY_WEBGL && !UNITY_EDITOR
        SendUnityEventToWeb(json);
#else
        Debug.Log("[UnityEvent] " + json);
#endif
    }

    // Tiny JSON serializer (no dependencies) for simple payloads.
    private static class MiniJson
    {
        public static string Serialize(object obj)
        {
            var sb = new StringBuilder();
            SerializeValue(obj, sb);
            return sb.ToString();
        }

        private static void SerializeValue(object value, StringBuilder sb)
        {
            if (value == null) { sb.Append("null"); return; }

            if (value is string s) { SerializeString(s, sb); return; }
            if (value is bool b) { sb.Append(b ? "true" : "false"); return; }

            if (value is float || value is double || value is int || value is long || value is short)
            {
                sb.Append(System.Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture));
                return;
            }

            if (value is IDictionary<string, object> dict)
            {
                sb.Append("{");
                var first = true;
                foreach (var kv in dict)
                {
                    if (!first) sb.Append(",");
                    first = false;
                    SerializeString(kv.Key, sb);
                    sb.Append(":");
                    SerializeValue(kv.Value, sb);
                }
                sb.Append("}");
                return;
            }

            // Fallback: ToString as JSON string
            SerializeString(value.ToString(), sb);
        }

        private static void SerializeString(string s, StringBuilder sb)
        {
            sb.Append('"');
            for (int i = 0; i < s.Length; i++)
            {
                var c = s[i];
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < 32) sb.Append("\\u" + ((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            sb.Append('"');
        }
    }
    
    public string GetLatestRecommendation()
    {
        return latestRecommendation;
    }

    public void OnVoiceCallEnded()
    {
        Debug.Log("[WebBridge] Voice call ended, navigating to StreakRecommendationScreen");
        if (uiManager != null)
        {
            uiManager.ShowScreen(UIManager.ScreenType.StreakRecommendationScreen);

            StreakRecommendationScreen streakScreen = FindObjectOfType<StreakRecommendationScreen>();
            if (streakScreen != null)
            {
                streakScreen.SetRecommendation(latestRecommendation);
            }
        }
    }
    public class AIResponse
    {
        public string word;
    }
}
