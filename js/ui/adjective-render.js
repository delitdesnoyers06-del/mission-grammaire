/**
 * Atelier Adjectifs - Rendu de l'interface
 * Gestion de l'affichage du module Atelier Adjectifs
 */

import {
  adjectiveCategories,
  adjectiveDifficultyLevels,
  getAdjectiveExerciseById,
} from "../data/adjective-content.js";
import { getAdjectiveProgress, getAdjectiveStatsByCategory } from "../features/adjective.js";

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Obtenir les éléments DOM spécifiques au module adjectifs
 */
export function getAdjectiveDomElements() {
  return {
    adjectivePanel: document.getElementById("adjectivePanel"),
    adjectiveSentence: document.getElementById("adjectiveSentence"),
    adjectiveInput: document.getElementById("adjectiveInput"),
    adjectiveCheckButton: document.getElementById("adjectiveCheckButton"),
    adjectiveHintButton: document.getElementById("adjectiveHintButton"),
    adjectiveHintText: document.getElementById("adjectiveHintText"),
    adjectiveFeedback: document.getElementById("adjectiveFeedback"),
    adjectiveProgressText: document.getElementById("adjectiveProgressText"),
    adjectiveProgressBar: document.getElementById("adjectiveProgressBar"),
    adjectiveScore: document.getElementById("adjectiveScore"),
    adjectiveStreak: document.getElementById("adjectiveStreak"),
    adjectiveAccuracy: document.getElementById("adjectiveAccuracy"),
    adjectiveLevel: document.getElementById("adjectiveLevel"),
    adjectiveReviewButton: document.getElementById("adjectiveReviewButton"),
    adjectiveNormalButton: document.getElementById("adjectiveNormalButton"),
    adjectiveWeaknessSummary: document.getElementById("adjectiveWeaknessSummary"),
    adjectiveCategorySelect: document.getElementById("adjectiveCategorySelect"),
    adjectiveBreakdown: document.getElementById("adjectiveBreakdown"),
    adjectiveSessionMode: document.getElementById("adjectiveSessionMode"),
  };
}

/**
 * Rendre l'exercice courant
 */
export function renderAdjectiveExercise(dom, exercise, profile, draftValue = "", hintMessage = "") {
  if (!dom.adjectiveSentence || !exercise) {
    return;
  }

  // Afficher la phrase avec le trou
  const sentenceParts = exercise.sentence.split("___");
  const sentenceHtml = [
    sentenceParts[0],
    '<input type="text" id="adjectiveInput" class="adjective-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Écris l\'adjectif" />',
    sentenceParts[1],
  ].join("");

  dom.adjectiveSentence.innerHTML = sentenceHtml;

  // Remplir la valeur du draft
  const inputElement = document.getElementById("adjectiveInput");
  if (inputElement) {
    inputElement.value = draftValue;
    inputElement.focus();
  }

  // Afficher l'indice
  if (dom.adjectiveHintText) {
    dom.adjectiveHintText.textContent = hintMessage;
  }

  // Réinitialiser le feedback
  if (dom.adjectiveFeedback) {
    dom.adjectiveFeedback.textContent = "";
    dom.adjectiveFeedback.className = "feedback";
  }
}

/**
 * Rendre la progression
 */
export function renderAdjectiveProgress(dom, profile) {
  if (!dom.adjectiveProgressText || !profile?.adjective) {
    return;
  }

  const progress = getAdjectiveProgress(profile);

  // Mettre à jour le texte de progression
  dom.adjectiveProgressText.textContent = `${progress.completed} / ${progress.total}`;

  // Mettre à jour la barre de progression
  if (dom.adjectiveProgressBar) {
    dom.adjectiveProgressBar.style.width = `${progress.percentage}%`;
  }

  // Mettre à jour le score et la série
  if (dom.adjectiveScore) {
    dom.adjectiveScore.textContent = String(profile.adjective.score);
  }

  if (dom.adjectiveStreak) {
    dom.adjectiveStreak.textContent = String(profile.adjective.streak);
  }

  if (dom.adjectiveAccuracy) {
    const accuracy = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
    dom.adjectiveAccuracy.textContent = `${accuracy} %`;
  }

  // Mettre à jour le niveau
  if (dom.adjectiveLevel) {
    const difficulty = Math.min(5, Math.ceil(progress.percentage / 20));
    dom.adjectiveLevel.textContent = `${difficulty} · ${adjectiveDifficultyLevels[difficulty] || "découverte"}`;
  }

  // Mettre à jour le mode de session
  if (dom.adjectiveSessionMode) {
    if (profile.adjective.reviewMode === "all") {
      dom.adjectiveSessionMode.textContent = "Mode actuel : révision complète";
    } else if (profile.adjective.reviewMode === "weakness") {
      dom.adjectiveSessionMode.textContent = "Mode actuel : révision des lacunes";
    } else if (profile.adjective.reviewMode === "category") {
      dom.adjectiveSessionMode.textContent = "Mode actuel : révision par catégorie";
    } else {
      dom.adjectiveSessionMode.textContent = "Mode actuel : parcours adaptatif";
    }
  }
}

