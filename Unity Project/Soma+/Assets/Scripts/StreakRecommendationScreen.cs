using UnityEngine;
using TMPro;

public class StreakRecommendationScreen : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private TextMeshProUGUI streakText;
    [SerializeField] private TextMeshProUGUI recommendationText;
    [SerializeField] private TextMeshProUGUI streakMessageText;
    
    [Header("Feedback UI")]
    [SerializeField] private TMP_InputField feedbackInputField;
    [SerializeField] private UnityEngine.UI.Button submitFeedbackButton;
    [SerializeField] private TextMeshProUGUI feedbackLabel;
    
    private GamificationManager gamificationManager;
    private AppContoller appController;
    private FeedbackManager feedbackManager;
    private string currentRecommendation = "";

    void Start()
    {
        gamificationManager = GamificationManager.Instance;
        appController = FindObjectOfType<AppContoller>();
        feedbackManager = FeedbackManager.Instance;
        UpdateStreakDisplay();
        SetupFeedbackInput();
    }
    
    void SetupFeedbackInput()
    {
        if (feedbackInputField != null)
        {
            // Set placeholder text if needed
            feedbackInputField.placeholder.GetComponent<TextMeshProUGUI>()?.SetText("Share your thoughts about this recommendation...");
        }
        
        if (submitFeedbackButton != null)
        {
            submitFeedbackButton.onClick.AddListener(() => OnSubmitFeedback(""));
        }
        
        // Also allow Enter key to submit
        if (feedbackInputField != null)
        {
            feedbackInputField.onSubmit.AddListener(OnSubmitFeedback);
        }
    }

    void OnEnable()
    {
        // Update display when screen becomes active
        UpdateStreakDisplay();
        
        // Try to get the latest recommendation from AppController
        if (appController != null)
        {
            string recommendation = appController.GetLatestRecommendation();
            if (!string.IsNullOrEmpty(recommendation))
            {
                SetRecommendation(recommendation);
            }
        }
        
        // Clear feedback input when screen is shown
        if (feedbackInputField != null)
        {
            feedbackInputField.text = "";
        }
    }

    public void UpdateStreakDisplay()
    {
        if (gamificationManager == null)
        {
            gamificationManager = GamificationManager.Instance;
        }

        if (gamificationManager != null)
        {
            int streak = gamificationManager.GetCurrentStreak();
            string message = gamificationManager.GetStreakMessage();
            
            if (streakText != null)
            {
                streakText.text = streak > 0 ? streak.ToString() : "0";
            }
            
            if (streakMessageText != null)
            {
                streakMessageText.text = message;
            }
        }
    }

    public void SetRecommendation(string recommendation)
    {
        currentRecommendation = recommendation;
        if (recommendationText != null)
        {
            recommendationText.text = recommendation;
        }
    }
    
    public void OnSubmitFeedback(string value = "")
    {
        if (feedbackInputField == null)
        {
            Debug.LogWarning("Feedback input field not assigned");
            return;
        }
        
        string feedbackText = feedbackInputField.text;
        
        if (string.IsNullOrWhiteSpace(feedbackText))
        {
            Debug.Log("Empty feedback, not storing");
            return;
        }
        
        // Store the feedback
        if (feedbackManager != null)
        {
            feedbackManager.StoreFeedback(feedbackText, currentRecommendation);
        }
        else
        {
            Debug.LogWarning("FeedbackManager not found");
        }
        
        // Clear the input field
        feedbackInputField.text = "";
        
        // Optionally show a confirmation message
        Debug.Log("Feedback submitted successfully!");
        
        // You could add a visual confirmation here (e.g., show a "Thank you!" message)
    }
    
    void OnDestroy()
    {
        // Clean up event listeners
        if (submitFeedbackButton != null)
        {
            submitFeedbackButton.onClick.RemoveAllListeners();
        }
        
        if (feedbackInputField != null)
        {
            feedbackInputField.onSubmit.RemoveAllListeners();
        }
    }
}

