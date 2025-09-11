using UnityEngine;

/// <summary>
/// Camera orbiter with Arrow keys + Scroll zoom + Drag-to-Pan-Target + Reset
/// - Left/Right: yaw around world up (Y-up by default; Z-up optional)
/// - Up/Down:    pitch around right
/// - Scroll:     zoom in/out (optional smoothing)
/// - Hold MMB (default): drag to pan the TARGET in camera plane
/// - Reset: restores camera & target to saved initial snapshot
/// </summary>
[AddComponentMenu("Soma+/Camera Orbiter (Keys+Scroll+Drag+Reset)")]
public class CameraOrbiter : MonoBehaviour
{
    [Header("Target")]
    public Transform target;
    public float distance = 6f;
    public float minDistance = 2f;
    public float maxDistance = 20f;

    [Header("World Up")]
    [Tooltip("Enable if your project/world treats Z as up instead of Y.")]
    public bool zIsUp = false;

    [Header("Orbit Speeds")]
    public float yawSpeed = 90f;     // deg/s (Left/Right)
    public float pitchSpeed = 90f;   // deg/s (Up/Down)
    public bool invertVertical = false;

    [Header("Pitch Limits (deg)")]
    public float minPitch = -80f;
    public float maxPitch = 80f;

    [Header("Zoom")]
    public bool enableZoomKeys = true;           // +/- or PageUp/PageDown
    public float zoomKeySpeed = 8f;              // units/s
    public float scrollZoomMultiplier = 10f;     // units per scroll notch
    public bool smoothZoom = true;
    public float zoomSmoothTime = 0.08f;

    [Header("Drag-to-Pan Target")]
    [Tooltip("Mouse button used to drag the TARGET (0=LMB, 1=RMB, 2=MMB).")]
    public int panMouseButton = 2;
    public float panMultiplier = 1f;

    [Header("Current Angles (deg)")]
    public float yaw = 0f;    // around up axis
    public float pitch = 20f; // around right axis

    [Header("Reset / Initial Snapshot")]
    public bool captureOnStart = true;           // capture initial on Start()
    public bool enableResetKey = true;
    public KeyCode resetKey = KeyCode.R;

    [SerializeField] Vector3 initialTargetPosition;
    [SerializeField] Quaternion initialTargetRotation = Quaternion.identity;
    [SerializeField] float initialYaw = 0f;
    [SerializeField] float initialPitch = 20f;
    [SerializeField] float initialDistance = 6f;

    Camera _cam;
    float _zoomVel; // SmoothDamp velocity
    bool _panning;
    Vector3 _lastMousePos; // pixels

    void Awake()
    {
        _cam = GetComponent<Camera>();
        if (!_cam) _cam = Camera.main;
    }

    void Start()
    {
        if (captureOnStart && target)
        {
            // Ensure yaw/pitch reflect the current pose, then snapshot as initial
            SnapAnglesFromCurrent();
            CaptureInitialFromCurrent();
            // Apply once so there is no one-frame mismatch
            ApplyPose();
        }
    }

    void LateUpdate()
    {
        if (!target) return;

        float dt = Time.deltaTime;
        float vertSign = invertVertical ? -1f : 1f;

        // --- Orbit input (arrow keys) ---
        if (Input.GetKey(KeyCode.LeftArrow))  yaw -= yawSpeed   * dt;
        if (Input.GetKey(KeyCode.RightArrow)) yaw += yawSpeed   * dt;
        if (Input.GetKey(KeyCode.UpArrow))    pitch += pitchSpeed * dt * vertSign;
        if (Input.GetKey(KeyCode.DownArrow))  pitch -= pitchSpeed * dt * vertSign;
        pitch = Mathf.Clamp(pitch, minPitch, maxPitch);

        // --- Zoom (keyboard + scroll) ---
        float desiredDistance = distance;
        if (enableZoomKeys)
        {
            if (Input.GetKey(KeyCode.Equals) || Input.GetKey(KeyCode.KeypadPlus) || Input.GetKey(KeyCode.PageUp))
                desiredDistance -= zoomKeySpeed * dt;
            if (Input.GetKey(KeyCode.Minus) || Input.GetKey(KeyCode.KeypadMinus) || Input.GetKey(KeyCode.PageDown))
                desiredDistance += zoomKeySpeed * dt;
        }
        float scroll = Input.GetAxis("Mouse ScrollWheel");
        if (Mathf.Abs(scroll) > 0.0001f)
            desiredDistance -= scroll * scrollZoomMultiplier;

        desiredDistance = Mathf.Clamp(desiredDistance, minDistance, maxDistance);
        distance = smoothZoom
            ? Mathf.SmoothDamp(distance, desiredDistance, ref _zoomVel, zoomSmoothTime)
            : desiredDistance;

        // --- Drag-to-pan target in camera plane ---
        HandlePanTarget();

        // --- Optional reset key ---
        if (enableResetKey && Input.GetKeyDown(resetKey))
            ResetView();

        // --- Place camera from current orbit state ---
        ApplyPose();
    }

