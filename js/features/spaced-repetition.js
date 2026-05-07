import { getSentenceStats, getSentenceMistakeCount } from "./stats.js";

export function getDueReviewSentences(profile, sentences) {
  return sentences
    .filter((sentence) => {
      const stats = profile.sentenceStats[String(sentence.id)];
      return stats && Number.isInteger(stats.nextReviewRound) && stats.nextReviewRound <= profile.currentRound;
    })
    .sort((first, second) => {
      const firstStats = profile.sentenceStats[String(first.id)];
      const secondStats = profile.sentenceStats[String(second.id)];
      return (firstStats.nextReviewRound ?? 0) - (secondStats.nextReviewRound ?? 0);
    });
}

export function updateSentenceSchedule(profile, sentenceId, createSentenceStats) {
  const sentenceStats = getSentenceStats(profile, sentenceId, createSentenceStats);
  const mistakeCount = getSentenceMistakeCount(profile, sentenceId);

  profile.currentRound += 1;

  if (sentenceStats.wrongInCurrentCycle > 0) {
    sentenceStats.mastery = Math.max(0, sentenceStats.mastery - 1);
    sentenceStats.nextReviewRound = profile.currentRound + (sentenceStats.mastery <= 1 ? 2 : 3);
  } else {
    sentenceStats.mastery = Math.min(4, sentenceStats.mastery + 1);

    if (mistakeCount > 0 && sentenceStats.mastery < 4) {
      const spacing = [2, 3, 4, 6, 8][sentenceStats.mastery] ?? 4;
      sentenceStats.nextReviewRound = profile.currentRound + spacing;
    } else {
      sentenceStats.nextReviewRound = null;
    }
  }

  sentenceStats.wrongInCurrentCycle = 0;
  sentenceStats.completed = true;
}
