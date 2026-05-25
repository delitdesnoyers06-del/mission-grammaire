/**
 * Atelier Adjectifs - Logique du jeu
 * Gestion des exercices, vérification des réponses, progression, statistiques
 */

import {
  adjectiveExercises,
  getAdjectiveExerciseById,
  getAdjectiveExercisesByDifficulty,
  totalAdjectiveExercises,
} from "../data/adjective-content.js";

// Messages positifs pour les enfants
export const adjectivePositiveMessages = [
  "Bravo ! L'adjectif est bien accordé.",
  "Super ! Tu as trouvé la bonne réponse.",
  "Bien joué ! L'adjectif est correct.",
  "Excellent ! Tu maîtrises les accords.",
  "Magnifique ! C'est exactement ça.",
  "Parfait ! Tu progresses très bien.",
  "Génial ! L'accord est parfait.",
  "Fantastique ! Tu as bien compris.",
  "Impressionnant ! C'est la bonne réponse.",
  "Continue comme ça ! Tu es sur la bonne voie.",
];

// Messages d'encouragement
export const adjectiveEncouragementMessages = [
  "Essaie encore, tu vas y arriver.",
  "Presque ! Vérifie l'accord.",
  "Réfléchis au genre et au nombre.",
  "Pense : masculin ou féminin ? singulier ou pluriel ?",
  "Lis bien la phrase et observe le nom.",
  "Ce n'est pas encore ça, mais tu es proche.",
  "Regarde l'indice, il peut t'aider.",
  "Prenons notre temps, observe chaque mot.",
  "Tu peux y arriver, continue à réfléchir.",
  "Essaie de te souvenir de la règle d'accord.",
];

// Messages de feedback pédagogique par type d'erreur
export const adjectiveErrorMessages = {
  gender: "Attention à l'accord en genre. Est-ce que le nom est masculin ou féminin ?",
  number: "Attention à l'accord en nombre. Est-ce que le nom est singulier ou pluriel ?",
  both: "Vérifie l'accord en genre ET en nombre. Le nom est féminin/pluriel, donc l'adjectif doit s'accorder.",
  spelling: "Presque ! Vérifie l'orthographe de l'adjectif.",
  irregular: "C'est un adjectif irrégulier. Souviens-toi : beau → bel devant une voyelle, belle au féminin.",
};

/**
 * Créer la structure de stats par défaut pour un exercice
 */
function createEmptyAdjectiveExerciseStats() {
  return {
    correct: 0,
    wrong: 0,
    lastPlayedAt: "",
    mastery: 0,
    nextReviewRound: null,
    wrongInCurrentCycle: 0,
    seenCount: 0,
  };
}

/**
 * Créer la structure de stats par défaut pour le module adjectifs
 */
export function createEmptyAdjectiveStats() {
  const stats = {};
  adjectiveExercises.forEach((exercise) => {
    stats[exercise.id] = createEmptyAdjectiveExerciseStats();
  });
  return stats;
}

/**
 * Initialiser le state du module adjectifs pour un profil
 */
export function createDefaultAdjectiveState() {
  return {
    currentExerciseId: 0,
    completedExerciseIds: [],
    score: 0,
    streak: 0,
    totalAttempts: 0,
    exerciseStats: createEmptyAdjectiveStats(),
    currentRound: 0,
    reviewMode: "normal",
    reviewExerciseIds: [],
    reviewExerciseIndex: 0,
  };
}

/**
 * Normaliser les stats d'un exercice
 */
function normalizeAdjectiveExerciseStats(stats = {}) {
  return {
    correct: Math.max(0, Number(stats?.correct) || 0),
    wrong: Math.max(0, Number(stats?.wrong) || 0),
    lastPlayedAt: typeof stats?.lastPlayedAt === "string" ? stats.lastPlayedAt : "",
    mastery: Math.max(0, Math.min(4, Number(stats?.mastery) || 0)),
    nextReviewRound: Number.isInteger(stats?.nextReviewRound) ? stats.nextReviewRound : null,
    wrongInCurrentCycle: Math.max(0, Number(stats?.wrongInCurrentCycle) || 0),
    seenCount: Math.max(0, Number(stats?.seenCount) || 0),
  };
}

