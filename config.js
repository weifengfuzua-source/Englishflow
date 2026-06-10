"use strict";

window.CONFIG = {
  defaultLibraryId: "words",
  defaultLearningMode: "unmastered",
  defaultPlaybackMode: "loop",
  defaultPlaybackOrder: "sequential",
  libraries: {
    words: {
      label: "默认词库",
      path: "data/words.json",
    },
    kaoyan: {
      label: "考研",
      path: "data/kaoyan.json",
    },
    cet6: {
      label: "六级",
      path: "data/cet6.json",
    },
    ielts: {
      label: "雅思",
      path: "data/ielts.json",
    },
  },
  learningModes: {
    all: "all",
    unmastered: "unmastered",
    mastered: "mastered",
    todayNew: "todayNew",
    todayReview: "todayReview",
  },
  playbackOrders: {
    sequential: "sequential",
    shuffle: "shuffle",
  },
  reviewIntervals: [1, 2, 4, 7, 15],
  historyLimit: 150,
  speechFallbackDelay: 3000,
  fallbackWords: [
    {
      id: 1,
      text: "example",
      phonetic: "/ig'zampəl/",
      meaning: "例子；样例",
    },
    {
      id: 2,
      text: "steady",
      phonetic: "/'stedi/",
      meaning: "稳定的；持续的",
    },
    {
      id: 3,
      text: "simple",
      phonetic: "/'sɪmpəl/",
      meaning: "简单的；朴素的",
    },
  ],
  speechRatesByInterval: {
    2000: 1.2,
    3000: 1,
    4000: 0.8,
  },
};
