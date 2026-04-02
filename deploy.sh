#!/bin/bash
# ==============================================
# SCRIPT DE DESPLIEGUE - PDS Sistema de Gestión
# Servidor: Ubuntu + Apache + MongoDB
# ==============================================

set -e

echo "=========================================="
echo "  PDS - Despliegue en Servidor"
echo "=========================================="

# === VARIABLES ===
APP_DIR="/var/www/pds"
REPO_URL="https://github.com/jose-escud-pixel/PDS.git"
BACKEND_PORT=8004
DOMAIN="www.aranduinformatica.net"

# === PASO 1: Instalar dependencias del sistema ===
echo ""
echo "[1/7] Verificando dependencias del sistema..."

# Node.js (si no está instalado)
if ! command -v node &> /dev/null; then
    echo "  -> Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "  Node.js: $(node --version)"

# Yarn
if ! command -v yarn &> /dev/null; then
    echo "  -> Instalando Yarn..."
    sudo npm install -g yarn
fi
echo "  Yarn: $(yarn --version)"

# Python3 + pip
if ! command -v python3 &> /dev/null; then
    echo "  -> Instalando Python3..."
    sudo apt-get install -y python3 python3-pip python3-venv
fi
echo "  Python3: $(python3 --version)"

# MongoDB (verificar si está corriendo)
if ! systemctl is-active --quiet mongod 2>/dev/null; then
    echo "  ⚠️  MongoDB no está corriendo. Verificá que esté instalado e iniciado."
    echo "     sudo systemctl start mongod"
fi

# Módulos Apache necesarios
echo "  -> Habilitando módulos Apache..."
sudo a2enmod proxy proxy_http rewrite ssl headers 2>/dev/null || true

# === PASO 2: Clonar/Actualizar repositorio ===
echo ""
echo "[2/7] Clonando repositorio..."

if [ -d "$APP_DIR" ]; then
    echo "  -> Directorio existe, actualizando..."
    cd "$APP_DIR"
    git pull origin main || git pull origin master
else
    echo "  -> Clonando desde GitHub..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# === PASO 3: Configurar Backend ===
echo ""
echo "[3/7] Configurando Backend..."

cd "$APP_DIR/backend"

# Crear entorno virtual
if [ ! -d "venv" ]; then
    echo "  -> Creando entorno virtual..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "  -> Instalando dependencias Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Crear .env de producción
if [ ! -f ".env" ]; then
    echo "  -> Creando .env de producción..."
    # Generar JWT secret aleatorio
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=pds_database
JWT_SECRET=${JWT_SECRET}
ADMIN_EMAIL=andy.escudero
ADMIN_PASSWORD=secreto
FRONTEND_URL=https://${DOMAIN}
COOKIE_PATH=/pds
COOKIE_SECURE=true
EOF
    echo "  ✅ .env creado. CAMBIÁ la contraseña del admin después!"
else
    echo "  -> .env ya existe, no se modifica"
fi

deactivate

# === PASO 4: Configurar y Compilar Frontend ===
echo ""
echo "[4/7] Configurando Frontend..."

cd "$APP_DIR/frontend"

# Crear .env de producción
cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}/pds
EOF

# Configurar homepage para subdirectorio /pds
cd "$APP_DIR/frontend"
# Verificar si ya tiene homepage configurado
if ! grep -q '"homepage"' package.json; then
    echo "  -> Agregando homepage a package.json..."
    # Usar python para modificar JSON correctamente
    python3 -c "
import json
with open('package.json', 'r') as f:
    pkg = json.load(f)
pkg['homepage'] = '/pds'
with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
print('  homepage: /pds agregado')
"
fi

echo "  -> Instalando dependencias (yarn)..."
yarn install

echo "  -> Compilando frontend (build)..."
yarn build

echo "  ✅ Frontend compilado en: $APP_DIR/frontend/build"

# === PASO 5: Crear servicio systemd para el backend ===
echo ""
echo "[5/7] Creando servicio systemd..."

sudo tee /etc/systemd/system/pds-backend.service > /dev/null << EOF
[Unit]
Description=PDS Backend API
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/backend
Environment=PATH=${APP_DIR}/backend/venv/bin:/usr/local/bin:/usr/bin
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port ${BACKEND_PORT}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable pds-backend
sudo systemctl restart pds-backend

echo "  -> Esperando que el backend inicie..."
sleep 3

if systemctl is-active --quiet pds-backend; then
    echo "  ✅ Backend corriendo en puerto ${BACKEND_PORT}"
else
    echo "  ❌ Error al iniciar backend. Revisá con: sudo journalctl -u pds-backend -f"
fi

# === PASO 6: Verificar backend ===
echo ""
echo "[6/7] Verificando backend..."

HEALTH=$(curl -s http://127.0.0.1:${BACKEND_PORT}/api/health 2>/dev/null || echo "ERROR")
echo "  Health check: $HEALTH"

# === PASO 7: Instrucciones finales ===
echo ""
echo "[7/7] ✅ DESPLIEGUE COMPLETADO"
echo ""
echo "=========================================="
echo "  SIGUIENTE PASO MANUAL:"
echo "=========================================="
echo ""
echo "  1. Agregar la configuración de PDS a Apache:"
echo "     sudo nano /etc/apache2/sites-available/000-default-le-ssl.conf"
echo "     (Agregar el bloque PDS - ver archivo apache-pds.conf)"
echo ""
echo "  2. Reiniciar Apache:"
echo "     sudo systemctl reload apache2"
echo ""
echo "  3. Probar:"
echo "     https://${DOMAIN}/pds"
echo ""
echo "  4. Credenciales admin:"
echo "     Usuario: andy.escudero"
echo "     Contraseña: secreto"
echo "     ⚠️  Cambiá la contraseña después del primer login"
echo ""
echo "=========================================="
