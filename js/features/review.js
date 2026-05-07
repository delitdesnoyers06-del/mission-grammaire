import { getSentenceMistakeCount, getWeaknessEntries } from "./stats.js";

export function getWeakestMission(profile, missionTemplates) {
  return getWeaknessEntries(profile, missionTemplates)[0]?.label ?? "";
}

export function setReviewMode(profile, mode, missionLabel = "") {
  profile.reviewMode = mode;
  profile.reviewMission = missionLabel;
  profile.currentMissionIndex = 0;
}

export function getTargetedReviewCandidates(profile, sentences, missionLabel = "") {
  return sentences
    .filter((sentence) => {
      const stats = profile.sentenceStats[String(sentence.id)];

      if (!stats) {
        return false;
      }

      if (!missionLabel) {
        return getSentenceMistakeCount(profile, sentence.id) > 0;
      }

      return (stats.missionStats[missionLabel]?.wrong ?? 0) > 0;
    })
    .sort((first, second) => getSentenceMistakeCount(profile, second.id) - getSentenceMistakeCount(profile, first.id));
}

export function getReviewCandidates(profile, sentences, missionTemplates) {
  if (profile.reviewMode === "all") {
    return [...sentences];
  }

  if (profile.reviewMode === "mission") {
    return getTargetedReviewCandidates(profile, sentences, profile.reviewMission);
  }

  if (profile.reviewMode === "weakness") {
    const weakestMission = profile.reviewMission || getWeakestMission(profile, missionTemplates);
    return getTargetedReviewCandidates(profile, sentences, weakestMission);
  }

  return [];
}
