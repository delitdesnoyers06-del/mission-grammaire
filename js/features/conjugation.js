function createDefaultItemStats() {
  return {
    correct: 0,
    wrong: 0,
    lastAnsweredAt: "",
    mastery: 0,
    nextReviewRound: null,
    wrongInCycle: 0,
    seenCount: 0,
  };
}

function createDefaultInfinitiveGameState() {
  return {
    active: false,
    consecutiveCorrect: 0,
    score: 0,
    attempts: 0,
    currentChallenge: null,
  };
}

function getItemById(lessons, itemId) {
  return getAllLessonItems(lessons).find((item) => item.id === itemId) ?? null;
}

function getAllLessonItems(lessons) {
  return lessons.flatMap((lesson) => getLessonItems(lesson));
}

function getLessonById(lessons, lessonId) {
  return lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

function getNextLesson(lessons, lessonId) {
  const sortedLessons = [...lessons].sort((first, second) => first.order - second.order);
  const currentIndex = sortedLessons.findIndex((lesson) => lesson.id === lessonId);

  if (currentIndex < 0 || currentIndex >= sortedLessons.length - 1) {
    return null;
  }

  return sortedLessons[currentIndex + 1];
}

function getLockedLessonIds(profile, lessons) {
  const state = getState(profile, lessons);
  const completedLessonIds = Array.isArray(state.completedLessonIds) ? state.completedLessonIds : [];
  const sortedLessons = [...lessons].sort((first, second) => first.order - second.order);
  const unlocked = new Set();

  sortedLessons.forEach((lesson, index) => {
    if (index === 0 || completedLessonIds.includes(sortedLessons[index - 1].id)) {
      unlocked.add(lesson.id);
    }
  });

  return new Set(sortedLessons.filter((lesson) => !unlocked.has(lesson.id)).map((lesson) => lesson.id));
}

function getPronounDifficulty(pronounKey) {
  if (["je", "tu", "il"].includes(pronounKey)) {
    return 1;
  }

  if (["nous", "vous"].includes(pronounKey)) {
    return 2;
  }

  return 3;
}

function getVerbDifficultyBonus(verb, pronounKey) {
  if (verb.infinitive.endsWith("ger") && pronounKey === "nous") {
    return 1;
  }

  if (["être", "avoir", "aller", "faire"].includes(verb.infinitive)) {
    return pronounKey === "nous" || pronounKey === "ils" ? 1 : 0;
  }

  return 0;
}

function getMasteryTarget(verb, pronounKey, tenseLabel) {
  if (tenseLabel === "futur simple" && pronounKey === "je" && ["être", "avoir", "aller"].includes(verb.infinitive)) {
    return 4;
  }

  if (tenseLabel === "futur simple" && pronounKey === "je" && verb.infinitive === "faire") {
    return 3;
  }

  if (["être", "avoir", "aller"].includes(verb.infinitive)) {
    return 3;
  }

  if (verb.infinitive === "faire") {
    return 2;
  }

  if (verb.infinitive.endsWith("ger") && pronounKey === "nous") {
    return 2;
  }

  if (["nous", "ils"].includes(pronounKey) && ["être", "avoir", "aller", "faire"].includes(verb.infinitive)) {
    return 3;
  }

  return 1;
}

function getDifficultyLabel(level) {
  if (level <= 1) {
    return "1 · découverte";
  }

  if (level === 2) {
    return "2 · consolidation";
  }

  return "3 · autonomie";
}

function getLessonItems(lesson) {
  return lesson.verbs
    .flatMap((verb, verbIndex) =>
      lesson.pronouns.map((pronoun, pronounIndex) => {
        const difficulty = Math.min(3, getPronounDifficulty(pronoun.key) + getVerbDifficultyBonus(verb, pronoun.key));
        const masteryTarget = getMasteryTarget(verb, pronoun.key, lesson.tenseLabel);

        return {
          id: `${lesson.id}:${verb.infinitive}:${pronoun.key}`,
          lessonId: lesson.id,
          infinitive: verb.infinitive,
          radical: verb.radical,
          pronounKey: pronoun.key,
          pronounLabel: pronoun.label,
          answer: verb.forms[pronoun.key],
          ending: lesson.endings[pronoun.key],
          tenseLabel: lesson.tenseLabel,
          groupLabel: lesson.groupLabel,
          lessonTitle: lesson.title,
          difficulty,
          difficultyLabel: getDifficultyLabel(difficulty),
          masteryTarget,
          isPriorityRecurrence: masteryTarget > 1,
          sortOrder: `${masteryTarget > 1 ? 0 : 1}-${difficulty}-${pronounIndex}-${verbIndex}`,
        };
      }),
    )
    .sort((first, second) => first.sortOrder.localeCompare(second.sortOrder) || first.infinitive.localeCompare(second.infinitive, "fr"));
}

function getFallbackLessonId(lessons) {
  return lessons[0]?.id ?? "present-first-group";
}

function getDefaultState(lessons) {
  return {
    activeLessonId: getFallbackLessonId(lessons),
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
    infinitiveGame: createDefaultInfinitiveGameState(),
  };
}

function getState(profile, lessons) {
  if (!profile.conjugation) {
    profile.conjugation = getDefaultState(lessons);
  }

  return profile.conjugation;
}

function getNextUncompletedIndex(items, completedIds) {
  const completedSet = new Set(completedIds);
  return items.findIndex((item) => !completedSet.has(item.id));
}

function normalizeAnswer(answer) {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}

function getNormalizedEnding(ending = "") {
  return typeof ending === "string" ? ending.replace(/^-/, "") : "";
}

function getItemStats(state, itemId) {
  if (!state.itemStats[itemId]) {
    state.itemStats[itemId] = createDefaultItemStats();
  }

  return state.itemStats[itemId];
}

function getConjugationSpacing(mastery) {
  return [1, 2, 4, 7, 11][Math.max(0, Math.min(mastery, 4))] ?? 4;
}

function isDueForReview(stats, currentRound) {
  return Number.isInteger(stats?.nextReviewRound) && stats.nextReviewRound <= currentRound;
}

function getDueConjugationItemsFromState(profile, lessons, state, limit = Infinity) {
  const unlockedLessonIds = new Set(getUnlockedConjugationLessons(profile, lessons).map((lesson) => lesson.id));

  return getAllLessonItems(lessons)
    .filter((item) => unlockedLessonIds.has(item.lessonId))
    .map((item) => {
      const stats = getItemStats(state, item.id);
      const attempts = stats.correct + stats.wrong;

      return {
        ...item,
        correct: stats.correct,
        wrong: stats.wrong,
        mastery: stats.mastery,
        attempts,
        accuracy: attempts > 0 ? Math.round((stats.correct / attempts) * 100) : 0,
        nextReviewRound: stats.nextReviewRound,
      };
    })
    .filter((item) => isDueForReview(item, state.currentRound))
    .sort(
      (first, second) =>
        (first.nextReviewRound ?? 0) - (second.nextReviewRound ?? 0)
        || second.wrong - first.wrong
        || first.accuracy - second.accuracy
        || second.difficulty - first.difficulty,
    )
    .slice(0, limit);
}

function shuffle(values) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function clearInfinitiveGameState(state, { resetCounter = false } = {}) {
  state.infinitiveGame = {
    active: false,
    consecutiveCorrect: resetCounter ? 0 : Math.max(0, Number(state.infinitiveGame?.consecutiveCorrect) || 0),
    score: Math.max(0, Number(state.infinitiveGame?.score) || 0),
    attempts: Math.max(0, Number(state.infinitiveGame?.attempts) || 0),
    currentChallenge: null,
  };
}

function buildInfinitiveChallenge(profile, lessons, sourceItem) {
  if (!sourceItem) {
    return null;
  }

  const sourceLesson = getLessonById(lessons, sourceItem.lessonId);
  const unlockedLessons = getUnlockedConjugationLessons(profile, lessons);
  const lessonPool = (sourceLesson?.verbs ?? []).map((verb) => verb.infinitive);
  const sameTensePool = unlockedLessons
    .filter((lesson) => lesson.tenseLabel === sourceItem.tenseLabel)
    .flatMap((lesson) => lesson.verbs.map((verb) => verb.infinitive));
  const globalPool = unlockedLessons.flatMap((lesson) => lesson.verbs.map((verb) => verb.infinitive));

  const distractorPool = [...new Set([...lessonPool, ...sameTensePool, ...globalPool])].filter(
    (infinitive) => infinitive !== sourceItem.infinitive,
  );

  if (distractorPool.length < 2) {
    return null;
  }

  return {
    sourceItemId: sourceItem.id,
    lessonId: sourceItem.lessonId,
    form: sourceItem.answer,
    pronounLabel: sourceItem.pronounLabel,
    tenseLabel: sourceItem.tenseLabel,
    answer: sourceItem.infinitive,
    options: shuffle([sourceItem.infinitive, ...shuffle(distractorPool).slice(0, 2)]),
  };
}

function maybeStartInfinitiveGame(profile, lessons, sourceItem) {
  const state = ensureConjugationState(profile, lessons);
  state.infinitiveGame.consecutiveCorrect += 1;

  if (state.infinitiveGame.active || state.infinitiveGame.consecutiveCorrect < 4) {
    return { started: false, challenge: null };
  }

  const challenge = buildInfinitiveChallenge(profile, lessons, sourceItem);

  if (!challenge) {
    return { started: false, challenge: null };
  }

  state.infinitiveGame.active = true;
  state.infinitiveGame.consecutiveCorrect = 0;
  state.infinitiveGame.currentChallenge = challenge;

  return {
    started: true,
    challenge,
  };
}

export function ensureConjugationState(profile, lessons) {
  const state = getState(profile, lessons);
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const fallbackLessonId = getUnlockedConjugationLessons(profile, lessons)[0]?.id ?? getFallbackLessonId(lessons);
  const lockedLessonIds = getLockedLessonIds(profile, lessons);

  if (!lessonIds.has(state.activeLessonId) || lockedLessonIds.has(state.activeLessonId)) {
    state.activeLessonId = fallbackLessonId;
  }

  if (!Array.isArray(state.completedLessonIds)) {
    state.completedLessonIds = [];
  }

  if (!Array.isArray(state.completedItemIds)) {
    state.completedItemIds = [];
  }

  if (!state.itemStats || typeof state.itemStats !== "object") {
    state.itemStats = {};
  }

  if (!Array.isArray(state.reviewItemIds)) {
    state.reviewItemIds = [];
  }

  if (!state.infinitiveGame || typeof state.infinitiveGame !== "object") {
    state.infinitiveGame = createDefaultInfinitiveGameState();
  }

  state.reviewMode = state.reviewMode === "focus" ? "focus" : "normal";
  state.reviewItemIndex = Math.max(0, Number(state.reviewItemIndex) || 0);

  state.currentItemIndex = Math.max(0, Number(state.currentItemIndex) || 0);
  state.currentRound = Math.max(0, Number(state.currentRound) || 0);
  state.score = Math.max(0, Number(state.score) || 0);
  state.streak = Math.max(0, Number(state.streak) || 0);
  state.totalAttempts = Math.max(0, Number(state.totalAttempts) || 0);
  state.infinitiveGame.active = Boolean(state.infinitiveGame.active && state.infinitiveGame.currentChallenge);
  state.infinitiveGame.consecutiveCorrect = Math.max(0, Number(state.infinitiveGame.consecutiveCorrect) || 0);
  state.infinitiveGame.score = Math.max(0, Number(state.infinitiveGame.score) || 0);
  state.infinitiveGame.attempts = Math.max(0, Number(state.infinitiveGame.attempts) || 0);
  state.completedLessonIds = [...new Set(state.completedLessonIds.filter((lessonId) => lessonIds.has(lessonId)))];

  const lesson = lessons.find((entry) => entry.id === state.activeLessonId);

  if (!lesson) {
    return state;
  }

  const allItems = getAllLessonItems(lessons);
  const allItemIds = new Set(allItems.map((item) => item.id));
  const items = getLessonItems(lesson);
  state.itemStats = Object.entries(state.itemStats).reduce((normalized, [itemId, value]) => {
    if (!allItemIds.has(itemId)) {
      return normalized;
    }

    normalized[itemId] = {
      correct: Math.max(0, Number(value?.correct) || 0),
      wrong: Math.max(0, Number(value?.wrong) || 0),
      lastAnsweredAt: typeof value?.lastAnsweredAt === "string" ? value.lastAnsweredAt : "",
      mastery: Math.max(0, Math.min(4, Number(value?.mastery) || Math.min(Number(value?.correct) || 0, 4))),
      nextReviewRound: Number.isInteger(value?.nextReviewRound) ? value.nextReviewRound : null,
      wrongInCycle: Math.max(0, Number(value?.wrongInCycle) || 0),
      seenCount: Math.max(0, Number(value?.seenCount) || ((Number(value?.correct) || 0) + (Number(value?.wrong) || 0))),
    };
    return normalized;
  }, {});
  state.completedItemIds = [...new Set(state.completedItemIds.filter((itemId) => allItemIds.has(itemId)))];
  state.reviewItemIds = [...new Set(state.reviewItemIds.filter((itemId) => allItemIds.has(itemId)))];

  if (state.infinitiveGame.currentChallenge && !allItemIds.has(state.infinitiveGame.currentChallenge.sourceItemId)) {
    clearInfinitiveGameState(state, { resetCounter: true });
  }

  if (state.reviewMode === "focus") {
    if (state.reviewItemIds.length === 0 || state.reviewItemIndex >= state.reviewItemIds.length) {
      state.reviewMode = "normal";
      state.reviewItemIds = [];
      state.reviewItemIndex = 0;
    } else {
      const reviewItem = getItemById(lessons, state.reviewItemIds[state.reviewItemIndex]);

      if (!reviewItem) {
        state.reviewMode = "normal";
        state.reviewItemIds = [];
        state.reviewItemIndex = 0;
      } else {
        state.activeLessonId = reviewItem.lessonId;
        return state;
      }
    }
  }

  const nextIndex = getNextUncompletedIndex(items, state.completedItemIds);

  if (nextIndex === -1) {
    state.currentItemIndex = items.length;
  } else if (state.currentItemIndex >= items.length || state.completedItemIds.includes(items[state.currentItemIndex]?.id)) {
    state.currentItemIndex = nextIndex;
  }

  return state;
}

export function getActiveConjugationLesson(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  return getLessonById(lessons, state.activeLessonId) ?? lessons[0] ?? null;
}

export function getCurrentConjugationItem(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);

  if (state.reviewMode === "focus") {
    return getItemById(lessons, state.reviewItemIds[state.reviewItemIndex]);
  }

  const dueItem = getDueConjugationItemsFromState(profile, lessons, state, 1)[0] ?? null;

  if (dueItem) {
    return dueItem;
  }

  const lesson = getActiveConjugationLesson(profile, lessons);

  if (!lesson) {
    return null;
  }

  const items = getLessonItems(lesson);

  if (state.currentItemIndex >= items.length) {
    return null;
  }

  return items[state.currentItemIndex] ?? null;
}

