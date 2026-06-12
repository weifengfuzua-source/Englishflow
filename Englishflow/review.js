"use strict";

window.ReviewService = {
  addDays(dateKey, days) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);

    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
    const nextDay = String(date.getDate()).padStart(2, "0");

    return `${nextYear}-${nextMonth}-${nextDay}`;
  },

  normalizeReview(item, todayKey) {
    const reviewCount = Number(item.reviewCount ?? item.count) || 0;

    return {
      id: item.id,
      firstSeen: item.firstSeen || item.lastSeen || todayKey,
      lastSeen: item.lastSeen || todayKey,
      lastReviewDate: item.lastReviewDate || "",
      nextReview: item.nextReview || this.addDays(todayKey, window.CONFIG.reviewIntervals[0]),
      reviewCount,
      reviewDates: Array.isArray(item.reviewDates) ? item.reviewDates : [],
      autoMastered: Boolean(item.autoMastered),
    };
  },

  updateReview(data, currentWord, todayKey) {
    const savedReview = data.reviews[currentWord.id];

    if (savedReview) {
      data.reviews[currentWord.id] = this.normalizeReview(savedReview, todayKey);
      return;
    }

    const interval = window.CONFIG.reviewIntervals[0];
    data.reviews[currentWord.id] = {
      id: currentWord.id,
      firstSeen: todayKey,
      lastSeen: todayKey,
      lastReviewDate: "",
      reviewCount: 0,
      reviewDates: [],
      nextReview: this.addDays(todayKey, interval),
      autoMastered: false,
    };
  },

  completeReview(data, currentWord, todayKey) {
    const savedReview = data.reviews[currentWord.id];

    if (!savedReview) {
      return false;
    }

    const review = this.normalizeReview(savedReview, todayKey);

    if (review.reviewDates.includes(todayKey)) {
      data.reviews[currentWord.id] = review;
      return false;
    }

    const nextReviewCount = review.reviewCount + 1;
    const intervalIndex = Math.min(nextReviewCount - 1, window.CONFIG.reviewIntervals.length - 1);
    const interval = window.CONFIG.reviewIntervals[intervalIndex];

    data.reviews[currentWord.id] = {
      ...review,
      lastSeen: todayKey,
      lastReviewDate: todayKey,
      reviewCount: nextReviewCount,
      reviewDates: [...review.reviewDates, todayKey],
      nextReview: this.addDays(todayKey, interval),
    };

    return true;
  },

  shouldAutoMaster(data, wordId, threshold = 5) {
    const review = data.reviews[wordId];
    return Boolean(review && !review.autoMastered && review.reviewCount >= threshold);
  },

  markAutoMastered(data, wordId) {
    const review = data.reviews[wordId];

    if (!review) {
      return;
    }

    data.reviews[wordId] = {
      ...review,
      autoMastered: true,
    };
  },

  getDueReviews(data, todayKey) {
    return Object.values(data.reviews)
      .map((item) => this.normalizeReview(item, todayKey))
      .filter((item) => item.nextReview <= todayKey)
      .sort((first, second) => first.nextReview.localeCompare(second.nextReview));
  },
};
