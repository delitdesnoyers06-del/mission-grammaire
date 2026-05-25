import {
  conjugationLessons,
} from "./js/data/conjugation-content.js";
import {
  generateSentences,
  missionTemplates,
  positiveMessages,
} from "./js/data/content.js";
import {
  adjectiveExercises,
  totalAdjectiveExercises,
} from "./js/data/adjective-content.js";
import {
  createSentenceStatsFactory,
  loadAppData,
  resetAppData,
  saveAppData,
} from "./js/core/storage.js";
import { getAdaptiveProfile, getEnhancedHint, sortSentencesForDifficulty } from "./js/features/adaptive.js";
import {
  clearConjugationInfinitiveGame,
  ensureConjugationState,
  getConjugationInfinitiveGame,
  getConjugationHint,
  getConjugationModuleProgress,
  getConjugationProgress,
  setActiveConjugationLesson,
  startConjugationReview,
  stopConjugationReview,
  submitConjugationAnswer,
  submitConjugationInfinitiveAnswer,
} from "./js/features/conjugation.js";
import {
  createDefaultAdjectiveState,
  normalizeAdjectiveState,
  getCurrentAdjectiveExercise,
  getNormalAdjectiveCandidates,
  verifyAdjectiveAnswer,
  recordAdjectiveAttempt,
  getAdjectiveHint,
  getAdjectiveProgress,
  advanceAdjectiveExercise,
  startAdjectiveReview,
  stopAdjectiveReview,
  syncAdjectiveRound,
} from "./js/features/adjective.js";
import { addProfile, getActiveProfile, switchProfile } from "./js/features/profiles.js";
import { syncBadges } from "./js/features/rewards.js";
import { getReviewCandidates, setReviewMode } from "./js/features/review.js";
import { getDueReviewSentences, updateSentenceSchedule } from "./js/features/spaced-repetition.js";
import { getAccuracy, getSentenceStats, recordAttempt } from "./js/features/stats.js";
import { renderConjugationSection } from "./js/ui/conjugation-render.js";
import { getDomElements, populateReviewFocusSelect, renderApp, renderModuleHub, renderProfiles, setFeedback } from "./js/ui/render.js";
import {
  getAdjectiveDomElements,
  renderAdjectiveSection,
  populateAdjectiveCategorySelect,
  setAdjectiveFeedback,
} from "./js/ui/adjective-render.js";

const sentences = generateSentences();
const createSentenceStats = createSentenceStatsFactory(missionTemplates);
const appData = loadAppData(missionTemplates);
const dom = getDomElements();
const adjDom = getAdjectiveDomElements();

const uiState = {
  activeModuleId: "grammar",
  selectedIndices: [],
  locked: false,
  selectionState: "",
  wordHighlights: {
    matched: [],
    missing: [],
    extra: [],
  },
  hintMessage: "",
  feedbackMessage: "",
  feedbackStatus: "",
  reviewQueueIds: [],
  reviewQueueIndex: 0,
  finished: false,
  conjugationDraft: "",
  conjugationHintMessage: "",
  conjugationFeedbackMessage: "",
  conjugationFeedbackStatus: "",
  conjugationRetryItemId: "",
  conjugationRetryCount: 0,
  // State pour le module adjectifs
  adjectiveDraft: "",
  adjectiveHintMessage: "",
  adjectiveFeedbackMessage: "",
  adjectiveFeedbackStatus: "",
  adjectiveAttemptCount: 0,
};

const MODULE_IDS = {
  grammar: "grammar",
  conjugation: "conjugation",
  adjective: "adjective",
};

function arraysMatch(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
}

function getSelectionFeedback(selectedIndices, expectedIndices) {
  const expectedSet = new Set(expectedIndices);
  const selectedSet = new Set(selectedIndices);
  const missing = expectedIndices.filter((index) => !selectedSet.has(index));
  const extra = selectedIndices.filter((index) => !expectedSet.has(index));
  const matched = selectedIndices.filter((index) => expectedSet.has(index));

  return {
    isCorrect: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    matched,
  };
}

function pluralizeTarget(label, count) {
  if (count <= 1) {
    return label;
  }

  if (label === "mot du sujet") {
    return "mots du sujet";
  }

  return `${label}s`;
}

