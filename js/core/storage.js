const storageKey = "mission-grammaire-app-v2";

function createEmptyMissionStats(missionTemplates) {
  return missionTemplates.reduce((stats, mission) => {
    stats[mission.label] = { correct: 0, wrong: 0 };
    return stats;
  }, {});
}

function createEmptySentenceStats(missionTemplates) {
  return {
    attempts: 0,
    completed: false,
    lastPlayedAt: "",
    missionStats: createEmptyMissionStats(missionTemplates),
    mastery: 0,
    nextReviewRound: null,
    wrongInCurrentCycle: 0,
    seenCount: 0,
  };
}

function createEmptyConjugationState() {
  return {
    activeLessonId: "present-first-group",
    currentItemIndex: 0,
    currentRound: 0,
    score: 0,
    streak: 0,
    totalAttempts: 0,
    completedLessonIds: [],
    completedItemIds: [],
    itemStats: {},
    reviewMode: "normal",
    reviewItemIds: [],
    reviewItemIndex: 0,
    infinitiveGame: {
      active: false,
      consecutiveCorrect: 0,
      score: 0,
      attempts: 0,
      currentChallenge: null,
    },
  };
}

export function createDefaultProfile(profileId, name, missionTemplates) {
  return {
    id: profileId,
    name,
    activeModuleId: "grammar",
    score: 0,
    streak: 0,
    totalAttempts: 0,
    currentSentenceId: 0,
    currentMissionIndex: 0,
    completedSentenceIds: [],
    reviewMode: "normal",
    reviewMission: "",
    currentRound: 0,
    missionStats: createEmptyMissionStats(missionTemplates),
    sentenceStats: {},
    dailyStats: {},
    badges: [],
    lastPlayedDay: "",
    conjugation: createEmptyConjugationState(),
  };
}

function normalizeMissionStats(stats = {}, missionTemplates) {
  const normalized = createEmptyMissionStats(missionTemplates);

  missionTemplates.forEach((mission) => {
    const entry = stats[mission.label] ?? {};
    normalized[mission.label] = {
      correct: Number(entry.correct) || 0,
      wrong: Number(entry.wrong) || 0,
    };
  });

  return normalized;
}

function normalizeSentenceStats(stats = {}, missionTemplates) {
  return Object.entries(stats).reduce((normalized, [sentenceId, value]) => {
    normalized[sentenceId] = {
      attempts: Number(value?.attempts) || 0,
      completed: Boolean(value?.completed),
      lastPlayedAt: typeof value?.lastPlayedAt === "string" ? value.lastPlayedAt : "",
      missionStats: normalizeMissionStats(value?.missionStats, missionTemplates),
      mastery: Number(value?.mastery) || 0,
      nextReviewRound: Number.isInteger(value?.nextReviewRound) ? value.nextReviewRound : null,
      wrongInCurrentCycle: Number(value?.wrongInCurrentCycle) || 0,
      seenCount: Number(value?.seenCount) || 0,
    };
    return normalized;
  }, {});
}

function normalizeDailyStats(dailyStats = {}) {
  return Object.entries(dailyStats).reduce((normalized, [day, value]) => {
    normalized[day] = {
      correct: Number(value?.correct) || 0,
      wrong: Number(value?.wrong) || 0,
    };
    return normalized;
  }, {});
}

function normalizeBadges(badges = []) {
  if (!Array.isArray(badges)) {
    return [];
  }

  return badges
    .filter((badge) => badge && typeof badge.id === "string")
    .map((badge) => ({
      id: badge.id,
      unlockedAt: typeof badge.unlockedAt === "string" ? badge.unlockedAt : new Date().toISOString(),
    }));
}

