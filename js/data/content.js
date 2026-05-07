export const missionTemplates = [
  {
    label: "sujet",
    prompt: "Trouve le sujet : sélectionne tous les mots du sujet.",
    promptAll: "Trouve le sujet : sélectionne tous les mots du sujet.",
    hint: "Le sujet dit qui fait l'action.",
    strongHint: "Cherche le groupe de mots qui répond à la question : qui fait l'action ?",
    targetLabel: "mot du sujet",
  },
  {
    label: "verbe",
    prompt: "Trouve tous les verbes.",
    promptAll: "Trouve tous les verbes.",
    hint: "Le verbe dit ce que fait le sujet.",
    strongHint: "Cherche le mot qui change si on dit hier ou demain.",
    targetLabel: "verbe",
  },
  {
    label: "adjectif",
    prompt: "Trouve tous les adjectifs.",
    promptAll: "Trouve tous les adjectifs.",
    hint: "L'adjectif donne une précision sur un nom.",
    strongHint: "Cherche un mot qui décrit un nom, comme sa couleur ou son caractère.",
    targetLabel: "adjectif",
  },
  {
    label: "nom",
    prompt: "Trouve tous les noms.",
    promptAll: "Trouve tous les noms.",
    hint: "Le nom peut être une personne, un animal ou une chose.",
    strongHint: "Cherche le mot qui désigne quelqu'un, un animal ou un objet.",
    targetLabel: "nom",
  },
  {
    label: "déterminant",
    prompt: "Trouve tous les déterminants.",
    promptAll: "Trouve tous les déterminants.",
    hint: "Le déterminant est le petit mot placé devant le nom.",
    strongHint: "Cherche un petit mot comme le, la, les, un, une, des.",
    targetLabel: "déterminant",
  },
];

export const positiveMessages = [
  "Bravo !",
  "Super !",
  "Bien joué !",
  "Excellent !",
  "Tu progresses très bien !",
];

export const encouragementMessages = [
  "Essaie encore.",
  "Presque ! Regarde bien la phrase.",
  "Ce n'est pas encore ça. Reprends doucement.",
  "Tu vas y arriver, observe chaque mot.",
];

const subjectCatalog = [
  {
    singular: { det: "Le", noun: "chat", adjective: "malin" },
    plural: { det: "Les", noun: "chats", adjective: "malins" },
  },
  {
    singular: { det: "Le", noun: "chien", adjective: "joyeux" },
    plural: { det: "Les", noun: "chiens", adjective: "joyeux" },
  },
  {
    singular: { det: "Le", noun: "pirate", adjective: "courageux" },
    plural: { det: "Les", noun: "pirates", adjective: "courageux" },
  },
  {
    singular: { det: "Le", noun: "lapin", adjective: "rapide" },
    plural: { det: "Les", noun: "lapins", adjective: "rapides" },
  },
  {
    singular: { det: "Le", noun: "robot", adjective: "gentil" },
    plural: { det: "Les", noun: "robots", adjective: "gentils" },
  },
  {
    singular: { det: "La", noun: "souris", adjective: "rusée" },
    plural: { det: "Les", noun: "souris", adjective: "rusées" },
  },
  {
    singular: { det: "La", noun: "princesse", adjective: "curieuse" },
    plural: { det: "Les", noun: "princesses", adjective: "curieuses" },
  },
  {
    singular: { det: "La", noun: "tortue", adjective: "patiente" },
    plural: { det: "Les", noun: "tortues", adjective: "patientes" },
  },
  {
    singular: { det: "La", noun: "maîtresse", adjective: "calme" },
    plural: { det: "Les", noun: "maîtresses", adjective: "calmes" },
  },
  {
    singular: { det: "La", noun: "fée", adjective: "brillante" },
    plural: { det: "Les", noun: "fées", adjective: "brillantes" },
  },
  {
    singular: { det: "Le", noun: "renard", adjective: "discret" },
    plural: { det: "Les", noun: "renards", adjective: "discrets" },
  },
  {
    singular: { det: "Le", noun: "jardinier", adjective: "patient" },
    plural: { det: "Les", noun: "jardiniers", adjective: "patients" },
  },
  {
    singular: { det: "Le", noun: "dragon", adjective: "curieux" },
    plural: { det: "Les", noun: "dragons", adjective: "curieux" },
  },
  {
    singular: { det: "L'", noun: "élève", adjective: "appliqué" },
    plural: { det: "Les", noun: "élèves", adjective: "appliqués" },
  },
];