export function getConjugationProgress(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  const dueCount = getDueConjugationItemsFromState(profile, lessons, state).length;

  if (state.reviewMode === "focus") {
    const totalCount = state.reviewItemIds.length;
    const completedCount = Math.min(state.reviewItemIndex, totalCount);
    const accuracy = state.totalAttempts > 0 ? Math.round((state.score / state.totalAttempts) * 100) : 0;

    return {
      totalCount,
      completedCount,
      remainingCount: Math.max(totalCount - completedCount, 0),
      streak: state.streak,
      score: state.score,
      totalAttempts: state.totalAttempts,
      accuracy,
      dueCount,
      isFinished: totalCount > 0 && completedCount >= totalCount,
    };
  }

  const dueItem = getDueConjugationItemsFromState(profile, lessons, state, 1)[0] ?? null;
  const lesson = dueItem ? getLessonById(lessons, dueItem.lessonId) : getActiveConjugationLesson(profile, lessons);
  const items = lesson ? getLessonItems(lesson) : [];
  const lessonItemIds = new Set(items.map((item) => item.id));
  const completedCount = state.completedItemIds.filter((itemId) => lessonItemIds.has(itemId)).length;
  const accuracy = state.totalAttempts > 0 ? Math.round((state.score / state.totalAttempts) * 100) : 0;

  return {
    totalCount: items.length,
    completedCount,
    remainingCount: Math.max(items.length - completedCount, 0),
    streak: state.streak,
    score: state.score,
    totalAttempts: state.totalAttempts,
    accuracy,
    dueCount,
    isFinished: items.length > 0 && completedCount >= items.length,
  };
}

