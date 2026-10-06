import { useState, useMemo, useEffect } from "react";
import {
  FileText, FileSpreadsheet, Presentation, FileType,
  Image as ImageIcon, Link as LinkIcon, Download, Eye,
  Search, Plus, X, Trash2
} from "lucide-react";

const TYPE_CONFIG = {
  pdf: { label: "PDF", icon: FileText, color: "#dc2626", bg: "#fef2f2" },
  powerpoint: { label: "PowerPoint", icon: Presentation, color: "#ea580c", bg: "#fff7ed" },
  ppt: { label: "PowerPoint", icon: Presentation, color: "#ea580c", bg: "#fff7ed" },
  pptx: { label: "PowerPoint", icon: Presentation, color: "#ea580c", bg: "#fff7ed" },
  word: { label: "Word", icon: FileText, color: "#2563eb", bg: "#eff6ff" },
  doc: { label: "Word", icon: FileText, color: "#2563eb", bg: "#eff6ff" },
  docx: { label: "Word", icon: FileText, color: "#2563eb", bg: "#eff6ff" },
  excel: { label: "Excel", icon: FileSpreadsheet, color: "#16a34a", bg: "#f0fdf4" },
  xls: { label: "Excel", icon: FileSpreadsheet, color: "#16a34a", bg: "#f0fdf4" },
  xlsx: { label: "Excel", icon: FileSpreadsheet, color: "#16a34a", bg: "#f0fdf4" },
  image: { label: "Image", icon: ImageIcon, color: "#7c3aed", bg: "#f5f3ff" },
  document: { label: "Document", icon: FileText, color: "#475569", bg: "#f8fafc" },
  link: { label: "Lien", icon: LinkIcon, color: "#0ea5e9", bg: "#f0f9ff" },
  text: { label: "Texte", icon: FileText, color: "#475569", bg: "#f8fafc" }
};

const CATEGORY_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "pdf", label: "PDF" },
  { key: "powerpoint", label: "PowerPoint" },
  { key: "word", label: "Word" },
  { key: "excel", label: "Excel" },
  { key: "image", label: "Images" },
  { key: "template", label: "Templates" },
  { key: "other", label: "Autres" }
];

function getTypeConfig(type) {
  return TYPE_CONFIG[type?.toLowerCase()] || TYPE_CONFIG.document;
}