function buildGrammarErrorMessage(mission, analysis) {
  const target = pluralizeTarget(mission.targetLabel || mission.label, mission.expectedCount || 1);

  if (analysis.missing.length > 0 && analysis.extra.length === 0 && analysis.matched.length > 0) {
    return `Tu as trouvé une partie des ${target}, mais il en manque ${analysis.missing.length}.`;
  }

  if (analysis.missing.length > 0 && analysis.extra.length === 0) {
    return `Il manque ${analysis.missing.length} ${pluralizeTarget(mission.targetLabel || mission.label, analysis.missing.length)}.`;
  }

  if (analysis.missing.length === 0 && analysis.extra.length > 0) {
    return `Bonne catégorie, mais il y a ${analysis.extra.length} mot(s) en trop.`;
  }

  if (analysis.missing.length > 0 && analysis.extra.length > 0) {
    return `Tu as une partie juste, mais il manque ${analysis.missing.length} mot(s) et il y a ${analysis.extra.length} mot(s) en trop.`;
  }

  return "Ce n'est pas encore ça. Observe mieux la catégorie demandée.";
}

function getProfile() {
  return getActiveProfile(appData);
}

/**
 * S'assurer que le state du module adjective est initialisé
 */
function ensureAdjectiveState(profile) {
  if (!profile.adjective) {
    profile.adjective = createDefaultAdjectiveState();
  }
}

function getAvailableModules(profile) {
  const conjugationProgress = getConjugationModuleProgress(profile, conjugationLessons);
  const adjectiveProgress = profile.adjective ? getAdjectiveProgress(profile) : { completed: 0, total: totalAdjectiveExercises };

  return [
    {
      id: MODULE_IDS.grammar,
      panelId: "grammarPanel",
      title: "Mission grammaire",
      description: "Repère le sujet, le verbe et les autres éléments de la phrase.",
      meta: `${profile.completedSentenceIds.length}/${sentences.length} phrases · ${getAccuracy(profile)} %`,
      badge: "Module principal",
      summary: "Module actif : Mission grammaire.",
      isAvailable: true,
    },
    {
      id: MODULE_IDS.conjugation,
      panelId: "conjugationPanel",
      title: "Atelier conjugaison",
      description: "Présent, futur, imparfait et passé composé, du 1er au 3e groupe essentiel.",
      meta: `${conjugationProgress.completedCount}/${conjugationProgress.totalCount} formes · ${conjugationProgress.unlockedLessonCount}/${conjugationProgress.lessonCount} leçons`,
      badge: "MVP",
      summary: "Module actif : Atelier conjugaison.",
      isAvailable: true,
    },
    {
      id: MODULE_IDS.adjective,
      panelId: "adjectivePanel",
      title: "Atelier adjectifs",
      description: "Complète les phrases avec les adjectifs correctement accordés.",
      meta: `${adjectiveProgress.completed}/${adjectiveProgress.total} exercices · ${profile.adjective ? profile.adjective.score : 0} points`,
      badge: "Nouveau",
      summary: "Module actif : Atelier adjectifs.",
      isAvailable: true,
    },
  ];
}

function syncActiveModule(profile) {
  const modules = getAvailableModules(profile);
  const isValid = modules.some((module) => module.id === profile.activeModuleId && module.isAvailable !== false);
  const fallbackModuleId = modules.find((module) => module.isAvailable !== false)?.id ?? MODULE_IDS.grammar;

  profile.activeModuleId = isValid ? profile.activeModuleId : fallbackModuleId;
  uiState.activeModuleId = profile.activeModuleId;
}

function setActiveModule(moduleId) {
  const profile = getProfile();
  const modules = getAvailableModules(profile);
  const targetModule = modules.find((module) => module.id === moduleId && module.isAvailable !== false);

  if (!targetModule) {
    return;
  }

  profile.activeModuleId = targetModule.id;
  uiState.activeModuleId = targetModule.id;
  saveAppData(appData);
  render();
}

function syncModulePanels() {
  dom.grammarPanel.hidden = uiState.activeModuleId !== MODULE_IDS.grammar;
  dom.conjugationPanel.hidden = uiState.activeModuleId !== MODULE_IDS.conjugation;
  if (adjDom.adjectivePanel) {
    adjDom.adjectivePanel.hidden = uiState.activeModuleId !== MODULE_IDS.adjective;
  }
}

function getSentenceById(sentenceId) {
  return sentences.find((sentence) => sentence.id === sentenceId) ?? null;
}

function getCurrentSentence() {
  return getSentenceById(getProfile().currentSentenceId);
}

