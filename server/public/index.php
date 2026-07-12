<?php
require_once __DIR__ . '/../vendor/autoload.php';

 $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
 $dotenv->load();
 
header('Access-Control-Allow-Origin: *'); // На проде адрес фронта
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');


use App\Controllers\AuthController;

 $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
 $uri = str_replace('/api', '', $uri);
 $method = $_SERVER['REQUEST_METHOD'];

if ($uri === '/register' && $method === 'POST') {
    (new AuthController())->register();
} elseif ($uri === '/login' && $method === 'POST') {
    (new AuthController())->login();
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}