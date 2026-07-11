<?php

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = getenv('PG_HOST') ?: '127.0.0.1';
            $port = getenv('PG_PORT') ?: '5432';
            $db   = getenv('PG_DBNAME') ?: 'kanban_db';
            $user = getenv('PG_USER') ?: 'postgres';
            $pass = getenv('PG_PASSWORD') ?: 'secret';

            $dsn = "pgsql:host=$host;port=$port;dbname=$db";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                die("Database connection failed: " . $e->getMessage());
            }
        }

        return self::$instance;
    }
}