import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCard from "./components/StatCard";
import {
  Home, BookOpen, Layers3, PlaySquare, PlayCircle, FileText, Users, Brain,
  CalendarDays, BarChart3, BadgeCheck, Headphones,
  Search, Bell, ArrowRight, ArrowLeft, CheckCircle2, Circle,
  FolderOpen, ClipboardList, Video, Trophy, Clock,
  ChevronRight, Lock, Menu, Settings, X
} from "lucide-react";
import "./App.css";
import {
  getLessonContent,
  getLessonQuiz,
  getLessonTranscript
} from "./data/lessonContent";
import { courseVideos } from "./data/courseVideos";


function normalizeVideoUrl(value) {
  const raw = String(value || "").trim();

  // URL stockée sous forme Markdown :
  // [https://...mp4](https://...mp4)
  const markdown = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

  if (markdown) {
    return markdown[2].trim();
  }

  return raw;
}

const courseModules = [
  {
    id: 1,
    number: "MODULE 1",
    title: "Construire son modèle de jeu",
    description: "Construis une identité de jeu claire, cohérente et applicable sur le terrain.",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=85",
    lessons: [
      {
        id: "m1-l1",
        title: "Identité de jeu",
        duration: "12 min",
        description: "Comprendre ce qui définit réellement l'identité d'une équipe.",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "m1-l2",
        title: "Principes et sous-principes",
        duration: "18 min",
        description: "Transformer tes idées en principes de jeu observables.",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "m1-l3",
        title: "Organisation tactique",
        duration: "16 min",
        description: "Donner une structure cohérente à ton modèle de jeu.",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      },
      {
        id: "m1-l4",
        title: "Mise en place sur le terrain",
        duration: "21 min",
        description: "Passer du modèle théorique aux comportements sur le terrain.",
        video: "https://www.youtube.com/embed/dQw4w9WgXcQ"
      }
    ]
  },
  {
    id: 2,
    number: "MODULE 2",
    title: "Principes de jeu et comportements",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
    lessons: [
      { id:"m2-l1", title:"Phase offensive" },
      { id:"m2-l2", title:"Phase défensive" },
      { id:"m2-l3", title:"Transitions" },
      { id:"m2-l4", title:"Jeux de position et relations" }
    ]
  },
  {
    id: 3,
    number: "MODULE 3",
    title: "Méthodologie d'entraînement",
    image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=900&q=80",
    lessons: [
      { id:"m3-l1", title:"Le microcycle" },
      { id:"m3-l2", title:"Planification des séances" },
      { id:"m3-l3", title:"Types de tâches et exercices" },
      { id:"m3-l4", title:"Gestion de la charge (RPE)" }
    ]
  },
  {
    id: 4,
    number: "MODULE 4",
    title: "Performance et suivi du joueur",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=900&q=80",
    lessons: [
      { id:"m4-l1", title:"Tests physiques" },
      { id:"m4-l2", title:"Suivi de la charge" },
      { id:"m4-l3", title:"Prévention des blessures" },
      { id:"m4-l4", title:"Analyse et indicateurs" }
    ]
  }
];

const initialCompleted = [
  "m1-l1",
  "m1-l2",
  "m1-l3",
  "m2-l1",
  "m2-l2",
  "m3-l1"
];

const menu = [
  [Home, "Accueil"],
  [BookOpen, "Mes formations"],
  [Layers3, "Modules"],
  [PlaySquare, "Vidéos"],
  [FileText, "Documents & Templates"],
  [Users, "Communauté"],
  [CalendarDays, "Lives & Webinaires"],
  [BarChart3, "Mon suivi"],
  [BadgeCheck, "Certificats"]
];

function Dashboard({
  completed = [],
  openModule,
  modules = []
}) {
  const safeModules = Array.isArray(modules) ? modules : [];

  const allLessons = safeModules.flatMap(module =>
    Array.isArray(module.lessons) ? module.lessons : []
  );

  const totalLessons = allLessons.length;

  const completedLessons = allLessons.filter(lesson =>
    completed.includes(lesson.id)
  );

  const completedCount = completedLessons.length;

  const overallProgress =
    totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

  let nextLesson = null;
  let nextModule = null;

  for (const module of safeModules) {
    const lessons = Array.isArray(module.lessons)
      ? module.lessons
      : [];

    const pending = lessons.find(
      lesson => !completed.includes(lesson.id)
    );

    if (pending) {
      nextLesson = pending;
      nextModule = module;
      break;
    }
  }

  const totalVideos = safeModules.reduce(
    (total, module) =>
      total +
      (Array.isArray(module.lessons)
        ? module.lessons.reduce(
            (sum, lesson) =>
              sum +
              (Array.isArray(lesson.videos)
                ? lesson.videos.length
                : 0),
            0
          )
        : 0),
    0
  );

  const continueModuleId =
    nextModule?.id ||
    safeModules[0]?.id ||
    null;

  function handleContinue() {
    if (nextModule && openModule) {
      openModule(nextModule.id);
    }
  }

  return (
    <div style={{
      maxWidth: "1180px",
      margin: "0 auto",
      padding: "34px 28px 60px"
    }}>

      {/* HEADER */}
      <section style={{
        marginBottom: "28px"
      }}>
        <div style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#718096",
          marginBottom: "8px"
        }}>
          FOOTBALL COACH SYSTEM
        </div>

        <h1 style={{
          margin: 0,
          fontSize: "34px",
          lineHeight: 1.15,
          color: "#09233d",
          letterSpacing: "-0.8px"
        }}>
          Bonjour 👋
        </h1>

        <p style={{
          margin: "10px 0 0",
          color: "#68798a",
          fontSize: "16px"
        }}>
          Continue ton parcours et développe ta méthode d'entraîneur.
        </p>
      </section>

      {/* CONTINUE */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.6fr) minmax(260px, .8fr)",
        gap: "20px",
        marginBottom: "24px"
      }}>

        <article style={{
          background: "linear-gradient(135deg, #09233d 0%, #123c61 100%)",
          color: "#fff",
          borderRadius: "22px",
          padding: "30px",
          minHeight: "250px",
          boxShadow: "0 14px 35px rgba(9,35,61,.14)"
        }}>

          <div style={{
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            opacity: .65
          }}>
            Ton prochain objectif
          </div>

          <h2 style={{
            margin: "12px 0 6px",
            fontSize: "25px"
          }}>
            {nextModule?.title || "Commencer la formation"}
          </h2>

          <p style={{
            margin: "0 0 24px",
            opacity: .78,
            fontSize: "15px"
          }}>
            {nextLesson
              ? nextLesson.title
              : "Tous les contenus disponibles sont terminés."}
          </p>

          <div style={{
            height: "7px",
            background: "rgba(255,255,255,.18)",
            borderRadius: "99px",
            overflow: "hidden",
            marginBottom: "9px"
          }}>
            <div style={{
              width: `${overallProgress}%`,
              height: "100%",
              background: "#f1bd3e",
              borderRadius: "99px"
            }} />
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            opacity: .72,
            marginBottom: "22px"
          }}>
            <span>{overallProgress}% terminé</span>
            <span>{completedCount}/{totalLessons} leçons</span>
          </div>

          <button
            onClick={handleContinue}
            disabled={!continueModuleId}
            style={{
              border: 0,
              borderRadius: "11px",
              padding: "13px 20px",
              background: "#f1bd3e",
              color: "#09233d",
              fontWeight: 800,
              fontSize: "14px",
              cursor: continueModuleId ? "pointer" : "default",
              opacity: continueModuleId ? 1 : .5
            }}
          >
            {nextLesson ? "Continuer mon parcours →" : "Formation terminée"}
          </button>
        </article>

        {/* PROGRESSION */}
        <article style={{
          background: "#fff",
          border: "1px solid #e7edf2",
          borderRadius: "22px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(9,35,61,.04)"
        }}>

          <div style={{
            fontSize: "13px",
            fontWeight: 800,
            color: "#718096",
            textTransform: "uppercase",
            letterSpacing: ".8px"
          }}>
            Ma progression
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            marginTop: "24px"
          }}>

            <div style={{
              width: "104px",
              height: "104px",
              borderRadius: "50%",
              background:
                `conic-gradient(#f1bd3e ${overallProgress * 3.6}deg, #edf1f4 0deg)`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}>
              <div style={{
                width: "78px",
                height: "78px",
                borderRadius: "50%",
                background: "#fff",
                display: "grid",
                placeItems: "center",
                color: "#09233d",
                fontWeight: 900,
                fontSize: "21px"
              }}>
                {overallProgress}%
              </div>
            </div>

            <div>
              <div style={{
                fontWeight: 800,
                fontSize: "17px",
                color: "#09233d"
              }}>
                Ton parcours
              </div>

              <div style={{
                marginTop: "7px",
                color: "#718096",
                fontSize: "14px",
                lineHeight: 1.5
              }}>
                {completedCount} leçon{completedCount !== 1 ? "s" : ""} terminée{completedCount !== 1 ? "s" : ""}
                {" "}sur {totalLessons}.
              </div>
            </div>

          </div>
        </article>
      </section>

      {/* STATS */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "30px"
      }}>

        {[
          ["Formations", safeModules.length],
          ["Leçons", totalLessons],
          ["Vidéos", totalVideos]
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "1px solid #e7edf2",
              borderRadius: "17px",
              padding: "20px 22px"
            }}
          >
            <div style={{
              color: "#718096",
              fontSize: "13px",
              fontWeight: 700
            }}>
              {label}
            </div>

            <div style={{
              marginTop: "7px",
              color: "#09233d",
              fontSize: "27px",
              fontWeight: 900
            }}>
              {value}
            </div>
          </div>
        ))}
      </section>

      {/* FORMATION */}
      <section>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <div>
            <h2 style={{
              margin: 0,
              color: "#09233d",
              fontSize: "22px"
            }}>
              Ma formation
            </h2>

            <p style={{
              margin: "5px 0 0",
              color: "#718096",
              fontSize: "14px"
            }}>
              Reprends n'importe quel module quand tu le souhaites.
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px"
        }}>

          {safeModules.map((module, index) => {

            const lessons = Array.isArray(module.lessons)
              ? module.lessons
              : [];

            const done = lessons.filter(lesson =>
              completed.includes(lesson.id)
            ).length;

            const moduleProgress =
              lessons.length > 0
                ? Math.round((done / lessons.length) * 100)
                : 0;

            return (
              <article
                key={module.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e7edf2",
                  borderRadius: "19px",
                  padding: "22px",
                  transition: "transform .15s ease"
                }}
              >

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>

                  <span style={{
                    fontSize: "12px",
                    fontWeight: 900,
                    color: "#718096"
                  }}>
                    MODULE {String(index + 1).padStart(2, "0")}
                  </span>

                  <span style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: moduleProgress === 100
                      ? "#287a55"
                      : "#718096"
                  }}>
                    {moduleProgress}%
                  </span>

                </div>

                <h3 style={{
                  color: "#09233d",
                  margin: "16px 0 7px",
                  fontSize: "18px",
                  lineHeight: 1.3
                }}>
                  {module.title}
                </h3>

                <p style={{
                  color: "#718096",
                  fontSize: "13px",
                  margin: "0 0 16px"
                }}>
                  {lessons.length} leçon{lessons.length !== 1 ? "s" : ""}
                </p>

                <div style={{
                  height: "6px",
                  background: "#edf1f4",
                  borderRadius: "99px",
                  overflow: "hidden",
                  marginBottom: "17px"
                }}>
                  <div style={{
                    width: `${moduleProgress}%`,
                    height: "100%",
                    background: "#f1bd3e",
                    borderRadius: "99px"
                  }} />
                </div>

                <button
                  onClick={() => openModule(module.id)}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: "11px",
                    padding: "12px 16px",
                    background: "#f1bd3e",
                    color: "#09233d",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {moduleProgress > 0
                    ? "Continuer →"
                    : "Commencer →"}
                </button>

              </article>
            );
          })}

        </div>
      </section>

    </div>
  );
}


