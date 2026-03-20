using System.Collections.Generic;
using UnityEngine;

public class UIManager : MonoBehaviour
{
    [SerializeField] private GameObject onboardingScreen;
    [SerializeField] private GameObject parameterScreen;
    [SerializeField] private GameObject exerciseScreen;
    [SerializeField] private GameObject streakRecommendationScreen;

    [Header("Navigation Buttons")]
    [SerializeField] private GameObject backButton;
    [SerializeField] private GameObject forwardButton;

    [SerializeField] private GameObject anatomy;
    public enum ScreenType
    {
        OnboardingScreen,
        ParametersScreen,
        ExerciseScreen,
        StreakRecommendationScreen
    }

    [SerializeField] private ScreenType currentScreen;

    private Dictionary<ScreenType, GameObject> screens;

    void Awake()
    {
        // Map enums to the GameObjects
        screens = new Dictionary<ScreenType, GameObject>
        {
            { ScreenType.OnboardingScreen, onboardingScreen },
            { ScreenType.ParametersScreen, parameterScreen },
            { ScreenType.ExerciseScreen, exerciseScreen },
            { ScreenType.StreakRecommendationScreen, streakRecommendationScreen }
        };
    }

    void Start()
    {
        ShowScreen(currentScreen); // show initial screen
    }

    public void ShowScreen(ScreenType screen)
    {
        currentScreen = screen;

        // Enable only the chosen screen, disable all others
        foreach (var kvp in screens)
        {
            kvp.Value.SetActive(kvp.Key == screen);
        }

        UpdateNavigationButtons();
        
        if(screen == ScreenType.ParametersScreen) 
            anatomy.SetActive(true);
        else
            anatomy.SetActive(false);
    }

    public void Back()
    {
        if (currentScreen == ScreenType.ParametersScreen)
            ShowScreen(ScreenType.OnboardingScreen);
        else if (currentScreen == ScreenType.ExerciseScreen)
            ShowScreen(ScreenType.ParametersScreen);
        else if (currentScreen == ScreenType.StreakRecommendationScreen)
            ShowScreen(ScreenType.OnboardingScreen); // Back to home
    }

    public void Forward()
    {
        if (currentScreen == ScreenType.OnboardingScreen)
            ShowScreen(ScreenType.ParametersScreen);
        else if (currentScreen == ScreenType.ParametersScreen)
            ShowScreen(ScreenType.ExerciseScreen);
    }

    public void BackToHome()
    {
        ShowScreen(ScreenType.OnboardingScreen);
    }

    private void UpdateNavigationButtons()
    {
        if (backButton != null)
        {
            // Back hidden only on first screen
            backButton.SetActive(currentScreen != ScreenType.OnboardingScreen);
        }

        if (forwardButton != null)
        {
            // Forward hidden only on last screen
            forwardButton.SetActive(currentScreen != ScreenType.ExerciseScreen && currentScreen != ScreenType.StreakRecommendationScreen);
        }
    }
}
