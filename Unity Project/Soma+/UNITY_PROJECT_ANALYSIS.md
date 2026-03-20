# Soma+ Unity Project Analysis

## Overview
Soma+ is a Unity WebGL application designed for pain tracking and management. It provides an interactive 3D anatomy model where users can select body regions and input pain parameters, which are then sent to a backend API (SomaCoach) for AI-powered analysis and recommendations.

## Project Structure

### Core Scripts

#### 1. **AppController.cs** - Main Application Logic
- **Purpose**: Central controller that manages pain data collection and API communication
- **Key Features**:
  - Collects pain parameters from UI inputs:
    - `pain_context`: Text description of pain
    - `pain_region`: Body region (set via anatomy model clicks)
    - `pain_quality`: Quality descriptor (e.g., "sharp", "burning", "dull", "throbbing")
    - `pain_severity`: 0-10 scale (via slider)
    - `days_since_onset`: Number of days since pain started
    - `ema_trend`: 0-1 float value
  - **Web Integration**:
    - Sends pain context and start-call signals to the host web app via the WebGL JavaScript bridge (`postMessage` / `WebBridge.jslib`)
    - The host web app can use this context to start the in-browser voice coach session
  - **UI Components**:
    - Input fields: `contextInput`, `qualityInput`, `daysInput`
    - Slider: `severitySlider`
    - Output: `AIoutput` (TextMeshProUGUI)

#### 2. **UIManager.cs** - Screen Navigation
- **Purpose**: Manages multi-screen UI flow
- **Screen Types**:
  1. `OnboardingScreen`: Initial welcome/instruction screen
  2. `ParametersScreen`: Pain parameter input screen (shows anatomy model)
  3. `ExerciseScreen`: Exercise recommendations display
- **Features**:
  - Screen state management with enum-based system
  - Back/Forward navigation buttons
  - Automatically shows/hides anatomy model based on current screen
  - Navigation buttons visibility controlled by screen position

#### 3. **ClickRaycast.cs** - Anatomy Model Interaction
- **Purpose**: Handles clicking on 3D anatomy model to select pain regions
- **Functionality**:
  - Left mouse button click detection
  - Raycast from camera to detect clicked colliders
  - Extracts GameObject name from hit collider
  - Calls `AppController.SetPainRegionFromAnatomy()` with region name
  - Updates UI text to display selected region

#### 4. **CameraOrbitor.cs** - 3D Camera Control
- **Purpose**: Advanced camera system for viewing the anatomy model
- **Controls**:
  - **Arrow Keys**: Orbit around target
    - Left/Right: Yaw (horizontal rotation)
    - Up/Down: Pitch (vertical rotation, clamped -80° to 80°)
  - **Mouse Scroll**: Zoom in/out (smooth zoom with configurable multiplier)
  - **Keyboard Zoom**: +/- or PageUp/PageDown keys
  - **Middle Mouse Button (MMB)**: Drag to pan the target in camera plane
  - **R Key**: Reset camera to initial position
- **Features**:
  - Configurable orbit speeds (default 90°/s)
  - Distance clamping (min: 2, max: 20, default: 6)
  - Smooth zoom interpolation
  - Initial snapshot capture on Start
  - World up axis configurable (Y-up default, Z-up optional)

#### 5. **SlideShowPlayer.cs** - Onboarding Slides
- **Purpose**: Manages onboarding slide presentation
- **Features**:
  - List of slide GameObjects
  - Forward/backward navigation
  - Automatic button visibility based on slide position
  - Can finish slideshow and hide component

## Application Flow

### User Journey
1. **Onboarding Screen**: User sees initial slides explaining the application
2. **Parameters Screen**: 
   - User interacts with 3D anatomy model (click to select region)
   - Fills in pain parameters:
     - Context (text description)
     - Quality (text descriptor)
     - Severity (0-10 slider)
     - Days since onset
   - Clicks submit button
3. **Web Bridge Communication**:
   - `AppController.SetParameters()` is called
   - Unity sends the current pain context to the host web app
   - Unity triggers the web UI to start the voice conversation overlay
4. **Exercise Screen**: Shows recommendations / follow-up UI (implementation dependent)

## Technical Details

### Unity Version
- Unity 6000.2.6f2 (Unity 6)

### Input System
- Uses Unity's new Input System (`InputSystem_Actions.inputactions`)
- Configured for multiple input methods:
  - Keyboard & Mouse
  - Gamepad
  - Touch
  - XR Controllers
- Actions defined but not extensively used in current scripts (legacy setup)

### Build Configuration
- **WebGL Build Location**: `Builds/SoraAI_HTML/`
- **Build Files**:
  - `index.html`: Main HTML entry point
  - `Build/`: Contains compressed Unity WebGL files
    - `.loader.js`: Unity loader script
    - `.framework.js.br`: Brotli-compressed framework
    - `.wasm.br`: Brotli-compressed WebAssembly
    - `.data.br`: Brotli-compressed asset data
  - `TemplateData/`: UI assets (logos, progress bars, styles)

### API Integration
Soma+ communicates with the host Next.js app through the WebGL bridge (JavaScript plugin). The main messages are:

- `PAIN_CONTEXT_UPDATE`: updates the current pain context in the host UI
- `START_VOICE_CONVERSATION`: instructs the host UI to start the in-browser voice coach session using the latest pain context

### UI System
- Uses Unity's UI Canvas system
- TextMeshPro for text rendering
- Three main screen GameObjects managed by UIManager
- Anatomy model GameObject shown/hidden based on screen state

## Architecture Patterns

1. **MVC-like Structure**:
   - `AppController`: Model/Controller (data + API logic)
   - `UIManager`: View Controller (screen management)
   - UI Components: View (input/output)

2. **Component-Based Design**:
   - Each script is a MonoBehaviour component
   - Loose coupling via FindObjectOfType and serialized references

3. **Coroutine-Based Async**:
   - API calls use Unity coroutines for non-blocking operations
   - 5-second delay implemented with `WaitForSeconds`

## Dependencies

- **TextMeshPro**: For advanced text rendering
- **Unity Input System**: For input handling (partially configured)
- **Unity WebGL**: Build target platform
- **Universal Render Pipeline (URP)**: Rendering pipeline (based on settings)

## Known Limitations

1. **API Communication**:
   - Hardcoded 5-second delay (not ideal)
   - No error handling for network failures
   - Response parsing is basic (just displays raw text)

2. **Input System**:
   - Input System actions defined but not fully utilized
   - Camera controls use legacy `Input` class

3. **UI Flow**:
   - Screen transitions are instant (no animations)
   - No validation on input fields

## Integration with Next.js

The Next.js project serves the Unity WebGL build from `Builds/SoraAI_HTML/` through:
- Route handler at `/unity/[[...path]]` that serves static files
- Proper MIME type handling for Unity assets
- Brotli compression support for `.br` files
- Main page embeds Unity build in iframe

## Future Enhancement Opportunities

1. **API Improvements**:
   - Proper async/await pattern
   - Error handling and retry logic
   - JSON request/response format
   - Loading states and progress indicators

2. **UI/UX**:
   - Smooth screen transitions
   - Input validation
   - Better error messages
   - Loading animations

3. **Camera**:
   - Touch controls for mobile
   - Smooth interpolation for orbit
   - Preset camera positions

4. **Anatomy Model**:
   - Visual feedback on hover
   - Highlight selected region
   - Multiple selection support

