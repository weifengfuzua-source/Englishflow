# CHANGELOG

## 2026-06-10

- Added GitHub Pages cache-busting script versions and library switching diagnostics for fetch and loaded word counts.
- Aligned library switching order so session reset, player refresh, restart, and learning UI render stay in sync.
- Fixed library switching session refresh by binding todaySession to libraryId and updating the player list immediately.
- Completed TODO 049: added automatic mastered marking after five valid cross-day reviews with source tracking.
- Completed TODO 048: separated new-word review scheduling from valid cross-day review counting.
- Completed TODO 047: generated todaySession from due review words first, then new unreviewed words within the daily goal.
- Completed TODO 046: added todaySession restore, session-only playback range, session progress, and completion state.
- Completed TODO 044: prioritized playback by due reviews, unfinished new words, and today's learned loop.
- Completed TODO 043: wired TODAY_REVIEW playable range to due review words while keeping default playback unchanged.
- Completed TODO 042: saved per-word daily learning state and restored today's progress from LocalStorage.
- Completed TODO 041: saved and restored playback position per library and playback settings.
- Fixed library switching reload/reset flow, localized fixed UI text, and persisted speed/playback/library settings.
- Added shuffle playback order with saved preference and per-cycle reshuffle.
- Refined Milestone 5 follow-up architecture: deferred mastered refresh, mode-ready playable words, expanded mastered records, restart refresh, and selected library guard.
- Completed Milestone 5 Step 5: word library switching with saved selection and library-scoped learning/mastered data.
- Completed Milestone 5 Step 4: added multiple compatible word library files.
- Optimized mastered playback refresh timing, masteredData records, playable mode hooks, player reset/restart APIs, and selected library validation.
- Completed Milestone 5 Step 3: mastered toggle, unmark, and masteredData persistence.
- Refined library fallback flow, playback mode naming, shuffle hook, and per-word recording guard.
- Completed Milestone 5 Step 2: loop and stop-at-end playback modes.
- Added data/words.json with compatible word loading and future library/mode configuration hooks.
- Completed Milestone 5 Step 1: daily goal settings, persistence, and today progress.
- Completed Architecture Refactor A04: Retire legacy script.js.
- Completed Architecture Refactor A03: Split word and sentence players.
- Completed Architecture Refactor A02: Split learning and review data.
- Completed Architecture Refactor A01: Extract config, storage, speech, and app entry.
- Completed Milestone 4: Sentence.
- Completed TODO 025: UI polish.
- Completed TODO 024: Loop playback.
- Completed TODO 023: Adjust speed.
- Completed TODO 022: Read sentence.
- Completed TODO 021: Input sentence.
- Optimized autoplay timing, word lookup indexing, and history storage limits.
- Refined review configuration, id-based review records, typed history records, and learning record helpers.
- Completed Milestone 3: Review.
- Completed TODO 020: Review statistics.
- Completed TODO 019: Today's review list.
- Completed TODO 018: Schedule review.
- Completed TODO 017: Implement review algorithm.
- Added stable word ids, safer LocalStorage parsing, local-date summaries, and id-based history records.
- Completed Milestone 2: Learning.
- Completed TODO 016: Save by LocalStorage.
- Completed TODO 015: History records.
- Completed TODO 014: Daily summary.
- Completed TODO 013: Implement statistics.
- Completed TODO 012: Load word data.
- Completed TODO 011: Create words.json.

## 2026-06-09

- Completed TODO 010: Add speed control.
- Completed TODO 009: Add play/pause.
- Completed TODO 008: Integrate SpeechSynthesis.
- Completed TODO 007: Implement auto next word.
- Completed TODO 006: Implement auto play.
- Completed TODO 005: Build basic layout.
- Completed TODO 004: Create script.js.
- Completed TODO 003: Create style.css.
- Completed TODO 002: Create index.html.
