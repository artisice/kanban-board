<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
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
        $data = Request::getBody();

        if (!isset($data['login']) || !isset($data['password'])) {
            Response::error('Login and password are required', 400);
        }

        $login = $data['login'];
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("INSERT INTO users (login, password_hash) VALUES (?, ?)");
            $stmt->execute([$login, $passwordHash]);
            
            Response::json(['message' => 'User registered successfully'], 201);
        } catch (\PDOException $e) {
            if ($e->getCode() == 23505) {
                Response::error('Login already exists', 409);
            }
            Response::error('Database error', 500);
        }
    }

    public function login()
    {
        $data = Request::getBody();

        if (!isset($data['login']) || !isset($data['password'])) {
            Response::error('Login and password are required', 400);
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE login = ?");
        $stmt->execute([$data['login']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            Response::error('Invalid credentials', 401);
        }

        $secretKey = $_ENV['JWT_SECRET'] ?? 'default_secret';
        $payload = [
            'iss' => 'kanban_api',
            'sub' => $user['id'],
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24)
        ];

        $jwt = JWT::encode($payload, $secretKey, 'HS256');

        Response::json(['token' => $jwt]);
    }
}