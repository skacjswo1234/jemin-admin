-- 인증 강화 마이그레이션 (기존 DB에 1회 실행)
-- wrangler d1 execute jemin-db --remote --file=./schema_auth.sql

-- 계정 비활성화 컬럼 (0: 활성, 1: 비활성)
ALTER TABLE admins ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0;

-- 서버 세션 테이블 (로그아웃·비활성화 시 즉시 무효화)
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_username ON auth_sessions(username);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expiresAt);
