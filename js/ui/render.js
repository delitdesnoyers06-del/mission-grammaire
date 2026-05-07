import {
  getAccuracy,
  getAverageAttemptsPerSuccess,
  getDailyHistory,
  getMissionBreakdown,
  getSentenceMistakeCount,
  getWeaknessEntries,
} from "../features/stats.js";
import { getBadgeDefinitions } from "../features/rewards.js";
import { getWeakestMission } from "../features/review.js";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getTokenRoleMetadata(taggedToken = {}) {
  const roles = Array.isArray(taggedToken.roles) ? taggedToken.roles : [];

  return {
    roles,
    isVerb: roles.includes("verbe"),
    isSubject: roles.includes("subject"),
    isNoun: roles.includes("nom"),
    isAdjective: roles.includes("adjectif"),
    isDeterminer: roles.includes("déterminant"),
  };
}

function buildRoleClassNames(taggedToken = {}) {
  const metadata = getTokenRoleMetadata(taggedToken);

  return [
    metadata.isVerb ? "role-verbe" : "",
    metadata.isSubject ? "role-sujet" : "",
    metadata.isNoun ? "role-nom" : "",
    metadata.isAdjective ? "role-adjectif" : "",
    metadata.isDeterminer ? "role-determinant" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildAccessibleLabel(taggedToken = {}) {
  const metadata = getTokenRoleMetadata(taggedToken);
  const roleLabels = [];

  if (metadata.isVerb) {
    roleLabels.push("verbe");
  }

  if (metadata.isSubject) {
    roleLabels.push("sujet");
  }

  if (metadata.isNoun) {
    roleLabels.push("nom");
  }

  if (metadata.isAdjective) {
    roleLabels.push("adjectif");
  }

  if (metadata.isDeterminer) {
    roleLabels.push("déterminant");
  }

  return roleLabels.length > 0 ? `${taggedToken.text}, ${roleLabels.join(", ")}` : taggedToken.text;
}

function createTaggedTokenNode(taggedToken = {}, { compact = false } = {}) {
  const tokenNode = document.createElement("span");
  const labelNode = document.createElement("span");

  tokenNode.className = `tagged-token ${buildRoleClassNames(taggedToken)} ${compact ? "compact" : ""}`.trim();
  labelNode.className = "tagged-token-label";
  labelNode.textContent = taggedToken.text ?? "";

  tokenNode.appendChild(labelNode);
  return tokenNode;
}

export function getDomElements() {
  return {
    moduleNav: document.getElementById("moduleNav"),
    activeModuleSummary: document.getElementById("activeModuleSummary"),
    grammarPanel: document.getElementById("grammarPanel"),
    conjugationPanel: document.getElementById("conjugationPanel"),
    sentenceCounter: document.getElementById("sentenceCounter"),
    remainingCounter: document.getElementById("remainingCounter"),
    missionCounter: document.getElementById("missionCounter"),
    scoreValue: document.getElementById("score"),
    streakValue: document.getElementById("streak"),
    accuracyValue: document.getElementById("accuracy"),
    averageAttemptsValue: document.getElementById("averageAttempts"),
    difficultyValue: document.getElementById("difficultyLevel"),
    supportValue: document.getElementById("supportLevel"),
    progressBar: document.getElementById("progressBar"),
    missionPrompt: document.getElementById("missionPrompt"),
    hintText: document.getElementById("hintText"),
    sessionMode: document.getElementById("sessionMode"),
    sentenceWords: document.getElementById("sentenceWords"),
    grammarLegend: document.getElementById("grammarLegend"),
    feedback: document.getElementById("feedback"),
    checkButton: document.getElementById("checkButton"),
    clearButton: document.getElementById("clearButton"),
    hintButton: document.getElementById("hintButton"),
    restartButton: document.getElementById("restartButton"),
    reviewButton: document.getElementById("reviewButton"),
    normalModeButton: document.getElementById("normalModeButton"),
    targetReviewButton: document.getElementById("targetReviewButton"),
    reviewFocusSelect: document.getElementById("reviewFocusSelect"),
    sentenceBank: document.getElementById("sentenceBank"),
    weaknessSummary: document.getElementById("weaknessSummary"),
    weaknessList: document.getElementById("weaknessList"),
    missionBreakdown: document.getElementById("missionBreakdown"),
    dailyStatsList: document.getElementById("dailyStatsList"),
    badgeList: document.getElementById("badgeList"),
    profileSelect: document.getElementById("profileSelect"),
    addProfileButton: document.getElementById("addProfileButton"),
    profileMeta: document.getElementById("profileMeta"),
    conjugationLessonMeta: document.getElementById("conjugationLessonMeta"),
    conjugationPattern: document.getElementById("conjugationPattern"),
    conjugationVisualTitle: document.getElementById("conjugationVisualTitle"),
    conjugationVisualSubtitle: document.getElementById("conjugationVisualSubtitle"),
    conjugationVisualParts: document.getElementById("conjugationVisualParts"),
    conjugationReferenceTitle: document.getElementById("conjugationReferenceTitle"),
    conjugationProgressText: document.getElementById("conjugationProgressText"),
    conjugationLevel: document.getElementById("conjugationLevel"),
    conjugationStreak: document.getElementById("conjugationStreak"),
    conjugationAccuracy: document.getElementById("conjugationAccuracy"),
    conjugationInfinitiveStats: document.getElementById("conjugationInfinitiveStats"),
    conjugationProgressBar: document.getElementById("conjugationProgressBar"),
    conjugationLessonSelect: document.getElementById("conjugationLessonSelect"),
    conjugationReviewButton: document.getElementById("conjugationReviewButton"),
    conjugationNormalButton: document.getElementById("conjugationNormalButton"),
    conjugationWeaknessSummary: document.getElementById("conjugationWeaknessSummary"),
    conjugationPrompt: document.getElementById("conjugationPrompt"),
    conjugationMiniGame: document.getElementById("conjugationMiniGame"),
    conjugationMiniGamePrompt: document.getElementById("conjugationMiniGamePrompt"),
    conjugationMiniGameOptions: document.getElementById("conjugationMiniGameOptions"),
    conjugationMiniGameMeta: document.getElementById("conjugationMiniGameMeta"),
    conjugationPronoun: document.getElementById("conjugationPronoun"),
    conjugationAnswerRow: document.getElementById("conjugationAnswerRow"),
    conjugationInput: document.getElementById("conjugationInput"),
    conjugationActions: document.getElementById("conjugationActions"),
    conjugationCheckButton: document.getElementById("conjugationCheckButton"),
    conjugationHintButton: document.getElementById("conjugationHintButton"),
    conjugationHintText: document.getElementById("conjugationHintText"),
    conjugationFeedback: document.getElementById("conjugationFeedback"),
    conjugationEndingsList: document.getElementById("conjugationEndingsList"),
    conjugationVerbList: document.getElementById("conjugationVerbList"),
    conjugationFocusList: document.getElementById("conjugationFocusList"),
  };
}

function renderGrammarLegend(dom, wordHighlights) {
  dom.grammarLegend.innerHTML = "";

  const items = [
    { key: "matched", label: "bien trouvé", className: "pedagogical-match" },
    { key: "missing", label: "à trouver", className: "pedagogical-missing" },
    { key: "extra", label: "en trop", className: "pedagogical-extra" },
  ].filter((entry) => (wordHighlights?.[entry.key] ?? []).length > 0);

  if (items.length === 0) {
    return;
  }

  items.forEach((entry) => {
    const item = document.createElement("span");
    const marker = document.createElement("span");
    const text = document.createElement("span");

    item.className = "grammar-legend-item";
    marker.className = `grammar-legend-marker ${entry.className}`;
    text.textContent = entry.label;

    item.appendChild(marker);
    item.appendChild(text);
    dom.grammarLegend.appendChild(item);
  });
}

export function renderModuleHub(dom, modules, activeModuleId, onModuleSelect) {
  dom.moduleNav.innerHTML = "";

  const activeModule = modules.find((module) => module.id === activeModuleId) ?? modules[0] ?? null;
  dom.activeModuleSummary.textContent = activeModule?.summary ?? "Choisis un module pour commencer.";

  modules.forEach((module) => {
    const button = document.createElement("button");
    const title = document.createElement("strong");
    const meta = document.createElement("span");

    button.type = "button";
    button.role = "tab";
    button.className = `module-card ${module.id === activeModuleId ? "active" : ""} ${module.isAvailable === false ? "disabled" : ""}`.trim();
    button.setAttribute("aria-selected", module.id === activeModuleId ? "true" : "false");
    button.setAttribute("aria-controls", module.panelId ?? "");
    button.disabled = module.isAvailable === false;

    title.className = "module-card-title";
    title.textContent = module.title;

    meta.className = "module-card-meta";
    meta.textContent = module.meta;

    button.appendChild(title);
    button.appendChild(meta);

    if (module.badge) {
      const badge = document.createElement("span");
      badge.className = "module-card-badge";
      badge.textContent = module.badge;
      button.appendChild(badge);
    }

    if (module.isAvailable !== false) {
      button.addEventListener("click", () => onModuleSelect(module.id));
    }

    dom.moduleNav.appendChild(button);
  });
}

export function populateReviewFocusSelect(dom, missionTemplates) {
  dom.reviewFocusSelect.innerHTML = "";

  const options = [
    { value: "weakest", label: "Mes plus grandes lacunes" },
    ...missionTemplates.map((mission) => ({ value: mission.label, label: capitalize(mission.label) })),
  ];

  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    dom.reviewFocusSelect.appendChild(option);
  });
}

