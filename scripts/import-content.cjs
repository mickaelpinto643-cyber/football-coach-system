#!/usr/bin/env node
/**
 * Import pedagogical content from a JSON export into the Bolt FCS SQLite database.
 *
 * Usage:
 *   node scripts/import-content.cjs                          # reads content-export.json
 *   node scripts/import-content.cjs --file my-export.json
 *   node scripts/import-content.cjs --db  data/fcs.db
 *
 * Behaviour:
 *   - Preserves original IDs to keep parent/child relationships intact.
 *   - Runs inside a single transaction: if any row fails, nothing is written.
 *   - Wipes existing content tables before inserting (idempotent re-import).
 *   - Does NOT touch users, sessions, or enrollments.
 */

const fs = require("fs");
const path = require("path");

let Database;
try {
  Database = require("better-sqlite3");
} catch {
  console.error("better-sqlite3 is not installed.");
  console.error("Run: npm install better-sqlite3");
  process.exit(1);
}

function parseArgs() {
  const args = { db: "", file: "" };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "--db" && raw[i + 1]) { args.db = raw[++i]; }
    else if (raw[i] === "--file" && raw[i + 1]) { args.file = raw[++i]; }
  }
  if (!args.db) {
    args.db = path.resolve(process.cwd(), "data/fcs.db");
  }
  if (!args.file) {
    args.file = path.resolve(process.cwd(), "content-export.json");
  }
  return args;
}

const COLUMNS = {
  formations: [
    "id", "title", "description", "image", "published",
    "created_at", "updated_at",
  ],
  modules: [
    "id", "formation_id", "module_key", "number", "title",
    "description", "image", "position", "published",
  ],
  lessons: [
    "id", "module_id", "lesson_key", "title", "description",
    "position", "published",
  ],
  videos: [
    "id", "lesson_id", "title", "url", "position",
    "published", "duration",
  ],
  resources: [
    "id", "lesson_id", "type", "title", "url", "content",
    "position", "published",
  ],
  quizzes: [
    "id", "lesson_id", "title", "published",
  ],
  quiz_questions: [
    "id", "quiz_id", "question", "options_json", "correct_answer",
    "position",
  ],
};

const TABLE_ORDER = [
  "formations",
  "modules",
  "lessons",
  "videos",
  "resources",
  "quizzes",
  "quiz_questions",
];

function ensureTablesExist(db) {
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
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
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
  `);
}

function coerceValue(col, value) {
  if (value === null || value === undefined) return null;

  switch (col) {
    case "published":
      return value ? 1 : 0;

    case "position":
    case "duration":
    case "id":
    case "formation_id":
    case "module_id":
    case "lesson_id":
    case "quiz_id":
      return Number(value) || 0;

    default:
      return String(value);
  }
}

function buildInsert(table) {
  const cols = COLUMNS[table];
  const placeholders = cols.map(() => "?").join(", ");
  return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
}

function importTable(db, table, rows) {
  const cols = COLUMNS[table];
  const stmt = db.prepare(buildInsert(table));
  let count = 0;

  for (const row of rows) {
    const values = cols.map(col => coerceValue(col, row[col]));
    stmt.run(...values);
    count++;
  }

  console.log(`  ${table}: ${count} row(s) imported`);
}

function main() {
  const { db: dbPath, file: filePath } = parseArgs();

  if (!fs.existsSync(filePath)) {
    console.error(`Export file not found: ${filePath}`);
    console.error("Specify the path with --file <path>");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  console.log(`Target database : ${dbPath}`);
  console.log(`Import file      : ${filePath}`);
  console.log("");

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error("Failed to parse JSON:", err.message);
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF");

  ensureTablesExist(db);

  const run = db.transaction(() => {
    for (const table of TABLE_ORDER) {
      db.exec(`DELETE FROM ${table};`);
    }

    for (const table of TABLE_ORDER) {
      const rows = data[table] || [];
      importTable(db, table, rows);
    }

    const maxId = {};
    for (const table of TABLE_ORDER) {
      const row = db.prepare(`SELECT MAX(id) AS max_id FROM ${table}`).get();
      maxId[table] = row.max_id || 0;
    }

    for (const table of TABLE_ORDER) {
      const nextId = (maxId[table] || 0) + 1;
      db.exec(`UPDATE sqlite_sequence SET seq = ${nextId} WHERE name = '${table}';`);
    }
  });

  try {
    run();
    db.pragma("foreign_keys = ON");
    console.log("");
    console.log("Import successful.");
  } catch (err) {
    console.error("");
    console.error("Import FAILED:", err.message);
    console.error("Transaction rolled back — no changes were saved.");
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
