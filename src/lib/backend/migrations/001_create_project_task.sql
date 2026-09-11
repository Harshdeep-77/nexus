CREATE TABLE IF NOT EXISTS project_task (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL,
  title        TEXT    NOT NULL,
  description  TEXT,
  status       TEXT    NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in-progress', 'completed')),
  priority     TEXT    NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to  INTEGER,
  created_by   INTEGER NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  isActive     BOOLEAN  DEFAULT TRUE,
    
  FOREIGN KEY (project_id)  REFERENCES project(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id)   ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)   ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_task_project_id
  ON project_task(project_id);