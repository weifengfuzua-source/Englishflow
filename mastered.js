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

  createRecord(wordId, existingRecord, source = "manual") {
    return {
      id: wordId,
      date: this.getTodayKey(),
      count: (Number(existingRecord?.count) || 0) + 1,
      unmasterCount: Number(existingRecord?.unmasterCount) || 0,
      relearnCount: Number(existingRecord?.relearnCount) || 0,
      mastered: true,
      source,
    };
  },

  normalize(data) {
    if (data?.items && typeof data.items === "object") {
      return {
        items: Object.entries(data.items).reduce((items, [id, item]) => {
          items[id] = {
            id: item.id || Number(id) || id,
            date: item.date || this.getTodayKey(),
            count: Number(item.count) || 0,
            unmasterCount: Number(item.unmasterCount) || 0,
            relearnCount: Number(item.relearnCount) || 0,
            mastered: item.mastered !== false,
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
          unmasterCount: 0,
          relearnCount: 0,
          mastered: true,
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

  isMastered(data, wordId) {
    return Boolean(data.items?.[wordId]?.mastered);
  },

  toggle(data, wordId) {
    data.items = data.items || {};

    if (this.isMastered(data, wordId)) {
      data.items[wordId] = {
        ...data.items[wordId],
        date: this.getTodayKey(),
        unmasterCount: (Number(data.items[wordId].unmasterCount) || 0) + 1,
        mastered: false,
      };
      return false;
    }

    data.items[wordId] = this.createRecord(wordId, data.items[wordId], "manual");
    return true;
  },

  markAuto(data, wordId) {
    data.items = data.items || {};

    if (this.isMastered(data, wordId)) {
      return false;
    }

    data.items[wordId] = this.createRecord(wordId, data.items[wordId], "auto");
    return true;
  },
};
