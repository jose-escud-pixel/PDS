# PDS - Sistema de Gestión Integral para Insumos Odontológicos

## Sistema de gestión comercial para empresa paraguaya de distribución de insumos odontológicos.

---

## Funcionalidades Implementadas

### Dashboard
- Indicadores de ventas, compras, utilidad bruta, gastos
- Stock valorizado total
- Conteo de productos sin stock y bajo mínimo
- Top productos vendidos y top clientes
- Alertas de productos con bajo stock

### Gestión de Productos
- 285 productos cargados desde Excel
- Búsqueda por código, nombre o variante
- Filtro por categoría (91 categorías)
- CRUD completo (crear, editar, eliminar)
- Control de stock y stock mínimo

### Gestión de Ventas
- Registro de ventas con múltiples productos
- Selección de cliente
- Búsqueda de productos en tiempo real
- Validación de stock disponible
- Cálculo automático de total y utilidad
- Descuento automático de inventario

### Gestión de Compras
- Registro de compras a proveedores
- Número de factura opcional
- Actualización automática de stock
- Actualización de costos

### Gestión de Clientes
- 6 clientes cargados
- Tipos: Odontólogo, Clínica, Consultorio, Laboratorio
- Historial de compras
- CRUD completo

### Gestión de Proveedores
- 6 proveedores cargados (Dental Guarani, Dentopar, Synergy CPD, etc.)
- Historial de compras
- CRUD completo

### Gastos Operativos
- Registro de gastos por categoría
- Categorías: Alquiler, Servicios, Salarios, etc.
- Control de IVA

---

## Configuración Apache para tu servidor

Agregar en tu archivo `/etc/apache2/sites-available/000-default-le-ssl.conf`:

```apache
# === PDS - GESTIÓN INSUMOS ODONTOLÓGICOS (Puerto 8004) ===
# Backend API para PDS
ProxyPass /pds/api http://127.0.0.1:8004/api
ProxyPassReverse /pds/api http://127.0.0.1:8004/api

Alias /pds /var/www/pds/frontend/build

<Directory /var/www/pds/frontend/build>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted

    RewriteEngine On
    RewriteBase /pds/
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /pds/index.html [L]
</Directory>
```

**Resumen de puertos usados:**
- 8001: Prive
- 8002: Arandu&JAR (principal)
- 8003: Arandu Clinic
- **8004: PDS** ✅

---

## Tecnologías
- **Frontend**: React 19, Tailwind CSS, Phosphor Icons
- **Backend**: FastAPI (Python)
- **Base de datos**: MongoDB
- **Diseño**: Work Sans + IBM Plex Sans, tema claro profesional

---

## Datos cargados del Excel
- 285 productos de insumos odontológicos
- Categorías: Resina (67), Fresa (29), Arco (15), Anestesia (9), etc.
- 6 clientes (odontólogos)
- 6 proveedores (Dental Guarani, Dentopar, Synergy CPD, GDNTAL, etc.)
