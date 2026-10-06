
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(process.cwd(), "data/fcs.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS formations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  formation_id INTEGER NOT NULL,
  module_key TEXT NOT NULL,
  number TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE,
  UNIQUE(formation_id, module_key)
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL,
  lesson_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE(module_id, lesson_key)
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  duration INTEGER DEFAULT 0,
  transcript TEXT DEFAULT '',
  transcript_status TEXT DEFAULT 'none',
  transcript_updated_at TEXT DEFAULT '',
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS video_transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL UNIQUE,
  transcript TEXT DEFAULT '',
  status TEXT DEFAULT 'none',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT DEFAULT '',
  content TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  published INTEGER DEFAULT 1,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_key TEXT NOT NULL,
  lesson_id INTEGER NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_at TEXT DEFAULT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_key, lesson_id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quiz_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  model_json TEXT DEFAULT '{}',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

function cleanUrl(value) {
  if (!value) return "";

  const text = String(value).trim();

  const start = text.indexOf("https://");

  if (start === -1) {
    return text;
  }

  const urlPart = text.slice(start);

  const mp4 = urlPart.toLowerCase().indexOf(".mp4");

  if (mp4 === -1) {
    return urlPart;
  }

  return urlPart.slice(0, mp4 + 4);
}

function importInitialCatalogue() {

  const formationTitle = "Football Coach System";

  let formation = db.prepare(`
    SELECT *
    FROM formations
    WHERE title = ?
    LIMIT 1
  `).get(formationTitle);

  if (!formation) {
    const result = db.prepare(`
      INSERT INTO formations
        (title, description, published)
      VALUES (?, ?, 1)
    `).run(
      formationTitle,
      "Formation Football Coach System"
    );

    formation = {
      id: result.lastInsertRowid
    };
  }

  const exportPath = path.resolve(process.cwd(), "content-export.json");

  if (!fs.existsSync(exportPath)) {
    console.log("ℹ️ content-export.json non trouvé. Base créée sans catalogue.");
    return;
  }

  let data;

  try {
    data = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  } catch (error) {
    console.log("⚠️ Impossible de lire content-export.json :", error.message);
    return;
  }

  const archivedKeys = (data._meta && data._meta.archived_modules) || [];
  const activeModules = (data.modules || []).filter(m => !archivedKeys.includes(m.module_key));

  if (!activeModules.length) {
    console.log("ℹ️ Aucun module actif dans content-export.json.");
    return;
  }

  const upsertFormation = db.prepare(`
    INSERT OR REPLACE INTO formations
      (id, title, description, image, published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertModule = db.prepare(`
    INSERT OR REPLACE INTO modules
      (id, formation_id, module_key, number, title, description, image, position, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertLesson = db.prepare(`
    INSERT OR REPLACE INTO lessons
      (id, module_id, lesson_key, title, description, position, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertVideo = db.prepare(`
    INSERT OR REPLACE INTO videos
      (id, lesson_id, title, url, position, published, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertResource = db.prepare(`
    INSERT OR REPLACE INTO resources
      (id, lesson_id, type, title, url, content, position, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {

    const f = (data.formations || [])[0];
    if (f) {
      upsertFormation.run(
        f.id, f.title, f.description || "", f.image || "",
        f.published ?? 1, f.created_at || "", f.updated_at || ""
      );
    }

    const activeModuleIds = new Set();
    const activeLessonIds = new Set();

    for (const m of activeModules) {
      upsertModule.run(
        m.id, m.formation_id, m.module_key, m.number || "",
        m.title, m.description || "", m.image || "",
        m.position || 0, m.published ?? 1
      );
      activeModuleIds.add(m.id);
    }

    for (const l of (data.lessons || [])) {
      if (!activeModuleIds.has(l.module_id)) continue;
      upsertLesson.run(
        l.id, l.module_id, l.lesson_key, l.title,
        l.description || "", l.position || 0, l.published ?? 1
      );
      activeLessonIds.add(l.id);
    }

    let videoCount = 0;
    for (const v of (data.videos || [])) {
      if (!activeLessonIds.has(v.lesson_id)) continue;
      upsertVideo.run(
        v.id, v.lesson_id, v.title, v.url,
        v.position || 0, v.published ?? 1, v.duration || 0
      );
      videoCount++;
    }

    for (const r of (data.resources || [])) {
      if (r.lesson_id && !activeLessonIds.has(r.lesson_id)) continue;
      upsertResource.run(
        r.id, r.lesson_id || null, r.type, r.title,
        r.url || "", r.content || "", r.position || 0, r.published ?? 1
      );
    }

    console.log("");
    console.log("✅ IMPORT CATALOGUE TERMINÉ");
    console.log("📁 Source : content-export.json");
    console.log("📦 Modules :", activeModules.length);
    console.log("📝 Leçons :", activeLessonIds.size);
    console.log("🎬 Vidéos :", videoCount);
  });

  transaction();
}

function PathSafe(value) {
  return path.resolve(value);
}

importInitialCatalogue();

function registerContentRoutes(app) {
  // ==========================================================
  // VIDEO PROXY
  // Les vidéos CloudFront sont servies par notre propre API.
  // Cela évite les problèmes de lecture/CORS côté navigateur.
  // ==========================================================
  app.get("/api/video/:id", async (req, res) => {
    try {
      const video = db.prepare(`
        SELECT id, url, title
        FROM videos
        WHERE id = ?
          AND published = 1
      `).get(req.params.id);

      if (!video) {
        return res.status(404).json({
          ok: false,
          error: "Vidéo introuvable"
        });
      }

      let url = String(video.url || "").trim();

      // Nettoyage d'une éventuelle URL Markdown :
      // [https://...mp4](https://...mp4)
      const markdown = url.match(/^\[([^\]]+)\]\(\1\)$/);
      if (markdown) {
        url = markdown[1];
      }

      if (!/^https:\/\/d1yei2z3i6k35z\.cloudfront\.net\//i.test(url)) {
        return res.status(400).json({
          ok: false,
          error: "Source vidéo non autorisée"
        });
      }

      const headers = {};

      // Très important pour permettre le seek dans la vidéo.
      if (req.headers.range) {
        headers.Range = req.headers.range;
      }

      const upstream = await fetch(url, {
        headers
      });

      if (!upstream.ok && upstream.status !== 206) {
        return res.status(upstream.status).json({
          ok: false,
          error: `Erreur source vidéo (${upstream.status})`
        });
      }

      res.status(upstream.status);

      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") || "video/mp4"
      );

      res.setHeader("Accept-Ranges", "bytes");

      const contentLength = upstream.headers.get("content-length");
      const contentRange = upstream.headers.get("content-range");

      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
      }

      if (!upstream.body) {
        return res.end();
      }

      const { Readable } = await import("node:stream");
      Readable.fromWeb(upstream.body).pipe(res);

    } catch (error) {
      console.error("❌ VIDEO PROXY ERROR:", error);

      if (!res.headersSent) {
        res.status(500).json({
          ok: false,
          error: "Impossible de charger la vidéo"
        });
      } else {
        res.end();
      }
    }
  });



  app.get("/api/admin/documents", (req, res) => {
    const documents = db.prepare(`
      SELECT
        r.id,
        r.lesson_id,
        r.type,
        r.title,
        r.url,
        r.content,
        r.position,
        r.published,
        l.title AS lesson_title,
        m.title AS module_title,
        m.module_key
      FROM resources r
      LEFT JOIN lessons l ON l.id = r.lesson_id
      LEFT JOIN modules m ON m.id = l.module_id
      ORDER BY r.id DESC
    `).all();

    res.json({
      success: true,
      documents
    });
  });

  app.get("/api/content", (req, res) => {

    const formation = db.prepare(`
      SELECT *
      FROM formations
      WHERE published = 1
      ORDER BY id
      LIMIT 1
    `).get();

    if (!formation) {
      return res.json({
        formation: null,
        modules: []
      });
    }

    const modules = db.prepare(`
      SELECT *
      FROM modules
      WHERE formation_id = ?
        AND published = 1
      ORDER BY position, id
    `).all(formation.id);

    const result = modules.map(module => {

      const lessons = db.prepare(`
        SELECT *
        FROM lessons
        WHERE module_id = ?
          AND published = 1
        ORDER BY position, id
      `).all(module.id);

      return {
        ...module,
        lessons: lessons.map(lesson => {

          const videos = db.prepare(`
            SELECT
              id,
              title,
              url,
              position,
              duration
            FROM videos
            WHERE lesson_id = ?
              AND published = 1
            ORDER BY position, id
          `).all(lesson.id);

          const resources = db.prepare(`
            SELECT
              id,
              type,
              title,
              url,
              content,
              position
            FROM resources
            WHERE lesson_id = ?
              AND published = 1
            ORDER BY position, id
          `).all(lesson.id);

          return {
            ...lesson,
            videos,
            resources
          };
        })
      };
    });

    res.json({
      formation,
      modules: result
    });
  });

  app.get("/api/admin/content", (req, res) => {

    const formation = db.prepare(`
      SELECT *
      FROM formations
      ORDER BY id
      LIMIT 1
    `).get();

    if (!formation) {
      return res.json({
        formation: null,
        modules: []
      });
    }

    const modules = db.prepare(`
      SELECT *
      FROM modules
      WHERE formation_id = ?
      ORDER BY position, id
    `).all(formation.id);

    for (const module of modules) {

      module.lessons = db.prepare(`
        SELECT *
        FROM lessons
        WHERE module_id = ?
        ORDER BY position, id
      `).all(module.id);

      for (const lesson of module.lessons) {

        lesson.videos = db.prepare(`
          SELECT *
          FROM videos
          WHERE lesson_id = ?
          ORDER BY position, id
        `).all(lesson.id);

        lesson.resources = db.prepare(`
          SELECT *
          FROM resources
          WHERE lesson_id = ?
          ORDER BY position, id
        `).all(lesson.id);
      }
    }

    res.json({
      formation,
      modules
    });
  });

  app.post("/api/admin/modules", (req, res) => {

    const {
      formation_id,
      module_key,
      number,
      title,
      description = "",
      image = "",
      position = 0
    } = req.body;

    if (
      !formation_id ||
      !module_key ||
      !title
    ) {
      return res.status(400).json({
        error:
          "formation_id, module_key et title sont requis"
      });
    }

    const result = db.prepare(`
      INSERT INTO modules
        (
          formation_id,
          module_key,
          number,
          title,
          description,
          image,
          position
        )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      formation_id,
      module_key,
      number || "",
      title,
      description,
      image,
      position
    );

    res.json({
      success: true,
      id: result.lastInsertRowid
    });
  });

  app.post("/api/admin/lessons", (req, res) => {

    const {
      module_id,
      lesson_key,
      title,
      description = "",
      position = 0
    } = req.body;

    if (
      !module_id ||
      !lesson_key ||
      !title
    ) {
      return res.status(400).json({
        error:
          "module_id, lesson_key et title sont requis"
      });
    }

    const result = db.prepare(`
      INSERT INTO lessons
        (
          module_id,
          lesson_key,
          title,
          description,
          position
        )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      module_id,
      lesson_key,
      title,
      description,
      position
    );

    res.json({
      success: true,
      id: result.lastInsertRowid
    });
  });

  app.post("/api/admin/videos", (req, res) => {

    const {
      lesson_id,
      title,
      url,
      position = 0,
      duration = 0
    } = req.body;

    if (
      !lesson_id ||
      !title ||
      !url
    ) {
      return res.status(400).json({
        error:
          "lesson_id, title et url sont requis"
      });
    }

    // ---------------------------------------------------
    // Compatibilité anciens IDs frontend : m1-l1, m2-l3...
    // -> vrais IDs numériques SQLite
    // ---------------------------------------------------

    let realLessonId = Number(lesson_id);

    const legacyMatch = String(lesson_id).match(/^m(\d+)-l(\d+)$/i);

    if (legacyMatch) {
      const moduleNumber = Number(legacyMatch[1]);
      const lessonNumber = Number(legacyMatch[2]);

      const orderedModules = db.prepare(`
        SELECT id
        FROM modules
        WHERE formation_id = ?
        ORDER BY position, id
      `).all(
        db.prepare("SELECT id FROM formations ORDER BY id LIMIT 1").get()?.id
      );

      const selectedModule = orderedModules[moduleNumber - 1];

      if (!selectedModule) {
        return res.status(400).json({
          success: false,
          error: `Module ${moduleNumber} introuvable pour ${lesson_id}.`
        });
      }

      const selectedLesson = db.prepare(`
        SELECT id, title
        FROM lessons
        WHERE module_id = ?
        ORDER BY position, id
      `).all(selectedModule.id)[lessonNumber - 1];

      if (!selectedLesson) {
        return res.status(400).json({
          success: false,
          error: `Leçon ${lesson_id} introuvable dans le module ${moduleNumber}.`
        });
      }

      realLessonId = selectedLesson.id;
    }

    const lessonCheck = db.prepare(
      "SELECT id, title FROM lessons WHERE id = ?"
    ).get(realLessonId);

    console.log(
      "FCS VIDEO DEBUG — reçu:",
      lesson_id,
      "-> SQLite:",
      realLessonId,
      "lesson:",
      lessonCheck || "INTROUVABLE"
    );

    if (!lessonCheck) {
      return res.status(400).json({
        success: false,
        error: `La leçon ${lesson_id} n'existe pas dans la base de données.`
      });
    }

    const result = db.prepare(`
      INSERT INTO videos
        (
          lesson_id,
          title,
          url,
          position,
          duration
        )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      realLessonId,
      title,
      cleanUrl(url),
      position,
      duration
    );

    res.json({
      success: true,
      id: result.lastInsertRowid
    });
  });

  app.post("/api/admin/resources", (req, res) => {

    const {
      lesson_id,
      type,
      title,
      url = "",
      content = "",
      position = 0
    } = req.body;

    if (
      !type ||
      !title
    ) {
      return res.status(400).json({
        error:
          "type et title sont requis"
      });
    }

    const result = db.prepare(`
      INSERT INTO resources
        (
          lesson_id,
          type,
          title,
          url,
          content,
          position
        )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      lesson_id || null,
      type,
      title,
      url,
      content,
      position
    );

    res.json({
      success: true,
      id: result.lastInsertRowid
    });
  });

  app.patch("/api/admin/videos/:id", (req, res) => {

    const {
      title,
      url,
      position,
      published
    } = req.body;

    db.prepare(`
      UPDATE videos
      SET
        title = COALESCE(?, title),
        url = COALESCE(?, url),
        position = COALESCE(?, position),
        published = COALESCE(?, published)
      WHERE id = ?
    `).run(
      title ?? null,
      url ? cleanUrl(url) : null,
      position ?? null,
      published ?? null,
      req.params.id
    );

    res.json({
      success: true
    });
  });

  app.delete("/api/admin/videos/:id", (req, res) => {

    const video = db.prepare(`
      SELECT id, url
      FROM videos
      WHERE id = ?
    `).get(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Vidéo introuvable."
      });
    }

    // Supprimer uniquement les fichiers vidéo locaux.
    // Les vidéos CloudFront restent intactes.
    if (
      video.url &&
      video.url.startsWith("/uploads/videos/")
    ) {
      const fileName = decodeURIComponent(
        path.basename(video.url)
      );

      const filePath = path.resolve(
        process.cwd(),
        "server/uploads/videos",
        fileName
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Fichier vidéo supprimé :", filePath);
      }
    }

    db.prepare(`
      DELETE FROM videos
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      success: true
    });
  });

  app.patch("/api/admin/lessons/:id", (req, res) => {

    const {
      title,
      description,
      position,
      published
    } = req.body;

    db.prepare(`
      UPDATE lessons
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        position = COALESCE(?, position),
        published = COALESCE(?, published)
      WHERE id = ?
    `).run(
      title ?? null,
      description ?? null,
      position ?? null,
      published ?? null,
      req.params.id
    );

    res.json({
      success: true
    });
  });

  app.patch("/api/admin/modules/:id", (req, res) => {

    const {
      title,
      description,
      image,
      position,
      published
    } = req.body;

    db.prepare(`
      UPDATE modules
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        image = COALESCE(?, image),
        position = COALESCE(?, position),
        published = COALESCE(?, published)
      WHERE id = ?
    `).run(
      title ?? null,
      description ?? null,
      image ?? null,
      position ?? null,
      published ?? null,
      req.params.id
    );

    res.json({
      success: true
    });
  });

  app.delete("/api/admin/lessons/:id", (req, res) => {

    db.prepare(`
      DELETE FROM lessons
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      success: true
    });
  });

  app.delete("/api/admin/modules/:id", (req, res) => {

    db.prepare(`
      DELETE FROM modules
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      success: true
    });
  });

  app.post("/api/progress", (req, res) => {

    const {
      user_key,
      lesson_id,
      completed = 1
    } = req.body;

    if (!user_key || !lesson_id) {
      return res.status(400).json({
        error:
          "user_key et lesson_id sont requis"
      });
    }

    db.prepare(`
      INSERT INTO progress
        (
          user_key,
          lesson_id,
          completed,
          updated_at
        )
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_key, lesson_id)
      DO UPDATE SET
        completed = excluded.completed,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      user_key,
      lesson_id,
      completed ? 1 : 0
    );

    res.json({
      success: true
    });
  });

  app.get("/api/progress/:userKey", (req, res) => {

    const rows = db.prepare(`
      SELECT
        lesson_id,
        completed,
        updated_at
      FROM progress
      WHERE user_key = ?
      ORDER BY lesson_id
    `).all(req.params.userKey);

    res.json(rows);
  });
}

module.exports = {
  db,
  registerContentRoutes
};
