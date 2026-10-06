import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCard from "./components/StatCard";
import {
  Home, BookOpen, Layers3, PlaySquare, PlayCircle, FileText, Users, Brain,
  CalendarDays, BarChart3, BadgeCheck, Headphones,
  Search, Bell, ArrowRight, ArrowLeft, CheckCircle2, Circle,
  FolderOpen, ClipboardList, Video, Trophy, Clock,
  ChevronRight, Lock, Menu, Settings, X, HelpCircle, Award
} from "lucide-react";
import "./App.css";
import {
  getLessonContent,
  getLessonQuiz,
  getLessonTranscript
} from "./data/lessonContent";
import { courseVideos } from "./data/courseVideos";
import contentExport from "../content-export.json";
import DocumentsTemplates from "./components/DocumentsTemplates";
import StudentFormation from "./components/StudentFormation";
import QuizAdmin from "./components/QuizAdmin";
import { LivesReplaysAdmin, LivesReplaysStudent } from "./components/LivesReplays";
import { GameModelStudent, GAME_MODEL_SECTIONS } from "./components/GameModel";
import LearnersAdmin from "./components/LearnersAdmin";
import ProgressAdmin from "./components/ProgressAdmin";


async function safeJson(response) {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

function normalizeApiModules(data) {
  return (data.modules || [])
    .filter(m => m.published === 1 || m.published === undefined)
    .map(module => ({
      id: module.id,
      number: module.module_key === "welcome" ? "BIENVENUE" : `MODULE ${module.number}`,
      moduleKey: module.module_key || "",
      title: module.title,
      description: module.description || "",
      image: module.image || "",
      isWelcome: module.module_key === "welcome",
      lessons: (module.lessons || [])
        .filter(l => l.published === 1 || l.published === undefined)
        .map(lesson => ({
          id: lesson.lesson_key,
          numericId: lesson.id,
          title: lesson.title,
          description: lesson.description || "",
          published: lesson.published,
          videos: (lesson.videos || [])
            .filter(v => v.published === 1 || v.published === undefined)
            .map(video => {
              const isMultiPart = (lesson.videos || []).filter(v => v.published !== 0).length > 1;
              return {
                ...video,
                moduleId: module.id,
                lessonId: lesson.id,
                url: normalizeVideoUrl(video.url),
                title: isMultiPart ? video.title : (lesson.title || video.title)
              };
            }),
          resources: lesson.resources || []
        }))
    }));
}

function getFallbackModules() {
  try {
    const data = contentExport;
    const lessonsByModule = {};
    const videosByLesson = {};

    for (const video of data.videos || []) {
      if (!videosByLesson[video.lesson_id]) {
        videosByLesson[video.lesson_id] = [];
      }
      videosByLesson[video.lesson_id].push(video);
    }

    for (const lesson of data.lessons || []) {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = [];
      }
      lessonsByModule[lesson.module_id].push({
        ...lesson,
        videos: (videosByLesson[lesson.id] || []).sort(
          (a, b) => (a.position || 0) - (b.position || 0)
        ),
        resources: (data.resources || []).filter(r => r.lesson_id === lesson.id)
      });
    }

    const apiData = {
      formation: (data.formations || [])[0] || null,
      modules: (data.modules || [])
        .slice()
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(module => ({
          ...module,
          lessons: (lessonsByModule[module.id] || []).sort(
            (a, b) => (a.position || 0) - (b.position || 0)
          )
        }))
    };

    return normalizeApiModules(apiData);
  } catch (error) {
    console.error("getFallbackModules error:", error);
    return [];
  }
}


