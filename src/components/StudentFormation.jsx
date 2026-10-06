import { useState, useMemo, useEffect } from "react";
import {
  PlayCircle, CheckCircle2, Circle, ChevronRight, ChevronDown,
  FileText, BadgeCheck, ArrowLeft, ArrowRight, StickyNote,
  Presentation, FileSpreadsheet, Download, Eye
} from "lucide-react";

const TYPE_ICONS = {
  pdf: FileText,
  powerpoint: Presentation,
  ppt: Presentation,
  pptx: Presentation,
  word: FileText,
  doc: FileText,
  docx: FileText,
  excel: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  image: FileText,
  document: FileText,
  link: FileText,
  text: FileText
};

function StudentFormation({ formation, modules, completed, onToggleCompleted, user }) {
  const [openModuleIds, setOpenModuleIds] = useState(() => {
    return modules.length ? [modules[0].id] : [];
  });
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [activeTab, setActiveTab] = useState("presentation");
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [notes, setNotes] = useState(() => {
    try {
      const key = `fcs-notes-${user?.id || "anon"}`;
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch { return {}; }
  });

  useEffect(() => {
    const key = `fcs-notes-${user?.id || "anon"}`;
    localStorage.setItem(key, JSON.stringify(notes));
  }, [notes, user]);

  function toggleModule(moduleId) {
    setOpenModuleIds(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  }

  function selectLesson(module, lesson) {
    setActiveModule(module);
    setActiveLesson(lesson);
    setActiveTab("presentation");
    setActiveVideoIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevLesson() {
    if (!activeModule || !activeLesson) return;
    const lessons = activeModule.lessons || [];
    const idx = lessons.findIndex(l => l.id === activeLesson.id);
    if (idx > 0) {
      setActiveLesson(lessons[idx - 1]);
    } else {
      const moduleIdx = modules.findIndex(m => m.id === activeModule.id);
      if (moduleIdx > 0) {
        const prevMod = modules[moduleIdx - 1];
        const prevLessons = prevMod.lessons || [];
        if (prevLessons.length) {
          setActiveModule(prevMod);
          setActiveLesson(prevLessons[prevLessons.length - 1]);
        }
      }
    }
  }

  function goNextLesson() {
    if (!activeModule || !activeLesson) return;
    const lessons = activeModule.lessons || [];
    const idx = lessons.findIndex(l => l.id === activeLesson.id);
    if (idx < lessons.length - 1) {
      setActiveLesson(lessons[idx + 1]);
    } else {
      const moduleIdx = modules.findIndex(m => m.id === activeModule.id);
      if (moduleIdx < modules.length - 1) {
        const nextMod = modules[moduleIdx + 1];
        const nextLessons = nextMod.lessons || [];
        if (nextLessons.length) {
          setActiveModule(nextMod);
          setActiveLesson(nextLessons[0]);
        }
      }
    }
  }

  const totalLessons = modules.reduce((t, m) => t + (m.lessons?.length || 0), 0);
  const completedCount = modules.reduce((t, m) =>
    t + (m.lessons || []).filter(l => completed.includes(l.id)).length, 0
  );
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (activeLesson && activeModule) {
    const videos = activeLesson.videos || [];
    const resources = activeLesson.resources || [];
    const isDone = completed.includes(activeLesson.id);
    const lessonNotes = notes[activeLesson.id] || "";

    const lessonIdx = (activeModule.lessons || []).findIndex(l => l.id === activeLesson.id);
    const moduleIdx = modules.findIndex(m => m.id === activeModule.id);
    const isFirst = moduleIdx === 0 && lessonIdx === 0;
    const isLast = moduleIdx === modules.length - 1 && lessonIdx === (activeModule.lessons || []).length - 1;

    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 28px 60px" }}>
        <button
          onClick={() => { setActiveLesson(null); setActiveModule(null); }}
          style={{
            border: "1px solid #dfe5eb",
            background: "#fff",
            borderRadius: "10px",
            padding: "10px 16px",
            fontWeight: 700,
            color: "#475569",
            cursor: "pointer",
            marginBottom: "20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <ArrowLeft size={16} /> Retour à la formation
        </button>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 300px) minmax(0, 1fr)",
          gap: "24px",
          alignItems: "start"
        }}>
          {/* SIDEBAR - MODULES & LESSONS */}
          <aside style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e5eaf0",
            overflow: "hidden",
            position: "sticky",
            top: "20px"
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #edf0f3",
              fontWeight: 800,
              color: "#09233d",
              fontSize: "14px"
            }}>
              Contenu de la formation
            </div>

            <div style={{ padding: "8px", maxHeight: "600px", overflowY: "auto" }}>
              {modules.map((module, mIdx) => {
                const isOpen = openModuleIds.includes(module.id);
                const modLessons = module.lessons || [];
                const modDone = modLessons.filter(l => completed.includes(l.id)).length;

                return (
                  <div key={module.id} style={{ marginBottom: "4px" }}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: 0,
                        background: "transparent",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "#09233d"
                      }}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span style={{ flex: 1 }}>
                        {module.isWelcome ? "Bienvenue" : `Module ${module.number?.replace("MODULE ", "") || mIdx}`}
                      </span>
                      <span style={{ fontSize: "11px", color: "#9aa5b5" }}>
                        {modDone}/{modLessons.length}
                      </span>
                    </button>

                    {isOpen && (
                      <div style={{ paddingLeft: "20px" }}>
                        {modLessons.map(lesson => {
                          const done = completed.includes(lesson.id);
                          const isActive = activeLesson?.id === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => selectLesson(module, lesson)}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                border: 0,
                                background: isActive ? "#fff7df" : "transparent",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px",
                                color: isActive ? "#09233d" : "#6b7a8c",
                                fontWeight: isActive ? 700 : 500
                              }}
                            >
                              {done ? (
                                <CheckCircle2 size={15} style={{ color: "#287a55", flexShrink: 0 }} />
                              ) : (
                                <Circle size={15} style={{ color: "#cdd5de", flexShrink: 0 }} />
                              )}
                              <span style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {lesson.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* MAIN - VIDEO + TABS */}
          <div>
            {/* VIDEO PLAYER */}
            <div style={{
              background: "#000",
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "20px",
              aspectRatio: "16/9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {videos.length > 0 ? (
                <video
                  key={videos[activeVideoIndex]?.id || videos[0].id}
                  src={videos[activeVideoIndex]?.url || videos[0].url}
                  controls
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#6b7a8c" }}>
                  <PlayCircle size={48} style={{ opacity: 0.4, marginBottom: "12px" }} />
                  <p>Aucune vidéo disponible pour cette leçon</p>
                </div>
              )}
            </div>

            {/* VIDEO SELECTOR for multi-part lessons */}
            {videos.length > 1 && (
              <div style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                flexWrap: "wrap"
              }}>
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVideoIndex(i)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: i === activeVideoIndex ? "2px solid #f1bd3e" : "1px solid #dfe5eb",
                      background: i === activeVideoIndex ? "#fff7df" : "#fff",
                      color: i === activeVideoIndex ? "#09233d" : "#6b7a8c",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <PlayCircle size={14} />
                    {v.title || `Partie ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* LESSON TITLE + NAVIGATION */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px"
            }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#b07b00", letterSpacing: "1px" }}>
                  {activeModule.isWelcome ? "BIENVENUE" : activeModule.number} · LEÇON {lessonIdx + 1}
                </div>
                <h1 style={{ margin: "6px 0 0", color: "#09233d", fontSize: "24px" }}>
                  {activeLesson.title}
                </h1>
              </div>

              <button
                onClick={() => onToggleCompleted(activeLesson.id)}
                style={{
                  border: isDone ? "1px solid #287a55" : 0,
                  borderRadius: "10px",
                  padding: "10px 18px",
                  background: isDone ? "#e8f5ee" : "#f1bd3e",
                  color: isDone ? "#287a55" : "#09233d",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                {isDone ? "Terminée" : "Marquer comme terminée"}
              </button>
            </div>

            {/* PREV / NEXT NAVIGATION */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "24px"
            }}>
              <button
                onClick={goPrevLesson}
                disabled={isFirst}
                style={{
                  border: "1px solid #dfe5eb",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  background: "#fff",
                  color: isFirst ? "#cdd5de" : "#475569",
                  fontWeight: 700,
                  cursor: isFirst ? "default" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px"
                }}
              >
                <ArrowLeft size={16} /> Précédent
              </button>

              <button
                onClick={goNextLesson}
                disabled={isLast}
                style={{
                  border: "1px solid #dfe5eb",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  background: "#fff",
                  color: isLast ? "#cdd5de" : "#475569",
                  fontWeight: 700,
                  cursor: isLast ? "default" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px"
                }}
              >
                Suivant <ArrowRight size={16} />
              </button>
            </div>

            {/* TABS */}
            <div style={{
              display: "flex",
              gap: "4px",
              borderBottom: "2px solid #edf0f3",
              marginBottom: "20px"
            }}>
              {[
                ["presentation", "Présentation"],
                ["ressources", `Ressources (${resources.length})`],
                ["notes", "Notes"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    border: 0,
                    borderBottom: activeTab === key ? "3px solid #f1bd3e" : "3px solid transparent",
                    background: "transparent",
                    padding: "12px 18px",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: activeTab === key ? "#09233d" : "#7b8797",
                    cursor: "pointer",
                    marginBottom: "-2px"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === "presentation" && (
              <div style={{
                background: "#fff",
                border: "1px solid #e5eaf0",
                borderRadius: "14px",
                padding: "24px",
                color: "#475569",
                lineHeight: 1.6
              }}>
                {activeLesson.description ? (
                  <p>{activeLesson.description}</p>
                ) : (
                  <p style={{ color: "#9aa5b5" }}>
                    Cette leçon ne contient pas encore de description détaillée.
                  </p>
                )}

                {videos.length > 1 && (
                  <div style={{ marginTop: "20px" }}>
                    <strong style={{ color: "#09233d", display: "block", marginBottom: "10px" }}>
                      Vidéos de cette leçon ({videos.length})
                    </strong>
                    {videos.map((v, i) => (
                      <div key={v.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: "10px",
                        marginBottom: "6px"
                      }}>
                        <PlayCircle size={18} style={{ color: "#b07b00" }} />
                        <span style={{ fontWeight: 600, color: "#09233d" }}>
                          {v.title || `Partie ${i + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "ressources" && (
              <div style={{
                background: "#fff",
                border: "1px solid #e5eaf0",
                borderRadius: "14px",
                padding: "24px"
              }}>
                {resources.length === 0 ? (
                  <p style={{ color: "#9aa5b5", textAlign: "center", padding: "20px" }}>
                    Aucune ressource associée à cette leçon pour le moment.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {resources.map((r, i) => {
                      const Icon = TYPE_ICONS[r.type] || FileText;
                      return (
                        <div key={r.id || i} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "14px",
                          padding: "14px 16px",
                          background: "#f8fafc",
                          borderRadius: "12px",
                          border: "1px solid #e5eaf0"
                        }}>
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "#fff",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0
                          }}>
                            <Icon size={20} style={{ color: "#475569" }} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ color: "#09233d", display: "block" }}>
                              {r.title}
                            </strong>
                            <span style={{ fontSize: "12px", color: "#9aa5b5" }}>
                              {r.type}
                            </span>
                          </div>

                          {r.url && (
                            <a
                              href={r.url}
                              download
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                background: "#f1bd3e",
                                color: "#09233d",
                                fontWeight: 700,
                                fontSize: "13px",
                                textDecoration: "none"
                              }}
                            >
                              <Download size={15} /> Télécharger
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div style={{
                background: "#fff",
                border: "1px solid #e5eaf0",
                borderRadius: "14px",
                padding: "24px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                  color: "#09233d",
                  fontWeight: 700
                }}>
                  <StickyNote size={20} /> Mes notes personnelles
                </div>

                <textarea
                  value={lessonNotes}
                  onChange={e => setNotes(prev => ({ ...prev, [activeLesson.id]: e.target.value }))}
                  placeholder="Écris tes notes ici... Elles sont sauvegardées automatiquement."
                  style={{
                    width: "100%",
                    minHeight: "200px",
                    border: "1px solid #dfe5eb",
                    borderRadius: "12px",
                    padding: "16px",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />

                <p style={{ marginTop: "10px", fontSize: "12px", color: "#9aa5b5" }}>
                  Sauvegarde automatique active
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // FORMATION OVERVIEW
  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
          MA FORMATION
        </div>
        <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>
          {formation?.title || "Football Coach System"}
        </h1>
        <p style={{ color: "#6b7a8c", margin: 0 }}>
          {completedCount} leçon{completedCount !== 1 ? "s" : ""} terminée{completedCount !== 1 ? "s" : ""} sur {totalLessons} · {progress}%
        </p>

        <div style={{
          height: "8px",
          background: "#edf0f3",
          borderRadius: "999px",
          overflow: "hidden",
          marginTop: "16px"
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "#f1bd3e",
            borderRadius: "999px",
            transition: "width .3s ease"
          }} />
        </div>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {modules.map((module, mIdx) => {
          const modLessons = module.lessons || [];
          const modDone = modLessons.filter(l => completed.includes(l.id)).length;
          const modProgress = modLessons.length > 0 ? Math.round((modDone / modLessons.length) * 100) : 0;
          const isOpen = openModuleIds.includes(module.id);
          const status = modProgress === 0 ? "À commencer" : modProgress === 100 ? "Terminé" : "En cours";
          const statusColor = modProgress === 0 ? "#9aa5b5" : modProgress === 100 ? "#287a55" : "#b07b00";

          return (
            <div key={module.id} style={{
              background: "#fff",
              border: "1px solid #e5eaf0",
              borderRadius: "16px",
              overflow: "hidden"
            }}>
              <button
                onClick={() => toggleModule(module.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  background: "transparent",
                  padding: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px"
                }}
              >
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: module.isWelcome ? "#e8f5ee" : "#09233d",
                  color: module.isWelcome ? "#287a55" : "#f1bd3e",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: "18px",
                  flexShrink: 0
                }}>
                  {module.isWelcome ? "W" : (module.number?.replace("MODULE ", "") || mIdx)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: statusColor,
                    letterSpacing: "1px"
                  }}>
                    {module.isWelcome ? "BIENVENUE" : module.number} · {status}
                  </div>
                  <h2 style={{
                    margin: "4px 0 6px",
                    color: "#09233d",
                    fontSize: "19px"
                  }}>
                    {module.title}
                  </h2>
                  <div style={{ fontSize: "13px", color: "#7b8797" }}>
                    {modLessons.length} leçon{modLessons.length !== 1 ? "s" : ""} · {modDone} terminée{modDone !== 1 ? "s" : ""}
                  </div>
                </div>

                <div style={{
                  width: "50px",
                  textAlign: "right",
                  fontWeight: 900,
                  color: "#09233d",
                  fontSize: "18px"
                }}>
                  {modProgress}%
                </div>

                {isOpen ? <ChevronDown size={22} style={{ color: "#9aa5b5" }} /> : <ChevronRight size={22} style={{ color: "#9aa5b5" }} />}
              </button>

              {isOpen && (
                <div style={{
                  borderTop: "1px solid #edf0f3",
                  padding: "12px 20px 20px"
                }}>
                  {modLessons.map((lesson, lIdx) => {
                    const done = completed.includes(lesson.id);
                    const videoCount = (lesson.videos || []).length;
                    const resourceCount = (lesson.resources || []).length;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(module, lesson)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "1px solid #e5eaf0",
                          borderRadius: "12px",
                          padding: "16px 18px",
                          marginBottom: "8px",
                          background: done ? "#f8fdf9" : "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "14px"
                        }}
                      >
                        <div style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "10px",
                          background: done ? "#287a55" : "#f0f4f8",
                          color: done ? "#fff" : "#7b8797",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          fontSize: "13px",
                          flexShrink: 0
                        }}>
                          {done ? <CheckCircle2 size={18} /> : String(lIdx + 1).padStart(2, "0")}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{
                            color: "#09233d",
                            fontSize: "15px",
                            display: "block"
                          }}>
                            {lesson.title}
                          </strong>
                          <div style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#9aa5b5"
                          }}>
                            {videoCount > 0 && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <PlayCircle size={13} /> {videoCount} vidéo{videoCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {resourceCount > 0 && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <FileText size={13} /> {resourceCount} support{resourceCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight size={20} style={{ color: "#cdd5de", flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentFormation;
