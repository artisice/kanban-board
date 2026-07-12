-- 002_seed_data.sql

BEGIN;

-- 1. Создаем пользователя (пароль должен хэшироваться на бэкенде, здесь заглушка)
INSERT INTO users (id, login, password_hash)
VALUES (1, 'test_user', 'hashed_qwerty123')
ON CONFLICT (login) DO NOTHING;

-- 2. Создаем доску
INSERT INTO boards (id, title, description, owner_id)
VALUES (1, 'Разработка Kanban-доски', 'Основная доска проекта', 1);

-- 3. Раздаем права (Пользователь 1 — владелец Доски 1)
INSERT INTO user_roles (user_id, board_id, role)
VALUES (1, 1, 'owner');

-- 4. Создаем 2 колонки
INSERT INTO columns (id, board_id, title, position) VALUES
(1, 1, 'В работе', 1),
(2, 1, 'Готово', 2);

-- 5. Создаем 3 карточки
INSERT INTO cards (id, column_id, title, description, position, assignee_id) VALUES
(1, 1, 'Спроектировать БД', 'Написать SQL скрипты миграций и сидов', 1, 1),
(2, 1, 'Настроить PHP бэкенд', 'Развернуть проект и подключить базу', 2, 1),
(3, 2, 'Создать React приложение', 'Сделать npm create vite', 1, 1);

-- Синхронизируем последовательности (секвенсоры) после ручной вставки ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('boards_id_seq', (SELECT MAX(id) FROM boards));
SELECT setval('columns_id_seq', (SELECT MAX(id) FROM columns));
SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards));

COMMIT;