/**
 * Normaliser le state complet du module adjectifs
 */
export function normalizeAdjectiveState(state = {}) {
  const safeState = createDefaultAdjectiveState();

  return {
    currentExerciseId: Number(state?.currentExerciseId) || safeState.currentExerciseId,
    completedExerciseIds: Array.isArray(state?.completedExerciseIds)
      ? [...new Set(state.completedExerciseIds.map((value) => Number(value)).filter(Number.isInteger))]
      : [],
    score: Math.max(0, Number(state?.score) || 0),
    streak: Math.max(0, Number(state?.streak) || 0),
    totalAttempts: Math.max(0, Number(state?.totalAttempts) || 0),
    currentRound: Math.max(0, Number(state?.currentRound) || 0),
    reviewMode: typeof state?.reviewMode === "string" ? state.reviewMode : "normal",
    reviewExerciseIds: Array.isArray(state?.reviewExerciseIds)
      ? [...new Set(state.reviewExerciseIds.map((value) => Number(value)).filter(Number.isInteger))]
      : [],
    reviewExerciseIndex: Math.max(0, Number(state?.reviewExerciseIndex) || 0),
    exerciseStats: Object.entries(state?.exerciseStats || {}).reduce((normalized, [exerciseId, stats]) => {
      const id = Number(exerciseId);
      if (Number.isInteger(id) && adjectiveExercises.some((e) => e.id === id)) {
        normalized[id] = normalizeAdjectiveExerciseStats(stats);
      }
      return normalized;
    }, {}),
  };
}

/**
 * Obtenir l'exercice courant
 */
export function getCurrentAdjectiveExercise(profile) {
  if (!profile?.adjective) {
    return null;
  }

  if (profile.adjective.reviewMode !== "normal" && profile.adjective.reviewExerciseIds.length > 0) {
    const reviewId = profile.adjective.reviewExerciseIds[profile.adjective.reviewExerciseIndex];
    return getAdjectiveExerciseById(reviewId);
  }

  return getAdjectiveExerciseById(profile.adjective.currentExerciseId);
}

/**
 * Obtenir les candidats pour le mode normal (parcours adaptatif)
 */
export function getNormalAdjectiveCandidates(profile) {
  if (!profile?.adjective) {
    return adjectiveExercises.slice();
  }

  const dueReviewExercises = adjectiveExercises.filter(
    (exercise) => {
      const stats = profile.adjective.exerciseStats[exercise.id];
      return (
        stats &&
        Number.isInteger(stats.nextReviewRound) &&
        stats.nextReviewRound <= profile.adjective.currentRound
      );
    },
  );

  const dueReviewIds = new Set(dueReviewExercises.map((e) => e.id));

  const unfinishedExercises = adjectiveExercises.filter(
    (exercise) =>
      !profile.adjective.completedExerciseIds.includes(exercise.id) && !dueReviewIds.has(exercise.id),
  );

  // Trier par difficulté, puis mélanger dans chaque niveau
  const sortedByDifficulty = [...dueReviewExercises, ...unfinishedExercises].sort(
    (a, b) => a.difficulty - b.difficulty,
  );

  // Mélanger les exercices de même difficulté
  return shuffleArrayByGroups(sortedByDifficulty, "difficulty");
}

/**
 * Mélanger un tableau en conservant des groupes ensemble
 */
function shuffleArrayByGroups(array, groupKey) {
  const groups = {};
  array.forEach((item) => {
    const key = item[groupKey];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  // Mélanger chaque groupe
  Object.keys(groups).forEach((key) => {
    groups[key] = shuffleArray(groups[key]);
  });

  // Mélanger l'ordre des groupes puis aplatir
  const groupKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));
  const shuffledGroups = shuffleArray(groupKeys);

  return shuffledGroups.flatMap((key) => groups[key]);
}

/**
 * Mélanger un tableau (Fisher-Yates algorithm)
 */