function ModulePage({
  module,
  completed,
  toggleCompleted,
  onBack,
  initialLessonId
}) {
  const firstIncomplete =
    module.lessons.find(l => !completed.includes(l.id)) ||
    module.lessons[0];

  const requestedLesson =
    initialLessonId
      ? module.lessons.find(l => l.id === initialLessonId)
      : null;

  const [selectedId, setSelectedId] = useState(
    requestedLesson?.id || firstIncomplete.id
  );

  useEffect(() => {
    if (!initialLessonId) return;

    const requested = module.lessons.find(
      lesson => String(lesson.id) === String(initialLessonId)
    );

    if (requested) {
      setSelectedId(requested.id);
    }
  }, [initialLessonId, module.lessons]);
  const [activeTab, setActiveTab] = useState("contenu");
  const [resourceMessage, setResourceMessage] = useState("");

  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [quizResults, setQuizResults] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("fcs-quiz-results") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fcs-lesson-notes") || "{}");
    } catch {
      return {};
    }
  });

  const selected =
    module.lessons.find(l => l.id === selectedId) ||
    module.lessons[0];

  const currentIndex =
    module.lessons.findIndex(l => l.id === selected.id);

  const previousLesson =
    currentIndex > 0 ? module.lessons[currentIndex - 1] : null;

  const nextLesson =
    currentIndex < module.lessons.length - 1
      ? module.lessons[currentIndex + 1]
      : null;

  const doneCount =
    module.lessons.filter(l => completed.includes(l.id)).length;

  const progress =
    Math.round((doneCount / module.lessons.length) * 100);

  const isDone = completed.includes(selected.id);

  const currentQuiz = getLessonQuiz(selected.id);
  const currentTranscript = getLessonTranscript(selected.id);

  const resources = [
    {
      icon: "powerpoint",
      title: "PowerPoint de la leçon",
      subtitle: "Support de présentation",
      action: "Télécharger",
      available: true
    },
    {
      icon: "pdf",
      title: "Fiche pratique",
      subtitle: "Document PDF",
      action: "Télécharger",
      available: true
    },
    {
      icon: "quiz",
      title: "Quiz de validation",
      subtitle: "Teste tes connaissances",
      action: "Faire le quiz",
      available: true
    },
    {
      icon: "work",
      title: "Document de travail",
      subtitle: "Template à compléter",
      action: "Ouvrir",
      available: true
    }
  ];

  function selectLesson(id) {
    setSelectedId(id);
    setActiveTab("contenu");
    setResourceMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveNote(value) {
    const updated = {
      ...notes,
      [selected.id]: value
    };

    setNotes(updated);
    localStorage.setItem(
      "fcs-lesson-notes",
      JSON.stringify(updated)
    );
  }

  function openResource(type) {
    const url = selected?.resources?.[type];

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const labels = {
      powerpoint: "PowerPoint",
      pdf: "fiche PDF",
      document: "document de travail"
    };

    setResourceMessage(
      `Aucun ${labels[type] || "document"} n'est encore associé à cette leçon.`
    );
  }

  function openQuiz() {
    setActiveTab("quiz");
    setResourceMessage("");
    setQuizAnswers({});
    setQuizSubmitted(false);
  }

  function chooseQuizAnswer(questionId, answerIndex) {
    if (quizSubmitted) return;

    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  }

  function submitQuiz() {
    if (!currentQuiz.length) return;

    if (Object.keys(quizAnswers).length !== currentQuiz.length) {
      setResourceMessage(
        "Réponds à toutes les questions avant de valider le quiz."
      );
      return;
    }

    let correctAnswers = 0;

    currentQuiz.forEach(question => {
      if (quizAnswers[question.id] === question.correct) {
        correctAnswers += 1;
      }
    });

    const score = Math.round(
      (correctAnswers / currentQuiz.length) * 100
    );

    const result = {
      score,
      correct: correctAnswers,
      total: currentQuiz.length,
      passed: score >= 70,
      date: new Date().toISOString()
    };

    const updated = {
      ...quizResults,
      [selected.id]: result
    };

    setQuizResults(updated);
    localStorage.setItem(
      "fcs-quiz-results",
      JSON.stringify(updated)
    );

    setQuizSubmitted(true);
    setResourceMessage("");
  }

  function restartQuiz() {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setResourceMessage("");
  }

  function goPrevious() {
    if (previousLesson) selectLesson(previousLesson.id);
  }

  function goNext() {
    if (!isDone) {
      toggleCompleted(selected.id);
    }

    if (nextLesson) {
      selectLesson(nextLesson.id);
    }
  }

  return (
    <div className="fcsCourse">

      <div className="courseTop">
        <button className="courseBack" onClick={onBack}>
          <ArrowLeft size={17}/>
          Tableau de bord
        </button>

        <div className="courseBreadcrumb">
          <span>Formation</span>
          <ChevronRight size={14}/>
          <span>{module.number}</span>
          <ChevronRight size={14}/>
          <strong>Leçon {currentIndex + 1}</strong>
        </div>
      </div>

      <div className="courseHero">
        <div className="courseHeroText">
          <span className="courseEyebrow">{module.number}</span>
          <h1>{module.title}</h1>
          <p>
            {module.description ||
              "Développe une méthodologie claire et directement applicable sur le terrain."}
          </p>
        </div>

        <div className="courseProgressBox">
          <div className="courseProgressTop">
            <span>Progression du module</span>
            <strong>{progress}%</strong>
          </div>

          <div className="courseProgressTrack">
            <div
              className="courseProgressFill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <small>
            {doneCount} leçon{doneCount > 1 ? "s" : ""} sur{" "}
            {module.lessons.length} terminée{doneCount > 1 ? "s" : ""}
          </small>
        </div>
      </div>

      <div className="courseWorkspace">

        <aside className="courseOutline">
          <div className="outlineHeader">
            <div>
              <span>PROGRAMME</span>
              <h3>Contenu du module</h3>
            </div>

            <div className="outlineCount">
              {module.lessons.length}
            </div>
          </div>

          <div className="outlineLessons">
            {module.lessons.map((lesson, index) => {
              const done = completed.includes(lesson.id);
              const active = lesson.id === selected.id;

              return (
                <button
                  key={lesson.id}
                  className={`outlineLesson ${active ? "active" : ""}`}
                  onClick={() => selectLesson(lesson.id)}
                >
                  <div
                    className={`outlineNumber ${
                      done ? "doneNumber" : ""
                    }`}
                  >
                    {done
                      ? <CheckCircle2 size={18}/>
                      : String(index + 1).padStart(2, "0")
                    }
                  </div>

                  <div className="outlineLessonText">
                    <small>LEÇON {String(index + 1).padStart(2, "0")}</small>
                    <strong>{lesson.title}</strong>

                    {lesson.duration && (
                      <span>
                        <Clock size={12}/>
                        {lesson.duration}
                      </span>
                    )}
                  </div>

                  {active
                    ? <PlaySquare size={18} className="outlinePlay"/>
                    : <ChevronRight size={16}/>
                  }
                </button>
              );
            })}
          </div>

          <div className="outlineFooter">
            <Trophy size={23}/>
            <div>
              <strong>{progress}% terminé</strong>
              <span>Continue ta progression</span>
            </div>
          </div>
        </aside>

        <section className="courseMain">

          <div className="premiumVideo">
            <div className="videoTopbar">
              <div>
                <span className="liveDot"></span>
                LEÇON {String(currentIndex + 1).padStart(2, "0")}
              </div>

              <span>
                <Clock size={14}/>
                {selected.duration || "Vidéo"}
              </span>
            </div>

            <div className="premiumVideoFrame">
            {Array.isArray(selected.videos) && selected.videos.length > 0 ? (
              <div style={{ display: "grid", gap: "20px" }}>
                {selected.videos.map((video, index) => (
                  <div key={video.id || `${selected.id}-${index}`}>
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      src={video.url}
                      style={{
                        width: "100%",
                        display: "block",
                        borderRadius: "16px",
                        background: "#000"
                      }}
                      onError={(event) => {
                        console.error(
                          "FCS VIDEO ERROR",
                          video,
                          event.currentTarget.error
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="videoPlaceholder">
                <div className="bigPlay">
                  <PlaySquare size={42}/>
                </div>
                <strong>Vidéo de la leçon</strong>
                <span>La vidéo sera ajoutée ici</span>
              </div>
            )}
          </div>
        </div>

          <div className="premiumLessonCard">

            <div className="lessonHeading">
              <div>
                <span className="lessonTag">
                  LEÇON {String(currentIndex + 1).padStart(2, "0")}
                </span>

                <h2>{selected.title}</h2>

                <p>
                  {selected.description ||
                    "Retrouve dans cette leçon les concepts, explications et applications pratiques nécessaires pour intégrer cette thématique à ton modèle d'entraînement."}
                </p>
              </div>

              <button
                className={`lessonComplete ${isDone ? "isComplete" : ""}`}
                onClick={() => toggleCompleted(selected.id)}
              >
                <CheckCircle2 size={19}/>
                {isDone ? "Leçon terminée" : "Marquer comme terminée"}
              </button>
            </div>

            {/* FCS_LESSON_SIDEBAR_V1 */}
      <div className="fcsLessonSidebar" style={{ marginBottom: "22px" }}>
        <div className="fcsLessonSidebarHeader">
          <strong>Parcours du module</strong>
          <span>
            {module.lessons.length} leçons · {progress}% terminé
          </span>
        </div>

        <div className="fcsLessonList">
          {module.lessons.map((lesson, index) => {
            const lessonDone = completed.includes(lesson.id);
            const lessonActive = lesson.id === selected.id;

            return (
              <button
                key={lesson.id}
                type="button"
                className={[
                  "fcsLessonItem",
                  lessonActive ? "active" : "",
                  lessonDone ? "done" : ""
                ].filter(Boolean).join(" ")}
                onClick={() => selectLesson(lesson.id)}
              >
                <span className="fcsLessonNumber">
                  {lessonDone ? "✓" : index + 1}
                </span>

                <span className="fcsLessonItemTitle">
                  {lesson.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="contentTabs">

              <button
                className={activeTab === "contenu" ? "activeTab" : ""}
                onClick={() => setActiveTab("contenu")}
              >
                Contenu
              </button>

              <button
                className={activeTab === "ressources" ? "activeTab" : ""}
                onClick={() => setActiveTab("ressources")}
              >
                Ressources
              </button>

              <button
                className={activeTab === "notes" ? "activeTab" : ""}
                onClick={() => setActiveTab("notes")}
              >
                Notes
              </button>

            </div>

            {activeTab === "contenu" && (
              <div className="lessonBody">
                <h3>À propos de cette leçon</h3>

                <p>
                  {selected.description ||
                    "Visionne la vidéo et utilise les différents supports de cette leçon avant de poursuivre ta progression."}
                </p>

                <div className="lessonObjective">
                  <BadgeCheck size={20}/>
                  <div>
                    <strong>Objectif de la leçon</strong>
                    <span>
                      Comprendre les concepts présentés et être capable
                      de les appliquer concrètement sur le terrain.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="lessonNotesPanel">
                <div className="notesHeader">
                  <div>
                    <span>NOTES PERSONNELLES</span>
                    <h3>Mes notes</h3>
                  </div>

                  <small>Sauvegarde automatique</small>
                </div>

                <textarea
                  value={notes[selected.id] || ""}
                  onChange={e => saveNote(e.target.value)}
                  placeholder="Écris ici tes idées, points importants, adaptations pour ton équipe..."
                />

                <div className="notesSaved">
                  <CheckCircle2 size={15}/>
                  Tes notes sont enregistrées sur cet appareil.
                </div>
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="realQuizPanel">

                <div className="realQuizHeader">
                  <div>
                    <span className="quizEyebrow">
                      QUIZ DE VALIDATION
                    </span>

                    <h3>{selected.title}</h3>

                    <p>
                      Réponds aux questions puis valide ton quiz.
                      Un score minimum de 70 % est nécessaire pour
                      réussir.
                    </p>
                  </div>

                  {quizResults[selected.id] && (
                    <div
                      className={`previousQuizScore ${
                        quizResults[selected.id].passed
                          ? "quizPassed"
                          : ""
                      }`}
                    >
                      <small>MEILLEUR RÉSULTAT</small>
                      <strong>
                        {quizResults[selected.id].score}%
                      </strong>
                    </div>
                  )}
                </div>

                {!currentQuiz.length ? (
                  <div className="emptyQuiz">
                    <BadgeCheck size={32}/>
                    <strong>Quiz à venir</strong>
                    <span>
                      Les questions de cette leçon seront ajoutées ici.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="quizQuestions">

                      {currentQuiz.map((question, questionIndex) => (
                        <div
                          className="quizQuestionCard"
                          key={question.id}
                        >
                          <div className="quizQuestionTop">
                            <span>
                              QUESTION {questionIndex + 1}
                            </span>

                            <small>
                              {questionIndex + 1}/{currentQuiz.length}
                            </small>
                          </div>

                          <h4>{question.question}</h4>

                          <div className="quizOptions">

                            {question.options.map(
                              (option, optionIndex) => {

                                const selectedAnswer =
                                  quizAnswers[question.id] ===
                                  optionIndex;

                                const isCorrect =
                                  question.correct === optionIndex;

                                let optionClass = "";

                                if (selectedAnswer) {
                                  optionClass = "quizOptionSelected";
                                }

                                if (quizSubmitted && isCorrect) {
                                  optionClass = "quizOptionCorrect";
                                }

                                if (
                                  quizSubmitted &&
                                  selectedAnswer &&
                                  !isCorrect
                                ) {
                                  optionClass = "quizOptionWrong";
                                }

                                return (
                                  <button
                                    key={optionIndex}
                                    className={`quizOption ${optionClass}`}
                                    onClick={() =>
                                      chooseQuizAnswer(
                                        question.id,
                                        optionIndex
                                      )
                                    }
                                    disabled={quizSubmitted}
                                  >
                                    <span className="quizLetter">
                                      {String.fromCharCode(
                                        65 + optionIndex
                                      )}
                                    </span>

                                    <strong>{option}</strong>

                                    {quizSubmitted && isCorrect && (
                                      <CheckCircle2 size={18}/>
                                    )}
                                  </button>
                                );
                              }
                            )}

                          </div>
                        </div>
                      ))}

                    </div>

                    {resourceMessage && (
                      <div className="quizWarning">
                        <Circle size={16}/>
                        {resourceMessage}
                      </div>
                    )}

                    {!quizSubmitted ? (
                      <div className="quizSubmitArea">

                        <div>
                          <strong>
                            {Object.keys(quizAnswers).length}
                            /{currentQuiz.length}
                          </strong>
                          <span>questions répondues</span>
                        </div>

                        <button
                          className="quizSubmitButton"
                          onClick={submitQuiz}
                        >
                          Valider mon quiz
                          <ArrowRight size={18}/>
                        </button>

                      </div>
                    ) : (
                      <div
                        className={`quizResult ${
                          quizResults[selected.id]?.passed
                            ? "quizResultPassed"
                            : "quizResultFailed"
                        }`}
                      >
                        <div className="quizResultIcon">
                          {quizResults[selected.id]?.passed
                            ? <Trophy size={31}/>
                            : <BadgeCheck size={31}/>
                          }
                        </div>

                        <div className="quizResultText">

                          <span>
                            {quizResults[selected.id]?.passed
                              ? "QUIZ RÉUSSI"
                              : "À RETRAVAILLER"
                            }
                          </span>

                          <h3>
                            {quizResults[selected.id]?.score}%
                          </h3>

                          <p>
                            {
                              quizResults[selected.id]?.correct
                            } bonne
                            {
                              quizResults[selected.id]?.correct > 1
                                ? "s réponses"
                                : " réponse"
                            } sur {currentQuiz.length}.
                          </p>

                        </div>

                        <button
                          className="restartQuizButton"
                          onClick={restartQuiz}
                        >
                          Recommencer
                        </button>

                      </div>
                    )}
                  </>
                )}

              </div>
            )}

            {(activeTab === "contenu" ||
              activeTab === "ressources") && (

            <div className="resourceSection">
              <div className="resourceTitle">
                <div>
                  <span>SUPPORTS</span>
                  <h3>Ressources de la leçon</h3>
                </div>
                <small>{resources.length} ressources</small>
              </div>

              <div className="premiumResources">

                <button
                  className="premiumResource powerpointResource"
                  onClick={() => openResource("powerpoint")}
                >
                  <div className="resourceIcon">
                    <BarChart3 size={23}/>
                  </div>
                  <div className="resourceCopy">
                    <span>POWERPOINT</span>
                    <strong>PowerPoint de la leçon</strong>
                    <small>Support de présentation</small>
                  </div>
                  <div className="resourceAction">
                    Télécharger
                    <ArrowRight size={15}/>
                  </div>
                </button>

                <button
                  className="premiumResource pdfResource"
                  onClick={() => openResource("pdf")}
                >
                  <div className="resourceIcon">
                    <FileText size={23}/>
                  </div>
                  <div className="resourceCopy">
                    <span>DOCUMENT</span>
                    <strong>Fiche pratique PDF</strong>
                    <small>À conserver avec toi</small>
                  </div>
                  <div className="resourceAction">
                    Télécharger
                    <ArrowRight size={15}/>
                  </div>
                </button>

                <button
                  className="premiumResource quizResource"
                  onClick={openQuiz}
                >
                  <div className="resourceIcon">
                    <BadgeCheck size={23}/>
                  </div>
                  <div className="resourceCopy">
                    <span>QUIZ</span>
                    <strong>Quiz de validation</strong>
                    <small>Teste tes connaissances</small>
                  </div>
                  <div className="resourceAction">
                    Faire le quiz
                    <ArrowRight size={15}/>
                  </div>
                </button>

                <button
                  className="premiumResource workResource"
                  onClick={() => openResource("document")}
                >
                  <div className="resourceIcon">
                    <ClipboardList size={23}/>
                  </div>
                  <div className="resourceCopy">
                    <span>EXERCICE</span>
                    <strong>Document de travail</strong>
                    <small>Template à compléter</small>
                  </div>
                  <div className="resourceAction">
                    Ouvrir
                    <ArrowRight size={15}/>
                  </div>
                </button>

              </div>

              {resourceMessage && (
                <div className="resourceMessage">
                  <FileText size={17}/>
                  {resourceMessage}
                </div>
              )}

            </div>
            )}

            <div className="courseNavigation">

              <button
                className="previousLesson"
                onClick={goPrevious}
                disabled={!previousLesson}
              >
                <ArrowLeft size={18}/>
                <div>
                  <small>PRÉCÉDENTE</small>
                  <strong>
                    {previousLesson
                      ? previousLesson.title
                      : "Première leçon"}
                  </strong>
                </div>
              </button>

              <button
                className="nextLesson"
                onClick={goNext}
                disabled={!nextLesson}
              >
                <div>
                  <small>SUIVANTE</small>
                  <strong>
                    {nextLesson
                      ? nextLesson.title
                      : "Module terminé"}
                  </strong>
                </div>
                <ArrowRight size={18}/>
              </button>

            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

function PlatformPlaceholder({ title, eyebrow, description, children }) {
  return (
    <div className="mainContent" style={{ padding: "32px" }}>
      <div
        style={{
          background: "#0b2945",
          color: "#fff",
          borderRadius: "24px",
          padding: "42px",
          marginBottom: "28px"
        }}
      >
        <div
          style={{
            color: "#f4bd32",
            fontWeight: 800,
            letterSpacing: "2px",
            fontSize: "12px",
            marginBottom: "10px"
          }}
        >
          {eyebrow}
        </div>

        <h1 style={{ margin: 0, fontSize: "38px" }}>
          {title}
        </h1>

        <p
          style={{
            margin: "12px 0 0",
            opacity: 0.82,
            fontSize: "16px"
          }}
        >
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function PlatformCard({ icon, title, description, action, onClick, meta }) {

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "1px solid #e5e9ef",
        background: "#fff",
        borderRadius: "18px",
        padding: "24px",
        textAlign: "left",
        cursor: "pointer",
        minHeight: "170px",
        boxShadow: "0 8px 24px rgba(0,0,0,.05)",
        transition: "transform .15s ease, box-shadow .15s ease"
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}
      >
        <div style={{ fontSize: "30px" }}>
          {icon}
        </div>

        {meta && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#b07b00",
              background: "#fff5d8",
              padding: "6px 9px",
              borderRadius: "999px"
            }}
          >
            {meta}
          </span>
        )}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "15px",
          fontSize: "18px",
          color: "#09233d"
        }}
      >
        {title}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: "7px",
          color: "#6b7a8c",
          lineHeight: 1.5
        }}
      >
        {description}
      </span>

      {action && (
        <div
          style={{
            marginTop: "15px",
            fontWeight: 800,
            color: "#b07b00",
            fontSize: "14px"
          }}
        >
          {action} →
        </div>
      )}

    </button>
  );
}

function PlatformHome({ navigate, modules, completed }) {

  const lessons = modules.flatMap(m => m.lessons || []);

  const completedCount = lessons.filter(l =>
    completed.includes(l.id)
  ).length;

  const progress = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  const cards = [
    [
      "🎓",
      "Mes formations",
      "Retrouve ton parcours et reprends ta formation là où tu l'as laissée.",
      "formations",
      `${progress}%`
    ],
    [
      "📚",
      "Modules",
      "Explore les modules, les leçons et la progression de chaque partie.",
      "modules",
      `${modules.length} modules`
    ],
    [
      "🎬",
      "Vidéos",
      "Accède à la bibliothèque vidéo de Football Coach System.",
      "videos",
      "Bibliothèque"
    ],
    [
      "📄",
      "Documents & Templates",
      "Fiches, modèles, supports et ressources téléchargeables.",
      "documents",
      "Ressources"
    ],
    [
      "👥",
      "Communauté",
      "Échange avec les autres entraîneurs et partage ton expérience.",
      "community",
      "Espace membre"
    ],
    [
      "📅",
      "Lives & Webinaires",
      "Retrouve les prochains rendez-vous et les replays.",
      "lives",
      "Événements"
    ],
    [
      "📊",
      "Mon suivi",
      "Visualise ton activité et ta progression globale.",
      "tracking",
      `${completedCount}/${lessons.length}`
    ],
    [
      "🏆",
      "Certificat",
      "Suis ton avancement vers la validation de ta formation.",
      "certificates",
      progress >= 100 ? "Disponible" : "En cours"
    ]
  ];

  return (
    <PlatformPlaceholder
      eyebrow="FOOTBALL COACH SYSTEM"
      title="Bienvenue dans ta plateforme"
      description="Tout ton parcours d'entraîneur au même endroit."
    >

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e9ef",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "24px"
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <strong
              style={{
                color: "#09233d",
                fontSize: "20px"
              }}
            >
              Ta progression
            </strong>

            <div
              style={{
                marginTop: "6px",
                color: "#6b7a8c"
              }}
            >
              {completedCount} leçons terminées sur {lessons.length}
            </div>
          </div>

          <strong
            style={{
              fontSize: "28px",
              color: "#b07b00"
            }}
          >
            {progress}%
          </strong>
        </div>

        <div
          style={{
            height: "9px",
            background: "#edf0f3",
            borderRadius: "999px",
            overflow: "hidden",
            marginTop: "18px"
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#f1bd3e"
            }}
          />
        </div>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px"
        }}
      >

        {cards.map(([icon, title, description, route, meta]) => (
          <PlatformCard
            key={route}
            icon={icon}
            title={title}
            description={description}
            meta={meta}
            action="Ouvrir"
            onClick={() => navigate(route)}
          />
        ))}

      </div>

    </PlatformPlaceholder>
  );
}


function FormationManager({ initialModules = [] }) {
  const [editingLesson, setEditingLesson] = useState(null);
  const [modules, setModules] = useState(
    Array.isArray(initialModules) ? initialModules : []
  );
  const [loading, setLoading] = useState(false);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState(null);
  const [contentLessonId, setContentLessonId] = useState(null);

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    image: ""
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: ""
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    url: "",
    duration: 0
  });

  const [resourceForm, setResourceForm] = useState({
    type: "pdf",
    title: "",
    url: "",
    content: ""
  });

  async function refresh() {
    try {
      const [modulesResponse, lessonsResponse] = await Promise.all([
        fetch("/api/admin/modules", {
          credentials: "include"
        }),
        fetch("/api/admin/lessons", {
          credentials: "include"
        })
      ]);

      const modulesData = await modulesResponse.json();
      const lessonsData = await lessonsResponse.json();

      if (!modulesResponse.ok) {
        throw new Error(
          modulesData.error || "Impossible de charger les modules."
        );
      }

      if (!lessonsResponse.ok) {
        throw new Error(
          lessonsData.error || "Impossible de charger les leçons."
        );
      }

      const apiModules = Array.isArray(modulesData.modules)
        ? modulesData.modules
        : [];

      const apiLessons = Array.isArray(lessonsData.lessons)
        ? lessonsData.lessons
        : [];

      const lessonsByModule = {};

      for (const lesson of apiLessons) {
        if (!lessonsByModule[lesson.module_id]) {
          lessonsByModule[lesson.module_id] = [];
        }

        lessonsByModule[lesson.module_id].push({
          id: lesson.id,
          lesson_key: lesson.lesson_key,
          title: lesson.title,
          description: lesson.description || "",
          position: lesson.position || 0,
          published: lesson.published,
          videos: [],
          resources: []
        });
      }

      const normalizedModules = apiModules.map(module => ({
        ...module,
        lessons: lessonsByModule[module.id] || []
      }));

      setModules(normalizedModules);

      console.log(
        "✅ CMS ADMIN :",
        normalizedModules.length,
        "modules /",
        normalizedModules.reduce(
          (total, module) =>
            total + (module.lessons?.length || 0),
          0
        ),
        "leçons"
      );

    } catch (error) {
      console.error("CMS refresh error:", error);
      alert(error.message || "Impossible de charger le CMS.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createModule(event) {
    event.preventDefault();

    if (!moduleForm.title.trim()) return;

    setLoading(true);

    try {
      const nextNumber = modules.length
        ? Math.max(
            ...modules.map(m => Number(m.number) || 0)
          ) + 1
        : 1;

      const response = await fetch("/api/admin/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          formation_id: 1,
          module_key: `m${nextNumber}`,
          number: String(nextNumber),
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim(),
          image: moduleForm.image.trim(),
          position: nextNumber
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur création module");
      }

      setModuleForm({
        title: "",
        description: "",
        image: ""
      });

      setShowModuleForm(false);
      await refresh();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createLesson(event, module) {
    event.preventDefault();

    if (!lessonForm.title.trim()) return;

    setLoading(true);

    try {
      const nextPosition =
        (module.lessons?.length || 0) + 1;

      const lessonKey =
        `${module.module_key}-l${nextPosition}`;

      const response = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          module_id: module.id,
          lesson_key: lessonKey,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim(),
          position: nextPosition
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur création séance");
      }

      setLessonForm({
        title: "",
        description: ""
      });

      setLessonModuleId(null);
      await refresh();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createVideo(event, lesson) {
    event.preventDefault();

    if (!videoForm.title.trim() || !videoForm.url.trim()) {
      return;
    }

    setLoading(true);

    try {
      const nextPosition =
        (lesson.videos?.length || 0) + 1;

      const response = await fetch("/api/admin/videos", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          title: videoForm.title.trim(),
          url: videoForm.url.trim(),
          position: nextPosition,
          duration: Number(videoForm.duration) || 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur ajout vidéo");
      }

      setVideoForm({
        title: "",
        url: "",
        duration: 0
      });

      setContentLessonId(null);
      await refresh();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createResource(event, lesson) {
    event.preventDefault();

    if (!resourceForm.title.trim()) return;

    setLoading(true);

    try {
      const nextPosition =
        (lesson.resources?.length || 0) + 1;

      const response = await fetch("/api/admin/resources", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          type: resourceForm.type,
          title: resourceForm.title.trim(),
          url: resourceForm.url.trim(),
          content: resourceForm.content.trim(),
          position: nextPosition
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur ajout support");
      }

      setResourceForm({
        type: "pdf",
        title: "",
        url: "",
        content: ""
      });

      setContentLessonId(null);
      await refresh();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Erreur déconnexion :", error);
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <section className="platformPage formationManagerPremium">
      <div className="managerHero">
        <div className="managerHeroInner">
        <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          gap: "20px"
        }}
      >
        <div>
          <div className="eyebrow">ADMINISTRATION</div>
          <h1>Structure de la formation</h1>
          <p>
            Construis tes modules, tes séances et leurs contenus
            directement depuis la plateforme.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          <button
            className="primaryButton"
            onClick={() => setShowModuleForm(v => !v)}
          >
            + Ajouter un module
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "11px 16px",
              borderRadius: "10px",
              border: "1px solid #dfe5eb",
              background: "#fff",
              color: "#34495e",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

        </div>
      </div>

      {showModuleForm && (
        <form
          onSubmit={createModule}
          className="premiumLessonCard"
          style={{ marginBottom: "24px" }}
        >
          <h2>Nouveau module</h2>

          <input
            placeholder="Titre du module"
            value={moduleForm.title}
            onChange={e =>
              setModuleForm({
                ...moduleForm,
                title: e.target.value
              })
            }
          />

          <textarea
            placeholder="Description"
            value={moduleForm.description}
            onChange={e =>
              setModuleForm({
                ...moduleForm,
                description: e.target.value
              })
            }
          />

          <input
            placeholder="URL de l'image (optionnel)"
            value={moduleForm.image}
            onChange={e =>
              setModuleForm({
                ...moduleForm,
                image: e.target.value
              })
            }
          />

          <button
            className="primaryButton"
            type="submit"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Créer le module"}
          </button>
        </form>
      )}

      <div className="managerModules">
        {modules.map((module, moduleIndex) => (
          <div
            key={module.id}
            className="managerModule premiumLessonCard"
          >
            <div className="managerModuleHeader">
              <div className="managerModuleTitle">
                <div className="moduleNumber">
                  {String(module.number || moduleIndex + 1).padStart(2, "0")}
                </div>
                <div>
                <span className="lessonTag">
                  MODULE {module.number || moduleIndex + 1}
                </span>

                <h2>{module.title}</h2>

                {module.description && (
                  <p>{module.description}</p>
                )}
                </div>
              </div>

              <button
                className="secondaryButton"
                onClick={() =>
                  setLessonModuleId(
                    lessonModuleId === module.id
                      ? null
                      : module.id
                  )
                }
              >
                + Ajouter une séance
              </button>
            </div>

            {lessonModuleId === module.id && (
              <form
                onSubmit={e => createLesson(e, module)}
                style={{
                  marginTop: "22px",
                  padding: "20px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,.04)"
                }}
              >
                <h3>Nouvelle séance</h3>

                <input
                  placeholder="Titre de la séance"
                  value={lessonForm.title}
                  onChange={e =>
                    setLessonForm({
                      ...lessonForm,
                      title: e.target.value
                    })
                  }
                />

                <textarea
                  placeholder="Description"
                  value={lessonForm.description}
                  onChange={e =>
                    setLessonForm({
                      ...lessonForm,
                      description: e.target.value
                    })
                  }
                />

                <button
                  className="primaryButton"
                  type="submit"
                  disabled={loading}
                >
                  Créer la séance
                </button>
              </form>
            )}

            <div className="managerLessons">
              {(module.lessons || []).map((lesson, lessonIndex) => (
                <div
                  key={lesson.id}
                  className="managerLesson"
                >
                  <div className="lessonIdentityRow">
                    <div className="lessonIdentity">
                      <div className="lessonNumber">
                        {String(lesson.position || lessonIndex + 1).padStart(2, "0")}
                      </div>
                      <div>
                      <strong>
                        {String(lesson.position || lessonIndex + 1).padStart(2, "0")}
                        {" — "}
                        {lesson.title}
                      </strong>

                      <div className="lessonMeta">
                        <span className="contentBadge video">
                          {(lesson.videos || []).length} vidéo(s)
                        </span>
                        <span className="contentBadge document">
                          {(lesson.resources || []).length} support(s)
                        </span>
                      </div>
                      </div>
                    </div>

                    <button
                      className="primaryButton"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      Gérer le contenu
                    </button>
                  </div>

                  {contentLessonId === lesson.id && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(280px,1fr))",
                        gap: "18px",
                        marginTop: "18px"
                      }}
                    >
                      <form
                        onSubmit={e => createVideo(e, lesson)}
                        style={{
                          padding: "18px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,.04)"
                        }}
                      >
                        <h4>🎬 Ajouter une vidéo</h4>

                        <input
                          placeholder="Titre"
                          value={videoForm.title}
                          onChange={e =>
                            setVideoForm({
                              ...videoForm,
                              title: e.target.value
                            })
                          }
                        />

                        <input
                          placeholder="URL de la vidéo"
                          value={videoForm.url}
                          onChange={e =>
                            setVideoForm({
                              ...videoForm,
                              url: e.target.value
                            })
                          }
                        />

                        <input
                          type="number"
                          placeholder="Durée en secondes"
                          value={videoForm.duration}
                          onChange={e =>
                            setVideoForm({
                              ...videoForm,
                              duration: e.target.value
                            })
                          }
                        />

                        <button
                          className="primaryButton"
                          type="submit"
                          disabled={loading}
                        >
                          Ajouter la vidéo
                        </button>
                      </form>

                      <form
                        onSubmit={e => createResource(e, lesson)}
                        style={{
                          padding: "18px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,.04)"
                        }}
                      >
                        <h4>📄 Ajouter un support</h4>

                        <select
                          value={resourceForm.type}
                          onChange={e =>
                            setResourceForm({
                              ...resourceForm,
                              type: e.target.value
                            })
                          }
                        >
                          <option value="pdf">PDF</option>
                          <option value="powerpoint">
                            PowerPoint
                          </option>
                          <option value="document">
                            Document
                          </option>
                          <option value="link">
                            Lien externe
                          </option>
                          <option value="text">
                            Texte
                          </option>
                        </select>

                        <input
                          placeholder="Titre"
                          value={resourceForm.title}
                          onChange={e =>
                            setResourceForm({
                              ...resourceForm,
                              title: e.target.value
                            })
                          }
                        />

                        <input
                          placeholder="URL du document"
                          value={resourceForm.url}
                          onChange={e =>
                            setResourceForm({
                              ...resourceForm,
                              url: e.target.value
                            })
                          }
                        />

                        <textarea
                          placeholder="Contenu / description (optionnel)"
                          value={resourceForm.content}
                          onChange={e =>
                            setResourceForm({
                              ...resourceForm,
                              content: e.target.value
                            })
                          }
                        />

                        <button
                          className="primaryButton"
                          type="submit"
                          disabled={loading}
                        >
                          Ajouter le support
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {editingLesson && (
        <LessonEditor
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSaved={() => {
            setEditingLesson(null);
            window.location.reload();
          }}
        />
      )}

    </section>
  );
}


function LessonEditor({ lesson, onClose, onSaved }) {
  const [title, setTitle] = useState(lesson.title || "");
  const [description, setDescription] = useState(
    lesson.description || ""
  );
  const [published, setPublished] = useState(
    lesson.published !== 0
  );
  const [saving, setSaving] = useState(false);

  async function deleteVideo(videoId) {
    if (!videoId) {
      alert("Impossible de supprimer cette vidéo : ID manquant.");
      return;
    }

    if (!window.confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
      return;
    }

    try {
      const response = await fetch(
        ("http" + ":" + "/" + "/" + "localhost" + ":" + "3001/api/admin/videos/" + videoId),
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de supprimer la vidéo."
        );
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      alert(error.message);
    }
  }

  async function saveLesson() {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/lessons/${lesson.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title,
            description,
            published: published ? 1 : 0
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Impossible d'enregistrer la séance"
        );
      }

      if (onSaved) {
        await onSaved();
      }

      alert("Séance enregistrée.");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(7,29,53,.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end"
      }}
    >
      <aside
        style={{
          width: "min(620px, 100%)",
          height: "100%",
          background: "#fff",
          overflowY: "auto",
          padding: "34px",
          boxSizing: "border-box",
          boxShadow: "-20px 0 60px rgba(0,0,0,.18)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px"
          }}
        >
          <div>
            <span className="lessonTag">
              ÉDITEUR DE SÉANCE
            </span>
            <h2 style={{ margin: "8px 0 0" }}>
              {lesson.title}
            </h2>
          </div>

          <button
            className="secondaryButton"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: "20px"
          }}
        >
          <label>
            <strong>Titre de la séance</strong>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </label>

          <label>
            <strong>Description</strong>
            <textarea
              rows={5}
              value={description}
              onChange={e =>
                setDescription(e.target.value)
              }
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <input
              type="checkbox"
              checked={published}
              onChange={e =>
                setPublished(e.target.checked)
              }
              style={{
                width: "18px",
                height: "18px"
              }}
            />
            <strong>Séance publiée</strong>
          </label>

          <LessonContentManager
            lesson={lesson}
            onSaved={onSaved}
          />

          <button
            className="primaryButton"
            onClick={saveLesson}
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer la séance"}
          </button>
        </div>
      </aside>
    </div>
  );
}



function LessonContentManager({ lesson, onSaved }) {
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  async function deleteVideo(videoId) {
    if (!videoId) {
      alert("Impossible de supprimer cette vidéo : ID manquant.");
      return;
    }

    if (!window.confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
      return;
    }

    try {
      const api = "http" + ":" + "/" + "/" + "localhost" + ":" + "3001";

      const response = await fetch(
        api + "/api/admin/videos/" + videoId,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Impossible de supprimer la vidéo."
        );
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      alert(error.message);
    }
  }


  const [video, setVideo] = useState({
    title: "",
    url: "",
    duration: "",
    file: null
  });

  const [resource, setResource] = useState({
    type: "pdf",
    title: "",
    url: "",
    content: "",
    file: null
  });

  async function addVideo(event) {
    event.preventDefault();

    if (!video.title.trim()) {
      alert("Le titre de la vidéo est requis.");
      return;
    }

    if (!video.file && !video.url.trim()) {
      alert("Sélectionne un fichier MP4 ou renseigne une URL externe.");
      return;
    }

    setSaving(true);

    try {
      let videoUrl = video.url.trim();

      // ---------------------------------------------------
      // Upload MP4
      // ---------------------------------------------------

      if (video.file) {
        const formData = new FormData();

        formData.append("video", video.file);

        const uploadResponse = await fetch(
          "/api/admin/video-upload",
          {
            method: "POST",
            credentials: "include",
            body: formData
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(
            uploadData.error ||
            "Impossible d'importer la vidéo."
          );
        }

        videoUrl = uploadData.url;
      }

      // ---------------------------------------------------
      // Enregistrement dans le CMS
      // ---------------------------------------------------

      const response = await fetch(
        "/api/admin/videos",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            lesson_id: lesson.id,
            title: video.title.trim(),
            url: videoUrl,
            duration: Number(video.duration) || 0,
            position: (lesson.videos?.length || 0) + 1
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          "Impossible d'enregistrer la vidéo."
        );
      }

      setVideo({
        title: "",
        url: "",
        duration: "",
        file: null
      });

      setMode(null);

      if (onSaved) {
        await onSaved();
      }

    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addResource(event) {
    event.preventDefault();

    if (!resource.title.trim()) {
      alert("Merci d'indiquer un titre pour le support.");
      return;
    }

    if (!resource.file && !resource.url.trim()) {
      alert("Sélectionne un fichier ou indique une URL.");
      return;
    }

    setSaving(true);

    try {
      let resourceUrl = resource.url.trim();

      // ==================================================
      // UPLOAD DU FICHIER
      // ==================================================

      if (resource.file) {
        const formData = new FormData();

        formData.append(
          "document",
          resource.file
        );

        const uploadResponse = await fetch(
          "/api/admin/document-upload",
          {
            method: "POST",
            credentials: "include",
            body: formData
          }
        );

        const uploadData =
          await uploadResponse.json();

        if (
          !uploadResponse.ok ||
          !uploadData.success
        ) {
          throw new Error(
            uploadData.error ||
            "Impossible d'importer le document."
          );
        }

        resourceUrl = uploadData.url;
      }

      // ==================================================
      // ENREGISTREMENT CMS
      // ==================================================

      const response = await fetch(
        "/api/admin/resources",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            lesson_id: lesson.id,
            type: resource.type,
            title: resource.title.trim(),
            url: resourceUrl,
            content: resource.content.trim(),
            position:
              (lesson.resources?.length || 0) + 1
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Impossible d'ajouter le support."
        );
      }

      setResource({
        type: "pdf",
        title: "",
        url: "",
        content: "",
        file: null
      });

      setMode(null);

      if (onSaved) {
        await onSaved();
      }

    } catch (error) {
      console.error(
        "Erreur ajout support :",
        error
      );

      alert(
        error.message ||
        "Impossible d'ajouter le support."
      );

    } finally {
      setSaving(false);
    }
  }


  return (
    <div
      style={{
        marginTop: "24px",
        padding: "22px",
        borderRadius: "18px",
        background: "#f7f9fb",
        border: "1px solid #e5eaf0"
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <strong style={{ fontSize: "18px" }}>
          Contenus de la séance
        </strong>

        <div
          style={{
            marginTop: "5px",
            color: "#7b8797",
            fontSize: "14px"
          }}
        >
          Ajoute et organise les contenus accessibles aux élèves.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px"
        }}
      >
        {(lesson.videos || []).map((item, index) => (
          <div
            key={`video-${item.id || index}`}
            style={{
              padding: "14px 16px",
              background: "#fff",
              border: "1px solid #e5eaf0",
              borderRadius: "12px"
            }}
          >
            <div>
              <strong>🎬 {item.title}</strong>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "13px",
                  color: "#7b8797"
                }}
              >
                Vidéo {index + 1}
                {item.duration
                  ? ` · ${item.duration} min`
                  : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() => deleteVideo(item.id)}
              style={{
                border: "1px solid #f0caca",
                background: "#fff5f5",
                color: "#c0392b",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 600,
                flexShrink: 0
              }}
            >
              🗑️ Supprimer
            </button>
          </div>
        ))}

        {(lesson.resources || []).map((item, index) => (
          <div
            key={`resource-${item.id || index}`}
            style={{
              padding: "14px 16px",
              background: "#fff",
              border: "1px solid #e5eaf0",
              borderRadius: "12px"
            }}
          >
            <strong>📄 {item.title}</strong>

            <div
              style={{
                marginTop: "4px",
                fontSize: "13px",
                color: "#7b8797"
              }}
            >
              {item.type || "document"}
              {index >= 0 ? ` · Support ${index + 1}` : ""}
            </div>
          </div>
        ))}

        {!lesson.videos?.length &&
          !lesson.resources?.length && (
            <div
              style={{
                padding: "12px 0",
                color: "#7b8797"
              }}
            >
              Aucun contenu ajouté pour le moment.
            </div>
          )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: "10px",
          marginTop: "18px"
        }}
      >
        <button
          type="button"
          className="primaryButton"
          onClick={() =>
            setMode(mode === "video" ? null : "video")
          }
        >
          + Ajouter une vidéo
        </button>

        <button
          type="button"
          className="secondaryButton"
          onClick={() =>
            setMode(mode === "resource" ? null : "resource")
          }
        >
          + Ajouter un support
        </button>
      </div>

      {mode === "video" && (
        <form
          onSubmit={addVideo}
          style={{
            marginTop: "18px",
            padding: "18px",
            background: "#fff",
            borderRadius: "14px",
            border: "1px solid #e5eaf0",
            display: "grid",
            gap: "12px"
          }}
        >
          <strong>🎬 Nouvelle vidéo</strong>

          <input
            placeholder="Titre de la vidéo"
            value={video.title}
            onChange={e =>
              setVideo({
                ...video,
                title: e.target.value
              })
            }
          />

          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#f7f9fb",
              border: "1px solid #e5eaf0"
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "10px"
              }}
            >
              📁 Importer une vidéo MP4
            </strong>

            <input
              type="file"
              accept="video/mp4,.mp4"
              onChange={e =>
                setVideo({
                  ...video,
                  file: e.target.files?.[0] || null,
                  url: ""
                })
              }
            />

            {video.file && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "#5f6b7a"
                }}
              >
                ✓ {video.file.name}
                {" · "}
                {(video.file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            )}
          </div>

          <div
            style={{
              textAlign: "center",
              color: "#8a95a5",
              fontSize: "13px"
            }}
          >
            ou utiliser une URL externe
          </div>

          <input
            placeholder="URL externe de la vidéo"
            value={video.url}
            disabled={Boolean(video.file)}
            onChange={e =>
              setVideo({
                ...video,
                url: e.target.value,
                file: null
              })
            }
          />

          <input
            type="number"
            min="0"
            placeholder="Durée en minutes"
            value={video.duration}
            onChange={e =>
              setVideo({
                ...video,
                duration: e.target.value
              })
            }
          />

          <button
            className="primaryButton"
            type="submit"
            disabled={saving}
          >
            {saving ? "Ajout..." : "Ajouter la vidéo"}
          </button>
        </form>
      )}

      {mode === "resource" && (
        <form
          onSubmit={addResource}
          style={{
            marginTop: "18px",
            padding: "18px",
            background: "#fff",
            borderRadius: "14px",
            border: "1px solid #e5eaf0",
            display: "grid",
            gap: "12px"
          }}
        >
          <strong>📄 Nouveau support</strong>

          <select
            value={resource.type}
            onChange={e =>
              setResource({
                ...resource,
                type: e.target.value
              })
            }
          >
            <option value="pdf">PDF</option>
            <option value="powerpoint">PowerPoint</option>
            <option value="document">Document</option>
            <option value="link">Lien externe</option>
            <option value="text">Texte</option>
          </select>

          <input
            placeholder="Titre du support"
            value={resource.title}
            onChange={e =>
              setResource({
                ...resource,
                title: e.target.value
              })
            }
          />

          <div
            style={{
              padding: "16px",
              background: "#f7f9fb",
              border: "1px solid #e5eaf0",
              borderRadius: "12px"
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "10px",
                color: "#09233d"
              }}
            >
              📎 Fichier du support
            </strong>

            <input
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
              onChange={e => {
                const file =
                  e.target.files?.[0] || null;

                setResource({
                  ...resource,
                  file
                });
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                background: "#fff",
                border: "1px solid #dfe5eb",
                borderRadius: "10px",
                cursor: "pointer"
              }}
            />

            {resource.file && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 12px",
                  background: "#fff",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#34495e"
                }}
              >
                ✓ <strong>{resource.file.name}</strong>
              </div>
            )}
          </div>

          <div
            style={{
              textAlign: "center",
              color: "#7b8797",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            OU utiliser un lien externe
          </div>

          <input
            placeholder="URL du fichier ou du lien"
            value={resource.url}
            onChange={e =>
              setResource({
                ...resource,
                url: e.target.value
              })
            }
          />

          <textarea
            rows="4"
            placeholder="Description / contenu"
            value={resource.content}
            onChange={e =>
              setResource({
                ...resource,
                content: e.target.value
              })
            }
          />

          <button
            className="primaryButton"
            type="submit"
            disabled={saving}
          >
            {saving ? "Ajout..." : "Ajouter le support"}
          </button>
        </form>
      )}
    </div>
  );
}


function PlatformSection({
  page,
  navigate,
  modules,
  completed
}) {

  // DONNÉES APPRENANT — source unique de vérité
  const learnerModules = Array.isArray(modules) ? modules : [];

  const learnerLessons = learnerModules.flatMap(module =>
    Array.isArray(module.lessons) ? module.lessons : []
  );

  const learnerCompleted = Array.isArray(completed) ? completed : [];

  const learnerCompletedCount = learnerLessons.filter(lesson =>
    learnerCompleted.includes(lesson.id)
  ).length;

  const learnerProgress = learnerLessons.length > 0
    ? Math.round((learnerCompletedCount / learnerLessons.length) * 100)
    : 0;


  const allLessons = modules.flatMap(
    module => module.lessons || []
  );

  const completedCount = allLessons.filter(
    lesson => completed.includes(lesson.id)
  ).length;


  // PAGE QUIZ — accès centralisé aux quiz des leçons
  if (page === "quiz") {
    return (
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "40px 24px 80px"
        }}
      >
        <div
          style={{
            marginBottom: "30px"
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              color: "#b07b00",
              marginBottom: "8px"
            }}
          >
            ÉVALUATION
          </div>

          <h1
            style={{
              margin: 0,
              color: "#09233d",
              fontSize: "34px"
            }}
          >
            Quiz de validation
          </h1>

          <p
            style={{
              color: "#6b7a8c",
              fontSize: "16px",
              marginTop: "10px"
            }}
          >
            Sélectionne une leçon pour accéder à son quiz de validation.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px"
          }}
        >
          {learnerModules.map(module => (
            <div
              key={module.id}
              style={{
                background: "#fff",
                border: "1px solid #e5eaf0",
                borderRadius: "16px",
                padding: "22px",
                boxShadow: "0 8px 24px rgba(9,35,61,.06)"
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#b07b00",
                  marginBottom: "6px"
                }}
              >
                {module.number || `MODULE ${module.id}`}
              </div>

              <h2
                style={{
                  margin: "0 0 16px",
                  color: "#09233d",
                  fontSize: "20px"
                }}
              >
                {module.title}
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                {(module.lessons || []).map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() =>
                      navigate(
                        "module:" +
                        module.id +
                        ":" +
                        lesson.id
                      )
                    }
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "1px solid #e5eaf0",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      padding: "13px 15px",
                      cursor: "pointer",
                      color: "#09233d"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#8a98a8",
                        marginBottom: "3px"
                      }}
                    >
                      LEÇON {index + 1}
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px"
                      }}
                    >
                      {lesson.title || lesson.name || `Leçon ${index + 1}`}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#b07b00"
                      }}
                    >
                      Ouvrir la leçon →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const progress = allLessons.length
    ? Math.round(
        (completedCount / allLessons.length) * 100
      )
    : 0;

  const header = {
    formations: [
      "FORMATION",
      "Mes formations",
      "Ton parcours de formation Football Coach System."
    ],
    modules: [
      "PROGRAMME",
      "Modules",
      "La structure complète de ta formation."
    ],
    videos: [
      "BIBLIOTHÈQUE",
      "Vidéos",
      "Toutes les vidéos de la formation au même endroit."
    ],
    documents: [
      "RESSOURCES",
      "Documents & Templates",
      "Tous les supports utiles pour appliquer la méthode."
    ],
    community: [
      "COMMUNAUTÉ",
      "Communauté",
      "Échange avec les autres entraîneurs."
    ],
    lives: [
      "ÉVÉNEMENTS",
      "Lives & Webinaires",
      "Prochains rendez-vous et replays."
    ],
    tracking: [
      "SUIVI",
      "Mon suivi",
      "Ta progression et ton activité."
    ],
    certificates: [
      "VALIDATION",
      "Certificat",
      "Ta validation de parcours."
    ]
  }[page];

  function SectionHeader() {
    return (
      <div
        style={{
          marginBottom: "24px"
        }}
      >
        <div
          style={{
            color: "#b07b00",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "2px"
          }}
        >
          {header?.[0]}
        </div>

        <h2
          style={{
            margin: "7px 0",
            color: "#09233d",
            fontSize: "30px"
          }}
        >
          {header?.[1]}
        </h2>

        <p
          style={{
            color: "#6b7a8c",
            margin: 0
          }}
        >
          {header?.[2]}
        </p>
      </div>
    );
  }

  // ======================================================
  // MES FORMATIONS
  // ======================================================

  if (page === "formations") {

    return (
      <PlatformPlaceholder
        eyebrow="FORMATION"
        title="Mes formations"
        description="Ton parcours de formation."
      >

        <div
  style={{
    marginBottom: "20px"
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: "2px",
      color: "#b88700",
      marginBottom: "8px"
    }}
  >
    RESSOURCES
  </div>

  <h2
    style={{
      margin: 0,
      fontSize: "30px",
      color: "#09233d"
    }}
  >
    Documents & Templates
  </h2>

  <p
    style={{
      marginTop: "8px",
      color: "#6b7a8c"
    }}
  >
    Les ressources de ta formation Football Coach System.
  </p>
</div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e9ef",
            borderRadius: "20px",
            padding: "28px"
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >

            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#b07b00",
                  fontWeight: 800
                }}
              >
                PARCOURS PRINCIPAL
              </div>

              <h2
                style={{
                  margin: "8px 0",
                  color: "#09233d"
                }}
              >
                Football Coach System
              </h2>

              <p style={{ color: "#6b7a8c" }}>
                {learnerCompletedCount} / {learnerLessons.length} leçons terminées
              </p>
            </div>

            <div
              style={{
                fontSize: "38px",
                fontWeight: 900,
                color: "#b07b00"
              }}
            >
              {learnerProgress}%
            </div>

          </div>

          <div
            style={{
              height: "10px",
              background: "#edf0f3",
              borderRadius: "999px",
              overflow: "hidden",
              margin: "22px 0"
            }}
          >
            <div
              style={{
                width: `${learnerProgress}%`,
                height: "100%",
                background: "#f1bd3e"
              }}
            />
          </div>

          <button
            onClick={() => {
              const firstModule = learnerModules?.[0];

              if (firstModule?.id) {
                navigate("module:" + firstModule.id);
              }
            }}
            style={{
              border: 0,
              background: "#f1bd3e",
              color: "#09233d",
              padding: "13px 20px",
              borderRadius: "10px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Continuer ma formation →
          </button>

        </div>

      </PlatformPlaceholder>
    );
  }

  // ======================================================
  // MODULES
  // ======================================================

  if (page === "modules") {

    return (
      <PlatformPlaceholder
        eyebrow="PROGRAMME"
        title="Modules"
        description="Explore les modules et leurs leçons."
      >

        <SectionHeader/>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px"
          }}
        >

          {modules.map(module => {

            const lessons = module.lessons || [];

            const done = lessons.filter(
              lesson => completed.includes(lesson.id)
            ).length;

            const pct = lessons.length
              ? Math.round(done / lessons.length * 100)
              : 0;

            return (
              <div
                key={module.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e9ef",
                  borderRadius: "18px",
                  padding: "24px"
                }}
              >

                <div
                  style={{
                    color: "#b07b00",
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "1.5px"
                  }}
                >
                  {module.number || module.id}
                </div>

                <h3
                  style={{
                    color: "#09233d",
                    margin: "9px 0"
                  }}
                >
                  {module.title}
                </h3>

                <p style={{ color: "#6b7a8c" }}>
                  {lessons.length} leçons
                </p>

                <div
                  style={{
                    height: "7px",
                    background: "#edf0f3",
                    borderRadius: "999px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#f1bd3e"
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "9px",
                    fontSize: "13px",
                    color: "#6b7a8c"
                  }}
                >
                  <span>{done}/{lessons.length} terminées</span>
                  <strong>{pct}%</strong>
                </div>

                <button
                  onClick={() => {
                    const numericId =
                      typeof module.id === "number"
                        ? module.id
                        : Number(
                            String(module.id).replace("m", "")
                          );

                    if (!Number.isNaN(numericId)) {
                      navigate("module:" + numericId);
                    }
                  }}
                  style={{
                    width: "100%",
                    marginTop: "18px",
                    border: 0,
                    background: "#09233d",
                    color: "#fff",
                    padding: "13px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Ouvrir le module →
                </button>

              </div>
            );
          })}

        </div>

      </PlatformPlaceholder>
    );
  }

  // ======================================================
  // VIDEOS
  // ======================================================

  if (page === "videos") {

    const videos = modules.flatMap(module =>
      (module.lessons || []).flatMap(lesson =>
        (lesson.videos || []).map(video => ({
          ...video,
          lessonTitle: lesson.title,
          moduleTitle: module.title
        }))
      )
    );

    return (
      <PlatformPlaceholder
        eyebrow="BIBLIOTHÈQUE"
        title="Vidéos"
        description="La bibliothèque vidéo de Football Coach System."
      >

        <SectionHeader/>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e9ef",
            borderRadius: "18px",
            padding: "24px",
            marginBottom: "20px"
          }}
        >
          <strong>{videos.length} vidéos disponibles</strong>

          <p style={{ color: "#6b7a8c" }}>
            Sélectionne une vidéo pour accéder directement à son module de formation.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px"
          }}
        >

          {videos.map((video, index) => (
            <div
              key={`${video.id || index}`}
              onClick={() => {
                const targetModule = modules.find(
                  module => module.title === video.moduleTitle
                );

                if (targetModule?.id && video.lessonId) {
                  navigate(
                    "module:" +
                    targetModule.id +
                    ":" +
                    video.lessonId
                  );
                } else if (targetModule?.id) {
                  navigate("module:" + targetModule.id);
                }
              }}
              style={{
                background: "#fff",
                border: "1px solid #e5e9ef",
                borderRadius: "16px",
                padding: "20px",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease"
              }}
            >

              <div style={{ fontSize: "25px" }}>
                🎬
              </div>

              <strong
                style={{
                  display: "block",
                  color: "#09233d",
                  marginTop: "12px"
                }}
              >
                {video.title}
              </strong>

              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7a8c",
                  marginTop: "7px"
                }}
              >
                {video.lessonTitle}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#9aa5b1",
                  marginTop: "4px"
                }}
              >
                {video.moduleTitle}
              </div>

            </div>
          ))}

        </div>

      </PlatformPlaceholder>
    );
  }

  // ======================================================
  // DOCUMENTS
  // ======================================================

  if (page === "documents") {
    return (
      <CmsDocumentsSection
        modules={modules}
        navigate={navigate}
      />
    );
  }

  // ======================================================
  // COMMUNAUTÉ
  // ======================================================

  if (page === "community") {

    return (
      <CommunitySection/>
    );
  }

  // ======================================================
  // LIVES
  // ======================================================

  if (page === "lives") {

    return (
      <LivesSection/>
    );
  }

  // ======================================================
  // SUIVI
  // ======================================================

  if (page === "tracking") {

    const moduleStats = modules.map(module => {

      const lessons = module.lessons || [];

      const done = lessons.filter(
        lesson => completed.includes(lesson.id)
      ).length;

      return {
        ...module,
        total: lessons.length,
        done,
        pct: lessons.length
          ? Math.round(done / lessons.length * 100)
          : 0
      };
    });

    return (
      <PlatformPlaceholder
        eyebrow="SUIVI"
        title="Mon suivi"
        description="Ta progression détaillée."
      >

        <SectionHeader/>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
          }}
        >

          <StatCard
            title="Progression"
            value={`${progress}%`}
            icon="📈"
          />

          <StatCard
            title="Leçons terminées"
            value={`${completedCount}`}
            icon="✅"
          />

          <StatCard
            title="Leçons restantes"
            value={`${allLessons.length - completedCount}`}
            icon="🎯"
          />

          <StatCard
            title="Modules"
            value={`${modules.length}`}
            icon="📚"
          />

        </div>

        <div
          style={{
            display: "grid",
            gap: "14px"
          }}
        >

          {moduleStats.map(module => (
            <div
              key={module.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e9ef",
                borderRadius: "16px",
                padding: "20px"
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <strong style={{ color: "#09233d" }}>
                  {module.title}
                </strong>

                <strong style={{ color: "#b07b00" }}>
                  {module.pct}%
                </strong>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  height: "8px",
                  background: "#edf0f3",
                  borderRadius: "999px"
                }}
              >
                <div
                  style={{
                    width: `${module.pct}%`,
                    height: "100%",
                    background: "#f1bd3e",
                    borderRadius: "999px"
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "#6b7a8c"
                }}
              >
                {module.done} / {module.total} leçons
              </div>

            </div>
          ))}

        </div>

      </PlatformPlaceholder>
    );
  }

  // ======================================================
  // CERTIFICATS
  // ======================================================

  if (page === "certificates") {

    const complete = progress >= 100;

    return (
      <PlatformPlaceholder
        eyebrow="VALIDATION"
        title="Certificat"
        description="Validation de ton parcours Football Coach System."
      >

        <SectionHeader/>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e9ef",
            borderRadius: "20px",
            padding: "36px",
            textAlign: "center"
          }}
        >

          <div style={{ fontSize: "55px" }}>
            🏆
          </div>

          <h2 style={{ color: "#09233d" }}>
            {complete
              ? "Formation terminée"
              : "Certificat en cours"}
          </h2>

          <p style={{ color: "#6b7a8c" }}>
            {complete
              ? "Félicitations, toutes les leçons sont terminées."
              : `${completedCount} leçons sur ${allLessons.length} sont terminées.`}
          </p>

          <div
            style={{
              fontSize: "42px",
              fontWeight: 900,
              color: "#b07b00",
              margin: "20px 0"
            }}
          >
            {progress}%
          </div>

          <button
            disabled={!complete}
            style={{
              border: 0,
              borderRadius: "10px",
              padding: "14px 24px",
              background: complete ? "#f1bd3e" : "#e5e9ef",
              color: "#09233d",
              fontWeight: 800,
              cursor: complete ? "pointer" : "not-allowed"
            }}
          >
            {complete
              ? "Télécharger mon certificat"
              : "Certificat verrouillé"}
          </button>

        </div>

      </PlatformPlaceholder>
    );
  }

  return null;
}

