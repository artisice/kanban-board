<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\AuthMiddleware;
use PDO;

class ColumnController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    private function checkBoardAccess(int $boardId): int
    {
        $userId = AuthMiddleware::check();

        $stmt = $this->db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND board_id = ?");
        $stmt->execute([$userId, $boardId]);
        $role = $stmt->fetchColumn();

        if (!$role) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied to this board']);
            exit;
        }

        return $userId;
    }

    public function create($boardId)
    {
        $this->checkBoardAccess($boardId);
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            return;
        }

        $stmtPos = $this->db->prepare("SELECT COALESCE(MAX(position), 0) + 1 FROM columns WHERE board_id = ?");
        $stmtPos->execute([$boardId]);
        $nextPosition = $stmtPos->fetchColumn();

        $stmt = $this->db->prepare("INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?) RETURNING id");
        $stmt->execute([$boardId, $data['title'], $nextPosition]);
        $columnId = $stmt->fetchColumn();

        http_response_code(201);
        echo json_encode(['id' => $columnId, 'position' => $nextPosition, 'message' => 'Column created']);
    }

    public function update($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['version']) || !isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and version are required']);
            return;
        }

        $stmt = $this->db->prepare("
            UPDATE columns SET title = ?, version = version + 1 
            WHERE id = ? AND version = ?
        ");
        $stmt->execute([$data['title'], $id, $data['version']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Conflict: Column was modified or not found']);
            return;
        }

        echo json_encode(['message' => 'Column updated']);
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM columns WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Column not found']);
            return;
        }

        echo json_encode(['message' => 'Column deleted']);
    }
}