/**
 * Rendre le feedback
 */
export function setAdjectiveFeedback(dom, message, status = "") {
  if (!dom.adjectiveFeedback) {
    return;
  }

  dom.adjectiveFeedback.textContent = message;
  dom.adjectiveFeedback.className = `feedback ${status}`.trim();
}

/**
 * Rendre les statistiques par catégorie
 */
export function renderAdjectiveBreakdown(dom, profile) {
  if (!dom.adjectiveBreakdown || !profile?.adjective) {
    return;
  }

  dom.adjectiveBreakdown.innerHTML = "";

  const statsByCategory = getAdjectiveStatsByCategory(profile);

  adjectiveCategories.forEach((category) => {
    const stats = statsByCategory[category] || { correct: 0, wrong: 0, total: 0, completed: 0 };
    const total = stats.correct + stats.wrong;
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

    const item = document.createElement("div");
    item.className = "breakdown-item";

    const head = document.createElement("div");
    head.className = "breakdown-head";
    head.innerHTML = `<strong>${capitalize(category)}</strong><span>${accuracy} %</span>`;

    const bar = document.createElement("div");
    bar.className = "breakdown-bar";

    const fill = document.createElement("div");
    fill.className = "breakdown-fill";
    fill.style.width = `${accuracy}%`;

    const meta = document.createElement("p");
    meta.className = "breakdown-meta";
    meta.textContent = `${stats.completed}/${adjectiveExercises.filter(e => e.category === category).length} exercices · ${stats.correct} juste(s) · ${stats.wrong} erreur(s)`;

    bar.appendChild(fill);
    item.appendChild(head);
    item.appendChild(bar);
    item.appendChild(meta);
    dom.adjectiveBreakdown.appendChild(item);
  });
}

/**
 * Rendre le menu de sélection de catégorie
 */
export function populateAdjectiveCategorySelect(dom, missionTemplates) {
  if (!dom.adjectiveCategorySelect) {
    return;
  }

  dom.adjectiveCategorySelect.innerHTML = "";

  const options = [
    { value: "all", label: "Toutes les catégories" },
    ...adjectiveCategories.map((category) => ({ value: category, label: capitalize(category) })),
  ];

  options.forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    dom.adjectiveCategorySelect.appendChild(option);
  });
}

/**
 * Rendre le résumé des lacunes
 */
export function renderAdjectiveWeaknessSummary(dom, profile) {
  if (!dom.adjectiveWeaknessSummary || !profile?.adjective) {
    return;
  }

  const statsByCategory = getAdjectiveStatsByCategory(profile);

  // Trouver la catégorie avec le plus d'erreurs
  const categoriesWithErrors = Object.entries(statsByCategory)
    .map(([category, stats]) => ({ category, errorCount: stats.wrong }))
    .filter((item) => item.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount);

  if (categoriesWithErrors.length === 0) {
    dom.adjectiveWeaknessSummary.textContent =
      "Aucune lacune détectée pour le moment dans l'Atelier Adjectifs.";
    return;
  }

  const weakestCategory = categoriesWithErrors[0].category;
  dom.adjectiveWeaknessSummary.textContent = `Priorité actuelle : ${capitalize(weakestCategory)}.`;
}

/**
 * Rendre tout le panel adjectifs
 */
