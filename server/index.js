import express from "express";
import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual
} = require("node:crypto");

const Database = require("better-sqlite3");
const path = require("node:path");

const execFileAsync = promisify(execFile);

const authDb = new Database(
  path.resolve(process.cwd(), "data/fcs.db")
);

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5180",
  "http://localhost:5181",
  "http://localhost:5182",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5180",
  "http://127.0.0.1:5181",
  "http://127.0.0.1:5182"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin non autorisée par FCS."));
  },
  credentials: true
}));

app.use("/uploads", express.static("server/uploads"));

app.use(express.json({
  limit: "10mb"
}));

/* =========================================================
   AUTHENTIFICATION APPRENANT FCS
   ========================================================= */

const AUTH_SESSION_DAYS = 7;

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, originalHash] = String(storedHash).split(":");

    if (!salt || !originalHash) return false;

    const calculated = scryptSync(password, salt, 64);
    const original = Buffer.from(originalHash, "hex");

    return (
      original.length === calculated.length &&
      timingSafeEqual(original, calculated)
    );
  } catch {
    return false;
  }
}

function hashSessionToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";

  return header.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=");

    if (index === -1) return cookies;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key) {
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }, {});
}

function setSessionCookie(res, token) {
  const maxAge = AUTH_SESSION_DAYS * 24 * 60 * 60;

  res.setHeader(
    "Set-Cookie",
    `fcs_session=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "fcs_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
  );
}

function getAuthenticatedUser(req) {
  const cookies = parseCookies(req);
  const token = cookies.fcs_session;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  return authDb.prepare(`
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.status,
      s.expires_at
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND u.status = 'active'
      AND datetime(s.expires_at) > datetime('now')
  `).get(tokenHash) || null;
}


function requireAdmin(req, res) {
  const user = getAuthenticatedUser(req);

  if (!user) {
    res.status(401).json({
      success: false,
      error: "Authentification requise."
    });
    return null;
  }

  if (user.role !== "admin") {
    res.status(403).json({
      success: false,
      error: "Accès administrateur requis."
    });
    return null;
  }

  return user;
}


/* =======================================================
   ADMIN CMS — MODULES & LEÇONS
   ======================================================= */

/* ---------- MODULES : LIST ---------- */

app.get("/api/admin/modules", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = new Database(DB_PATH);

    const modules = db.prepare(`
      SELECT
        m.id,
        m.formation_id,
        m.module_key,
        m.number,
        m.title,
        m.description,
        m.image,
        m.position,
        m.published,
        (
          SELECT COUNT(*)
          FROM lessons l
          WHERE l.module_id = m.id
        ) AS lesson_count
      FROM modules m
      ORDER BY m.position ASC, m.id ASC
    `).all();

    db.close();

    return res.json({
      success: true,
      modules
    });

  } catch (error) {
    console.error("GET /api/admin/modules:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de récupérer les modules."
    });
  }
});


/* ---------- MODULE : CREATE ---------- */

app.post("/api/admin/modules", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const {
      formation_id,
      module_key,
      number = "",
      title,
      description = "",
      image = "",
      position = 0,
      published = 1
    } = req.body || {};

    if (!formation_id || !module_key || !title) {
      return res.status(400).json({
        success: false,
        error: "formation_id, module_key et title sont obligatoires."
      });
    }

    const db = new Database(DB_PATH);

    const formation = db.prepare(`
      SELECT id
      FROM formations
      WHERE id = ?
    `).get(formation_id);

    if (!formation) {
      db.close();

      return res.status(400).json({
        success: false,
        error: "Formation introuvable."
      });
    }

    const existing = db.prepare(`
      SELECT id
      FROM modules
      WHERE formation_id = ?
        AND module_key = ?
    `).get(formation_id, module_key);

    if (existing) {
      db.close();

      return res.status(409).json({
        success: false,
        error: "Ce module_key existe déjà dans cette formation."
      });
    }

    const result = db.prepare(`
      INSERT INTO modules (
        formation_id,
        module_key,
        number,
        title,
        description,
        image,
        position,
        published
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      formation_id,
      module_key,
      number,
      title,
      description,
      image,
      position,
      published ? 1 : 0
    );

    const module = db.prepare(`
      SELECT *
      FROM modules
      WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return res.status(201).json({
      success: true,
      module
    });

  } catch (error) {
    console.error("POST /api/admin/modules:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de créer le module."
    });
  }
});


/* ---------- MODULE : UPDATE ---------- */

app.put("/api/admin/modules/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de module invalide."
      });
    }

    const {
      module_key,
      number,
      title,
      description,
      image,
      position,
      published
    } = req.body || {};

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT *
      FROM modules
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Module introuvable."
      });
    }

    db.prepare(`
      UPDATE modules
      SET
        module_key = ?,
        number = ?,
        title = ?,
        description = ?,
        image = ?,
        position = ?,
        published = ?
      WHERE id = ?
    `).run(
      module_key ?? existing.module_key,
      number ?? existing.number,
      title ?? existing.title,
      description ?? existing.description,
      image ?? existing.image,
      position ?? existing.position,
      published === undefined
        ? existing.published
        : (published ? 1 : 0),
      id
    );

    const module = db.prepare(`
      SELECT *
      FROM modules
      WHERE id = ?
    `).get(id);

    db.close();

    return res.json({
      success: true,
      module
    });

  } catch (error) {
    console.error("PUT /api/admin/modules/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de modifier le module."
    });
  }
});


/* ---------- MODULE : DELETE ---------- */

app.delete("/api/admin/modules/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de module invalide."
      });
    }

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT id
      FROM modules
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Module introuvable."
      });
    }

    db.prepare(`
      DELETE FROM modules
      WHERE id = ?
    `).run(id);

    db.close();

    return res.json({
      success: true,
      message: "Module supprimé."
    });

  } catch (error) {
    console.error("DELETE /api/admin/modules/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de supprimer le module."
    });
  }
});


/* ---------- LESSONS : LIST ---------- */

app.get("/api/admin/lessons", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = new Database(DB_PATH);

    const lessons = db.prepare(`
      SELECT
        l.id,
        l.module_id,
        l.lesson_key,
        l.title,
        l.description,
        l.position,
        l.published,
        m.title AS module_title,
        (
          SELECT COUNT(*)
          FROM videos v
          WHERE v.lesson_id = l.id
        ) AS video_count,
        (
          SELECT COUNT(*)
          FROM resources r
          WHERE r.lesson_id = l.id
        ) AS resource_count,
        (
          SELECT COUNT(*)
          FROM quizzes q
          WHERE q.lesson_id = l.id
        ) AS quiz_count
      FROM lessons l
      INNER JOIN modules m ON m.id = l.module_id
      ORDER BY m.position ASC, l.position ASC, l.id ASC
    `).all();

    db.close();

    return res.json({
      success: true,
      lessons
    });

  } catch (error) {
    console.error("GET /api/admin/lessons:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de récupérer les leçons."
    });
  }
});


/* ---------- LESSON : CREATE ---------- */

app.post("/api/admin/lessons", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const {
      module_id,
      lesson_key,
      title,
      description = "",
      position = 0,
      published = 1
    } = req.body || {};

    if (!module_id || !lesson_key || !title) {
      return res.status(400).json({
        success: false,
        error: "module_id, lesson_key et title sont obligatoires."
      });
    }

    const db = new Database(DB_PATH);

    const module = db.prepare(`
      SELECT id
      FROM modules
      WHERE id = ?
    `).get(module_id);

    if (!module) {
      db.close();

      return res.status(400).json({
        success: false,
        error: "Module introuvable."
      });
    }

    const existing = db.prepare(`
      SELECT id
      FROM lessons
      WHERE module_id = ?
        AND lesson_key = ?
    `).get(module_id, lesson_key);

    if (existing) {
      db.close();

      return res.status(409).json({
        success: false,
        error: "Cette lesson_key existe déjà dans ce module."
      });
    }

    const result = db.prepare(`
      INSERT INTO lessons (
        module_id,
        lesson_key,
        title,
        description,
        position,
        published
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      module_id,
      lesson_key,
      title,
      description,
      position,
      published ? 1 : 0
    );

    const lesson = db.prepare(`
      SELECT *
      FROM lessons
      WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return res.status(201).json({
      success: true,
      lesson
    });

  } catch (error) {
    console.error("POST /api/admin/lessons:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de créer la leçon."
    });
  }
});


/* ---------- LESSON : UPDATE ---------- */

app.put("/api/admin/lessons/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de leçon invalide."
      });
    }

    const {
      lesson_key,
      title,
      description,
      position,
      published
    } = req.body || {};

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT *
      FROM lessons
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Leçon introuvable."
      });
    }

    db.prepare(`
      UPDATE lessons
      SET
        lesson_key = ?,
        title = ?,
        description = ?,
        position = ?,
        published = ?
      WHERE id = ?
    `).run(
      lesson_key ?? existing.lesson_key,
      title ?? existing.title,
      description ?? existing.description,
      position ?? existing.position,
      published === undefined
        ? existing.published
        : (published ? 1 : 0),
      id
    );

    const lesson = db.prepare(`
      SELECT *
      FROM lessons
      WHERE id = ?
    `).get(id);

    db.close();

    return res.json({
      success: true,
      lesson
    });

  } catch (error) {
    console.error("PUT /api/admin/lessons/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de modifier la leçon."
    });
  }
});


/* ---------- LESSON : DELETE ---------- */

app.delete("/api/admin/lessons/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de leçon invalide."
      });
    }

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT id
      FROM lessons
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Leçon introuvable."
      });
    }

    db.prepare(`
      DELETE FROM lessons
      WHERE id = ?
    `).run(id);

    db.close();

    return res.json({
      success: true,
      message: "Leçon supprimée."
    });

  } catch (error) {
    console.error("DELETE /api/admin/lessons/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de supprimer la leçon."
    });
  }
});



/* =======================================================
   ADMIN CMS — VIDÉOS
   ======================================================= */

app.get("/api/admin/videos", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = new Database(DB_PATH);

    const videos = db.prepare(`
      SELECT
        v.id,
        v.lesson_id,
        v.title,
        v.url,
        v.position,
        v.published,
        v.duration,
        l.title AS lesson_title,
        m.id AS module_id,
        m.title AS module_title
      FROM videos v
      INNER JOIN lessons l ON l.id = v.lesson_id
      INNER JOIN modules m ON m.id = l.module_id
      ORDER BY m.position ASC, l.position ASC, v.position ASC, v.id ASC
    `).all();

    db.close();

    return res.json({
      success: true,
      videos
    });

  } catch (error) {
    console.error("GET /api/admin/videos:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de récupérer les vidéos."
    });
  }
});


app.post("/api/admin/videos", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const {
      lesson_id,
      title,
      url,
      position = 0,
      published = 1,
      duration = 0
    } = req.body || {};

    if (!lesson_id || !title || !url) {
      return res.status(400).json({
        success: false,
        error: "lesson_id, title et url sont obligatoires."
      });
    }

    const db = new Database(DB_PATH);

    const lesson = db.prepare(`
      SELECT id
      FROM lessons
      WHERE id = ?
    `).get(lesson_id);

    if (!lesson) {
      db.close();

      return res.status(400).json({
        success: false,
        error: "Leçon introuvable."
      });
    }

    const result = db.prepare(`
      INSERT INTO videos (
        lesson_id,
        title,
        url,
        position,
        published,
        duration
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      lesson_id,
      title,
      url,
      position,
      published ? 1 : 0,
      Number(duration) || 0
    );

    const video = db.prepare(`
      SELECT *
      FROM videos
      WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return res.status(201).json({
      success: true,
      video
    });

  } catch (error) {
    console.error("POST /api/admin/videos:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de créer la vidéo."
    });
  }
});


app.put("/api/admin/videos/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de vidéo invalide."
      });
    }

    const {
      lesson_id,
      title,
      url,
      position,
      published,
      duration
    } = req.body || {};

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT *
      FROM videos
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Vidéo introuvable."
      });
    }

    if (lesson_id !== undefined) {
      const lesson = db.prepare(`
        SELECT id
        FROM lessons
        WHERE id = ?
      `).get(lesson_id);

      if (!lesson) {
        db.close();

        return res.status(400).json({
          success: false,
          error: "Leçon introuvable."
        });
      }
    }

    db.prepare(`
      UPDATE videos
      SET
        lesson_id = ?,
        title = ?,
        url = ?,
        position = ?,
        published = ?,
        duration = ?
      WHERE id = ?
    `).run(
      lesson_id ?? existing.lesson_id,
      title ?? existing.title,
      url ?? existing.url,
      position ?? existing.position,
      published === undefined
        ? existing.published
        : (published ? 1 : 0),
      duration === undefined
        ? existing.duration
        : (Number(duration) || 0),
      id
    );

    const video = db.prepare(`
      SELECT *
      FROM videos
      WHERE id = ?
    `).get(id);

    db.close();

    return res.json({
      success: true,
      video
    });

  } catch (error) {
    console.error("PUT /api/admin/videos/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de modifier la vidéo."
    });
  }
});


app.delete("/api/admin/videos/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de vidéo invalide."
      });
    }

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT id
      FROM videos
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Vidéo introuvable."
      });
    }

    db.prepare(`
      DELETE FROM videos
      WHERE id = ?
    `).run(id);

    db.close();

    return res.json({
      success: true,
      message: "Vidéo supprimée."
    });

  } catch (error) {
    console.error("DELETE /api/admin/videos/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de supprimer la vidéo."
    });
  }
});


/* =======================================================
   ADMIN CMS — DOCUMENTS / RESOURCES
   ======================================================= */

app.get("/api/admin/resources", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = new Database(DB_PATH);

    const resources = db.prepare(`
      SELECT
        r.id,
        r.lesson_id,
        r.type,
        r.title,
        r.url,
        r.content,
        r.position,
        r.published,
        r.created_at,
        l.title AS lesson_title,
        m.id AS module_id,
        m.title AS module_title
      FROM resources r
      INNER JOIN lessons l ON l.id = r.lesson_id
      INNER JOIN modules m ON m.id = l.module_id
      ORDER BY m.position ASC, l.position ASC, r.position ASC, r.id ASC
    `).all();

    db.close();

    return res.json({
      success: true,
      resources
    });

  } catch (error) {
    console.error("GET /api/admin/resources:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de récupérer les documents."
    });
  }
});


app.post("/api/admin/resources", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const {
      lesson_id,
      type,
      title,
      url = "",
      content = "",
      position = 0,
      published = 1
    } = req.body || {};

    if (!lesson_id || !type || !title) {
      return res.status(400).json({
        success: false,
        error: "lesson_id, type et title sont obligatoires."
      });
    }

    const db = new Database(DB_PATH);

    const lesson = db.prepare(`
      SELECT id
      FROM lessons
      WHERE id = ?
    `).get(lesson_id);

    if (!lesson) {
      db.close();

      return res.status(400).json({
        success: false,
        error: "Leçon introuvable."
      });
    }

    const result = db.prepare(`
      INSERT INTO resources (
        lesson_id,
        type,
        title,
        url,
        content,
        position,
        published
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      lesson_id,
      type,
      title,
      url,
      content,
      position,
      published ? 1 : 0
    );

    const resource = db.prepare(`
      SELECT *
      FROM resources
      WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return res.status(201).json({
      success: true,
      resource
    });

  } catch (error) {
    console.error("POST /api/admin/resources:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de créer le document."
    });
  }
});


app.put("/api/admin/resources/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de document invalide."
      });
    }

    const {
      lesson_id,
      type,
      title,
      url,
      content,
      position,
      published
    } = req.body || {};

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT *
      FROM resources
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Document introuvable."
      });
    }

    if (lesson_id !== undefined) {
      const lesson = db.prepare(`
        SELECT id
        FROM lessons
        WHERE id = ?
      `).get(lesson_id);

      if (!lesson) {
        db.close();

        return res.status(400).json({
          success: false,
          error: "Leçon introuvable."
        });
      }
    }

    db.prepare(`
      UPDATE resources
      SET
        lesson_id = ?,
        type = ?,
        title = ?,
        url = ?,
        content = ?,
        position = ?,
        published = ?
      WHERE id = ?
    `).run(
      lesson_id ?? existing.lesson_id,
      type ?? existing.type,
      title ?? existing.title,
      url ?? existing.url,
      content ?? existing.content,
      position ?? existing.position,
      published === undefined
        ? existing.published
        : (published ? 1 : 0),
      id
    );

    const resource = db.prepare(`
      SELECT *
      FROM resources
      WHERE id = ?
    `).get(id);

    db.close();

    return res.json({
      success: true,
      resource
    });

  } catch (error) {
    console.error("PUT /api/admin/resources/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de modifier le document."
    });
  }
});


app.delete("/api/admin/resources/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de document invalide."
      });
    }

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT id
      FROM resources
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Document introuvable."
      });
    }

    db.prepare(`
      DELETE FROM resources
      WHERE id = ?
    `).run(id);

    db.close();

    return res.json({
      success: true,
      message: "Document supprimé."
    });

  } catch (error) {
    console.error("DELETE /api/admin/resources/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de supprimer le document."
    });
  }
});


/* =======================================================
   ADMIN CMS — QUIZZES
   ======================================================= */

app.get("/api/admin/quizzes", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = new Database(DB_PATH);

    const quizzes = db.prepare(`
      SELECT
        q.id,
        q.lesson_id,
        q.title,
        q.published,
        l.title AS lesson_title,
        m.id AS module_id,
        m.title AS module_title,
        (
          SELECT COUNT(*)
          FROM quiz_questions qq
          WHERE qq.quiz_id = q.id
        ) AS question_count
      FROM quizzes q
      INNER JOIN lessons l ON l.id = q.lesson_id
      INNER JOIN modules m ON m.id = l.module_id
      ORDER BY m.position ASC, l.position ASC, q.id ASC
    `).all();

    db.close();

    return res.json({
      success: true,
      quizzes
    });

  } catch (error) {
    console.error("GET /api/admin/quizzes:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de récupérer les quiz."
    });
  }
});


/* ---------- QUIZ : CREATE ---------- */

app.post("/api/admin/quizzes", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const {
      lesson_id,
      title,
      published = 1
    } = req.body || {};

    if (!lesson_id || !title) {
      return res.status(400).json({
        success: false,
        error: "lesson_id et title sont obligatoires."
      });
    }

    const db = new Database(DB_PATH);

    const lesson = db.prepare(`
      SELECT id
      FROM lessons
      WHERE id = ?
    `).get(lesson_id);

    if (!lesson) {
      db.close();

      return res.status(400).json({
        success: false,
        error: "Leçon introuvable."
      });
    }

    const result = db.prepare(`
      INSERT INTO quizzes (
        lesson_id,
        title,
        published
      )
      VALUES (?, ?, ?)
    `).run(
      lesson_id,
      title,
      published ? 1 : 0
    );

    const quiz = db.prepare(`
      SELECT *
      FROM quizzes
      WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return res.status(201).json({
      success: true,
      quiz
    });

  } catch (error) {
    console.error("POST /api/admin/quizzes:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de créer le quiz."
    });
  }
});


/* ---------- QUIZ : UPDATE ---------- */

app.put("/api/admin/quizzes/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de quiz invalide."
      });
    }

    const {
      lesson_id,
      title,
      published
    } = req.body || {};

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT *
      FROM quizzes
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Quiz introuvable."
      });
    }

    if (lesson_id !== undefined) {
      const lesson = db.prepare(`
        SELECT id
        FROM lessons
        WHERE id = ?
      `).get(lesson_id);

      if (!lesson) {
        db.close();

        return res.status(400).json({
          success: false,
          error: "Leçon introuvable."
        });
      }
    }

    db.prepare(`
      UPDATE quizzes
      SET
        lesson_id = ?,
        title = ?,
        published = ?
      WHERE id = ?
    `).run(
      lesson_id ?? existing.lesson_id,
      title ?? existing.title,
      published === undefined
        ? existing.published
        : (published ? 1 : 0),
      id
    );

    const quiz = db.prepare(`
      SELECT *
      FROM quizzes
      WHERE id = ?
    `).get(id);

    db.close();

    return res.json({
      success: true,
      quiz
    });

  } catch (error) {
    console.error("PUT /api/admin/quizzes/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de modifier le quiz."
    });
  }
});