function getCurrentMission() {
  const sentence = getCurrentSentence();
  return sentence ? sentence.missions[getProfile().currentMissionIndex] : null;
}

function getNormalCandidates(profile) {
  const adaptiveProfile = getAdaptiveProfile(profile, missionTemplates);
  const dueReviewSentences = getDueReviewSentences(profile, sentences);
  const dueReviewIds = new Set(dueReviewSentences.map((sentence) => sentence.id));
  const unfinishedSentences = sortSentencesForDifficulty(
    sentences.filter(
      (sentence) => !profile.completedSentenceIds.includes(sentence.id) && !dueReviewIds.has(sentence.id),
    ),
    adaptiveProfile.difficulty,
  );

  return [...dueReviewSentences, ...unfinishedSentences];
}

function resetUiState() {
  uiState.selectedIndices = [];
  uiState.locked = false;
  uiState.selectionState = "";
  uiState.wordHighlights = {
    matched: [],
    missing: [],
    extra: [],
  };
  uiState.hintMessage = "";
}

function markFinished(value) {
  uiState.finished = value;
}

function syncProfileToNormalMode(profile, keepCurrentMission = true) {
  setReviewMode(profile, "normal", "");
  uiState.reviewQueueIds = [];
  uiState.reviewQueueIndex = 0;

  const candidates = getNormalCandidates(profile);

  if (candidates.length === 0) {
    profile.currentSentenceId = -1;
    profile.currentMissionIndex = 0;
    markFinished(true);
    return;
  }

  const currentIsValid = candidates.some((sentence) => sentence.id === profile.currentSentenceId);

  if (!currentIsValid) {
    profile.currentSentenceId = candidates[0].id;
    profile.currentMissionIndex = 0;
  } else if (!keepCurrentMission) {
    profile.currentMissionIndex = 0;
  }

  markFinished(false);
}

function startReviewSession(mode, missionLabel = "") {
  const profile = getProfile();
  setReviewMode(profile, mode, missionLabel);
  const candidates = getReviewCandidates(profile, sentences, missionTemplates);

  if (candidates.length === 0) {
    syncProfileToNormalMode(profile);
    uiState.feedbackMessage = "Aucune phrase à réviser pour ce ciblage.";
    uiState.feedbackStatus = "error";
    saveAppData(appData);
    render();
    return;
  }

  uiState.reviewQueueIds = candidates.map((sentence) => sentence.id);
  uiState.reviewQueueIndex = 0;
  profile.currentSentenceId = uiState.reviewQueueIds[0];
  profile.currentMissionIndex = 0;
  markFinished(false);
  resetUiState();
  uiState.feedbackMessage =
    mode === "all"
      ? "Révision complète activée."
      : missionLabel
        ? `Révision ciblée lancée sur ${missionLabel}.`
        : "Révision ciblée activée.";
  uiState.feedbackStatus = "success";
  saveAppData(appData);
  render();
}

function exitReviewMode(message = "Retour au parcours adaptatif.") {
  const profile = getProfile();
  syncProfileToNormalMode(profile);
  resetUiState();
  uiState.feedbackMessage = message;
  uiState.feedbackStatus = "success";
  saveAppData(appData);
  render();
}

function advanceAfterSentenceCompletion(sentenceId) {
  const profile = getProfile();
  resetUiState();

  if (profile.reviewMode === "normal") {
    const candidates = getNormalCandidates(profile).filter((sentence) => sentence.id !== sentenceId);

    if (candidates.length === 0) {
      profile.currentSentenceId = -1;
      profile.currentMissionIndex = 0;
      markFinished(true);
      saveAppData(appData);
      render();
      return;
    }

    profile.currentSentenceId = candidates[0].id;
    profile.currentMissionIndex = 0;
    markFinished(false);
    uiState.feedbackMessage = "";
    uiState.feedbackStatus = "";
    saveAppData(appData);
    render();
    return;
  }

  uiState.reviewQueueIndex += 1;

  if (uiState.reviewQueueIndex >= uiState.reviewQueueIds.length) {
    profile.currentSentenceId = -1;
    profile.currentMissionIndex = 0;
    markFinished(true);
    uiState.feedbackMessage = "Session de révision terminée.";
    uiState.feedbackStatus = "success";
    saveAppData(appData);
    render();
    return;
  }

  profile.currentSentenceId = uiState.reviewQueueIds[uiState.reviewQueueIndex];
  profile.currentMissionIndex = 0;
  markFinished(false);
  uiState.feedbackMessage = "";
  uiState.feedbackStatus = "";
  saveAppData(appData);
  render();
}