const predicateCatalog = [
  {
    verb: { singular: "regarde", plural: "regardent" },
    object: {
      singular: { det: "un", noun: "ballon", adjective: "rouge" },
      plural: { det: "des", noun: "ballons", adjective: "rouges" },
    },
  },
  {
    verb: { singular: "cherche", plural: "cherchent" },
    object: {
      singular: { det: "une", noun: "pomme", adjective: "croquante" },
      plural: { det: "des", noun: "pommes", adjective: "croquantes" },
    },
  },
  {
    verb: { singular: "lit", plural: "lisent" },
    object: {
      singular: { det: "un", noun: "livre", adjective: "amusant" },
      plural: { det: "des", noun: "livres", adjective: "amusants" },
    },
  },
  {
    verb: { singular: "dessine", plural: "dessinent" },
    object: {
      singular: { det: "une", noun: "cabane", adjective: "secrète" },
      plural: { det: "des", noun: "cabanes", adjective: "secrètes" },
    },
  },
  {
    verb: { singular: "porte", plural: "portent" },
    object: {
      singular: { det: "un", noun: "cartable", adjective: "lourd" },
      plural: { det: "des", noun: "cartables", adjective: "lourds" },
    },
  },
  {
    verb: { singular: "sent", plural: "sentent" },
    object: {
      singular: { det: "une", noun: "fleur", adjective: "parfumée" },
      plural: { det: "des", noun: "fleurs", adjective: "parfumées" },
    },
  },
  {
    verb: { singular: "prépare", plural: "préparent" },
    object: {
      singular: { det: "un", noun: "gâteau", adjective: "moelleux" },
      plural: { det: "des", noun: "gâteaux", adjective: "moelleux" },
    },
  },
  {
    verb: { singular: "observe", plural: "observent" },
    object: {
      singular: { det: "une", noun: "étoile", adjective: "filante" },
      plural: { det: "des", noun: "étoiles", adjective: "filantes" },
    },
  },
  {
    verb: { singular: "répare", plural: "réparent" },
    object: {
      singular: { det: "un", noun: "vélo", adjective: "bleu" },
      plural: { det: "des", noun: "vélos", adjective: "bleus" },
    },
  },
  {
    verb: { singular: "écoute", plural: "écoutent" },
    object: {
      singular: { det: "une", noun: "musique", adjective: "douce" },
      plural: { det: "des", noun: "musiques", adjective: "douces" },
    },
  },
  {
    verb: { singular: "attrape", plural: "attrapent" },
    object: {
      singular: { det: "un", noun: "cerf-volant", adjective: "coloré" },
      plural: { det: "des", noun: "cerfs-volants", adjective: "colorés" },
    },
  },
  {
    verb: { singular: "cuisine", plural: "cuisinent" },
    object: {
      singular: { det: "une", noun: "soupe", adjective: "chaude" },
      plural: { det: "des", noun: "soupes", adjective: "chaudes" },
    },
  },
  {
    verb: { singular: "fabrique", plural: "fabriquent" },
    object: {
      singular: { det: "une", noun: "fusée", adjective: "brillante" },
      plural: { det: "des", noun: "fusées", adjective: "brillantes" },
    },
  },
  {
    verb: { singular: "arrose", plural: "arrosent" },
    object: {
      singular: { det: "une", noun: "plante", adjective: "verte" },
      plural: { det: "des", noun: "plantes", adjective: "vertes" },
    },
  },
];

function token(text, roles = [], meta = {}) {
  return { text, roles, ...meta };
}

