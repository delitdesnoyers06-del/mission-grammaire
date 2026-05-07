import { getAccuracy, getWeaknessEntries } from "./stats.js";

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export function getAdaptiveProfile(profile, missionTemplates) {
  const accuracy = getAccuracy(profile);
  const weakest = getWeaknessEntries(profile, missionTemplates)[0];
  const highError = weakest && weakest.attempts >= 4 && weakest.accuracy < 55;

  if (accuracy < 55 || highError) {
    return {
      difficulty: 1,
      label: "douce",
      support: "guidage fort",
      hintBoostThreshold: 1,
    };
  }

  if (accuracy < 78 || profile.streak < 4) {
    return {
      difficulty: 2,
      label: "moyenne",
      support: "guidage normal",
      hintBoostThreshold: 2,
    };
  }

  return {
    difficulty: 3,
    label: "avancée",
    support: "guidage léger",
    hintBoostThreshold: 2,
  };
}

export function getEnhancedHint(mission, attemptCount, adaptiveProfile) {
  if (attemptCount >= adaptiveProfile.hintBoostThreshold) {
    return mission.strongHint || mission.hint;
  }

  return mission.hint;
}

export function sortSentencesForDifficulty(sentences, targetDifficulty) {
  return shuffleArray(sentences).sort((first, second) => {
    const firstGap = Math.abs(first.difficulty - targetDifficulty);
    const secondGap = Math.abs(second.difficulty - targetDifficulty);

    if (firstGap !== secondGap) {
      return firstGap - secondGap;
    }

    return 0;
  });
}
