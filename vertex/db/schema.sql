CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  shares REAL NOT NULL,
  avg_cost REAL NOT NULL,
  broker TEXT DEFAULT 'Default',
  color TEXT DEFAULT '#6c5ce7',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  added_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brokers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6c5ce7'
);

INSERT OR IGNORE INTO brokers (name, color) VALUES
  ('Robinhood', '#00d68f'),
  ('Fidelity', '#4285f4'),
  ('Charles Schwab', '#4ecdc4'),
  ('TD Ameritrade', '#00b377'),
  ('E*TRADE', '#6c5ce7'),
  ('Vanguard', '#cc0000'),
  ('Interactive Brokers', '#ff9900'),
  ('Default', '#6c5ce7');

CREATE TABLE IF NOT EXISTS ai_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  tool_calls TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