export function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

/**
 * Vérifier une réponse
 */
export function verifyAdjectiveAnswer(profile, userAnswer) {
  if (!profile?.adjective) {
    return { isCorrect: false, expectedAnswer: "", exerciseId: -1, message: "" };
  }

  const exercise = getCurrentAdjectiveExercise(profile);
  if (!exercise) {
    return { isCorrect: false, expectedAnswer: "", exerciseId: -1, message: "" };
  }

  // Normaliser la réponse : trim et lowercase
  const normalizedAnswer = userAnswer.trim().toLowerCase();
  const normalizedExpected = exercise.correctAnswer.toLowerCase();

  const isCorrect = normalizedAnswer === normalizedExpected;

  return {
    isCorrect,
    expectedAnswer: exercise.correctAnswer,
    exerciseId: exercise.id,
    exercise,
    message: isCorrect
      ? adjectivePositiveMessages[profile.adjective.score % adjectivePositiveMessages.length]
      : getAdjectiveErrorMessage(profile, exercise, userAnswer),
  };
}

/**
 * Obtenir un message d'erreur adapté
 */
function getAdjectiveErrorMessage(profile, exercise, userAnswer) {
  const normalizedAnswer = userAnswer.trim().toLowerCase();
  const normalizedExpected = exercise.correctAnswer.toLowerCase();

  // Vérifier si c'est juste une erreur de casse
  if (normalizedAnswer === normalizedExpected) {
    return adjectiveEncouragementMessages[0];
  }

  // Vérifier si l'adjectif est correct mais mal accordé
  const baseAnswer = getBaseForm(exercise.correctAnswer, exercise.gender, exercise.number);
  const baseUserAnswer = getBaseForm(userAnswer.trim(), exercise.gender, exercise.number);

  if (baseUserAnswer === baseAnswer) {
    // L'utilisateur connaît l'adjectif mais l'accord est faux
    if (exercise.gender === "feminin" && exercise.number === "pluriel") {
      return adjectiveErrorMessages.both;
    } else if (exercise.gender === "feminin") {
      return adjectiveErrorMessages.gender;
    } else if (exercise.number === "pluriel") {
      return adjectiveErrorMessages.number;
    }
  }

  // Pour les adjectifs irréguliers
  if (exercise.category === "irregulier") {
    return adjectiveErrorMessages.irregular;
  }

  // Message générique
  const attemptCount = profile.adjective.exerciseStats[exercise.id]?.wrong || 0;
  return attemptCount >= 2
    ? `La bonne réponse est : ${exercise.correctAnswer}. ${exercise.explanation}`
    : adjectiveEncouragementMessages[Math.floor(Math.random() * adjectiveEncouragementMessages.length)];
}

/**
 * Obtenir la forme de base d'un adjectif (masculin singulier)
 */
function getBaseForm(adjective, gender, number) {
  // Pour les adjectifs irréguliers, retourner la forme de base
  const irregularMap = {
    beau: "beau",
    bel: "beau",
    belle: "beau",
    beaux: "beau",
    belles: "beau",
    grand: "grand",
    grande: "grand",
    grands: "grand",
    grandes: "grand",
    vieux: "vieux",
    vieil: "vieux",
    vieille: "vieux",
    vieilles: "vieux",
    vieux: "vieux",
  };

  const lowerAdjective = adjective.toLowerCase();
  if (irregularMap[lowerAdjective]) {
    return irregularMap[lowerAdjective];
  }

  // Pour les autres, retourner le masculin singulier
  // Si c'est déjà au masculin singulier, retourner tel quel
  // Si c'est au féminin, enlever le -e
  // Si c'est au pluriel, enlever le -s ou -es
  let base = adjective.toLowerCase();

  if (base.endsWith("es")) {
    base = base.slice(0, -2);
  } else if (base.endsWith("s")) {
    base = base.slice(0, -1);
  } else if (base.endsWith("e") && gender === "feminin") {
    base = base.slice(0, -1);
  }

  return base;
}

