# Gamification Setup Guide

This guide explains the gamification features that have been added and how to configure them in Unity.

## Overview

The gamification system has been implemented with the following features:
1. **Streak Tracking**: Tracks consecutive days of check-ins
2. **Automatic Navigation**: After clicking the call button, users are moved to the Streak + Recommendation screen
3. **Back to Home**: The back button on the streak screen returns to the Onboarding Screen

## New Scripts Added

1. **GamificationManager.cs** - Singleton that manages streak tracking and persistence
2. **StreakRecommendationScreen.cs** - Handles the display of streak information and recommendations
3. **FeedbackManager.cs** - Manages storage and retrieval of user feedback

## Modified Scripts

1. **AppController.cs** - Now records check-ins and navigates to streak screen after API call
2. **UIManager.cs** - Added new `StreakRecommendationScreen` screen type and updated navigation

## Unity Editor Setup Instructions

### 1. Create the Streak Recommendation Screen GameObject

1. In your Unity scene, create a new empty GameObject as a child of your Canvas (or main UI container)
2. Name it `StreakRecommendationScreen`
3. Add the `StreakRecommendationScreen` script component to it

### 2. Set Up UI Elements on the Streak Screen

Create the following UI elements as children of the `StreakRecommendationScreen` GameObject:

#### a) Streak Display Panel
- Create a TextMeshProUGUI element named `StreakText`
  - This will display the current streak number
  - Position it prominently (e.g., center-top of screen)
  - Style it with large, bold font

#### b) Streak Message Text
- Create a TextMeshProUGUI element named `StreakMessageText`
  - This will display motivational messages about the streak
  - Position it below the streak number
  - Style it with medium-sized font

#### c) Recommendation Text
- Create a TextMeshProUGUI element named `RecommendationText`
  - This will display the AI recommendation from the API
  - Position it in the center or lower portion of the screen
  - Make it scrollable if needed (use ScrollRect)

#### d) Feedback Input Section
- Create a TextMeshProUGUI label named `FeedbackLabel`
  - Text: "How was this recommendation? (Optional)"
  - Position it below the recommendation text
  
- Create a TMP_InputField named `FeedbackInputField`
  - Set it to multi-line if you want longer feedback
  - Position it below the feedback label
  - Set placeholder text: "Share your thoughts about this recommendation..."
  
- Create a Button named `SubmitFeedbackButton`
  - Text: "Submit Feedback"
  - Position it next to or below the feedback input field
  - The script will automatically handle the click event

#### e) Back to Home Button
- Create a Button named `BackToHomeButton`
  - Position it at the bottom of the screen
  - Set its OnClick event to call `UIManager.Back()`

### 3. Configure UIManager

1. Select the GameObject with the `UIManager` component
2. In the Inspector, find the `Streak Recommendation Screen` field
3. Assign the `StreakRecommendationScreen` GameObject you created above

### 4. Configure StreakRecommendationScreen Script

1. Select the `StreakRecommendationScreen` GameObject
2. In the Inspector, find the `StreakRecommendationScreen` component
3. Assign the UI references:
   - **Streak Text**: Drag the `StreakText` TextMeshProUGUI element
   - **Recommendation Text**: Drag the `RecommendationText` TextMeshProUGUI element
   - **Streak Message Text**: Drag the `StreakMessageText` TextMeshProUGUI element
   - **Feedback Input Field**: Drag the `FeedbackInputField` TMP_InputField element
   - **Submit Feedback Button**: Drag the `SubmitFeedbackButton` Button element
   - **Feedback Label**: (Optional) Drag the `FeedbackLabel` TextMeshProUGUI element

### 5. Set Up GamificationManager

1. Create an empty GameObject in your scene
2. Name it `GamificationManager`
3. Add the `GamificationManager` script component to it
4. The script will automatically persist across scenes (DontDestroyOnLoad)

### 6. Set Up FeedbackManager

1. Create an empty GameObject in your scene
2. Name it `FeedbackManager`
3. Add the `FeedbackManager` script component to it
4. The script will automatically persist across scenes (DontDestroyOnLoad)
5. Feedback is stored in PlayerPrefs by default (can be exported to JSON file later)

### 7. Initial Screen State

Make sure the `StreakRecommendationScreen` GameObject is **initially disabled** in the scene:
1. Select the `StreakRecommendationScreen` GameObject
2. Uncheck the checkbox in the top-left of the Inspector (sets `active = false`)

The UIManager will enable it when navigating to that screen.

## How It Works

1. **User Flow**:
   - User fills out pain parameters on the Parameters Screen
   - User clicks the "Call" button (which calls `AppController.SetParameters()`)
   - The app records a check-in (updates streak)
   - API call is made to get recommendations
   - After 5 seconds (API response received), user is automatically navigated to the Streak + Recommendation screen
   - User sees their current streak and the AI recommendation
   - User can optionally provide feedback in the text input field
   - User can click "Submit Feedback" or press Enter to save feedback
   - Feedback is stored locally (can be exported later)
   - User can click "Back to Home" to return to the Onboarding Screen

2. **Streak Logic**:
   - First check-in: Streak starts at 1
   - Consecutive days: Streak increments
   - Missed day(s): Streak resets to 1 on next check-in
   - Streak data is saved to PlayerPrefs and persists between sessions

3. **Navigation**:
   - Back button on Streak Screen → Onboarding Screen (home)
   - Forward button is hidden on the Streak Screen (it's an endpoint)

## Testing

1. Test the full flow:
   - Start from Onboarding Screen
   - Navigate to Parameters Screen
   - Fill in parameters
   - Click Call button
   - Wait for navigation to Streak Screen
   - Verify streak displays correctly
   - Verify recommendation displays
   - Click Back button
   - Verify it returns to Onboarding Screen

2. Test streak tracking:
   - Make multiple calls on the same day (streak shouldn't increment)
   - Test persistence by closing and reopening the app

## Feedback Storage

Feedback is currently stored using Unity's PlayerPrefs system. Each feedback entry includes:
- Timestamp (when feedback was submitted)
- Feedback text (user's input)
- Recommendation text (the AI recommendation shown at the time)

### Accessing Stored Feedback

You can access stored feedback programmatically:
```csharp
FeedbackManager feedbackManager = FeedbackManager.Instance;
List<FeedbackEntry> allFeedback = feedbackManager.GetAllFeedback();
int count = feedbackManager.GetFeedbackCount();
```

### Exporting Feedback

To export feedback to a JSON file:
```csharp
FeedbackManager.Instance.ExportFeedbackToFile(); // Exports to Application.persistentDataPath
// Or specify a custom path:
FeedbackManager.Instance.ExportFeedbackToFile("C:/path/to/feedback.json");
```

### Future Integration

The feedback system is designed to be easily extended to:
- Send feedback to a backend API
- Store feedback in a database
- Analyze feedback for insights
- Use feedback to improve recommendations

## Customization

You can customize the streak messages by editing the `GetStreakMessage()` method in `GamificationManager.cs`.

The UI styling and layout can be customized in Unity Editor by adjusting the TextMeshProUGUI elements' properties (font, size, color, position, etc.).

The feedback input field can be configured as single-line or multi-line in Unity Editor.

