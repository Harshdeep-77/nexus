import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "nexus.db");
const migrationsDir = path.join(process.cwd(), "src/lib/backend/migrations");

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

// 1. table that remembers which migrations already ran
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 2. names already applied
const applied = new Set(
  db.prepare("SELECT name FROM schema_migrations").all().map((r: any) => r.name),
);

// 3. every .sql file, in filename order
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let ran = 0;

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

  // 4. each migration is all-or-nothing
  const runOne = db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
  });
  runOne();

  console.log(`✔ applied ${file}`);
  ran++;
}

console.log(ran === 0 ? "Nothing to migrate — database is up to date." : `Done. ${ran} migration(s) applied.`);
db.close();