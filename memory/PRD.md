# PDS - Sistema de Gestión de Insumos Odontológicos

## Problema Original
Sistema web de gestión de ventas e inventario para insumos odontológicos, con ~285 productos cargados desde Excel.

## Stack: React + FastAPI + MongoDB

## Implementado
- Fase 1: MVP con CRUD completo de Productos, Clientes, Proveedores, Ventas, Compras, Gastos, Usuarios
- Fase 2: JWT Auth con cookies HttpOnly, roles (admin/usuario), auditoría, historial stock
- Fase 3: Estadísticas con gráficos, exportación CSV
- Fase 4: Dashboard drag-and-drop con 4 plantillas + 19 widgets + metas de ventas
- Fase 5: Plantillas compartidas (privada/usuarios/todos)
- Fase 6: CRUD completo en TODAS las vistas (crear, editar, eliminar), badge Emergent eliminado

## Endpoints: /api/auth/*, /api/productos/*, /api/clientes/*, /api/proveedores/*, /api/ventas/*, /api/compras/*, /api/gastos/*, /api/usuarios/*, /api/dashboard/*, /api/metas/*, /api/plantillas/*, /api/estadisticas/*, /api/reportes/*, /api/auditoria, /api/stock-movimientos

## DB Collections: usuarios, productos, clientes, proveedores, ventas, compras, gastos, auditoria, stock_movimientos, login_attempts, dashboard_config, metas, plantillas

## Preparado para Deploy en servidor Ubuntu + Apache (puerto 8004) en https://www.aranduinformatica.net/pds

## Backlog
- P1: Refactorizar App.js monolítico en componentes
- P2: Exportación PDF compatible con layouts personalizados
