import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Award } from "lucide-react";

function ProgressAdmin() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/learners", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setLearners(data.learners || []);
        } else {
          setError(data.error || "Impossible de charger.");
        }
      } catch (err) {
        setError("Impossible de charger les données de progression.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div style={{ padding: "60px", textAlign: "center", color: "#7b8797" }}>Chargement...</div>;
  }

  const totalLearners = learners.length;
  const avgProgress = totalLearners > 0
    ? Math.round(learners.reduce((s, l) => s + (l.progress || 0), 0) / totalLearners)
    : 0;
  const totalCompleted = learners.reduce((s, l) => s + (l.completed_lessons || 0), 0);
  const totalQuizzes = learners.reduce((s, l) => s + (l.quizzes_taken || 0), 0);
  const completionRate = totalLearners > 0
    ? Math.round((learners.filter(l => l.progress >= 100).length / totalLearners) * 100)
    : 0;

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
          ANALYSE
        </div>
        <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>Progression</h1>
        <p style={{ color: "#6b7a8c", margin: 0 }}>
          Vue d'ensemble de la progression de tous les apprenants (Modules 1, 2 et 3 uniquement).
        </p>
      </div>

      {error && (
        <div style={{
          padding: "14px 18px", borderRadius: "10px", background: "#fef2f2",
          color: "#c0392b", fontSize: "14px", marginBottom: "20px"
        }}>{error}</div>
      )}

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        {[
          ["Progression moyenne", `${avgProgress}%`, "📈", TrendingUp],
          ["Apprenants", totalLearners, "👥", Users],
          ["Leçons terminées", totalCompleted, "✅", BarChart3],
          ["Taux de complétion", `${completionRate}%`, "🏆", Award]
        ].map(([label, value, icon, Icon]) => (
          <div key={label} style={{
            background: "#fff", border: "1px solid #e5eaf0", borderRadius: "14px",
            padding: "20px"
          }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "#f8fafc", display: "grid", placeItems: "center",
              marginBottom: "12px"
            }}>
              <Icon size={20} style={{ color: "#09233d" }} />
            </div>
            <div style={{ color: "#7b8797", fontSize: "13px", fontWeight: 700 }}>{label}</div>
            <div style={{ color: "#09233d", fontSize: "26px", fontWeight: 900, marginTop: "4px" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {totalLearners === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "48px 24px", textAlign: "center", color: "#7b8797"
        }}>
          <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, color: "#09233d" }}>Aucune donnée de progression</p>
          <p style={{ fontSize: "14px" }}>
            Les données apparaîtront dès que des apprenants seront inscrits.
          </p>
        </div>
      ) : (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #edf0f3" }}>
                {["Apprenant", "Progression", "Leçons", "Dernière activité"].map(h => (
                  <th key={h} style={{
                    padding: "14px 16px", textAlign: "left",
                    color: "#7b8797", fontWeight: 700, fontSize: "12px",
                    textTransform: "uppercase"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {learners.sort((a, b) => (b.progress || 0) - (a.progress || 0)).map(l => (
                <tr key={l.id} style={{ borderBottom: "1px solid #edf0f3" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ color: "#09233d" }}>{l.first_name} {l.last_name}</strong>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "100px", height: "8px", background: "#edf0f3",
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
                  <td style={{ padding: "14px 16px", color: "#6b7a8c", fontSize: "13px" }}>
                    {l.last_activity ? new Date(l.last_activity).toLocaleDateString("fr-FR") : "—"}
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

export default ProgressAdmin;
