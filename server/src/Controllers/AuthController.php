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

        $login = trim($data['login']);
        $password = $data['password'];

        if (!filter_var($login, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 400);
        }

        if (strlen($password) < 6 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            Response::error('Password must be at least 6 chars and contain letters and numbers', 400);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = $this->db->prepare("INSERT INTO users (login, password_hash) VALUES (?, ?)");
            $stmt->execute([$login, $passwordHash]);
            
            Response::json(['message' => 'User registered successfully'], 201);
        } catch (\PDOException $e) {
            if ($e->getCode() == 23505) {
                Response::error('User with this email already exists', 409);
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