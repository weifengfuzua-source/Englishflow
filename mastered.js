"use strict";

window.MasteredService = {
  storageKey: "english-flow-mastered",

  getStorageKey(libraryId) {
    if (!libraryId || libraryId === window.CONFIG.defaultLibraryId) {
      return this.storageKey;
    }

    return `${this.storageKey}-${libraryId}`;
  },

  getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  },

  createRecord(wordId, existingRecord, status, source = "manual") {
    return {
      id: wordId,
      date: this.getTodayKey(),
      count: (Number(existingRecord?.count) || 0) + 1,
      restoreCount: Number(existingRecord?.restoreCount ?? existingRecord?.unmasterCount) || 0,
      relearnCount: Number(existingRecord?.relearnCount) || 0,
      status,
      source,
    };
  },

  normalizeStatus(item) {
    if (["active", "skipped", "mastered"].includes(item?.status)) {
      return item.status;
    }

    return item?.mastered === false ? "active" : "mastered";
  },

  normalize(data) {
    if (data?.items && typeof data.items === "object") {
      return {
        items: Object.entries(data.items).reduce((items, [id, item]) => {
          items[id] = {
            id: item.id || Number(id) || id,
            date: item.date || this.getTodayKey(),
            count: Number(item.count) || 0,
            restoreCount: Number(item.restoreCount ?? item.unmasterCount) || 0,
            relearnCount: Number(item.relearnCount) || 0,
            status: this.normalizeStatus(item),
            source: item.source || "manual",
          };

          return items;
        }, {}),
      };
    }

    const items = {};

    if (Array.isArray(data?.ids)) {
      data.ids.forEach((id) => {
        items[id] = {
          id,
          date: this.getTodayKey(),
          count: 1,
          restoreCount: 0,
          relearnCount: 0,
          status: "mastered",
          source: "manual",
        };
      });
    }

    return {
      items,
    };
  },

  load(libraryId) {
    const data = window.StorageService.getJson(this.getStorageKey(libraryId), {
      items: {},
    });

    return this.normalize(data);
  },

  save(data, libraryId) {
    window.StorageService.setJson(this.getStorageKey(libraryId), {
      items: data.items || {},
    });
  },

  getStatus(data, wordId) {
    return data.items?.[wordId]?.status || "active";
  },

  isActive(data, wordId) {
    return this.getStatus(data, wordId) === "active";
  },

  isSkipped(data, wordId) {
    return this.getStatus(data, wordId) === "skipped";
  },

  isMastered(data, wordId) {
    return this.getStatus(data, wordId) === "mastered";
  },

  getRandomMasteredWords(data, words, limit) {
    const masteredWords = words.filter((word) => this.isMastered(data, word.id));

    for (let index = masteredWords.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [masteredWords[index], masteredWords[swapIndex]] = [masteredWords[swapIndex], masteredWords[index]];
    }

    return masteredWords.slice(0, Math.max(0, Number(limit) || 0));
  },

  getNextStatus(currentStatus, selectedStatus) {
    if (currentStatus === selectedStatus) {
      return "active";
    }

    return selectedStatus;
  },

  setStatus(data, wordId, status, source = "manual") {
    data.items = data.items || {};
    const currentStatus = this.getStatus(data, wordId);
    const nextStatus = this.getNextStatus(currentStatus, status);

    if (nextStatus === "active") {
      data.items[wordId] = {
        ...data.items[wordId],
        id: wordId,
        date: this.getTodayKey(),
        restoreCount: (Number(data.items[wordId]?.restoreCount) || 0) + 1,
        status: "active",
        source,
      };
      return "active";
    }

    data.items[wordId] = this.createRecord(wordId, data.items[wordId], nextStatus, source);
    return nextStatus;
  },

  markAuto(data, wordId) {
    data.items = data.items || {};

    if (!this.isActive(data, wordId)) {
      return false;
    }

    data.items[wordId] = this.createRecord(wordId, data.items[wordId], "mastered", "auto");
    return true;
  },
};
