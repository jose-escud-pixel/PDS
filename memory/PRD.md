# PDS - Sistema de Gestión de Insumos Odontológicos

## Stack: React + FastAPI + MongoDB

## Implementado
- Fase 1: MVP con ~285 productos, CRUD completo
- Fase 2: JWT Auth, roles admin/usuario, auditoría, historial stock
- Fase 3: Estadísticas con gráficos, exportación CSV
- Fase 4: Dashboard drag-and-drop con plantillas + widgets + metas
- Fase 5: Plantillas compartidas (privada/usuarios/todos)
- Fase 6: CRUD completo en todas las vistas, badge Emergent eliminado
- Fase 7: Mi Perfil (editar datos, cambiar contraseña, foto), búsqueda en todas las pestañas, estadísticas con rango de fechas y análisis por producto personalizado

## Endpoints: /api/auth/*, /api/perfil (GET/PUT + /password + /foto), /api/productos/*, /api/clientes/*, /api/proveedores/*, /api/ventas/*, /api/compras/*, /api/gastos/*, /api/usuarios/*, /api/dashboard/*, /api/metas/*, /api/plantillas/*, /api/estadisticas/* (ventas-por-periodo, compras-por-periodo, productos-mas-vendidos, ventas-por-cliente, stock-por-categoria, gastos-por-categoria, compras-por-proveedor, resumen, producto-detalle, ingresos-por-periodo), /api/reportes/*, /api/auditoria, /api/stock-movimientos

## Backlog
- P1: Refactorizar App.js monolítico en componentes
- P2: Exportación PDF compatible con layouts personalizados
