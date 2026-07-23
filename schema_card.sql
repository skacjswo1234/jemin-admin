-- 모바일 명함 전용 신규 테이블만 생성
-- 기존 admins / properties / auth_sessions 테이블은 절대 변경하지 않음

CREATE TABLE IF NOT EXISTS card_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT,
  area TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  deal_type TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  contract_month TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  del_yn TEXT NOT NULL DEFAULT 'N',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS card_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT,
  price TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  del_yn TEXT NOT NULL DEFAULT 'N',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_card_contracts_del ON card_contracts(del_yn, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_card_recommendations_del ON card_recommendations(del_yn, sort_order, id);