export function getConjugationModuleProgress(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  const allItems = getAllLessonItems(lessons);

  return {
    totalCount: allItems.length,
    completedCount: state.completedItemIds.length,
    unlockedLessonCount: getUnlockedConjugationLessons(profile, lessons).length,
    lessonCount: lessons.length,
    accuracy: state.totalAttempts > 0 ? Math.round((state.score / state.totalAttempts) * 100) : 0,
  };
}

export function getUnlockedConjugationLessons(profile, lessons) {
  const lockedLessonIds = getLockedLessonIds(profile, lessons);
  return [...lessons]
    .sort((first, second) => first.order - second.order)
    .filter((lesson) => !lockedLessonIds.has(lesson.id));
}

export function setActiveConjugationLesson(profile, lessons, lessonId) {
  const unlockedLesson = getUnlockedConjugationLessons(profile, lessons).find((lesson) => lesson.id === lessonId);

  if (!unlockedLesson) {
    return false;
  }

  stopConjugationReview(profile, lessons);
  clearInfinitiveGameState(profile.conjugation, { resetCounter: true });
  profile.conjugation.activeLessonId = lessonId;
  const items = getLessonItems(unlockedLesson);
  const nextIndex = getNextUncompletedIndex(items, profile.conjugation.completedItemIds);
  profile.conjugation.currentItemIndex = nextIndex === -1 ? items.length : nextIndex;
  return true;
}

