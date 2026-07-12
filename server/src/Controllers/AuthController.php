<?php

namespace App\Controllers;

use App\Core\Database;
use Firebase\JWT\JWT;
use PDO;

class AuthController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function register()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['login']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Login and password are required']);
            return;
        }

        $login = $data['login'];
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("INSERT INTO users (login, password_hash) VALUES (?, ?)");
            $stmt->execute([$login, $passwordHash]);
            
            http_response_code(201);
            echo json_encode(['message' => 'User registered successfully']);
        } catch (\PDOException $e) {
            if ($e->getCode() == 23505) { // Код ошибки уникальности в Postgres
                http_response_code(409);
                echo json_encode(['error' => 'Login already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Database error']);
            }
        }
    }

    public function login()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['login']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Login and password are required']);
            return;
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE login = ?");
        $stmt->execute([$data['login']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            return;
        }

        $secretKey = getenv('JWT_SECRET') ?: 'default_secret';
        $payload = [
            'iss' => 'kanban_api',
            'sub' => $user['id'],
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24)
        ];

        $jwt = JWT::encode($payload, $secretKey, 'HS256');

        echo json_encode(['token' => $jwt]);
    }
}