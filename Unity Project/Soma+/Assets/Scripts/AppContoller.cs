using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using System.Text;
using UnityEngine.Networking;
using UnityEngine.UI;
using TMPro;

public class AppContoller : MonoBehaviour
{
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
    
    
    
    [SerializeField] private string pain_context;
    [SerializeField] private string pain_region;
    [SerializeField] private string pain_quality;
    [SerializeField] [Range(0,10)] private float pain_severity;
    [SerializeField] private string days_since_onset = "0";
    [SerializeField] [Range(0,1)] private float ema_trend = 0.0f;

    public void SetParameters()
    {
        pain_context = contextInput.text;
        pain_quality = qualityInput.text;
        pain_severity = severitySlider.value;
        days_since_onset = daysInput.text;
        
        StartCoroutine(PostSomaCoachAPI(
            pain_context,
            pain_region,
            pain_quality,
            pain_severity.ToString(),
            days_since_onset,
            ema_trend.ToString()
        ));
        StartCoroutine("GetSomaCoachAPIResponse");
    }

    public void SetPainRegionFromAnatomy(string regionName)
    {
        pain_region = regionName;
    }
    [SerializeField] private string webRequestURL = "http://127.0.0.1:8000/";
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
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
        
    }
    
    public IEnumerator GetSomaCoachAPIResponse() //makes a call to the GPT-OSS brain we've been working on.
    {
        yield return new WaitForSeconds(5);
        using (UnityWebRequest webReq = (UnityWebRequest.Get((webRequestURL))))
        {
            yield return webReq.SendWebRequest();

            //var jsonOutput = JsonUtility.FromJson<AIResponse>(webReq.downloadHandler.text);

            Debug.Log(" says: " + webReq.downloadHandler.text);
            AIoutput.text = "\n" + webReq.downloadHandler.text;

            if (webReq.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("GET request successful: " + webReq.downloadHandler.text);
            }
            else
            {
                Debug.LogError("GET request failed: " + webReq.error);
            }
        }
    }
    
    IEnumerator PostSomaCoachAPI(
        string context,
        string region = null,
        string quality = null,
        string severity = null,
        string daysSinceOnset = null,
        string emaTrend = null,
        bool? neuro = null,
        bool? trauma = null
    )
    {
        // Build query string safely
        var sb = new StringBuilder();
        void Add(string key, string val)
        {
            if (!string.IsNullOrEmpty(val))
            {
                if (sb.Length > 0) sb.Append('&');
                sb.Append(key).Append('=').Append(UnityWebRequest.EscapeURL(val));
            }
        }
        void AddBool(string key, bool? val)
        {
            if (val.HasValue)
            {
                if (sb.Length > 0) sb.Append('&');
                sb.Append(key).Append('=').Append(val.Value ? "true" : "false");
            }
        }

        Add("context", context);
        Add("region", region);
        Add("quality", quality);
        Add("severity", severity);
        Add("days_since_onset", daysSinceOnset);
        Add("ema_trend", emaTrend);
        AddBool("neuro", neuro);
        AddBool("trauma", trauma);

        string url = webRequestURL + (sb.Length > 0 ? "?" + sb.ToString() : "");

        // POST with no body (data is in the query string)
        var request = new UnityWebRequest(url, "POST");
        request.downloadHandler = new DownloadHandlerBuffer();

        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
            Debug.Log("POST ok: " + request.downloadHandler.text);
        else
            Debug.LogError("POST failed: " + request.error + " (" + request.responseCode + ")");
    }



    public class AIResponse
    {
        public string word;
    }
}
