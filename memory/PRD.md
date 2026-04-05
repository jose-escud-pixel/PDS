# PDS - Sistema de Gestion de Insumos Odontologicos

## Stack: React + FastAPI + MongoDB

## Implementado
- Fase 1: MVP con ~285 productos, CRUD completo
- Fase 2: JWT Auth, roles admin/usuario, auditoria, historial stock
- Fase 3: Estadisticas con graficos, exportacion CSV
- Fase 4: Dashboard drag-and-drop con plantillas + widgets + metas
- Fase 5: Plantillas compartidas (privada/usuarios/todos)
- Fase 6: CRUD completo en todas las vistas, badge Emergent eliminado
- Fase 7: Mi Perfil (editar datos, cambiar contrasena, foto), busqueda en todas las pestanas, estadisticas con rango de fechas y analisis por producto personalizado
- Fase 8: Permisos granulares por modulo (Ver, Crear, Editar, Eliminar) con UI de matriz de permisos para admin. Dashboard siempre visible para todos los usuarios.

## Endpoints: /api/auth/*, /api/perfil (GET/PUT + /password + /foto), /api/productos/*, /api/clientes/*, /api/proveedores/*, /api/ventas/*, /api/compras/*, /api/gastos/*, /api/usuarios/*, /api/dashboard/*, /api/metas/*, /api/plantillas/*, /api/estadisticas/* (ventas-por-periodo, compras-por-periodo, productos-mas-vendidos, ventas-por-cliente, stock-por-categoria, gastos-por-categoria, compras-por-proveedor, resumen, producto-detalle, ingresos-por-periodo), /api/reportes/*, /api/auditoria, /api/stock-movimientos, /api/permisos/modulos

## Backlog
- P1: Refactorizar App.js monolitico en componentes modulares
- P2: Exportacion PDF compatible con layouts personalizados
