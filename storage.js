"use strict";

window.StorageService = {
  getJson(key, fallbackValue) {
    const savedValue = window.localStorage.getItem(key);

    if (!savedValue) {
      return fallbackValue;
    }

    try {
      return JSON.parse(savedValue);
    } catch {
      return fallbackValue;
    }
  },

  setJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  },

  getText(key, fallbackValue = "") {
    return window.localStorage.getItem(key) || fallbackValue;
  },

  setText(key, value) {
    window.localStorage.setItem(key, value);
  },
};
