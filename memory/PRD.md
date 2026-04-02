# PDS - Sistema de Gestión de Insumos Odontológicos

## Problema Original
Crear un sistema web de gestión de ventas e inventario para insumos odontológicos (Sistema PDS), con datos iniciales de ~285 productos provenientes de un archivo Excel proporcionado por el usuario.

## Usuarios
- **Admin** (andy.escudero): Acceso completo a todos los módulos, gestión de usuarios, auditoría, definición de metas.
- **Usuario**: Acceso restringido según permisos asignados por admin.

## Stack Técnico
- **Frontend**: React.js + TailwindCSS + Phosphor Icons + Recharts + react-grid-layout
- **Backend**: FastAPI + PyMongo
- **Base de datos**: MongoDB
- **Auth**: JWT con cookies HttpOnly + bcrypt

## Requisitos Implementados

### Fase 1 - MVP (COMPLETADO)
- Carga de 285 productos desde Excel del usuario
- CRUD de Productos, Clientes, Proveedores
- Registro de Ventas, Compras, Gastos
- Sidebar de navegación con todos los módulos

### Fase 2 - Autenticación y Seguridad (COMPLETADO)
- JWT Auth con cookies HttpOnly
- Roles: Admin y Usuario con permisos granulares
- Protección contra fuerza bruta (5 intentos, bloqueo 15 min)
- Auditoría de todas las acciones
- Historial de movimientos de stock

### Fase 3 - Estadísticas y Reportes (COMPLETADO)
- Gráficos: Ventas por período, compras, productos más vendidos, clientes, stock por categoría, gastos
- Resumen general con utilidad neta
- Exportación CSV de ventas, inventario, movimientos de stock

### Fase 4 - Dashboard Personalizable (COMPLETADO - 2026-04-02)
- Grid drag-and-drop con react-grid-layout
- 4 plantillas predefinidas: Ejecutivo, Ventas, Inventario, Analítico
- 19 widgets disponibles: stat cards, gráficos, tablas, alertas, metas
- Modo edición: arrastrar, redimensionar, agregar/eliminar widgets
- Guardado de configuración por usuario en MongoDB
- Widget de Metas de Ventas mensuales con barra de progreso

### Fase 5 - Plantillas Compartidas (COMPLETADO - 2026-04-02)
- Guardar layout actual como plantilla con nombre y descripción
- 3 niveles de visibilidad: Privada, Usuarios específicos, Todos
- Selector de usuarios para compartir con personas específicas
- Aplicar plantilla compartida crea una COPIA (original no cambia)
- Solo el creador puede editar/eliminar su plantilla
- Modal de plantillas con 2 secciones: Sistema y Personalizadas
- Botones de Aplicar, Compartir, Eliminar en cada plantilla propia

## Endpoints API
- Auth: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/refresh
- Dashboard: GET /api/dashboard, GET /api/dashboard/config, POST /api/dashboard/config, GET /api/dashboard/templates
- Metas: GET /api/metas, POST /api/metas, GET /api/metas/historial
- Plantillas: GET/POST /api/plantillas, PUT/DELETE /api/plantillas/{id}, POST /api/plantillas/{id}/aplicar
- Usuarios: GET /api/usuarios, GET /api/usuarios/lista
- CRUD: /api/productos, /api/clientes, /api/proveedores, /api/ventas, /api/compras, /api/gastos
- Estadísticas: /api/estadisticas/* (ventas-por-periodo, compras-por-periodo, etc.)
- Reportes: /api/reportes/ventas, /api/reportes/productos, /api/reportes/stock-movimientos

## Arquitectura de Archivos
- `/app/backend/server.py` - Backend completo (~1980 líneas)
- `/app/frontend/src/App.js` - Frontend monolítico (~1000 líneas)
- `/app/frontend/src/App.css` - Estilos
- `/app/backend/tests/` - Tests pytest

## DB Collections
- usuarios, productos, clientes, proveedores, ventas, compras, gastos
- auditoria, stock_movimientos, login_attempts
- dashboard_config, metas, plantillas

## Backlog / Tareas Futuras
- **P1**: Refactorizar App.js en componentes más pequeños
- **P2**: Verificar exportación PDF con layouts personalizados
- **P2**: Más opciones de exportación (Excel con formato)
