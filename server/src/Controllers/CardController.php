<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\AuthMiddleware;
use PDO;

class CardController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create($columnId)
    {
        $userId = AuthMiddleware::check();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            return;
        }

        $stmtPos = $this->db->prepare("SELECT COALESCE(MAX(position), 0) + 1 FROM cards WHERE column_id = ?");
        $stmtPos->execute([$columnId]);
        $nextPosition = $stmtPos->fetchColumn();

        $stmt = $this->db->prepare("
            INSERT INTO cards (column_id, title, description, position, assignee_id, deadline) 
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
        ");
        $stmt->execute([
            $columnId,
            $data['title'],
            $data['description'] ?? null,
            $nextPosition,
            $data['assignee_id'] ?? null,
            $data['deadline'] ?? null
        ]);
        $cardId = $stmt->fetchColumn();

        http_response_code(201);
        echo json_encode(['id' => $cardId, 'position' => $nextPosition, 'message' => 'Card created']);
    }

    public function update($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['version'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Version is required']);
            return;
        }

        $stmt = $this->db->prepare("
            UPDATE cards 
            SET 
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                column_id = COALESCE(?, column_id),
                position = COALESCE(?, position),
                assignee_id = COALESCE(?, assignee_id),
                deadline = COALESCE(?, deadline),
                version = version + 1
            WHERE id = ? AND version = ?
        ");

        $stmt->execute([
            $data['title'] ?? null,
            $data['description'] ?? null,
            $data['column_id'] ?? null,
            $data['position'] ?? null,
            $data['assignee_id'] ?? null,
            $data['deadline'] ?? null,
            $id,
            $data['version']
        ]);

        if ($stmt->rowCount() === 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Conflict: Card was modified or not found']);
            return;
        }

        echo json_encode(['message' => 'Card updated']);
    }

    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM cards WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Card not found']);
            return;
        }

        echo json_encode(['message' => 'Card deleted']);
    }
}