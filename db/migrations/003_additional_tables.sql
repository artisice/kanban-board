ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

CREATE TABLE IF NOT EXISTS invitations (
    token VARCHAR(64) PRIMARY KEY,
    board_id BIGINT REFERENCES boards(id) ON DELETE CASCADE,
    role board_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_assignees (
    card_id BIGINT REFERENCES cards(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT REFERENCES boards(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    card_id BIGINT,
    card_title VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_board_id ON audit_logs(board_id);