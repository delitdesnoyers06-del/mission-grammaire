function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getSentenceStats(profile, sentenceId, createSentenceStats) {
  const key = String(sentenceId);

  if (!profile.sentenceStats[key]) {
    profile.sentenceStats[key] = createSentenceStats();
  }

  return profile.sentenceStats[key];
}

export function recordAttempt(profile, sentenceId, missionLabel, isCorrect, createSentenceStats) {
  const sentenceStats = getSentenceStats(profile, sentenceId, createSentenceStats);
  const day = todayKey();

  sentenceStats.attempts += 1;
  sentenceStats.lastPlayedAt = new Date().toISOString();
  sentenceStats.seenCount += 1;
  sentenceStats.missionStats[missionLabel][isCorrect ? "correct" : "wrong"] += 1;
  profile.missionStats[missionLabel][isCorrect ? "correct" : "wrong"] += 1;
  profile.totalAttempts += 1;
  profile.lastPlayedDay = day;

  if (!profile.dailyStats[day]) {
    profile.dailyStats[day] = { correct: 0, wrong: 0 };
  }

  profile.dailyStats[day][isCorrect ? "correct" : "wrong"] += 1;

  if (!isCorrect) {
    sentenceStats.wrongInCurrentCycle += 1;
  }

  return sentenceStats;
}

export function getAccuracy(profile) {
  if (profile.totalAttempts === 0) {
    return 0;
  }

  return Math.round((profile.score / profile.totalAttempts) * 100);
}

export function getMissionBreakdown(profile, missionTemplates) {
  return missionTemplates.map((mission) => {
    const stats = profile.missionStats[mission.label];
    const attempts = stats.correct + stats.wrong;
    const accuracy = attempts > 0 ? Math.round((stats.correct / attempts) * 100) : 0;

    return {
      label: mission.label,
      correct: stats.correct,
      wrong: stats.wrong,
      attempts,
      accuracy,
    };
  });
}

export function getWeaknessEntries(profile, missionTemplates) {
  return getMissionBreakdown(profile, missionTemplates)
    .filter((entry) => entry.attempts > 0)
    .sort((first, second) => second.wrong - first.wrong || first.accuracy - second.accuracy);
}

export function getSentenceMistakeCount(profile, sentenceId) {
  const stats = profile.sentenceStats[String(sentenceId)];

  if (!stats) {
    return 0;
  }

  return Object.values(stats.missionStats).reduce((total, missionStat) => total + missionStat.wrong, 0);
}

export function getDailyHistory(profile, limit = 7) {
  return Object.entries(profile.dailyStats)
    .map(([day, values]) => ({
      day,
      correct: values.correct,
      wrong: values.wrong,
      total: values.correct + values.wrong,
      accuracy: values.correct + values.wrong > 0 ? Math.round((values.correct / (values.correct + values.wrong)) * 100) : 0,
    }))
    .sort((first, second) => second.day.localeCompare(first.day))
    .slice(0, limit);
}

export function getAverageAttemptsPerSuccess(profile) {
  if (profile.score === 0) {
    return 0;
  }

  return Number((profile.totalAttempts / profile.score).toFixed(1));
}

export function getDistinctPlayDays(profile) {
  return Object.keys(profile.dailyStats).length;
}
