-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2026 at 07:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `refrigeracion_rufo`
--

-- --------------------------------------------------------

--
-- Table structure for table `compras`
--

CREATE TABLE `compras` (
  `id_compra` int(11) NOT NULL,
  `fecha_compra` date NOT NULL,
  `cantidad_mercancia` int(11) NOT NULL,
  `monto_compra` decimal(10,2) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `compras`
--

INSERT INTO `compras` (`id_compra`, `fecha_compra`, `cantidad_mercancia`, `monto_compra`, `id_proveedor`, `id_producto`) VALUES
(1, '2026-11-02', 15, 1050.00, 1, 1),
(2, '2026-11-04', 10, 980.00, 2, 2),
(3, '2026-11-05', 35, 105.00, 3, 8),
(4, '2026-11-06', 20, 240.00, 1, 5);

-- --------------------------------------------------------

--
-- Table structure for table `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 5,
  `precio` decimal(10,2) NOT NULL,
  `categoria` varchar(80) NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `id_proveedor` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `productos`
--

INSERT INTO `productos` (`id_producto`, `codigo`, `nombre`, `cantidad`, `stock_minimo`, `precio`, `categoria`, `fecha_ingreso`, `id_proveedor`) VALUES
(1, 'REF-001', 'Compresor Embraco 1/4 HP R-134a', 14, 4, 95.00, 'Compresores', '2026-11-01', 1),
(2, 'REF-002', 'Cilindro Gas Refrigerante R-134a (13.6 Kg)', 8, 3, 135.00, 'Gases Refrigerantes', '2026-11-02', 2),
(3, 'REF-003', 'Capacitor de Marcha 35 uF 370V', 3, 10, 6.50, 'Componentes Eléctricos', '2026-11-03', 3),
(4, 'REF-004', 'Termostato Universal para Nevera Danfoss', 0, 6, 12.00, 'Componentes Eléctricos', '2026-11-03', 3),
(5, 'REF-005', 'Motor Ventilador Evaporador 110V', 19, 5, 18.50, 'Motores y Ventilación', '2026-11-04', 1),
(6, 'REF-006', 'Filtro Secador Soldable 1/4\" Danfoss', 0, 12, 4.50, 'Tuberías y Filtros', '2026-11-05', 2),
(7, 'REF-007', 'Rollo Tubería de Cobre Flexible 1/4\" (15m)', 4, 5, 48.00, 'Tuberías y Filtros', '2026-11-06', 2),
(8, 'REF-008', 'Protector Térmico y Relé PTC 1/3 HP', 28, 8, 5.00, 'Componentes Eléctricos', '2026-11-06', 3);

-- --------------------------------------------------------

--
-- Table structure for table `proveedores`
--

CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL,
  `rif` varchar(20) DEFAULT NULL,
  `nombre` varchar(120) NOT NULL,
  `ubicacion` varchar(150) NOT NULL,
  `telefono` varchar(25) NOT NULL,
  `correo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `proveedores`
--

INSERT INTO `proveedores` (`id_proveedor`, `rif`, `nombre`, `ubicacion`, `telefono`, `correo`) VALUES
(1, 'J-40128941-2', 'Distribuidora Frío Zulia, C.A.', 'Maracaibo, Edo. Zulia', '0414-6712390', 'ventas@friozulia.com'),
(2, 'J-31894022-8', 'Importadora RefriPartes Maracaibo', 'San Francisco, Edo. Zulia', '0412-6558810', 'contacto@refripartes.com'),
(3, 'J-40998120-5', 'Suministros Eléctricos COL, C.A.', 'Cabimas, Edo. Zulia', '0424-6194401', 'suministroscol@gmail.com');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` enum('administrador','empleado') NOT NULL DEFAULT 'empleado',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `usuario`, `contrasena`, `rol`, `fecha_creacion`) VALUES
(1, 'Administrador General', 'admin', 'rufo2026', 'administrador', '2026-11-08 17:53:30'),
(2, 'Operador de Ventas', 'empleado', 'ventas2026', 'empleado', '2026-11-08 17:53:30');

-- --------------------------------------------------------

--
-- Table structure for table `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `descripcion` varchar(200) DEFAULT NULL,
  `cantidad_producto` int(11) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ventas`
--

INSERT INTO `ventas` (`id_venta`, `fecha`, `descripcion`, `cantidad_producto`, `monto`, `id_producto`, `id_usuario`) VALUES
(1, '2026-11-08 09:15:00', 'Venta al detal en mostrador', 12, 78.00, 3, 2),
(2, '2026-11-08 10:05:00', 'Venta al detal en mostrador', 9, 45.00, 8, 2),
(3, '2026-11-08 10:42:00', 'Venta de compresor con garantía', 3, 285.00, 1, 1),
(4, '2026-11-08 11:20:00', 'Venta al detal en mostrador', 6, 111.00, 5, 2),
(5, '2026-11-08 11:55:00', 'Venta de cilindro refrigerante', 2, 270.00, 2, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id_compra`),
  ADD KEY `fk_compras_proveedor` (`id_proveedor`),
  ADD KEY `fk_compras_producto` (`id_producto`);

--
-- Indexes for table `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `fk_productos_proveedor` (`id_proveedor`);

--
-- Indexes for table `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id_proveedor`),
  ADD UNIQUE KEY `rif` (`rif`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Indexes for table `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `fk_ventas_producto` (`id_producto`),
  ADD KEY `fk_ventas_usuario` (`id_usuario`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `compras`
--
ALTER TABLE `compras`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `fk_compras_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_compras_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`) ON UPDATE CASCADE;

--
-- Constraints for table `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_ventas_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