/* ---------- QUIZ : DELETE ---------- */

app.delete("/api/admin/quizzes/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de quiz invalide."
      });
    }

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT id
      FROM quizzes
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Quiz introuvable."
      });
    }

    db.prepare(`
      DELETE FROM quizzes
      WHERE id = ?
    `).run(id);

    db.close();

    return res.json({
      success: true,
      message: "Quiz supprimé."
    });

  } catch (error) {
    console.error("DELETE /api/admin/quizzes/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de supprimer le quiz."
    });
  }
});


/* =======================================================
   ADMIN CMS — QUESTIONS DE QUIZ
   ======================================================= */

app.get("/api/admin/quizzes/:id/questions", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const quizId = Number(req.params.id);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de quiz invalide."
      });
    }

    const db = new Database(DB_PATH);

    const quiz = db.prepare(`
      SELECT id, title
      FROM quizzes
      WHERE id = ?
    `).get(quizId);

    if (!quiz) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Quiz introuvable."
      });
    }

    const questions = db.prepare(`
      SELECT
        id,
        quiz_id,
        question,
        options_json,
        correct_answer,
        position
      FROM quiz_questions
      WHERE quiz_id = ?
      ORDER BY position ASC, id ASC
    `).all(quizId);

    db.close();

    return res.json({
      success: true,
      quiz,
      questions
    });

  } catch (error) {
    console.error("GET /api/admin/quizzes/:id/questions:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de récupérer les questions."
    });
  }
});


