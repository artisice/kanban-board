<?php

namespace App\Core;

class Router
{
    private array $routes = [];

    public function addRoute(string $method, string $uri, array $action): void
    {
        $this->routes[] = [
            'method' => $method,
            'uri' => $uri,
            'action' => $action
        ];
    }

    public function dispatch(string $method, string $uri): void
    {
        foreach ($this->routes as $route) {
            $routePattern = preg_replace('/\{([a-zA-Z_]+)\}/', '(\d+)', $route['uri']);
            $routePattern = str_replace('/', '\/', $routePattern);
            
            if ($route['method'] === $method && preg_match('/^' . $routePattern . '$/', $uri, $matches)) {
                $controller = new $route['action'][0];
                $actionName = $route['action'][1];
                
                if (isset($matches[1])) {
                    $controller->$actionName($matches[1]);
                } else {
                    $controller->$actionName();
                }
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Route Not Found']);
    }
}