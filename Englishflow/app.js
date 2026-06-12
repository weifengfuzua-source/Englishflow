"use strict";

const playStatus = document.querySelector("[data-play-status]");
const wordPanel = document.querySelector("[data-word-panel]");
const wordText = document.querySelector("[data-word-text]");
const phonetic = document.querySelector("[data-phonetic]");
const meaning = document.querySelector("[data-meaning]");
const toggleSkipped = document.querySelector("[data-toggle-skipped]");
const toggleMastered = document.querySelector("[data-toggle-mastered]");
const progress = document.querySelector("[data-progress]");
const todayCount = document.querySelector("[data-today-count]");
const copyTodayWordsButton = document.querySelector("[data-copy-today-words]");
const totalCount = document.querySelector("[data-total-count]");
const goalSelect = document.querySelector("[data-goal-select]");
const goalCustom = document.querySelector("[data-goal-custom]");
const playbackMode = document.querySelector("[data-playback-mode]");
const playbackOrder = document.querySelector("[data-playback-order]");
const englishRepeat = document.querySelector("[data-english-repeat]");
const meaningSpeech = document.querySelector("[data-meaning-speech]");
const librarySelect = document.querySelector("[data-library-select]");
const historyList = document.querySelector("[data-history-list]");
const reviewCount = document.querySelector("[data-review-count]");
const reviewList = document.querySelector("[data-review-list]");
const reviewSummary = document.querySelector("[data-review-summary]");
const sentenceInput = document.querySelector("[data-sentence-input]");
const sentenceStatus = document.querySelector("[data-sentence-status]");
const readSentenceButton = document.querySelector("[data-read-sentence]");
const loopSentence = document.querySelector("[data-loop-sentence]");
const togglePlay = document.querySelector("[data-toggle-play]");
const speedControl = document.querySelector("[data-speed-control]");

const storageKey = "english-flow-learning";
const dailyGoalStorageKey = "english-flow-daily-goal";
const playbackModeStorageKey = "english-flow-playback-mode";
const playbackOrderStorageKey = "english-flow-playback-order";
const englishRepeatStorageKey = "english-flow-english-repeat";
const meaningSpeechStorageKey = "english-flow-meaning-speech";
const selectedLibraryStorageKey = "english-flow-selected-library";
const playbackPositionStorageKey = "english-flow-playback-position";
const todaySessionStorageKey = "english-flow-today-session";
const speedStorageKey = "english-flow-speed";
const customGoalValue = "custom";
const priorityLearningMode = "PRIORITY";
const copyTodayWordsLabel = "复制今日单词";
const todaySessionVersion = 4;

let words = window.CONFIG.fallbackWords;
let playableWords = window.CONFIG.fallbackWords;
let wordMap = {};
let wordPlayer = null;
let dailyGoal = 50;
let currentLearningMode = priorityLearningMode;
let currentPlaybackMode = window.CONFIG.defaultPlaybackMode;
let currentPlaybackOrder = window.CONFIG.defaultPlaybackOrder;
let englishRepeatCount = 1;
let shouldSpeakMeaning = false;
let currentLibraryId = window.CONFIG.defaultLibraryId;
let isRestoringPlayback = false;
let todaySession = null;
let masteredData = {
  items: {},
};

