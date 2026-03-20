using UnityEngine;
using System;
using System.Collections.Generic;
using System.IO;

[System.Serializable]
public class FeedbackEntry
{
    public string timestamp;
    public string feedback;
    public string recommendation; // The recommendation that was shown when feedback was given
    
    public FeedbackEntry(string feedbackText, string recommendationText)
    {
        timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        feedback = feedbackText;
        recommendation = recommendationText;
    }
}

[System.Serializable]
public class FeedbackData
{
    public List<FeedbackEntry> entries = new List<FeedbackEntry>();
}

public class FeedbackManager : MonoBehaviour
{
    private static FeedbackManager instance;
    public static FeedbackManager Instance
    {
        get
        {
            if (instance == null)
            {
                instance = FindObjectOfType<FeedbackManager>();
                if (instance == null)
                {
                    GameObject go = new GameObject("FeedbackManager");
                    instance = go.AddComponent<FeedbackManager>();
                    DontDestroyOnLoad(go);
                }
            }
            return instance;
        }
    }

    private FeedbackData feedbackData;
    private const string FEEDBACK_DATA_KEY = "FeedbackData";
    private const int MAX_ENTRIES = 1000; // Limit to prevent excessive storage

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
            LoadFeedbackData();
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }

    void LoadFeedbackData()
    {
        // Try to load from PlayerPrefs (for now)
        string jsonData = PlayerPrefs.GetString(FEEDBACK_DATA_KEY, "");
        
        if (!string.IsNullOrEmpty(jsonData))
        {
            try
            {
                feedbackData = JsonUtility.FromJson<FeedbackData>(jsonData);
                if (feedbackData == null || feedbackData.entries == null)
                {
                    feedbackData = new FeedbackData();
                }
            }
            catch (Exception e)
            {
                Debug.LogError("Error loading feedback data: " + e.Message);
                feedbackData = new FeedbackData();
            }
        }
        else
        {
            feedbackData = new FeedbackData();
        }
    }

    void SaveFeedbackData()
    {
        if (feedbackData == null || feedbackData.entries == null)
        {
            feedbackData = new FeedbackData();
        }

        // Limit the number of entries
        if (feedbackData.entries.Count > MAX_ENTRIES)
        {
            // Remove oldest entries
            int removeCount = feedbackData.entries.Count - MAX_ENTRIES;
            feedbackData.entries.RemoveRange(0, removeCount);
        }

        try
        {
            string jsonData = JsonUtility.ToJson(feedbackData, true);
            PlayerPrefs.SetString(FEEDBACK_DATA_KEY, jsonData);
            PlayerPrefs.Save();
            
            Debug.Log($"Feedback saved. Total entries: {feedbackData.entries.Count}");
        }
        catch (Exception e)
        {
            Debug.LogError("Error saving feedback data: " + e.Message);
        }
    }

    public void StoreFeedback(string feedbackText, string recommendationText = "")
    {
        if (string.IsNullOrEmpty(feedbackText))
        {
            Debug.LogWarning("Attempted to store empty feedback");
            return;
        }

        if (feedbackData == null)
        {
            feedbackData = new FeedbackData();
        }

        FeedbackEntry entry = new FeedbackEntry(feedbackText, recommendationText);
        feedbackData.entries.Add(entry);
        
        SaveFeedbackData();
        
        Debug.Log($"Feedback stored: {feedbackText.Substring(0, Mathf.Min(50, feedbackText.Length))}...");
    }

    public List<FeedbackEntry> GetAllFeedback()
    {
        if (feedbackData == null)
        {
            return new List<FeedbackEntry>();
        }
        return new List<FeedbackEntry>(feedbackData.entries);
    }

    public int GetFeedbackCount()
    {
        if (feedbackData == null || feedbackData.entries == null)
        {
            return 0;
        }
        return feedbackData.entries.Count;
    }

    public void ClearAllFeedback()
    {
        if (feedbackData != null)
        {
            feedbackData.entries.Clear();
            SaveFeedbackData();
        }
        PlayerPrefs.DeleteKey(FEEDBACK_DATA_KEY);
        Debug.Log("All feedback cleared");
    }

    // Export feedback to JSON file (for later use)
    public void ExportFeedbackToFile(string filePath = "")
    {
        if (string.IsNullOrEmpty(filePath))
        {
            filePath = Path.Combine(Application.persistentDataPath, "feedback_export.json");
        }

        try
        {
            string jsonData = JsonUtility.ToJson(feedbackData, true);
            File.WriteAllText(filePath, jsonData);
            Debug.Log($"Feedback exported to: {filePath}");
        }
        catch (Exception e)
        {
            Debug.LogError("Error exporting feedback: " + e.Message);
        }
    }
}

