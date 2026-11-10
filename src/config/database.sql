-- ============================================================================
-- SISTEMA WEB PARA LA GESTIÓN ADMINISTRATIVA DE LA EMPRESA REFRIGERACIÓN RUFO 1
-- Gestor de Base de Datos: MySQL / MariaDB (XAMPP)
-- Autora: Eunices Marin
-- ============================================================================

-- 1. Creación de la Base de Datos
CREATE DATABASE IF NOT EXISTS `refrigeracion_rufo`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `refrigeracion_rufo`;

-- ============================================================================
-- 2. Tabla: usuarios
-- Almacena las credenciales y el rol (administrador o empleado).
-- Regla de negocio: Solo el administrador puede modificar o cambiar contraseñas.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_completo` VARCHAR(100) NOT NULL,
  `usuario` VARCHAR(50) NOT NULL UNIQUE,
  `contrasena` VARCHAR(255) NOT NULL,
  `rol` ENUM('administrador', 'empleado') NOT NULL DEFAULT 'empleado',
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. Tabla: proveedores
-- Almacena los datos de contacto y ubicación de los proveedores de repuestos.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `proveedores` (
  `id_proveedor` INT AUTO_INCREMENT PRIMARY KEY,
  `rif` VARCHAR(20) UNIQUE,
  `nombre` VARCHAR(120) NOT NULL,
  `ubicacion` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(25) NOT NULL,
  `correo` VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. Tabla: productos
-- Almacena el inventario de repuestos de refrigeración, su stock actual y
-- el stock_minimo para disparar las alertas de agotado.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `productos` (
  `id_producto` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(30) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 0,
  `stock_minimo` INT NOT NULL DEFAULT 5,
  `precio` DECIMAL(10, 2) NOT NULL,
  `categoria` VARCHAR(80) NOT NULL,
  `fecha_ingreso` DATE NOT NULL,
  `id_proveedor` INT DEFAULT NULL,
  CONSTRAINT `fk_productos_proveedor`
    FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. Tabla: ventas
-- Control exclusivo de productos vendidos, vinculado al producto y al usuario
-- que registró la operación. Permite obtener el reporte de "Más vendidos".
-- ============================================================================
CREATE TABLE IF NOT EXISTS `ventas` (
  `id_venta` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `descripcion` VARCHAR(200) DEFAULT NULL,
  `cantidad_producto` INT NOT NULL,
  `monto` DECIMAL(10, 2) NOT NULL,
  `id_producto` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  CONSTRAINT `fk_ventas_producto`
    FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ventas_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. Tabla: compras
-- Registra las compras realizadas a los proveedores y la cantidad de mercancía
-- recibida, permitiendo generar el reporte de proveedores.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `compras` (
  `id_compra` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha_compra` DATE NOT NULL,
  `cantidad_mercancia` INT NOT NULL,
  `monto_compra` DECIMAL(10, 2) NOT NULL,
  `id_proveedor` INT NOT NULL,
  `id_producto` INT NOT NULL,
  CONSTRAINT `fk_compras_proveedor`
    FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_compras_producto`
    FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. Tabla: auditoria
-- Bitácora de actividad y trazabilidad de operaciones (invisible para el empleado).
-- Registra qué usuario hizo qué acción, a qué hora y desde qué IP, garantizando
-- la seguridad y trazabilidad que exige un entorno jerarquizado.
-- ============================================================================
CREATE TABLE IF NOT EXISTS `auditoria` (
  `id_auditoria` INT AUTO_INCREMENT PRIMARY KEY,
  `id_usuario` INT DEFAULT NULL,
  `usuario` VARCHAR(50) NOT NULL,
  `rol` VARCHAR(30) NOT NULL,
  `modulo` VARCHAR(50) NOT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `detalles` TEXT NOT NULL,
  `ip_origen` VARCHAR(45) NOT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_auditoria_usuario`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. Datos Iniciales de Prueba (Refrigeración Rufo 1, C.A.)
-- ============================================================================

-- Usuarios iniciales
INSERT INTO `usuarios` (`nombre_completo`, `usuario`, `contrasena`, `rol`) VALUES
('Administrador General', 'admin', 'rufo2026', 'administrador'),
('Operador de Ventas', 'empleado', 'ventas2026', 'empleado');

-- Proveedores iniciales
INSERT INTO `proveedores` (`rif`, `nombre`, `ubicacion`, `telefono`, `correo`) VALUES
('J-40128941-2', 'Distribuidora Frío Zulia, C.A.', 'Maracaibo, Edo. Zulia', '0414-6712390', 'ventas@friozulia.com'),
('J-31894022-8', 'Importadora RefriPartes Maracaibo', 'San Francisco, Edo. Zulia', '0412-6558810', 'contacto@refripartes.com'),
('J-40998120-5', 'Suministros Eléctricos COL, C.A.', 'Cabimas, Edo. Zulia', '0424-6194401', 'suministroscol@gmail.com');