function createDefaultLearningData() {
  return {
    days: {},
    dailyWords: {},
    history: [],
    reviews: {},
  };
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadLearningData() {
  const data = window.StorageService.getJson(getLearningStorageKey(), createDefaultLearningData());

  return {
    days: data.days || {},
    dailyWords: data.dailyWords || {},
    history: Array.isArray(data.history) ? data.history : [],
    reviews: data.reviews || {},
  };
}

function saveLearningData(data) {
  window.StorageService.setJson(getLearningStorageKey(), data);
}

function getLearningStorageKey() {
  if (currentLibraryId === window.CONFIG.defaultLibraryId) {
    return storageKey;
  }

  return `${storageKey}-${currentLibraryId}`;
}

function loadDailyGoal() {
  const savedGoal = Number(window.StorageService.getText(dailyGoalStorageKey, "50")) || 50;
  dailyGoal = savedGoal;

  if (!goalSelect || !goalCustom) {
    return;
  }

  const presetValues = Array.from(goalSelect.options).map((option) => option.value);

  if (presetValues.includes(String(savedGoal))) {
    goalSelect.value = String(savedGoal);
    goalCustom.hidden = true;
    return;
  }

  goalSelect.value = customGoalValue;
  goalCustom.hidden = false;
  goalCustom.value = savedGoal;
}

function saveDailyGoal(value) {
  const nextGoal = Math.max(1, Number(value) || 50);
  dailyGoal = nextGoal;
  window.StorageService.setText(dailyGoalStorageKey, String(nextGoal));

  if (todaySession && wordPlayer) {
    clearPlaybackPosition();
    resetTodaySession();
    refreshPlayableWords({ updatePlayer: true });
    wordPlayer.restart();
  }

  renderLearningData();
}

function handleGoalSelectChange() {
  if (goalSelect.value === customGoalValue) {
    goalCustom.hidden = false;
    goalCustom.value = dailyGoal;
    goalCustom.focus();
    return;
  }

  goalCustom.hidden = true;
  saveDailyGoal(goalSelect.value);
}

function handleCustomGoalInput() {
  saveDailyGoal(goalCustom.value);
}

function loadPlaybackMode() {
  const savedMode = window.StorageService.getText(
    playbackModeStorageKey,
    window.CONFIG.defaultPlaybackMode
  );
  currentPlaybackMode = savedMode === "stopAtEnd" ? "pause" : savedMode;

  if (playbackMode) {
    playbackMode.value = currentPlaybackMode;
  }

  window.StorageService.setText(playbackModeStorageKey, currentPlaybackMode);
}

function handlePlaybackModeChange() {
  currentPlaybackMode = playbackMode.value;
  window.StorageService.setText(playbackModeStorageKey, currentPlaybackMode);
  savePlaybackPosition();
}

function loadPlaybackOrder() {
  const savedOrder = window.StorageService.getText(
    playbackOrderStorageKey,
    window.CONFIG.defaultPlaybackOrder
  );
  currentPlaybackOrder = window.CONFIG.playbackOrders[savedOrder]
    ? savedOrder
    : window.CONFIG.defaultPlaybackOrder;

  if (playbackOrder) {
    playbackOrder.value = currentPlaybackOrder;
  }

  window.StorageService.setText(playbackOrderStorageKey, currentPlaybackOrder);
}

function handlePlaybackOrderChange() {
  currentPlaybackOrder = playbackOrder.value;
  window.StorageService.setText(playbackOrderStorageKey, currentPlaybackOrder);
  clearPlaybackPosition();
  wordPlayer.restart();
}

function normalizeEnglishRepeatCount(value) {
  const count = Number(value);

  return [1, 2, 3].includes(count) ? count : 1;
}

function loadEnglishRepeatCount() {
  englishRepeatCount = normalizeEnglishRepeatCount(
    window.StorageService.getText(englishRepeatStorageKey, "1")
  );

  if (englishRepeat) {
    englishRepeat.value = String(englishRepeatCount);
  }

  window.StorageService.setText(englishRepeatStorageKey, String(englishRepeatCount));
}

function handleEnglishRepeatChange() {
  englishRepeatCount = normalizeEnglishRepeatCount(englishRepeat.value);
  englishRepeat.value = String(englishRepeatCount);
  window.StorageService.setText(englishRepeatStorageKey, String(englishRepeatCount));
  wordPlayer.handleSpeedChange();
}

function loadMeaningSpeech() {
  const savedValue = window.StorageService.getText(meaningSpeechStorageKey, "off");
  shouldSpeakMeaning = savedValue === "on";

  if (meaningSpeech) {
    meaningSpeech.value = shouldSpeakMeaning ? "on" : "off";
  }

  window.StorageService.setText(meaningSpeechStorageKey, shouldSpeakMeaning ? "on" : "off");
}

function handleMeaningSpeechChange() {
  shouldSpeakMeaning = meaningSpeech.value === "on";
  window.StorageService.setText(meaningSpeechStorageKey, shouldSpeakMeaning ? "on" : "off");
  wordPlayer.handleSpeedChange();
}

function getPlaybackPositionKey() {
  return `${playbackPositionStorageKey}-${currentLibraryId}`;
}

function loadPlaybackPosition() {
  const position = window.StorageService.getJson(getPlaybackPositionKey(), null);

  if (
    !position
    || position.libraryId !== currentLibraryId
    || position.playbackOrder !== currentPlaybackOrder
    || position.playbackMode !== currentPlaybackMode
  ) {
    return null;
  }

  return position;
}

function savePlaybackPosition(position = wordPlayer?.getPosition?.()) {
  if (isRestoringPlayback || !position) {
    return;
  }

  window.StorageService.setJson(getPlaybackPositionKey(), {
    ...position,
    libraryId: currentLibraryId,
    playbackMode: currentPlaybackMode,
    playbackOrder: currentPlaybackOrder,
  });
}

function clearPlaybackPosition() {
  window.StorageService.setJson(getPlaybackPositionKey(), null);
}

function getTodaySessionKey() {
  return `${todaySessionStorageKey}-${currentLibraryId}`;
}

function canReuseSamplePool(session) {
  return session
    && session.version === todaySessionVersion
    && session.date === getTodayKey()
    && session.libraryId === currentLibraryId
    && Array.isArray(session.sampleWordIds)
    && Array.isArray(session.sampleCompletedIds)
    && session.sampleWordIds.every((id) => Boolean(findWordById(id)));
}

function createTodaySession(previousSession = null) {
  const reuseSamplePool = canReuseSamplePool(previousSession);
  const sessionWords = createTodaySessionWords(
    reuseSamplePool ? previousSession.sampleWordIds : null
  );
  const { dueReviewWords, newWords, sampleWords } = sessionWords;
  const reviewWordIds = dueReviewWords.map((word) => word.id);
  const newWordIds = newWords.map((word) => word.id);
  const sampleWordIds = sampleWords.map((word) => word.id);
  const sampleCompletedIds = reuseSamplePool
    ? previousSession.sampleCompletedIds.filter((id) => sampleWordIds.includes(id))
    : [];

  return {
    version: todaySessionVersion,
    date: getTodayKey(),
    libraryId: currentLibraryId,
    newWordGoal: dailyGoal,
    wordIds: [...reviewWordIds, ...sampleWordIds, ...newWordIds],
    reviewWordIds,
    newWordIds,
    sampleWordIds,
    sampleCompletedIds,
    currentIndex: 0,
    completed: false,
  };
}

function isValidTodaySession(session) {
  return session
    && session.version === todaySessionVersion
    && session.date === getTodayKey()
    && session.libraryId === currentLibraryId
    && session.newWordGoal === dailyGoal
    && Array.isArray(session.wordIds)
    && Array.isArray(session.reviewWordIds)
    && Array.isArray(session.newWordIds)
    && Array.isArray(session.sampleWordIds)
    && Array.isArray(session.sampleCompletedIds)
    && session.wordIds.length > 0
    && session.wordIds.length === (
      session.reviewWordIds.length + session.newWordIds.length + session.sampleWordIds.length
    )
    && session.wordIds.every((id, index) => (
      id === [...session.reviewWordIds, ...session.sampleWordIds, ...session.newWordIds][index]
    ))
    && session.wordIds.every((id) => Boolean(findWordById(id)));
}

function saveTodaySession() {
  if (todaySession) {
    window.StorageService.setJson(getTodaySessionKey(), todaySession);
  }
}

function loadTodaySession() {
  const savedSession = window.StorageService.getJson(getTodaySessionKey(), null);
  todaySession = isValidTodaySession(savedSession) ? savedSession : createTodaySession(savedSession);
  saveTodaySession();
}

function resetTodaySession() {
  todaySession = createTodaySession(todaySession);
  todaySession.currentIndex = 0;
  saveTodaySession();
}

function updateTodaySessionPosition(position) {
  if (!todaySession || !position) {
    return;
  }

  todaySession.currentIndex = Math.min(
    Math.max(Number(position.currentIndex) || 0, 0),
    Math.max(todaySession.wordIds.length - 1, 0)
  );
  saveTodaySession();
}

function completeTodaySession() {
  if (!todaySession) {
    return;
  }

  todaySession.completed = true;
  saveTodaySession();
}

function loadSpeed() {
  const savedSpeed = window.StorageService.getText(speedStorageKey, speedControl?.value || "3000");

  if (speedControl && window.CONFIG.speechRatesByInterval[savedSpeed]) {
    speedControl.value = savedSpeed;
  }
}

function handleSpeedChange() {
  window.StorageService.setText(speedStorageKey, speedControl.value);
  wordPlayer.handleSpeedChange();
}

function getValidLibraryId(libraryId) {
  return window.CONFIG.libraries[libraryId] ? libraryId : window.CONFIG.defaultLibraryId;
}

function populateLibrarySelect() {
  if (!librarySelect) {
    return;
  }

  librarySelect.innerHTML = "";

  Object.entries(window.CONFIG.libraries).forEach(([id, library]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = library.label;
    librarySelect.append(option);
  });
}

function syncLibrarySelect() {
  if (librarySelect) {
    librarySelect.value = currentLibraryId;
  }
}

async function handleLibraryChange() {
  if (!librarySelect) {
    return;
  }

  console.log("[EnglishFlow] library change selected value:", librarySelect.value);
  wordPlayer.pause();
  await loadWords(librarySelect.value);
  console.log("[EnglishFlow] library change currentLibraryId:", currentLibraryId);
  masteredData = window.MasteredService.load(currentLibraryId);
  clearPlaybackPosition();
  resetTodaySession();
  refreshPlayableWords({ updatePlayer: true });
  console.log("[EnglishFlow] loaded words length:", words.length);
  wordPlayer.restart();
  renderLearningData();
}

function buildWordMap() {
  wordMap = words.reduce((map, word) => {
    map[word.id] = word;
    return map;
  }, {});
}

function getDueReviewWords() {
  const data = loadLearningData();
  const todayKey = getTodayKey();

  return window.ReviewService.getDueReviews(data, todayKey)
    .map((item) => findWordById(item.id))
    .filter(Boolean)
    .filter((word) => window.MasteredService.isActive(masteredData, word.id));
}

function getNewSessionWords() {
  const data = loadLearningData();

  return getUnmasteredWords().filter((word) => !data.reviews[word.id]);
}

function createTodaySessionWords(sampleWordIds = null) {
  const dueReviewWords = getDueReviewWords();
  const dueReviewIds = new Set(dueReviewWords.map((word) => word.id));
  const newWords = getNewSessionWords()
    .filter((word) => !dueReviewIds.has(word.id))
    .slice(0, dailyGoal);
  const sampleWords = Array.isArray(sampleWordIds)
    ? sampleWordIds.map((id) => findWordById(id)).filter(Boolean)
    : window.MasteredService.getRandomMasteredWords(
      masteredData,
      words,
      window.CONFIG.masteredSampleLimit
    );

  return {
    dueReviewWords,
    newWords,
    sampleWords,
  };
}

function getUnmasteredWords() {
  return words.filter((word) => window.MasteredService.isActive(masteredData, word.id));
}

function getTodayLearnedWords() {
  const data = loadLearningData();
  const todayKey = getTodayKey();
  const dailyWords = data.dailyWords?.[todayKey] || {};
  const learnedIds = new Set(Object.keys(dailyWords).map(Number));

  return getUnmasteredWords().filter((word) => learnedIds.has(word.id));
}

function getTodayNewWords() {
  const data = loadLearningData();
  const todayKey = getTodayKey();
  const dailyWords = data.dailyWords?.[todayKey] || {};
  const learnedIds = new Set(Object.keys(dailyWords).map(Number));
  const reviewedIds = new Set(Object.keys(data.reviews).map(Number));
  const learnedNewWords = getUnmasteredWords()
    .filter((word) => learnedIds.has(word.id) && todaySession?.newWordIds?.includes(word.id));

  if (learnedNewWords.length >= dailyGoal) {
    return learnedNewWords;
  }

  const pendingNewWords = getUnmasteredWords()
    .filter((word) => !reviewedIds.has(word.id) && !learnedIds.has(word.id))
    .slice(0, dailyGoal - learnedNewWords.length);

  return [...learnedNewWords, ...pendingNewWords];
}

function getPriorityPlayableWords() {
  const dueReviewWords = getDueReviewWords();

  if (dueReviewWords.length > 0) {
    return dueReviewWords;
  }

  const todayNewWords = getTodayNewWords();

  if (todayNewWords.length > 0) {
    return todayNewWords;
  }

  const todayLearnedWords = getTodayLearnedWords();

  return todayLearnedWords.length > 0 ? todayLearnedWords : getUnmasteredWords();
}

function getTodaySessionWords() {
  if (!todaySession) {
    loadTodaySession();
  }

  return todaySession.wordIds
    .map((id) => findWordById(id))
    .filter(Boolean);
}

function getPlayableWords(mode = window.CONFIG.defaultLearningMode) {
  const normalizedMode = String(mode).replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();

  switch (normalizedMode) {
    case "PRIORITY":
      return getTodaySessionWords();
    case "UNMASTERED":
      return getUnmasteredWords();
    case "ALL":
    case "MASTERED":
      return words;
    case "TODAY_NEW":
      return getTodayNewWords();
    case "TODAY_REVIEW":
      return getDueReviewWords();
    default:
      return words;
  }
}

function refreshPlayableWords(options = {}) {
  const nextPlayableWords = getPlayableWords(currentLearningMode);
  playableWords = nextPlayableWords.length > 0 ? nextPlayableWords : getPlayableWords(window.CONFIG.defaultLearningMode);

  if (options.updatePlayer && wordPlayer) {
    wordPlayer.setWords(playableWords);
  }
}

function renderWordStatusButtons(currentWord) {
  if (!toggleSkipped || !toggleMastered || !currentWord) {
    return;
  }

  const isSkipped = window.MasteredService.isSkipped(masteredData, currentWord.id);
  const isMastered = window.MasteredService.isMastered(masteredData, currentWord.id);
  toggleSkipped.textContent = isSkipped ? "取消跳过" : "跳过";
  toggleMastered.textContent = isMastered ? "取消掌握" : "掌握";
}

function handleWordStatusToggle(status) {
  const currentWord = wordPlayer?.getCurrentWord();

  if (!currentWord) {
    return;
  }

  window.MasteredService.setStatus(masteredData, currentWord.id, status);
  window.MasteredService.save(masteredData, currentLibraryId);
  renderWordStatusButtons(currentWord);
}

function handleSkippedToggle() {
  handleWordStatusToggle("skipped");
}

function handleMasteredToggle() {
  handleWordStatusToggle("mastered");
}

function findWordById(id) {
  return wordMap[id];
}

function getTodayLearnedCount(data, todayKey) {
  const dailyWords = data.dailyWords?.[todayKey];

  if (!dailyWords) {
    return data.days[todayKey] || 0;
  }

  return Object.keys(dailyWords).length;
}

function getLearnedTodayNewCount(data, todayKey) {
  if (!todaySession || todaySession.date !== todayKey) {
    return 0;
  }

  const dailyWords = data.dailyWords?.[todayKey] || {};
  return todaySession.newWordIds.filter((id) => dailyWords[id]).length;
}

function getCompletedTodayReviewCount(data, todayKey) {
  if (!todaySession || todaySession.date !== todayKey) {
    return 0;
  }

  return todaySession.reviewWordIds.filter((id) => {
    const review = data.reviews[id];
    return Array.isArray(review?.reviewDates) && review.reviewDates.includes(todayKey);
  }).length;
}

function getTodaySessionProgressText(data, todayKey) {
  const learnedNewCount = getLearnedTodayNewCount(data, todayKey);
  const completedReviewCount = getCompletedTodayReviewCount(data, todayKey);
  const reviewTotal = todaySession?.reviewWordIds?.length || 0;
  const sampleCompleted = todaySession?.sampleCompletedIds?.length || 0;
  const sampleTotal = todaySession?.sampleWordIds?.length || 0;

  return `新词 ${learnedNewCount} / ${dailyGoal} · 复习 ${completedReviewCount} / ${reviewTotal} · 抽查 ${sampleCompleted} / ${sampleTotal}`;
}

function getTodayWordIds(data, todayKey) {
  const dailyWords = data.dailyWords?.[todayKey];

  if (dailyWords) {
    return Object.keys(dailyWords).map(Number);
  }

  return todaySession?.wordIds.filter((id) => !todaySession.sampleWordIds.includes(id)) || [];
}

function getTodayWordLines() {
  const data = loadLearningData();
  const todayKey = getTodayKey();

  return getTodayWordIds(data, todayKey)
    .map((id) => findWordById(id))
    .filter(Boolean)
    .map((word) => `${word.text}\t${word.meaning}`);
}

function showCopyTodayWordsStatus(count) {
  if (!copyTodayWordsButton) {
    return;
  }

  copyTodayWordsButton.textContent = `已复制${count}个单词`;
  window.setTimeout(() => {
    copyTodayWordsButton.textContent = copyTodayWordsLabel;
  }, 1600);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function handleCopyTodayWords() {
  const lines = getTodayWordLines();

  await copyText(lines.join("\n"));
  showCopyTodayWordsStatus(lines.length);
}

function renderLearningData() {
  const data = loadLearningData();
  const todayKey = getTodayKey();
  const dueReviews = window.ReviewService.getDueReviews(data, todayKey)
    .filter((item) => window.MasteredService.isActive(masteredData, item.id));

  todayCount.textContent = getTodaySessionProgressText(data, todayKey);
  totalCount.textContent = window.HistoryService.countUniqueNewWords(data);
  historyList.innerHTML = "";
  reviewCount.textContent = `${dueReviews.length} 待复习`;
  reviewList.innerHTML = "";
  reviewSummary.textContent = `${Object.keys(data.reviews).length} 已计划`;

  data.history.slice(0, 5).forEach((item) => {
    const savedWord = findWordById(item.id);
    const historyItem = document.createElement("li");
    historyItem.textContent = `${savedWord?.text || item.word || "未知"} · ${item.date}`;
    historyList.append(historyItem);
  });

  dueReviews.slice(0, 5).forEach((item) => {
    const savedWord = findWordById(item.id);
    const reviewItem = document.createElement("li");
    reviewItem.textContent = `${savedWord?.text || item.word || "未知"} · ${item.nextReview} 到期`;
    reviewList.append(reviewItem);
  });
}

function recordLearning(currentWord) {
  if (todaySession?.sampleWordIds?.includes(currentWord.id)) {
    return;
  }

  const todayKey = getTodayKey();
  const data = loadLearningData();

  window.HistoryService.updateStatistics(data, todayKey);
  window.HistoryService.updateHistory(data, currentWord, todayKey);
  window.HistoryService.updateDailyWordState(data, currentWord, todayKey);
  window.ReviewService.updateReview(data, currentWord, todayKey);

  saveLearningData(data);
  renderLearningData();
}

function recordCompletedPlayback(currentWord) {
  if (!currentWord) {
    return;
  }

  if (todaySession?.sampleWordIds?.includes(currentWord.id)) {
    if (!todaySession.sampleCompletedIds.includes(currentWord.id)) {
      todaySession.sampleCompletedIds.push(currentWord.id);
      saveTodaySession();
      renderLearningData();
    }
    return;
  }

  if (!todaySession?.reviewWordIds?.includes(currentWord.id)) {
    return;
  }

  const todayKey = getTodayKey();
  const data = loadLearningData();

  if (window.ReviewService.completeReview(data, currentWord, todayKey)) {
    if (window.ReviewService.shouldAutoMaster(data, currentWord.id)) {
      window.ReviewService.markAutoMastered(data, currentWord.id);
      window.MasteredService.markAuto(masteredData, currentWord.id);
      window.MasteredService.save(masteredData, currentLibraryId);
      renderWordStatusButtons(currentWord);
    }

    saveLearningData(data);
    renderLearningData();
  }
}

function getIntervalTime() {
  return Number(speedControl.value);
}

function getSpeechRate() {
  return window.CONFIG.speechRatesByInterval[getIntervalTime()] || 1;
}

async function loadWords(libraryId) {
  const savedLibraryId = window.StorageService.getText(
    selectedLibraryStorageKey,
    window.CONFIG.defaultLibraryId
  );
  const requestedLibraryId = libraryId || savedLibraryId;
  const defaultLibrary = window.CONFIG.libraries[window.CONFIG.defaultLibraryId];
  const selectedLibraryId = getValidLibraryId(requestedLibraryId);
  const selectedLibrary = window.CONFIG.libraries[selectedLibraryId];
  const wordSources = [
    {
      id: selectedLibraryId,
      path: selectedLibrary?.path,
    },
    {
      id: window.CONFIG.defaultLibraryId,
      path: defaultLibrary.path,
    },
  ].filter((source, index, sources) => source.path && sources.findIndex((item) => item.path === source.path) === index);

  if (savedLibraryId !== selectedLibraryId) {
    window.StorageService.setText(selectedLibraryStorageKey, selectedLibraryId);
  }

  for (const source of wordSources) {
    try {
      console.log("[EnglishFlow] fetch path:", source.path);
      const response = await fetch(source.path, { cache: "no-store" });

      if (!response.ok) {
        console.warn("[EnglishFlow] fetch failed:", source.path, response.status);
        continue;
      }

      const loadedWords = await response.json();
      console.log("[EnglishFlow] loaded words length:", loadedWords.length);
      words = loadedWords.map((word, index) => ({
        id: word.id || index + 1,
        text: word.text,
        phonetic: word.phonetic,
        meaning: word.meaning,
      }));
      currentLibraryId = source.id;
      syncLibrarySelect();
      window.StorageService.setText(selectedLibraryStorageKey, source.id);
      buildWordMap();
      return;
    } catch {
      console.warn("[EnglishFlow] fetch error:", source.path);
      continue;
    }
  }

  currentLibraryId = window.CONFIG.defaultLibraryId;
  syncLibrarySelect();
  window.StorageService.setText(selectedLibraryStorageKey, currentLibraryId);
  words = window.CONFIG.fallbackWords;
  buildWordMap();
}

function createWordPlayer() {
  return window.WordPlayer.create({
    wordPanel,
    wordText,
    phonetic,
    meaning,
    progress,
    playStatus,
    togglePlay,
    speedControl,
    getWords: () => playableWords,
    getIntervalTime,
    getSpeechRate,
    getEnglishRepeatCount: () => englishRepeatCount,
    getShouldSpeakMeaning: () => shouldSpeakMeaning,
    getPlaybackMode: () => currentPlaybackMode,
    getPlaybackOrder: () => currentPlaybackOrder,
    onCycleEnd: refreshPlayableWords,
    onPositionChange(position) {
      savePlaybackPosition(position);
      updateTodaySessionPosition(position);
    },
    onSessionComplete: completeTodaySession,
    onWordChange: renderWordStatusButtons,
    onWordComplete: recordCompletedPlayback,
    recordLearning,
  });
}

function createSentencePlayer() {
  return window.SentencePlayer.create({
    sentenceInput,
    sentenceStatus,
    readSentenceButton,
    loopSentence,
    getIntervalTime,
    getSpeechRate,
    pauseWordPlayback: () => wordPlayer.pause(),
  });
}

populateLibrarySelect();

loadWords().then(() => {
  wordPlayer = createWordPlayer();
  const sentencePlayer = createSentencePlayer();

  if (togglePlay) {
    togglePlay.addEventListener("click", wordPlayer.toggle);
  }

  if (speedControl) {
    speedControl.addEventListener("change", handleSpeedChange);
  }

  if (copyTodayWordsButton) {
    copyTodayWordsButton.addEventListener("click", handleCopyTodayWords);
  }

  if (goalSelect) {
    goalSelect.addEventListener("change", handleGoalSelectChange);
  }

  if (goalCustom) {
    goalCustom.addEventListener("input", handleCustomGoalInput);
  }

  if (playbackMode) {
    playbackMode.addEventListener("change", handlePlaybackModeChange);
  }

  if (playbackOrder) {
    playbackOrder.addEventListener("change", handlePlaybackOrderChange);
  }

  if (englishRepeat) {
    englishRepeat.addEventListener("change", handleEnglishRepeatChange);
  }

  if (meaningSpeech) {
    meaningSpeech.addEventListener("change", handleMeaningSpeechChange);
  }

  if (librarySelect) {
    librarySelect.addEventListener("change", handleLibraryChange);
  }

  if (toggleSkipped) {
    toggleSkipped.addEventListener("click", handleSkippedToggle);
  }

  if (toggleMastered) {
    toggleMastered.addEventListener("click", handleMasteredToggle);
  }

  sentencePlayer.bindEvents();
  sentencePlayer.load();
  masteredData = window.MasteredService.load(currentLibraryId);
  loadSpeed();
  loadPlaybackMode();
  loadPlaybackOrder();
  loadEnglishRepeatCount();
  loadMeaningSpeech();
  loadDailyGoal();
  loadTodaySession();
  isRestoringPlayback = true;
  refreshPlayableWords({ updatePlayer: true });
  wordPlayer.restorePosition(loadPlaybackPosition() || {
    currentIndex: todaySession.currentIndex,
  });
  isRestoringPlayback = false;
  renderLearningData();
  wordPlayer.start();
});
