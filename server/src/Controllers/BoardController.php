<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\AuthMiddleware;
use PDO;

class BoardController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function index()
    {
        $userId = AuthMiddleware::check();

        $stmt = $this->db->prepare("
            SELECT b.id, b.title, b.description, b.created_at, ur.role 
            FROM boards b
            JOIN user_roles ur ON b.id = ur.board_id
            WHERE ur.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId]);
        echo json_encode($stmt->fetchAll());
    }

    public function create()
    {
        $userId = AuthMiddleware::check();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            return;
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("INSERT INTO boards (title, description, owner_id) VALUES (?, ?, ?) RETURNING id");
            $stmt->execute([$data['title'], $data['description'] ?? null, $userId]);
            $boardId = $stmt->fetchColumn();

            $roleStmt = $this->db->prepare("INSERT INTO user_roles (user_id, board_id, role) VALUES (?, ?, 'owner')");
            $roleStmt->execute([$userId, $boardId]);

            $this->db->commit();

            http_response_code(201);
            echo json_encode(['id' => $boardId, 'message' => 'Board created']);
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create board']);
        }
    }

    public function show($id)
    {
        $userId = AuthMiddleware::check();

        $accessStmt = $this->db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND board_id = ?");
        $accessStmt->execute([$userId, $id]);
        $role = $accessStmt->fetchColumn();

        if (!$role) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }

        $boardStmt = $this->db->prepare("SELECT * FROM boards WHERE id = ?");
        $boardStmt->execute([$id]);
        $board = $boardStmt->fetch();

        $colsStmt = $this->db->prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC");
        $colsStmt->execute([$id]);
        $columns = $colsStmt->fetchAll();

        $cardsStmt = $this->db->prepare("
            SELECT * FROM cards 
            WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?) 
            ORDER BY position ASC
        ");
        $cardsStmt->execute([$id]);
        $cards = $cardsStmt->fetchAll();

        foreach ($columns as &$col) {
            $col['cards'] = array_values(array_filter($cards, fn($c) => $c['column_id'] == $col['id']));
        }

        $board['columns'] = $columns;

        echo json_encode($board);
    }

    public function update($id)
    {
        $userId = AuthMiddleware::check();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['version'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Version is required for update']);
            return;
        }

        $stmt = $this->db->prepare("
            UPDATE boards 
            SET title = ?, description = ?, version = version + 1 
            WHERE id = ? AND version = ?
        ");
        $stmt->execute([
            $data['title'], 
            $data['description'] ?? null, 
            $id, 
            $data['version']
        ]);

        if ($stmt->rowCount() === 0) {
            http_response_code(409); // Conflict
            echo json_encode(['error' => 'Conflict: Board was modified by another user or not found']);
            return;
        }

        echo json_encode(['message' => 'Board updated']);
    }

    public function delete($id)
    {
        $userId = AuthMiddleware::check();

        $stmt = $this->db->prepare("
            DELETE FROM boards 
            WHERE id = ? AND owner_id = ?
        ");
        $stmt->execute([$id, $userId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Failed to delete: you are not the owner or board does not exist']);
            return;
        }

        echo json_encode(['message' => 'Board deleted']);
    }
}