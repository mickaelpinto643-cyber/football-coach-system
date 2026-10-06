import { useState, useEffect } from "react";
import {
  BadgeCheck, Plus, Edit2, Trash2, X, Sparkles,
  ChevronUp, ChevronDown, CheckCircle2, Circle
} from "lucide-react";

function QuizAdmin({ modules }) {
  const [quizzes, setQuizzes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fcs-quizzes-admin") || "[]");
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  function saveQuizzes(data) {
    setQuizzes(data);
    localStorage.setItem("fcs-quizzes-admin", JSON.stringify(data));
  }

  function createQuiz(moduleId, lessonId) {
    const module = modules.find(m => m.id === Number(moduleId));
    const lesson = module?.lessons?.find(l => l.id === lessonId);

    if (!module || !lesson) return;

    const newQuiz = {
      id: Date.now(),
      moduleId: module.id,
      moduleTitle: module.title,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      title: `Quiz - ${lesson.title}`,
      published: false,
      questions: Array.from({ length: 7 }, (_, i) => ({
        id: Date.now() + i,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: ""
      }))
    };

    saveQuizzes([...quizzes, newQuiz]);
    setEditingQuiz(newQuiz);
    setShowForm(false);
  }

  function updateQuiz(quiz) {
    saveQuizzes(quizzes.map(q => q.id === quiz.id ? quiz : q));
  }

  function deleteQuiz(id) {
    if (!window.confirm("Supprimer ce quiz ?")) return;
    saveQuizzes(quizzes.filter(q => q.id !== id));
    setEditingQuiz(null);
  }

  function moveQuestion(quiz, index, dir) {
    const qs = [...quiz.questions];
    const target = index + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[index], qs[target]] = [qs[target], qs[index]];
    updateQuiz({ ...quiz, questions: qs });
  }

  function updateQuestion(quiz, index, field, value) {
    const qs = [...quiz.questions];
    qs[index] = { ...qs[index], [field]: value };
    updateQuiz({ ...quiz, questions: qs });
  }

  if (editingQuiz) {
    const quiz = quizzes.find(q => q.id === editingQuiz.id);
    if (!quiz) { setEditingQuiz(null); return null; }

    return (
      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "24px 28px 60px" }}>
        <button
          onClick={() => setEditingQuiz(null)}
          style={{
            border: "1px solid #dfe5eb", background: "#fff", borderRadius: "10px",
            padding: "10px 16px", fontWeight: 700, color: "#475569", cursor: "pointer",
            marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: "8px"
          }}
        >
          <X size={16} /> Retour aux quiz
        </button>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#b07b00", letterSpacing: "1px" }}>
            {quiz.moduleTitle} · {quiz.lessonTitle}
          </div>
          <h1 style={{ margin: "6px 0", color: "#09233d", fontSize: "26px" }}>{quiz.title}</h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#7b8797" }}>{quiz.questions.length} questions</span>
            <span style={{
              padding: "4px 10px", borderRadius: "999px",
              background: quiz.published ? "#e8f5ee" : "#f5f5f5",
              color: quiz.published ? "#287a55" : "#999",
              fontSize: "12px", fontWeight: 700
            }}>
              {quiz.published ? "Publié" : "Brouillon"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          {quiz.questions.map((q, i) => (
            <div key={q.id} style={{
              background: "#fff", border: "1px solid #e5eaf0", borderRadius: "14px",
              padding: "20px"
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "14px"
              }}>
                <strong style={{ color: "#09233d", fontSize: "15px" }}>
                  Question {i + 1}
                </strong>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => moveQuestion(quiz, i, -1)} disabled={i === 0} style={{
                    border: "1px solid #dfe5eb", borderRadius: "8px", padding: "6px 8px",
                    background: "#fff", cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1
                  }}>
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => moveQuestion(quiz, i, 1)} disabled={i === quiz.questions.length - 1} style={{
                    border: "1px solid #dfe5eb", borderRadius: "8px", padding: "6px 8px",
                    background: "#fff", cursor: "default", opacity: i === quiz.questions.length - 1 ? 0.3 : 1
                  }}>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <input
                placeholder={`Question ${i + 1}`}
                value={q.question}
                onChange={e => updateQuestion(quiz, i, "question", e.target.value)}
                style={inputStyle}
              />

              <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      onClick={() => updateQuestion(quiz, i, "correctAnswer", oi)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "8px",
                        border: q.correctAnswer === oi ? "2px solid #287a55" : "2px solid #dfe5eb",
                        background: q.correctAnswer === oi ? "#e8f5ee" : "#fff",
                        cursor: "pointer", flexShrink: 0,
                        display: "grid", placeItems: "center"
                      }}
                    >
                      {q.correctAnswer === oi ? (
                        <CheckCircle2 size={18} style={{ color: "#287a55" }} />
                      ) : (
                        <Circle size={18} style={{ color: "#cdd5de" }} />
                      )}
                    </button>
                    <span style={{ fontWeight: 700, color: "#475569", fontSize: "13px" }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <input
                      placeholder={`Réponse ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={e => {
                        const opts = [...q.options];
                        opts[oi] = e.target.value;
                        updateQuestion(quiz, i, "options", opts);
                      }}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Explication de la bonne réponse"
                value={q.explanation}
                onChange={e => updateQuestion(quiz, i, "explanation", e.target.value)}
                rows={2}
                style={{ ...inputStyle, marginTop: "12px" }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={() => updateQuiz({ ...quiz, published: !quiz.published })}
            style={{
              border: 0, borderRadius: "12px", padding: "14px 20px",
              background: quiz.published ? "#e8f5ee" : "#287a55",
              color: quiz.published ? "#287a55" : "#fff",
              fontWeight: 800, cursor: "pointer", fontSize: "14px"
            }}
          >
            {quiz.published ? "Dépublier" : "Publier le quiz"}
          </button>
          <button
            onClick={() => deleteQuiz(quiz.id)}
            style={{
              border: "1px solid #f0caca", borderRadius: "12px", padding: "14px 20px",
              background: "#fff5f5", color: "#c0392b", fontWeight: 700, cursor: "pointer"
            }}
          >
            <Trash2 size={16} style={{ display: "inline", marginRight: "6px" }} />
            Supprimer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "28px", flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
            ÉVALUATION
          </div>
          <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>
            Quiz
          </h1>
          <p style={{ color: "#6b7a8c", margin: 0 }}>
            Crée et gère les quiz de validation (7 questions par leçon).
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            border: 0, borderRadius: "12px", padding: "12px 20px",
            background: "#f1bd3e", color: "#09233d", fontWeight: 800, cursor: "pointer",
            fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px"
          }}
        >
          <Plus size={18} /> Créer un quiz
        </button>
      </div>

      {showForm && (
        <QuizCreateForm
          modules={modules}
          onCreate={createQuiz}
          onCancel={() => setShowForm(false)}
        />
      )}

      {quizzes.length === 0 && !showForm ? (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "48px 24px", textAlign: "center", color: "#7b8797"
        }}>
          <BadgeCheck size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "6px" }}>
            Aucun quiz créé
          </p>
          <p style={{ fontSize: "14px" }}>
            Clique sur "Créer un quiz" pour commencer.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {quizzes.map(quiz => (
            <div key={quiz.id} style={{
              background: "#fff", border: "1px solid #e5eaf0", borderRadius: "14px",
              padding: "18px 22px", display: "flex", alignItems: "center", gap: "16px"
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#b07b00" }}>
                  {quiz.moduleTitle} · {quiz.lessonTitle}
                </div>
                <strong style={{ color: "#09233d", fontSize: "15px", display: "block", marginTop: "4px" }}>
                  {quiz.title}
                </strong>
                <div style={{ display: "flex", gap: "10px", marginTop: "6px", fontSize: "13px", color: "#7b8797" }}>
                  <span>{quiz.questions.length} questions</span>
                  <span style={{
                    color: quiz.published ? "#287a55" : "#999",
                    fontWeight: 700
                  }}>
                    {quiz.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingQuiz(quiz)}
                style={{
                  border: "1px solid #dfe5eb", borderRadius: "10px", padding: "10px 14px",
                  background: "#fff", cursor: "pointer", color: "#475569", fontWeight: 700
                }}
              >
                <Edit2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* IA GENERATION NOTICE */}
      <div style={{
        background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
        padding: "24px", marginTop: "24px", textAlign: "center"
      }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "12px",
          background: "#09233d", color: "#f1bd3e",
          display: "inline-grid", placeItems: "center", marginBottom: "12px"
        }}>
          <Sparkles size={22} />
        </div>
        <strong style={{ color: "#09233d", fontSize: "16px", display: "block" }}>
          Génération IA
        </strong>
        <p style={{ color: "#7b8797", fontSize: "14px", margin: "8px 0 0" }}>
          La génération automatique de questions à partir des transcriptions vidéo
          nécessite la configuration d'une API IA. Bouton disponible une fois configurée.
        </p>
        <button disabled style={{
          marginTop: "14px", border: "1px solid #dfe5eb", borderRadius: "10px",
          padding: "10px 18px", background: "#f5f5f5", color: "#999",
          fontWeight: 700, fontSize: "13px", cursor: "not-allowed"
        }}>
          <Sparkles size={15} style={{ display: "inline", marginRight: "6px" }} />
          Configuration IA requise
        </button>
      </div>
    </div>
  );
}

function QuizCreateForm({ modules, onCreate, onCancel }) {
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");

  const selectedModule = modules.find(m => m.id === Number(moduleId));
  const lessons = selectedModule?.lessons || [];

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
      padding: "24px", marginBottom: "24px"
    }}>
      <h2 style={{ margin: "0 0 16px", color: "#09233d", fontSize: "20px" }}>Nouveau quiz</h2>

      <div style={{ display: "grid", gap: "14px" }}>
        <div>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
            Module
          </label>
          <select value={moduleId} onChange={e => { setModuleId(e.target.value); setLessonId(""); }} style={inputStyle}>
            <option value="">Sélectionner un module</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
            Leçon
          </label>
          <select value={lessonId} onChange={e => setLessonId(e.target.value)} style={inputStyle} disabled={!moduleId}>
            <option value="">Sélectionner une leçon</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
        <button
          onClick={() => moduleId && lessonId && onCreate(Number(moduleId), lessonId)}
          disabled={!moduleId || !lessonId}
          style={{
            border: 0, borderRadius: "10px", padding: "12px 20px",
            background: moduleId && lessonId ? "#f1bd3e" : "#e5e9ef",
            color: "#09233d", fontWeight: 800, cursor: "pointer",
            opacity: moduleId && lessonId ? 1 : 0.5
          }}
        >
          Créer le quiz (7 questions)
        </button>
        <button
          onClick={onCancel}
          style={{
            border: "1px solid #dfe5eb", borderRadius: "10px", padding: "12px 20px",
            background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer"
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #dfe5eb",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit"
};

export default QuizAdmin;