/* ---------- QUESTION : CREATE ---------- */

app.post("/api/admin/quizzes/:id/questions", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const quizId = Number(req.params.id);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de quiz invalide."
      });
    }

    const {
      question,
      options_json,
      correct_answer,
      position = 0
    } = req.body || {};

    if (!question || !options_json || !correct_answer) {
      return res.status(400).json({
        success: false,
        error: "question, options_json et correct_answer sont obligatoires."
      });
    }

    const db = new Database(DB_PATH);

    const quiz = db.prepare(`
      SELECT id
      FROM quizzes
      WHERE id = ?
    `).get(quizId);

    if (!quiz) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Quiz introuvable."
      });
    }

    let normalizedOptions;

    try {
      normalizedOptions =
        typeof options_json === "string"
          ? JSON.parse(options_json)
          : options_json;
    } catch {
      db.close();

      return res.status(400).json({
        success: false,
        error: "options_json doit contenir un JSON valide."
      });
    }

    if (
      !Array.isArray(normalizedOptions) ||
      normalizedOptions.length < 2
    ) {
      db.close();

      return res.status(400).json({
        success: false,
        error: "Une question doit contenir au moins deux réponses."
      });
    }

    const result = db.prepare(`
      INSERT INTO quiz_questions (
        quiz_id,
        question,
        options_json,
        correct_answer,
        position
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      quizId,
      question,
      JSON.stringify(normalizedOptions),
      correct_answer,
      position
    );

    const created = db.prepare(`
      SELECT *
      FROM quiz_questions
      WHERE id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return res.status(201).json({
      success: true,
      question: created
    });

  } catch (error) {
    console.error("POST /api/admin/quizzes/:id/questions:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de créer la question."
    });
  }
});


