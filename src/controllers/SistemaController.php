<?php
/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Controlador Principal de Peticiones (Login, Inventario, Ventas, Proveedores, Compras, Usuarios)
 */

require_once __DIR__ . '/../models/SistemaModel.php';

class SistemaController
{
    private SistemaModel $model;

    public function __construct()
    {
        $this->model = new SistemaModel();
    }

    /**
     * Procesa la acción solicitada y devuelve un arreglo listo para serializar en JSON
     */
    public function procesar(string $action, array $payload = []): array
    {
        switch ($action) {
            case 'init':
            case 'listar_todo':
                return [
                    'ok'      => true,
                    'mensaje' => 'Datos cargados desde la base de datos refrigeracion_rufo.',
                    'db'      => $this->model->obtenerTodo(),
                ];

            case 'login':
                $usuario    = (string) ($payload['usuario'] ?? '');
                $contrasena = (string) ($payload['contrasena'] ?? '');
                $cuenta     = $this->model->autenticarUsuario($usuario, $contrasena);
                if (!$cuenta) {
                    http_response_code(401);
                    return [
                        'ok'      => false,
                        'mensaje' => 'Usuario o contraseña incorrectos.',
                    ];
                }
                return [
                    'ok'      => true,
                    'mensaje' => 'Autenticación exitosa.',
                    'usuario' => $cuenta,
                ];

            case 'guardar_producto':
                $esEdicion  = !empty($payload['id_producto']);
                $idProducto = $this->model->guardarProducto($payload);
                return [
                    'ok'          => true,
                    'id_producto' => $idProducto,
                    'mensaje'     => $esEdicion
                        ? 'Producto actualizado correctamente en la base de datos.'
                        : 'Producto agregado al inventario en la base de datos.',
                    'db'          => $this->model->obtenerTodo(),
                ];

            case 'eliminar_producto':
                $idProducto = (int) ($payload['id_producto'] ?? 0);
                if ($idProducto <= 0) {
                    throw new InvalidArgumentException('ID de producto inválido.');
                }
                $this->model->eliminarProducto($idProducto);
                return [
                    'ok'      => true,
                    'mensaje' => 'Producto eliminado del inventario.',
                    'db'      => $this->model->obtenerTodo(),
                ];

            case 'guardar_proveedor':
                $esEdicion   = !empty($payload['id_proveedor']);
                $idProveedor = $this->model->guardarProveedor($payload);
                return [
                    'ok'           => true,
                    'id_proveedor' => $idProveedor,
                    'mensaje'      => $esEdicion
                        ? 'Proveedor actualizado correctamente.'
                        : 'Proveedor registrado correctamente.',
                    'db'           => $this->model->obtenerTodo(),
                ];

            case 'registrar_compra':
                $idCompra = $this->model->registrarCompra($payload);
                $cant     = (int) ($payload['cantidad_mercancia'] ?? 0);
                return [
                    'ok'        => true,
                    'id_compra' => $idCompra,
                    'mensaje'   => "Compra registrada: +{$cant} unidades agregadas al inventario.",
                    'db'        => $this->model->obtenerTodo(),
                ];

            case 'registrar_venta':
                $idVenta = $this->model->registrarVenta($payload);
                return [
                    'ok'       => true,
                    'id_venta' => $idVenta,
                    'mensaje'  => 'Venta registrada exitosamente.',
                    'db'       => $this->model->obtenerTodo(),
                ];

            case 'guardar_usuario':
                $esEdicion = !empty($payload['id_usuario']);
                $idUsuario = $this->model->guardarUsuario($payload);
                return [
                    'ok'         => true,
                    'id_usuario' => $idUsuario,
                    'mensaje'    => $esEdicion
                        ? 'Datos del usuario actualizados.'
                        : 'Nuevo usuario registrado.',
                    'db'         => $this->model->obtenerTodo(),
                ];

            case 'registrar_auditoria':
                $registro = $this->model->registrarAuditoria($payload);
                return [
                    'ok'       => true,
                    'registro' => $registro,
                    'mensaje'  => 'Evento de auditoría registrado.',
                    'db'       => $this->model->obtenerTodo(),
                ];

            case 'restaurar_datos':
                $this->model->restaurarDatosIniciales();
                return [
                    'ok'      => true,
                    'mensaje' => 'Datos de la base de datos restaurados al estado inicial.',
                    'db'      => $this->model->obtenerTodo(),
                ];

            default:
                http_response_code(400);
                return [
                    'ok'      => false,
                    'mensaje' => "Acción no reconocida: {$action}",
                ];
        }
    }
}