function render() {
  const profile = getProfile();
  ensureConjugationState(profile, conjugationLessons);
  syncActiveModule(profile);
  const adaptiveProfile = getAdaptiveProfile(profile, missionTemplates);
  const currentSentence = getCurrentSentence();
  const currentMission = getCurrentMission();
  const modules = getAvailableModules(profile);

  renderProfiles(dom, appData);
  renderModuleHub(dom, modules, uiState.activeModuleId, setActiveModule);
  syncModulePanels();
  renderApp({
    dom,
    appData,
    profile,
    sentences,
    missionTemplates,
    currentSentence,
    currentMission,
    selectedIndices: uiState.selectedIndices,
    selectionState: uiState.selectionState,
    wordHighlights: uiState.wordHighlights,
    adaptiveProfile,
    onWordToggle: toggleWord,
    isFinished: uiState.finished,
  });

  renderConjugationSection({
    dom,
    profile,
    lessons: conjugationLessons,
    draftValue: uiState.conjugationDraft,
    hintMessage: uiState.conjugationHintMessage,
    feedbackMessage: uiState.conjugationFeedbackMessage,
    feedbackStatus: uiState.conjugationFeedbackStatus,
  });

  // Rendre le module adjectifs
  ensureAdjectiveState(profile);
  renderAdjectiveSection({
    dom: adjDom,
    profile,
    exercises: adjectiveExercises,
    draftValue: uiState.adjectiveDraft,
    hintMessage: uiState.adjectiveHintMessage,
    feedbackMessage: uiState.adjectiveFeedbackMessage,
    feedbackStatus: uiState.adjectiveFeedbackStatus,
  });

  if (!uiState.finished) {
    dom.hintText.textContent = uiState.hintMessage;
  }

  setFeedback(dom, uiState.feedbackMessage, uiState.feedbackStatus);
}

function toggleWord(index) {
  if (uiState.locked || uiState.finished) {
    return;
  }

  if (uiState.selectedIndices.includes(index)) {
    uiState.selectedIndices = uiState.selectedIndices.filter((value) => value !== index);
  } else {
    uiState.selectedIndices = [...uiState.selectedIndices, index].sort((first, second) => first - second);
  }

  uiState.selectionState = "";
  uiState.wordHighlights = {
    matched: [],
    missing: [],
    extra: [],
  };
  render();
}

function showHint() {
  const profile = getProfile();
  const sentence = getCurrentSentence();
  const mission = getCurrentMission();

  if (!sentence || !mission) {
    return;
  }

  const adaptiveProfile = getAdaptiveProfile(profile, missionTemplates);
  const sentenceStats = getSentenceStats(profile, sentence.id, createSentenceStats);
  const missionWrongCount = sentenceStats.missionStats[mission.label].wrong;
  const countHint = mission.expectedCount > 1 ? ` Il y a ${mission.expectedCount} ${pluralizeTarget(mission.targetLabel || mission.label, mission.expectedCount)} à trouver.` : "";
  uiState.hintMessage = `Indice : ${getEnhancedHint(mission, missionWrongCount, adaptiveProfile)}${countHint}`;
  render();
}

function clearSelection() {
  if (uiState.locked || uiState.finished) {
    return;
  }

  uiState.selectedIndices = [];
  uiState.selectionState = "";
  uiState.feedbackMessage = "";
  uiState.feedbackStatus = "";
  render();
}

function resetConjugationRetryState() {
  uiState.conjugationRetryItemId = "";
  uiState.conjugationRetryCount = 0;
}

function handleConjugationDraftChange() {
  uiState.conjugationDraft = dom.conjugationInput.value;
}

function showConjugationHint() {
  const profile = getProfile();
  ensureConjugationState(profile, conjugationLessons);

  if (getConjugationInfinitiveGame(profile, conjugationLessons).active) {
    uiState.conjugationHintMessage = "Indice : retrouve le verbe tel qu'il apparaît dans la leçon, avec sa terminaison complète.";
    render();
    return;
  }

  uiState.conjugationHintMessage = getConjugationHint(profile, conjugationLessons);
  render();
}

