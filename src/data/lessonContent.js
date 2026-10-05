
/*
============================================================
FOOTBALL COACH SYSTEM
CONTENU PÉDAGOGIQUE DES LEÇONS
============================================================

Chaque leçon peut contenir :

video
transcript
quiz

Le quiz doit toujours être construit uniquement à partir
des informations présentes dans transcript.
*/

export const lessonContent = {

  "m1-l4": {

    video: {
      type: "file",
      url: "/Projet-de-jeu-Mika-FCS.mp4",
      duration: 1049,
      status: "ready"
    },

    transcript: [
      /*
      Exemple futur :

      {
        start: 0,
        end: 18,
        text: "Aujourd'hui nous allons voir..."
      },

      {
        start: 18,
        end: 42,
        text: "Pour mettre en place notre modèle..."
      }
      */
    ],

    quiz: [

      {
        id: "m1-l4-q1",

        question:
          "Quel est l'objectif principal de la mise en place d'un modèle de jeu sur le terrain ?",

        options: [
          "Faire mémoriser des systèmes fixes aux joueurs",
          "Transformer les principes de jeu en comportements observables",
          "Augmenter uniquement la charge physique",
          "Changer d'organisation à chaque séance"
        ],

        correct: 1,

        evidence: {
          text: "",
          start: null,
          end: null
        },

        source: "temporary"
      },

      {
        id: "m1-l4-q2",

        question:
          "Un principe de jeu doit avant tout permettre aux joueurs de :",

        options: [
          "Réciter les consignes de l'entraîneur",
          "Prendre des décisions cohérentes dans différentes situations",
          "Rester dans une position fixe",
          "Éviter toute prise d'initiative"
        ],

        correct: 1,

        evidence: {
          text: "",
          start: null,
          end: null
        },

        source: "temporary"
      },

      {
        id: "m1-l4-q3",

        question:
          "Pour transférer un comportement au match, l'entraînement doit :",

        options: [
          "Être totalement déconnecté du jeu",
          "Reproduire uniquement des courses physiques",
          "Créer des situations représentatives du jeu",
          "Supprimer les prises de décision"
        ],

        correct: 2,

        evidence: {
          text: "",
          start: null,
          end: null
        },

        source: "temporary"
      },

      {
        id: "m1-l4-q4",

        question:
          "Dans une approche basée sur le modèle de jeu, l'exercice est principalement :",

        options: [
          "Une fin en soi",
          "Un moyen de faire émerger les comportements recherchés",
          "Un test physique",
          "Une activité identique pour toutes les équipes"
        ],

        correct: 1,

        evidence: {
          text: "",
          start: null,
          end: null
        },

        source: "temporary"
      },

      {
        id: "m1-l4-q5",

        question:
          "Pourquoi observer les comportements des joueurs pendant les exercices ?",

        options: [
          "Pour vérifier si les principes travaillés apparaissent réellement",
          "Uniquement pour mesurer la vitesse",
          "Pour éviter de modifier la séance",
          "Uniquement pour déterminer le onze titulaire"
        ],

        correct: 0,

        evidence: {
          text: "",
          start: null,
          end: null
        },

        source: "temporary"
      }

    ]

  }

};


/*
============================================================
ACCÈS AU CONTENU
============================================================
*/

export function getLessonContent(lessonId) {

  return lessonContent[lessonId] || {
    video: null,
    transcript: [],
    quiz: []
  };

}


export function getLessonQuiz(lessonId) {

  return getLessonContent(lessonId).quiz || [];

}


export function getLessonTranscript(lessonId) {

  return getLessonContent(lessonId).transcript || [];

}


/*
============================================================
VALIDATION D'UN QUIZ GÉNÉRÉ DEPUIS UNE TRANSCRIPTION
============================================================

Un quiz provenant réellement d'une vidéo doit avoir :

- une question
- au moins 2 réponses
- une bonne réponse valide
- un passage justificatif
- un timecode
*/

export function validateGeneratedQuestion(question) {

  if (!question) return false;

  if (
    !question.question ||
    typeof question.question !== "string"
  ) {
    return false;
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length < 2
  ) {
    return false;
  }

  if (
    typeof question.correct !== "number" ||
    question.correct < 0 ||
    question.correct >= question.options.length
  ) {
    return false;
  }

  if (!question.evidence) {
    return false;
  }

  if (!question.evidence.text) {
    return false;
  }

  if (
    typeof question.evidence.start !== "number"
  ) {
    return false;
  }

  return true;

}


/*
============================================================
RÈGLE FCS DE GÉNÉRATION DES QUIZ
============================================================
*/

export const FCS_QUIZ_GENERATION_RULES = `

Tu es le moteur pédagogique de Football Coach System.

Ta seule source d'information autorisée est la transcription
de la vidéo fournie.

OBJECTIF :

Créer un questionnaire permettant de vérifier que l'élève
a compris les éléments réellement enseignés dans la vidéo.

RÈGLES ABSOLUES :

1. N'utilise aucune connaissance extérieure à la transcription.

2. Chaque question doit pouvoir être répondue grâce à une
information explicitement présente dans la vidéo.

3. Ne crée jamais une information qui n'apparaît pas dans
la transcription.

4. Chaque question comporte une seule bonne réponse.

5. Crée quatre choix de réponse lorsque le contenu le permet.

6. Les mauvaises réponses doivent être plausibles mais ne
doivent pas pouvoir être considérées comme correctes selon
la transcription.

7. Évite les questions triviales portant uniquement sur un mot,
un nom ou une formulation sans intérêt pédagogique.

8. Privilégie :
   - compréhension des concepts,
   - principes,
   - comportements,
   - relations entre concepts,
   - application pratique,
   - décisions de l'entraîneur.

9. Pour chaque question, fournis obligatoirement :
   - la question,
   - les réponses,
   - l'index de la bonne réponse,
   - le passage exact qui justifie la réponse,
   - le début du passage,
   - la fin du passage.

10. Si la transcription ne contient pas suffisamment
d'informations fiables pour créer 5 questions, génère moins
de questions.

11. Ne complète jamais avec tes propres connaissances.

12. Une question sans preuve dans la transcription doit être
rejetée.

FORMAT ATTENDU :

[
  {
    "question": "...",
    "options": [
      "...",
      "...",
      "...",
      "..."
    ],
    "correct": 0,
    "evidence": {
      "text": "...",
      "start": 0,
      "end": 20
    }
  }
]

`;

