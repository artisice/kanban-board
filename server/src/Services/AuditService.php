<?php

namespace App\Services;

use App\Core\Database;
use App\Middleware\AuthMiddleware;
use PDO;

class AuditService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function log(int $boardId, string $action, ?int $cardId, ?string $cardTitle, array $details = []): void
    {
        $userId = AuthMiddleware::getUserId();
        
        $stmt = $this->db->prepare("
            INSERT INTO audit_logs (board_id, user_id, action, card_id, card_title, details) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $boardId, $userId, $action, $cardId, $cardTitle, json_encode($details)
        ]);
    }

    public function logCardUpdate(int $cardId, array $oldCard, array $newData, array $assigneeChanges = []): void
    {
        $changes = [];

        if (isset($newData['title']) && $newData['title'] != $oldCard['title']) {
            $changes['title_changed'] = ['old' => $oldCard['title'], 'new' => $newData['title']];
        }
        if (array_key_exists('description', $newData) && $newData['description'] != ($oldCard['description'] ?? '')) {
            $changes['description_changed'] = ['old' => $oldCard['description'], 'new' => $newData['description']];
        }
        if (isset($newData['column_id']) && $newData['column_id'] != $oldCard['column_id']) {
            $changes['card_moved'] = ['from' => $oldCard['column_id'], 'to' => $newData['column_id']];
        } 
        elseif (isset($newData['position']) && $newData['position'] != $oldCard['position']) {
            $changes['position_changed'] = ['old' => $oldCard['position'], 'new' => $newData['position']];
        }
        if (array_key_exists('deadline', $newData) && $newData['deadline'] != ($oldCard['deadline'] ?? '')) {
            $changes['deadline_changed'] = ['old' => $oldCard['deadline'], 'new' => $newData['deadline']];
        }

        if (!empty($assigneeChanges['added'])) {
            $changes['assignees_added'] = $assigneeChanges['added'];
        }
        if (!empty($assigneeChanges['removed'])) {
            $changes['assignees_removed'] = $assigneeChanges['removed'];
        }

        if (!empty($changes)) {
            $this->log($oldCard['board_id'], 'card_updated', $cardId, $oldCard['title'], $changes);
        }
    }

    public function logColumnCreate(int $boardId, int $columnId, string $title): void
    {
        $this->log($boardId, 'column_created', null, $title, ['column_id' => $columnId]);
    }

    public function logColumnUpdate(int $boardId, int $columnId, string $oldTitle, string $newTitle): void
    {
        $this->log($boardId, 'column_updated', null, $oldTitle, [
            'column_id' => $columnId, 
            'new_title' => $newTitle
        ]);
    }

    public function logColumnDelete(int $boardId, int $columnId, string $title): void
    {
        $this->log($boardId, 'column_deleted', null, $title, ['column_id' => $columnId]);
    }
}