export function getConjugationLessonOptions(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  const unlockedLessonIds = new Set(getUnlockedConjugationLessons(profile, lessons).map((lesson) => lesson.id));
  const dueItem = getDueConjugationItemsFromState(profile, lessons, state, 1)[0] ?? null;
  const selectedLessonId = dueItem?.lessonId ?? state.activeLessonId;

  return [...lessons]
    .sort((first, second) => first.order - second.order)
    .map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      unlocked: unlockedLessonIds.has(lesson.id),
      selected: lesson.id === selectedLessonId,
      completed: state.completedLessonIds.includes(lesson.id),
    }));
}

export function getConjugationDifficultyStatus(profile, lessons) {
  const item = getCurrentConjugationItem(profile, lessons);
  const progress = getConjugationProgress(profile, lessons);

  if (!item) {
    return {
      level: 3,
      label: getDifficultyLabel(3),
      description: progress.isFinished ? "Le module a été terminé." : "Prêt à continuer.",
    };
  }

  const descriptions = {
    1: "Pronoms simples et formes les plus régulières.",
    2: "Nouvelles terminaisons avec nous et vous.",
    3: "Formes plus autonomes et pièges comme nous mangeons.",
  };

  return {
    level: item.difficulty,
    label: item.difficultyLabel,
    description: descriptions[item.difficulty] ?? descriptions[1],
  };
}