/**
 * Enregistrer une tentative
 */
export function recordAdjectiveAttempt(profile, isCorrect, exerciseId) {
  if (!profile?.adjective) {
    return;
  }

  const exerciseStats = profile.adjective.exerciseStats[exerciseId];
  const now = new Date().toISOString();

  if (isCorrect) {
    exerciseStats.correct += 1;
    profile.adjective.score += 1;
    profile.adjective.streak += 1;

    // Calculer la maîtrise (0-4)
    const totalAttempts = exerciseStats.correct + exerciseStats.wrong;
    if (totalAttempts >= 1 && exerciseStats.wrong === 0) {
      exerciseStats.mastery = Math.min(4, exerciseStats.mastery + 1);
    }
  } else {
    exerciseStats.wrong += 1;
    profile.adjective.streak = 0;
    exerciseStats.wrongInCurrentCycle += 1;

    // Réduire la maîtrise si trop d'erreurs
    if (exerciseStats.wrongInCurrentCycle >= 2) {
      exerciseStats.mastery = Math.max(0, exerciseStats.mastery - 1);
    }
  }

  exerciseStats.lastPlayedAt = now;
  exerciseStats.seenCount += 1;
  profile.adjective.totalAttempts += 1;

  // Si c'est la première fois que l'exercice est réussi
  if (isCorrect && !profile.adjective.completedExerciseIds.includes(exerciseId)) {
    profile.adjective.completedExerciseIds = [
      ...profile.adjective.completedExerciseIds,
      exerciseId,
    ].sort((a, b) => a - b);
  }

  // Mettre à jour le round de révision
  if (isCorrect) {
    exerciseStats.nextReviewRound = profile.adjective.currentRound + getReviewDelay(exerciseStats.mastery);
    exerciseStats.wrongInCurrentCycle = 0;
  } else if (exerciseStats.nextReviewRound === null) {
    exerciseStats.nextReviewRound = profile.adjective.currentRound + 1;
  }
}

/**
 * Obtenir le délai avant la prochaine révision (en rounds)
 */
function getReviewDelay(mastery) {
  // Plus la maîtrise est élevée, plus le délai est long
  const delays = [1, 2, 4, 8, 16]; // rounds à attendre
  return delays[Math.min(mastery, delays.length - 1)];
}

/**
 * Obtenir un indice pour l'exercice courant
 */
export function getAdjectiveHint(profile, attemptCount = 0) {
  if (!profile?.adjective) {
    return "";
  }

  const exercise = getCurrentAdjectiveExercise(profile);
  if (!exercise) {
    return "";
  }

  // Premier indice : l'indice normal
  if (attemptCount === 0) {
    return exercise.hint;
  }

  // Deuxième tentative : indice plus fort
  if (attemptCount === 1) {
    return exercise.strongHint;
  }

  // Troisième tentative : donner la catégorie et le genre/nombre
  return `Indice final : C'est un adjectif de ${exercise.category}, ${exercise.gender}, ${exercise.number}.`;
}

/**
 * Obtenir la progression dans le module adjectifs
 */
export function getAdjectiveProgress(profile) {
  if (!profile?.adjective) {
    return {
      completed: 0,
      total: totalAdjectiveExercises,
      percentage: 0,
      mastery: 0,
    };
  }

  const completed = profile.adjective.completedExerciseIds.length;
  const percentage = totalAdjectiveExercises > 0
    ? Math.round((completed / totalAdjectiveExercises) * 100)
    : 0;

  // Calculer le niveau de maîtrise moyen
  const allStats = Object.values(profile.adjective.exerciseStats);
  const totalMastery = allStats.reduce((sum, stats) => sum + stats.mastery, 0);
  const averageMastery = allStats.length > 0 ? totalMastery / allStats.length : 0;

  return {
    completed,
    total: totalAdjectiveExercises,
    percentage,
    mastery: Math.round(averageMastery * 25), // Convertir 0-4 à 0-100
    score: profile.adjective.score,
    streak: profile.adjective.streak,
    totalAttempts: profile.adjective.totalAttempts,
  };
}