const initialCompleted = [
  "welcome-l1",
  "m1-l1",
  "m1-l2",
  "m2-l1"
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
          ["Formations", 1],
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
  const [formError, setFormError] = useState("");

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
      const response = await fetch("/api/admin/content", {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Impossible de charger le contenu.");
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      const apiModules = Array.isArray(data.modules)
        ? data.modules
        : [];

      const normalizedModules = apiModules
        .slice()
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(module => ({
          ...module,
          lessons: (module.lessons || []).slice().sort(
            (a, b) => (a.position || 0) - (b.position || 0)
          )
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
      console.warn("CMS refresh: API indisponible, utilisation des donnees locales", error.message);
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
        credentials: "include",
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

      const text = await response.text();

      let data = null; if (text) { try { data = JSON.parse(text); } catch {} } if (!response.ok) {
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
      console.error(error.message);
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
        credentials: "include",
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

      const text = await response.text();

      let data = null; if (text) { try { data = JSON.parse(text); } catch {} } if (!response.ok) {
        throw new Error(data.error || "Erreur création séance");
      }

      setLessonForm({
        title: "",
        description: ""
      });

      setLessonModuleId(null);
      await refresh();

    } catch (error) {
      console.error(error.message);
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

      const text = await response.text();

      let data = null; if (text) { try { data = JSON.parse(text); } catch {} } if (!response.ok) {
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
      console.error(error.message);
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

      const text = await response.text();

      let data = null; if (text) { try { data = JSON.parse(text); } catch {} } if (!response.ok) {
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
      console.error(error.message);
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
              {(module.lessons || []).map((lesson, lessonIndex) => {
                const videoCount = (lesson.videos || []).length;
                const resourceCount = (lesson.resources || []).length;
                const isPublished = lesson.published !== 0;
                const lessonNum = String(lesson.position || lessonIndex + 1).padStart(2, "0");

                return (
                  <div
                    key={lesson.id}
                    className="managerLesson"
                    style={{
                      padding: "20px 24px",
                      marginBottom: "14px",
                      borderRadius: "14px",
                      border: "1px solid #e5eaf0",
                      background: "#fff",
                      transition: "box-shadow .15s ease"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "#09233d",
                          color: "#f1bd3e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "15px",
                          flexShrink: 0
                        }}
                      >
                        {lessonNum}
                      </div>

                      <strong
                        style={{
                          fontSize: "17px",
                          color: "#09233d",
                          lineHeight: 1.3,
                          flex: "1 1 200px",
                          minWidth: 0
                        }}
                      >
                        {lesson.title}
                      </strong>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          background: isPublished ? "#e8f5ee" : "#f5f5f5",
                          color: isPublished ? "#287a55" : "#999",
                          fontSize: "13px",
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {isPublished ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                        {isPublished ? "Publié" : "Brouillon"}
                      </span>

                      <button
                        className="primaryButton"
                        onClick={() => setEditingLesson(lesson)}
                        style={{
                          flexShrink: 0,
                          whiteSpace: "nowrap"
                        }}
                      >
                        Gérer le contenu
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        flexWrap: "wrap",
                        marginLeft: "52px",
                        marginTop: "14px"
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          background: "#f0f5ff",
                          color: "#2b5cb8",
                          fontSize: "13px",
                          fontWeight: 700
                        }}
                      >
                        <PlaySquare size={15} />
                        {videoCount} vidéo{videoCount !== 1 ? "s" : ""}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "8px",
                          background: "#fef6e7",
                          color: "#b07b00",
                          fontSize: "13px",
                          fontWeight: 700
                        }}
                      >
                        <FileText size={15} />
                        {resourceCount} support{resourceCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {contentLessonId === lesson.id && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(280px,1fr))",
                          gap: "18px",
                          marginTop: "22px",
                          paddingTop: "22px",
                          borderTop: "1px solid #e5eaf0"
                        }}
                      >
                        <form
                          onSubmit={e => createVideo(e, lesson)}
                          style={{
                            padding: "18px",
                            borderRadius: "12px",
                            background: "#f7f9fb",
                            border: "1px solid #e5eaf0"
                          }}
                        >
                          <h4 style={{ margin: "0 0 14px" }}>Ajouter une vidéo</h4>

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
                            background: "#f7f9fb",
                            border: "1px solid #e5eaf0"
                          }}
                        >
                          <h4 style={{ margin: "0 0 14px" }}>Ajouter un support</h4>

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
                            <option value="powerpoint">PowerPoint (PPT/PPTX)</option>
                            <option value="word">Word (DOC/DOCX)</option>
                            <option value="excel">Excel (XLS/XLSX)</option>
                            <option value="image">Image</option>
                            <option value="document">Autre document</option>
                            <option value="link">Lien externe</option>
                            <option value="text">Texte</option>
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
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {formError && (
        <div style={{
          margin: "16px 0",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#fef2f2",
          color: "#c0392b",
          fontSize: "14px",
          fontWeight: 600
        }}>
          {formError}
        </div>
      )}

      {editingLesson && (
        <LessonEditor
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSaved={() => {
            setEditingLesson(null);
            refresh();
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
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  async function deleteVideo(videoId) {
    if (!videoId) {
      setSaveError("Impossible de supprimer cette vidéo : ID manquant.");
      return;
    }

    if (!window.confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
      return;
    }

    try {
      setSaveError("");
      const response = await fetch(
        `/api/admin/videos/${videoId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      const text = await response.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch {} }

      if (!response.ok || !data || !data.success) {
        throw new Error(
          (data && data.error) || "Impossible de supprimer la vidéo."
        );
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      setSaveError(error.message);
    }
  }

  async function saveLesson() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await fetch(
        `/api/admin/lessons/${lesson.id}`,
        {
          method: "PATCH",
          credentials: "include",
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

      const text = await response.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch {} }

      if (!response.ok) {
        throw new Error(
          (data && data.error) || "Impossible d'enregistrer la séance"
        );
      }

      setSaveSuccess("Modifications enregistrées");

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      setSaveError(error.message);
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

          {saveError && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#c0392b",
              fontSize: "14px",
              fontWeight: 600
            }}>
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#e8f5ee",
              color: "#287a55",
              fontSize: "14px",
              fontWeight: 600
            }}>
              {saveSuccess}
            </div>
          )}

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
      console.error("Video ID missing");
      return;
    }

    if (!window.confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/videos/${videoId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      const text = await response.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch {} }

      if (!response.ok || !data || !data.success) {
        throw new Error(
          (data && data.error) || "Impossible de supprimer la vidéo."
        );
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      console.error(error.message);
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
      console.error("Video title required");
      return;
    }

    if (!video.file && !video.url.trim()) {
      console.error("File or URL required");
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

        const uploadText = await uploadResponse.text(); let uploadData = null; if (uploadText) { try { uploadData = JSON.parse(uploadText); } catch {} }

        if (!uploadResponse.ok || !uploadData || !uploadData.success) {
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

      const text = await response.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch {} }

      if (!response.ok || !data || !data.success) {
        throw new Error(
          (data && data.error) ||
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
      console.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addResource(event) {
    event.preventDefault();

    if (!resource.title.trim()) {
      console.error("Resource title required");
      return;
    }

    if (!resource.file && !resource.url.trim()) {
      console.error("File or URL required");
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

        const uploadText = await uploadResponse.text();
        let uploadData = null;
        if (uploadText) { try { uploadData = JSON.parse(uploadText); } catch {} }

        if (!uploadResponse.ok || !uploadData || !uploadData.success) {
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

      const text = await response.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch {} }

      if (!response.ok) {
        throw new Error(
          (data && data.error) ||
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
      console.error("Erreur ajout support :", error.message);
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
          <strong>Nouveau support pédagogique</strong>

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
            <option value="powerpoint">PowerPoint (PPT/PPTX)</option>
            <option value="word">Word (DOC/DOCX)</option>
            <option value="excel">Excel (XLS/XLSX)</option>
            <option value="image">Image</option>
            <option value="document">Autre document</option>
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
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.svg,.webp"
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
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [formation, setFormation] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [studentPage, setStudentPage] = useState("dashboard");
  const [completed, setCompleted] = useState([]);

  async function loadProgress() {
    try {
      const res = await fetch("/api/student/progress", { credentials: "include" });
      if (res.ok) {
        const data = await safeJson(res);
        if (data && data.success && data.completed) {
          setCompleted(data.completed.map(c => c.lesson_id));
        }
      }
    } catch (err) {
      console.warn("Failed to load progress:", err);
    }
  }

  function toggleCompleted(id) {
    const isDone = completed.includes(id);
    const newCompleted = isDone
      ? completed.filter(item => item !== id)
      : [...completed, id];
    setCompleted(newCompleted);

    fetch("/api/student/progress", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: id, completed: !isDone })
    }).catch(err => console.warn("Failed to save progress:", err));
  }

  async function loadStudent() {
    setLoading(true);
    setError("");

    try {
      const meResponse = await fetch("/api/auth/me", { credentials: "include" });

      if (!meResponse.ok) {
        setAuthenticated(false);
        setUser(null);
        setFormation(null);
        return;
      }

      const me = await safeJson(meResponse);

      if (!me || !me.success || !me.authenticated) {
        setAuthenticated(false);
        setUser(null);
        setFormation(null);
        return;
      }

      setAuthenticated(true);
      setUser(me.user);

      await loadProgress();

      try {
        const formationResponse = await fetch("/api/student/formation", {
          credentials: "include"
        });

        if (formationResponse.ok) {
          const data = await safeJson(formationResponse);
          if (data && data.success && data.formation) {
            setFormation(data.formation);
          } else {
            throw new Error("Pas de formation");
          }
        } else {
          throw new Error("Formation endpoint: " + formationResponse.status);
        }
      } catch (err) {
        console.warn("Formation load via /api/student/formation failed, trying /api/content:", err);

        try {
          const contentResponse = await fetch("/api/content", {
            credentials: "include"
          });

          if (contentResponse.ok) {
            const contentData = await safeJson(contentResponse);

            if (contentData && contentData.formation) {
              setFormation(contentData);
            }
          }
        } catch (err2) {
          console.warn("Content fallback also failed:", err2);
        }
      }

    } catch (err) {
      console.error("FCS STUDENT PORTAL:", err);
      setError(err.message || "Impossible de charger ton espace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, []);

  async function login(event) {
    event.preventDefault();
    setLoginLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(response);

      if (!response.ok || !data || !data.success) {
        throw new Error(data?.error || "Email ou mot de passe incorrect.");
      }

      setEmail("");
      setPassword("");
      await loadStudent();

    } catch (err) {
      setError(err.message || "Impossible de se connecter.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) { console.error(err); }
    setAuthenticated(false);
    setUser(null);
    setFormation(null);
    setCompleted([]);
    setStudentPage("dashboard");
    window.history.replaceState(null, "", "/student");
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
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "46px", height: "46px", borderRadius: "50%",
            border: "4px solid #dfe6ed", borderTopColor: "#f1bd3e",
            margin: "0 auto 18px",
            animation: "spin 1s linear infinite"
          }} />
          <strong style={{ color: "#09233d" }}>Chargement de ton espace...</strong>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #071c31 0%, #123c61 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}>
        <div style={{
          width: "100%", maxWidth: "460px",
          background: "#fff", borderRadius: "24px",
          padding: "42px",
          boxShadow: "0 30px 80px rgba(0,0,0,.25)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "34px" }}>
            <div style={{
              width: "58px", height: "58px", borderRadius: "16px",
              background: "#09233d", color: "#f1bd3e",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              fontSize: "22px", fontWeight: 900,
              margin: "0 auto 16px"
            }}>
              FCS
            </div>
            <h1 style={{ margin: "0 0 8px", color: "#09233d", fontSize: "24px" }}>
              Football Coach System
            </h1>
            <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>
              Connecte-toi pour accéder à ta formation
            </p>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: "10px",
              background: "#fef2f2", color: "#c0392b",
              fontSize: "14px", marginBottom: "18px"
            }}>
              {error}
            </div>
          )}

          <form onSubmit={login} style={{ display: "grid", gap: "16px" }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px 16px",
                border: "1px solid #dfe5eb", borderRadius: "12px",
                fontSize: "15px", outline: "none",
                boxSizing: "border-box"
              }}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px 16px",
                border: "1px solid #dfe5eb", borderRadius: "12px",
                fontSize: "15px", outline: "none",
                boxSizing: "border-box"
              }}
            />
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                border: 0, borderRadius: "12px", padding: "14px",
                background: "#f1bd3e", color: "#09233d",
                fontWeight: 800, fontSize: "15px",
                cursor: "pointer"
              }}
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Use fallback modules if API didn't return formation data
  const studentModules = formation?.modules?.length
    ? normalizeApiModules({
        formation: formation,
        modules: formation.modules.map(m => ({
          ...m,
          lessons: (m.lessons || []).map(l => ({
            ...l,
            videos: l.videos || [],
            resources: []
          }))
        }))
      })
    : getFallbackModules();

  const allLessons = studentModules.flatMap(m => m.lessons || []);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(l => completed.includes(l.id)).length;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const totalVideos = studentModules.reduce((t, m) =>
    t + (m.lessons || []).reduce((s, l) => s + (l.videos?.length || 0), 0), 0);

  // Find next lesson
  let nextLesson = null, nextModule = null;
  for (const module of studentModules) {
    const pending = (module.lessons || []).find(l => !completed.includes(l.id));
    if (pending) { nextLesson = pending; nextModule = module; break; }
  }

  const studentMenu = [
    { key: "dashboard", label: "Accueil", icon: Home },
    { key: "formation", label: "Ma formation", icon: BookOpen },
    { key: "documents", label: "Documents & Templates", icon: FileText },
    { key: "quiz", label: "Quiz", icon: HelpCircle },
    { key: "model-game", label: "Mon Modèle de jeu", icon: Brain },
    { key: "lives", label: "Lives & Replays", icon: CalendarDays },
    { key: "progress", label: "Ma progression", icon: BarChart3 }
  ];

  function StudentSidebar() {
    return (
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">FCS</div>
          <div>
            <strong>FOOTBALL COACH</strong>
            <div className="tagline">ESPACE APPRENANT</div>
          </div>
        </div>
        <nav>
          {studentMenu.map(item => {
            const Icon = item.icon;
            const active = studentPage === item.key;
            return (
              <button
                key={item.key}
                className={`navItem ${active ? "active" : ""}`}
                onClick={() => { setStudentPage(item.key); window.scrollTo(0, 0); }}
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          style={{
            width: "calc(100% - 28px)",
            margin: "10px 14px 18px",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.06)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            textAlign: "left"
          }}
        >
          Déconnexion
        </button>
      </aside>
    );
  }

  function StudentDashboard() {
    return (
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#718096", marginBottom: "8px" }}>
            FOOTBALL COACH SYSTEM
          </div>
          <h1 style={{ margin: 0, fontSize: "34px", color: "#09233d", letterSpacing: "-0.8px" }}>
            Bonjour {user?.first_name || "Coach"}
          </h1>
          <p style={{ margin: "10px 0 0", color: "#68798a", fontSize: "16px" }}>
            Continue ton parcours et développe ta méthode d'entraîneur.
          </p>
        </div>

        <section style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(260px, .8fr)",
          gap: "20px", marginBottom: "24px"
        }}>
          <article style={{
            background: "linear-gradient(135deg, #09233d 0%, #123c61 100%)",
            color: "#fff", borderRadius: "22px", padding: "30px",
            minHeight: "250px", boxShadow: "0 14px 35px rgba(9,35,61,.14)"
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 800, letterSpacing: "1.2px",
              textTransform: "uppercase", opacity: .65
            }}>
              Continuer ma formation
            </div>
            <h2 style={{ margin: "12px 0 6px", fontSize: "25px" }}>
              {nextModule?.title || "Commencer la formation"}
            </h2>
            <p style={{ margin: "0 0 24px", opacity: .78, fontSize: "15px" }}>
              {nextLesson ? nextLesson.title : "Tous les contenus disponibles sont terminés."}
            </p>
            <div style={{
              height: "7px", background: "rgba(255,255,255,.18)",
              borderRadius: "99px", overflow: "hidden", marginBottom: "9px"
            }}>
              <div style={{
                width: `${progress}%`, height: "100%",
                background: "#f1bd3e", borderRadius: "99px"
              }} />
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "13px", opacity: .72, marginBottom: "22px"
            }}>
              <span>{progress}% terminé</span>
              <span>{completedCount}/{totalLessons} leçons</span>
            </div>
            <button
              onClick={() => setStudentPage("formation")}
              disabled={!nextModule}
              style={{
                border: 0, borderRadius: "11px", padding: "13px 20px",
                background: "#f1bd3e", color: "#09233d",
                fontWeight: 800, fontSize: "14px",
                cursor: nextModule ? "pointer" : "default",
                opacity: nextModule ? 1 : .5
              }}
            >
              {nextLesson ? "Continuer mon parcours" : "Formation terminée"}
            </button>
          </article>

          <article style={{
            background: "#fff", border: "1px solid #e7edf2",
            borderRadius: "22px", padding: "28px",
            boxShadow: "0 8px 24px rgba(9,35,61,.04)"
          }}>
            <div style={{
              fontSize: "13px", fontWeight: 800, color: "#718096",
              textTransform: "uppercase", letterSpacing: ".8px"
            }}>
              Ma progression
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "22px", marginTop: "24px"
            }}>
              <div style={{
                width: "104px", height: "104px", borderRadius: "50%",
                background: `conic-gradient(#f1bd3e ${progress * 3.6}deg, #edf1f4 0deg)`,
                display: "grid", placeItems: "center", flexShrink: 0
              }}>
                <div style={{
                  width: "78px", height: "78px", borderRadius: "50%",
                  background: "#fff", display: "grid", placeItems: "center",
                  color: "#09233d", fontWeight: 900, fontSize: "21px"
                }}>
                  {progress}%
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "17px", color: "#09233d" }}>
                  Ton parcours
                </div>
                <div style={{ marginTop: "7px", color: "#718096", fontSize: "14px", lineHeight: 1.5 }}>
                  {completedCount} leçon{completedCount !== 1 ? "s" : ""} terminée{completedCount !== 1 ? "s" : ""}
                  {" "}sur {totalLessons}.
                </div>
              </div>
            </div>
          </article>
        </section>

        <section style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "16px", marginBottom: "30px"
        }}>
          {[
            ["Modules", studentModules.length],
            ["Leçons", totalLessons],
            ["Vidéos", totalVideos]
          ].map(([label, value]) => (
            <div key={label} style={{
              background: "#fff", border: "1px solid #e7edf2",
              borderRadius: "17px", padding: "20px 22px"
            }}>
              <div style={{ color: "#718096", fontSize: "13px", fontWeight: 700 }}>{label}</div>
              <div style={{ marginTop: "7px", color: "#09233d", fontSize: "27px", fontWeight: 900 }}>
                {value}
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 style={{ margin: "0 0 16px", color: "#09233d", fontSize: "22px" }}>
            Mes modules
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px"
          }}>
            {studentModules.map((module, index) => {
              const lessons = module.lessons || [];
              const done = lessons.filter(l => completed.includes(l.id)).length;
              const modProgress = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
              const status = modProgress === 0 ? "À commencer" : modProgress === 100 ? "Terminé" : "En cours";
              const statusColor = modProgress === 0 ? "#9aa5b5" : modProgress === 100 ? "#287a55" : "#b07b00";

              return (
                <article key={module.id} style={{
                  background: "#fff", border: "1px solid #e7edf2",
                  borderRadius: "19px", padding: "22px"
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#718096" }}>
                      {module.isWelcome ? "BIENVENUE" : module.number}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: statusColor }}>
                      {status}
                    </span>
                  </div>
                  <h3 style={{ color: "#09233d", margin: "16px 0 7px", fontSize: "18px", lineHeight: 1.3 }}>
                    {module.title}
                  </h3>
                  <p style={{ color: "#718096", fontSize: "13px", margin: "0 0 16px" }}>
                    {lessons.length} leçon{lessons.length !== 1 ? "s" : ""}
                  </p>
                  <div style={{
                    height: "6px", background: "#edf1f4",
                    borderRadius: "99px", overflow: "hidden", marginBottom: "17px"
                  }}>
                    <div style={{
                      width: `${modProgress}%`, height: "100%",
                      background: "#f1bd3e", borderRadius: "99px"
                    }} />
                  </div>
                  <button
                    onClick={() => setStudentPage("formation")}
                    style={{
                      width: "100%", border: 0, borderRadius: "11px",
                      padding: "12px 16px", background: "#f1bd3e",
                      color: "#09233d", fontWeight: 800, cursor: "pointer"
                    }}
                  >
                    {modProgress > 0 ? "Continuer" : "Commencer"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  function StudentQuiz({ modules, user }) {
    const allLessons = modules.flatMap(m => (m.lessons || []).map(l => ({ ...l, moduleTitle: m.title, moduleKey: m.moduleKey })));
    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [previousResult, setPreviousResult] = useState(null);
    const [error, setError] = useState("");

    async function loadQuiz(lesson) {
      setSelectedLessonId(lesson.numericId);
      setLoading(true);
      setQuizData(null);
      setAnswers({});
      setResult(null);
      setPreviousResult(null);
      setError("");

      try {
        const res = await fetch(`/api/student/quiz/${lesson.numericId}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setQuizData(data.quiz);
          setPreviousResult(data.previousResult || null);
        } else {
          setError(data.error || "Impossible de charger le quiz.");
        }
      } catch (err) {
        setError("Impossible de charger le quiz.");
      } finally {
        setLoading(false);
      }
    }

    async function submitQuiz() {
      if (!quizData || !selectedLessonId) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/student/quiz/${selectedLessonId}/submit`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers })
        });
        const data = await res.json();
        if (data.success) {
          setResult(data);
        } else {
          setError(data.error || "Impossible de soumettre le quiz.");
        }
      } catch (err) {
        setError("Impossible de soumettre le quiz.");
      } finally {
        setLoading(false);
      }
    }

    const selectedLesson = allLessons.find(l => l.numericId === selectedLessonId);

    return (
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "34px 28px 60px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
            ÉVALUATION
          </div>
          <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>Quiz</h1>
          <p style={{ color: "#6b7a8c", margin: 0 }}>
            Teste tes connaissances après chaque leçon. Chaque quiz contient 7 questions.
          </p>
        </div>

        {/* LESSON SELECTOR */}
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "20px", marginBottom: "24px"
        }}>
          <strong style={{ color: "#09233d", fontSize: "15px", display: "block", marginBottom: "12px" }}>
            Choisir une leçon
          </strong>
          <div style={{ display: "grid", gap: "8px" }}>
            {allLessons.map(lesson => (
              <button
                key={lesson.numericId}
                onClick={() => loadQuiz(lesson)}
                style={{
                  width: "100%", textAlign: "left", border: selectedLessonId === lesson.numericId ? "2px solid #f1bd3e" : "1px solid #e5eaf0",
                  background: selectedLessonId === lesson.numericId ? "#fff7df" : "#fff",
                  borderRadius: "10px", padding: "12px 16px", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: "14px", color: "#09233d", fontWeight: 600
                }}
              >
                <span>{lesson.title}</span>
                <span style={{ fontSize: "11px", color: "#9aa5b5" }}>{lesson.moduleKey}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: "14px 18px", borderRadius: "10px", background: "#fef2f2",
            color: "#c0392b", fontSize: "14px", marginBottom: "20px"
          }}>{error}</div>
        )}

        {loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "#7b8797" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Chargement du quiz...</div>
          </div>
        )}

        {/* QUIZ DISPLAY */}
        {!loading && quizData && quizData.questions && quizData.questions.length > 0 && (
          <div style={{
            background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
            padding: "28px"
          }}>
            {previousResult && !result && (
              <div style={{
                padding: "12px 16px", borderRadius: "10px", background: "#f0f7ff",
                border: "1px solid #d0e0f0", fontSize: "13px", color: "#09233d",
                marginBottom: "20px", fontWeight: 600
              }}>
                Dernier résultat : {previousResult.score}/{previousResult.total_questions} ({Math.round((previousResult.score / previousResult.total_questions) * 100)}%)
              </div>
            )}

            <h2 style={{ margin: "0 0 6px", color: "#09233d", fontSize: "20px" }}>{quizData.title}</h2>
            <p style={{ color: "#7b8797", fontSize: "14px", margin: "0 0 24px" }}>
              {selectedLesson?.title} · {quizData.questions.length} question{quizData.questions.length !== 1 ? "s" : ""}
            </p>

            <div style={{ display: "grid", gap: "20px" }}>
              {quizData.questions.map((q, qIdx) => (
                <div key={q.id} style={{
                  border: "1px solid #edf0f3", borderRadius: "12px", padding: "18px"
                }}>
                  <div style={{ fontWeight: 700, color: "#09233d", marginBottom: "12px", fontSize: "15px" }}>
                    {qIdx + 1}. {q.question}
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === opt;
                      const showCorrect = result && result.details;
                      const detail = result?.details?.find(d => d.question_id === q.id);
                      const isCorrectAnswer = detail && opt === quizData.questions[qIdx].options.find(o => o === detail.user_answer);

                      return (
                        <button
                          key={oIdx}
                          onClick={() => !result && setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          disabled={!!result}
                          style={{
                            width: "100%", textAlign: "left",
                            border: result && detail && detail.user_answer === opt
                              ? detail.correct ? "2px solid #287a55" : "2px solid #c0392b"
                              : isSelected ? "2px solid #f1bd3e" : "1px solid #dfe5eb",
                            background: result && detail && detail.user_answer === opt
                              ? detail.correct ? "#e8f5ee" : "#fef2f2"
                              : isSelected ? "#fff7df" : "#fff",
                            borderRadius: "10px", padding: "12px 16px", cursor: result ? "default" : "pointer",
                            fontSize: "14px", color: "#09233d", fontWeight: 500
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!result ? (
              <button
                onClick={submitQuiz}
                disabled={Object.keys(answers).length < quizData.questions.length}
                style={{
                  marginTop: "24px", border: 0, borderRadius: "12px", padding: "14px 28px",
                  background: Object.keys(answers).length < quizData.questions.length ? "#ccc" : "#f1bd3e",
                  color: "#09233d", fontWeight: 800, cursor: "pointer", fontSize: "15px"
                }}
              >
                {Object.keys(answers).length < quizData.questions.length
                  ? `Répondre à toutes les questions (${Object.keys(answers).length}/${quizData.questions.length})`
                  : "Valider mes réponses"}
              </button>
            ) : (
              <div style={{
                marginTop: "24px", padding: "24px", borderRadius: "14px",
                background: result.percentage >= 70 ? "#e8f5ee" : "#fef9e7",
                border: `1px solid ${result.percentage >= 70 ? "#287a55" : "#b07b00"}`,
                textAlign: "center"
              }}>
                <div style={{ fontSize: "36px", fontWeight: 900, color: result.percentage >= 70 ? "#287a55" : "#b07b00" }}>
                  {result.percentage}%
                </div>
                <div style={{ fontSize: "16px", color: "#09233d", fontWeight: 700, marginTop: "8px" }}>
                  {result.score} / {result.total} bonnes réponses
                </div>
                <div style={{ fontSize: "14px", color: "#6b7a8c", marginTop: "8px" }}>
                  {result.percentage >= 70 ? "Bravo, tu maîtrises cette leçon !" : "Continue à réviser et réessaie."}
                </div>
                <button
                  onClick={() => { setResult(null); setAnswers({}); }}
                  style={{
                    marginTop: "16px", border: "1px solid #dfe5eb", borderRadius: "10px",
                    padding: "10px 20px", background: "#fff", color: "#09233d",
                    fontWeight: 700, cursor: "pointer", fontSize: "14px"
                  }}
                >
                  Recommencer le quiz
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && quizData && (!quizData.questions || quizData.questions.length === 0) && (
          <div style={{
            background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
            padding: "48px 24px", textAlign: "center", color: "#7b8797"
          }}>
            <HelpCircle size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
            <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "6px" }}>
              Quiz pas encore disponible
            </p>
            <p style={{ fontSize: "14px" }}>
              Le quiz pour cette leçon sera bientôt disponible. L'administrateur doit encore créer les questions.
            </p>
          </div>
        )}

        {!loading && !quizData && !error && (
          <div style={{
            background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
            padding: "48px 24px", textAlign: "center", color: "#7b8797"
          }}>
            <HelpCircle size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
            <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "6px" }}>
              Sélectionne une leçon
            </p>
            <p style={{ fontSize: "14px" }}>
              Choisis une leçon ci-dessus pour accéder à son quiz.
            </p>
          </div>
        )}
      </div>
    );
  }

  function StudentProgress() {
    const moduleStats = studentModules.map(module => {
      const lessons = module.lessons || [];
      const done = lessons.filter(l => completed.includes(l.id)).length;
      return {
        id: module.id,
        title: module.title,
        number: module.number,
        done,
        total: lessons.length,
        pct: lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0
      };
    });

    return (
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
            SUIVI
          </div>
          <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>Ma progression</h1>
          <p style={{ color: "#6b7a8c", margin: 0 }}>
            {completedCount} leçon{completedCount !== 1 ? "s" : ""} terminée{completedCount !== 1 ? "s" : ""} sur {totalLessons} · {progress}%
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px", marginBottom: "24px"
        }}>
          <StatCard title="Progression" value={`${progress}%`} icon="📈" />
          <StatCard title="Leçons terminées" value={`${completedCount}`} icon="✅" />
          <StatCard title="Leçons restantes" value={`${totalLessons - completedCount}`} icon="🎯" />
          <StatCard title="Modules" value={`${studentModules.length}`} icon="📚" />
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          {moduleStats.map(m => (
            <div key={m.id} style={{
              background: "#fff", border: "1px solid #e5e9ef",
              borderRadius: "16px", padding: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong style={{ color: "#09233d" }}>{m.title}</strong>
                <strong style={{ color: "#b07b00" }}>{m.pct}%</strong>
              </div>
              <div style={{
                marginTop: "12px", height: "8px",
                background: "#edf0f3", borderRadius: "999px"
              }}>
                <div style={{
                  width: `${m.pct}%`, height: "100%",
                  background: "#f1bd3e", borderRadius: "999px"
                }} />
              </div>
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#6b7a8c" }}>
                {m.done} / {m.total} leçons
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <StudentSidebar />
      <main className="main">
        <Topbar />
        {studentPage === "dashboard" ? (
          <StudentDashboard />
        ) : studentPage === "formation" ? (
          <StudentFormation
            formation={formation}
            modules={studentModules}
            completed={completed}
            onToggleCompleted={toggleCompleted}
            user={user}
          />
        ) : studentPage === "documents" ? (
          <DocumentsTemplates modules={studentModules} />
        ) : studentPage === "quiz" ? (
          <StudentQuiz modules={studentModules} user={user} />
        ) : studentPage === "model-game" ? (
          <GameModelStudent user={user} />
        ) : studentPage === "lives" ? (
          <LivesReplaysStudent />
        ) : studentPage === "progress" ? (
          <StudentProgress />
        ) : (
          <StudentDashboard />
        )}
      </main>
    </div>
  );
}


function AdminApp() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [page, setPage] = useState("dashboard");
  const [platformPage, setPlatformPage] = useState("home");
  const [activeModuleId, setActiveModuleId] = useState(1);
  const [initialLessonId, setInitialLessonId] = useState(null);
  const [apiModules, setApiModules] = useState(() => getFallbackModules());

  const [completed, setCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem("fcs-completed-lessons");
      return saved ? JSON.parse(saved) : initialCompleted;
    } catch {
      return initialCompleted;
    }
  });

  async function checkAuth() {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setAuthed(false);
        setAuthUser(null);
        return;
      }
      const data = await safeJson(res);
      if (data && data.success && data.authenticated) {
        if (data.user.role === "student") {
          window.location.href = "/student";
          return;
        }
        setAuthed(true);
        setAuthUser(data.user);
      } else {
        setAuthed(false);
        setAuthUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setAuthed(false);
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "fcs-completed-lessons",
      JSON.stringify(completed)
    );
  }, [completed]);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const response = await fetch(
          "/api/content",
          { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
          throw new Error(`API content HTTP ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Réponse non-JSON — API indisponible");
        }

        const data = await response.json();

        const modules = normalizeApiModules(data);

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

  async function handleAdminLogin(event) {
    event.preventDefault();
    setLoginLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await safeJson(response);
      if (!response.ok || !data || !data.success) {
        throw new Error(data?.error || "Email ou mot de passe incorrect.");
      }
      setLoginEmail("");
      setLoginPassword("");
      await checkAuth();
    } catch (err) {
      setAuthError(err.message || "Impossible de se connecter.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.error(err);
    }

    setAuthed(false);
    setAuthUser(null);
    setPage("dashboard");
  }

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

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fa",
        fontFamily: "Inter, system-ui, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "46px", height: "46px", borderRadius: "50%",
            border: "4px solid #dfe6ed", borderTopColor: "#f1bd3e",
            margin: "0 auto 18px",
            animation: "spin 1s linear infinite"
          }} />
          <strong style={{ color: "#09233d" }}>Chargement...</strong>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #071c31 0%, #123c61 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Inter, system-ui, sans-serif"
      }}>
        <div style={{
          width: "100%", maxWidth: "460px",
          background: "#fff", borderRadius: "24px",
          padding: "42px",
          boxShadow: "0 30px 80px rgba(0,0,0,.25)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "34px" }}>
            <div style={{
              width: "58px", height: "58px", borderRadius: "16px",
              background: "#09233d", color: "#f1bd3e",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              fontSize: "22px", fontWeight: 900,
              margin: "0 auto 16px"
            }}>
              FCS
            </div>
            <h1 style={{ margin: "0 0 8px", color: "#09233d", fontSize: "24px" }}>
              Football Coach System
            </h1>
            <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>
              Espace administrateur — connecte-toi
            </p>
          </div>

          {authError && (
            <div style={{
              padding: "12px 16px", borderRadius: "10px",
              background: "#fef2f2", color: "#c0392b",
              fontSize: "14px", marginBottom: "18px"
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: "grid", gap: "16px" }}>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px 16px",
                border: "1px solid #dfe5eb", borderRadius: "12px",
                fontSize: "15px", outline: "none",
                boxSizing: "border-box"
              }}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px 16px",
                border: "1px solid #dfe5eb", borderRadius: "12px",
                fontSize: "15px", outline: "none",
                boxSizing: "border-box"
              }}
            />
            <button
              type="submit"
              disabled={loginLoading}
              style={{
                border: 0, borderRadius: "12px", padding: "14px",
                background: "#f1bd3e", color: "#09233d",
                fontWeight: 800, fontSize: "15px",
                cursor: "pointer"
              }}
            >
              {loginLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const modules = Array.isArray(apiModules) ? apiModules : [];

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
          ) : platformPage === "documents" ? (
            <DocumentsTemplates modules={modules} isAdmin={true} />
          ) : platformPage === "quizzes" ? (
            <QuizAdmin modules={modules} />
          ) : platformPage === "lives" ? (
            <LivesReplaysAdmin />
          ) : platformPage === "model-game" ? (
            <ModelGameSection />
          ) : platformPage === "learners" ? (
            <LearnersAdmin />
          ) : platformPage === "tracking" ? (
            <ProgressAdmin />
          ) : (
            <PlatformSection
              page={platformPage}
              navigate={navigatePlatform}
              modules={modules}
              completed={completed}
            />
          )
        ) : page === "module" && activeModule ? (
          <ModulePage
            key={`${activeModuleId}:${initialLessonId || "auto"}`}
            module={activeModule}
            completed={completed}
            toggleCompleted={toggleCompleted}
            onBack={goHome}
            initialLessonId={initialLessonId}
          />
        ) : (
          <Dashboard
            completed={completed}
            openModule={openModule}
            modules={modules}
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
