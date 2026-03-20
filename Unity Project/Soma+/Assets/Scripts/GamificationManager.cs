using UnityEngine;
using System;
using System.IO;

public class GamificationManager : MonoBehaviour
{
    private static GamificationManager instance;
    public static GamificationManager Instance
    {
        get
        {
            if (instance == null)
            {
                instance = FindObjectOfType<GamificationManager>();
                if (instance == null)
                {
                    GameObject go = new GameObject("GamificationManager");
                    instance = go.AddComponent<GamificationManager>();
                    DontDestroyOnLoad(go);
                }
            }
            return instance;
        }
    }

    private int currentStreak = 0;
    private DateTime lastCheckInDate;
    private const string STREAK_KEY = "CurrentStreak";
    private const string LAST_CHECKIN_KEY = "LastCheckInDate";

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
            LoadStreakData();
            CheckStreakContinuity();
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }

    void LoadStreakData()
    {
        // Load streak from PlayerPrefs
        currentStreak = PlayerPrefs.GetInt(STREAK_KEY, 0);
        
        // Load last check-in date
        string lastCheckInString = PlayerPrefs.GetString(LAST_CHECKIN_KEY, "");
        if (!string.IsNullOrEmpty(lastCheckInString))
        {
            if (DateTime.TryParse(lastCheckInString, out DateTime date))
            {
                lastCheckInDate = date;
            }
            else
            {
                lastCheckInDate = DateTime.MinValue;
            }
        }
        else
        {
            lastCheckInDate = DateTime.MinValue;
        }
    }

    void CheckStreakContinuity()
    {
        DateTime today = DateTime.Today;
        
        if (lastCheckInDate == DateTime.MinValue)
        {
            // First time user - no streak yet
            return;
        }

        int daysDifference = (today - lastCheckInDate).Days;

        if (daysDifference == 0)
        {
            // Already checked in today - streak continues
            return;
        }
        else if (daysDifference == 1)
        {
            // Consecutive day - increment streak
            currentStreak++;
            lastCheckInDate = today;
            SaveStreakData();
        }
        else
        {
            // Streak broken - reset to 1
            currentStreak = 1;
            lastCheckInDate = today;
            SaveStreakData();
        }
    }

    public void RecordCheckIn()
    {
        DateTime today = DateTime.Today;
        
        if (lastCheckInDate == DateTime.MinValue)
        {
            // First check-in
            currentStreak = 1;
            lastCheckInDate = today;
            SaveStreakData();
            return;
        }

        int daysDifference = (today - lastCheckInDate).Days;

        if (daysDifference == 0)
        {
            // Already checked in today - don't increment again
            return;
        }
        else if (daysDifference == 1)
        {
            // Consecutive day - increment streak
            currentStreak++;
            lastCheckInDate = today;
            SaveStreakData();
        }
        else
        {
            // Streak broken - reset to 1
            currentStreak = 1;
            lastCheckInDate = today;
            SaveStreakData();
        }
    }

    public int GetCurrentStreak()
    {
        return currentStreak;
    }

    public string GetStreakMessage()
    {
        if (currentStreak == 0)
        {
            return "Welcome! Start your streak today!";
        }
        else if (currentStreak == 1)
        {
            return "Day 1! Great start to your journey!";
        }
        else if (currentStreak < 7)
        {
            return $"Current Streak: {currentStreak} days!\nKeep it up, you're building great habits!";
        }
        else if (currentStreak < 30)
        {
            return $"Current Streak: {currentStreak} days!\nWow! You're crushing it! Stay mindful of your sensations!";
        }
        else
        {
            return $"Current Streak: {currentStreak} days!\nIncredible! You're a true champion of self-awareness!";
        }
    }

    void SaveStreakData()
    {
        PlayerPrefs.SetInt(STREAK_KEY, currentStreak);
        PlayerPrefs.SetString(LAST_CHECKIN_KEY, lastCheckInDate.ToString("yyyy-MM-dd"));
        PlayerPrefs.Save();
    }

    public void ResetStreak()
    {
        currentStreak = 0;
        lastCheckInDate = DateTime.MinValue;
        SaveStreakData();
    }
}

