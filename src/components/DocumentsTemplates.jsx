import { useState, useMemo } from "react";
import {
  FileText, FileSpreadsheet, Presentation, FileType,
  Image as ImageIcon, Link as LinkIcon, Download, Eye,
  Search, Filter as FilterIcon
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

function matchesCategory(resourceType, category) {
  if (category === "all") return true;
  if (category === "pdf") return resourceType === "pdf";
  if (category === "powerpoint") return ["powerpoint", "ppt", "pptx"].includes(resourceType);
  if (category === "word") return ["word", "doc", "docx"].includes(resourceType);
  if (category === "excel") return ["excel", "xls", "xlsx"].includes(resourceType);
  if (category === "image") return resourceType === "image";
  if (category === "template") {
    const title = String(resourceType || "").toLowerCase();
    return title.includes("template") || title.includes("modèle");
  }
  if (category === "other") {
    return !["pdf", "powerpoint", "ppt", "pptx", "word", "doc", "docx", "excel", "xls", "xlsx", "image", "link", "text"].includes(resourceType);
  }
  return true;
}

function DocumentsTemplates({ modules, isAdmin = false }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const allResources = useMemo(() => {
    const items = [];
    for (const module of modules) {
      for (const lesson of (module.lessons || [])) {
        for (const resource of (lesson.resources || [])) {
          items.push({
            ...resource,
            moduleTitle: module.title,
            moduleKey: module.moduleKey || module.number || "",
            lessonTitle: lesson.title,
            lessonId: lesson.id
          });
        }
      }
    }
    return items;
  }, [modules]);

  const filtered = useMemo(() => {
    return allResources.filter(resource => {
      if (!matchesCategory(resource.type, categoryFilter)) return false;
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

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "34px 28px 60px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", color: "#b07b00" }}>
          BIBLIOTHÈQUE
        </div>
        <h1 style={{ margin: "7px 0", color: "#09233d", fontSize: "30px" }}>
          Documents & Templates
        </h1>
        <p style={{ color: "#6b7a8c", margin: 0 }}>
          Tous les supports pédagogiques de ta formation, automatiquement synchronisés depuis les leçons.
        </p>
      </div>

      {allResources.length === 0 && (
        <div style={{
          background: "#fff",
          border: "1px solid #e5eaf0",
          borderRadius: "16px",
          padding: "48px 24px",
          textAlign: "center",
          color: "#7b8797"
        }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <p style={{ fontWeight: 600, color: "#09233d", marginBottom: "6px" }}>
            Aucun document disponible pour le moment
          </p>
          <p style={{ fontSize: "14px" }}>
            Les supports ajoutés aux leçons apparaîtront automatiquement ici.
          </p>
        </div>
      )}

      {allResources.length > 0 && (
        <>
          <div style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "24px",
            alignItems: "center"
          }}>
            <div style={{
              flex: "1 1 240px",
              position: "relative",
              minWidth: 200
            }}>
              <Search size={18} style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9aa5b5"
              }} />
              <input
                placeholder="Rechercher un document..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 44px",
                  border: "1px solid #dfe5eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              style={{
                padding: "12px 14px",
                border: "1px solid #dfe5eb",
                borderRadius: "12px",
                fontSize: "14px",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              <option value="all">Tous les modules</option>
              {moduleNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "24px"
          }}>
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  border: categoryFilter === cat.key ? "1px solid #09233d" : "1px solid #dfe5eb",
                  background: categoryFilter === cat.key ? "#09233d" : "#fff",
                  color: categoryFilter === cat.key ? "#fff" : "#475569",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
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
                <div
                  key={resource.id || index}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5eaf0",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    transition: "box-shadow .15s ease"
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: tc.bg,
                      color: tc.color,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0
                    }}>
                      <Icon size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{
                        display: "block",
                        color: "#09233d",
                        fontSize: "15px",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {resource.title}
                      </strong>
                      <span style={{
                        display: "inline-block",
                        marginTop: "5px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: tc.bg,
                        color: tc.color,
                        fontSize: "11px",
                        fontWeight: 700
                      }}>
                        {tc.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", color: "#7b8797", lineHeight: 1.5 }}>
                    <div>{resource.moduleTitle}</div>
                    <div style={{ fontSize: "12px", marginTop: "2px" }}>
                      {resource.lessonTitle}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "auto"
                  }}>
                    {canPreview && resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "9px 12px",
                          borderRadius: "10px",
                          border: "1px solid #dfe5eb",
                          background: "#f8fafc",
                          color: "#475569",
                          fontWeight: 700,
                          fontSize: "13px",
                          textDecoration: "none",
                          cursor: "pointer"
                        }}
                      >
                        <Eye size={15} /> Voir
                      </a>
                    )}

                    {resource.url && (
                      <a
                        href={resource.url}
                        download
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "9px 12px",
                          borderRadius: "10px",
                          border: 0,
                          background: "#f1bd3e",
                          color: "#09233d",
                          fontWeight: 700,
                          fontSize: "13px",
                          textDecoration: "none",
                          cursor: "pointer"
                        }}
                      >
                        <Download size={15} /> Télécharger
                      </a>
                    )}

                    {!resource.url && resource.content && (
                      <span style={{
                        fontSize: "12px",
                        color: "#9aa5b5",
                        padding: "9px 0"
                      }}>
                        Contenu texte disponible
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "#7b8797",
              fontSize: "15px"
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
