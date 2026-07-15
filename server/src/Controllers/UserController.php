<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class UserController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function me()
    {
        $userId = AuthMiddleware::check();
        $stmt = $this->db->prepare("SELECT id, login, avatar_url FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        Response::json($stmt->fetch());
    }

    public function updateMe()
    {
        $userId = AuthMiddleware::check();
        $data = Request::getBody();

        if (isset($data['avatar_url'])) {
            $stmt = $this->db->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
            $stmt->execute([$data['avatar_url'], $userId]);
        }

        Response::json(['message' => 'Profile updated']);
    }
}