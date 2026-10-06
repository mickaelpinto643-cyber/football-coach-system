import { useState, useEffect } from "react";
import { Brain, Sparkles, Save } from "lucide-react";

const SECTIONS = [
  { key: "identity", title: "1. Mon identité de jeu", placeholder: "Quelle équipe veux-tu construire ? Comment veux-tu que ton équipe soit reconnue ?" },
  { key: "squad", title: "2. Mon effectif", placeholder: "Quelles sont les caractéristiques de ton effectif ? Forces, faiblesses, profils de joueurs..." },
  { key: "offensive", title: "3. Organisation offensive", placeholder: "Comment ton équipe s'organise-t-elle avec le ballon ? Construction, progression, création, finition..." },
  { key: "defensiveTransition", title: "4. Transition défensive", placeholder: "Que doit faire ton équipe immédiatement après perte du ballon ?" },
  { key: "defensive", title: "5. Organisation défensive", placeholder: "Comment ton équipe s'organise-t-elle sans le ballon ? Bloc, pressing, récupération..." },
  { key: "offensiveTransition", title: "6. Transition offensive", placeholder: "Que doit faire ton équipe immédiatement après récupération du ballon ?" },
  { key: "principles", title: "7. Principes de jeu", placeholder: "Quels sont les principes directeurs qui structurent ton modèle ?" },
  { key: "subPrinciples", title: "8. Sous-principes", placeholder: "Quels sous-principes découlent de tes principes directeurs ?" },
  { key: "behaviors", title: "9. Comportements recherchés", placeholder: "Quels comportements collectifs et individuels recherches-tu ?" },
  { key: "systems", title: "10. Systèmes de jeu", placeholder: "Quels systèmes utilises-tu et pourquoi ?" },
  { key: "setPieces", title: "11. Coups de pied arrêtés", placeholder: "Quels principes pour les phases arrêtées offensives et défensives ?" },
  { key: "synthesis", title: "12. Synthèse de mon modèle", placeholder: "Synthétise ici la vision globale de ton modèle de jeu..." }
];