function handleConjugationLessonChange() {
  const profile = getProfile();
  const didChange = setActiveConjugationLesson(profile, conjugationLessons, dom.conjugationLessonSelect.value);

  if (!didChange) {
    return;
  }

  clearConjugationInfinitiveGame(profile, conjugationLessons, { resetCounter: true });
  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  uiState.conjugationFeedbackMessage = "";
  uiState.conjugationFeedbackStatus = "";
  resetConjugationRetryState();
  saveAppData(appData);
  render();
}

function startFocusedConjugationReview() {
  const profile = getProfile();
  const result = startConjugationReview(profile, conjugationLessons);

  if (!result.started) {
    uiState.conjugationFeedbackMessage = "Aucune difficulté à réviser pour le moment.";
    uiState.conjugationFeedbackStatus = "success";
    render();
    return;
  }

  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  uiState.conjugationFeedbackMessage = `Révision ciblée lancée sur ${result.count} forme(s).`;
  uiState.conjugationFeedbackStatus = "success";
  resetConjugationRetryState();
  saveAppData(appData);
  render();
}

function stopFocusedConjugationReview() {
  const profile = getProfile();
  stopConjugationReview(profile, conjugationLessons);
  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  uiState.conjugationFeedbackMessage = "Retour au parcours progressif.";
  uiState.conjugationFeedbackStatus = "success";
  resetConjugationRetryState();
  saveAppData(appData);
  render();
}

function handleConjugationMiniGameClick(event) {
  const button = event.target.closest("[data-infinitive]");

  if (!button) {
    return;
  }

  const profile = getProfile();
  const result = submitConjugationInfinitiveAnswer(profile, conjugationLessons, button.dataset.infinitive || "");

  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  resetConjugationRetryState();
  uiState.conjugationFeedbackMessage = result.isCorrect
    ? `${positiveMessages[(result.game.score - 1) % positiveMessages.length]} L'infinitif est ${result.expectedAnswer}.`
    : `Défi infinitif : la bonne réponse était ${result.expectedAnswer}.`;
  uiState.conjugationFeedbackStatus = result.isCorrect ? "success" : "error";
  saveAppData(appData);
  render();
}

// ============================================
// Fonctions pour le module Adjectifs
// ============================================

function handleAdjectiveDraftChange() {
  uiState.adjectiveDraft = adjDom.adjectiveInput ? adjDom.adjectiveInput.value : "";
}

function showAdjectiveHint() {
  const profile = getProfile();
  ensureAdjectiveState(profile);

  const hintMessage = getAdjectiveHint(profile, uiState.adjectiveAttemptCount);
  uiState.adjectiveHintMessage = hintMessage;
  uiState.adjectiveAttemptCount = Math.min(uiState.adjectiveAttemptCount + 1, 2);
  saveAppData(appData);
  render();
}

function handleAdjectiveAnswerVerification() {
  const profile = getProfile();
  ensureAdjectiveState(profile);

  const rawAnswer = uiState.adjectiveDraft.trim();

  if (!rawAnswer) {
    uiState.adjectiveFeedbackMessage = "Écris un adjectif avant de vérifier.";
    uiState.adjectiveFeedbackStatus = "error";
    render();
    return;
  }

  const result = verifyAdjectiveAnswer(profile, rawAnswer);

  if (result.isCorrect) {
    uiState.adjectiveDraft = "";
    uiState.adjectiveHintMessage = "";
    uiState.adjectiveAttemptCount = 0;
    uiState.adjectiveFeedbackMessage = result.message;
    uiState.adjectiveFeedbackStatus = "success";

    // Enregistrer la tentative
    recordAdjectiveAttempt(profile, true, result.exerciseId);
    syncAdjectiveRound(profile);

    // Avancer vers l'exercice suivant
    const nextExercise = advanceAdjectiveExercise(profile);
    if (nextExercise === null) {
      // Tous les exercices sont terminés
      uiState.adjectiveFeedbackMessage = "Félicitations ! Tu as terminé tous les exercices.";
    }

    saveAppData(appData);
    render();
    
    // Focus sur l'input pour le prochain exercice
    if (nextExercise !== null) {
      window.setTimeout(() => {
        const input = document.getElementById("adjectiveInput");
        if (input) input.focus();
      }, 100);
    }
    return;
  }

  // Réponse incorrecte
  uiState.adjectiveAttemptCount = Math.min(uiState.adjectiveAttemptCount + 1, 2);
  uiState.adjectiveHintMessage = getAdjectiveHint(profile, uiState.adjectiveAttemptCount);
  uiState.adjectiveFeedbackMessage = result.message;
  uiState.adjectiveFeedbackStatus = "error";

  // Enregistrer la tentative
  recordAdjectiveAttempt(profile, false, result.exerciseId);
  saveAppData(appData);
  render();
}

