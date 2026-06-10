"use strict";

window.HistoryService = {
  updateStatistics(data, todayKey) {
    data.total += 1;
    data.days[todayKey] = (data.days[todayKey] || 0) + 1;
  },

  updateHistory(data, currentWord, todayKey) {
    data.history.unshift({
      id: currentWord.id,
      date: todayKey,
      type: "learn",
    });
    data.history = data.history.slice(0, window.CONFIG.historyLimit);
  },

  updateDailyWordState(data, currentWord, todayKey) {
    data.dailyWords = data.dailyWords || {};
    data.dailyWords[todayKey] = data.dailyWords[todayKey] || {};

    const savedState = data.dailyWords[todayKey][currentWord.id] || {
      id: currentWord.id,
      firstSeen: todayKey,
      seenCount: 0,
      status: "learning",
    };

    data.dailyWords[todayKey][currentWord.id] = {
      ...savedState,
      id: currentWord.id,
      lastSeen: todayKey,
      seenCount: savedState.seenCount + 1,
      status: "learned",
    };
  },
};