/* ---------- QUESTION : UPDATE ---------- */

app.put("/api/admin/quiz-questions/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de question invalide."
      });
    }

    const {
      question,
      options_json,
      correct_answer,
      position
    } = req.body || {};

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT *
      FROM quiz_questions
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Question introuvable."
      });
    }

    let normalizedOptions = existing.options_json;

    if (options_json !== undefined) {
      try {
        const parsed =
          typeof options_json === "string"
            ? JSON.parse(options_json)
            : options_json;

        if (!Array.isArray(parsed) || parsed.length < 2) {
          db.close();

          return res.status(400).json({
            success: false,
            error: "Une question doit contenir au moins deux réponses."
          });
        }

        normalizedOptions = JSON.stringify(parsed);

      } catch {
        db.close();

        return res.status(400).json({
          success: false,
          error: "options_json doit contenir un JSON valide."
        });
      }
    }

    db.prepare(`
      UPDATE quiz_questions
      SET
        question = ?,
        options_json = ?,
        correct_answer = ?,
        position = ?
      WHERE id = ?
    `).run(
      question ?? existing.question,
      normalizedOptions,
      correct_answer ?? existing.correct_answer,
      position ?? existing.position,
      id
    );

    const updated = db.prepare(`
      SELECT *
      FROM quiz_questions
      WHERE id = ?
    `).get(id);

    db.close();

    return res.json({
      success: true,
      question: updated
    });

  } catch (error) {
    console.error("PUT /api/admin/quiz-questions/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de modifier la question."
    });
  }
});


