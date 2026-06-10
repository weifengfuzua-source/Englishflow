"use strict";

window.SentencePlayer = {
  create(options) {
    const {
      sentenceInput,
      sentenceStatus,
      readSentenceButton,
      loopSentence,
      getIntervalTime,
      getSpeechRate,
      pauseWordPlayback,
    } = options;

    const sentenceStorageKey = "english-flow-sentence";

    let sentenceLoopTimer = null;
    let currentSentence = "";

    function load() {
      currentSentence = window.StorageService.getText(sentenceStorageKey);

      if (sentenceInput) {
        sentenceInput.value = currentSentence;
      }
    }

    function handleInput() {
      currentSentence = sentenceInput.value.trim();
      window.StorageService.setText(sentenceStorageKey, currentSentence);

      if (sentenceStatus) {
        sentenceStatus.textContent = currentSentence ? "准备" : "内容为空";
      }
    }

    function scheduleLoop() {
      window.clearTimeout(sentenceLoopTimer);

      if (!loopSentence?.checked || !currentSentence) {
        return;
      }

      sentenceLoopTimer = window.setTimeout(read, getIntervalTime());
    }

    function read() {
      currentSentence = sentenceInput?.value.trim() || "";
      window.StorageService.setText(sentenceStorageKey, currentSentence);

      if (!currentSentence) {
        sentenceStatus.textContent = "内容为空";
        return;
      }

      pauseWordPlayback();
      window.clearTimeout(sentenceLoopTimer);

      window.SpeechService.speak(currentSentence, {
        rate: getSpeechRate(),
        onEnd() {
          sentenceStatus.textContent = loopSentence?.checked ? "循环中" : "完成";
          scheduleLoop();
        },
        onUnavailable() {
          sentenceStatus.textContent = "朗读不可用";
        },
      });

      sentenceStatus.textContent = "朗读中";
    }

    function handleLoopChange() {
      if (!loopSentence.checked) {
        window.clearTimeout(sentenceLoopTimer);
        sentenceStatus.textContent = currentSentence ? "准备" : "内容为空";
        return;
      }

      scheduleLoop();
    }

    function bindEvents() {
      if (sentenceInput) {
        sentenceInput.addEventListener("input", handleInput);
      }

      if (readSentenceButton) {
        readSentenceButton.addEventListener("click", read);
      }

      if (loopSentence) {
        loopSentence.addEventListener("change", handleLoopChange);
      }
    }

    return {
      bindEvents,
      load,
    };
  },
};
