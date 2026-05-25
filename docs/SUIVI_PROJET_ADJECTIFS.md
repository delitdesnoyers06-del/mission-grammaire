# Suivi du Projet : Atelier Adjectifs

## 📋 Informations Générales

- **Projet** : Mission Grammaire CE1
- **Nouvelle fonctionnalité** : Atelier Adjectifs (Phrases à trous avec accords)
- **Date de création** : 2025-05-06
- **Statut** : Planification terminée, implémentation en attente
- **Responsable** : Yohann

## 🎯 Objectif

Ajouter un nouveau module d'apprentissage pour permettre aux enfants d'apprendre à correctement utiliser les **adjectifs qualificatifs** avec les bons accords (genre et nombre) à travers des **phrases à trous**.

- **Nombre de phrases** : 50 phrases différentes
- **Type d'exercice** : Compléter la phrase avec l'adjectif correctement accordé
- **Cible** : Enfants de CE1 (Cours Élémentaire 1ère année)

## 🏗️ Architecture Existante

L'application suit une architecture modulaire bien structurée :

```
conjugaison/
├── index.html          # Structure HTML principale
├── script.js           # Logique principale et intégration
├── styles.css          # Styles de l'application
├── README.md
└── js/
    ├── data/
    │   ├── content.js           # Phrases pour Mission Grammaire
    │   └── conjugation-content.js # Leçons de conjugaison
    ├── core/
    │   └── storage.js           # Gestion des données et sauvegarde
    ├── features/
    │   ├── adaptive.js          # Adaptation du niveau
    │   ├── conjugation.js       # Logique de conjugaison
    │   ├── profiles.js          # Gestion des profils
    │   ├── rewards.js           # Système de récompenses (badges)
    │   ├── review.js            # Révision ciblée
    │   ├── spaced-repetition.js # Révision par espacement
    │   └── stats.js             # Statistiques
    └── ui/
        ├── render.js            # Rendu principal
        └── conjugation-render.js # Rendu de la conjugaison
```

### Modules existants

1. **grammar** (Mission grammaire)
   - Identifier sujet, verbe, adjectif, nom, déterminant
   - Système de sélection de mots dans les phrases
   - 5 missions différentes

2. **conjugation** (Atelier conjugaison)
   - Apprentissage des conjugaisons (présent, futur, imparfait, passé composé)
   - 1er, 2e, 3e groupe
   - Système de leçons progressives

## 📝 Plan d'Implémentation

### Phase 1 : Données (50 phrases à trous)
**Fichier** : `js/data/adjective-content.js`

#### Structure des données

```javascript
export const adjectiveExercises = [
  {
    id: 0,
    sentence: "Le chat ___ dort sur le tapis.",
    blankIndex: 1,           // Position du trou (index du mot)
    correctAnswer: "noir",
    gender: "masculin",
    number: "singulier",
    difficulty: 1,          // Niveau 1-5
    hint: "Pense à la couleur du chat.",
    strongHint: "Le chat est de couleur noire ou noire ?",
    explanation: "Le chat est masculin singulier, donc on écrit 'noir'.",
    category: "couleur"
  }
];
```

#### Répartition des 50 phrases

| Niveau | Type | Quantité | Exemples |
|--------|------|----------|----------|
| 1 | Masculin singulier | 10 | Le chat noir, Le chien blanc, Le ciel bleu |
| 2 | Féminin singulier | 10 | La maison blanche, La fleur rouge |
| 3 | Masculin pluriel | 10 | Les chats noirs, Les chiens blancs |
| 4 | Féminin pluriel | 10 | Les maisons blanches, Les fleurs rouges |
| 5 | Accords irréguliers | 10 | Le beau jardin, La belle maison, Les beaux oiseaux |

#### Catégories d'adjectifs

- **Couleurs** : noir, blanc, rouge, bleu, vert, jaune, etc.
- **Tailles** : grand, petit, gros, fin, large, etc.
- **Caractères** : gentil, méchant, joyeux, triste, calme, etc.
- **Formes** : rond, carré, long, court, etc.
- **Qualités** : beau/bel/belle, propre, sale, nouveau/nouvel/nouvelle, etc.

### Phase 2 : Logique du module
**Fichier** : `js/features/adjective.js`

Fonctions principales :
- `getAdjectiveExerciseById(exerciseId)` - Récupérer un exercice
- `verifyAdjectiveAnswer(exerciseId, userAnswer)` - Vérifier la réponse
- `getAdjectiveProgress(profile)` - Progression utilisateur
- `recordAdjectiveAttempt(profile, exerciseId, isCorrect)` - Enregistrer tentative
- `getAdjectiveHint(exerciseId, attemptCount)` - Donner un indice

### Phase 3 : Interface utilisateur