/* ---------- QUESTION : DELETE ---------- */

app.delete("/api/admin/quiz-questions/:id", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID de question invalide."
      });
    }

    const db = new Database(DB_PATH);

    const existing = db.prepare(`
      SELECT id
      FROM quiz_questions
      WHERE id = ?
    `).get(id);

    if (!existing) {
      db.close();

      return res.status(404).json({
        success: false,
        error: "Question introuvable."
      });
    }

    db.prepare(`
      DELETE FROM quiz_questions
      WHERE id = ?
    `).run(id);

    db.close();

    return res.json({
      success: true,
      message: "Question supprimée."
    });

  } catch (error) {
    console.error("DELETE /api/admin/quiz-questions/:id:", error);

    return res.status(500).json({
      success: false,
      error: "Impossible de supprimer la question."
    });
  }
});

/* =========================
   REGISTER
   ========================= */

app.post("/api/auth/register", (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || "");
    const firstName = String(req.body?.first_name || "").trim();
    const lastName = String(req.body?.last_name || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email et mot de passe obligatoires."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Le mot de passe doit contenir au moins 8 caractères."
      });
    }

    const existing = authDb
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Un compte existe déjà avec cet email."
      });
    }

    const passwordHash = hashPassword(password);

    const result = authDb.prepare(`
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status
      )
      VALUES (?, ?, ?, ?, 'student', 'active')
    `).run(
      email,
      passwordHash,
      firstName,
      lastName
    );

    return res.status(201).json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        email,
        first_name: firstName,
        last_name: lastName,
        role: "student",
        status: "active"
      }
    });

  } catch (error) {
    console.error("POST /api/auth/register:", error);

    return res.status(500).json({
      success: false,
      error: "Erreur lors de la création du compte."
    });
  }
});


