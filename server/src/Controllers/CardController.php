<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Services\AuditService;
use PDO;

class CardController
{
    private PDO $db;
    private AuditService $audit;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->audit = new AuditService();
    }

    private function checkCardEditAccess(int $cardId): void
    {
        $userId = AuthMiddleware::check();
        $stmt = $this->db->prepare("
            SELECT ur.role FROM user_roles ur
            JOIN columns c ON c.board_id = ur.board_id
            JOIN cards card ON card.column_id = c.id
            WHERE card.id = ? AND ur.user_id = ?
        ");
        $stmt->execute([$cardId, $userId]);
        $role = $stmt->fetchColumn();

        if (!$role) Response::error('Access denied', 403);
        if ($role === 'viewer') Response::error('Viewers cannot edit cards', 403);
    }

    public function create($columnId)
    {
        $userId = AuthMiddleware::check();
        $data = Request::getBody();

        if (!isset($data['title'])) Response::error('Title is required', 400);

        $stmtPos = $this->db->prepare("SELECT COALESCE(MAX(position), 0) + 1 FROM cards WHERE column_id = ?");
        $stmtPos->execute([$columnId]);
        $nextPosition = $stmtPos->fetchColumn();

        $stmt = $this->db->prepare("
            INSERT INTO cards (column_id, title, description, position, assignee_id, deadline) 
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
        ");
        $stmt->execute([
            $columnId, $data['title'], $data['description'] ?? null,
            $nextPosition, $data['assignee_id'] ?? null, $data['deadline'] ?? null
        ]);
        $cardId = $stmt->fetchColumn();

        $boardStmt = $this->db->prepare("SELECT board_id FROM columns WHERE id = ?");
        $boardStmt->execute([$columnId]);
        $boardId = $boardStmt->fetchColumn();
        $this->audit->log($boardId, 'card_created', $cardId, $data['title'], ['column_id' => $columnId]);

        Response::json(['id' => $cardId, 'position' => $nextPosition, 'message' => 'Card created'], 201);
    }

    public function update($id)
    {
        $this->checkCardEditAccess($id);
        $data = Request::getBody();

        if (!isset($data['version'])) Response::error('Version is required', 400);

        $oldStmt = $this->db->prepare("
            SELECT c.title, c.description, c.column_id, c.position, col.board_id 
            FROM cards c JOIN columns col ON c.column_id = col.id 
            WHERE c.id = ?
        ");
        $oldStmt->execute([$id]);
        $oldCard = $oldStmt->fetch();

        if (!$oldCard) Response::error('Card not found', 404);

        $fields = [];
        $params = [];

        if (isset($data['title'])) { $fields[] = 'title = ?'; $params[] = $data['title']; }
        if (array_key_exists('description', $data)) { $fields[] = 'description = ?'; $params[] = $data['description']; }
        if (isset($data['column_id'])) { $fields[] = 'column_id = ?'; $params[] = $data['column_id']; }
        if (isset($data['position'])) { $fields[] = 'position = ?'; $params[] = $data['position']; }
        if (array_key_exists('deadline', $data)) { $fields[] = 'deadline = ?'; $params[] = $data['deadline'] ?: null; }

        if (!empty($fields)) {
            $fields[] = 'version = version + 1';
            $params[] = $id;
            $params[] = $data['version'];

            $stmt = $this->db->prepare("UPDATE cards SET " . implode(', ', $fields) . " WHERE id = ? AND version = ?");
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) Response::error('Conflict: Card was modified by another user', 409);
        }

        $assigneeChanges = ['added' => [], 'removed' => []];
        if (isset($data['assignees']) && is_array($data['assignees'])) {
            $oldAssigneesStmt = $this->db->prepare("SELECT user_id FROM card_assignees WHERE card_id = ?");
            $oldAssigneesStmt->execute([$id]);
            $oldAssigneeIds = $oldAssigneesStmt->fetchAll(PDO::FETCH_COLUMN);
            
            $newAssigneeIds = array_map('intval', $data['assignees']);

            $assigneeChanges['added'] = array_values(array_diff($newAssigneeIds, $oldAssigneeIds));
            $assigneeChanges['removed'] = array_values(array_diff($oldAssigneeIds, $newAssigneeIds));

            $this->db->prepare("DELETE FROM card_assignees WHERE card_id = ?")->execute([$id]);
            $stmtAssignee = $this->db->prepare("INSERT INTO card_assignees (card_id, user_id) VALUES (?, ?)");
            foreach ($newAssigneeIds as $userId) {
                if (!empty($userId)) $stmtAssignee->execute([$id, $userId]);
            }
        }

        $this->audit->logCardUpdate($id, $oldCard, $data, $assigneeChanges);

        $stmtBoard = $this->db->prepare("
            SELECT c.*, col.board_id 
            FROM cards c JOIN columns col ON c.column_id = col.id 
            WHERE c.id = ?
        ");
        $stmtBoard->execute([$id]);
        $updatedCard = $stmtBoard->fetch();

        $assigneesStmt = $this->db->prepare("SELECT u.id, u.login, u.avatar_url FROM card_assignees ca JOIN users u ON ca.user_id = u.id WHERE ca.card_id = ?");
        $assigneesStmt->execute([$id]);
        $updatedCard['assignees'] = $assigneesStmt->fetchAll();

        $payload = json_encode([
            'boardId' => $updatedCard['board_id'],
            'event' => 'card_updated',
            'payload' => $updatedCard
        ]);
        
        file_get_contents("http://localhost:3001/broadcast", false, stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $payload
            ]
        ]));

        Response::json(['message' => 'Card updated']);
    }

    public function delete($id)
    {
        $this->checkCardEditAccess($id);
        
        $infoStmt = $this->db->prepare("
            SELECT c.title, col.board_id 
            FROM cards c JOIN columns col ON c.column_id = col.id 
            WHERE c.id = ?
        ");
        $infoStmt->execute([$id]);
        $cardInfo = $infoStmt->fetch();

        $stmt = $this->db->prepare("DELETE FROM cards WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) Response::error('Card not found', 404);

        if ($cardInfo) {
            $this->audit->log($cardInfo['board_id'], 'card_deleted', $id, $cardInfo['title'], []);
        }

        Response::json(['message' => 'Card deleted']);
    }
}