export function getConjugationHint(profile, lessons) {
  const item = getCurrentConjugationItem(profile, lessons);
  const lesson = item ? getLessonById(lessons, item.lessonId) : getActiveConjugationLesson(profile, lessons);

  if (!lesson || !item) {
    return "Leçon terminée : tu peux recommencer le profil pour rejouer.";
  }

  if (lesson.tenseLabel === "passé composé") {
    return `Astuce : au passé composé, pense d'abord à l'auxiliaire puis au participe passé. Avec ${item.pronounLabel}, le repère est ${item.ending}.`;
  }

  if (lesson.tenseLabel === "imparfait") {
    return `Astuce : à l'imparfait, la famille des terminaisons est ${item.ending}. Observe bien le radical ${item.radical}-.`;
  }

  if (item.difficulty === 1) {
    return `Astuce : avec ${item.pronounLabel}, la terminaison attendue en ${lesson.tenseLabel} est ${item.ending}.${item.masteryTarget > 1 ? ` Cette forme reviendra ${item.masteryTarget} fois pour bien s'ancrer.` : ""}`;
  }

  if (item.difficulty === 2) {
    return `Astuce : pense au radical ${item.radical}- puis ajoute la terminaison ${item.ending}.${item.masteryTarget > 1 ? ` Cette forme difficile doit être réussie ${item.masteryTarget} fois.` : ""}`;
  }

  return `Astuce : observe bien le radical de ${item.infinitive} pour le ${lesson.tenseLabel} et vérifie la terminaison ${item.ending}.${item.masteryTarget > 1 ? ` Répétition renforcée : ${item.masteryTarget} réussites nécessaires.` : ""}${lesson.tenseLabel === "futur simple" && ["être", "avoir", "aller", "faire"].includes(item.infinitive) ? " Au futur, retiens bien le radical irrégulier avant la terminaison." : ""}`;
}