function getForm(source, quantity) {
  return quantity === "plural" ? source.plural : source.singular;
}

function buildSubjectTokens(subject, quantity) {
  const form = getForm(subject, quantity);

  return [
    token(form.det, ["subject", "déterminant"]),
    token(form.noun, ["subject", "nom"]),
    token(form.adjective, ["subject", "adjectif"]),
  ];
}

function buildObjectTokens(predicate, quantity) {
  const form = getForm(predicate.object, quantity);

  return [
    token(form.det, ["déterminant"]),
    token(form.noun, ["nom"]),
    token(form.adjective, ["adjectif"]),
  ];
}

function buildCoordinatedSubjectTokens(firstSubject, secondSubject) {
  return [
    ...buildSubjectTokens(firstSubject, "singular"),
    token("et"),
    ...buildSubjectTokens(secondSubject, "singular"),
  ];
}

function buildCoordinatedObjectTokens(firstPredicate, secondPredicate) {
  return [
    ...buildObjectTokens(firstPredicate, "singular"),
    token("et"),
    ...buildObjectTokens(secondPredicate, "singular"),
  ];
}

function buildTimeComplementTokens() {
  return [token("ce"), token("matin")];
}

function buildPlaceComplementTokens() {
  return [token("dans"), token("le", ["déterminant"]), token("jardin", ["nom"])];
}

const patternBuilders = [
  {
    id: "simple",
    label: "Phrase simple",
    difficulty: 1,
    build(subject, predicate) {
      const quantity = "singular";
      return [
        ...buildSubjectTokens(subject, quantity),
        token(predicate.verb.singular, ["verbe"]),
        ...buildObjectTokens(predicate, quantity),
      ];
    },
  },
  {
    id: "plural",
    label: "Sujet au pluriel",
    difficulty: 2,
    build(subject, predicate) {
      const quantity = "plural";
      return [
        ...buildSubjectTokens(subject, quantity),
        token(predicate.verb.plural, ["verbe"]),
        ...buildObjectTokens(predicate, quantity),
      ];
    },
  },
  {
    id: "negative",
    label: "Phrase négative",
    difficulty: 2,
    build(subject, predicate) {
      const quantity = "singular";
      return [
        ...buildSubjectTokens(subject, quantity),
        token("ne"),
        token(predicate.verb.singular, ["verbe"]),
        token("pas"),
        ...buildObjectTokens(predicate, quantity),
      ];
    },
  },
  {
    id: "time",
    label: "Complément de temps",
    difficulty: 2,
    build(subject, predicate) {
      const quantity = "singular";
      return [
        ...buildSubjectTokens(subject, quantity),
        token(predicate.verb.singular, ["verbe"]),
        ...buildObjectTokens(predicate, quantity),
        ...buildTimeComplementTokens(),
      ];
    },
  },
  {
    id: "place",
    label: "Complément de lieu",
    difficulty: 3,
    build(subject, predicate) {
      const quantity = "plural";
      return [
        ...buildSubjectTokens(subject, quantity),
        token(predicate.verb.plural, ["verbe"]),
        ...buildObjectTokens(predicate, "singular"),
        ...buildPlaceComplementTokens(),
      ];
    },
  },
  {
    id: "double-object",
    label: "Deux groupes nominaux",
    difficulty: 3,
    build(subject, predicate, context) {
      return [
        ...buildSubjectTokens(subject, "singular"),
        token(predicate.verb.singular, ["verbe"]),
        ...buildCoordinatedObjectTokens(predicate, context.secondaryPredicate),
      ];
    },
  },
  {
    id: "double-verb",
    label: "Deux verbes",
    difficulty: 3,
    build(subject, predicate, context) {
      return [
        ...buildSubjectTokens(subject, "singular"),
        token(predicate.verb.singular, ["verbe"]),
        ...buildObjectTokens(predicate, "singular"),
        token("et"),
        token(context.secondaryPredicate.verb.singular, ["verbe"]),
        ...buildObjectTokens(context.secondaryPredicate, "singular"),
      ];
    },
  },
  {
    id: "double-subject",
    label: "Sujet coordonné",
    difficulty: 3,
    build(subject, predicate, context) {
      return [
        ...buildCoordinatedSubjectTokens(subject, context.secondarySubject),
        token(predicate.verb.plural, ["verbe"]),
        ...buildObjectTokens(predicate, "singular"),
      ];
    },
  },
  {
    id: "negative-plural-place",
    label: "Phrase négative au pluriel",
    difficulty: 4,
    build(subject, predicate) {
      return [
        ...buildSubjectTokens(subject, "plural"),
        token("ne"),
        token(predicate.verb.plural, ["verbe"]),
        token("pas"),
        ...buildObjectTokens(predicate, "plural"),
        ...buildPlaceComplementTokens(),
      ];
    },
  },
  {
    id: "double-verb-time-place",
    label: "Deux verbes avec compléments",
    difficulty: 4,
    build(subject, predicate, context) {
      return [
        ...buildSubjectTokens(subject, "singular"),
        token(predicate.verb.singular, ["verbe"]),
        ...buildObjectTokens(predicate, "singular"),
        token("puis"),
        token(context.secondaryPredicate.verb.singular, ["verbe"]),
        ...buildObjectTokens(context.secondaryPredicate, "singular"),
        ...buildTimeComplementTokens(),
      ];
    },
  },
  {
    id: "double-subject-double-object",
    label: "Sujet coordonné et deux objets",
    difficulty: 4,
    build(subject, predicate, context) {
      return [
        ...buildCoordinatedSubjectTokens(subject, context.secondarySubject),
        token(predicate.verb.plural, ["verbe"]),
        ...buildCoordinatedObjectTokens(predicate, context.secondaryPredicate),
      ];
    },
  },
  {
    id: "plural-time-place",
    label: "Pluriel avec compléments",
    difficulty: 4,
    build(subject, predicate) {
      return [
        ...buildSubjectTokens(subject, "plural"),
        token(predicate.verb.plural, ["verbe"]),
        ...buildObjectTokens(predicate, "plural"),
        ...buildTimeComplementTokens(),
        ...buildPlaceComplementTokens(),
      ];
    },
  },
];

