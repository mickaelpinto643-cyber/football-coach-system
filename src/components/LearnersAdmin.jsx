import { useState, useEffect } from "react";
import {
  Search, UserPlus, X, Mail, Calendar, BarChart3,
  CheckCircle2, Clock, Brain, FileText, PlayCircle, Trophy
} from "lucide-react";

function LearnersAdmin() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("progress");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    formation_id: 1
  });
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  async function loadLearners() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/learners", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setLearners(data.learners || []);
      } else {
        setError(data.error || "Impossible de charger les apprenants.");
      }
    } catch (err) {
      setError("Impossible de charger les apprenants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLearners(); }, []);

  async function handleAddLearner(e) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (!addForm.email || !addForm.password || addForm.password.length < 8) {
      setAddError("Email et mot de passe (8 caractères minimum) obligatoires.");
      return;
    }

    try {
      const res = await fetch("/api/admin/learners", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la création.");
      }
      setAddSuccess("Apprenant créé avec succès.");
      setAddForm({ first_name: "", last_name: "", email: "", password: "", formation_id: 1 });
      setTimeout(() => { setShowAddForm(false); setAddSuccess(""); }, 1500);
      loadLearners();
    } catch (err) {
      setAddError(err.message);
    }
  }

  const filtered = learners
    .filter(l => {
      if (search) {
        const q = search.toLowerCase();
        if (!l.email?.toLowerCase().includes(q) &&
            !l.first_name?.toLowerCase().includes(q) &&
            !l.last_name?.toLowerCase().includes(q)) return false;
      }
      if (filterStatus === "active" && l.status !== "active") return false;
      if (filterStatus === "inactive" && l.status === "active") return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "progress") return (b.progress || 0) - (a.progress || 0);
      if (sortBy === "name") return (a.last_name || "").localeCompare(b.last_name || "");
      if (sortBy === "activity") return new Date(b.last_activity || 0) - new Date(a.last_activity || 0);
      return 0;
    });

  const avgProgress = learners.length > 0
    ? Math.round(learners.reduce((sum, l) => sum + (l.progress || 0), 0) / learners.length)
    : 0;
  const activeCount = learners.filter(l => l.status === "active").length;

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#7b8797" }}>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>Chargement des apprenants...</div>
      </div>
    );
  }

  if (selectedLearner) {
    return (
      <LearnerDetail
        learner={selectedLearner}
        onBack={() => setSelectedLearner(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "28px", flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
            ADMINISTRATION
          </div>
          <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>Apprenants</h1>
          <p style={{ color: "#6b7a8c", margin: 0 }}>
            Suivi et gestion des apprenants inscrits.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            border: 0, borderRadius: "12px", padding: "12px 20px",
            background: "#f1bd3e", color: "#09233d", fontWeight: 800,
            cursor: "pointer", fontSize: "14px",
            display: "inline-flex", alignItems: "center", gap: "8px"
          }}
        >
          <UserPlus size={18} /> Ajouter un apprenant
        </button>
      </div>

      {/* STATS */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        {[
          ["Total apprenants", learners.length, "👥"],
          ["Apprenants actifs", activeCount, "✅"],
          ["Progression moyenne", `${avgProgress}%`, "📈"],
          ["Taux de complétion", `${learners.filter(l => l.progress >= 100).length}/${learners.length}`, "🏆"]
        ].map(([label, value, icon]) => (
          <div key={label} style={{
            background: "#fff", border: "1px solid #e5eaf0", borderRadius: "14px",
            padding: "18px 20px"
          }}>
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
            <div style={{ color: "#7b8797", fontSize: "13px", fontWeight: 700 }}>{label}</div>
            <div style={{ color: "#09233d", fontSize: "24px", fontWeight: 900, marginTop: "4px" }}>{value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: "14px 18px", borderRadius: "10px", background: "#fef2f2",
          color: "#c0392b", fontSize: "14px", marginBottom: "20px"
        }}>
          {error}
        </div>
      )}

      {/* ADD FORM */}
      {showAddForm && (
        <form onSubmit={handleAddLearner} style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "24px", marginBottom: "24px"
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "18px"
          }}>
            <h2 style={{ margin: 0, color: "#09233d", fontSize: "20px" }}>Nouvel apprenant</h2>
            <button type="button" onClick={() => setShowAddForm(false)} style={{
              border: 0, background: "transparent", cursor: "pointer", color: "#9aa5b5"
            }}>
              <X size={22} />
            </button>
          </div>

          {addError && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", background: "#fef2f2",
              color: "#c0392b", fontSize: "13px", marginBottom: "14px"
            }}>{addError}</div>
          )}
          {addSuccess && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", background: "#e8f5ee",
              color: "#287a55", fontSize: "13px", marginBottom: "14px"
            }}>{addSuccess}</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <input placeholder="Prénom" value={addForm.first_name}
              onChange={e => setAddForm({ ...addForm, first_name: e.target.value })}
              style={inputStyle} />
            <input placeholder="Nom" value={addForm.last_name}
              onChange={e => setAddForm({ ...addForm, last_name: e.target.value })}
              style={inputStyle} />
          </div>
          <input type="email" placeholder="Email" value={addForm.email}
            onChange={e => setAddForm({ ...addForm, email: e.target.value })}
            style={{ ...inputStyle, marginTop: "14px" }} />
          <input type="password" placeholder="Mot de passe temporaire (8 caractères min.)"
            value={addForm.password}
            onChange={e => setAddForm({ ...addForm, password: e.target.value })}
            style={{ ...inputStyle, marginTop: "14px" }} />

          <button type="submit" style={{
            marginTop: "18px", border: 0, borderRadius: "12px", padding: "14px 20px",
            background: "#09233d", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "15px"
          }}>
            Créer l'apprenant
          </button>
        </form>
      )}

      {/* FILTERS */}
      <div style={{
        display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px"
      }}>
        <div style={{ flex: "1 1 240px", position: "relative", minWidth: 200 }}>
          <Search size={18} style={{
            position: "absolute", left: "14px", top: "50%",
            transform: "translateY(-50%)", color: "#9aa5b5"
          }} />
          <input placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "44px" }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="progress">Trier par progression</option>
          <option value="name">Trier par nom</option>
          <option value="activity">Trier par activité</option>
        </select>
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "48px 24px", textAlign: "center", color: "#7b8797"
        }}>
          <UserPlus size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "6px" }}>
            Aucun apprenant inscrit
          </p>
          <p style={{ fontSize: "14px" }}>
            Clique sur "Ajouter un apprenant" pour créer le premier compte étudiant.
          </p>
        </div>
      ) : (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          overflow: "hidden"
        }}>
          <table style={{
            width: "100%", borderCollapse: "collapse", fontSize: "14px"
          }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #edf0f3" }}>
                {["Apprenant", "Email", "Inscription", "Progression", "Leçons", "Quiz", "Score", "Statut"].map(h => (
                  <th key={h} style={{
                    padding: "14px 16px", textAlign: "left",
                    color: "#7b8797", fontWeight: 700, fontSize: "12px",
                    textTransform: "uppercase", letterSpacing: ".5px"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr
                  key={l.id}
                  onClick={() => setSelectedLearner(l)}
                  style={{
                    borderBottom: "1px solid #edf0f3", cursor: "pointer",
                    transition: "background .1s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ color: "#09233d" }}>
                      {l.first_name} {l.last_name}
                    </strong>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7a8c" }}>{l.email}</td>
                  <td style={{ padding: "14px 16px", color: "#6b7a8c", fontSize: "13px" }}>
                    {l.created_at ? new Date(l.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "80px", height: "7px", background: "#edf0f3",
                        borderRadius: "99px", overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${l.progress || 0}%`, height: "100%",
                          background: "#f1bd3e", borderRadius: "99px"
                        }} />
                      </div>
                      <strong style={{ color: "#09233d" }}>{l.progress || 0}%</strong>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7a8c" }}>
                    {l.completed_lessons || 0}/{l.total_lessons || 0}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7a8c" }}>{l.quizzes_taken || 0}</td>
                  <td style={{ padding: "14px 16px", color: "#6b7a8c" }}>
                    {l.avg_score ? `${l.avg_score}%` : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "999px",
                      background: l.status === "active" ? "#e8f5ee" : "#f5f5f5",
                      color: l.status === "active" ? "#287a55" : "#999",
                      fontSize: "12px", fontWeight: 700
                    }}>
                      {l.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LearnerDetail({ learner, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/learners/${learner.id}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setDetail(data.learner);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, [learner.id]);

  if (loading) {
    return <div style={{ padding: "60px", textAlign: "center", color: "#7b8797" }}>Chargement...</div>;
  }

  const d = detail || learner;

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <button onClick={onBack} style={{
        border: "1px solid #dfe5eb", background: "#fff", borderRadius: "10px",
        padding: "10px 16px", fontWeight: 700, color: "#475569", cursor: "pointer",
        marginBottom: "20px", display: "inline-flex", alignItems: "center", gap: "8px"
      }}>
        ← Retour aux apprenants
      </button>

      <div style={{
        background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
        padding: "28px", marginBottom: "20px"
      }}>
        <h1 style={{ margin: "0 0 6px", color: "#09233d", fontSize: "26px" }}>
          {d.first_name} {d.last_name}
        </h1>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "12px", color: "#6b7a8c", fontSize: "14px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Mail size={16} /> {d.email}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={16} /> Inscrit le {d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "—"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} /> Dernière activité {d.last_activity ? new Date(d.last_activity).toLocaleDateString("fr-FR") : "—"}
          </span>
        </div>
      </div>

      {/* PROGRESSION GLOBALE */}
      <div style={{
        background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
        padding: "24px", marginBottom: "20px"
      }}>
        <h2 style={{ margin: "0 0 16px", color: "#09233d", fontSize: "18px" }}>
          Progression globale
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "90px", height: "90px", borderRadius: "50%",
            background: `conic-gradient(#f1bd3e ${(d.progress || 0) * 3.6}deg, #edf1f4 0deg)`,
            display: "grid", placeItems: "center", flexShrink: 0
          }}>
            <div style={{
              width: "68px", height: "68px", borderRadius: "50%",
              background: "#fff", display: "grid", placeItems: "center",
              color: "#09233d", fontWeight: 900, fontSize: "18px"
            }}>
              {d.progress || 0}%
            </div>
          </div>
          <div>
            <strong style={{ color: "#09233d", fontSize: "16px" }}>
              {d.completed_lessons || 0} / {d.total_lessons || 0} leçons terminées
            </strong>
          </div>
        </div>
      </div>

      {/* PROGRESSION PAR MODULE */}
      {d.module_progress && d.module_progress.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "24px", marginBottom: "20px"
        }}>
          <h2 style={{ margin: "0 0 16px", color: "#09233d", fontSize: "18px" }}>
            Progression par module
          </h2>
          <div style={{ display: "grid", gap: "14px" }}>
            {d.module_progress.map((mp, i) => (
              <div key={i}>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginBottom: "6px"
                }}>
                  <strong style={{ color: "#09233d", fontSize: "14px" }}>{mp.title}</strong>
                  <strong style={{ color: "#b07b00", fontSize: "14px" }}>{mp.pct}%</strong>
                </div>
                <div style={{
                  height: "8px", background: "#edf0f3", borderRadius: "999px", overflow: "hidden"
                }}>
                  <div style={{
                    width: `${mp.pct}%`, height: "100%",
                    background: "#f1bd3e", borderRadius: "999px"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUIZ RÉALISÉS */}
      {d.quiz_results && d.quiz_results.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "24px", marginBottom: "20px"
        }}>
          <h2 style={{
            margin: "0 0 16px", color: "#09233d", fontSize: "18px",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <Trophy size={20} style={{ color: "#b07b00" }} /> Quiz réalisés
          </h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {d.quiz_results.map((qr, i) => (
              <div key={qr.id || i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderRadius: "10px",
                background: "#f8fafc", border: "1px solid #edf0f3"
              }}>
                <div>
                  <strong style={{ color: "#09233d", fontSize: "14px" }}>
                    {qr.lesson_title || `Leçon #${qr.lesson_id}`}
                  </strong>
                  <div style={{ fontSize: "12px", color: "#9aa5b5" }}>
                    {qr.created_at ? new Date(qr.created_at).toLocaleDateString("fr-FR") : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{
                    color: qr.total_questions > 0 && (qr.score / qr.total_questions) >= 0.7 ? "#287a55" : "#b07b00",
                    fontSize: "16px"
                  }}>
                    {qr.score}/{qr.total_questions}
                  </strong>
                  <div style={{ fontSize: "12px", color: "#9aa5b5" }}>
                    {qr.total_questions > 0 ? Math.round((qr.score / qr.total_questions) * 100) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!d.quiz_results || d.quiz_results.length === 0) && (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "24px", marginBottom: "20px"
        }}>
          <h2 style={{
            margin: "0 0 12px", color: "#09233d", fontSize: "18px",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            <Trophy size={20} style={{ color: "#b07b00" }} /> Quiz réalisés
          </h2>
          <div style={{ fontSize: "14px", color: "#9aa5b5" }}>
            Aucun quiz réalisé pour le moment.
          </div>
        </div>
      )}

      {/* MODÈLE DE JEU */}
      <div style={{
        background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
        padding: "24px"
      }}>
        <h2 style={{
          margin: "0 0 12px", color: "#09233d", fontSize: "18px",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <Brain size={20} style={{ color: "#b07b00" }} /> Modèle de jeu
        </h2>
        <div style={{ fontSize: "14px", color: "#6b7a8c" }}>
          Progression : <strong style={{ color: "#09233d" }}>{d.game_model_progress || 0}%</strong>
        </div>
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

export default LearnersAdmin;
