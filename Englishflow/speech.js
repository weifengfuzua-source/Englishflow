"use strict";

window.SpeechService = {
  cancel() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },

  speak(text, options = {}) {
    const {
      rate = 1,
      lang = "en-US",
      onEnd,
      onUnavailable,
      fallbackDelay = window.CONFIG.speechFallbackDelay,
    } = options;

    if (!("speechSynthesis" in window)) {
      if (typeof onUnavailable === "function") {
        onUnavailable();
      }

      if (typeof onEnd === "function") {
        window.setTimeout(onEnd, fallbackDelay);
      }

      return null;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    if (typeof onEnd === "function") {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  },
};