export function getConjugationReference(lesson) {
  if (!lesson) {
    return [];
  }

  return lesson.pronouns.map((pronoun) => ({
    key: pronoun.key,
    label: pronoun.label,
    ending: lesson.endings[pronoun.key],
  }));
}

export function getConjugationDueItems(profile, lessons, limit = Infinity) {
  const state = ensureConjugationState(profile, lessons);
  return getDueConjugationItemsFromState(profile, lessons, state, limit);
}

export function getConjugationConsolidation(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  const allItems = getAllLessonItems(lessons);
  const lessonMap = new Map();
  const verbMap = new Map();

  allItems.forEach((item) => {
    const stats = state.itemStats[item.id] ?? createDefaultItemStats();
    const attempts = stats.correct + stats.wrong;

    if (attempts === 0) {
      return;
    }

    const lessonEntry = lessonMap.get(item.lessonId) ?? { id: item.lessonId, label: item.lessonTitle, correct: 0, wrong: 0 };
    lessonEntry.correct += stats.correct;
    lessonEntry.wrong += stats.wrong;
    lessonMap.set(item.lessonId, lessonEntry);

    const verbKey = `${item.lessonId}:${item.infinitive}`;
    const verbEntry = verbMap.get(verbKey) ?? {
      id: verbKey,
      label: `${item.infinitive} · ${item.tenseLabel}`,
      correct: 0,
      wrong: 0,
    };
    verbEntry.correct += stats.correct;
    verbEntry.wrong += stats.wrong;
    verbMap.set(verbKey, verbEntry);
  });

  function toSortedEntries(entries) {
    return [...entries].map((entry) => {
      const attempts = entry.correct + entry.wrong;
      return {
        ...entry,
        attempts,
        accuracy: attempts > 0 ? Math.round((entry.correct / attempts) * 100) : 0,
      };
    }).sort((first, second) => second.wrong - first.wrong || first.accuracy - second.accuracy);
  }

  const lessonsNeedingWork = toSortedEntries(lessonMap.values()).slice(0, 3);
  const verbsNeedingWork = toSortedEntries(verbMap.values()).slice(0, 4);

  return {
    summary:
      lessonsNeedingWork[0]?.label
        ? `À consolider en priorité : ${lessonsNeedingWork[0].label}.`
        : "Les points à consolider apparaîtront après quelques réponses.",
    lessonsNeedingWork,
    verbsNeedingWork,
  };
}