/* =========================
   LOGIN
   ========================= */

app.post("/api/auth/login", (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || "");

    const user = authDb.prepare(`
      SELECT
        id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        status
      FROM users
      WHERE email = ?
    `).get(email);

    if (
      !user ||
      user.status !== "active" ||
      !verifyPassword(password, user.password_hash)
    ) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect."
      });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(token);

    const expiresAt = new Date(
      Date.now() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    authDb.prepare(`
      INSERT INTO sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?)
    `).run(
      user.id,
      tokenHash,
      expiresAt
    );

    setSessionCookie(res, token);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("POST /api/auth/login:", error);

    return res.status(500).json({
      success: false,
      error: "Erreur lors de la connexion."
    });
  }
});


/* =========================
   ME
   ========================= */

app.get("/api/auth/me", (req, res) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        authenticated: false
      });
    }

    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error("GET /api/auth/me:", error);

    return res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification de session."
    });
  }
});


/* =========================
   LOGOUT
   ========================= */

app.post("/api/auth/logout", (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies.fcs_session;

    if (token) {
      authDb.prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
      `).run(hashSessionToken(token));
    }

    clearSessionCookie(res);

    return res.json({
      success: true
    });

  } catch (error) {
    console.error("POST /api/auth/logout:", error);

    clearSessionCookie(res);

    return res.status(500).json({
      success: false,
      error: "Erreur lors de la déconnexion."
    });
  }
});


const upload = multer({
  dest: "server/uploads/",
  limits: {
    fileSize: 3 * 1024 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "video/mp4",
      "video/quicktime",
      "video/webm",
      "video/x-m4v",
      "video/m4v",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/x-wav",
      "audio/x-m4a",
      "audio/m4a",
      "audio/aac",
      "audio/ogg",
      "audio/webm"
    ];

    const extension = String(file.originalname || "")
      .toLowerCase()
      .split(".")
      .pop();

    const allowedExtensions = [
      "mp4",
      "mov",
      "webm",
      "m4v",
      "mp3",
      "wav",
      "m4a",
      "aac",
      "ogg"
    ];

    if (
      allowed.includes(file.mimetype) ||
      allowedExtensions.includes(extension)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Format vidéo ou audio non accepté."));
    }
  }
});


const documentUpload = multer({
  dest: "server/uploads/documents/",
  fileFilter: (req, file, cb) => {
    const extension = String(file.originalname || "")
      .toLowerCase()
      .split(".")
      .pop();

    const allowedExtensions = [
      "pdf",
      "ppt",
      "pptx",
      "doc",
      "docx",
      "xls",
      "xlsx"
    ];

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(
        "Format de document non accepté. Utilise PDF, PowerPoint, Word ou Excel."
      ));
    }
  }
});

app.post(
  "/api/admin/document-upload",
  documentUpload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Aucun document reçu."
        });
      }

      const fs = require("node:fs");
      const path = require("node:path");

      const extension = String(req.file.originalname || "")
        .toLowerCase()
        .split(".")
        .pop();

      const documentsDir = path.resolve("server/uploads/documents");

      fs.mkdirSync(documentsDir, {
        recursive: true
      });

      const safeBaseName = String(req.file.originalname || "document")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "document";

      const finalName =
        `${Date.now()}-${safeBaseName}-${req.file.filename}.${extension}`;

      const finalPath = path.join(
        documentsDir,
        finalName
      );

      fs.renameSync(
        req.file.path,
        finalPath
      );

      const url =
        `/uploads/documents/${encodeURIComponent(finalName)}`;

      console.log("");
      console.log("===== FCS DOCUMENT =====");
      console.log("Fichier :", req.file.originalname);
      console.log("Taille :", (req.file.size / 1024 / 1024).toFixed(2), "MB");
      console.log("URL :", url);

      return res.json({
        success: true,
        url,
        filename: finalName,
        originalname: req.file.originalname,
        size: req.file.size
      });

    } catch (error) {
      console.error("Erreur upload document :", error);

      return res.status(500).json({
        success: false,
        error: "Impossible d'enregistrer le document."
      });
    }
  }
);

app.post("/api/admin/video-upload", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucun fichier vidéo reçu."
      });
    }

    const fs = require("node:fs");
    const path = require("node:path");

    const extension = String(req.file.originalname || "")
      .toLowerCase()
      .split(".")
      .pop();

    if (extension !== "mp4") {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        error: "Seuls les fichiers MP4 sont acceptés pour les vidéos de formation."
      });
    }

    const videosDir = path.resolve("server/uploads/videos");

    fs.mkdirSync(videosDir, {
      recursive: true
    });

    const safeBaseName = String(req.file.originalname || "video")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "video";

    const finalName =
      `${Date.now()}-${safeBaseName}-${req.file.filename}.mp4`;

    const finalPath = path.join(
      videosDir,
      finalName
    );

    fs.renameSync(
      req.file.path,
      finalPath
    );

    const url = `/uploads/videos/${encodeURIComponent(finalName)}`;

    console.log("");
    console.log("===== FCS VIDEO FORMATION =====");
    console.log("Fichier :", req.file.originalname);
    console.log("Taille :", (req.file.size / 1024 / 1024).toFixed(2), "MB");
    console.log("URL :", url);

    return res.json({
      success: true,
      url,
      filename: finalName,
      originalname: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error("Erreur upload vidéo formation :", error);

    return res.status(500).json({
      success: false,
      error: "Impossible d'enregistrer la vidéo."
    });
  }
});

app.post("/api/transcribe", upload.single("video"), async (req, res) => {
  let audioPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "Aucun fichier vidéo reçu."
      });
    }

    const fs = require("node:fs");
    const path = require("node:path");

    audioPath = path.join(
      "server/uploads",
      `${req.file.filename}.wav`
    );

    console.log("");
    console.log("===== FCS WHISPER LOCAL =====");
    console.log("Vidéo :", req.file.originalname);
    console.log("Taille :", (req.file.size / 1024 / 1024).toFixed(2), "MB");
    console.log("Conversion audio...");

    await execFileAsync("/opt/homebrew/bin/ffmpeg", [
      "-y",
      "-hide_banner",
      "-loglevel", "error",
      "-i", req.file.path,
      "-ac", "1",
      "-ar", "16000",
      "-c:a", "pcm_s16le",
      audioPath
    ]);

    console.log("Audio converti.");
    console.log("Transcription Whisper locale...");

    const modelPath = path.join(
      process.env.HOME || "",
      "whisper-models",
      "ggml-large-v3-turbo-q5_0.bin"
    );

    const outputBase = audioPath.replace(/\.wav$/i, "");

    await execFileAsync(
      "/opt/homebrew/bin/whisper-cli",
      [
        "-m", modelPath,
        "-f", audioPath,
        "-l", "fr",
        "-otxt",
        "-of", outputBase,
        "-t", "8"
      ],
      {
        maxBuffer: 50 * 1024 * 1024
      }
    );

    const txtPath = `${outputBase}.txt`;

    let transcription = "";

    if (fs.existsSync(txtPath)) {
      transcription = fs.readFileSync(txtPath, "utf8").trim();
    }

    console.log("Transcription terminée.");

    return res.json({
      ok: true,
      stage: "transcription",
      provider: "whisper-local",
      transcription
    });

  } catch (error) {
    console.error("ERREUR WHISPER LOCAL :", error);

    return res.status(500).json({
      ok: false,
      stage: "transcription",
      error: error.message || "Erreur pendant la transcription locale."
    });

  } finally {
    try {
      if (req.file?.path) {
        require("node:fs").unlinkSync(req.file.path);
      }
    } catch {}

    try {
      if (audioPath) {
        require("node:fs").unlinkSync(audioPath);
      }
    } catch {}

    try {
      const txtPath = audioPath
        ? audioPath.replace(/\.wav$/i, "") + ".txt"
        : "";

      if (txtPath && require("node:fs").existsSync(txtPath)) {
        require("node:fs").unlinkSync(txtPath);
      }
    } catch {}
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Football Coach System API",
    transcription: Boolean(process.env.OPENAI_API_KEY),
    quizGeneration: Boolean(process.env.OPENAI_API_KEY)
  });
});


/* =========================================================
   ESPACE APPRENANT — FORMATION AUTORISÉE
   ========================================================= */

app.get("/api/student/formation", (req, res) => {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentification requise."
      });
    }

    const enrollment = authDb.prepare(`
      SELECT
        e.id,
        e.user_id,
        e.formation_id,
        e.status,
        e.stripe_customer_id,
        e.stripe_checkout_session_id,
        e.stripe_subscription_id
      FROM enrollments e
      WHERE e.user_id = ?
        AND e.status = 'active'
      ORDER BY e.id
      LIMIT 1
    `).get(user.id);

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: "Aucune formation active associée à ce compte."
      });
    }

    const formation = authDb.prepare(`
      SELECT
        id,
        title,
        description,
        image,
        published
      FROM formations
      WHERE id = ?
        AND published = 1
    `).get(enrollment.formation_id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: "Formation introuvable."
      });
    }

    const modules = authDb.prepare(`
      SELECT
        id,
        formation_id,
        module_key,
        number,
        title,
        description,
        image,
        position,
        published
      FROM modules
      WHERE formation_id = ?
        AND published = 1
      ORDER BY position, id
    `).all(formation.id);

    const getLessons = authDb.prepare(`
      SELECT
        id,
        module_id,
        lesson_key,
        title,
        description,
        position,
        published
      FROM lessons
      WHERE module_id = ?
        AND published = 1
      ORDER BY position, id
    `);

    const getVideos = authDb.prepare(`
      SELECT
        id,
        lesson_id,
        title,
        url,
        position,
        published
      FROM videos
      WHERE lesson_id = ?
        AND published = 1
      ORDER BY position, id
    `);

    const safeModules = modules.map(module => {
      const lessons = getLessons.all(module.id).map(lesson => ({
        ...lesson,
        videos: getVideos.all(lesson.id)
      }));

      return {
        ...module,
        lessons
      };
    });

    return res.json({
      success: true,

      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },

      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        formation_id: enrollment.formation_id
      },

      formation: {
        ...formation,
        modules: safeModules
      }
    });

  } catch (error) {
    console.error(
      "GET /api/student/formation:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Impossible de charger la formation."
    });
  }
});

const { registerContentRoutes } = require("./contentDb.cjs");

registerContentRoutes(app);

const server = http.createServer(app);

server.listen(3001, "127.0.0.1", () => {
  console.log("");
  console.log("======================================");
  console.log(" FOOTBALL COACH SYSTEM — API");
  console.log("======================================");
  console.log("Serveur : http://localhost:3001");
  console.log("Health  : http://localhost:3001/api/health");
  console.log("======================================");
  console.log("");
});

server.on("error", (error) => {
  console.error("ERREUR SERVEUR FCS :", error);
});

server.ref();