export function renderProfiles(dom, appData) {
  const sortedProfiles = Object.values(appData.profiles).sort((first, second) => first.name.localeCompare(second.name, "fr"));
  dom.profileSelect.innerHTML = "";

  sortedProfiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    option.selected = profile.id === appData.activeProfileId;
    dom.profileSelect.appendChild(option);
  });

  dom.profileMeta.textContent = `${sortedProfiles.length} profil(s) enregistré(s) sur ce navigateur.`;
}

function renderWords(dom, sentence, selectedIndices, selectionState, wordHighlights, onWordToggle) {
  dom.sentenceWords.innerHTML = "";

  if (!sentence) {
    return;
  }

  const matchedSet = new Set(wordHighlights?.matched ?? []);
  const missingSet = new Set(wordHighlights?.missing ?? []);
  const extraSet = new Set(wordHighlights?.extra ?? []);

  sentence.taggedTokens.forEach((taggedToken, index) => {
    const button = document.createElement("button");
    const tokenNode = createTaggedTokenNode(taggedToken);
    button.type = "button";
    const isSelected = selectedIndices.includes(index);
    const chipState = isSelected ? selectionState : "";
    const pedagogicalState = matchedSet.has(index)
      ? "pedagogical-match"
      : missingSet.has(index)
        ? "pedagogical-missing"
        : extraSet.has(index)
          ? "pedagogical-extra"
          : "";

    button.className = `word-chip ${buildRoleClassNames(taggedToken)} ${isSelected ? "selected" : ""} ${chipState} ${pedagogicalState}`.trim();

    const pedagogicalLabel = matchedSet.has(index)
      ? "bien trouvé"
      : missingSet.has(index)
        ? "mot à trouver"
        : extraSet.has(index)
          ? "mot en trop"
          : "";

    button.setAttribute(
      "aria-label",
      [buildAccessibleLabel(taggedToken), pedagogicalLabel].filter(Boolean).join(", "),
    );
    button.appendChild(tokenNode);
    button.addEventListener("click", () => onWordToggle(index));
    dom.sentenceWords.appendChild(button);
  });
}