function launchAdjectiveCategoryReview() {
  const profile = getProfile();
  ensureAdjectiveState(profile);

  const selectedCategory = adjDom.adjectiveCategorySelect ? adjDom.adjectiveCategorySelect.value : "all";

  if (selectedCategory === "all") {
    const result = startAdjectiveReview(profile, "all");
    if (!result.started) {
      uiState.adjectiveFeedbackMessage = "Aucun exercice à réviser pour le moment.";
      uiState.adjectiveFeedbackStatus = "success";
      render();
      return;
    }
    uiState.adjectiveFeedbackMessage = `Révision complète lancé sur ${result.count} exercice(s).`;
    uiState.adjectiveFeedbackStatus = "success";
  } else {
    const result = startAdjectiveReview(profile, "category", selectedCategory);
    if (!result.started) {
      uiState.adjectiveFeedbackMessage = `Aucun exercice à réviser pour la catégorie ${selectedCategory} pour le moment.`;
      uiState.adjectiveFeedbackStatus = "success";
      render();
      return;
    }
    uiState.adjectiveFeedbackMessage = `Révision de la catégorie ${selectedCategory} lancé sur ${result.count} exercice(s).`;
    uiState.adjectiveFeedbackStatus = "success";
  }

  uiState.adjectiveDraft = "";
  uiState.adjectiveHintMessage = "";
  uiState.adjectiveAttemptCount = 0;
  saveAppData(appData);
  render();
}

function stopAdjectiveCategoryReview() {
  const profile = getProfile();
  ensureAdjectiveState(profile);

  stopAdjectiveReview(profile);
  uiState.adjectiveDraft = "";
  uiState.adjectiveHintMessage = "";
  uiState.adjectiveFeedbackMessage = "Retour au parcours adaptatif.";
  uiState.adjectiveFeedbackStatus = "success";
  uiState.adjectiveAttemptCount = 0;
  saveAppData(appData);
  render();
}

function handleAdjectiveKeydown(event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  handleAdjectiveAnswerVerification();
}

function verifyConjugationAnswer() {
  const profile = getProfile();
  ensureConjugationState(profile, conjugationLessons);

  if (getConjugationInfinitiveGame(profile, conjugationLessons).active) {
    uiState.conjugationFeedbackMessage = "Termine d'abord le défi infinitif.";
    uiState.conjugationFeedbackStatus = "error";
    render();
    return;
  }

  const rawAnswer = uiState.conjugationDraft.trim();

  if (!rawAnswer) {
    uiState.conjugationFeedbackMessage = "Écris une forme conjuguée avant de vérifier.";
    uiState.conjugationFeedbackStatus = "error";
    render();
    return;
  }

  const result = submitConjugationAnswer(profile, conjugationLessons, rawAnswer);
  const currentItemId = result.item?.id ?? "";

  if (result.isCorrect) {
    uiState.conjugationDraft = "";
    uiState.conjugationHintMessage = "";
    resetConjugationRetryState();
    uiState.conjugationFeedbackMessage = result.infinitiveGame?.started
      ? `Bravo. ${result.item?.pronounLabel} ${result.expectedAnswer}. Défi infinitif débloqué !`
      : result.item && result.masteryRemaining > 0
        ? `Bien joué. ${result.item.pronounLabel} ${result.expectedAnswer}. Encore ${result.masteryRemaining} réussite(s) pour ancrer ${result.item.tenseLabel === "futur simple" && ["être", "avoir", "aller", "faire"].includes(result.item.infinitive) ? "cette forme-clé du futur" : "ce verbe prioritaire"}.`
      : result.item
        ? `${positiveMessages[(result.progress.score - 1) % positiveMessages.length]} ${result.item.pronounLabel} ${result.expectedAnswer}.`
      : "Bravo, la leçon est terminée !";
    uiState.conjugationFeedbackStatus = "success";
  } else {
    uiState.conjugationRetryCount = uiState.conjugationRetryItemId === currentItemId ? uiState.conjugationRetryCount + 1 : 1;
    uiState.conjugationRetryItemId = currentItemId;
    uiState.conjugationHintMessage = getConjugationHint(profile, conjugationLessons);
    uiState.conjugationFeedbackMessage = uiState.conjugationRetryCount >= 2
      ? `Presque. La bonne forme attendue est ${result.expectedAnswer}. Retape-la une fois pour l'ancrer.`
      : "Presque. Lis l'indice, observe le repère visuel puis réessaie sans regarder la réponse.";
    uiState.conjugationFeedbackStatus = "error";
  }

  saveAppData(appData);
  render();
}

