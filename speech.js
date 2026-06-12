"use strict";

const ENGLISH_VOICE_KEYWORDS = [
  "natural",
  "online",
  "aria",
  "jenny",
  "ryan",
  "guy",
  "microsoft",
];

let availableVoices = [];

function refreshVoices() {
  if ("speechSynthesis" in window) {
    availableVoices = window.speechSynthesis.getVoices();
  }
}

function findPreferredEnglishVoice(lang) {
  if (!String(lang).toLowerCase().startsWith("en")) {
    return null;
  }

  const englishVoices = availableVoices.filter((voice) =>
    String(voice.lang).toLowerCase().startsWith("en")
  );

  for (const keyword of ENGLISH_VOICE_KEYWORDS) {
    const matchedVoice = englishVoices.find((voice) =>
      String(voice.name).toLowerCase().includes(keyword)
    );

    if (matchedVoice) {
      return matchedVoice;
    }
  }

  return null;
}

refreshVoices();

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

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

    refreshVoices();
    const preferredVoice = findPreferredEnglishVoice(lang);

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (typeof onEnd === "function") {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  },
};