function renderSentenceBank(dom, sentences, profile, currentSentenceId) {
  dom.sentenceBank.innerHTML = "";

  sentences.forEach((sentence) => {
    const item = document.createElement("li");
    const sentenceText = document.createElement("span");
    const badgeWrap = document.createElement("div");
    const sentenceStats = profile.sentenceStats[String(sentence.id)];
    const isCompleted = profile.completedSentenceIds.includes(sentence.id);
    const mistakeCount = getSentenceMistakeCount(profile, sentence.id);
    const isDueReview = Boolean(sentenceStats && Number.isInteger(sentenceStats.nextReviewRound) && sentenceStats.nextReviewRound <= profile.currentRound);

    item.className = "sentence-bank-item";
    sentenceText.className = "sentence-bank-text";
    sentence.taggedTokens.forEach((taggedToken, index) => {
      sentenceText.appendChild(createTaggedTokenNode(taggedToken, { compact: true }));

      if (index < sentence.taggedTokens.length - 1) {
        sentenceText.appendChild(document.createTextNode(" "));
      }
    });
    sentenceText.appendChild(document.createTextNode("."));
    badgeWrap.className = "sentence-bank-badges";

    if (sentence.id === currentSentenceId) {
      const badge = document.createElement("span");
      badge.className = "sentence-badge current";
      badge.textContent = "en cours";
      badgeWrap.appendChild(badge);
    }

    const statusBadge = document.createElement("span");
    statusBadge.className = `sentence-badge ${isCompleted ? "completed" : ""}`.trim();
    statusBadge.textContent = isCompleted ? "faite" : "à découvrir";
    badgeWrap.appendChild(statusBadge);

    const difficultyBadge = document.createElement("span");
    difficultyBadge.className = "sentence-badge";
    difficultyBadge.textContent = `niveau ${sentence.difficulty}`;
    badgeWrap.appendChild(difficultyBadge);

    if (mistakeCount > 0) {
      const badge = document.createElement("span");
      badge.className = "sentence-badge review";
      badge.textContent = `${mistakeCount} erreur(s)`;
      badgeWrap.appendChild(badge);
    }

    if (isDueReview) {
      const badge = document.createElement("span");
      badge.className = "sentence-badge review";
      badge.textContent = "révision due";
      badgeWrap.appendChild(badge);
    }

    item.appendChild(sentenceText);
    item.appendChild(badgeWrap);
    dom.sentenceBank.appendChild(item);
  });
}

