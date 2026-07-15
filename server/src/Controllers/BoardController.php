<?php

namespace App\Controllers;

use App\Core\Database;
use App\Middleware\AuthMiddleware;
use App\Core\Request;
use App\Core\Response;
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

        $assigneesStmt = $this->db->prepare("
            SELECT ca.card_id, u.id, u.login, u.avatar_url 
            FROM card_assignees ca 
            JOIN users u ON ca.user_id = u.id 
            WHERE ca.card_id IN (SELECT id FROM cards WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?))
        ");
        $assigneesStmt->execute([$id]);
        $allAssignees = $assigneesStmt->fetchAll();

        foreach ($cards as &$card) {
            $card['assignees'] = array_values(array_filter($allAssignees, fn($a) => $a['card_id'] == $card['id']));
        }

        foreach ($columns as &$col) {
            $col['cards'] = array_values(array_filter($cards, fn($c) => $c['column_id'] == $col['id']));
        }

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
            http_response_code(409);
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

    public function invite($id)
    {
        $userId = AuthMiddleware::check();
        $data = Request::getBody();

        if (!isset($data['login']) || !isset($data['role'])) {
            Response::error('Login and role are required', 400);
        }

        $ownerCheck = $this->db->prepare("SELECT 1 FROM boards WHERE id = ? AND owner_id = ?");
        $ownerCheck->execute([$id, $userId]);
        if (!$ownerCheck->fetch()) {
            Response::error('Only owner can invite users', 403);
        }

        $userStmt = $this->db->prepare("SELECT id FROM users WHERE login = ?");
        $userStmt->execute([$data['login']]);
        $invitedUser = $userStmt->fetch();

        if (!$invitedUser) {
            Response::error('User not found', 404);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_roles (user_id, board_id, role) 
                VALUES (?, ?, ?) 
                ON CONFLICT (user_id, board_id) DO UPDATE SET role = EXCLUDED.role
            ");
            $stmt->execute([$invitedUser['id'], $id, $data['role']]);

            Response::json(['message' => 'User invited successfully']);
        } catch (\PDOException $e) {
            Response::error('Database error', 500);
        }
    }

    public function members($id)
    {
        $userId = AuthMiddleware::check();
        $accessStmt = $this->db->prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND board_id = ?");
        $accessStmt->execute([$userId, $id]);
        if (!$accessStmt->fetch()) Response::error('Access denied', 403);

        $stmt = $this->db->prepare("
            SELECT u.id, u.login, u.avatar_url, ur.role 
            FROM users u 
            JOIN user_roles ur ON u.id = ur.user_id 
            WHERE ur.board_id = ?
        ");
        $stmt->execute([$id]);
        Response::json($stmt->fetchAll());
    }

    public function generateInviteLink($id)
    {
        $userId = AuthMiddleware::check();
        $ownerCheck = $this->db->prepare("SELECT 1 FROM boards WHERE id = ? AND owner_id = ?");
        $ownerCheck->execute([$id, $userId]);
        if (!$ownerCheck->fetch()) Response::error('Only owner can invite', 403);

        $data = Request::getBody();
        $role = $data['role'] ?? 'viewer';

        $token = bin2hex(random_bytes(16));
        $stmt = $this->db->prepare("INSERT INTO invitations (token, board_id, role) VALUES (?, ?, ?)");
        $stmt->execute([$token, $id, $role]);

        Response::json(['link' => "http://localhost:5173/invite/$token"]);
    }

    public function acceptInvitation()
    {
        $userId = AuthMiddleware::check();
        $data = Request::getBody();
        $token = $data['token'] ?? '';

        $stmt = $this->db->prepare("SELECT * FROM invitations WHERE token = ?");
        $stmt->execute([$token]);
        $invite = $stmt->fetch();

        if (!$invite) Response::error('Invalid or expired token', 404);

        $insertStmt = $this->db->prepare("
            INSERT INTO user_roles (user_id, board_id, role) 
            VALUES (?, ?, ?) 
            ON CONFLICT (user_id, board_id) DO UPDATE SET role = EXCLUDED.role
        ");
        $insertStmt->execute([$userId, $invite['board_id'], $invite['role']]);

        $deleteStmt = $this->db->prepare("DELETE FROM invitations WHERE token = ?");
        $deleteStmt->execute([$token]);

        Response::json(['message' => 'Invitation accepted', 'board_id' => $invite['board_id']]);
    }

    public function updateMemberRole($id)
    {
        $userId = AuthMiddleware::check();
        $data = Request::getBody();
        
        $ownerCheck = $this->db->prepare("SELECT 1 FROM boards WHERE id = ? AND owner_id = ?");
        $ownerCheck->execute([$id, $userId]);
        if (!$ownerCheck->fetch()) Response::error('Only owner can change roles', 403);

        $stmt = $this->db->prepare("UPDATE user_roles SET role = ? WHERE board_id = ? AND user_id = ?");
        $stmt->execute([$data['role'], $id, $data['user_id']]);

        Response::json(['message' => 'Role updated']);
    }

    public function logs($id)
    {
        $userId = AuthMiddleware::check();
        
        $accessStmt = $this->db->prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND board_id = ?");
        $accessStmt->execute([$userId, $id]);
        if (!$accessStmt->fetch()) Response::error('Access denied', 403);

        $stmt = $this->db->prepare("
            SELECT al.id, al.action, al.card_title, al.details, al.created_at, u.login, u.avatar_url 
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            WHERE al.board_id = ?
            ORDER BY al.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$id]);
        
        Response::json($stmt->fetchAll());
    }
}