-- Productos iniciales
INSERT INTO `productos` (`codigo`, `nombre`, `cantidad`, `stock_minimo`, `precio`, `categoria`, `fecha_ingreso`, `id_proveedor`) VALUES
('REF-001', 'Compresor Embraco 1/4 HP R-134a', 14, 4, 95.00, 'Compresores', '2026-11-01', 1),
('REF-002', 'Cilindro Gas Refrigerante R-134a (13.6 Kg)', 8, 3, 135.00, 'Gases Refrigerantes', '2026-11-02', 2),
('REF-003', 'Capacitor de Marcha 35 uF 370V', 3, 10, 6.50, 'Componentes Eléctricos', '2026-11-03', 3),
('REF-004', 'Termostato Universal para Nevera Danfoss', 0, 6, 12.00, 'Componentes Eléctricos', '2026-11-03', 3),
('REF-005', 'Motor Ventilador Evaporador 110V', 19, 5, 18.50, 'Motores y Ventilación', '2026-11-04', 1),
('REF-006', 'Filtro Secador Soldable 1/4" Danfoss', 0, 12, 4.50, 'Tuberías y Filtros', '2026-11-05', 2),
('REF-007', 'Rollo Tubería de Cobre Flexible 1/4" (15m)', 4, 5, 48.00, 'Tuberías y Filtros', '2026-11-06', 2),
('REF-008', 'Protector Térmico y Relé PTC 1/3 HP', 28, 8, 5.00, 'Componentes Eléctricos', '2026-11-06', 3);

-- Compras realizadas a proveedores
INSERT INTO `compras` (`fecha_compra`, `cantidad_mercancia`, `monto_compra`, `id_proveedor`, `id_producto`) VALUES
('2026-11-02', 15, 1050.00, 1, 1),
('2026-11-04', 10, 980.00, 2, 2),
('2026-11-05', 35, 105.00, 3, 8),
('2026-11-06', 20, 240.00, 1, 5);

-- Ventas registradas
INSERT INTO `ventas` (`fecha`, `descripcion`, `cantidad_producto`, `monto`, `id_producto`, `id_usuario`) VALUES
('2026-11-08 09:15:00', 'Venta al detal en mostrador', 12, 78.00, 3, 2),
('2026-11-08 10:05:00', 'Venta al detal en mostrador', 9, 45.00, 8, 2),
('2026-11-08 10:42:00', 'Venta de compresor con garantía', 3, 285.00, 1, 1),
('2026-11-08 11:20:00', 'Venta al detal en mostrador', 6, 111.00, 5, 2),
('2026-11-08 11:55:00', 'Venta de cilindro refrigerante', 2, 270.00, 2, 1);

-- Bitácora de Auditoría inicial
INSERT INTO `auditoria` (`id_usuario`, `usuario`, `rol`, `modulo`, `accion`, `detalles`, `ip_origen`, `fecha_hora`) VALUES
(1, 'admin', 'administrador', 'Sistema', 'INICIALIZACION_SISTEMA', 'Carga de estructura base de base de datos relacional y catálogo de repuestos', '192.168.1.10', '2026-11-01 08:00:00'),
(1, 'admin', 'administrador', 'Autenticación', 'INICIO_SESION', 'Inicio de sesión exitoso en estación de gerencia', '192.168.1.10', '2026-11-08 08:30:00'),
(2, 'empleado', 'empleado', 'Autenticación', 'INICIO_SESION', 'Inicio de sesión de operador en terminal de mostrador', '192.168.1.105', '2026-11-08 09:00:00'),
(2, 'empleado', 'empleado', 'Ventas', 'REGISTRO_VENTA', 'Venta #1 registrada: 12x Capacitor de Marcha 35 uF ($78.00)', '192.168.1.105', '2026-11-08 09:15:00'),
(2, 'empleado', 'empleado', 'Ventas', 'REGISTRO_VENTA', 'Venta #2 registrada: 9x Protector Térmico y Relé PTC 1/3 HP ($45.00)', '192.168.1.105', '2026-11-08 10:05:00'),
(1, 'admin', 'administrador', 'Ventas', 'REGISTRO_VENTA', 'Venta #3 registrada: 3x Compresor Embraco 1/4 HP R-134a ($285.00)', '192.168.1.10', '2026-11-08 10:42:00'),
(2, 'empleado', 'empleado', 'Ventas', 'REGISTRO_VENTA', 'Venta #4 registrada: 6x Motor Ventilador Evaporador 110V ($111.00)', '192.168.1.105', '2026-11-08 11:20:00'),
(1, 'admin', 'administrador', 'Ventas', 'REGISTRO_VENTA', 'Venta #5 registrada: 2x Cilindro Gas Refrigerante R-134a ($270.00)', '192.168.1.10', '2026-11-08 11:55:00'),
(2, 'empleado', 'empleado', 'Seguridad', 'ACCESO_DENEGADO', 'Intento de ingreso no autorizado a la ruta /admin.html bloqueado por directiva de seguridad', '192.168.1.105', '2026-11-08 13:10:00');

