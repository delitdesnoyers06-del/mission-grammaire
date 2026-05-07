# Roadmap d’amélioration pédagogique du mini-jeu

## Objectif

Faire évoluer l’application pour mieux appliquer les leviers cités dans la synthèse : répétition espacée, associations visuelles, active recall, interleaving et feedback immédiat, tout en rapprochant le contenu du programme CP/CE1.

---

## Priorité 1 — Renforcer la répétition espacée en conjugaison

### Problème actuel
- La grammaire dispose déjà d’une logique de planification.
- La conjugaison repose surtout sur des répétitions locales et une file de révision.

### Changements à prévoir
- Ajouter une planification par item de conjugaison :
  - `mastery`
  - `lastAnsweredAt`
  - `nextReviewRound` ou `nextReviewAt`
  - `wrongInCycle`
- Faire remonter les formes dues avant les nouvelles formes.
- Utiliser des intervalles croissants après réussite.
- Raccourcir l’intervalle après erreur.

### Fichiers visés
- [js/features/conjugation.js](js/features/conjugation.js)
- [js/core/storage.js](js/core/storage.js)
- [js/ui/conjugation-render.js](js/ui/conjugation-render.js)

### Critères d’acceptation
- Une forme réussie plusieurs fois revient moins souvent.
- Une forme ratée revient rapidement.
- L’interface indique quelles formes sont “à revoir maintenant”.

---

## Priorité 2 — Ajouter de vrais repères visuels

### Problème actuel
- Les aides sont surtout textuelles.
- Les terminaisons et radicaux ne sont pas assez distingués visuellement.

### Changements à prévoir
- Afficher la réponse attendue en deux blocs visuels : radical + terminaison.
- Ajouter un code couleur stable :
  - une couleur par temps
  - une variante par personne
- Transformer le rappel de règle en mini schéma visuel.
- Ajouter un tableau de conjugaison compact pour la leçon active.

### Fichiers visés
- [index.html](index.html#L266-L285)
- [styles.css](styles.css)
- [js/ui/conjugation-render.js](js/ui/conjugation-render.js)
- [js/data/conjugation-content.js](js/data/conjugation-content.js)

### Critères d’acceptation
- L’élève voit immédiatement la structure d’une forme.
- Les aides visuelles changent selon le temps actif.
- Le bloc “Terminaisons” n’est plus limité au présent.

---

## Priorité 3 — Introduire de l’interleaving

### Problème actuel
- Le parcours de conjugaison reste très centré sur une seule leçon active.

### Changements à prévoir
- Ajouter un mode “mélange intelligent”.
- Mélanger progressivement :
  - plusieurs verbes
  - plusieurs pronoms
  - plusieurs temps déjà débloqués
- Déclencher ce mode après un seuil minimal de maîtrise.

### Fichiers visés
- [js/features/conjugation.js](js/features/conjugation.js)
- [script.js](script.js)
- [index.html](index.html#L205-L252)

### Critères d’acceptation
- Une session peut proposer des formes de plusieurs leçons débloquées.
- Les formes fragiles restent prioritaires dans le mélange.

---

## Priorité 4 — Mieux doser le feedback immédiat

### Problème actuel
- En conjugaison, la bonne réponse est souvent donnée immédiatement après erreur.
- Cela limite l’effort de récupération active.

### Changements à prévoir
- Passer à un feedback en 3 niveaux :
  1. signalement d’erreur
  2. indice ciblé
  3. seconde tentative
  4. révélation de la réponse si nouvel échec
- Réutiliser le même principe pour certaines missions de grammaire.
- Conserver la correction immédiate visuelle.

### Fichiers visés
- [script.js](script.js#L523-L560)
- [js/features/conjugation.js](js/features/conjugation.js#L496-L512)
- [js/features/adaptive.js](js/features/adaptive.js#L45-L49)

### Critères d’acceptation
- Une première erreur n’affiche plus toujours la solution complète.
- L’élève bénéficie d’un indice avant la révélation.

---

## Priorité 5 — Corriger le cadrage pédagogique du module conjugaison

### Problème actuel
- Le contenu couvre surtout présent + futur.
- La synthèse vise aussi l’imparfait et le passé composé.

### Changements à prévoir
- Étendre les données de leçon à :
  - imparfait
  - passé composé
- Commencer par les verbes les plus fréquents et les auxiliaires.
- Adapter les textes UI pour refléter le temps réellement affiché.

### Fichiers visés
- [js/data/conjugation-content.js](js/data/conjugation-content.js)
- [script.js](script.js#L148)
- [index.html](index.html#L274-L279)
- [js/ui/conjugation-render.js](js/ui/conjugation-render.js#L38-L89)

### Critères d’acceptation
- Le module ne présente plus seulement le présent et le futur.
- Les libellés d’aide sont dynamiques selon le temps.

---

## Priorité 6 — Ajouter un levier audio léger

### Problème actuel
- Aucun appui auditif n’est présent.

### Changements à prévoir
- Ajouter un bouton “écouter la forme”.
- Ajouter de courtes comptines ou rythmes de terminaisons par temps.
- Garder cela optionnel et discret.

### Fichiers visés
- [index.html](index.html)
- [script.js](script.js)
- [styles.css](styles.css)

### Critères d’acceptation
- L’élève peut lancer un support audio sans bloquer l’exercice.
- Le support audio renforce les terminaisons les plus utiles.

---

## Ordre recommandé d’implémentation

1. Répétition espacée en conjugaison
2. Feedback progressif
3. Repères visuels
4. Interleaving
5. Extension imparfait / passé composé
6. Support audio

---

## Lot MVP recommandé

Si une seule itération courte doit être livrée, prendre ce lot :
- répétition espacée en conjugaison
- feedback en 2 temps minimum
- repères visuels radical / terminaison
- libellés dynamiques par temps

Ce lot apporte le meilleur gain pédagogique sans refonte complète de l’application.
