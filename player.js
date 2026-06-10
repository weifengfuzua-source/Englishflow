"use strict";

window.WordPlayer = {
  create(options) {
    const {
      wordPanel,
      wordText,
      phonetic,
      meaning,
      progress,
      playStatus,
      togglePlay,
      speedControl,
      getWords,
      getIntervalTime,
      getSpeechRate,
      getPlaybackMode,
      getPlaybackOrder,
      onCycleEnd,
      onPositionChange,
      onSessionComplete,
      onWordChange,
      onWordComplete,
      recordLearning,
    } = options;

    let currentIndex = 0;
    let nextWordTimer = null;
    let isPlaying = false;
    let hasRecordedFirstWord = false;
    let recordedWordKey = "";
    let playOrder = buildPlayOrder();

    function buildPlayOrder() {
      const words = getWords();
      const indices = words.map((_, index) => index);

      if (getPlaybackOrder() !== "shuffle") {
        return indices;
      }

      for (let index = indices.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
      }

      return indices;
    }

    function getCurrentWordIndex() {
      return playOrder[currentIndex] ?? currentIndex;
    }

    function notifyPositionChange() {
      onPositionChange?.({
        ...getPosition(),
      });
    }

    function getPosition() {
      return {
        currentIndex,
        currentWordIndex: getCurrentWordIndex(),
        playOrder,
      };
    }

    function isValidPlayOrder(nextPlayOrder) {
      const words = getWords();
      return Array.isArray(nextPlayOrder)
        && nextPlayOrder.length === words.length
        && nextPlayOrder.every((index) => Number.isInteger(index) && index >= 0 && index < words.length);
    }

    function getCurrentWord() {
      return getWords()[getCurrentWordIndex()];
    }

    function setWords(nextWords) {
      currentIndex = 0;
      playOrder = buildPlayOrder();
      renderWord();
      notifyPositionChange();
    }

    function reset() {
      currentIndex = 0;
      playOrder = buildPlayOrder();
      recordedWordKey = "";
      hasRecordedFirstWord = false;
      renderWord();
      notifyPositionChange();
    }

    function restorePosition(position) {
      if (!position) {
        return;
      }

      if (isValidPlayOrder(position.playOrder)) {
        playOrder = position.playOrder;
      }

      currentIndex = Math.min(
        Math.max(Number(position.currentIndex) || 0, 0),
        Math.max(playOrder.length - 1, 0)
      );
      recordedWordKey = "";
      hasRecordedFirstWord = false;
      renderWord();
    }

    function restart() {
      pause();
      onCycleEnd?.();
      reset();
      start();
    }

    function renderWord() {
      const currentWord = getCurrentWord();

      if (!wordText || !phonetic || !meaning || !progress || !currentWord) {
        return;
      }

      wordText.textContent = currentWord.text;
      phonetic.textContent = currentWord.phonetic;
      meaning.textContent = currentWord.meaning;
      progress.textContent = `${currentIndex + 1} / ${playOrder.length}`;
      onWordChange(currentWord);
    }

    function scheduleNextWord() {
      if (!isPlaying) {
        return;
      }

      onWordComplete?.(getCurrentWord());
      window.clearTimeout(nextWordTimer);
      nextWordTimer = window.setTimeout(showNextWord, getIntervalTime());
    }

    function speakCurrentWord() {
      const currentWord = getCurrentWord();

      if (!currentWord) {
        return;
      }

      window.SpeechService.speak(currentWord.text, {
        rate: getSpeechRate(),
        onEnd: scheduleNextWord,
        onUnavailable() {
          playStatus.textContent = "朗读不可用";
        },
      });
    }

    function showNextWord() {
      const isLastWord = currentIndex === playOrder.length - 1;

      if (isLastWord && getPlaybackMode() === "pause") {
        onSessionComplete?.();
        pause();
        return;
      }

      if (getPlaybackOrder() === "shuffle") {
        // Reserved for future shuffle playback.
      }

      if (isLastWord) {
        onCycleEnd?.();
        playOrder = buildPlayOrder();
        currentIndex = 0;
      } else {
        currentIndex += 1;
      }

      renderWord();
      recordCurrentWord();
      notifyPositionChange();
      speakCurrentWord();
    }

    function recordCurrentWord() {
      const currentWord = getCurrentWord();
      const wordKey = `${getCurrentWordIndex()}:${currentWord.id}`;

      if (recordedWordKey === wordKey) {
        return;
      }

      recordedWordKey = wordKey;
      recordLearning(currentWord);
    }

    function start() {
      if (!playStatus || !wordPanel || !togglePlay || !speedControl || isPlaying) {
        return;
      }

      isPlaying = true;
      playStatus.textContent = "播放中";
      togglePlay.textContent = "暂停";
      wordPanel.classList.add("is-playing");
      renderWord();
      notifyPositionChange();

      if (!hasRecordedFirstWord) {
        recordCurrentWord();
        hasRecordedFirstWord = true;
      }

      speakCurrentWord();
    }

    function pause() {
      if (!playStatus || !wordPanel || !togglePlay) {
        return;
      }

      isPlaying = false;
      playStatus.textContent = "已暂停";
      togglePlay.textContent = "播放";
      wordPanel.classList.remove("is-playing");
      window.clearTimeout(nextWordTimer);
      window.SpeechService.cancel();
    }

    function toggle() {
      if (isPlaying) {
        pause();
        return;
      }

      start();
    }

    function handleSpeedChange() {
      if (!isPlaying) {
        return;
      }

      speakCurrentWord();
    }

    return {
      start,
      pause,
      toggle,
      getCurrentWord,
      handleSpeedChange,
      setWords,
      reset,
      restart,
      restorePosition,
      getPosition,
    };
  },
};
