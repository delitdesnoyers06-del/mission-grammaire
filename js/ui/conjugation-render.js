import {
  getActiveConjugationLesson,
  getConjugationConsolidation,
  getConjugationDifficultyStatus,
  getConjugationInfinitiveGame,
  getConjugationLessonOptions,
  getConjugationProgress,
  getConjugationReference,
  getConjugationSessionStatus,
  getCurrentConjugationItem,
} from "../features/conjugation.js";

function setConjugationFeedback(dom, message, status = "") {
  dom.conjugationFeedback.textContent = message;
  dom.conjugationFeedback.className = `feedback ${status}`.trim();
}

function getTenseTheme(tenseLabel = "") {
  if (tenseLabel === "futur simple") {
    return "futur";
  }

  if (tenseLabel === "imparfait") {
    return "imparfait";
  }

  if (tenseLabel === "passé composé") {
    return "passe-compose";
  }

  return "present";
}

function buildVisualGuide(item) {
  if (!item) {
    return {
      title: "Repère visuel",
      subtitle: "La forme active apparaîtra ici.",
      parts: [],
    };
  }

  if (item.tenseLabel === "passé composé") {
    const [auxiliary = item.answer, ...rest] = item.answer.split(" ");
    const participle = rest.join(" ");

    return {
      title: `Repère visuel · ${item.tenseLabel}`,
      subtitle: "Forme composée : auxiliaire + participe passé.",
      parts: [
        { label: "auxiliaire", text: auxiliary, className: "auxiliary" },
        { label: "participe passé", text: participle || item.answer, className: "participle" },
      ],
    };
  }

  const ending = typeof item.ending === "string" ? item.ending.replace(/^-/, "") : "";

  if (!ending || item.ending === "à mémoriser" || !item.answer.endsWith(ending) || item.answer.length <= ending.length) {
    return {
      title: `Repère visuel · ${item.tenseLabel}`,
      subtitle: "Forme à mémoriser en entier.",
      parts: [{ label: "forme", text: item.answer, className: "whole" }],
    };
  }

  return {
    title: `Repère visuel · ${item.tenseLabel}`,
    subtitle: "Observe la forme en deux morceaux : radical + terminaison.",
    parts: [
      { label: "radical", text: item.answer.slice(0, -ending.length), className: "radical" },
      { label: "terminaison", text: ending, className: "ending" },
    ],
  };
}

