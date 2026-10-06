import { useState } from "react";
import {
  Plus, Edit2, Trash2, Calendar, Clock, Video, Radio,
  CheckCircle2, X, ExternalLink, Play
} from "lucide-react";

const STATUS_CONFIG = {
  scheduled: { label: "Programmé", color: "#b07b00", bg: "#fef6e7" },
  live: { label: "En direct", color: "#dc2626", bg: "#fef2f2" },
  ended: { label: "Terminé", color: "#475569", bg: "#f8fafc" }
};

function LivesReplaysAdmin() {
  const [lives, setLives] = useState(() => {
    try {
      const saved = localStorage.getItem("fcs-lives-admin");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    liveUrl: "",
    replayUrl: "",
    imageUrl: "",
    status: "scheduled"
  });

  function saveLives(data) {
    setLives(data);
    localStorage.setItem("fcs-lives-admin", JSON.stringify(data));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingId) {
      saveLives(lives.map(l => l.id === editingId ? { ...l, ...form } : l));
    } else {
      saveLives([...lives, { id: Date.now(), ...form }]);
    }

    resetForm();
  }

  function resetForm() {
    setForm({
      title: "", description: "", date: "", time: "",
      liveUrl: "", replayUrl: "", imageUrl: "", status: "scheduled"
    });
    setEditingId(null);
    setShowForm(false);
  }

  function editLive(live) {
    setForm(live);
    setEditingId(live.id);
    setShowForm(true);
  }

  function deleteLive(id) {
    if (!window.confirm("Supprimer cet événement ?")) return;
    saveLives(lives.filter(l => l.id !== id));
  }

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
            ÉVÉNEMENTS
          </div>
          <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>
            Lives & Replays
          </h1>
          <p style={{ color: "#6b7a8c", margin: 0 }}>
            Gère les événements en direct et les replays.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{
            border: 0,
            borderRadius: "12px",
            padding: "12px 20px",
            background: "#f1bd3e",
            color: "#09233d",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Plus size={18} /> Créer un live
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid #e5eaf0",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            display: "grid",
            gap: "16px"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ margin: 0, color: "#09233d", fontSize: "20px" }}>
              {editingId ? "Modifier l'événement" : "Nouvel événement Live"}
            </h2>
            <button type="button" onClick={resetForm} style={{
              border: 0, background: "transparent", cursor: "pointer", color: "#9aa5b5"
            }}>
              <X size={22} />
            </button>
          </div>

          <input
            placeholder="Titre de l'événement"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            style={inputStyle}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>Heure</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>URL du live</label>
              <input
                placeholder="https://..."
                value={form.liveUrl}
                onChange={e => setForm({ ...form, liveUrl: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>URL du replay</label>
              <input
                placeholder="https://... (à ajouter après le live)"
                value={form.replayUrl}
                onChange={e => setForm({ ...form, replayUrl: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>Statut</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              style={inputStyle}
            >
              <option value="scheduled">Programmé</option>
              <option value="live">En direct</option>
              <option value="ended">Terminé</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              border: 0,
              borderRadius: "12px",
              padding: "14px",
              background: "#09233d",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "15px"
            }}
          >
            {editingId ? "Enregistrer les modifications" : "Créer l'événement"}
          </button>
        </form>
      )}

      {lives.length === 0 ? (
        <div style={{
          background: "#fff",
          border: "1px solid #e5eaf0",
          borderRadius: "16px",
          padding: "48px 24px",
          textAlign: "center",
          color: "#7b8797"
        }}>
          <Radio size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, color: "#09233d" }}>Aucun événement programmé</p>
          <p style={{ fontSize: "14px" }}>Clique sur "Créer un live" pour ajouter un événement.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {lives.map(live => {
            const sc = STATUS_CONFIG[live.status] || STATUS_CONFIG.scheduled;
            return (
              <div key={live.id} style={{
                background: "#fff",
                border: "1px solid #e5eaf0",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap"
              }}>
                <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: sc.bg,
                      color: sc.color,
                      fontSize: "12px",
                      fontWeight: 800
                    }}>
                      {live.status === "live" && <Radio size={12} style={{ display: "inline", marginRight: "4px" }} />}
                      {sc.label}
                    </span>
                    {live.date && (
                      <span style={{ fontSize: "13px", color: "#7b8797", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} /> {live.date}
                        {live.time && <> · <Clock size={14} /> {live.time}</>}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: "0 0 4px", color: "#09233d", fontSize: "17px" }}>{live.title}</h3>
                  {live.description && (
                    <p style={{ margin: 0, color: "#7b8797", fontSize: "14px" }}>{live.description}</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  {live.liveUrl && live.status !== "ended" && (
                    <a href={live.liveUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "10px",
                      background: "#f1bd3e", color: "#09233d",
                      fontWeight: 700, fontSize: "13px", textDecoration: "none"
                    }}>
                      <ExternalLink size={15} /> {live.status === "live" ? "Rejoindre" : "Lien"}
                    </a>
                  )}
                  {live.replayUrl && (
                    <a href={live.replayUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "10px",
                      border: "1px solid #dfe5eb", background: "#fff",
                      color: "#475569", fontWeight: 700, fontSize: "13px", textDecoration: "none"
                    }}>
                      <Play size={15} /> Replay
                    </a>
                  )}
                  <button onClick={() => editLive(live)} style={{
                    border: "1px solid #dfe5eb", borderRadius: "10px",
                    padding: "8px 12px", background: "#fff", cursor: "pointer",
                    color: "#475569"
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteLive(live.id)} style={{
                    border: "1px solid #f0caca", borderRadius: "10px",
                    padding: "8px 12px", background: "#fff5f5", cursor: "pointer",
                    color: "#c0392b"
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

function LivesReplaysStudent() {
  const [lives, setLives] = useState(() => {
    try {
      const saved = localStorage.getItem("fcs-lives-admin");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const upcoming = lives.filter(l => l.status === "scheduled" || l.status === "live");
  const replays = lives.filter(l => l.status === "ended" && l.replayUrl);

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
          ÉVÉNEMENTS
        </div>
        <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>
          Lives & Replays
        </h1>
        <p style={{ color: "#6b7a8c", margin: 0 }}>
          Retrouve les prochains rendez-vous en direct et les replays.
        </p>
      </div>

      <h2 style={{ color: "#09233d", fontSize: "20px", marginBottom: "16px" }}>
        Prochains lives
      </h2>

      {upcoming.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "36px 24px", textAlign: "center", color: "#7b8797", marginBottom: "32px"
        }}>
          <Radio size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ fontWeight: 600, color: "#09233d" }}>Aucun live programmé</p>
        </div>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px", marginBottom: "32px"
        }}>
          {upcoming.map(live => {
            const sc = STATUS_CONFIG[live.status] || STATUS_CONFIG.scheduled;
            return (
              <div key={live.id} style={{
                background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
                padding: "20px"
              }}>
                <span style={{
                  padding: "4px 10px", borderRadius: "999px",
                  background: sc.bg, color: sc.color,
                  fontSize: "12px", fontWeight: 800
                }}>
                  {sc.label}
                </span>
                <h3 style={{ margin: "12px 0 6px", color: "#09233d", fontSize: "17px" }}>{live.title}</h3>
                {live.description && (
                  <p style={{ margin: "0 0 12px", color: "#7b8797", fontSize: "14px" }}>{live.description}</p>
                )}
                {live.date && (
                  <div style={{ fontSize: "13px", color: "#7b8797", marginBottom: "14px" }}>
                    <Calendar size={14} style={{ display: "inline", marginRight: "4px" }} /> {live.date}
                    {live.time && <> · <Clock size={14} style={{ display: "inline", marginRight: "4px" }} /> {live.time}</>}
                  </div>
                )}
                {live.liveUrl && (
                  <a href={live.liveUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "10px 18px", borderRadius: "10px",
                    background: "#f1bd3e", color: "#09233d",
                    fontWeight: 800, fontSize: "14px", textDecoration: "none"
                  }}>
                    <ExternalLink size={16} /> {live.status === "live" ? "Rejoindre le live" : "Voir le lien"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ color: "#09233d", fontSize: "20px", marginBottom: "16px" }}>
        Replays
      </h2>

      {replays.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "36px 24px", textAlign: "center", color: "#7b8797"
        }}>
          <Video size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ fontWeight: 600, color: "#09233d" }}>Aucun replay disponible</p>
        </div>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px"
        }}>
          {replays.map(live => (
            <div key={live.id} style={{
              background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
              padding: "20px"
            }}>
              <h3 style={{ margin: "0 0 6px", color: "#09233d", fontSize: "17px" }}>{live.title}</h3>
              {live.description && (
                <p style={{ margin: "0 0 12px", color: "#7b8797", fontSize: "14px" }}>{live.description}</p>
              )}
              {live.date && (
                <div style={{ fontSize: "13px", color: "#7b8797", marginBottom: "14px" }}>
                  <Calendar size={14} style={{ display: "inline", marginRight: "4px" }} /> {live.date}
                </div>
              )}
              <a href={live.replayUrl} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "10px 18px", borderRadius: "10px",
                background: "#09233d", color: "#fff",
                fontWeight: 800, fontSize: "14px", textDecoration: "none"
              }}>
                <Play size={16} /> Regarder le replay
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { LivesReplaysAdmin, LivesReplaysStudent };
