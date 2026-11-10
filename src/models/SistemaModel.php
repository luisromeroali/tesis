<?php
/**
 * SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA - REFRIGERACIÓN RUFO 1, C.A.
 * Módulo: Modelo de Acceso a Datos Relacionales (MySQL / MariaDB)
 * Tablas: usuarios, proveedores, productos, compras, ventas
 */

require_once __DIR__ . '/../config/conexion.php';

class SistemaModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene todas las tablas sincronizadas desde la base de datos refrigeracion_rufo
     */
    public function obtenerTodo(): array
    {
        $usuarios = $this->db->query(
            "SELECT id_usuario, nombre_completo, usuario, contrasena, rol, fecha_creacion
             FROM usuarios
             ORDER BY id_usuario ASC"
        )->fetchAll();

        foreach ($usuarios as &$u) {
            $u['id_usuario'] = (int) $u['id_usuario'];
        }

        $proveedores = $this->db->query(
            "SELECT id_proveedor, rif, nombre, ubicacion, telefono, correo
             FROM proveedores
             ORDER BY id_proveedor ASC"
        )->fetchAll();

        foreach ($proveedores as &$s) {
            $s['id_proveedor'] = (int) $s['id_proveedor'];
        }

        $productos = $this->db->query(
            "SELECT id_producto, codigo, nombre, cantidad, stock_minimo, precio, categoria, fecha_ingreso, id_proveedor
             FROM productos
             ORDER BY id_producto ASC"
        )->fetchAll();

        foreach ($productos as &$p) {
            $p['id_producto']  = (int) $p['id_producto'];
            $p['cantidad']     = (int) $p['cantidad'];
            $p['stock_minimo'] = (int) $p['stock_minimo'];
            $p['precio']       = (float) $p['precio'];
            $p['id_proveedor'] = $p['id_proveedor'] !== null ? (int) $p['id_proveedor'] : null;
        }

        $compras = $this->db->query(
            "SELECT id_compra, fecha_compra, cantidad_mercancia, monto_compra, id_proveedor, id_producto
             FROM compras
             ORDER BY id_compra DESC"
        )->fetchAll();

        foreach ($compras as &$c) {
            $c['id_compra']          = (int) $c['id_compra'];
            $c['cantidad_mercancia'] = (int) $c['cantidad_mercancia'];
            $c['monto_compra']       = (float) $c['monto_compra'];
            $c['id_proveedor']       = (int) $c['id_proveedor'];
            $c['id_producto']        = (int) $c['id_producto'];
        }

        $ventas = $this->db->query(
            "SELECT id_venta, DATE_FORMAT(fecha, '%Y-%m-%d %H:%i') AS fecha, descripcion, cantidad_producto, monto, id_producto, id_usuario
             FROM ventas
             ORDER BY id_venta DESC"
        )->fetchAll();

        foreach ($ventas as &$v) {
            $v['id_venta']          = (int) $v['id_venta'];
            $v['cantidad_producto'] = (int) $v['cantidad_producto'];
            $v['monto']             = (float) $v['monto'];
            $v['id_producto']       = (int) $v['id_producto'];
            $v['id_usuario']        = (int) $v['id_usuario'];
        }

        return [
            'usuarios'    => $usuarios,
            'proveedores' => $proveedores,
            'productos'   => $productos,
            'compras'     => $compras,
            'ventas'      => $ventas,
        ];
    }

    /**
     * Valida las credenciales de acceso contra la tabla usuarios
     */
    public function autenticarUsuario(string $usuario, string $contrasena): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id_usuario, nombre_completo, usuario, rol, fecha_creacion
             FROM usuarios
             WHERE LOWER(usuario) = LOWER(:usuario) AND contrasena = :contrasena
             LIMIT 1"
        );
        $stmt->execute([
            ':usuario'    => trim($usuario),
            ':contrasena' => trim($contrasena),
        ]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        $row['id_usuario'] = (int) $row['id_usuario'];
        return $row;
    }

    /**
     * Crea o actualiza un producto en la tabla productos
     */
    public function guardarProducto(array $data): int
    {
        $id_producto   = !empty($data['id_producto']) ? (int) $data['id_producto'] : 0;
        $codigo        = strtoupper(trim((string) ($data['codigo'] ?? '')));
        $nombre        = trim((string) ($data['nombre'] ?? ''));
        $categoria     = trim((string) ($data['categoria'] ?? ''));
        $cantidad      = max(0, (int) ($data['cantidad'] ?? 0));
        $stock_minimo  = max(1, (int) ($data['stock_minimo'] ?? 5));
        $precio        = max(0, (float) ($data['precio'] ?? 0));
        $fecha_ingreso = trim((string) ($data['fecha_ingreso'] ?? date('Y-m-d')));
        $id_proveedor  = !empty($data['id_proveedor']) ? (int) $data['id_proveedor'] : null;

        if ($id_producto > 0) {
            $stmt = $this->db->prepare(
                "UPDATE productos
                 SET codigo = :codigo,
                     nombre = :nombre,
                     cantidad = :cantidad,
                     stock_minimo = :stock_minimo,
                     precio = :precio,
                     categoria = :categoria,
                     fecha_ingreso = :fecha_ingreso,
                     id_proveedor = :id_proveedor
                 WHERE id_producto = :id_producto"
            );
            $stmt->execute([
                ':codigo'        => $codigo,
                ':nombre'        => $nombre,
                ':cantidad'      => $cantidad,
                ':stock_minimo'  => $stock_minimo,
                ':precio'        => $precio,
                ':categoria'     => $categoria,
                ':fecha_ingreso' => $fecha_ingreso,
                ':id_proveedor'  => $id_proveedor,
                ':id_producto'   => $id_producto,
            ]);
            return $id_producto;
        }

        $stmt = $this->db->prepare(
            "INSERT INTO productos (codigo, nombre, cantidad, stock_minimo, precio, categoria, fecha_ingreso, id_proveedor)
             VALUES (:codigo, :nombre, :cantidad, :stock_minimo, :precio, :categoria, :fecha_ingreso, :id_proveedor)"
        );
        $stmt->execute([
            ':codigo'        => $codigo,
            ':nombre'        => $nombre,
            ':cantidad'      => $cantidad,
            ':stock_minimo'  => $stock_minimo,
            ':precio'        => $precio,
            ':categoria'     => $categoria,
            ':fecha_ingreso' => $fecha_ingreso,
            ':id_proveedor'  => $id_proveedor,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Elimina un producto y sus registros dependientes dentro de una transacción
     */
    public function eliminarProducto(int $id_producto): void
    {
        $this->db->beginTransaction();
        try {
            $stmtVentas = $this->db->prepare("DELETE FROM ventas WHERE id_producto = :id");
            $stmtVentas->execute([':id' => $id_producto]);

            $stmtCompras = $this->db->prepare("DELETE FROM compras WHERE id_producto = :id");
            $stmtCompras->execute([':id' => $id_producto]);

            $stmtProd = $this->db->prepare("DELETE FROM productos WHERE id_producto = :id");
            $stmtProd->execute([':id' => $id_producto]);

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Crea o actualiza un proveedor en la tabla proveedores
     */
    public function guardarProveedor(array $data): int
    {
        $id_proveedor = !empty($data['id_proveedor']) ? (int) $data['id_proveedor'] : 0;
        $rif          = strtoupper(trim((string) ($data['rif'] ?? '')));
        $nombre       = trim((string) ($data['nombre'] ?? ''));
        $ubicacion    = trim((string) ($data['ubicacion'] ?? ''));
        $telefono     = trim((string) ($data['telefono'] ?? ''));
        $correo       = trim((string) ($data['correo'] ?? ''));

        if ($id_proveedor > 0) {
            $stmt = $this->db->prepare(
                "UPDATE proveedores
                 SET rif = :rif,
                     nombre = :nombre,
                     ubicacion = :ubicacion,
                     telefono = :telefono,
                     correo = :correo
                 WHERE id_proveedor = :id_proveedor"
            );
            $stmt->execute([
                ':rif'          => $rif,
                ':nombre'       => $nombre,
                ':ubicacion'    => $ubicacion,
                ':telefono'     => $telefono,
                ':correo'       => $correo,
                ':id_proveedor' => $id_proveedor,
            ]);
            return $id_proveedor;
        }

        $stmt = $this->db->prepare(
            "INSERT INTO proveedores (rif, nombre, ubicacion, telefono, correo)
             VALUES (:rif, :nombre, :ubicacion, :telefono, :correo)"
        );
        $stmt->execute([
            ':rif'       => $rif,
            ':nombre'    => $nombre,
            ':ubicacion' => $ubicacion,
            ':telefono'  => $telefono,
            ':correo'    => $correo,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Registra una compra de mercancía e incrementa el stock del producto
     */
    public function registrarCompra(array $data): int
    {
        $fecha_compra       = trim((string) ($data['fecha_compra'] ?? date('Y-m-d')));
        $id_proveedor       = (int) ($data['id_proveedor'] ?? 0);
        $id_producto        = (int) ($data['id_producto'] ?? 0);
        $cantidad_mercancia = (int) ($data['cantidad_mercancia'] ?? 0);
        $monto_compra       = (float) ($data['monto_compra'] ?? 0);

        if ($id_proveedor <= 0 || $id_producto <= 0 || $cantidad_mercancia <= 0) {
            throw new InvalidArgumentException('Datos de compra inválidos.');
        }

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO compras (fecha_compra, cantidad_mercancia, monto_compra, id_proveedor, id_producto)
                 VALUES (:fecha_compra, :cantidad_mercancia, :monto_compra, :id_proveedor, :id_producto)"
            );
            $stmt->execute([
                ':fecha_compra'       => $fecha_compra,
                ':cantidad_mercancia' => $cantidad_mercancia,
                ':monto_compra'       => $monto_compra,
                ':id_proveedor'       => $id_proveedor,
                ':id_producto'        => $id_producto,
            ]);
            $idCompra = (int) $this->db->lastInsertId();

            $stmtUpdate = $this->db->prepare(
                "UPDATE productos
                 SET cantidad = cantidad + :cantidad,
                     fecha_ingreso = :fecha_ingreso
                 WHERE id_producto = :id_producto"
            );
            $stmtUpdate->execute([
                ':cantidad'      => $cantidad_mercancia,
                ':fecha_ingreso' => $fecha_compra,
                ':id_producto'   => $id_producto,
            ]);

            $this->db->commit();
            return $idCompra;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Registra una venta y descuenta automáticamente el stock del producto
     */
    public function registrarVenta(array $data): int
    {
        $id_producto       = (int) ($data['id_producto'] ?? 0);
        $cantidad_producto = (int) ($data['cantidad_producto'] ?? 0);
        $descripcion       = trim((string) ($data['descripcion'] ?? 'Venta al detal en mostrador'));
        $id_usuario        = (int) ($data['id_usuario'] ?? 1);

        if ($id_producto <= 0 || $cantidad_producto <= 0) {
            throw new InvalidArgumentException('Seleccione un producto y una cantidad válida.');
        }

        $this->db->beginTransaction();
        try {
            $stmtProd = $this->db->prepare(
                "SELECT id_producto, nombre, cantidad, precio
                 FROM productos
                 WHERE id_producto = :id_producto
                 FOR UPDATE"
            );
            $stmtProd->execute([':id_producto' => $id_producto]);
            $prod = $stmtProd->fetch();

            if (!$prod) {
                throw new RuntimeException('El producto seleccionado no existe.');
            }

            $stockActual = (int) $prod['cantidad'];
            if ($cantidad_producto > $stockActual) {
                throw new RuntimeException("Stock insuficiente: solo hay {$stockActual} unidades disponibles.");
            }

            $monto = round(((float) $prod['precio']) * $cantidad_producto, 2);

            $stmtDeduct = $this->db->prepare(
                "UPDATE productos
                 SET cantidad = cantidad - :cantidad
                 WHERE id_producto = :id_producto"
            );
            $stmtDeduct->execute([
                ':cantidad'    => $cantidad_producto,
                ':id_producto' => $id_producto,
            ]);

            $stmtVenta = $this->db->prepare(
                "INSERT INTO ventas (fecha, descripcion, cantidad_producto, monto, id_producto, id_usuario)
                 VALUES (NOW(), :descripcion, :cantidad_producto, :monto, :id_producto, :id_usuario)"
            );
            $stmtVenta->execute([
                ':descripcion'       => $descripcion,
                ':cantidad_producto' => $cantidad_producto,
                ':monto'             => $monto,
                ':id_producto'       => $id_producto,
                ':id_usuario'        => $id_usuario,
            ]);

            $idVenta = (int) $this->db->lastInsertId();
            $this->db->commit();
            return $idVenta;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Crea o actualiza un usuario en la tabla usuarios
     */
    public function guardarUsuario(array $data): int
    {
        $id_usuario      = !empty($data['id_usuario']) ? (int) $data['id_usuario'] : 0;
        $nombre_completo = trim((string) ($data['nombre_completo'] ?? ''));
        $usuario         = strtolower(trim((string) ($data['usuario'] ?? '')));
        $contrasena      = trim((string) ($data['contrasena'] ?? ''));
        $rol             = in_array($data['rol'] ?? '', ['administrador', 'empleado'], true)
            ? $data['rol']
            : 'empleado';

        if ($id_usuario > 0) {
            $stmt = $this->db->prepare(
                "UPDATE usuarios
                 SET nombre_completo = :nombre_completo,
                     usuario = :usuario,
                     contrasena = :contrasena,
                     rol = :rol
                 WHERE id_usuario = :id_usuario"
            );
            $stmt->execute([
                ':nombre_completo' => $nombre_completo,
                ':usuario'         => $usuario,
                ':contrasena'      => $contrasena,
                ':rol'             => $rol,
                ':id_usuario'      => $id_usuario,
            ]);
            return $id_usuario;
        }

        $stmt = $this->db->prepare(
            "INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol)
             VALUES (:nombre_completo, :usuario, :contrasena, :rol)"
        );
        $stmt->execute([
            ':nombre_completo' => $nombre_completo,
            ':usuario'         => $usuario,
            ':contrasena'      => $contrasena,
            ':rol'             => $rol,
        ]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Restaura los datos iniciales de fábrica en la base de datos refrigeracion_rufo
     */
    public function restaurarDatosIniciales(): void
    {
        $this->db->exec("SET FOREIGN_KEY_CHECKS = 0");
        try {
            $this->db->exec("TRUNCATE TABLE ventas");
            $this->db->exec("TRUNCATE TABLE compras");
            $this->db->exec("TRUNCATE TABLE productos");
            $this->db->exec("TRUNCATE TABLE proveedores");
            $this->db->exec("TRUNCATE TABLE usuarios");

            $this->db->exec(
                "INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `usuario`, `contrasena`, `rol`, `fecha_creacion`) VALUES
                (1, 'Administrador General', 'admin', 'rufo2026', 'administrador', '2026-11-08 17:53:30'),
                (2, 'Operador de Ventas', 'empleado', 'ventas2026', 'empleado', '2026-11-08 17:53:30')"
            );

            $this->db->exec(
                "INSERT INTO `proveedores` (`id_proveedor`, `rif`, `nombre`, `ubicacion`, `telefono`, `correo`) VALUES
                (1, 'J-40128941-2', 'Distribuidora Frío Zulia, C.A.', 'Maracaibo, Edo. Zulia', '0414-6712390', 'ventas@friozulia.com'),
                (2, 'J-31894022-8', 'Importadora RefriPartes Maracaibo', 'San Francisco, Edo. Zulia', '0412-6558810', 'contacto@refripartes.com'),
                (3, 'J-40998120-5', 'Suministros Eléctricos COL, C.A.', 'Cabimas, Edo. Zulia', '0424-6194401', 'suministroscol@gmail.com')"
            );

            $this->db->exec(
                "INSERT INTO `productos` (`id_producto`, `codigo`, `nombre`, `cantidad`, `stock_minimo`, `precio`, `categoria`, `fecha_ingreso`, `id_proveedor`) VALUES
                (1, 'REF-001', 'Compresor Embraco 1/4 HP R-134a', 14, 4, 95.00, 'Compresores', '2026-11-01', 1),
                (2, 'REF-002', 'Cilindro Gas Refrigerante R-134a (13.6 Kg)', 8, 3, 135.00, 'Gases Refrigerantes', '2026-11-02', 2),
                (3, 'REF-003', 'Capacitor de Marcha 35 uF 370V', 3, 10, 6.50, 'Componentes Eléctricos', '2026-11-03', 3),
                (4, 'REF-004', 'Termostato Universal para Nevera Danfoss', 0, 6, 12.00, 'Componentes Eléctricos', '2026-11-03', 3),
                (5, 'REF-005', 'Motor Ventilador Evaporador 110V', 19, 5, 18.50, 'Motores y Ventilación', '2026-11-04', 1),
                (6, 'REF-006', 'Filtro Secador Soldable 1/4\" Danfoss', 0, 12, 4.50, 'Tuberías y Filtros', '2026-11-05', 2),
                (7, 'REF-007', 'Rollo Tubería de Cobre Flexible 1/4\" (15m)', 4, 5, 48.00, 'Tuberías y Filtros', '2026-11-06', 2),
                (8, 'REF-008', 'Protector Térmico y Relé PTC 1/3 HP', 28, 8, 5.00, 'Componentes Eléctricos', '2026-11-06', 3)"
            );

            $this->db->exec(
                "INSERT INTO `compras` (`id_compra`, `fecha_compra`, `cantidad_mercancia`, `monto_compra`, `id_proveedor`, `id_producto`) VALUES
                (1, '2026-11-02', 15, 1050.00, 1, 1),
                (2, '2026-11-04', 10, 980.00, 2, 2),
                (3, '2026-11-05', 35, 105.00, 3, 8),
                (4, '2026-11-06', 20, 240.00, 1, 5)"
            );

            $this->db->exec(
                "INSERT INTO `ventas` (`id_venta`, `fecha`, `descripcion`, `cantidad_producto`, `monto`, `id_producto`, `id_usuario`) VALUES
                (1, '2026-11-08 09:15:00', 'Venta al detal en mostrador', 12, 78.00, 3, 2),
                (2, '2026-11-08 10:05:00', 'Venta al detal en mostrador', 9, 45.00, 8, 2),
                (3, '2026-11-08 10:42:00', 'Venta de compresor con garantía', 3, 285.00, 1, 1),
                (4, '2026-11-08 11:20:00', 'Venta al detal en mostrador', 6, 111.00, 5, 2),
                (5, '2026-11-08 11:55:00', 'Venta de cilindro refrigerante', 2, 270.00, 2, 1)"
            );
        } finally {
            $this->db->exec("SET FOREIGN_KEY_CHECKS = 1");
        }
    }
}
