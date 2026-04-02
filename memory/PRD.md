# PDS - Sistema de Gestión Integral para Insumos Odontológicos

## Problema Original
Sistema completo de gestión comercial para empresa paraguaya (PDS) de distribución de insumos odontológicos con dashboard gráfico, estadísticas personalizables, autenticación, roles, permisos, auditoría, reportes PDF/CSV.

## Arquitectura
- **Frontend**: React 19 + Tailwind CSS + Recharts + Phosphor Icons + jsPDF
- **Backend**: FastAPI (Python) con JWT Auth + bcrypt
- **Base de datos**: MongoDB (pds_database)
- **Puerto Apache**: 8004

## User Personas
1. **Administrador (andy.escudero/secreto)**: Gestión total, usuarios, auditoría
2. **Usuario Operativo**: Permisos modulares configurables

## What's Been Implemented [2026-04-02]

### Autenticación y Seguridad
- [x] Login JWT con cookies httpOnly
- [x] Roles (admin/usuario) con permisos modulares
- [x] Protección contra fuerza bruta
- [x] Auditoría de todas las acciones

### Dashboard Gráfico
- [x] Cards con indicadores principales (ventas, compras, utilidad, gastos)
- [x] Gráfico de área: Ventas y Utilidad por período
- [x] Gráfico de barras: Top 10 Productos Vendidos
- [x] Gráfico de pie: Stock por Categoría
- [x] Gráfico de barras: Top Clientes por Ventas
- [x] Alertas de productos con bajo stock

### Sección de Estadísticas (NUEVO)
- [x] Selector de período: Día, Semana, Mes, Año
- [x] Gráfico de área: Ventas y Utilidad por período
- [x] Gráfico de barras: Compras por período
- [x] Gráfico de barras horizontal: Top 15 Productos más vendidos
- [x] Gráfico de pie: Ventas por Cliente
- [x] Gráfico de barras: Stock por Categoría (valor costo y venta)
- [x] Gráfico de pie/donut: Gastos por Categoría
- [x] Gráfico de barras: Compras por Proveedor
- [x] Botón Exportar PDF con gráficos

### Reportes
- [x] Exportación CSV (ventas, productos, movimientos stock)
- [x] Exportación PDF (ventas, inventario, estadísticas)
- [x] Filtros por rango de fechas

### Gestión Operativa
- [x] CRUD Productos (286 productos cargados)
- [x] CRUD Clientes (7 clientes)
- [x] CRUD Proveedores (7 proveedores)
- [x] Registro de Ventas con cálculo de utilidad
- [x] Registro de Compras con actualización de stock
- [x] Registro de Gastos por categoría
- [x] Historial de movimientos de stock
- [x] Ajuste manual de stock con motivo

## Backlog

### P1 (Alta)
- Gráficos de comparación año vs año
- Dashboard personalizable (arrastrar widgets)
- Alertas por email de bajo stock

### P2 (Media)
- Recuperación de contraseña
- Notificaciones en tiempo real
- Bancos/Tesorería
- Cuentas por cobrar/pagar

## Next Tasks
1. Agregar comparativa de períodos anteriores
2. Widgets personalizables en dashboard
3. Notificaciones de stock bajo por email/WhatsApp
