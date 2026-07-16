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
            $databaseUrl = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL');

            if ($databaseUrl) {
                $parsed = parse_url($databaseUrl);
                $host = $parsed['host'];
                $port = $parsed['port'] ?? 5432;
                $db   = ltrim($parsed['path'], '/');
                $user = $parsed['user'];
                $pass = $parsed['pass'];
            } else {
                $host = $_ENV['PG_HOST'] ?? '127.0.0.1';
                $port = $_ENV['PG_PORT'] ?? '5432';
                $db   = $_ENV['PG_DBNAME'] ?? 'kanban_db';
                $user = $_ENV['PG_USER'] ?? 'postgres';
                $pass = $_ENV['PG_PASSWORD'] ?? 'secret';
            }

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