function normalizeConjugationState(state = {}) {
  const safeState = createEmptyConjugationState();
  const rawCompletedItemIds = Array.isArray(state?.completedItemIds) ? state.completedItemIds : [];
  const rawItemStats = state?.itemStats && typeof state.itemStats === "object" ? state.itemStats : {};
  const rawInfinitiveGame = state?.infinitiveGame && typeof state?.infinitiveGame === "object" ? state.infinitiveGame : {};
  const rawChallenge = rawInfinitiveGame?.currentChallenge && typeof rawInfinitiveGame.currentChallenge === "object"
    ? rawInfinitiveGame.currentChallenge
    : null;

  return {
    activeLessonId:
      typeof state?.activeLessonId === "string" && state.activeLessonId.trim()
        ? state.activeLessonId
        : safeState.activeLessonId,
    currentItemIndex: Math.max(0, Number(state?.currentItemIndex) || 0),
    currentRound: Math.max(0, Number(state?.currentRound) || 0),
    score: Math.max(0, Number(state?.score) || 0),
    streak: Math.max(0, Number(state?.streak) || 0),
    totalAttempts: Math.max(0, Number(state?.totalAttempts) || 0),
    completedLessonIds: [...new Set((Array.isArray(state?.completedLessonIds) ? state.completedLessonIds : []).filter((value) => typeof value === "string"))],
    completedItemIds: [...new Set(rawCompletedItemIds.filter((value) => typeof value === "string"))],
    reviewMode: state?.reviewMode === "focus" ? "focus" : safeState.reviewMode,
    reviewItemIds: [...new Set((Array.isArray(state?.reviewItemIds) ? state.reviewItemIds : []).filter((value) => typeof value === "string"))],
    reviewItemIndex: Math.max(0, Number(state?.reviewItemIndex) || 0),
    itemStats: Object.entries(rawItemStats).reduce((normalized, [itemId, value]) => {
      if (typeof itemId !== "string") {
        return normalized;
      }

      normalized[itemId] = {
        correct: Math.max(0, Number(value?.correct) || 0),
        wrong: Math.max(0, Number(value?.wrong) || 0),
        lastAnsweredAt: typeof value?.lastAnsweredAt === "string" ? value.lastAnsweredAt : "",
        mastery: Math.max(0, Math.min(4, Number(value?.mastery) || Math.min(Math.max(0, Number(value?.correct) || 0), 4))),
        nextReviewRound: Number.isInteger(value?.nextReviewRound) ? value.nextReviewRound : null,
        wrongInCycle: Math.max(0, Number(value?.wrongInCycle) || 0),
        seenCount: Math.max(0, Number(value?.seenCount) || ((Number(value?.correct) || 0) + (Number(value?.wrong) || 0))),
      };
      return normalized;
    }, {}),
    infinitiveGame: {
      active: Boolean(rawInfinitiveGame.active && rawChallenge),
      consecutiveCorrect: Math.max(0, Number(rawInfinitiveGame.consecutiveCorrect) || 0),
      score: Math.max(0, Number(rawInfinitiveGame.score) || 0),
      attempts: Math.max(0, Number(rawInfinitiveGame.attempts) || 0),
      currentChallenge: rawChallenge && typeof rawChallenge.answer === "string" && Array.isArray(rawChallenge.options)
        ? {
            sourceItemId: typeof rawChallenge.sourceItemId === "string" ? rawChallenge.sourceItemId : "",
            lessonId: typeof rawChallenge.lessonId === "string" ? rawChallenge.lessonId : "",
            form: typeof rawChallenge.form === "string" ? rawChallenge.form : "",
            pronounLabel: typeof rawChallenge.pronounLabel === "string" ? rawChallenge.pronounLabel : "",
            tenseLabel: typeof rawChallenge.tenseLabel === "string" ? rawChallenge.tenseLabel : "",
            answer: rawChallenge.answer,
            options: [...new Set(rawChallenge.options.filter((value) => typeof value === "string"))].slice(0, 4),
          }
        : null,
    },
  };
}

function normalizeProfile(profile, missionTemplates, fallbackName) {
  const safeProfile = createDefaultProfile(profile?.id ?? crypto.randomUUID(), fallbackName, missionTemplates);

  return {
    ...safeProfile,
    id: typeof profile?.id === "string" ? profile.id : safeProfile.id,
    name: typeof profile?.name === "string" && profile.name.trim() ? profile.name.trim() : fallbackName,
    activeModuleId: typeof profile?.activeModuleId === "string" ? profile.activeModuleId : safeProfile.activeModuleId,
    score: Number(profile?.score) || 0,
    streak: Number(profile?.streak) || 0,
    totalAttempts: Number(profile?.totalAttempts) || 0,
    currentSentenceId: Number(profile?.currentSentenceId) || 0,
    currentMissionIndex: Number(profile?.currentMissionIndex) || 0,
    completedSentenceIds: Array.isArray(profile?.completedSentenceIds)
      ? [...new Set(profile.completedSentenceIds.map((value) => Number(value)).filter(Number.isInteger))]
      : [],
    reviewMode: typeof profile?.reviewMode === "string" ? profile.reviewMode : "normal",
    reviewMission: typeof profile?.reviewMission === "string" ? profile.reviewMission : "",
    currentRound: Number(profile?.currentRound) || 0,
    missionStats: normalizeMissionStats(profile?.missionStats, missionTemplates),
    sentenceStats: normalizeSentenceStats(profile?.sentenceStats, missionTemplates),
    dailyStats: normalizeDailyStats(profile?.dailyStats),
    badges: normalizeBadges(profile?.badges),
    lastPlayedDay: typeof profile?.lastPlayedDay === "string" ? profile.lastPlayedDay : "",
    conjugation: normalizeConjugationState(profile?.conjugation),
  };
}

export function loadAppData(missionTemplates) {
  const fallbackProfileId = crypto.randomUUID();
  const fallback = {
    activeProfileId: fallbackProfileId,
    profiles: {
      [fallbackProfileId]: createDefaultProfile(fallbackProfileId, "Élève 1", missionTemplates),
    },
  };

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const rawProfiles = parsed?.profiles ?? {};
    const profileEntries = Object.entries(rawProfiles);

    if (profileEntries.length === 0) {
      return fallback;
    }

    const profiles = profileEntries.reduce((result, [profileId, profile], index) => {
      result[profileId] = normalizeProfile(profile, missionTemplates, `Élève ${index + 1}`);
      return result;
    }, {});

    const activeProfileId = profiles[parsed?.activeProfileId]
      ? parsed.activeProfileId
      : Object.keys(profiles)[0];

    return { activeProfileId, profiles };
  } catch (error) {
    console.warn("Impossible de charger les données locales.", error);
    return fallback;
  }
}

export function saveAppData(appData) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(appData));
  } catch (error) {
    console.warn("Impossible d'enregistrer les données locales.", error);
  }
}

export function resetAppData(appData, missionTemplates) {
  const profile = appData.profiles[appData.activeProfileId];
  appData.profiles[appData.activeProfileId] = createDefaultProfile(profile.id, profile.name, missionTemplates);
}

export function createSentenceStatsFactory(missionTemplates) {
  return () => createEmptySentenceStats(missionTemplates);
}
