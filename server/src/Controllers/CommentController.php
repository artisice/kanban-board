<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\AuthMiddleware;
use PDO;

class CommentController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function index($cardId)
    {
        $userId = AuthMiddleware::check();

        $stmt = $this->db->prepare("
            SELECT c.id, c.text, c.created_at, u.login as author_login 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.card_id = ?
            ORDER BY c.created_at ASC
        ");
        $stmt->execute([$cardId]);
        
        echo json_encode($stmt->fetchAll());
    }

    public function create($cardId)
    {
        $userId = AuthMiddleware::check();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['text']) || trim($data['text']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Comment text is required']);
            return;
        }

        $stmt = $this->db->prepare("
            INSERT INTO comments (card_id, user_id, text) 
            VALUES (?, ?, ?) RETURNING id, created_at
        ");
        $stmt->execute([$cardId, $userId, $data['text']]);
        $comment = $stmt->fetch();

        http_response_code(201);
        echo json_encode([
            'id' => $comment['id'],
            'text' => $data['text'],
            'created_at' => $comment['created_at'],
            'author_login' => 'You'
        ]);
    }

    public function delete($id)
    {
        $userId = AuthMiddleware::check();

        $stmt = $this->db->prepare("DELETE FROM comments WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(403);
            echo json_encode(['error' => 'Cannot delete: comment not found or you are not the author']);
            return;
        }

        echo json_encode(['message' => 'Comment deleted']);
    }
}