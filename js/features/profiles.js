import { createDefaultProfile } from "../core/storage.js";

function createProfileName(index) {
  return `Élève ${index}`;
}

export function getProfileOptions(appData) {
  return Object.values(appData.profiles).sort((first, second) => first.name.localeCompare(second.name, "fr"));
}

export function addProfile(appData, missionTemplates, customName = "") {
  const nextIndex = Object.keys(appData.profiles).length + 1;
  const profileId = crypto.randomUUID();
  const name = customName.trim() || createProfileName(nextIndex);

  appData.profiles[profileId] = createDefaultProfile(profileId, name, missionTemplates);
  appData.activeProfileId = profileId;

  return appData.profiles[profileId];
}

export function switchProfile(appData, profileId) {
  if (!appData.profiles[profileId]) {
    return null;
  }

  appData.activeProfileId = profileId;
  return appData.profiles[profileId];
}

export function getActiveProfile(appData) {
  return appData.profiles[appData.activeProfileId];
}