export function getConjugationReviewCandidates(profile, lessons, limit = 8) {
  const state = ensureConjugationState(profile, lessons);
  const unlockedLessonIds = new Set(getUnlockedConjugationLessons(profile, lessons).map((lesson) => lesson.id));

  return getAllLessonItems(lessons)
    .filter((item) => unlockedLessonIds.has(item.lessonId))
    .map((item) => {
      const stats = state.itemStats[item.id] ?? createDefaultItemStats();
      const attempts = stats.correct + stats.wrong;

      return {
        ...item,
        correct: stats.correct,
        wrong: stats.wrong,
        mastery: stats.mastery,
        attempts,
        accuracy: attempts > 0 ? Math.round((stats.correct / attempts) * 100) : 0,
        nextReviewRound: stats.nextReviewRound,
        dueNow: isDueForReview(stats, state.currentRound),
      };
    })
    .filter((item) => item.wrong > 0 || item.dueNow || (item.attempts > 0 && item.accuracy < 80))
    .sort(
      (first, second) =>
        Number(second.dueNow) - Number(first.dueNow)
        || second.wrong - first.wrong
        || (first.nextReviewRound ?? Number.MAX_SAFE_INTEGER) - (second.nextReviewRound ?? Number.MAX_SAFE_INTEGER)
        || second.masteryTarget - first.masteryTarget
        || first.accuracy - second.accuracy
        || second.difficulty - first.difficulty,
    )
    .slice(0, limit);
}

export function startConjugationReview(profile, lessons, limit = 8) {
  const state = ensureConjugationState(profile, lessons);
  const candidates = getConjugationReviewCandidates(profile, lessons, limit);

  if (candidates.length === 0) {
    return { started: false, count: 0 };
  }

  state.reviewMode = "focus";
  clearInfinitiveGameState(state, { resetCounter: true });
  state.reviewItemIds = candidates.map((item) => item.id);
  state.reviewItemIndex = 0;
  state.activeLessonId = candidates[0].lessonId;

  return { started: true, count: candidates.length };
}

export function stopConjugationReview(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  state.reviewMode = "normal";
  state.reviewItemIds = [];
  state.reviewItemIndex = 0;
  clearInfinitiveGameState(state);

  const activeLesson = getLessonById(lessons, state.activeLessonId) ?? getUnlockedConjugationLessons(profile, lessons)[0] ?? lessons[0] ?? null;

  if (!activeLesson) {
    return;
  }

  state.activeLessonId = activeLesson.id;
  const items = getLessonItems(activeLesson);
  const nextIndex = getNextUncompletedIndex(items, state.completedItemIds);
  state.currentItemIndex = nextIndex === -1 ? items.length : nextIndex;
}

export function getConjugationSessionStatus(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  const dueCount = getDueConjugationItemsFromState(profile, lessons, state).length;
  const candidateCount = getConjugationReviewCandidates(profile, lessons).length;

  if (state.reviewMode === "focus") {
    return {
      mode: "focus",
      label: `Révision ciblée · ${Math.min(state.reviewItemIndex + 1, state.reviewItemIds.length)}/${state.reviewItemIds.length}`,
      canStartReview: candidateCount > 0,
      reviewCount: candidateCount,
      dueCount,
    };
  }

  return {
    mode: "normal",
    label:
      dueCount > 0
        ? `${dueCount} forme(s) à revoir maintenant`
        : candidateCount > 0
          ? `${candidateCount} forme(s) à consolider`
          : "Parcours progressif",
    canStartReview: candidateCount > 0,
    reviewCount: candidateCount,
    dueCount,
  };
}

export function getConjugationInfinitiveGame(profile, lessons) {
  const state = ensureConjugationState(profile, lessons);
  const attempts = state.infinitiveGame.attempts;

  return {
    active: state.infinitiveGame.active,
    challenge: state.infinitiveGame.currentChallenge,
    score: state.infinitiveGame.score,
    attempts,
    accuracy: attempts > 0 ? Math.round((state.infinitiveGame.score / attempts) * 100) : 0,
    nextIn: state.infinitiveGame.active ? 0 : Math.max(0, 4 - state.infinitiveGame.consecutiveCorrect),
  };
}

export function clearConjugationInfinitiveGame(profile, lessons, options = {}) {
  const state = ensureConjugationState(profile, lessons);
  clearInfinitiveGameState(state, options);
}