export function renderAdjectiveSection({
  dom,
  profile,
  exercises,
  draftValue = "",
  hintMessage = "",
  feedbackMessage = "",
  feedbackStatus = "",
}) {
  if (!dom.adjectivePanel || !profile?.adjective) {
    return;
  }

  const currentExercise = getAdjectiveExerciseById(profile.adjective.currentExerciseId);

  // Rendre l'exercice
  renderAdjectiveExercise(dom, currentExercise, profile, draftValue, hintMessage);

  // Rendre la progression
  renderAdjectiveProgress(dom, profile);

  // Rendre les stats par catégorie
  renderAdjectiveBreakdown(dom, profile);

  // Rendre le résumé des lacunes
  renderAdjectiveWeaknessSummary(dom, profile);

  // Rendre le feedback
  setAdjectiveFeedback(dom, feedbackMessage, feedbackStatus);

  // Gérer l'état des boutons
  if (dom.adjectiveReviewButton && dom.adjectiveNormalButton) {
    dom.adjectiveReviewButton.disabled = profile.adjective.reviewMode !== "normal";
    dom.adjectiveNormalButton.disabled = profile.adjective.reviewMode === "normal";
  }
}

/**
 * Créer le panel HTML pour le module adjectifs (à ajouter dans index.html)
 * Cette fonction retourne le HTML à insérer
 */
export function getAdjectivePanelHTML() {
  return `
    <section id="adjectivePanel" class="module-panel" aria-label="Module Atelier adjectifs" hidden>
      <section class="card adjective-card">
        <div class="adjective-header">
          <div>
            <h2>Atelier adjectifs</h2>
            <p class="subtitle-small">Complète avec l'adjectif correctement accordé.</p>
          </div>
          <div class="adjective-stats compact-adjective-stats">
            <div>
              <span class="stat-label">Progression</span>
              <strong id="adjectiveProgressText">0 / 50</strong>
            </div>
            <div>
              <span class="stat-label">Score</span>
              <strong id="adjectiveScore">0</strong>
            </div>
            <div>
              <span class="stat-label">Série</span>
              <strong id="adjectiveStreak">0</strong>
            </div>
            <div>
              <span class="stat-label">Réussite</span>
              <strong id="adjectiveAccuracy">0 %</strong>
            </div>
            <div>
              <span class="stat-label">Niveau</span>
              <strong id="adjectiveLevel">1 · découverte</strong>
            </div>
          </div>
        </div>

        <div class="adjective-toolbar">
          <label class="review-label" for="adjectiveCategorySelect">Réviser par catégorie</label>
          <select id="adjectiveCategorySelect" aria-label="Choisir une catégorie"></select>
          <button id="adjectiveReviewButton" class="secondary-button compact-button" type="button">
            Réviser cette catégorie
          </button>
          <button id="adjectiveNormalButton" class="secondary-button compact-button" type="button">
            Retour au parcours
          </button>
          <p id="adjectiveSessionMode" class="session-mode">Les besoins de consolidation apparaîtront ici.</p>
        </div>

        <div class="progress-wrap" aria-label="Progression des exercices adjectifs">
          <div class="progress-bar" id="adjectiveProgressBar"></div>
        </div>

        <div class="adjective-exercise">
          <p id="adjectiveSentence" class="adjective-sentence"></p>
          <p id="adjectiveHintText" class="hint" aria-live="polite"></p>
        </div>

        <div class="adjective-actions">
          <button id="adjectiveCheckButton" class="primary-button" type="button">
            Vérifier
          </button>
          <button id="adjectiveHintButton" class="secondary-button" type="button">
            💡 Indice
          </button>
        </div>

        <p id="adjectiveFeedback" class="feedback" aria-live="polite"></p>

        <details class="help-disclosure inline-details">
          <summary>Voir les statistiques par catégorie</summary>
          <div id="adjectiveBreakdown" class="breakdown-list"></div>
        </details>
      </section>
    </section>
  `;
}

/**
 * Initialiser les éléments DOM pour le module adjectifs
 * Appelé une seule fois au démarrage
 */
export function initializeAdjectiveDom() {
  const adjectivePanel = document.getElementById("adjectivePanel");
  if (adjectivePanel) {
    return;
  }

  // Le panel n'existe pas encore, il faut l'ajouter à index.html
  // Cela sera fait dans l'intégration principale
}
