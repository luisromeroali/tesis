<?php
/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Conexión a la Base de Datos MySQL / MariaDB (PDO)
 * Base de Datos: refrigeracion_rufo
 */

class Database
{
    private static ?PDO $instance = null;

    /**
     * Carga las variables de entorno desde el archivo .env si existe
     */
    private static function loadEnv(): array
    {
        $config = [
            'DB_HOST'    => '127.0.0.1',
            'DB_PORT'    => '3306',
            'DB_NAME'    => 'refrigeracion_rufo',
            'DB_USER'    => 'root',
            'DB_PASS'    => '',
            'DB_CHARSET' => 'utf8mb4',
        ];

        $envPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';
        if (is_readable($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines !== false) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                        continue;
                    }
                    [$key, $val] = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim($val, " \t\n\r\0\x0B\"'");
                    if (array_key_exists($key, $config)) {
                        $config[$key] = $val;
                    }
                }
            }
        }

        return $config;
    }

    /**
     * Obtiene la instancia única de conexión PDO a la base de datos refrigeracion_rufo
     */
    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $cfg = self::loadEnv();
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $cfg['DB_HOST'],
                $cfg['DB_PORT'],
                $cfg['DB_NAME'],
                $cfg['DB_CHARSET']
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            self::$instance = new PDO($dsn, $cfg['DB_USER'], $cfg['DB_PASS'], $options);
        }

        return self::$instance;
    }
}

/**
 * Función auxiliar para obtener la conexión PDO
 */
function obtenerConexion(): PDO
{
    return Database::getConnection();
}

// Permite verificar el estado de la conexión directamente con ?test=1
if (isset($_GET['test']) && basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'conexion.php') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    try {
        $pdo = Database::getConnection();
        $version = $pdo->query('SELECT VERSION()')->fetchColumn();
        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
        echo json_encode([
            'ok'       => true,
            'mensaje'  => 'Conexión exitosa a la base de datos MySQL/MariaDB.',
            'database' => $dbName,
            'servidor' => $version,
        ], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'ok'      => false,
            'mensaje' => 'Error al conectar con la base de datos: ' . $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}