    void HandlePanTarget()
    {
        if (!_cam || !target) return;

        if (Input.GetMouseButtonDown(panMouseButton))
        {
            _panning = true;
            _lastMousePos = Input.mousePosition;
        }

        if (Input.GetMouseButton(panMouseButton) && _panning)
        {
            Vector3 cur = Input.mousePosition;
            Vector2 pixelDelta = (Vector2)(cur - _lastMousePos);
            _lastMousePos = cur;

            if (pixelDelta.sqrMagnitude > 0f)
            {
                float worldPerPixel = WorldUnitsPerPixel();
                Vector3 move =
                    (-pixelDelta.x * worldPerPixel * panMultiplier) * transform.right +
                    (-pixelDelta.y * worldPerPixel * panMultiplier) * transform.up;

                target.position += move;
            }
        }

        if (Input.GetMouseButtonUp(panMouseButton))
            _panning = false;
    }

    float WorldUnitsPerPixel()
    {
        if (!_cam) return 0.001f;
        if (_cam.orthographic)
            return (2f * _cam.orthographicSize) / Mathf.Max(1, Screen.height);
        float worldScreenHeight = 2f * distance * Mathf.Tan(0.5f * _cam.fieldOfView * Mathf.Deg2Rad);
        return worldScreenHeight / Mathf.Max(1, Screen.height);
    }

    // ---- Pose application (shared by LateUpdate & Reset) ----
    void ApplyPose()
    {
        Vector3 up = zIsUp ? Vector3.forward : Vector3.up;
        Quaternion yawQ   = Quaternion.AngleAxis(yaw, up);
        Vector3 dir       = (yawQ * Vector3.back).normalized;
        Vector3 right     = Vector3.Normalize(Vector3.Cross(up, dir));
        Quaternion pitchQ = Quaternion.AngleAxis(pitch, right);
        dir               = (pitchQ * dir).normalized;

        transform.position = target.position + dir * distance;
        transform.rotation = Quaternion.LookRotation(-dir, up);
    }

    // ---- Reset / Snapshot ----

    /// <summary>Reset camera & target to the saved initial snapshot.</summary>
    [ContextMenu("Reset View")]
    public void ResetView()
    {
        if (!target) return;

        // Restore target transform
        target.SetPositionAndRotation(initialTargetPosition, initialTargetRotation);

        // Restore orbit state
        yaw   = initialYaw;
        pitch = Mathf.Clamp(initialPitch, minPitch, maxPitch);
        distance = Mathf.Clamp(initialDistance, minDistance, maxDistance);
        _zoomVel = 0f; // cancel smoothing momentum

        // Apply immediately
        ApplyPose();
    }

    /// <summary>Capture current camera orbit and target transform as the new initial snapshot.</summary>
    [ContextMenu("Capture Current as Initial")]
    public void CaptureInitialFromCurrent()
    {
        if (!target) return;
        // Make sure yaw/pitch reflect the current camera pose
        SnapAnglesFromCurrent();

        initialTargetPosition = target.position;
        initialTargetRotation = target.rotation;
        initialYaw = yaw;
        initialPitch = pitch;
        initialDistance = distance;
    }

    // ---- Utilities ----
    [ContextMenu("Snap Angles From Current Pose")]
    public void SnapAnglesFromCurrent()
    {
        if (!target) return;
        Vector3 up = zIsUp ? Vector3.forward : Vector3.up;
        Vector3 toCam = (transform.position - target.position).normalized;

        Vector3 flat = Vector3.ProjectOnPlane(toCam, up).normalized;
        if (flat.sqrMagnitude < 1e-6f) flat = Vector3.forward;
        yaw = SignedAngleOnAxis(Vector3.back, flat, up);

        float cosPitch = Mathf.Clamp(Vector3.Dot(flat, toCam), -1f, 1f);
        float rawPitch = Mathf.Rad2Deg * Mathf.Acos(cosPitch);
        Vector3 right = Vector3.Normalize(Vector3.Cross(up, flat));
        float sign = Mathf.Sign(Vector3.Dot(toCam, Quaternion.AngleAxis(90f, right) * flat));
        pitch = Mathf.Clamp(rawPitch * sign, minPitch, maxPitch);
    }

    static float SignedAngleOnAxis(Vector3 from, Vector3 to, Vector3 axis)
    {
        Vector3 a = Vector3.ProjectOnPlane(from, axis);
        Vector3 b = Vector3.ProjectOnPlane(to, axis);
        float angle = Vector3.Angle(a, b);
        float sign  = Mathf.Sign(Vector3.Dot(axis, Vector3.Cross(a, b)));
        return angle * sign;
    }
}
