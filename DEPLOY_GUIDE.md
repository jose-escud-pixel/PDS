# Guía de Despliegue - PDS en tu Servidor Ubuntu

## Resumen
- **App**: PDS Sistema de Gestión Odontológico
- **URL final**: `https://www.aranduinformatica.net/pds`
- **Backend**: Puerto 8004 (FastAPI + MongoDB)
- **Frontend**: React compilado servido por Apache

---

## Paso 1: Guardar código a GitHub

En la plataforma Emergent, usa el botón **"Save to Github"** para subir los últimos cambios al repo `PDS.git`.

---

## Paso 2: Clonar en tu servidor

Conectate a tu servidor por SSH:

```bash
# Clonar el repositorio
cd /var/www
sudo git clone https://github.com/jose-escud-pixel/PDS.git pds
cd pds
```

---

## Paso 3: Configurar Backend

```bash
cd /var/www/pds/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Crear archivo .env
nano .env
```

Contenido del `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=pds_database
JWT_SECRET=CAMBIA_ESTO_POR_UNA_CLAVE_LARGA_ALEATORIA
ADMIN_EMAIL=andy.escudero
ADMIN_PASSWORD=secreto
FRONTEND_URL=https://www.aranduinformatica.net
COOKIE_PATH=/pds
COOKIE_SECURE=true
```

> **Importante**: Cambiá `JWT_SECRET` por algo aleatorio. Podés generar uno con:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```

```bash
deactivate
```

---

## Paso 4: Configurar y Compilar Frontend

```bash
cd /var/www/pds/frontend

# Crear archivo .env
nano .env
```

Contenido del `.env`:
```
REACT_APP_BACKEND_URL=https://www.aranduinformatica.net/pds
```

```bash
# Agregar homepage al package.json (necesario para subdirectorio /pds)
python3 -c "
import json
with open('package.json', 'r') as f:
    pkg = json.load(f)
pkg['homepage'] = '/pds'
with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
print('homepage /pds agregado')
"

# Instalar dependencias y compilar
yarn install
yarn build
```

Esto genera la carpeta `build/` que Apache va a servir.

---

## Paso 5: Crear servicio systemd para el Backend

```bash
sudo nano /etc/systemd/system/pds-backend.service
```

Contenido:
```ini
[Unit]
Description=PDS Backend API
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/pds/backend
Environment=PATH=/var/www/pds/backend/venv/bin:/usr/local/bin:/usr/bin
EnvironmentFile=/var/www/pds/backend/.env
ExecStart=/var/www/pds/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8004
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Activar e iniciar el servicio
sudo systemctl daemon-reload
sudo systemctl enable pds-backend
sudo systemctl start pds-backend

# Verificar que funciona
sudo systemctl status pds-backend
curl http://127.0.0.1:8004/api/health
# Debe responder: {"status":"healthy","service":"PDS API"}
```

---

## Paso 6: Configurar Apache

Reemplazá tu archivo Apache con la versión corregida:

```bash
sudo nano /etc/apache2/sites-available/000-default-le-ssl.conf
```

**Copiar el contenido completo del archivo `apache-pds.conf`** que está en el repositorio.

Los cambios principales son:
1. **Agregado** bloque PDS (proxy + alias + rewrite)
2. **Agregado** `RewriteCond %{REQUEST_URI} !^/pds` en la sección principal (para que no capture rutas de PDS)
3. **Eliminado** el `Alias /arandu-clinic` duplicado que tenías

```bash
# Verificar que la config es válida
sudo apache2ctl configtest

# Recargar Apache
sudo systemctl reload apache2
```

---

## Paso 7: Probar

1. Abrir: `https://www.aranduinformatica.net/pds`
2. Login: `andy.escudero` / `secreto`
3. Verificar que el dashboard carga con widgets

---

## Comandos útiles

```bash
# Ver logs del backend
sudo journalctl -u pds-backend -f

# Reiniciar backend
sudo systemctl restart pds-backend

# Reiniciar Apache
sudo systemctl reload apache2

# Actualizar código desde GitHub
cd /var/www/pds
git pull
cd frontend && yarn build   # recompilar frontend
sudo systemctl restart pds-backend   # reiniciar backend
sudo systemctl reload apache2
```

---

## Solución de problemas

**Error 502 Bad Gateway**: El backend no está corriendo
```bash
sudo systemctl status pds-backend
sudo journalctl -u pds-backend --no-pager -n 50
```

**Login no funciona (cookies)**: Verificar que `.env` del backend tiene:
```
COOKIE_PATH=/pds
COOKIE_SECURE=true
```

**Página en blanco**: Verificar que `package.json` tiene `"homepage": "/pds"` y recompilar con `yarn build`

**MongoDB no conecta**: Verificar que MongoDB está corriendo:
```bash
sudo systemctl status mongod
```