export function renderConjugationSection({
  dom,
  profile,
  lessons,
  draftValue,
  hintMessage,
  feedbackMessage,
  feedbackStatus,
}) {
  const consolidation = getConjugationConsolidation(profile, lessons);
  const currentItem = getCurrentConjugationItem(profile, lessons);
  const lesson = currentItem
    ? lessons.find((entry) => entry.id === currentItem.lessonId) ?? getActiveConjugationLesson(profile, lessons)
    : getActiveConjugationLesson(profile, lessons);
  const progress = getConjugationProgress(profile, lessons);
  const sessionStatus = getConjugationSessionStatus(profile, lessons);
  const difficultyStatus = getConjugationDifficultyStatus(profile, lessons);
  const infinitiveGame = getConjugationInfinitiveGame(profile, lessons);
  const visualGuide = buildVisualGuide(currentItem);

  dom.conjugationPanel.dataset.tenseTheme = getTenseTheme(lesson?.tenseLabel);

  dom.conjugationLessonMeta.textContent = lesson
    ? `${lesson.title} · ${lesson.description} ${difficultyStatus.description}`
    : "Aucune leçon disponible.";
  dom.conjugationPattern.textContent = lesson?.patternReminder ?? "";
  dom.conjugationVisualTitle.textContent = visualGuide.title;
  dom.conjugationVisualSubtitle.textContent = visualGuide.subtitle;
  dom.conjugationReferenceTitle.textContent = lesson ? `Repères du ${lesson.tenseLabel}` : "Repères de conjugaison";
  dom.conjugationProgressText.textContent = `${progress.completedCount} / ${progress.totalCount}`;
  dom.conjugationLevel.textContent = difficultyStatus.label;
  dom.conjugationLevel.setAttribute("aria-label", `Niveau actuel ${difficultyStatus.label}`);
  dom.conjugationStreak.textContent = String(progress.streak);
  dom.conjugationAccuracy.textContent = `${progress.accuracy} %`;
  dom.conjugationInfinitiveStats.textContent = `${infinitiveGame.score} / ${infinitiveGame.attempts}`;
  dom.conjugationProgressBar.style.width = progress.totalCount > 0 ? `${(progress.completedCount / progress.totalCount) * 100}%` : "0%";
  dom.conjugationWeaknessSummary.textContent = infinitiveGame.active
    ? "Défi infinitif en cours."
    : sessionStatus.mode === "focus"
      ? sessionStatus.label
      : `${progress.dueCount > 0 ? `${progress.dueCount} forme(s) à revoir maintenant. ` : ""}${consolidation.summary} Défi infinitif dans ${infinitiveGame.nextIn} bonne(s) réponse(s).`;
  dom.conjugationReviewButton.disabled = !sessionStatus.canStartReview || sessionStatus.mode === "focus";
  dom.conjugationNormalButton.disabled = sessionStatus.mode !== "focus";
  dom.conjugationLessonSelect.disabled = sessionStatus.mode === "focus" || infinitiveGame.active;

  dom.conjugationVisualParts.innerHTML = "";
  visualGuide.parts.forEach((part) => {
    const item = document.createElement("div");
    const label = document.createElement("span");
    const text = document.createElement("strong");

    item.className = `conjugation-visual-part conjugation-visual-part--${part.className}`;
    label.className = "conjugation-visual-label";
    label.textContent = part.label;
    text.className = "conjugation-visual-text";
    text.textContent = part.text;

    item.appendChild(label);
    item.appendChild(text);
    dom.conjugationVisualParts.appendChild(item);
  });

  if (visualGuide.parts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "conjugation-visual-empty";
    empty.textContent = "Choisis une leçon ou continue le parcours pour afficher la structure d'une forme.";
    dom.conjugationVisualParts.appendChild(empty);
  }

  dom.conjugationLessonSelect.innerHTML = "";
  getConjugationLessonOptions(profile, lessons).forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.completed ? "✓ " : ""}${entry.title}${entry.unlocked ? "" : " · bientôt"}`;
    option.selected = entry.selected;
    option.disabled = !entry.unlocked;
    dom.conjugationLessonSelect.appendChild(option);
  });

  dom.conjugationVerbList.innerHTML = "";
  (lesson?.verbs ?? []).forEach((verb) => {
    const item = document.createElement("li");
    item.textContent = verb.infinitive;
    dom.conjugationVerbList.appendChild(item);
  });

  dom.conjugationEndingsList.innerHTML = "";
  getConjugationReference(lesson).forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${entry.label}</strong><span>${entry.ending}</span>`;
    dom.conjugationEndingsList.appendChild(item);
  });

  dom.conjugationFocusList.innerHTML = "";
  [...consolidation.lessonsNeedingWork, ...consolidation.verbsNeedingWork].slice(0, 5).forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${entry.label}</strong><span>${entry.wrong} erreur(s) · ${entry.accuracy} %</span>`;
    dom.conjugationFocusList.appendChild(item);
  });

  if (dom.conjugationFocusList.children.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Aucun point faible détecté pour le moment.";
    dom.conjugationFocusList.appendChild(item);
  }

  dom.conjugationMiniGameOptions.innerHTML = "";
  dom.conjugationMiniGame.hidden = !infinitiveGame.active;
  dom.conjugationAnswerRow.hidden = infinitiveGame.active;
  dom.conjugationActions.hidden = infinitiveGame.active;

  if (infinitiveGame.active && infinitiveGame.challenge) {
    dom.conjugationPrompt.textContent = `Défi infinitif · Quel est le verbe de ${infinitiveGame.challenge.pronounLabel} ${infinitiveGame.challenge.form} ?`;
    dom.conjugationMiniGamePrompt.textContent = `Choisis l'infinitif correspondant (${infinitiveGame.challenge.tenseLabel}).`;
    dom.conjugationMiniGameMeta.textContent = "Relie une forme conjuguée à son verbe modèle.";
    dom.conjugationInput.disabled = true;
    dom.conjugationCheckButton.disabled = true;
    dom.conjugationHintButton.disabled = false;
    dom.conjugationHintText.textContent = hintMessage || "Indice : pense au verbe entier, pas seulement à sa terminaison.";

    infinitiveGame.challenge.options.forEach((optionValue) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary-button mini-game-option";
      button.dataset.infinitive = optionValue;
      button.textContent = optionValue;
      dom.conjugationMiniGameOptions.appendChild(button);
    });

    setConjugationFeedback(dom, feedbackMessage, feedbackStatus);
    return;
  }

  if (!currentItem) {
    dom.conjugationPrompt.textContent = lesson
      ? `Bravo, tu as terminé ${lesson.title} !`
      : "Bravo, tu as terminé cette leçon de conjugaison !";
    dom.conjugationMiniGamePrompt.textContent = "";
    dom.conjugationMiniGameMeta.textContent = "";
    dom.conjugationPronoun.textContent = "✓";
    dom.conjugationInput.value = "";
    dom.conjugationInput.placeholder = "Leçon terminée";
    dom.conjugationInput.disabled = true;
    dom.conjugationCheckButton.disabled = true;
    dom.conjugationHintButton.disabled = true;
    dom.conjugationHintText.textContent = "Passe bientôt à un autre temps ou à un autre groupe verbal.";
    setConjugationFeedback(dom, feedbackMessage || "Toutes les formes ont été trouvées.", feedbackStatus || "success");
    return;
  }

  dom.conjugationPrompt.textContent =
    sessionStatus.mode === "focus"
      ? `Révision ciblée · Conjugue ${currentItem.infinitive} au ${lesson?.tenseLabel}.`
      : `Niveau ${difficultyStatus.level} · Conjugue ${currentItem.infinitive} au ${lesson?.tenseLabel}.`;
  dom.conjugationMiniGamePrompt.textContent = "";
  dom.conjugationMiniGameMeta.textContent = currentItem.masteryTarget > 1
    ? `${lesson?.tenseLabel === "futur simple" && ["être", "avoir", "aller", "faire"].includes(currentItem.infinitive)
      ? "Forme-clé du futur"
      : "Forme prioritaire"} : ${currentItem.masteryTarget} réussites sont demandées pour ${currentItem.infinitive}.`
    : "";
  dom.conjugationPronoun.textContent = currentItem.pronounLabel;
  dom.conjugationPronoun.setAttribute("aria-label", `Pronom ${currentItem.pronounLabel}`);
  dom.conjugationInput.disabled = false;
  dom.conjugationInput.placeholder = `Écris la forme pour ${currentItem.pronounLabel}`;
  dom.conjugationInput.value = draftValue;
  dom.conjugationCheckButton.disabled = false;
  dom.conjugationHintButton.disabled = false;
  dom.conjugationHintText.textContent = hintMessage;
  setConjugationFeedback(dom, feedbackMessage, feedbackStatus);
}
