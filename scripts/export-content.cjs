#!/usr/bin/env node
/**
 * Export all pedagogical content from a local FCS SQLite database
 * to a single JSON file that can be imported into Bolt.
 *
 * Usage on your Mac:
 *   node scripts/export-content.cjs
 *   node scripts/export-content.cjs --db path/to/fcs.db
 *   node scripts/export-content.cjs --out content-export.json
 *
 * Defaults:
 *   --db  : ./data/fcs.db  (or data/content.db if the first is absent)
 *   --out : ./content-export.json
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
  const args = { db: "", out: "" };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "--db" && raw[i + 1]) { args.db = raw[++i]; }
    else if (raw[i] === "--out" && raw[i + 1]) { args.out = raw[++i]; }
  }
  if (!args.db) {
    const candidates = [
      path.resolve(process.cwd(), "data/fcs.db"),
      path.resolve(process.cwd(), "data/content.db"),
      path.resolve(process.cwd(), "server/data/fcs.db"),
      path.resolve(process.cwd(), "server/data/content.db"),
    ];
    args.db = candidates.find(p => fs.existsSync(p)) || candidates[0];
  }
  if (!args.out) {
    args.out = path.resolve(process.cwd(), "content-export.json");
  }
  return args;
}

const TABLES = [
  "formations",
  "modules",
  "lessons",
  "videos",
  "resources",
  "quizzes",
  "quiz_questions",
];

function exportAll(db) {
  const result = { _meta: { exported_at: new Date().toISOString(), tables: TABLES } };

  for (const table of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id ASC`).all();
    result[table] = rows;
    console.log(`  ${table}: ${rows.length} row(s)`);
  }

  return result;
}

function main() {
  const { db: dbPath, out: outPath } = parseArgs();

  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    console.error("Specify the path with --db <path>");
    process.exit(1);
  }

  console.log(`Source database : ${dbPath}`);
  console.log(`Output file     : ${outPath}`);
  console.log("");

  const db = new Database(dbPath, { readonly: true });

  let data;
  try {
    data = exportAll(db);
  } catch (err) {
    console.error("Export failed:", err.message);
    db.close();
    process.exit(1);
  }

  db.close();

  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");

  const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log("");
  console.log(`Done: ${outPath} (${sizeKB} KB)`);
}

main();