function matchesCategory(resourceType, resourceTitle, category) {
  if (category === "all") return true;
  if (category === "pdf") return resourceType === "pdf";
  if (category === "powerpoint") return ["powerpoint", "ppt", "pptx"].includes(resourceType);
  if (category === "word") return ["word", "doc", "docx"].includes(resourceType);
  if (category === "excel") return ["excel", "xls", "xlsx"].includes(resourceType);
  if (category === "image") return resourceType === "image";
  if (category === "template") {
    const t = String(resourceTitle || "").toLowerCase();
    return t.includes("template") || t.includes("modèle") || t.includes("grille");
  }
  if (category === "other") {
    return !["pdf", "powerpoint", "ppt", "pptx", "word", "doc", "docx", "excel", "xls", "xlsx", "image", "link", "text"].includes(resourceType);
  }
  return true;
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

function DocumentsTemplates({ modules, isAdmin = false }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [standaloneDocs, setStandaloneDocs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "", description: "", type: "pdf",
    url: "", moduleId: "", lessonId: ""
  });
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    async function loadDocs() {
      try {
        const res = await fetch("/api/admin/documents", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStandaloneDocs(data.documents || []);
          }
        }
      } catch (err) { console.error(err); }
    }
    loadDocs();
  }, [isAdmin]);

  // Resources from lessons (method A)
  const lessonResources = useMemo(() => {
    const items = [];
    for (const module of modules) {
      for (const lesson of (module.lessons || [])) {
        for (const resource of (lesson.resources || [])) {
          items.push({
            ...resource,
            moduleTitle: module.title,
            moduleKey: module.moduleKey || module.number || "",
            lessonTitle: lesson.title,
            lessonId: lesson.id,
            isStandalone: false
          });
        }
      }
    }
    return items;
  }, [modules]);

  // Standalone documents (method B — lesson_id NULL)
  const standaloneItems = useMemo(() => {
    return standaloneDocs
      .filter(d => !d.lesson_id)
      .map(d => ({
        ...d,
        moduleTitle: "Document général",
        lessonTitle: "",
        isStandalone: true
      }));
  }, [standaloneDocs]);

  const allResources = [...lessonResources, ...standaloneItems];

  const filtered = useMemo(() => {
    return allResources.filter(resource => {
      if (!matchesCategory(resource.type, resource.title, categoryFilter)) return false;
      if (moduleFilter !== "all" && resource.moduleTitle !== moduleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !resource.title?.toLowerCase().includes(q) &&
          !resource.moduleTitle?.toLowerCase().includes(q) &&
          !resource.lessonTitle?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [allResources, search, categoryFilter, moduleFilter]);

  const moduleNames = useMemo(() => {
    return [...new Set(modules.map(m => m.title))];
  }, [modules]);

  async function handleAddDocument(e) {
    e.preventDefault();
    setAddError("");

    if (!addForm.title.trim()) {
      setAddError("Le titre est obligatoire.");
      return;
    }

    try {
      const body = {
        title: addForm.title,
        type: addForm.type,
        url: addForm.url,
        content: addForm.description,
        lesson_id: addForm.lessonId || null
      };

      const res = await fetch("/api/admin/resources", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'ajout.");
      }

      // Reload standalone docs
      const docsRes = await fetch("/api/admin/documents", { credentials: "include" });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        if (docsData.success) setStandaloneDocs(docsData.documents || []);
      }

      setAddForm({ title: "", description: "", type: "pdf", url: "", moduleId: "", lessonId: "" });
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "28px", flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
            BIBLIOTHÈQUE
          </div>
          <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>
            Documents & Templates
          </h1>
          <p style={{ color: "#6b7a8c", margin: 0 }}>
            Tous les supports pédagogiques de la formation, automatiquement synchronisés depuis les leçons.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              border: 0, borderRadius: "12px", padding: "12px 20px",
              background: "#f1bd3e", color: "#09233d", fontWeight: 800,
              cursor: "pointer", fontSize: "14px",
              display: "inline-flex", alignItems: "center", gap: "8px"
            }}
          >
            <Plus size={18} /> Ajouter un document
          </button>
        )}
      </div>

      {/* ADD FORM */}
      {isAdmin && showAddForm && (
        <form onSubmit={handleAddDocument} style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "24px", marginBottom: "24px"
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "18px"
          }}>
            <h2 style={{ margin: 0, color: "#09233d", fontSize: "20px" }}>Nouveau document</h2>
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

          <div style={{ display: "grid", gap: "14px" }}>
            <input placeholder="Titre du document" value={addForm.title}
              onChange={e => setAddForm({ ...addForm, title: e.target.value })}
              style={inputStyle} />

            <textarea placeholder="Description (optionnel)" value={addForm.description}
              onChange={e => setAddForm({ ...addForm, description: e.target.value })}
              rows={2} style={inputStyle} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>Type</label>
                <select value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })} style={inputStyle}>
                  <option value="pdf">PDF</option>
                  <option value="powerpoint">PowerPoint</option>
                  <option value="word">Word</option>
                  <option value="excel">Excel</option>
                  <option value="image">Image</option>
                  <option value="link">Lien externe</option>
                  <option value="document">Autre document</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>URL du fichier</label>
                <input placeholder="https://... (optionnel)" value={addForm.url}
                  onChange={e => setAddForm({ ...addForm, url: e.target.value })}
                  style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Module (optionnel)
                </label>
                <select value={addForm.moduleId} onChange={e => {
                  const mid = e.target.value;
                  setAddForm({ ...addForm, moduleId: mid, lessonId: "" });
                }} style={inputStyle}>
                  <option value="">Document général (sans module)</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Leçon (optionnel)
                </label>
                <select value={addForm.lessonId} onChange={e => setAddForm({ ...addForm, lessonId: e.target.value })}
                  style={inputStyle} disabled={!addForm.moduleId}>
                  <option value="">Aucune leçon</option>
                  {modules.find(m => String(m.id) === String(addForm.moduleId))?.lessons?.map(l => (
                    <option key={l.id} value={l.numericId || l.id}>{l.title}</option>
                  )) || []}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" style={{
            marginTop: "18px", border: 0, borderRadius: "12px", padding: "14px 20px",
            background: "#09233d", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "15px"
          }}>
            Ajouter le document
          </button>
        </form>
      )}

      {allResources.length === 0 && !showAddForm && (
        <div style={{
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
          padding: "48px 24px", textAlign: "center", color: "#7b8797"
        }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "6px" }}>
            Aucun document disponible pour le moment
          </p>
          <p style={{ fontSize: "14px" }}>
            Les supports ajoutés aux leçons apparaîtront automatiquement ici.
            {isAdmin && " Tu peux aussi ajouter un document directement ici."}
          </p>
        </div>
      )}

      {allResources.length > 0 && (
        <>
          <div style={{
            display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px"
          }}>
            <div style={{ flex: "1 1 240px", position: "relative", minWidth: 200 }}>
              <Search size={18} style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)", color: "#9aa5b5"
              }} />
              <input placeholder="Rechercher un document..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "44px" }}
              />
            </div>

            <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
              <option value="all">Tous les modules</option>
              {moduleNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
            {CATEGORY_FILTERS.map(cat => (
              <button key={cat.key} onClick={() => setCategoryFilter(cat.key)}
                style={{
                  padding: "8px 16px", borderRadius: "999px",
                  border: categoryFilter === cat.key ? "1px solid #09233d" : "1px solid #dfe5eb",
                  background: categoryFilter === cat.key ? "#09233d" : "#fff",
                  color: categoryFilter === cat.key ? "#fff" : "#475569",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer"
                }}>
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px"
          }}>
            {filtered.map((resource, index) => {
              const tc = getTypeConfig(resource.type);
              const Icon = tc.icon;
              const canPreview = ["pdf", "image", "link"].includes(resource.type) ||
                (resource.url && resource.url.match(/\.(pdf|png|jpg|jpeg|gif|webp)$/i));

              return (
                <div key={resource.id || index} style={{
                  background: "#fff", border: "1px solid #e5eaf0", borderRadius: "16px",
                  padding: "20px", display: "flex", flexDirection: "column", gap: "14px"
                }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      background: tc.bg, color: tc.color,
                      display: "grid", placeItems: "center", flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{
                        display: "block", color: "#09233d", fontSize: "15px",
                        lineHeight: 1.3, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {resource.title}
                      </strong>
                      <span style={{
                        display: "inline-block", marginTop: "5px",
                        padding: "3px 8px", borderRadius: "6px",
                        background: tc.bg, color: tc.color,
                        fontSize: "11px", fontWeight: 700
                      }}>
                        {tc.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", color: "#7b8797", lineHeight: 1.5 }}>
                    <div>{resource.moduleTitle}</div>
                    {resource.lessonTitle && (
                      <div style={{ fontSize: "12px", marginTop: "2px" }}>
                        {resource.lessonTitle}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    {canPreview && resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{
                        flex: 1, display: "inline-flex", alignItems: "center",
                        justifyContent: "center", gap: "6px", padding: "9px 12px",
                        borderRadius: "10px", border: "1px solid #dfe5eb",
                        background: "#f8fafc", color: "#475569",
                        fontWeight: 700, fontSize: "13px", textDecoration: "none", cursor: "pointer"
                      }}>
                        <Eye size={15} /> Voir
                      </a>
                    )}
                    {resource.url && (
                      <a href={resource.url} download style={{
                        flex: 1, display: "inline-flex", alignItems: "center",
                        justifyContent: "center", gap: "6px", padding: "9px 12px",
                        borderRadius: "10px", border: 0,
                        background: "#f1bd3e", color: "#09233d",
                        fontWeight: 700, fontSize: "13px", textDecoration: "none", cursor: "pointer"
                      }}>
                        <Download size={15} /> Télécharger
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{
              padding: "40px", textAlign: "center",
              color: "#7b8797", fontSize: "15px"
            }}>
              Aucun document ne correspond à ta recherche.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DocumentsTemplates;
