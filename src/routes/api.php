<?php
/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Enrutador de API REST JSON conectado a MySQL / MariaDB (refrigeracion_rufo)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../controllers/SistemaController.php';

try {
    $rawBody = file_get_contents('php://input');
    $jsonBody = [];
    if (is_string($rawBody) && trim($rawBody) !== '') {
        $decoded = json_decode($rawBody, true);
        if (!is_array($decoded) && function_exists('mb_convert_encoding')) {
            $decoded = json_decode(mb_convert_encoding($rawBody, 'UTF-8', 'Windows-1252'), true);
        }
        if (is_array($decoded)) {
            $jsonBody = $decoded;
        }
    }

    $payload = array_merge($_GET, $_POST, $jsonBody);
    $action  = trim((string) ($payload['action'] ?? 'init'));

    $controller = new SistemaController();
    $response   = $controller->procesar($action, $payload);

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(400);
    $msg = 'Error en la operación de base de datos.';
    if ($e->getCode() === '23000') {
        $errText = $e->getMessage();
        if (str_contains($errText, 'codigo')) {
            $msg = 'Ya existe un producto registrado con ese código.';
        } elseif (str_contains($errText, 'rif')) {
            $msg = 'Ya existe un proveedor registrado con ese RIF.';
        } elseif (str_contains($errText, 'usuario')) {
            $msg = 'El nombre de usuario ya está en uso.';
        } else {
            $msg = 'Registro duplicado o restricción de integridad en la base de datos.';
        }
    } else {
        $msg = 'Error de base de datos: ' . $e->getMessage();
    }

    echo json_encode([
        'ok'      => false,
        'mensaje' => $msg,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'ok'      => false,
        'mensaje' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