function buildAcceptedAnswers(tokens, label) {
  const targetRole = label === "sujet" ? "subject" : label;
  const acceptedIndices = tokens
    .map((currentToken, index) => (currentToken.roles.includes(targetRole) ? index : -1))
    .filter((index) => index >= 0);

  return [acceptedIndices];
}

function createSentence(subject, predicate, pattern, id, context) {
  const tokens = pattern.build(subject, predicate, context);

  return {
    id,
    difficulty: pattern.difficulty,
    variant: pattern.label,
    tokens: tokens.map((entry) => entry.text),
    taggedTokens: tokens,
    text: `${tokens.map((entry) => entry.text).join(" ")}.`,
    missions: missionTemplates.map((mission) => {
      const acceptedAnswers = buildAcceptedAnswers(tokens, mission.label);

      return {
        ...mission,
        acceptedAnswers,
        expectedCount: acceptedAnswers[0]?.length ?? 0,
      };
    }),
  };
}

export function generateSentences() {
  const sentences = [];
  let sentenceId = 0;

  subjectCatalog.forEach((subject, subjectIndex) => {
    predicateCatalog.forEach((predicate, predicateIndex) => {
      const pattern = patternBuilders[(subjectIndex + predicateIndex) % patternBuilders.length];
      const secondarySubject = subjectCatalog[(subjectIndex + predicateIndex + 1) % subjectCatalog.length];
      const secondaryPredicate = predicateCatalog[(predicateIndex + subjectIndex + 1) % predicateCatalog.length];

      sentences.push(
        createSentence(subject, predicate, pattern, sentenceId, {
          secondarySubject,
          secondaryPredicate,
        }),
      );
      sentenceId += 1;
    });
  });

  return sentences;
}
