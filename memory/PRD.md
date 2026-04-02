# PDS - Sistema de Gestión Integral para Insumos Odontológicos

## Problema Original
Sistema completo de gestión comercial para empresa paraguaya (PDS) de distribución de insumos odontológicos. Incluye autenticación, roles, permisos, auditoría, control de stock, compras, ventas, clientes, proveedores, gastos y reportes.

## Arquitectura
- **Frontend**: React 19 + Tailwind CSS + Phosphor Icons
- **Backend**: FastAPI (Python) con JWT Auth + bcrypt
- **Base de datos**: MongoDB (pds_database)
- **Puerto Apache**: 8004

## User Personas
1. **Administrador (andy.escudero)**: Gestión total del sistema, usuarios, auditoría
2. **Usuario Operativo**: Permisos modulares configurables por el admin

## Core Requirements
- [x] Sistema de autenticación JWT
- [x] Roles (admin/usuario) con permisos modulares
- [x] Dashboard con indicadores
- [x] CRUD de productos con control de stock
- [x] Ventas con cálculo de utilidad
- [x] Compras con actualización de stock
- [x] Clientes y proveedores
- [x] Gastos operativos
- [x] Historial de movimientos de stock
- [x] Auditoría del sistema
- [x] Reportes exportables (CSV)

## What's Been Implemented
**[2026-04-02]**
- MVP inicial con 285 productos
- Autenticación JWT + bcrypt
- Sistema de roles y permisos modulares
- Admin: andy.escudero / secreto
- Auditoría de todas las acciones
- Historial de movimientos de stock
- Exportación de reportes a CSV
- Ajuste manual de stock con motivo

## Permisos Modulares
| Módulo | Acciones |
|--------|----------|
| Dashboard | Ver |
| Productos | Ver, Crear, Editar, Eliminar |
| Ventas | Ver, Crear, Editar, Eliminar |
| Compras | Ver, Crear, Editar, Eliminar |
| Clientes | Ver, Crear, Editar, Eliminar |
| Proveedores | Ver, Crear, Editar, Eliminar |
| Gastos | Ver, Crear, Editar, Eliminar |
| Reportes | Ver |
| Auditoría | Ver (solo admin) |
| Usuarios | Ver, Crear, Editar, Eliminar (solo admin) |

## Backlog

### P1 (Alta)
- Exportación a PDF
- Gráficos de tendencias en dashboard
- Filtros avanzados en reportes

### P2 (Media)
- Recuperación de contraseña
- Notificaciones de bajo stock
- Bancos/Tesorería

## Next Tasks
1. Agregar gráficos de ventas mensuales
2. Implementar exportación a PDF
3. Agregar filtros por fecha en todas las vistas
