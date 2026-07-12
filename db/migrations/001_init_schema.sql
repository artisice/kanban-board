-- 001_init_schema.sql

BEGIN;

-- Создаем ENUM для ролей пользователей на доске (RBAC)
CREATE TYPE board_role AS ENUM ('owner', 'editor', 'viewer');

-- Таблица Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица Boards
-- Включает поле version для защиты от коллизий
CREATE TABLE boards (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1 NOT NULL
);

-- Связующая таблица UserRoles для ролей (RBAC)
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    role board_role NOT NULL DEFAULT 'viewer',
    PRIMARY KEY (user_id, board_id)
);

-- Таблица Columns
-- Включает поле version для защиты от коллизий
CREATE TABLE columns (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1 NOT NULL
);

-- Таблица Cards
-- Включает поле version для защиты от коллизий
CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    column_id BIGINT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INT NOT NULL,
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1 NOT NULL
);

-- Таблица Comments
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ИНДЕКСЫ для оптимизации
-- Индекс для получения досок пользователя
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
-- Индексы для быстрой выборки и сортировки колонок и карточек по их позиции
CREATE INDEX idx_columns_board_position ON columns(board_id, position);
CREATE INDEX idx_cards_column_position ON cards(column_id, position);
-- Индекс для получения комментариев к карточке
CREATE INDEX idx_comments_card_id ON comments(card_id);

COMMIT;