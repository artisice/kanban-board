<?php

require_once __DIR__ . '/../vendor/autoload.php';

 $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
 $dotenv->load();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\BoardController;
use App\Controllers\ColumnController;
use App\Controllers\CardController;
use App\Controllers\CommentController;

 $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
 $method = $_SERVER['REQUEST_METHOD'];

 $router = new Router();

 $router->addRoute('POST', '/register', [AuthController::class, 'register']);
 $router->addRoute('POST', '/login', [AuthController::class, 'login']);

 $router->addRoute('GET', '/boards', [BoardController::class, 'index']);
 $router->addRoute('POST', '/boards', [BoardController::class, 'create']);
 $router->addRoute('GET', '/boards/{id}', [BoardController::class, 'show']);
 $router->addRoute('PUT', '/boards/{id}', [BoardController::class, 'update']);
 $router->addRoute('DELETE', '/boards/{id}', [BoardController::class, 'delete']);

 $router->addRoute('POST', '/boards/{boardId}/columns', [ColumnController::class, 'create']);
 $router->addRoute('PUT', '/columns/{id}', [ColumnController::class, 'update']);
 $router->addRoute('DELETE', '/columns/{id}', [ColumnController::class, 'delete']);

 $router->addRoute('POST', '/columns/{columnId}/cards', [CardController::class, 'create']);
 $router->addRoute('PUT', '/cards/{id}', [CardController::class, 'update']);
 $router->addRoute('DELETE', '/cards/{id}', [CardController::class, 'delete']);

 $router->addRoute('GET', '/cards/{cardId}/comments', [CommentController::class, 'index']);
 $router->addRoute('POST', '/cards/{cardId}/comments', [CommentController::class, 'create']);
 $router->addRoute('DELETE', '/comments/{id}', [CommentController::class, 'delete']);

 $router->dispatch($method, $uri);