/**
 * Obtenir les exercices à réviser
 */
export function getAdjectiveReviewCandidates(profile, mode = "normal", category = "") {
  if (!profile?.adjective) {
    return [];
  }

  let candidates = [];

  if (mode === "all") {
    // Tous les exercices
    candidates = adjectiveExercises.slice();
  } else if (mode === "weakness") {
    // Les exercices avec le plus d'erreurs
    candidates = adjectiveExercises
      .map((exercise) => {
        const stats = profile.adjective.exerciseStats[exercise.id];
        return { exercise, wrongCount: stats?.wrong || 0 };
      })
      .filter((item) => item.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .map((item) => item.exercise);
  } else if (mode === "category" && category) {
    // Exercices d'une catégorie spécifique
    candidates = adjectiveExercises.filter((e) => e.category === category);
  } else if (mode === "difficulty") {
    // Exercices par niveau de difficulté
    // Utiliser le niveau adaptatif
    const difficulty = getAdaptiveAdjectiveDifficulty(profile);
    candidates = getAdjectiveExercisesByDifficulty(difficulty);
  } else {
    // Mode normal : exercices avec révision due
    candidates = adjectiveExercises.filter(
      (exercise) => {
        const stats = profile.adjective.exerciseStats[exercise.id];
        return (
          stats &&
          Number.isInteger(stats.nextReviewRound) &&
          stats.nextReviewRound <= profile.adjective.currentRound
        );
      },
    );
  }

  return candidates;
}

/**
 * Obtenir le niveau de difficulté adaptatif
 */
export function getAdaptiveAdjectiveDifficulty(profile) {
  if (!profile?.adjective) {
    return 1;
  }

  const progress = getAdjectiveProgress(profile);

  if (progress.percentage < 30 || progress.mastery < 30) {
    return 1;
  } else if (progress.percentage < 60 || progress.mastery < 60) {
    return 2;
  } else if (progress.percentage < 80 || progress.mastery < 80) {
    return 3;
  } else if (progress.percentage < 95 || progress.mastery < 95) {
    return 4;
  }

  return 5;
}

/**
 * Passer à l'exercice suivant
 */
export function advanceAdjectiveExercise(profile) {
  if (!profile?.adjective) {
    return null;
  }

  if (profile.adjective.reviewMode !== "normal") {
    // Mode révision : passer au suivant dans la queue
    profile.adjective.reviewExerciseIndex += 1;

    if (profile.adjective.reviewExerciseIndex >= profile.adjective.reviewExerciseIds.length) {
      // Fin de la révision
      profile.adjective.reviewMode = "normal";
      profile.adjective.reviewExerciseIds = [];
      profile.adjective.reviewExerciseIndex = 0;
      profile.adjective.currentExerciseId = 0;
      return null;
    }

    profile.adjective.currentExerciseId = profile.adjective.reviewExerciseIds[profile.adjective.reviewExerciseIndex];
    return getAdjectiveExerciseById(profile.adjective.currentExerciseId);
  }

  // Mode normal : trouver le prochain exercice
  const candidates = getNormalAdjectiveCandidates(profile);
  const currentId = profile.adjective.currentExerciseId;

  // Trouver l'index de l'exercice courant
  const currentIndex = candidates.findIndex((e) => e.id === currentId);

  if (currentIndex >= 0 && currentIndex < candidates.length - 1) {
    profile.adjective.currentExerciseId = candidates[currentIndex + 1].id;
    return candidates[currentIndex + 1];
  }

  // Si on a terminé tous les exercices, recommencer depuis le début
  if (profile.adjective.completedExerciseIds.length >= totalAdjectiveExercises) {
    profile.adjective.currentExerciseId = candidates[0]?.id || 0;
    return candidates[0] || null;
  }

  // Sinon, trouver le premier non complété
  const nextExercise = candidates.find(
    (e) => !profile.adjective.completedExerciseIds.includes(e.id),
  );

  if (nextExercise) {
    profile.adjective.currentExerciseId = nextExercise.id;
    return nextExercise;
  }

  // Par défaut, retourner au premier
  profile.adjective.currentExerciseId = candidates[0]?.id || 0;
  return candidates[0] || null;
}

/**
 * Démarrer une session de révision
 */
export function startAdjectiveReview(profile, mode = "all", category = "") {
  if (!profile?.adjective) {
    return { started: false, count: 0 };
  }

  const candidates = getAdjectiveReviewCandidates(profile, mode, category);

  if (candidates.length === 0) {
    return { started: false, count: 0 };
  }

  profile.adjective.reviewMode = mode;
  profile.adjective.reviewExerciseIds = shuffleArray(candidates).map((e) => e.id);
  profile.adjective.reviewExerciseIndex = 0;
  profile.adjective.currentExerciseId = profile.adjective.reviewExerciseIds[0];

  return { started: true, count: candidates.length };
}

/**
 * Quitter le mode révision
 */
export function stopAdjectiveReview(profile) {
  if (!profile?.adjective) {
    return;
  }

  profile.adjective.reviewMode = "normal";
  profile.adjective.reviewExerciseIds = [];
  profile.adjective.reviewExerciseIndex = 0;

  // Trouver un bon exercice pour reprendre
  const candidates = getNormalAdjectiveCandidates(profile);
  if (candidates.length > 0) {
    profile.adjective.currentExerciseId = candidates[0].id;
  } else {
    profile.adjective.currentExerciseId = 0;
  }
}

/**
 * Obtenir les statistiques par catégorie
 */
export function getAdjectiveStatsByCategory(profile) {
  if (!profile?.adjective) {
    return {};
  }

  const statsByCategory = {};

  adjectiveExercises.forEach((exercise) => {
    const stats = profile.adjective.exerciseStats[exercise.id];
    if (!statsByCategory[exercise.category]) {
      statsByCategory[exercise.category] = {
        correct: 0,
        wrong: 0,
        total: 0,
        completed: 0,
      };
    }

    statsByCategory[exercise.category].correct += stats?.correct || 0;
    statsByCategory[exercise.category].wrong += stats?.wrong || 0;
    statsByCategory[exercise.category].total += (stats?.correct || 0) + (stats?.wrong || 0);

    if (profile.adjective.completedExerciseIds.includes(exercise.id)) {
      statsByCategory[exercise.category].completed += 1;
    }
  });

  return statsByCategory;
}

/**
 * Obtenir les statistiques par niveau de difficulté
 */
export function getAdjectiveStatsByDifficulty(profile) {
  if (!profile?.adjective) {
    return {};
  }

  const statsByDifficulty = {};

  for (let d = 1; d <= 5; d++) {
    statsByDifficulty[d] = { correct: 0, wrong: 0, total: 0, completed: 0 };
  }

  adjectiveExercises.forEach((exercise) => {
    const stats = profile.adjective.exerciseStats[exercise.id];
    const difficulty = exercise.difficulty;

    statsByDifficulty[difficulty].correct += stats?.correct || 0;
    statsByDifficulty[difficulty].wrong += stats?.wrong || 0;
    statsByDifficulty[difficulty].total += (stats?.correct || 0) + (stats?.wrong || 0);

    if (profile.adjective.completedExerciseIds.includes(exercise.id)) {
      statsByDifficulty[difficulty].completed += 1;
    }
  });

  return statsByDifficulty;
}

/**
 * Réinitialiser la progression du module adjectifs
 */
export function resetAdjectiveState(profile) {
  if (!profile) {
    return;
  }

  profile.adjective = createDefaultAdjectiveState();
}

/**
 * Synchroniser le round de révision
 */
export function syncAdjectiveRound(profile) {
  if (!profile?.adjective) {
    return;
  }

  // Incrémenter le round si nécessaire
  const allStats = Object.values(profile.adjective.exerciseStats);
  const allCompleted = allStats.every(
    (stats) => stats.correct > 0 || stats.nextReviewRound !== null,
  );

  if (allCompleted) {
    profile.adjective.currentRound += 1;
  }
}