function GameModelStudent({ user }) {
  const [model, setModel] = useState({});
  const [savedFlash, setSavedFlash] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("loading");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModel() {
      try {
        const res = await fetch("/api/student/game-model", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.model) {
            setModel(data.model);
          }
        }
      } catch (err) {
        console.warn("Failed to load game model:", err);
      } finally {
        setLoading(false);
      }
    }
    loadModel();
  }, []);

  useEffect(() => {
    fetch("/api/ai/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAiStatus(d.configured ? "ready" : "not_configured"))
      .catch(() => setAiStatus("not_configured"));
  }, []);

  function updateField(field, value) {
    setModel(prev => ({ ...prev, [field]: value }));
    setSavedFlash(true);
    clearTimeout(window.__fcsModelTimer);
    window.__fcsModelTimer = setTimeout(() => setSavedFlash(false), 1500);

    fetch("/api/student/game-model", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: { ...model, [field]: value } })
    }).catch(err => console.warn("Failed to save game model:", err));
  }

  const filledCount = SECTIONS.filter(s => model[s.key]?.trim()).length;
  const progress = Math.round((filledCount / SECTIONS.length) * 100);

  async function analyzeWithAI() {
    setAiLoading(true);
    setAiError("");
    setAiResult("");

    try {
      const modelContext = SECTIONS
        .map(s => model[s.key]?.trim() ? `${s.title}: ${model[s.key].trim()}` : null)
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/ai/game-model", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: aiInput.trim(),
          modelContext
        })
      });

      const text = await response.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch {} }

      if (!response.ok) {
        throw new Error((data && (data.error || data.message)) || "Erreur lors de l'analyse.");
      }

      setAiResult(data.analysis || data.result || "Aucune réponse reçue.");
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#7b8797" }}>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>Chargement de ton modèle de jeu...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "920px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
          ASSISTANT DE CONSTRUCTION
        </div>
        <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Brain size={30} style={{ color: "#b07b00" }} />
          Construire mon modèle de jeu
        </h1>
        <p style={{ color: "#6b7a8c", margin: 0 }}>
          Renseigne progressivement les différentes dimensions de ton modèle. Sauvegarde automatique.
        </p>
      </div>

      {/* PROGRESS BAR */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5eaf0",
        borderRadius: "14px",
        padding: "20px 24px",
        marginBottom: "24px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px"
        }}>
          <strong style={{ color: "#09233d" }}>
            Construction de mon modèle
          </strong>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {savedFlash && (
              <span style={{ fontSize: "12px", color: "#287a55", fontWeight: 700 }}>
                Sauvegardé
              </span>
            )}
            <strong style={{ color: "#b07b00", fontSize: "18px" }}>{progress}%</strong>
          </div>
        </div>
        <div style={{
          height: "8px", background: "#edf0f3", borderRadius: "999px", overflow: "hidden"
        }}>
          <div style={{
            width: `${progress}%`, height: "100%", background: "#f1bd3e", borderRadius: "999px",
            transition: "width .3s ease"
          }} />
        </div>
        <div style={{ fontSize: "13px", color: "#9aa5b5", marginTop: "8px" }}>
          {filledCount} / {SECTIONS.length} sections remplies
        </div>
      </div>

      {/* SECTIONS */}
      <div style={{ display: "grid", gap: "20px" }}>
        {SECTIONS.map(section => (
          <div key={section.key} style={{
            background: "#fff",
            border: "1px solid #e5eaf0",
            borderRadius: "16px",
            padding: "20px 24px"
          }}>
            <label style={{
              display: "block",
              fontWeight: 800,
              color: "#09233d",
              fontSize: "16px",
              marginBottom: "8px"
            }}>
              {section.title}
            </label>
            <textarea
              value={model[section.key] || ""}
              onChange={e => updateField(section.key, e.target.value)}
              placeholder={section.placeholder}
              rows={4}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #dfe5eb",
                borderRadius: "12px",
                fontSize: "14px",
                lineHeight: 1.6,
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        ))}
      </div>

      {/* ASSISTANT IA — MODÈLE DE JEU */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5eaf0",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "24px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px"
        }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "#09233d", color: "#f1bd3e",
            display: "grid", placeItems: "center"
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <strong style={{ color: "#09233d", fontSize: "16px" }}>
              Assistant IA — Modèle de jeu
            </strong>
            <div style={{ fontSize: "13px", color: "#9aa5b5" }}>
              Décris ton idée, un principe, un problème, une organisation ou une question tactique
            </div>
          </div>
        </div>

        {aiStatus === "not_configured" ? (
          <div style={{
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "12px",
            textAlign: "center",
            color: "#7b8797",
            fontSize: "14px"
          }}>
            <Brain size={32} style={{ opacity: 0.3, marginBottom: "10px" }} />
            <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "4px" }}>
              Assistant IA non configuré
            </p>
            <p style={{ margin: 0, fontSize: "13px" }}>
              L'administrateur doit configurer la clé API pour activer l'assistant.
            </p>
          </div>
        ) : (
          <>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ton idée, ton principe, ton problème, ton organisation, ta question tactique..."
              rows={4}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #dfe5eb",
                borderRadius: "12px",
                fontSize: "14px",
                lineHeight: 1.6,
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "12px"
              }}
            />

            {aiError && (
              <div style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#fef2f2",
                color: "#c0392b",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "12px"
              }}>
                {aiError}
              </div>
            )}

            {aiResult && (
              <div style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#f7f9fb",
                border: "1px solid #e5eaf0",
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#09233d",
                marginBottom: "12px",
                whiteSpace: "pre-wrap"
              }}>
                {aiResult}
              </div>
            )}

            <button
              className="primaryButton"
              onClick={analyzeWithAI}
              disabled={aiLoading || !aiInput.trim()}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Sparkles size={16} />
              {aiLoading ? "Analyse en cours..." : "Analyser avec l'IA"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { GameModelStudent, SECTIONS as GAME_MODEL_SECTIONS };