export function submitConjugationInfinitiveAnswer(profile, lessons, answer) {
  const state = ensureConjugationState(profile, lessons);
  const challenge = state.infinitiveGame.currentChallenge;

  if (!state.infinitiveGame.active || !challenge) {
    return {
      isCorrect: false,
      expectedAnswer: "",
      challenge: null,
      game: getConjugationInfinitiveGame(profile, lessons),
    };
  }

  state.infinitiveGame.attempts += 1;
  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(challenge.answer);

  if (isCorrect) {
    state.infinitiveGame.score += 1;
  }

  clearInfinitiveGameState(state);

  return {
    isCorrect,
    expectedAnswer: challenge.answer,
    challenge,
    game: getConjugationInfinitiveGame(profile, lessons),
  };
}

export function submitConjugationAnswer(profile, lessons, answer) {
  const state = ensureConjugationState(profile, lessons);
  const item = getCurrentConjugationItem(profile, lessons);

  if (!item) {
    return {
      isCorrect: true,
      expectedAnswer: "",
      item: null,
      progress: getConjugationProgress(profile, lessons),
    };
  }

  const itemStats = getItemStats(state, item.id);
  state.currentRound += 1;
  state.totalAttempts += 1;
  itemStats.seenCount += 1;
  itemStats.lastAnsweredAt = new Date().toISOString();

  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(item.answer);

  if (isCorrect) {
    itemStats.correct += 1;
    itemStats.mastery = Math.min(4, itemStats.mastery + 1);
    itemStats.nextReviewRound = state.currentRound + (itemStats.correct >= item.masteryTarget ? getConjugationSpacing(itemStats.mastery) : 1);
    itemStats.wrongInCycle = 0;
    state.score += 1;
    state.streak += 1;
    const mastered = itemStats.correct >= item.masteryTarget;
    const masteryRemaining = Math.max(item.masteryTarget - itemStats.correct, 0);

    if (mastered && !state.completedItemIds.includes(item.id)) {
      state.completedItemIds = [...state.completedItemIds, item.id];
    }

    if (state.reviewMode === "focus") {
      state.reviewItemIndex += 1;

      if (state.reviewItemIndex >= state.reviewItemIds.length) {
        stopConjugationReview(profile, lessons);
      } else {
        const nextReviewItem = getItemById(lessons, state.reviewItemIds[state.reviewItemIndex]);

        if (nextReviewItem) {
          state.activeLessonId = nextReviewItem.lessonId;
        }
      }

      return {
        isCorrect,
        expectedAnswer: item.answer,
        item,
        mastered,
        masteryRemaining,
        infinitiveGame: { started: false, challenge: null },
        progress: getConjugationProgress(profile, lessons),
      };
    }

    const lesson = getLessonById(lessons, item.lessonId) ?? getActiveConjugationLesson(profile, lessons);
    const items = lesson ? getLessonItems(lesson) : [];
    const nextIndex = getNextUncompletedIndex(items, state.completedItemIds);

    if (nextIndex === -1) {
      if (lesson && !state.completedLessonIds.includes(lesson.id)) {
        state.completedLessonIds = [...state.completedLessonIds, lesson.id];
      }

      const nextLesson = lesson ? getNextLesson(lessons, lesson.id) : null;

      if (nextLesson) {
        state.activeLessonId = nextLesson.id;
        state.currentItemIndex = 0;
      } else {
        state.currentItemIndex = items.length;
      }
    } else {
      state.currentItemIndex = nextIndex;
    }

    const infinitiveGame = maybeStartInfinitiveGame(profile, lessons, item);

    return {
      isCorrect,
      expectedAnswer: item.answer,
      item,
      mastered,
      masteryRemaining,
      infinitiveGame,
      progress: getConjugationProgress(profile, lessons),
    };
  } else {
    itemStats.wrong += 1;
    itemStats.mastery = Math.max(0, itemStats.mastery - 1);
    itemStats.wrongInCycle += 1;
    itemStats.nextReviewRound = state.currentRound + 1;
    state.streak = 0;
    state.infinitiveGame.consecutiveCorrect = 0;
  }

  return {
    isCorrect,
    expectedAnswer: item.answer,
    item,
    mastered: false,
    masteryRemaining: item?.masteryTarget ?? 1,
    infinitiveGame: { started: false, challenge: null },
    progress: getConjugationProgress(profile, lessons),
  };
}