function ModelGameSection() {
  const defaultModel = {
    philosophy: "",
    identity: "",
    preferredSystems: "",
    gamePrinciples: "",
    construction: "",
    progression: "",
    creation: "",
    finishing: "",
    defensiveOrganisation: "",
    pressing: "",
    block: "",
    recovery: "",
    offensiveTransition: "",
    defensiveTransition: "",
    attackingSetPieces: "",
    defensiveSetPieces: ""
  };

  const [model, setModel] = useState(() => {
    try {
      const saved = localStorage.getItem("fcs_model_game");
      return saved
        ? { ...defaultModel, ...JSON.parse(saved) }
        : defaultModel;
    } catch {
      return defaultModel;
    }
  });

  const [savedMessage, setSavedMessage] = useState(false);

  function updateField(key, value) {
    setModel(prev => {
      const next = {
        ...prev,
        [key]: value
      };

      localStorage.setItem(
        "fcs_model_game",
        JSON.stringify(next)
      );

      return next;
    });

    setSavedMessage(true);

    window.clearTimeout(window.__fcsModelSaveTimer);

    window.__fcsModelSaveTimer = window.setTimeout(() => {
      setSavedMessage(false);
    }, 1200);
  }

  const sections = [
    {
      title: "IDENTITÉ",
      eyebrow: "01",
      description:
        "Les fondations de ton modèle de jeu et les comportements qui doivent caractériser ton équipe.",
      fields: [
        ["philosophy", "Philosophie de jeu", "Quelle équipe veux-tu construire ?"],
        ["identity", "Identité de l'équipe", "Comment veux-tu que ton équipe soit reconnue ?"],
        ["preferredSystems", "Systèmes privilégiés", "Quels systèmes utilises-tu et pourquoi ?"],
        ["gamePrinciples", "Principes directeurs", "Quels sont les principes qui structurent l'ensemble de ton modèle ?"]
      ]
    },
    {
      title: "AVEC LE BALLON",
      eyebrow: "02",
      description:
        "Les comportements collectifs recherchés lorsque ton équipe contrôle le ballon.",
      fields: [
        ["construction", "Construction", "Comment ton équipe démarre-t-elle ses attaques ?"],
        ["progression", "Progression", "Comment avances-tu vers le but adverse ?"],
        ["creation", "Création", "Comment crées-tu les conditions favorables pour déséquilibrer l'adversaire ?"],
        ["finishing", "Finition", "Comment veux-tu arriver et conclure dans la zone de finition ?"]
      ]
    },
    {
      title: "SANS LE BALLON",
      eyebrow: "03",
      description:
        "L'organisation collective et les comportements défensifs de ton équipe.",
      fields: [
        ["defensiveOrganisation", "Organisation défensive", "Comment ton équipe s'organise-t-elle selon la zone et le moment du jeu ?"],
        ["pressing", "Pressing", "Quand, où et comment veux-tu récupérer le ballon ?"],
        ["block", "Bloc", "Quelle hauteur et quelle organisation de bloc recherches-tu ?"],
        ["recovery", "Récupération", "Comment ton équipe réagit-elle lorsqu'elle récupère le ballon ?"]
      ]
    },
    {
      title: "TRANSITIONS",
      eyebrow: "04",
      description:
        "Les premières secondes après une récupération ou une perte du ballon.",
      fields: [
        ["offensiveTransition", "Transition offensive", "Que doit faire ton équipe immédiatement après récupération ?"],
        ["defensiveTransition", "Transition défensive", "Que doit faire ton équipe immédiatement après perte ?"]
      ]
    },
    {
      title: "PHASES ARRÊTÉES",
      eyebrow: "05",
      description:
        "Les principes collectifs sur les situations arrêtées.",
      fields: [
        ["attackingSetPieces", "Phases arrêtées offensives", "Quels principes et organisations utilises-tu ?"],
        ["defensiveSetPieces", "Phases arrêtées défensives", "Quels principes et responsabilités définis-tu ?"]
      ]
    }
  ];

  const filledFields = Object.values(model).filter(
    value => typeof value === "string" && value.trim()
  ).length;

  const totalFields = Object.keys(defaultModel).length;

  const completion = Math.round(
    (filledFields / totalFields) * 100
  );

  return (
    <PlatformPlaceholder
      eyebrow="IDENTITÉ · MÉTHODE"
      title="Mon modèle de jeu"
      description="Construis ton modèle de jeu, formalise tes principes et transforme progressivement tes idées en comportements observables."
    >

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 280px",
          gap: "20px",
          marginTop: "24px",
          marginBottom: "24px"
        }}
      >

        <div
          style={{
            background: "linear-gradient(135deg, #09233d 0%, #123c61 100%)",
            color: "#fff",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 14px 35px rgba(9,35,61,.12)"
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 900,
              letterSpacing: "1.2px",
              opacity: .7,
              marginBottom: "8px"
            }}
          >
            TON IDENTITÉ D'ENTRAÎNEUR
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "24px"
            }}
          >
            Construis un modèle de jeu cohérent.
          </h2>

          <p
            style={{
              margin: "10px 0 0",
              lineHeight: 1.6,
              opacity: .82,
              maxWidth: "720px"
            }}
          >
            Décris ce que tu veux voir sur le terrain.
            Plus tes principes sont précis, plus ils pourront
            ensuite être transformés en exercices, séances et
            situations d'entraînement.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e9ef",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(9,35,61,.04)"
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 900,
              color: "#68798a",
              letterSpacing: "1px",
              marginBottom: "8px"
            }}
          >
            PROGRESSION
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 900,
              color: "#09233d"
            }}
          >
            {completion}%
          </div>

          <div
            style={{
              height: "8px",
              background: "#edf1f5",
              borderRadius: "20px",
              overflow: "hidden",
              marginTop: "12px"
            }}
          >
            <div
              style={{
                width: `${completion}%`,
                height: "100%",
                background: "#f1bd3e",
                borderRadius: "20px",
                transition: "width .2s ease"
              }}
            />
          </div>

          <div
            style={{
              marginTop: "10px",
              fontSize: "13px",
              color: "#68798a"
            }}
          >
            {filledFields} / {totalFields} éléments renseignés
          </div>

          {savedMessage && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                fontWeight: 800,
                color: "#198754"
              }}
            >
              ✓ Sauvegardé
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "18px"
        }}
      >

        {sections.map(section => (
          <section
            key={section.eyebrow}
            style={{
              background: "#fff",
              border: "1px solid #e5e9ef",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 8px 24px rgba(9,35,61,.04)"
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                marginBottom: "20px"
              }}
            >

              <div
                style={{
                  minWidth: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#eef5ff",
                  color: "#1677ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "13px"
                }}
              >
                {section.eyebrow}
              </div>

              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "#09233d",
                    fontSize: "19px"
                  }}
                >
                  {section.title}
                </h3>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#68798a",
                    fontSize: "14px",
                    lineHeight: 1.5
                  }}
                >
                  {section.description}
                </p>
              </div>

            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px"
              }}
            >

              {section.fields.map(
                ([key, label, placeholder]) => (
                  <div key={key}>

                    <label
                      style={{
                        display: "block",
                        fontWeight: 800,
                        color: "#09233d",
                        marginBottom: "7px",
                        fontSize: "14px"
                      }}
                    >
                      {label}
                    </label>

                    <textarea
                      value={model[key] || ""}
                      onChange={e =>
                        updateField(key, e.target.value)
                      }
                      placeholder={placeholder}
                      rows={5}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",
                        border: "1px solid #dfe5eb",
                        borderRadius: "10px",
                        padding: "12px",
                        fontFamily: "inherit",
                        fontSize: "14px",
                        lineHeight: 1.55,
                        outline: "none",
                        color: "#09233d",
                        background: "#fff"
                      }}
                    />

                  </div>
                )
              )}

            </div>
          </section>
        ))}

      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "18px 20px",
          background: "#f7f9fb",
          border: "1px solid #e5e9ef",
          borderRadius: "16px",
          color: "#68798a",
          fontSize: "13px",
          lineHeight: 1.6
        }}
      >
        <strong style={{ color: "#09233d" }}>
          À venir :
        </strong>{" "}
        chaque principe pourra être relié à des sous-principes,
        des comportements observables, des exercices et des
        séances d'entraînement.
      </div>

    </PlatformPlaceholder>
  );
}