function renderWeaknesses(dom, profile, sentences, missionTemplates) {
  const weaknessEntries = getWeaknessEntries(profile, missionTemplates);
  dom.weaknessList.innerHTML = "";

  if (weaknessEntries.length === 0) {
    dom.weaknessSummary.textContent =
      "Les statistiques apparaîtront ici automatiquement pour repérer les points à retravailler.";

    const item = document.createElement("li");
    item.textContent = "Aucune lacune détectée pour le moment.";
    dom.weaknessList.appendChild(item);
    return;
  }

  const weakestMission = getWeakestMission(profile, missionTemplates);
  dom.weaknessSummary.textContent = `Priorité actuelle : ${capitalize(weakestMission)}.`;

  weaknessEntries.slice(0, 3).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${capitalize(entry.label)} : ${entry.wrong} erreur(s), ${entry.accuracy} % de réussite.`;
    dom.weaknessList.appendChild(item);
  });

  sentences
    .map((sentence) => ({ sentence, mistakes: getSentenceMistakeCount(profile, sentence.id) }))
    .filter((entry) => entry.mistakes > 0)
    .sort((first, second) => second.mistakes - first.mistakes)
    .slice(0, 2)
    .forEach(({ sentence, mistakes }) => {
      const item = document.createElement("li");
      item.textContent = `Phrase à revoir : ${sentence.text} (${mistakes} erreur(s)).`;
      dom.weaknessList.appendChild(item);
    });
}

function renderMissionBreakdown(dom, profile, missionTemplates) {
  dom.missionBreakdown.innerHTML = "";

  getMissionBreakdown(profile, missionTemplates).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "breakdown-item";

    const head = document.createElement("div");
    head.className = "breakdown-head";
    head.innerHTML = `<strong>${capitalize(entry.label)}</strong><span>${entry.accuracy} %</span>`;

    const bar = document.createElement("div");
    bar.className = "breakdown-bar";

    const fill = document.createElement("div");
    fill.className = "breakdown-fill";
    fill.style.width = `${entry.accuracy}%`;

    const meta = document.createElement("p");
    meta.className = "breakdown-meta";
    meta.textContent = `${entry.correct} juste(s) · ${entry.wrong} erreur(s)`;

    bar.appendChild(fill);
    item.appendChild(head);
    item.appendChild(bar);
    item.appendChild(meta);
    dom.missionBreakdown.appendChild(item);
  });
}

function renderDailyStats(dom, profile) {
  dom.dailyStatsList.innerHTML = "";

  const history = getDailyHistory(profile, 7);

  if (history.length === 0) {
    const item = document.createElement("li");
    item.textContent = "L'historique quotidien apparaîtra après les premières réponses.";
    dom.dailyStatsList.appendChild(item);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "daily-item";
    item.innerHTML = `<strong>${entry.day}</strong><span>${entry.correct} juste(s), ${entry.wrong} erreur(s), ${entry.accuracy} %</span>`;
    dom.dailyStatsList.appendChild(item);
  });
}

function renderBadges(dom, profile) {
  const definitions = getBadgeDefinitions();
  const unlockedIds = new Set(profile.badges.map((badge) => badge.id));

  dom.badgeList.innerHTML = "";

  definitions.forEach((badge) => {
    const item = document.createElement("li");
    item.className = `badge-item ${unlockedIds.has(badge.id) ? "unlocked" : "locked"}`;
    item.innerHTML = `<strong>${badge.label}</strong><span>${badge.description}</span>`;
    dom.badgeList.appendChild(item);
  });
}

export function renderApp({
  dom,
  appData,
  profile,
  sentences,
  missionTemplates,
  currentSentence,
  currentMission,
  selectedIndices,
  selectionState,
  wordHighlights,
  adaptiveProfile,
  onWordToggle,
  isFinished,
}) {
  const completedSentences = profile.completedSentenceIds.length;
  const remainingSentences = Math.max(sentences.length - completedSentences, 0);
  const totalMissionCount = sentences.length * missionTemplates.length;
  const completedMissionCount = Math.min(profile.score, totalMissionCount);

  dom.sentenceCounter.textContent = `${completedSentences} / ${sentences.length}`;
  dom.remainingCounter.textContent = String(remainingSentences);
  dom.missionCounter.textContent = `${completedMissionCount} / ${totalMissionCount}`;
  dom.scoreValue.textContent = String(profile.score);
  dom.streakValue.textContent = String(profile.streak);
  dom.accuracyValue.textContent = `${getAccuracy(profile)} %`;
  dom.averageAttemptsValue.textContent = `${getAverageAttemptsPerSuccess(profile) || 0}`;
  dom.difficultyValue.textContent = adaptiveProfile.label;
  dom.supportValue.textContent = adaptiveProfile.support;
  dom.progressBar.style.width = `${(completedMissionCount / totalMissionCount) * 100}%`;

  if (profile.reviewMode === "mission") {
    dom.sessionMode.textContent = `Mode actuel : révision ciblée ${capitalize(profile.reviewMission)}`;
  } else if (profile.reviewMode === "weakness") {
    dom.sessionMode.textContent = "Mode actuel : révision des plus grandes lacunes";
  } else if (profile.reviewMode === "all") {
    dom.sessionMode.textContent = "Mode actuel : révision de toutes les phrases";
  } else {
    dom.sessionMode.textContent = "Mode actuel : parcours adaptatif";
  }

  dom.missionPrompt.textContent = currentMission ? currentMission.prompt : "Bravo, la session est terminée !";
  dom.reviewButton.textContent = profile.reviewMode === "all" ? "Quitter la révision complète" : "Réviser toutes les phrases";
  dom.normalModeButton.disabled = profile.reviewMode === "normal";

  renderWords(dom, currentSentence, selectedIndices, selectionState, wordHighlights, onWordToggle);
  renderGrammarLegend(dom, wordHighlights);
  renderSentenceBank(dom, sentences, profile, currentSentence?.id ?? -1);
  renderWeaknesses(dom, profile, sentences, missionTemplates);
  renderMissionBreakdown(dom, profile, missionTemplates);
  renderDailyStats(dom, profile);
  renderBadges(dom, profile);

  if (isFinished) {
    dom.hintText.textContent = "Les données sont enregistrées automatiquement dans ce navigateur.";
    dom.checkButton.disabled = true;
    dom.clearButton.disabled = true;
    dom.hintButton.disabled = true;
  } else {
    dom.checkButton.disabled = false;
    dom.clearButton.disabled = false;
    dom.hintButton.disabled = false;
  }
}

export function setFeedback(dom, message, status = "") {
  dom.feedback.textContent = message;
  dom.feedback.className = `feedback ${status}`.trim();
}