function handleConjugationKeydown(event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  verifyConjugationAnswer();
}

function verifyAnswer() {
  if (uiState.locked || uiState.finished) {
    return;
  }

  if (uiState.selectedIndices.length === 0) {
    uiState.feedbackMessage = "Sélectionne au moins un mot.";
    uiState.feedbackStatus = "error";
    render();
    return;
  }

  const profile = getProfile();
  const sentence = getCurrentSentence();
  const mission = getCurrentMission();

  if (!sentence || !mission) {
    return;
  }

  const expectedAnswer = mission.acceptedAnswers[0] ?? [];
  const analysis = getSelectionFeedback(uiState.selectedIndices, expectedAnswer);
  const isCorrect = analysis.isCorrect;
  const sentenceStats = recordAttempt(profile, sentence.id, mission.label, isCorrect, createSentenceStats);

  if (isCorrect) {
    uiState.locked = true;
    uiState.selectionState = "correct";
    uiState.wordHighlights = {
      matched: [...expectedAnswer],
      missing: [],
      extra: [],
    };
    profile.score += 1;
    profile.streak += 1;

    if (profile.currentMissionIndex < missionTemplates.length - 1) {
      profile.currentMissionIndex += 1;
      syncBadges(profile, missionTemplates);
      saveAppData(appData);
      uiState.feedbackMessage = `${positiveMessages[(profile.score - 1) % positiveMessages.length]} La bonne réponse est trouvée.`;
      uiState.feedbackStatus = "success";
      render();
      window.setTimeout(() => {
        uiState.locked = false;
        uiState.selectedIndices = [];
        uiState.selectionState = "";
        uiState.wordHighlights = {
          matched: [],
          missing: [],
          extra: [],
        };
        uiState.hintMessage = "";
        uiState.feedbackMessage = "";
        uiState.feedbackStatus = "";
        render();
      }, 650);
      return;
    }

    if (!profile.completedSentenceIds.includes(sentence.id)) {
      profile.completedSentenceIds = [...profile.completedSentenceIds, sentence.id].sort((first, second) => first - second);
    }

    updateSentenceSchedule(profile, sentence.id, createSentenceStats);
    syncBadges(profile, missionTemplates);
    saveAppData(appData);
    uiState.feedbackMessage = `${positiveMessages[(profile.score - 1) % positiveMessages.length]} Phrase terminée.`;
    uiState.feedbackStatus = "success";
    render();
    window.setTimeout(() => {
      advanceAfterSentenceCompletion(sentence.id);
    }, 750);
    return;
  }

  profile.streak = 0;
  uiState.selectionState = "wrong";
  uiState.wordHighlights = {
    matched: analysis.matched,
    missing: analysis.missing,
    extra: analysis.extra,
  };
  uiState.feedbackMessage = `${buildGrammarErrorMessage(mission, analysis)} ${getEnhancedHint(
    mission,
    sentenceStats.missionStats[mission.label].wrong,
    getAdaptiveProfile(profile, missionTemplates),
  )}`;
  uiState.feedbackStatus = "error";
  saveAppData(appData);
  render();
}

function restartProfileProgress() {
  const shouldReset = window.confirm(
    "Effacer la progression, les statistiques, les badges et la planification de révision pour ce profil ?",
  );

  if (!shouldReset) {
    return;
  }

  resetAppData(appData, missionTemplates);
  const profile = getProfile();
  syncProfileToNormalMode(profile, false);
  syncActiveModule(profile);
  resetUiState();
  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  uiState.conjugationFeedbackMessage = "";
  uiState.conjugationFeedbackStatus = "";
  resetConjugationRetryState();
  uiState.feedbackMessage = "Profil remis à zéro.";
  uiState.feedbackStatus = "success";
  saveAppData(appData);
  render();
}

function toggleReviewAll() {
  if (getProfile().reviewMode === "all") {
    exitReviewMode();
    return;
  }

  startReviewSession("all");
}

