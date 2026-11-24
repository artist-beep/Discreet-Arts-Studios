import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
export function openDatabase(path) {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;");
  db.exec(
    readFileSync(
      new URL("../migrations/0001_studio.sql", import.meta.url),
      "utf8",
    ),
  );
  return {
    first: (sql, ...args) => db.prepare(sql).get(...args),
    all: (sql, ...args) => db.prepare(sql).all(...args),
    run: (sql, ...args) => ({
      changes: Number(db.prepare(sql).run(...args).changes),
    }),
    close: () => db.close(),
  };
}