function DocumentsSection({ saved }) {

  const [documents, setDocuments] =
    useState(saved);

  const [title, setTitle] =
    useState("");

  return (
    <PlatformPlaceholder
      eyebrow="RESSOURCES"
      title="Documents & Templates"
      description="Centralise les supports de ta formation."
    >

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px"
        }}
      >

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nom du document ou template..."
          style={{
            flex: 1,
            padding: "13px",
            borderRadius: "10px",
            border: "1px solid #dfe5eb"
          }}
        />

      </div>

      <div
        style={{
          display: "grid",
          gap: "12px"
        }}
      >

        {documents.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e9ef",
              borderRadius: "16px",
              padding: "30px",
              color: "#6b7a8c"
            }}
          >
            Aucun document ajouté pour le moment.
          </div>
        ) : (
          documents.map(document => (
            <div
              key={document.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e9ef",
                borderRadius: "15px",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <div>
                <strong style={{ color: "#09233d" }}>
                  📄 {document.title}
                </strong>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#8a97a5",
                    marginTop: "5px"
                  }}
                >
                  {document.type} · {document.createdAt}
                </div>
              </div>
            </div>
          ))
        )}

      </div>

    </PlatformPlaceholder>
  );
}


function CmsDocumentsSection({ modules = [], navigate }) {

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [lessonFilter, setLessonFilter] = useState("all");

  const resources = modules.flatMap(module =>
    (module.lessons || []).flatMap(lesson =>
      (lesson.resources || []).map((resource, index) => {

        const title =
          resource.title ||
          resource.name ||
          resource.label ||
          `Ressource ${index + 1}`;

        const type =
          resource.type ||
          resource.kind ||
          resource.format ||
          "Ressource";

        const url =
          resource.url ||
          resource.href ||
          resource.link ||
          resource.fileUrl ||
          resource.downloadUrl ||
          resource.path ||
          "";

        return {
          id:
            resource.id ||
            `${module.id}-${lesson.id}-resource-${index}`,

          title,
          type,
          url,

          moduleId: module.id,
          moduleTitle: module.title,
          lessonId: lesson.id,
          lessonTitle: lesson.title,

          subtitle:
            resource.subtitle ||
            resource.description ||
            ""
        };
      })
    )
  );

  const moduleOptions = modules;

  const lessonOptions =
    moduleFilter === "all"
      ? modules.flatMap(module => module.lessons || [])
      : (
          modules.find(
            module => String(module.id) === String(moduleFilter)
          )?.lessons || []
        );

  const filtered = resources.filter(resource => {

    const matchesSearch =
      !search ||
      `${resource.title} ${resource.type} ${resource.moduleTitle} ${resource.lessonTitle}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesModule =
      moduleFilter === "all" ||
      String(resource.moduleId) === String(moduleFilter);

    const matchesLesson =
      lessonFilter === "all" ||
      String(resource.lessonId) === String(lessonFilter);

    return matchesSearch && matchesModule && matchesLesson;
  });

  function openLesson(resource) {
    if (!resource.moduleId) return;

    navigate(
      `module:${resource.moduleId}:${resource.lessonId || ""}`
    );
  }

  return (
    <PlatformPlaceholder
      eyebrow="BIBLIOTHÈQUE"
      title="Documents & Templates"
      description="Retrouve tous les supports associés à ta formation."
    >

      <div
  style={{
    marginBottom: "20px"
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: "2px",
      color: "#b88700",
      marginBottom: "8px"
    }}
  >
    RESSOURCES
  </div>

  <h2
    style={{
      margin: 0,
      fontSize: "30px",
      color: "#09233d"
    }}
  >
    Documents & Templates
  </h2>

  <p
    style={{
      marginTop: "8px",
      color: "#6b7a8c"
    }}
  >
    Les ressources de ta formation Football Coach System.
  </p>
</div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e9ef",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "20px"
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(260px, 1.5fr) repeat(2, minmax(180px, 1fr))",
            gap: "12px"
          }}
        >

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un document, template..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #dfe5eb",
              borderRadius: "10px",
              padding: "13px 14px",
              fontSize: "14px",
              outline: "none"
            }}
          />

          <select
            value={moduleFilter}
            onChange={e => {
              setModuleFilter(e.target.value);
              setLessonFilter("all");
            }}
            style={{
              border: "1px solid #dfe5eb",
              borderRadius: "10px",
              padding: "13px 14px",
              background: "#fff",
              fontSize: "14px"
            }}
          >
            <option value="all">Tous les modules</option>

            {moduleOptions.map(module => (
              <option
                key={module.id}
                value={module.id}
              >
                {module.title}
              </option>
            ))}
          </select>

          <select
            value={lessonFilter}
            onChange={e => setLessonFilter(e.target.value)}
            style={{
              border: "1px solid #dfe5eb",
              borderRadius: "10px",
              padding: "13px 14px",
              background: "#fff",
              fontSize: "14px"
            }}
          >
            <option value="all">Toutes les leçons</option>

            {lessonOptions.map(lesson => (
              <option
                key={lesson.id}
                value={lesson.id}
              >
                {lesson.title}
              </option>
            ))}
          </select>

        </div>

      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e9ef",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "20px"
        }}
      >
        <strong>
          {filtered.length} ressource{filtered.length > 1 ? "s" : ""}
        </strong>

        <p
          style={{
            color: "#6b7a8c",
            marginBottom: 0
          }}
        >
          Supports, fiches pratiques, templates et autres ressources
          associés à tes leçons.
        </p>
      </div>

      {filtered.length === 0 ? (

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e9ef",
            borderRadius: "18px",
            padding: "40px",
            textAlign: "center",
            color: "#6b7a8c"
          }}
        >
          Aucune ressource ne correspond à ta recherche.
        </div>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px"
          }}
        >

          {filtered.map(resource => (

            <div
              key={resource.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e9ef",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >

              <div
                style={{
                  fontSize: "28px"
                }}
              >
                📄
              </div>

              <div>
                <strong
                  style={{
                    color: "#09233d",
                    fontSize: "16px"
                  }}
                >
                  {resource.title}
                </strong>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#b07b00",
                    fontWeight: 800,
                    marginTop: "7px"
                  }}
                >
                  {resource.type}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7a8c",
                    marginTop: "7px"
                  }}
                >
                  {resource.lessonTitle}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#9aa5b1",
                    marginTop: "4px"
                  }}
                >
                  {resource.moduleTitle}
                </div>
              </div>

              {resource.subtitle && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7a8c"
                  }}
                >
                  {resource.subtitle}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "auto",
                  paddingTop: "8px"
                }}
              >

                <button
                  onClick={() => openLesson(resource)}
                  style={{
                    flex: 1,
                    border: 0,
                    background: "#09233d",
                    color: "#fff",
                    padding: "11px 14px",
                    borderRadius: "9px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Voir la leçon
                </button>

                {resource.url && (
                  <button
                    onClick={() => {
                      window.open(
                        resource.url,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                    style={{
                      border: "1px solid #dfe5eb",
                      background: "#fff",
                      color: "#09233d",
                      padding: "11px 14px",
                      borderRadius: "9px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Ouvrir
                  </button>
                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </PlatformPlaceholder>
  );
}

function CommunitySection() {

  const [posts, setPosts] = useState(() =>
    JSON.parse(
      localStorage.getItem("fcs-community") || "[]"
    )
  );

  const [text, setText] = useState("");

  function publish() {

    if (!text.trim()) return;

    const next = [
      {
        id: Date.now(),
        text: text.trim(),
        date: new Date().toLocaleString("fr-FR")
      },
      ...posts
    ];

    setPosts(next);

    localStorage.setItem(
      "fcs-community",
      JSON.stringify(next)
    );

    setText("");
  }

  return (
    <PlatformPlaceholder
      eyebrow="COMMUNAUTÉ"
      title="Communauté"
      description="Un espace pour échanger entre entraîneurs."
    >

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e9ef",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "18px"
        }}
      >

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Partager une idée, une question ou une expérience..."
          rows={4}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid #dfe5eb",
            borderRadius: "10px",
            padding: "13px",
            resize: "vertical"
          }}
        />

        <button
          onClick={publish}
          style={{
            marginTop: "10px",
            border: 0,
            background: "#f1bd3e",
            borderRadius: "10px",
            padding: "12px 20px",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          Publier
        </button>

      </div>

      <div style={{ display: "grid", gap: "12px" }}>

        {posts.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e9ef",
              borderRadius: "16px",
              padding: "28px",
              color: "#6b7a8c"
            }}
          >
            Aucun message pour le moment. Lance la première discussion.
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e9ef",
                borderRadius: "16px",
                padding: "20px"
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#8a97a5",
                  marginBottom: "8px"
                }}
              >
                {post.date}
              </div>

              <div style={{ color: "#09233d" }}>
                {post.text}
              </div>
            </div>
          ))
        )}

      </div>

    </PlatformPlaceholder>
  );
}

function LivesSection() {

  const events = [
    {
      title: "Live coaching",
      date: "À programmer",
      type: "Live"
    },
    {
      title: "Webinaire Football Coach System",
      date: "À programmer",
      type: "Webinaire"
    }
  ];

  return (
    <PlatformPlaceholder
      eyebrow="ÉVÉNEMENTS"
      title="Lives & Webinaires"
      description="Retrouve les événements en direct et leurs replays."
    >

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px"
        }}
      >

        {events.map(event => (
          <div
            key={event.title}
            style={{
              background: "#fff",
              border: "1px solid #e5e9ef",
              borderRadius: "18px",
              padding: "24px"
            }}
          >

            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#b07b00"
              }}
            >
              {event.type}
            </div>

            <h3 style={{ color: "#09233d" }}>
              {event.title}
            </h3>

            <p style={{ color: "#6b7a8c" }}>
              {event.date}
            </p>

            <button
              disabled
              style={{
                border: 0,
                background: "#edf0f3",
                padding: "11px 16px",
                borderRadius: "9px",
                fontWeight: 700
              }}
            >
              Bientôt disponible
            </button>

          </div>
        ))}

      </div>

    </PlatformPlaceholder>
  );
}



/* =========================================================
   ESPACE APPRENANT FCS
   ========================================================= */

function StudentPortalApp() {
  const [openModuleId, setOpenModuleId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [formation, setFormation] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);

  async function loadStudent() {
    setLoading(true);
    setError("");

    try {
      const meResponse = await fetch(
        "/api/auth/me",
        {
          credentials: "include"
        }
      );

      if (!meResponse.ok) {
        setAuthenticated(false);
        setUser(null);
        setFormation(null);
        return;
      }

      const me = await meResponse.json();

      if (!me.success || !me.authenticated) {
        setAuthenticated(false);
        setUser(null);
        setFormation(null);
        return;
      }

      const formationResponse = await fetch(
        "/api/student/formation",
        {
          credentials: "include"
        }
      );

      const data = await formationResponse.json();

      if (!formationResponse.ok || !data.success) {
        throw new Error(
          data.error ||
          "Impossible de charger ta formation."
        );
      }

      setAuthenticated(true);
      setUser(me.user);
      console.log("FCS FORMATION API:", JSON.stringify(data.formation, null, 2));
      console.log("FCS MODULES API:", JSON.stringify(data.formation?.modules || [], null, 2));

      setFormation(data.formation);

      const firstModule =
        data.formation?.modules?.[0];

      const firstLesson =
        firstModule?.lessons?.[0];

      if (firstModule) {
        setActiveModuleId(firstModule.id);
      }

      if (firstLesson) {
        setActiveLessonId(firstLesson.id);
      }

    } catch (err) {
      console.error(
        "FCS STUDENT PORTAL:",
        err
      );

      setError(
        err.message ||
        "Impossible de charger ton espace."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, []);

  // -------------------------------------------------------
  // Rafraîchissement automatique du contenu apprenant
  // -------------------------------------------------------
  useEffect(() => {
    if (!authenticated) return;

    const refreshFormation = async () => {
      try {
        const response = await fetch(
          "/api/student/formation",
          {
            credentials: "include",
            cache: "no-store"
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.success && data.formation) {
          setFormation(data.formation);
        }
      } catch (err) {
        console.error(
          "FCS AUTO REFRESH:",
          err
        );
      }
    };

    // Vérification toutes les 5 secondes
    const interval = setInterval(
      refreshFormation,
      5000
    );

    // Rafraîchissement immédiat lorsque
    // l'utilisateur revient sur l'onglet
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshFormation();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [authenticated]);

  async function login(event) {
    event.preventDefault();

    setLoginLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          "Email ou mot de passe incorrect."
        );
      }

      setEmail("");
      setPassword("");

      await loadStudent();

    } catch (err) {
      setError(
        err.message ||
        "Impossible de se connecter."
      );

    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include"
        }
      );
    } catch (err) {
      console.error(err);
    }

    setAuthenticated(false);
    setUser(null);
    setFormation(null);
    setActiveModuleId(null);
    setActiveLessonId(null);
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        fontFamily: "Inter, system-ui, sans-serif"
      }}>
        <div style={{
          textAlign: "center"
        }}>
          <div style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            border: "4px solid #dfe6ed",
            borderTopColor: "#f1bd3e",
            margin: "0 auto 18px"
          }} />

          <strong style={{
            color: "#09233d"
          }}>
            Chargement de ton espace...
          </strong>
        </div>
      </div>
    );
  }


  /* =======================================================
     LOGIN
     ======================================================= */

  if (!authenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #071c31 0%, #123c61 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}>

        <div style={{
          width: "100%",
          maxWidth: "460px",
          background: "#fff",
          borderRadius: "24px",
          padding: "42px",
          boxShadow:
            "0 30px 80px rgba(0,0,0,.25)"
        }}>

          <div style={{
            textAlign: "center",
            marginBottom: "34px"
          }}>

            <div style={{
              width: "58px",
              height: "58px",
              borderRadius: "16px",
              background: "#09233d",
              color: "#f1bd3e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontWeight: 900,
              fontSize: "17px"
            }}>
              FCS
            </div>

            <div style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "2px",
              color: "#f1bd3e",
              marginBottom: "8px"
            }}>
              FOOTBALL COACH SYSTEM
            </div>

            <h1 style={{
              margin: 0,
              color: "#09233d",
              fontSize: "30px"
            }}>
              Ton espace apprenant
            </h1>

            <p style={{
              color: "#6b7b8c",
              lineHeight: 1.6,
              marginTop: "12px"
            }}>
              Connecte-toi pour accéder à ta formation.
            </p>

          </div>


          <form onSubmit={login}>

            <label style={{
              display: "block",
              fontWeight: 700,
              fontSize: "14px",
              color: "#09233d",
              marginBottom: "8px"
            }}>
              Adresse e-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.com"
              autoComplete="email"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 15px",
                borderRadius: "12px",
                border: "1px solid #dce3ea",
                fontSize: "15px",
                marginBottom: "18px",
                outline: "none"
              }}
            />

            <label style={{
              display: "block",
              fontWeight: 700,
              fontSize: "14px",
              color: "#09233d",
              marginBottom: "8px"
            }}>
              Mot de passe
            </label>

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 15px",
                borderRadius: "12px",
                border: "1px solid #dce3ea",
                fontSize: "15px",
                marginBottom: "20px",
                outline: "none"
              }}
            />

            {error && (
              <div style={{
                background: "#fff1f1",
                border: "1px solid #ffd4d4",
                color: "#b42318",
                padding: "12px 14px",
                borderRadius: "10px",
                marginBottom: "18px",
                fontSize: "14px"
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                width: "100%",
                border: 0,
                borderRadius: "12px",
                padding: "15px",
                background: "#f1bd3e",
                color: "#09233d",
                fontWeight: 900,
                fontSize: "15px",
                cursor: loginLoading
                  ? "wait"
                  : "pointer"
              }}
            >
              {loginLoading
                ? "Connexion..."
                : "Se connecter"}
            </button>

          </form>

        </div>
      </div>
    );
  }


  /* =======================================================
     FORMATION
     ======================================================= */

  const allModules =
    Array.isArray(formation?.modules)
      ? formation.modules
      : [];

  // ESPACE APPRENANT : seuls les 3 premiers modules sont accessibles
  const modules = allModules.slice(0, 3);

  const activeModule =
    modules.find(
      module => module.id === activeModuleId
    ) || modules[0];

  const lessons =
    Array.isArray(activeModule?.lessons)
      ? activeModule.lessons
      : [];

  const activeLesson =
    lessons.find(
      lesson => lesson.id === activeLessonId
    ) || lessons[0];

  const videos =
    Array.isArray(activeLesson?.videos)
      ? activeLesson.videos
      : [];

  const activeVideo =
    videos[0] || null;

  const totalLessons = modules.reduce(
    (total, module) =>
      total +
      (module.lessons?.length || 0),
    0
  );

  const totalVideos = modules.reduce(
    (total, module) =>
      total +
      (module.lessons || []).reduce(
        (sum, lesson) =>
          sum + (lesson.videos?.length || 0),
        0
      ),
    0
  );


  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f7fa",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#09233d"
    }}>

      {/* TOPBAR */}

      <header style={{
        height: "76px",
        background: "#09233d",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        boxSizing: "border-box"
      }}>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "14px"
        }}>

          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "#f1bd3e",
            color: "#09233d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900
          }}>
            FCS
          </div>

          <div>
            <strong>
              FOOTBALL COACH SYSTEM
            </strong>

            <div style={{
              fontSize: "10px",
              opacity: .65,
              letterSpacing: "1.5px"
            }}>
              ESPACE APPRENANT
            </div>
          </div>

        </div>


        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "18px"
        }}>

          <span style={{
            fontSize: "14px"
          }}>
            Bonjour{" "}
            <strong>
              {user?.first_name || "Coach"}
            </strong>
          </span>

          <button
            onClick={logout}
            style={{
              border: "1px solid rgba(255,255,255,.2)",
              background: "transparent",
              color: "#fff",
              borderRadius: "10px",
              padding: "9px 13px",
              cursor: "pointer"
            }}
          >
            Déconnexion
          </button>

        </div>

      </header>


      {/* CONTENT */}

      <main style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "34px"
      }}>

        {/* HERO */}

        <section style={{
          background:
            "linear-gradient(135deg, #09233d 0%, #174c76 100%)",
          color: "#fff",
          borderRadius: "22px",
          padding: "34px",
          marginBottom: "24px"
        }}>

          <div style={{
            fontSize: "12px",
            color: "#f1bd3e",
            fontWeight: 900,
            letterSpacing: "1.5px",
            marginBottom: "8px"
          }}>
            MA FORMATION
          </div>

          <h1 style={{
            margin: "0 0 10px",
            fontSize: "32px"
          }}>
            {formation?.title || "Football Coach System"}
          </h1>

          <p style={{
            margin: 0,
            opacity: .8
          }}>
            Développe ta méthode d'entraîneur,
            structure ton modèle et transforme
            tes idées en actions terrain.
          </p>

          <div style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
            flexWrap: "wrap"
          }}>

            <div style={{
              background: "rgba(255,255,255,.1)",
              borderRadius: "12px",
              padding: "12px 16px"
            }}>
              <strong>{modules.length}</strong>{" "}
              modules
            </div>

            <div style={{
              background: "rgba(255,255,255,.1)",
              borderRadius: "12px",
              padding: "12px 16px"
            }}>
              <strong>{totalLessons}</strong>{" "}
              leçons
            </div>

            <div style={{
              background: "rgba(255,255,255,.1)",
              borderRadius: "12px",
              padding: "12px 16px"
            }}>
              <strong>{totalVideos}</strong>{" "}
              vidéos
            </div>

          </div>

        </section>


        <div style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(280px, 340px) minmax(0, 1fr)",
          gap: "24px",
          alignItems: "start"
        }}>

          {/* MODULES */}

          <aside style={{
            background: "#fff",
            borderRadius: "18px",
            border: "1px solid #e2e8ee",
            overflow: "hidden"
          }}>

            <div style={{
              padding: "20px",
              borderBottom: "1px solid #edf0f3"
            }}>
              <strong>
                Contenu de la formation
              </strong>

              <div style={{
                fontSize: "13px",
                color: "#718096",
                marginTop: "5px"
              }}>
                {modules.length} modules disponibles
              </div>
            </div>


            <div style={{
              padding: "10px"
            }}>

              {modules.map((module, index) => {
                const active =
                  module.id === activeModule?.id;

                const isOpen =
                  openModuleId === module.id;

                return (
                  <div
                    key={module.id}
                    style={{
                      marginBottom: "8px"
                    }}
                  >

                    {/* MODULE */}
                    <button
                      type="button"
                      onClick={() => {
                        const firstLesson =
                          module.lessons?.[0];

                        setActiveModuleId(module.id);

                        if (isOpen) {
                          setOpenModuleId(null);
                        } else {
                          setOpenModuleId(module.id);

                          if (firstLesson) {
                            setActiveLessonId(firstLesson.id);
                          }
                        }
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: active
                          ? "1px solid #f1bd3e"
                          : "1px solid #e2e8ee",
                        borderRadius: "12px",
                        padding: "15px",
                        cursor: "pointer",
                        background: active
                          ? "#fff7df"
                          : "#fff",
                        color: "#09233d"
                      }}
                    >

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px"
                      }}>

                        <div style={{
                          minWidth: 0
                        }}>

                          <div style={{
                            fontSize: "11px",
                            fontWeight: 900,
                            color: "#b18417",
                            marginBottom: "4px"
                          }}>
                            MODULE{" "}
                            {String(
                              module.number || index + 1
                            ).replace("MODULE ", "").padStart(2, "0")}
                          </div>

                          <strong style={{
                            fontSize: "14px",
                            lineHeight: 1.35,
                            display: "block"
                          }}>
                            {module.title}
                          </strong>

                          <div style={{
                            fontSize: "12px",
                            color: "#718096",
                            marginTop: "5px"
                          }}>
                            {module.lessons?.length || 0} leçons
                          </div>

                        </div>

                        <span style={{
                          flex: "0 0 auto",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#718096"
                        }}>
                          {isOpen ? "⌃" : "⌄"}
                        </span>

                      </div>

                    </button>


                    {/* LEÇONS DU MODULE */}
                    {isOpen && (
                      <div style={{
                        marginTop: "6px",
                        marginLeft: "10px",
                        paddingLeft: "10px",
                        borderLeft: "2px solid #edf0f3"
                      }}>

                        {(module.lessons || []).map(
                          (lesson, lessonIndex) => {

                            const lessonActive =
                              activeLesson?.id === lesson.id &&
                              activeModule?.id === module.id;

                            return (
                              <button
                                type="button"
                                key={lesson.id}
                                onClick={() => {
                                  setActiveModuleId(module.id);
                                  setActiveLessonId(lesson.id);
                                  setOpenModuleId(module.id);
                                }}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  border: 0,
                                  borderRadius: "10px",
                                  padding: "11px 12px",
                                  marginBottom: "4px",
                                  cursor: "pointer",
                                  background: lessonActive
                                    ? "#fff8e4"
                                    : "transparent",
                                  color: "#09233d",
                                  borderLeft: lessonActive
                                    ? "3px solid #f1bd3e"
                                    : "3px solid transparent"
                                }}
                              >

                                <div style={{
                                  display: "flex",
                                  gap: "9px",
                                  alignItems: "flex-start"
                                }}>

                                  <span style={{
                                    fontSize: "10px",
                                    fontWeight: 900,
                                    color: "#b18417",
                                    minWidth: "20px",
                                    paddingTop: "2px"
                                  }}>
                                    {String(
                                      lessonIndex + 1
                                    ).padStart(2, "0")}
                                  </span>

                                  <span style={{
                                    fontSize: "12px",
                                    fontWeight: lessonActive
                                      ? 800
                                      : 600,
                                    lineHeight: 1.4
                                  }}>
                                    {lesson.title}
                                  </span>

                                </div>

                              </button>
                            );
                          }
                        )}

                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          </aside>


          {/* LESSON / VIDEO */}

          <section>

            <div style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e2e8ee",
              padding: "24px"
            }}>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                alignItems: "start",
                marginBottom: "20px"
              }}>

                <div>
                  <div style={{
                    fontSize: "11px",
                    color: "#b18417",
                    fontWeight: 900,
                    letterSpacing: "1px"
                  }}>
                    MODULE{" "}
                    {activeModule?.number || ""}
                  </div>

                  <h2 style={{
                    margin: "6px 0 4px"
                  }}>
                    {activeModule?.title}
                  </h2>

                  <p style={{
                    margin: 0,
                    color: "#718096"
                  }}>
                    {activeModule?.description ||
                      "Sélectionne une leçon pour commencer."}
                  </p>
                </div>

              </div>


              {/* VIDEO */}

              <div style={{
                background: "#07131f",
                borderRadius: "16px",
                overflow: "hidden",
                minHeight: "420px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>

                {activeVideo?.url ? (
                  <video
                    key={activeVideo.id}
                    controls
                    playsInline
                    preload="metadata"
                    src={activeVideo.url}
                    style={{
                      width: "100%",
                      display: "block",
                      maxHeight: "680px",
                      background: "#000"
                    }}
                  />
                ) : (
                  <div style={{
                    color: "#fff",
                    textAlign: "center",
                    padding: "50px"
                  }}>
                    <strong>
                      Cette leçon sera bientôt disponible.
                    </strong>

                    <p style={{
                      opacity: .65
                    }}>
                      Le contenu sera ajouté prochainement.
                    </p>
                  </div>
                )}

              </div>


              {/* LESSON INFO */}

              <div style={{
                paddingTop: "22px"
              }}>

                <div style={{
                  fontSize: "11px",
                  color: "#b18417",
                  fontWeight: 900,
                  letterSpacing: "1px"
                }}>
                  LEÇON
                </div>

                <h2 style={{
                  margin: "6px 0"
                }}>
                  {activeLesson?.title ||
                    "Aucune leçon sélectionnée"}
                </h2>

                <p style={{
                  color: "#718096",
                  lineHeight: 1.6,
                  marginBottom: 0
                }}>
                  {activeLesson?.description ||
                    "Regarde la vidéo puis poursuis ton parcours."}
                </p>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

function AdminApp() {
  async function logout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include"
        }
      );
    } catch (err) {
      console.error(err);
    }

    window.location.href = "/";
  }

  const [page, setPage] = useState("dashboard");
  const [platformPage, setPlatformPage] = useState("home");
  const [activeModuleId, setActiveModuleId] = useState(1);
  const [initialLessonId, setInitialLessonId] = useState(null);

  // Catalogue CMS/API — fallback sur le catalogue statique
  const [apiModules, setApiModules] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const response = await fetch(
          "/api/content"
        );

        if (!response.ok) {
          throw new Error(`API content HTTP ${response.status}`);
        }

        const data = await response.json();

        const modules = (data.modules || []).map(module => ({
          id: module.id,
          number: `MODULE ${module.number}`,
          title: module.title,
          image: module.image || "",
          lessons: (module.lessons || []).map(lesson => ({
            id: lesson.lesson_key,
            title: lesson.title,
            description: lesson.description || "",
            videos: (lesson.videos || []).map(video => ({
              ...video,
              moduleId: module.id,
              lessonId: lesson.id,
              url: normalizeVideoUrl(video.url)
            })),
            resources: lesson.resources || []
          }))
        }));

        console.log(
          "🔥 CMS FRONTEND :",
          modules.length,
          "modules /",
          modules.reduce(
            (total, m) => total + (m.lessons?.length || 0),
            0
          ),
          "leçons /",
          modules.reduce(
            (total, m) =>
              total +
              (m.lessons || []).reduce(
                (n, l) => n + (l.videos?.length || 0),
                0
              ),
            0
          ),
          "vidéos"
        );

        if (!cancelled && modules.length) {
          setApiModules(modules);

          // Si le module actuellement sélectionné n'existe plus
          // dans le catalogue API, on sélectionne le premier.
          setActiveModuleId(current => {
            return modules.some(module => module.id === current)
              ? current
              : modules[0].id;
          });
        }
      } catch (error) {
        console.warn(
          "⚠️ API CMS indisponible — utilisation du catalogue local",
          error
        );
      }
    }

    loadContent();

    return () => {
      cancelled = true;
    };
  }, []);

  const [completed, setCompleted] = useState(() => {
    try {
      const saved =
        localStorage.getItem("fcs-completed-lessons");

      return saved
        ? JSON.parse(saved)
        : initialCompleted;
    } catch {
      return initialCompleted;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "fcs-completed-lessons",
      JSON.stringify(completed)
    );
  }, [completed]);

  function toggleCompleted(id) {
    setCompleted(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current,id]
    );
  }

  function openModule(id) {
    setActiveModuleId(id);
    setInitialLessonId(null);
    setPage("module");
    window.scrollTo(0,0);
  }

  function navigatePlatform(target) {
    if (target.startsWith("module:")) {
      const parts = target.split(":");
      const id = Number(parts[1]);
      const lessonId = parts.slice(2).join(":") || null;

      setActiveModuleId(id);
      setInitialLessonId(lessonId);
      setPage("module");
      window.scrollTo(0, 0);
      return;
    }

    setPlatformPage(target);
    setPage("platform");
    window.scrollTo(0, 0);
  }

  function goHome() {
    setPage("dashboard");
    window.scrollTo(0,0);
  }

  const modules =
    Array.isArray(apiModules)
      ? apiModules
      : [];

  const activeModule = useMemo(
    () => modules.find(m => m.id === activeModuleId),
    [modules, activeModuleId]
  );

  return (
    <div className="app">

      <Sidebar
          onHome={goHome}
          onNavigate={navigatePlatform}
          onLogout={logout}
          activePage={
            page === "platform"
              ? platformPage
              : page === "module"
                ? "modules"
                : "home"
          }
        />

      <main className="main">
        <Topbar/>

        {page === "dashboard" ? (
          <Dashboard
            completed={completed}
            openModule={openModule}
            modules={modules}
          />
        ) : page === "platform" ? (
          platformPage === "home" ? (
            <PlatformHome
              navigate={navigatePlatform}
              modules={modules}
              completed={completed}
            />
          ) : platformPage === "modules" ? (
            <FormationManager
              initialModules={modules}
            />
          ) : platformPage === "model-game" ? (
            <ModelGameSection />
          ) : (
            <PlatformSection
              page={platformPage}
              navigate={navigatePlatform}
              modules={modules}
              completed={completed}
            />
          )
        ) : (
          <ModulePage
            key={`${activeModuleId}:${initialLessonId || "auto"}`}
            module={activeModule}
            completed={completed}
            toggleCompleted={toggleCompleted}
            onBack={goHome}
            initialLessonId={initialLessonId}
          />
        )}
      </main>

    </div>
  );
}


function App() {
  const isStudent =
    window.location.pathname === "/student" ||
    window.location.pathname.startsWith("/student/");

  if (isStudent) {
    return <StudentPortalApp />;
  }

  return <AdminApp />;
}

export default App;
