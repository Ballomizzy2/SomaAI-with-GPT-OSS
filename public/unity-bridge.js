/**
 * Unity-to-Web Bridge for Soma AI
 *
 * This script allows Unity WebGL to communicate with the Next.js app
 * to trigger voice conversations with pain context
 */

(function() {
  'use strict';

  window.SomaAI = window.SomaAI || {};
  var BRIDGE_VERSION = '0.2.0';
  var TARGET = (function() {
    try {
      return window.parent && window.parent !== window ? window.parent : window;
    } catch (e) {
      return window;
    }
  })();

  /**
   * Send pain context to the voice coach widget
   * Called from Unity when user wants to start voice conversation
   *
   * @param {Object} painContext - The pain information
   * @param {string} painContext.region - Body region (e.g., "lower_back", "neck")
   * @param {string} painContext.quality - Pain quality (e.g., "sharp", "dull")
   * @param {number} painContext.severity - Pain severity 0-10
   * @param {number} painContext.days_since_onset - Days since pain started
   */
  window.SomaAI.sendPainContext = function(painContext) {
    console.log('[SomaAI Bridge] Sending pain context:', painContext);

    // Post message to host window (iframe parent if present, otherwise same window)
    TARGET.postMessage({
      type: 'PAIN_CONTEXT_UPDATE',
      painContext: painContext
    }, '*');
  };

  /**
   * Trigger voice conversation with current pain context
   * This will open the voice coach widget
   */
  window.SomaAI.startVoiceConversation = function(painContext) {
    console.log('[SomaAI Bridge] Starting voice conversation with context:', painContext);

    TARGET.postMessage({
      type: 'START_VOICE_CONVERSATION',
      painContext: painContext
    }, '*');
  };

  /**
   * Send a generic Unity telemetry event to the web app.
   * Called from Unity via WebBridge.jslib (SendUnityEventToWeb).
   *
   * @param {string} eventName
   * @param {Object} payload
   */
  window.SomaAI.sendUnityEvent = function(eventName, payload) {
    try {
      TARGET.postMessage(
        {
          type: 'UNITY_EVENT',
          eventName: eventName,
          payload: payload || {},
          ts: Date.now(),
          bridgeVersion: BRIDGE_VERSION
        },
        '*'
      );
    } catch (e) {
      console.warn('[SomaAI Bridge] Failed to post UNITY_EVENT', e);
    }
  };

  /**
   * Log a pain report to session storage
   */
  window.SomaAI.logPainReport = function(region, quality, severity, daysSinceOnset, notes) {
    console.log('[SomaAI Bridge] Logging pain report:', { region, quality, severity });

    // Store directly in localStorage (client-side)
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = 'soma_ai_session';
      let session = JSON.parse(localStorage.getItem(storageKey) || '{}');

      if (!session.painLogs) {
        session = {
          sessionId: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          startedAt: Date.now(),
          lastActive: Date.now(),
          painLogs: [],
          exerciseLogs: [],
          conversationLogs: []
        };
      }

      session.painLogs.push({
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        region: region,
        quality: quality,
        severity: severity,
        days_since_onset: daysSinceOnset,
        notes: notes
      });

      session.lastActive = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(session));

      // Notify the progress dashboard to refresh
      window.dispatchEvent(new CustomEvent('soma_session_updated'));
    }
  };

  /**
   * Log an exercise completion
   */
  window.SomaAI.logExercise = function(exerciseId, exerciseTitle, completed, duration) {
    console.log('[SomaAI Bridge] Logging exercise:', { exerciseId, exerciseTitle, completed });

    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = 'soma_ai_session';
      let session = JSON.parse(localStorage.getItem(storageKey) || '{}');

      if (!session.exerciseLogs) {
        session.exerciseLogs = [];
      }

      session.exerciseLogs.push({
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        exerciseId: exerciseId,
        exerciseTitle: exerciseTitle,
        completed: completed !== false,
        duration: duration
      });

      session.lastActive = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(session));

      // Notify the progress dashboard to refresh
      window.dispatchEvent(new CustomEvent('soma_session_updated'));
    }
  };

  /**
   * Unity can call this to check if the bridge is loaded
   */
  window.SomaAI.isReady = function() {
    return true;
  };

  console.log('[SomaAI Bridge] Unity bridge initialized', { version: BRIDGE_VERSION });
})();