function launchTargetedReview() {
  const selectedValue = dom.reviewFocusSelect.value;

  if (selectedValue === "weakest") {
    startReviewSession("weakness");
    return;
  }

  startReviewSession("mission", selectedValue);
}

function addNewProfile() {
  const profileName = window.prompt("Nom du nouveau profil", "");

  if (profileName === null) {
    return;
  }

  addProfile(appData, missionTemplates, profileName);
  const profile = getProfile();
  syncProfileToNormalMode(profile, false);
  resetUiState();
  ensureConjugationState(profile, conjugationLessons);
  syncActiveModule(profile);
  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  uiState.conjugationFeedbackMessage = "";
  uiState.conjugationFeedbackStatus = "";
  resetConjugationRetryState();
  uiState.feedbackMessage = `Profil ${profile.name} créé.`;
  uiState.feedbackStatus = "success";
  saveAppData(appData);
  render();
}

function handleProfileChange() {
  switchProfile(appData, dom.profileSelect.value);
  const profile = getProfile();
  syncProfileToNormalMode(profile);
  resetUiState();
  ensureConjugationState(profile, conjugationLessons);
  syncActiveModule(profile);
  uiState.conjugationDraft = "";
  uiState.conjugationHintMessage = "";
  uiState.conjugationFeedbackMessage = "";
  uiState.conjugationFeedbackStatus = "";
  resetConjugationRetryState();
  uiState.feedbackMessage = "Profil changé.";
  uiState.feedbackStatus = "success";
  saveAppData(appData);
  render();
}

function initialize() {
  populateReviewFocusSelect(dom, missionTemplates);
  populateAdjectiveCategorySelect(adjDom, missionTemplates);
  const profile = getProfile();
  syncProfileToNormalMode(profile);
  ensureConjugationState(profile, conjugationLessons);
  ensureAdjectiveState(profile);
  syncActiveModule(profile);
  syncBadges(profile, missionTemplates);
  saveAppData(appData);
  render();
}

dom.checkButton.addEventListener("click", verifyAnswer);
dom.clearButton.addEventListener("click", clearSelection);
dom.hintButton.addEventListener("click", showHint);
dom.conjugationInput.addEventListener("input", handleConjugationDraftChange);
dom.conjugationInput.addEventListener("keydown", handleConjugationKeydown);
dom.conjugationLessonSelect.addEventListener("change", handleConjugationLessonChange);
dom.conjugationReviewButton.addEventListener("click", startFocusedConjugationReview);
dom.conjugationNormalButton.addEventListener("click", stopFocusedConjugationReview);
dom.conjugationCheckButton.addEventListener("click", verifyConjugationAnswer);
dom.conjugationHintButton.addEventListener("click", showConjugationHint);
dom.conjugationMiniGameOptions.addEventListener("click", handleConjugationMiniGameClick);
dom.restartButton.addEventListener("click", restartProfileProgress);
dom.reviewButton.addEventListener("click", toggleReviewAll);
dom.normalModeButton.addEventListener("click", () => exitReviewMode());
dom.targetReviewButton.addEventListener("click", launchTargetedReview);
dom.addProfileButton.addEventListener("click", addNewProfile);
dom.profileSelect.addEventListener("change", handleProfileChange);

// Écouteurs pour le module adjectifs
if (adjDom.adjectiveCheckButton) {
  adjDom.adjectiveCheckButton.addEventListener("click", handleAdjectiveAnswerVerification);
}
if (adjDom.adjectiveHintButton) {
  adjDom.adjectiveHintButton.addEventListener("click", showAdjectiveHint);
}
if (adjDom.adjectiveReviewButton) {
  adjDom.adjectiveReviewButton.addEventListener("click", launchAdjectiveCategoryReview);
}
if (adjDom.adjectiveNormalButton) {
  adjDom.adjectiveNormalButton.addEventListener("click", stopAdjectiveCategoryReview);
}
if (adjDom.adjectiveCategorySelect) {
  adjDom.adjectiveCategorySelect.addEventListener("change", () => {
    // Le bouton de révision est séparé, pas besoin de faire quoi que ce soit ici
  });
}

// Écouteur pour l'input adjective (géré par délégation car l'input est recréé à chaque rendu)
document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "adjectiveInput") {
    handleAdjectiveDraftChange();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target && event.target.id === "adjectiveInput") {
    handleAdjectiveKeydown(event);
  }
});

initialize();
