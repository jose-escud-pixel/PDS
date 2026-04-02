# PDS - Sistema de Gestión Integral para Insumos Odontológicos

## Problema Original
Sistema de gestión comercial para empresa paraguaya (PDS) de distribución de insumos odontológicos. Reemplaza uso de Excel. Incluye control de stock, compras, ventas, clientes, proveedores y gastos.

## Arquitectura
- **Frontend**: React 19 + Tailwind CSS + Phosphor Icons
- **Backend**: FastAPI (Python) - Puerto 8001
- **Base de datos**: MongoDB (pds_database)
- **Puerto Apache**: 8004 (libre según configuración del usuario)

## User Personas
1. **Administrador PDS**: Gestión completa del sistema
2. **Usuario Operativo**: Registro de ventas, compras, consultas

## Core Requirements (Estáticos)
- Dashboard con indicadores de ventas/compras/utilidad/stock
- CRUD de productos con control de stock
- Registro de ventas con descuento automático de inventario
- Registro de compras con actualización de stock
- Gestión de clientes (odontólogos, clínicas)
- Gestión de proveedores
- Registro de gastos operativos

## What's Been Implemented
**[2026-04-02]**
- Dashboard completo con estadísticas
- Gestión de productos (285 productos cargados)
- Gestión de ventas con validación de stock
- Gestión de compras con actualización de costos
- Gestión de clientes (6 clientes)
- Gestión de proveedores (6 proveedores)
- Gestión de gastos operativos
- Seed de datos desde Excel
- Logo PDS rojo (#E63946) integrado

## Prioritized Backlog

### P0 (Crítico)
- ✅ Dashboard con indicadores
- ✅ CRUD productos
- ✅ Ventas con descuento de stock
- ✅ Compras con actualización de stock

### P1 (Alta)
- Sistema de login/autenticación
- Reportes exportables (Excel/PDF)
- Historial de movimientos de stock

### P2 (Media)
- Roles y permisos múltiples
- Auditoría de cambios
- Bancos/Tesorería
- Cuentas por cobrar/pagar

## Next Tasks
1. Implementar autenticación (login/registro)
2. Agregar reportes de ventas por período
3. Agregar historial de precios por producto