#### Modifications de `index.html`
Ajouter un nouveau panel :
```html
<section id="adjectivePanel" class="module-panel" aria-label="Module Atelier adjectifs" hidden>
  <section class="card adjective-card">
    <div class="adjective-header">
      <h2>Atelier adjectifs</h2>
      <p class="subtitle-small">Complète avec l'adjectif correctement accordé.</p>
    </div>
    <div class="adjective-progress">...</div>
    <div class="adjective-exercise">
      <p id="adjectiveSentence"></p>
      <input type="text" id="adjectiveInput" placeholder="Écris l'adjectif" />
    </div>
    <div class="adjective-actions">
      <button id="adjectiveCheckButton">Vérifier</button>
      <button id="adjectiveHintButton">💡 Indice</button>
    </div>
    <p id="adjectiveFeedback"></p>
  </section>
</section>
```

#### Nouveau fichier : `js/ui/adjective-render.js`
- `renderAdjectiveExercise(dom, exercise, profile)`
- `renderAdjectiveProgress(dom, profile, exercises)`
- `renderAdjectiveStats(dom, profile)`

### Phase 4 : Intégration

#### Modifications de `script.js`
- Importer les nouveaux modules
- Ajouter le module dans `getAvailableModules()`
- Gérer les écouteurs d'événements
- Intégrer la navigation entre modules

#### Modifications de `js/core/storage.js`
- Ajouter les données de progression dans `createDefaultProfile()`
- Normaliser les données existantes

## ✅ État Actuel

- [x] Exploration du codebase terminée
- [x] Plan détaillé créé (`/home/yohann/.vibe/plans/1779710819-bold-lucky-bloom.md`)
- [x] Fichier de suivi créé (ce fichier)
- [x] Implémentation des données (50 phrases) - `js/data/adjective-content.js`
- [x] Implémentation de la logique - `js/features/adjective.js`
- [x] Implémentation de l'interface - `js/ui/adjective-render.js`
- [x] Modifications de `index.html` - Nouveau panel ajouté
- [x] Intégration dans `script.js` - Module intégré
- [x] Intégration dans `storage.js` - Stockage des données
- [ ] Tests et validation

## 📊 Détails Techniques

### Système de progression

Le nouveau module devra s'intégrer avec :
- **Spaced repetition** : Révision par espacement existant
- **Adaptive learning** : Adaptation du niveau de difficulté
- **Statistics** : Suivi des erreurs et réussites
- **Rewards** : Système de badges

### Données de profil

Le profil utilisateur devra stocker :
```javascript
profile.adjective = {
  currentExerciseId: 0,
  completedExerciseIds: [],
  score: 0,
  streak: 0,
  totalAttempts: 0,
  exerciseStats: {},  // Stats par exercice
  currentRound: 0,
  reviewMode: "normal",
  reviewExerciseIds: [],
  reviewExerciseIndex: 0
}
```

## ❓ Questions en Suspens

1. **Synonymes** : Doit-on accepter des synonymes (ex: "content" au lieu de "joyeux") ?
   - *Recommandation* : Non, pour simplifier la vérification et rester précis

2. **Feedback pédagogique** : Faut-il des explications détaillées après chaque réponse ?
   - *Recommandation* : Oui, avec des messages adaptés au niveau de l'enfant

3. **Intégration révision** : Intégrer avec le système de révision par espacement existant ?
   - *Recommandation* : Oui, pour la cohérence avec le reste de l'application

4. **Tolérance orthographe** : Quel niveau de tolérance pour les fautes d'orthographe ?
   - *Recommandation* : Vérification exacte, mais avec des indices pour aider

## 🚀 Prochaines Étapes

1. **Créer `js/data/adjective-content.js`** avec les 50 phrases
2. **Créer `js/features/adjective.js`** avec la logique du jeu
3. **Créer `js/ui/adjective-render.js`** avec l'interface
4. **Modifier `index.html`** pour ajouter le panel
5. **Modifier `script.js`** pour l'intégration
6. **Modifier `styles.css`** si nécessaire
7. **Modifier `js/core/storage.js`** pour le stockage
8. **Tester** l'ensemble

## 📅 Historique

| Date | Action | Responsable |
|------|--------|-------------|
| 2025-05-06 | Exploration du codebase | Mistral Vibe |
| 2025-05-06 | Création du plan détaillé | Mistral Vibe |
| 2025-05-06 | Création du fichier de suivi | Mistral Vibe |
| 2025-05-06 | Implémentation complète (données, logique, UI, intégration) | Mistral Vibe |
| *À venir* | Tests et validation | *À définir* |

## 📝 Notes

- Le nouveau module doit suivre l'architecture existante pour une intégration fluide
- Les messages de feedback doivent être encourageants et pédagogiques
- L'interface doit être intuitive pour les enfants de CE1
- Le système de difficulté progressive doit être cohérent avec le reste de l'application

---

*Dernière mise à jour : 2025-05-06*
*Fichier : `docs/SUIVI_PROJET_ADJECTIFS.md`*
