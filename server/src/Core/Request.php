<?php

namespace App\Core;

class Request
{
    public static function getBody(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}