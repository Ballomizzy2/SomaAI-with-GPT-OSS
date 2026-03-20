mergeInto(LibraryManager.library, {

  SendPainContextToWeb: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    var data = JSON.parse(json);

    if (window.SomaAI && window.SomaAI.sendPainContext) {
      window.SomaAI.sendPainContext(data);
    } else {
      window.postMessage({ type: "PAIN_CONTEXT_UPDATE", painContext: data }, "*");
    }
  },

  StartVoiceConversationFromWeb: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    var data = JSON.parse(json);

    if (window.SomaAI && window.SomaAI.startVoiceConversation) {
      window.SomaAI.startVoiceConversation(data);
    } else {
      window.postMessage(
        { type: "START_VOICE_CONVERSATION", painContext: data },
        "*"
      );
    }
  },

  SendUnityEventToWeb: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    var data = {};
    try {
      data = JSON.parse(json);
    } catch (e) {
      data = { eventName: "unity_event_parse_error", payload: { raw: json } };
    }

    var eventName = data.eventName || "unity_event";
    var payload = data.payload || data;

    if (window.SomaAI && window.SomaAI.sendUnityEvent) {
      window.SomaAI.sendUnityEvent(eventName, payload);
    } else {
      window.postMessage({ type: "UNITY_EVENT", eventName: eventName, payload: payload }, "*");
    }
  },
});
