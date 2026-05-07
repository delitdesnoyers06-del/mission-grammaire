import { getDistinctPlayDays, getMissionBreakdown } from "./stats.js";

const badgeCatalog = [
  {
    id: "first-steps",
    label: "Premiers pas",
    description: "Valider 10 défis.",
    isUnlocked: (profile) => profile.score >= 10,
  },
  {
    id: "streak-5",
    label: "Série de 5",
    description: "Réussir 5 défis d'affilée.",
    isUnlocked: (profile) => profile.streak >= 5,
  },
  {
    id: "grammar-star",
    label: "Étoile grammaire",
    description: "Atteindre 80 % de réussite globale avec au moins 25 essais.",
    isUnlocked: (profile) => profile.totalAttempts >= 25 && Math.round((profile.score / profile.totalAttempts) * 100) >= 80,
  },
  {
    id: "verb-master",
    label: "Maître du verbe",
    description: "Avoir 80 % de réussite sur le verbe avec au moins 8 essais.",
    isUnlocked: (profile, missionTemplates) => {
      const verb = getMissionBreakdown(profile, missionTemplates).find((entry) => entry.label === "verbe");
      return Boolean(verb && verb.attempts >= 8 && verb.accuracy >= 80);
    },
  },
  {
    id: "regularity",
    label: "Régulier",
    description: "Jouer sur 3 jours différents.",
    isUnlocked: (profile) => getDistinctPlayDays(profile) >= 3,
  },
];

export function syncBadges(profile, missionTemplates) {
  const unlockedIds = new Set(profile.badges.map((badge) => badge.id));

  badgeCatalog.forEach((badge) => {
    if (!unlockedIds.has(badge.id) && badge.isUnlocked(profile, missionTemplates)) {
      profile.badges.push({ id: badge.id, unlockedAt: new Date().toISOString() });
      unlockedIds.add(badge.id);
    }
  });
}

export function getBadgeDefinitions() {
  return badgeCatalog;
}
