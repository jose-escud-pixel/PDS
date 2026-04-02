"""
PDS - Sistema de Gestión Integral para Insumos Odontológicos
Backend API con FastAPI + MongoDB + JWT Auth + Roles + Auditoría
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import json
import bcrypt
import jwt
import io
import csv

from pymongo import MongoClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pds_database")
JWT_SECRET = os.environ.get("JWT_SECRET", "default-secret-change-me")
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
COOKIE_PATH = os.environ.get("COOKIE_PATH", "/")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

app = FastAPI(title="PDS API", description="Sistema de Gestión de Insumos Odontológicos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
usuarios_col = db["usuarios"]
productos_col = db["productos"]
clientes_col = db["clientes"]
proveedores_col = db["proveedores"]
ventas_col = db["ventas"]
compras_col = db["compras"]
gastos_col = db["gastos"]
auditoria_col = db["auditoria"]
stock_movimientos_col = db["stock_movimientos"]
login_attempts_col = db["login_attempts"]
dashboard_config_col = db["dashboard_config"]
metas_col = db["metas"]
plantillas_col = db["plantillas"]

# ============ PASSWORD & JWT ============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = usuarios_col.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "nombre": user.get("nombre", ""),
            "role": user.get("role", "usuario"),
            "permisos": user.get("permisos", {})
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def require_admin(request: Request) -> dict:
    user = get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return user

def check_permission(user: dict, modulo: str, accion: str = "ver") -> bool:
    if user["role"] == "admin":
        return True
    permisos = user.get("permisos", {})
    modulo_permisos = permisos.get(modulo, {})
    return modulo_permisos.get(accion, False)

def require_permission(modulo: str, accion: str = "ver"):
    def dependency(request: Request):
        user = get_current_user(request)
        if not check_permission(user, modulo, accion):
            raise HTTPException(status_code=403, detail=f"Sin permiso para {accion} en {modulo}")
        return user
    return dependency

# ============ AUDITORÍA ============
def registrar_auditoria(usuario_id: str, usuario_email: str, accion: str, modulo: str, detalle: dict = None, ip: str = None):
    auditoria_col.insert_one({
        "usuario_id": usuario_id,
        "usuario_email": usuario_email,
        "accion": accion,
        "modulo": modulo,
        "detalle": detalle or {},
        "ip": ip,
        "fecha": datetime.now(timezone.utc).isoformat()
    })

# ============ STOCK MOVEMENTS ============
def registrar_movimiento_stock(producto_id: str, producto_nombre: str, tipo: str, cantidad: int, 
                                referencia_id: str = None, referencia_tipo: str = None, 
                                usuario_id: str = None, usuario_email: str = None, stock_anterior: int = 0):
    stock_movimientos_col.insert_one({
        "producto_id": producto_id,
        "producto_nombre": producto_nombre,
        "tipo": tipo,  # entrada, salida, ajuste
        "cantidad": cantidad,
        "stock_anterior": stock_anterior,
        "stock_nuevo": stock_anterior + cantidad if tipo == "entrada" else stock_anterior - cantidad,
        "referencia_id": referencia_id,
        "referencia_tipo": referencia_tipo,  # venta, compra, ajuste
        "usuario_id": usuario_id,
        "usuario_email": usuario_email,
        "fecha": datetime.now(timezone.utc).isoformat()
    })

# ============ PYDANTIC MODELS ============
class LoginRequest(BaseModel):
    email: str
    password: str

class UsuarioCreate(BaseModel):
    email: str
    password: str
    nombre: str
    role: str = "usuario"
    permisos: Optional[dict] = None

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    role: Optional[str] = None
    permisos: Optional[dict] = None
    activo: Optional[bool] = None

class ProductoBase(BaseModel):
    codigo: str
    nombre: str
    variante: Optional[str] = ""
    categoria: str
    proveedor: str
    precio_con_iva: float
    iva_pct: int = 10
    costo: float
    stock: int = 0
    stock_minimo: int = 2
    margen: int = 15
    activo: bool = True

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    variante: Optional[str] = None
    categoria: Optional[str] = None
    proveedor: Optional[str] = None
    precio_con_iva: Optional[float] = None
    iva_pct: Optional[int] = None
    costo: Optional[float] = None
    stock: Optional[int] = None
    stock_minimo: Optional[int] = None
    margen: Optional[int] = None
    activo: Optional[bool] = None

class AjusteStock(BaseModel):
    cantidad: int
    motivo: str

class ClienteBase(BaseModel):
    nombre: str
    ruc: Optional[str] = ""
    telefono: Optional[str] = ""
    direccion: Optional[str] = ""
    ciudad: Optional[str] = ""
    tipo: str = "Odontólogo"
    activo: bool = True

class ProveedorBase(BaseModel):
    nombre: str
    ruc: Optional[str] = ""
    direccion: Optional[str] = ""
    contacto: Optional[str] = ""
    telefono: Optional[str] = ""
    activo: bool = True

class VentaItem(BaseModel):
    producto_id: str
    codigo: str
    nombre: str
    cantidad: int
    precio_unitario: float
    costo_unitario: float
    iva_pct: int = 10

class VentaBase(BaseModel):
    cliente_id: str
    cliente_nombre: str
    items: List[VentaItem]
    observaciones: Optional[str] = ""

class CompraItem(BaseModel):
    producto_id: str
    codigo: str
    nombre: str
    cantidad: int
    precio_unitario: float
    iva_pct: int = 10

class CompraBase(BaseModel):
    proveedor_id: str
    proveedor_nombre: str
    factura: Optional[str] = ""
    items: List[CompraItem]
    observaciones: Optional[str] = ""

class GastoBase(BaseModel):
    fecha: str
    categoria: str
    descripcion: str
    monto: float
    iva_pct: int = 10
    proveedor: Optional[str] = ""

def serialize_doc(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# ============ SEED ADMIN ============
def seed_admin():
    existing = usuarios_col.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        usuarios_col.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "nombre": "Andy Escudero",
            "role": "admin",
            "activo": True,
            "permisos": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"Admin creado: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        usuarios_col.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
        )
        print(f"Admin password actualizado: {ADMIN_EMAIL}")
    
    # Create indexes
    usuarios_col.create_index("email", unique=True)
    login_attempts_col.create_index("identifier")

# Run seed on startup
seed_admin()

# ============ HEALTH CHECK ============
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "PDS API"}

# ============ AUTH ENDPOINTS ============
@app.post("/api/auth/login")
def login(request: Request, response: Response, data: LoginRequest):
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{data.email}"
    
    # Check brute force
    attempts = login_attempts_col.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_time = attempts.get("last_attempt")
        if lockout_time:
            lockout_dt = datetime.fromisoformat(lockout_time)
            if datetime.now(timezone.utc) - lockout_dt < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Demasiados intentos. Intente en 15 minutos.")
            else:
                login_attempts_col.delete_one({"identifier": identifier})
    
    user = usuarios_col.find_one({"email": data.email.lower().strip()})
    if not user:
        user = usuarios_col.find_one({"email": data.email.strip()})
    
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        login_attempts_col.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not user.get("activo", True):
        raise HTTPException(status_code=401, detail="Usuario desactivado")
    
    # Clear failed attempts
    login_attempts_col.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["email"], user.get("role", "usuario"))
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=COOKIE_SECURE, samesite="lax", max_age=28800, path=COOKIE_PATH)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=COOKIE_SECURE, samesite="lax", max_age=604800, path=COOKIE_PATH)
    
    registrar_auditoria(user_id, user["email"], "login", "auth", {"ip": ip}, ip)
    
    return {
        "id": user_id,
        "email": user["email"],
        "nombre": user.get("nombre", ""),
        "role": user.get("role", "usuario"),
        "permisos": user.get("permisos", {})
    }

@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    try:
        user = get_current_user(request)
        registrar_auditoria(user["id"], user["email"], "logout", "auth")
    except:
        pass
    
    response.delete_cookie("access_token", path=COOKIE_PATH)
    response.delete_cookie("refresh_token", path=COOKIE_PATH)
    return {"message": "Sesión cerrada"}

@app.get("/api/auth/me")
def get_me(request: Request):
    return get_current_user(request)

@app.post("/api/auth/refresh")
def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No hay token de refresco")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = usuarios_col.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        access_token = create_access_token(str(user["_id"]), user["email"], user.get("role", "usuario"))
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=COOKIE_SECURE, samesite="lax", max_age=28800, path=COOKIE_PATH)
        
        return {"message": "Token renovado"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token de refresco expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============ USUARIOS (Admin only) ============
@app.get("/api/usuarios")
def get_usuarios(request: Request):
    user = require_admin(request)
    usuarios = list(usuarios_col.find({}, {"password_hash": 0}))
    return {"usuarios": serialize_docs(usuarios)}

@app.post("/api/usuarios")
def create_usuario(request: Request, data: UsuarioCreate):
    admin = require_admin(request)
    
    # Check if email exists
    if usuarios_col.find_one({"email": data.email.lower().strip()}):
        raise HTTPException(status_code=400, detail="El email ya existe")
    
    # Default permissions for usuarios
    default_permisos = {
        "dashboard": {"ver": True},
        "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
        "ventas": {"ver": True, "crear": True, "editar": False, "eliminar": False},
        "compras": {"ver": True, "crear": True, "editar": False, "eliminar": False},
        "clientes": {"ver": True, "crear": True, "editar": False, "eliminar": False},
        "proveedores": {"ver": True, "crear": False, "editar": False, "eliminar": False},
        "gastos": {"ver": True, "crear": True, "editar": False, "eliminar": False},
        "reportes": {"ver": True},
        "auditoria": {"ver": False},
        "usuarios": {"ver": False, "crear": False, "editar": False, "eliminar": False}
    }
    
    permisos = data.permisos if data.permisos else default_permisos
    
    usuario = {
        "email": data.email.lower().strip(),
        "password_hash": hash_password(data.password),
        "nombre": data.nombre,
        "role": data.role,
        "permisos": permisos,
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = usuarios_col.insert_one(usuario)
    
    registrar_auditoria(admin["id"], admin["email"], "crear_usuario", "usuarios", 
                        {"nuevo_usuario": data.email, "role": data.role})
    
    return {"id": str(result.inserted_id), "message": "Usuario creado"}

MODULOS_PERMISOS = {
    "dashboard": {"label": "Dashboard", "acciones": ["ver"]},
    "estadisticas": {"label": "Estadísticas", "acciones": ["ver"]},
    "productos": {"label": "Productos", "acciones": ["ver", "crear", "editar", "eliminar"]},
    "ventas": {"label": "Ventas", "acciones": ["ver", "crear"]},
    "compras": {"label": "Compras", "acciones": ["ver", "crear"]},
    "clientes": {"label": "Clientes", "acciones": ["ver", "crear", "editar", "eliminar"]},
    "proveedores": {"label": "Proveedores", "acciones": ["ver", "crear", "editar", "eliminar"]},
    "gastos": {"label": "Gastos", "acciones": ["ver", "crear"]},
    "reportes": {"label": "Reportes", "acciones": ["ver"]},
    "stock_historial": {"label": "Historial Stock", "acciones": ["ver"]},
    "auditoria": {"label": "Auditoría", "acciones": ["ver"]},
    "usuarios": {"label": "Usuarios", "acciones": ["ver", "crear", "editar", "eliminar"]}
}

@app.get("/api/permisos/modulos")
def get_modulos_permisos(request: Request):
    require_admin(request)
    return {"modulos": MODULOS_PERMISOS}

@app.put("/api/usuarios/{usuario_id}")
def update_usuario(request: Request, usuario_id: str, data: UsuarioUpdate):
    admin = require_admin(request)
    
    try:
        oid = ObjectId(usuario_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = usuarios_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    registrar_auditoria(admin["id"], admin["email"], "actualizar_usuario", "usuarios",
                        {"usuario_id": usuario_id, "cambios": list(update_data.keys())})
    
    return {"message": "Usuario actualizado"}

@app.put("/api/usuarios/{usuario_id}/password")
def change_password(request: Request, usuario_id: str, data: dict):
    admin = require_admin(request)
    
    try:
        oid = ObjectId(usuario_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    new_password = data.get("password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    result = usuarios_col.update_one(
        {"_id": oid},
        {"$set": {"password_hash": hash_password(new_password), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    registrar_auditoria(admin["id"], admin["email"], "cambiar_password", "usuarios",
                        {"usuario_id": usuario_id})
    
    return {"message": "Contraseña actualizada"}

@app.delete("/api/usuarios/{usuario_id}")
def delete_usuario(request: Request, usuario_id: str):
    admin = require_admin(request)
    
    try:
        oid = ObjectId(usuario_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    # Don't allow deleting self
    if usuario_id == admin["id"]:
        raise HTTPException(status_code=400, detail="No puede eliminarse a sí mismo")
    
    result = usuarios_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    registrar_auditoria(admin["id"], admin["email"], "desactivar_usuario", "usuarios",
                        {"usuario_id": usuario_id})
    
    return {"message": "Usuario desactivado"}

# ============ AUDITORÍA (Admin only) ============
@app.get("/api/auditoria")
def get_auditoria(
    request: Request,
    usuario_id: Optional[str] = None,
    modulo: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    user = require_admin(request)
    
    query = {}
    if usuario_id:
        query["usuario_id"] = usuario_id
    if modulo:
        query["modulo"] = modulo
    if fecha_desde:
        query["fecha"] = {"$gte": fecha_desde}
    if fecha_hasta:
        if "fecha" in query:
            query["fecha"]["$lte"] = fecha_hasta
        else:
            query["fecha"] = {"$lte": fecha_hasta}
    
    total = auditoria_col.count_documents(query)
    registros = list(auditoria_col.find(query).sort("fecha", -1).skip(skip).limit(limit))
    
    return {"total": total, "registros": serialize_docs(registros)}

# ============ STOCK MOVEMENTS ============
@app.get("/api/stock-movimientos")
def get_stock_movimientos(
    request: Request,
    producto_id: Optional[str] = None,
    tipo: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    user = get_current_user(request)
    
    query = {}
    if producto_id:
        query["producto_id"] = producto_id
    if tipo:
        query["tipo"] = tipo
    
    total = stock_movimientos_col.count_documents(query)
    movimientos = list(stock_movimientos_col.find(query).sort("fecha", -1).skip(skip).limit(limit))
    
    return {"total": total, "movimientos": serialize_docs(movimientos)}

@app.post("/api/productos/{producto_id}/ajuste-stock")
def ajustar_stock(request: Request, producto_id: str, data: AjusteStock):
    user = get_current_user(request)
    if not check_permission(user, "productos", "editar"):
        raise HTTPException(status_code=403, detail="Sin permiso para ajustar stock")
    
    try:
        oid = ObjectId(producto_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    producto = productos_col.find_one({"_id": oid})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    stock_anterior = producto.get("stock", 0)
    nuevo_stock = stock_anterior + data.cantidad
    
    if nuevo_stock < 0:
        raise HTTPException(status_code=400, detail="El stock no puede ser negativo")
    
    productos_col.update_one({"_id": oid}, {"$set": {"stock": nuevo_stock}})
    
    tipo = "entrada" if data.cantidad > 0 else "salida"
    registrar_movimiento_stock(
        producto_id=producto_id,
        producto_nombre=producto.get("nombre", ""),
        tipo=tipo,
        cantidad=abs(data.cantidad),
        referencia_tipo="ajuste",
        usuario_id=user["id"],
        usuario_email=user["email"],
        stock_anterior=stock_anterior
    )
    
    registrar_auditoria(user["id"], user["email"], "ajuste_stock", "productos",
                        {"producto_id": producto_id, "cantidad": data.cantidad, "motivo": data.motivo})
    
    return {"message": "Stock ajustado", "stock_anterior": stock_anterior, "stock_nuevo": nuevo_stock}

# ============ DASHBOARD ============
@app.get("/api/dashboard")
def get_dashboard(request: Request):
    user = get_current_user(request)
    
    total_productos = productos_col.count_documents({"activo": True})
    
    pipeline = [
        {"$match": {"activo": True}},
        {"$group": {
            "_id": None,
            "valor_stock_costo": {"$sum": {"$multiply": ["$stock", "$costo"]}},
            "valor_stock_venta": {"$sum": {"$multiply": ["$stock", "$precio_con_iva"]}},
            "productos_sin_stock": {"$sum": {"$cond": [{"$lte": ["$stock", 0]}, 1, 0]}},
            "productos_bajo_minimo": {"$sum": {"$cond": [{"$lt": ["$stock", "$stock_minimo"]}, 1, 0]}}
        }}
    ]
    stock_stats = list(productos_col.aggregate(pipeline))
    stock_data = stock_stats[0] if stock_stats else {
        "valor_stock_costo": 0, "valor_stock_venta": 0, "productos_sin_stock": 0, "productos_bajo_minimo": 0
    }
    
    ventas_pipeline = [
        {"$group": {
            "_id": None,
            "total_ventas": {"$sum": "$total"},
            "total_costo": {"$sum": "$total_costo"},
            "cantidad_ventas": {"$sum": 1}
        }}
    ]
    ventas_stats = list(ventas_col.aggregate(ventas_pipeline))
    ventas_data = ventas_stats[0] if ventas_stats else {"total_ventas": 0, "total_costo": 0, "cantidad_ventas": 0}
    
    compras_pipeline = [
        {"$group": {"_id": None, "total_compras": {"$sum": "$total"}, "cantidad_compras": {"$sum": 1}}}
    ]
    compras_stats = list(compras_col.aggregate(compras_pipeline))
    compras_data = compras_stats[0] if compras_stats else {"total_compras": 0, "cantidad_compras": 0}
    
    gastos_pipeline = [{"$group": {"_id": None, "total_gastos": {"$sum": "$monto"}}}]
    gastos_stats = list(gastos_col.aggregate(gastos_pipeline))
    gastos_data = gastos_stats[0] if gastos_stats else {"total_gastos": 0}
    
    top_productos = list(ventas_col.aggregate([
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.producto_id",
            "nombre": {"$first": "$items.nombre"},
            "cantidad": {"$sum": "$items.cantidad"},
            "total": {"$sum": {"$multiply": ["$items.cantidad", "$items.precio_unitario"]}}
        }},
        {"$sort": {"cantidad": -1}},
        {"$limit": 5}
    ]))
    
    top_clientes = list(ventas_col.aggregate([
        {"$group": {
            "_id": "$cliente_id",
            "nombre": {"$first": "$cliente_nombre"},
            "total_compras": {"$sum": "$total"},
            "cantidad_compras": {"$sum": 1}
        }},
        {"$sort": {"total_compras": -1}},
        {"$limit": 5}
    ]))
    
    bajo_stock = list(productos_col.find(
        {"$expr": {"$lt": ["$stock", "$stock_minimo"]}, "activo": True},
        {"_id": 0, "codigo": 1, "nombre": 1, "stock": 1, "stock_minimo": 1}
    ).limit(10))
    
    utilidad_bruta = ventas_data.get("total_ventas", 0) - ventas_data.get("total_costo", 0)
    
    return {
        "resumen": {
            "total_productos": total_productos,
            "valor_stock_costo": stock_data.get("valor_stock_costo", 0),
            "valor_stock_venta": stock_data.get("valor_stock_venta", 0),
            "productos_sin_stock": stock_data.get("productos_sin_stock", 0),
            "productos_bajo_minimo": stock_data.get("productos_bajo_minimo", 0),
            "total_ventas": ventas_data.get("total_ventas", 0),
            "cantidad_ventas": ventas_data.get("cantidad_ventas", 0),
            "total_compras": compras_data.get("total_compras", 0),
            "cantidad_compras": compras_data.get("cantidad_compras", 0),
            "total_gastos": gastos_data.get("total_gastos", 0),
            "utilidad_bruta": utilidad_bruta,
            "total_clientes": clientes_col.count_documents({"activo": True}),
            "total_proveedores": proveedores_col.count_documents({"activo": True})
        },
        "top_productos": top_productos,
        "top_clientes": top_clientes,
        "bajo_stock": bajo_stock
    }

# ============ PRODUCTOS ============
@app.get("/api/productos")
def get_productos(
    request: Request,
    search: Optional[str] = None,
    categoria: Optional[str] = None,
    proveedor: Optional[str] = None,
    bajo_stock: Optional[bool] = False,
    skip: int = 0,
    limit: int = 50
):
    user = get_current_user(request)
    
    query = {"activo": True}
    if search:
        query["$or"] = [
            {"codigo": {"$regex": search, "$options": "i"}},
            {"nombre": {"$regex": search, "$options": "i"}},
            {"variante": {"$regex": search, "$options": "i"}}
        ]
    if categoria:
        query["categoria"] = categoria
    if proveedor:
        query["proveedor"] = proveedor
    if bajo_stock:
        query["$expr"] = {"$lt": ["$stock", "$stock_minimo"]}
    
    total = productos_col.count_documents(query)
    productos = list(productos_col.find(query).skip(skip).limit(limit))
    
    return {"total": total, "productos": serialize_docs(productos)}

@app.get("/api/productos/{producto_id}")
def get_producto(request: Request, producto_id: str):
    user = get_current_user(request)
    
    try:
        producto = productos_col.find_one({"_id": ObjectId(producto_id)})
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return serialize_doc(producto)

@app.post("/api/productos")
def create_producto(request: Request, producto: ProductoBase):
    user = get_current_user(request)
    if not check_permission(user, "productos", "crear"):
        raise HTTPException(status_code=403, detail="Sin permiso para crear productos")
    
    if productos_col.find_one({"codigo": producto.codigo}):
        raise HTTPException(status_code=400, detail="El código ya existe")
    
    data = producto.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["created_by"] = user["id"]
    result = productos_col.insert_one(data)
    
    registrar_auditoria(user["id"], user["email"], "crear", "productos",
                        {"producto_id": str(result.inserted_id), "codigo": producto.codigo})
    
    if producto.stock > 0:
        registrar_movimiento_stock(
            producto_id=str(result.inserted_id),
            producto_nombre=producto.nombre,
            tipo="entrada",
            cantidad=producto.stock,
            referencia_tipo="inicial",
            usuario_id=user["id"],
            usuario_email=user["email"],
            stock_anterior=0
        )
    
    return {"id": str(result.inserted_id), "message": "Producto creado"}

@app.put("/api/productos/{producto_id}")
def update_producto(request: Request, producto_id: str, producto: ProductoUpdate):
    user = get_current_user(request)
    if not check_permission(user, "productos", "editar"):
        raise HTTPException(status_code=403, detail="Sin permiso para editar productos")
    
    try:
        oid = ObjectId(producto_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = {k: v for k, v in producto.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = user["id"]
    result = productos_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    registrar_auditoria(user["id"], user["email"], "actualizar", "productos",
                        {"producto_id": producto_id, "cambios": list(update_data.keys())})
    
    return {"message": "Producto actualizado"}

@app.delete("/api/productos/{producto_id}")
def delete_producto(request: Request, producto_id: str):
    user = get_current_user(request)
    if not check_permission(user, "productos", "eliminar"):
        raise HTTPException(status_code=403, detail="Sin permiso para eliminar productos")
    
    try:
        oid = ObjectId(producto_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    result = productos_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    registrar_auditoria(user["id"], user["email"], "eliminar", "productos", {"producto_id": producto_id})
    
    return {"message": "Producto eliminado"}

@app.get("/api/categorias")
def get_categorias(request: Request):
    user = get_current_user(request)
    categorias = productos_col.distinct("categoria", {"activo": True})
    return {"categorias": sorted([c for c in categorias if c])}

# ============ CLIENTES ============
@app.get("/api/clientes")
def get_clientes(request: Request, search: Optional[str] = None):
    user = get_current_user(request)
    
    query = {"activo": True}
    if search:
        query["$or"] = [
            {"nombre": {"$regex": search, "$options": "i"}},
            {"telefono": {"$regex": search, "$options": "i"}}
        ]
    
    clientes = list(clientes_col.find(query))
    return {"clientes": serialize_docs(clientes)}

@app.post("/api/clientes")
def create_cliente(request: Request, cliente: ClienteBase):
    user = get_current_user(request)
    if not check_permission(user, "clientes", "crear"):
        raise HTTPException(status_code=403, detail="Sin permiso para crear clientes")
    
    data = cliente.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["created_by"] = user["id"]
    data["total_compras"] = 0
    result = clientes_col.insert_one(data)
    
    registrar_auditoria(user["id"], user["email"], "crear", "clientes",
                        {"cliente_id": str(result.inserted_id), "nombre": cliente.nombre})
    
    return {"id": str(result.inserted_id), "message": "Cliente creado"}

@app.put("/api/clientes/{cliente_id}")
def update_cliente(request: Request, cliente_id: str, cliente: ClienteBase):
    user = get_current_user(request)
    if not check_permission(user, "clientes", "editar"):
        raise HTTPException(status_code=403, detail="Sin permiso para editar clientes")
    
    try:
        oid = ObjectId(cliente_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = cliente.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = clientes_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    registrar_auditoria(user["id"], user["email"], "actualizar", "clientes", {"cliente_id": cliente_id})
    
    return {"message": "Cliente actualizado"}

@app.delete("/api/clientes/{cliente_id}")
def delete_cliente(request: Request, cliente_id: str):
    user = get_current_user(request)
    if not check_permission(user, "clientes", "eliminar"):
        raise HTTPException(status_code=403, detail="Sin permiso para eliminar clientes")
    
    try:
        oid = ObjectId(cliente_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    result = clientes_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    registrar_auditoria(user["id"], user["email"], "eliminar", "clientes", {"cliente_id": cliente_id})
    
    return {"message": "Cliente eliminado"}

# ============ PROVEEDORES ============
@app.get("/api/proveedores")
def get_proveedores(request: Request, search: Optional[str] = None):
    user = get_current_user(request)
    
    query = {"activo": True}
    if search:
        query["nombre"] = {"$regex": search, "$options": "i"}
    
    proveedores = list(proveedores_col.find(query))
    return {"proveedores": serialize_docs(proveedores)}

@app.post("/api/proveedores")
def create_proveedor(request: Request, proveedor: ProveedorBase):
    user = get_current_user(request)
    if not check_permission(user, "proveedores", "crear"):
        raise HTTPException(status_code=403, detail="Sin permiso para crear proveedores")
    
    data = proveedor.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["created_by"] = user["id"]
    data["total_compras"] = 0
    result = proveedores_col.insert_one(data)
    
    registrar_auditoria(user["id"], user["email"], "crear", "proveedores",
                        {"proveedor_id": str(result.inserted_id), "nombre": proveedor.nombre})
    
    return {"id": str(result.inserted_id), "message": "Proveedor creado"}

@app.put("/api/proveedores/{proveedor_id}")
def update_proveedor(request: Request, proveedor_id: str, proveedor: ProveedorBase):
    user = get_current_user(request)
    if not check_permission(user, "proveedores", "editar"):
        raise HTTPException(status_code=403, detail="Sin permiso para editar proveedores")
    
    try:
        oid = ObjectId(proveedor_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = proveedor.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = proveedores_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    registrar_auditoria(user["id"], user["email"], "actualizar", "proveedores", {"proveedor_id": proveedor_id})
    
    return {"message": "Proveedor actualizado"}

@app.delete("/api/proveedores/{proveedor_id}")
def delete_proveedor(request: Request, proveedor_id: str):
    user = get_current_user(request)
    if not check_permission(user, "proveedores", "eliminar"):
        raise HTTPException(status_code=403, detail="Sin permiso para eliminar proveedores")
    
    try:
        oid = ObjectId(proveedor_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    result = proveedores_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    registrar_auditoria(user["id"], user["email"], "eliminar", "proveedores", {"proveedor_id": proveedor_id})
    
    return {"message": "Proveedor eliminado"}

# ============ VENTAS ============
@app.get("/api/ventas")
def get_ventas(
    request: Request,
    cliente_id: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    user = get_current_user(request)
    
    query = {}
    if cliente_id:
        query["cliente_id"] = cliente_id
    if fecha_desde:
        query["fecha"] = {"$gte": fecha_desde}
    if fecha_hasta:
        if "fecha" in query:
            query["fecha"]["$lte"] = fecha_hasta
        else:
            query["fecha"] = {"$lte": fecha_hasta}
    
    total = ventas_col.count_documents(query)
    ventas = list(ventas_col.find(query).sort("fecha", -1).skip(skip).limit(limit))
    
    return {"total": total, "ventas": serialize_docs(ventas)}

@app.post("/api/ventas")
def create_venta(request: Request, venta: VentaBase):
    user = get_current_user(request)
    if not check_permission(user, "ventas", "crear"):
        raise HTTPException(status_code=403, detail="Sin permiso para crear ventas")
    
    total = 0
    total_costo = 0
    total_iva = 0
    
    for item in venta.items:
        try:
            producto = productos_col.find_one({"_id": ObjectId(item.producto_id)})
        except:
            raise HTTPException(status_code=400, detail=f"Producto ID inválido: {item.producto_id}")
        
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto no encontrado: {item.codigo}")
        
        if producto["stock"] < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {item.nombre}. Disponible: {producto['stock']}"
            )
        
        subtotal = item.cantidad * item.precio_unitario
        iva = subtotal * item.iva_pct / (100 + item.iva_pct)
        
        total += subtotal
        total_costo += item.cantidad * item.costo_unitario
        total_iva += iva
    
    venta_data = {
        "cliente_id": venta.cliente_id,
        "cliente_nombre": venta.cliente_nombre,
        "items": [item.model_dump() for item in venta.items],
        "total": total,
        "total_costo": total_costo,
        "total_iva": total_iva,
        "utilidad": total - total_costo,
        "observaciones": venta.observaciones,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
        "vendedor": user["email"]
    }
    
    result = ventas_col.insert_one(venta_data)
    
    # Update stock and record movements
    for item in venta.items:
        producto = productos_col.find_one({"_id": ObjectId(item.producto_id)})
        stock_anterior = producto.get("stock", 0)
        
        productos_col.update_one(
            {"_id": ObjectId(item.producto_id)},
            {"$inc": {"stock": -item.cantidad}}
        )
        
        registrar_movimiento_stock(
            producto_id=item.producto_id,
            producto_nombre=item.nombre,
            tipo="salida",
            cantidad=item.cantidad,
            referencia_id=str(result.inserted_id),
            referencia_tipo="venta",
            usuario_id=user["id"],
            usuario_email=user["email"],
            stock_anterior=stock_anterior
        )
    
    clientes_col.update_one(
        {"_id": ObjectId(venta.cliente_id)},
        {
            "$inc": {"total_compras": total},
            "$set": {"ultima_compra": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    registrar_auditoria(user["id"], user["email"], "crear", "ventas",
                        {"venta_id": str(result.inserted_id), "total": total, "cliente": venta.cliente_nombre})
    
    return {
        "id": str(result.inserted_id),
        "message": "Venta registrada",
        "total": total,
        "utilidad": total - total_costo
    }

# ============ COMPRAS ============
@app.get("/api/compras")
def get_compras(
    request: Request,
    proveedor_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    user = get_current_user(request)
    
    query = {}
    if proveedor_id:
        query["proveedor_id"] = proveedor_id
    
    total = compras_col.count_documents(query)
    compras = list(compras_col.find(query).sort("fecha", -1).skip(skip).limit(limit))
    
    return {"total": total, "compras": serialize_docs(compras)}

@app.post("/api/compras")
def create_compra(request: Request, compra: CompraBase):
    user = get_current_user(request)
    if not check_permission(user, "compras", "crear"):
        raise HTTPException(status_code=403, detail="Sin permiso para crear compras")
    
    total = 0
    total_iva = 0
    
    for item in compra.items:
        subtotal = item.cantidad * item.precio_unitario
        iva = subtotal * item.iva_pct / (100 + item.iva_pct)
        total += subtotal
        total_iva += iva
    
    compra_data = {
        "proveedor_id": compra.proveedor_id,
        "proveedor_nombre": compra.proveedor_nombre,
        "factura": compra.factura,
        "items": [item.model_dump() for item in compra.items],
        "total": total,
        "total_iva": total_iva,
        "observaciones": compra.observaciones,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    
    result = compras_col.insert_one(compra_data)
    
    # Update stock and cost
    for item in compra.items:
        producto = productos_col.find_one({"_id": ObjectId(item.producto_id)})
        stock_anterior = producto.get("stock", 0) if producto else 0
        
        productos_col.update_one(
            {"_id": ObjectId(item.producto_id)},
            {
                "$inc": {"stock": item.cantidad},
                "$set": {"costo": item.precio_unitario * (1 - item.iva_pct/(100+item.iva_pct))}
            }
        )
        
        registrar_movimiento_stock(
            producto_id=item.producto_id,
            producto_nombre=item.nombre,
            tipo="entrada",
            cantidad=item.cantidad,
            referencia_id=str(result.inserted_id),
            referencia_tipo="compra",
            usuario_id=user["id"],
            usuario_email=user["email"],
            stock_anterior=stock_anterior
        )
    
    proveedores_col.update_one(
        {"_id": ObjectId(compra.proveedor_id)},
        {
            "$inc": {"total_compras": total},
            "$set": {"ultima_compra": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    registrar_auditoria(user["id"], user["email"], "crear", "compras",
                        {"compra_id": str(result.inserted_id), "total": total, "proveedor": compra.proveedor_nombre})
    
    return {"id": str(result.inserted_id), "message": "Compra registrada", "total": total}

# ============ GASTOS ============
@app.get("/api/gastos")
def get_gastos(request: Request, skip: int = 0, limit: int = 50):
    user = get_current_user(request)
    
    total = gastos_col.count_documents({})
    gastos = list(gastos_col.find({}).sort("fecha", -1).skip(skip).limit(limit))
    return {"total": total, "gastos": serialize_docs(gastos)}

@app.post("/api/gastos")
def create_gasto(request: Request, gasto: GastoBase):
    user = get_current_user(request)
    if not check_permission(user, "gastos", "crear"):
        raise HTTPException(status_code=403, detail="Sin permiso para crear gastos")
    
    data = gasto.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["created_by"] = user["id"]
    result = gastos_col.insert_one(data)
    
    registrar_auditoria(user["id"], user["email"], "crear", "gastos",
                        {"gasto_id": str(result.inserted_id), "monto": gasto.monto})
    
    return {"id": str(result.inserted_id), "message": "Gasto registrado"}

# ============ REPORTES ============
@app.get("/api/reportes/ventas")
def reporte_ventas(
    request: Request,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    formato: str = "json"
):
    user = get_current_user(request)
    
    query = {}
    if fecha_desde:
        query["fecha"] = {"$gte": fecha_desde}
    if fecha_hasta:
        if "fecha" in query:
            query["fecha"]["$lte"] = fecha_hasta
        else:
            query["fecha"] = {"$lte": fecha_hasta}
    
    ventas = list(ventas_col.find(query).sort("fecha", -1))
    
    if formato == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Fecha", "Cliente", "Total", "Costo", "Utilidad", "Vendedor"])
        for v in ventas:
            writer.writerow([
                v.get("fecha", "")[:10],
                v.get("cliente_nombre", ""),
                v.get("total", 0),
                v.get("total_costo", 0),
                v.get("utilidad", 0),
                v.get("vendedor", "")
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=reporte_ventas.csv"}
        )
    
    total_ventas = sum(v.get("total", 0) for v in ventas)
    total_costo = sum(v.get("total_costo", 0) for v in ventas)
    total_utilidad = sum(v.get("utilidad", 0) for v in ventas)
    
    return {
        "resumen": {
            "total_ventas": total_ventas,
            "total_costo": total_costo,
            "total_utilidad": total_utilidad,
            "cantidad_ventas": len(ventas)
        },
        "ventas": serialize_docs(ventas)
    }

@app.get("/api/reportes/productos")
def reporte_productos(request: Request, formato: str = "json"):
    user = get_current_user(request)
    
    productos = list(productos_col.find({"activo": True}))
    
    if formato == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Código", "Nombre", "Categoría", "Proveedor", "Costo", "Precio", "Stock", "Valor Stock"])
        for p in productos:
            writer.writerow([
                p.get("codigo", ""),
                p.get("nombre", ""),
                p.get("categoria", ""),
                p.get("proveedor", ""),
                p.get("costo", 0),
                p.get("precio_con_iva", 0),
                p.get("stock", 0),
                p.get("stock", 0) * p.get("precio_con_iva", 0)
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=reporte_productos.csv"}
        )
    
    return {"total": len(productos), "productos": serialize_docs(productos)}

@app.get("/api/reportes/stock-movimientos")
def reporte_stock_movimientos(
    request: Request,
    producto_id: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    formato: str = "json"
):
    user = get_current_user(request)
    
    query = {}
    if producto_id:
        query["producto_id"] = producto_id
    if fecha_desde:
        query["fecha"] = {"$gte": fecha_desde}
    if fecha_hasta:
        if "fecha" in query:
            query["fecha"]["$lte"] = fecha_hasta
        else:
            query["fecha"] = {"$lte": fecha_hasta}
    
    movimientos = list(stock_movimientos_col.find(query).sort("fecha", -1))
    
    if formato == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Fecha", "Producto", "Tipo", "Cantidad", "Stock Anterior", "Stock Nuevo", "Referencia", "Usuario"])
        for m in movimientos:
            writer.writerow([
                m.get("fecha", "")[:19],
                m.get("producto_nombre", ""),
                m.get("tipo", ""),
                m.get("cantidad", 0),
                m.get("stock_anterior", 0),
                m.get("stock_nuevo", 0),
                m.get("referencia_tipo", ""),
                m.get("usuario_email", "")
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=reporte_movimientos_stock.csv"}
        )
    
    return {"total": len(movimientos), "movimientos": serialize_docs(movimientos)}

# ============ DASHBOARD CONFIG ============
# Plantillas predefinidas
DASHBOARD_TEMPLATES = {
    "ejecutivo": {
        "nombre": "Ejecutivo",
        "descripcion": "Visión general para administradores - Balance de todas las áreas",
        "widgets": [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2},
            {"i": "stat-compras", "x": 3, "y": 0, "w": 3, "h": 2},
            {"i": "stat-utilidad", "x": 6, "y": 0, "w": 3, "h": 2},
            {"i": "stat-gastos", "x": 9, "y": 0, "w": 3, "h": 2},
            {"i": "meta-ventas", "x": 0, "y": 2, "w": 4, "h": 3},
            {"i": "chart-ventas-periodo", "x": 4, "y": 2, "w": 8, "h": 3},
            {"i": "chart-top-productos", "x": 0, "y": 5, "w": 6, "h": 4},
            {"i": "chart-top-clientes", "x": 6, "y": 5, "w": 6, "h": 4},
            {"i": "alerta-stock", "x": 0, "y": 9, "w": 12, "h": 2},
        ]
    },
    "ventas": {
        "nombre": "Ventas",
        "descripcion": "Enfocado en rendimiento de ventas y clientes",
        "widgets": [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 4, "h": 2},
            {"i": "stat-utilidad", "x": 4, "y": 0, "w": 4, "h": 2},
            {"i": "meta-ventas", "x": 8, "y": 0, "w": 4, "h": 3},
            {"i": "chart-ventas-periodo", "x": 0, "y": 2, "w": 8, "h": 4},
            {"i": "chart-top-productos", "x": 0, "y": 6, "w": 6, "h": 4},
            {"i": "chart-top-clientes", "x": 6, "y": 6, "w": 6, "h": 4},
            {"i": "table-top-productos", "x": 0, "y": 10, "w": 6, "h": 3},
            {"i": "table-top-clientes", "x": 6, "y": 10, "w": 6, "h": 3},
        ]
    },
    "inventario": {
        "nombre": "Inventario",
        "descripcion": "Control de stock y movimientos",
        "widgets": [
            {"i": "stat-productos", "x": 0, "y": 0, "w": 3, "h": 2},
            {"i": "stat-stock-valor", "x": 3, "y": 0, "w": 3, "h": 2},
            {"i": "stat-sin-stock", "x": 6, "y": 0, "w": 3, "h": 2},
            {"i": "stat-bajo-minimo", "x": 9, "y": 0, "w": 3, "h": 2},
            {"i": "chart-stock-categoria", "x": 0, "y": 2, "w": 6, "h": 4},
            {"i": "chart-compras-periodo", "x": 6, "y": 2, "w": 6, "h": 4},
            {"i": "alerta-stock", "x": 0, "y": 6, "w": 12, "h": 3},
            {"i": "chart-compras-proveedor", "x": 0, "y": 9, "w": 12, "h": 4},
        ]
    },
    "analitico": {
        "nombre": "Analítico",
        "descripcion": "Todos los gráficos para análisis profundo",
        "widgets": [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 2, "h": 2},
            {"i": "stat-compras", "x": 2, "y": 0, "w": 2, "h": 2},
            {"i": "stat-utilidad", "x": 4, "y": 0, "w": 2, "h": 2},
            {"i": "stat-gastos", "x": 6, "y": 0, "w": 2, "h": 2},
            {"i": "stat-productos", "x": 8, "y": 0, "w": 2, "h": 2},
            {"i": "stat-stock-valor", "x": 10, "y": 0, "w": 2, "h": 2},
            {"i": "chart-ventas-periodo", "x": 0, "y": 2, "w": 6, "h": 3},
            {"i": "chart-compras-periodo", "x": 6, "y": 2, "w": 6, "h": 3},
            {"i": "chart-top-productos", "x": 0, "y": 5, "w": 6, "h": 4},
            {"i": "chart-stock-categoria", "x": 6, "y": 5, "w": 6, "h": 4},
            {"i": "chart-top-clientes", "x": 0, "y": 9, "w": 6, "h": 3},
            {"i": "chart-gastos-categoria", "x": 6, "y": 9, "w": 6, "h": 3},
        ]
    }
}

@app.get("/api/dashboard/templates")
def get_dashboard_templates(request: Request):
    user = get_current_user(request)
    return {"templates": DASHBOARD_TEMPLATES}

@app.get("/api/dashboard/config")
def get_dashboard_config(request: Request):
    user = get_current_user(request)
    
    config = dashboard_config_col.find_one({"usuario_id": user["id"]})
    if config:
        return {
            "template": config.get("template", "ejecutivo"),
            "layout": config.get("layout", DASHBOARD_TEMPLATES["ejecutivo"]["widgets"]),
            "custom": config.get("custom", False)
        }
    
    # Default for new users
    return {
        "template": "ejecutivo",
        "layout": DASHBOARD_TEMPLATES["ejecutivo"]["widgets"],
        "custom": False
    }

@app.post("/api/dashboard/config")
def save_dashboard_config(request: Request, data: dict):
    user = get_current_user(request)
    
    config_data = {
        "usuario_id": user["id"],
        "template": data.get("template", "ejecutivo"),
        "layout": data.get("layout", []),
        "custom": data.get("custom", False),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    dashboard_config_col.update_one(
        {"usuario_id": user["id"]},
        {"$set": config_data},
        upsert=True
    )
    
    registrar_auditoria(user["id"], user["email"], "actualizar_dashboard", "configuracion",
                        {"template": config_data["template"], "custom": config_data["custom"]})
    
    return {"message": "Configuración guardada"}

# ============ METAS DE VENTAS ============
class MetaVentas(BaseModel):
    periodo: str  # mes actual: "2026-04"
    meta_ventas: float
    meta_utilidad: Optional[float] = None
    meta_cantidad: Optional[int] = None

@app.get("/api/metas")
def get_metas(request: Request):
    user = get_current_user(request)
    
    # Get current month
    now = datetime.now(timezone.utc)
    periodo_actual = now.strftime("%Y-%m")
    
    meta = metas_col.find_one({"periodo": periodo_actual})
    
    # Calculate current progress
    inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    ventas_mes = list(ventas_col.aggregate([
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$gte": inicio_mes}}},
        {"$group": {
            "_id": None,
            "total_ventas": {"$sum": "$total"},
            "total_utilidad": {"$sum": "$utilidad"},
            "cantidad": {"$sum": 1}
        }}
    ]))
    
    progreso = ventas_mes[0] if ventas_mes else {"total_ventas": 0, "total_utilidad": 0, "cantidad": 0}
    
    if meta:
        return {
            "periodo": periodo_actual,
            "meta_ventas": meta.get("meta_ventas", 0),
            "meta_utilidad": meta.get("meta_utilidad", 0),
            "meta_cantidad": meta.get("meta_cantidad", 0),
            "actual_ventas": progreso.get("total_ventas", 0),
            "actual_utilidad": progreso.get("total_utilidad", 0),
            "actual_cantidad": progreso.get("cantidad", 0),
            "porcentaje_ventas": min(100, (progreso.get("total_ventas", 0) / meta.get("meta_ventas", 1)) * 100) if meta.get("meta_ventas", 0) > 0 else 0,
            "porcentaje_utilidad": min(100, (progreso.get("total_utilidad", 0) / meta.get("meta_utilidad", 1)) * 100) if meta.get("meta_utilidad", 0) > 0 else 0,
            "tiene_meta": True
        }
    
    return {
        "periodo": periodo_actual,
        "meta_ventas": 0,
        "meta_utilidad": 0,
        "meta_cantidad": 0,
        "actual_ventas": progreso.get("total_ventas", 0),
        "actual_utilidad": progreso.get("total_utilidad", 0),
        "actual_cantidad": progreso.get("cantidad", 0),
        "porcentaje_ventas": 0,
        "porcentaje_utilidad": 0,
        "tiene_meta": False
    }

@app.post("/api/metas")
def set_meta(request: Request, data: MetaVentas):
    user = get_current_user(request)
    
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden definir metas")
    
    meta_data = {
        "periodo": data.periodo,
        "meta_ventas": data.meta_ventas,
        "meta_utilidad": data.meta_utilidad or 0,
        "meta_cantidad": data.meta_cantidad or 0,
        "created_by": user["id"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    metas_col.update_one(
        {"periodo": data.periodo},
        {"$set": meta_data},
        upsert=True
    )
    
    registrar_auditoria(user["id"], user["email"], "definir_meta", "metas",
                        {"periodo": data.periodo, "meta_ventas": data.meta_ventas})
    
    return {"message": "Meta guardada"}

@app.get("/api/metas/historial")
def get_metas_historial(request: Request, limite: int = 12):
    user = get_current_user(request)
    
    metas = list(metas_col.find({}).sort("periodo", -1).limit(limite))
    
    resultado = []
    for meta in metas:
        periodo = meta["periodo"]
        
        # Get actual sales for that period
        ventas = list(ventas_col.aggregate([
            {"$addFields": {"mes": {"$substr": ["$fecha", 0, 7]}}},
            {"$match": {"mes": periodo}},
            {"$group": {
                "_id": None,
                "total_ventas": {"$sum": "$total"},
                "total_utilidad": {"$sum": "$utilidad"}
            }}
        ]))
        
        actual = ventas[0] if ventas else {"total_ventas": 0, "total_utilidad": 0}
        
        resultado.append({
            "periodo": periodo,
            "meta_ventas": meta.get("meta_ventas", 0),
            "actual_ventas": actual.get("total_ventas", 0),
            "cumplimiento": (actual.get("total_ventas", 0) / meta.get("meta_ventas", 1)) * 100 if meta.get("meta_ventas", 0) > 0 else 0
        })
    
    return {"historial": resultado}

# ============ PERFIL DE USUARIO ============
@app.get("/api/perfil")
def get_perfil(request: Request):
    user = get_current_user(request)
    u = usuarios_col.find_one({"_id": ObjectId(user["id"])}, {"password_hash": 0})
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "nombre": u.get("nombre", ""),
        "telefono": u.get("telefono", ""),
        "direccion": u.get("direccion", ""),
        "ciudad": u.get("ciudad", ""),
        "foto_url": u.get("foto_url", ""),
        "role": u.get("role", "usuario"),
        "created_at": u.get("created_at", "")
    }

@app.put("/api/perfil")
def update_perfil(request: Request, data: dict):
    user = get_current_user(request)
    allowed = ["nombre", "telefono", "direccion", "ciudad"]
    update_data = {k: v for k, v in data.items() if k in allowed and v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Sin datos para actualizar")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    usuarios_col.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
    registrar_auditoria(user["id"], user["email"], "actualizar_perfil", "usuarios", {"campos": list(update_data.keys())})
    return {"message": "Perfil actualizado"}

@app.put("/api/perfil/password")
def change_own_password(request: Request, data: dict):
    user = get_current_user(request)
    u = usuarios_col.find_one({"_id": ObjectId(user["id"])})
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not bcrypt.checkpw(data.get("password_actual", "").encode('utf-8'), u["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    new_pass = data.get("password_nueva", "")
    if len(new_pass) < 4:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 4 caracteres")
    new_hash = bcrypt.hashpw(new_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    usuarios_col.update_one({"_id": ObjectId(user["id"])}, {"$set": {"password_hash": new_hash}})
    registrar_auditoria(user["id"], user["email"], "cambiar_password_propia", "usuarios", {})
    return {"message": "Contraseña actualizada"}

@app.post("/api/perfil/foto")
async def upload_foto(request: Request):
    user = get_current_user(request)
    form = await request.form()
    file = form.get("foto")
    if not file:
        raise HTTPException(status_code=400, detail="No se envió archivo")
    import base64
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo muy grande (máx 2MB)")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Solo imágenes jpg, png, webp")
    b64 = base64.b64encode(content).decode('utf-8')
    foto_url = f"data:image/{ext};base64,{b64}"
    usuarios_col.update_one({"_id": ObjectId(user["id"])}, {"$set": {"foto_url": foto_url}})
    registrar_auditoria(user["id"], user["email"], "cambiar_foto", "usuarios", {})
    return {"message": "Foto actualizada", "foto_url": foto_url}

# ============ ESTADÍSTICAS CON RANGO DE FECHAS ============
def _fecha_match(fecha_desde, fecha_hasta):
    """Build a $match stage for date filtering on string dates."""
    if not fecha_desde and not fecha_hasta:
        return None
    match = {}
    if fecha_desde:
        match["$gte"] = fecha_desde
    if fecha_hasta:
        match["$lte"] = fecha_hasta + "T23:59:59"
    return {"$match": {"fecha": match}}

@app.get("/api/estadisticas/producto-detalle")
def estadisticas_producto_detalle(request: Request, producto_id: str, periodo: str = "mes", limite: int = 12):
    """Estadísticas detalladas de un producto específico: ventas y compras por periodo."""
    user = get_current_user(request)
    if periodo == "dia":
        gf = "%Y-%m-%d"
    elif periodo == "semana":
        gf = "%Y-W%V"
    elif periodo == "año":
        gf = "%Y"
    else:
        gf = "%Y-%m"

    # Ventas del producto
    ventas_pipeline = [
        {"$unwind": "$items"},
        {"$match": {"items.producto_id": producto_id}},
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {
            "_id": {"$dateToString": {"format": gf, "date": "$fecha_parsed"}},
            "cantidad": {"$sum": "$items.cantidad"},
            "total": {"$sum": {"$multiply": ["$items.cantidad", "$items.precio_unitario"]}},
            "utilidad": {"$sum": {"$multiply": ["$items.cantidad", {"$subtract": ["$items.precio_unitario", "$items.costo_unitario"]}]}}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": limite}
    ]
    ventas = list(ventas_col.aggregate(ventas_pipeline))
    ventas.reverse()

    # Compras del producto
    compras_pipeline = [
        {"$unwind": "$items"},
        {"$match": {"items.producto_id": producto_id}},
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {
            "_id": {"$dateToString": {"format": gf, "date": "$fecha_parsed"}},
            "cantidad": {"$sum": "$items.cantidad"},
            "total": {"$sum": {"$multiply": ["$items.cantidad", "$items.precio_unitario"]}}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": limite}
    ]
    compras = list(compras_col.aggregate(compras_pipeline))
    compras.reverse()

    # Info del producto
    prod = productos_col.find_one({"_id": ObjectId(producto_id)}, {"_id": 0, "codigo": 1, "nombre": 1, "variante": 1, "stock": 1, "costo": 1, "precio_con_iva": 1})

    return {
        "producto": prod,
        "ventas": [{"periodo": v["_id"], "cantidad": v["cantidad"], "total": v["total"], "utilidad": v["utilidad"]} for v in ventas],
        "compras": [{"periodo": c["_id"], "cantidad": c["cantidad"], "total": c["total"]} for c in compras]
    }

@app.get("/api/estadisticas/ingresos-por-periodo")
def estadisticas_ingresos(request: Request, periodo: str = "mes", limite: int = 12):
    """Ingresos vs Gastos por periodo para saber qué mes entró más plata."""
    user = get_current_user(request)
    if periodo == "dia":
        gf = "%Y-%m-%d"
    elif periodo == "semana":
        gf = "%Y-W%V"
    elif periodo == "año":
        gf = "%Y"
    else:
        gf = "%Y-%m"

    ventas_p = list(ventas_col.aggregate([
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": gf, "date": "$fecha_parsed"}}, "ingresos": {"$sum": "$total"}, "utilidad": {"$sum": "$utilidad"}}},
        {"$sort": {"_id": -1}}, {"$limit": limite}
    ]))

    gastos_p = list(gastos_col.aggregate([
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": gf, "date": "$fecha_parsed"}}, "gastos": {"$sum": "$monto"}}},
        {"$sort": {"_id": -1}}, {"$limit": limite}
    ]))

    compras_p = list(compras_col.aggregate([
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": gf, "date": "$fecha_parsed"}}, "compras": {"$sum": "$total"}}},
        {"$sort": {"_id": -1}}, {"$limit": limite}
    ]))

    # Merge all periods
    periodos = {}
    for v in ventas_p:
        periodos.setdefault(v["_id"], {"periodo": v["_id"], "ingresos": 0, "utilidad": 0, "gastos": 0, "compras": 0})
        periodos[v["_id"]]["ingresos"] = v["ingresos"]
        periodos[v["_id"]]["utilidad"] = v["utilidad"]
    for g in gastos_p:
        periodos.setdefault(g["_id"], {"periodo": g["_id"], "ingresos": 0, "utilidad": 0, "gastos": 0, "compras": 0})
        periodos[g["_id"]]["gastos"] = g["gastos"]
    for c in compras_p:
        periodos.setdefault(c["_id"], {"periodo": c["_id"], "ingresos": 0, "utilidad": 0, "gastos": 0, "compras": 0})
        periodos[c["_id"]]["compras"] = c["compras"]

    resultado = sorted(periodos.values(), key=lambda x: x["periodo"])[-limite:]
    for r in resultado:
        r["neto"] = r["ingresos"] - r["gastos"] - r["compras"]

    return {"data": resultado}

# ============ PLANTILLAS COMPARTIDAS ============
class PlantillaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = ""
    layout: list
    compartir: str = "privada"  # privada, usuarios, todos
    usuarios_compartidos: Optional[List[str]] = []

class PlantillaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    compartir: Optional[str] = None
    usuarios_compartidos: Optional[List[str]] = None

@app.get("/api/usuarios/lista")
def get_usuarios_lista(request: Request):
    user = get_current_user(request)
    usuarios = list(usuarios_col.find({"activo": {"$ne": False}}, {"_id": 1, "email": 1, "nombre": 1}))
    return {"usuarios": [{"id": str(u["_id"]), "email": u["email"], "nombre": u.get("nombre", u["email"])} for u in usuarios if str(u["_id"]) != user["id"]]}

@app.post("/api/plantillas")
def crear_plantilla(request: Request, data: PlantillaCreate):
    user = get_current_user(request)
    plantilla = {
        "nombre": data.nombre.strip(),
        "descripcion": data.descripcion or "",
        "layout": data.layout,
        "compartir": data.compartir,
        "usuarios_compartidos": data.usuarios_compartidos or [],
        "creador_id": user["id"],
        "creador_nombre": user.get("nombre", user["email"]),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    result = plantillas_col.insert_one(plantilla)
    registrar_auditoria(user["id"], user["email"], "crear_plantilla", "plantillas",
                        {"nombre": data.nombre, "compartir": data.compartir})
    return {"message": "Plantilla creada", "id": str(result.inserted_id)}

@app.get("/api/plantillas")
def get_plantillas(request: Request):
    user = get_current_user(request)
    query = {"$or": [
        {"creador_id": user["id"]},
        {"compartir": "todos"},
        {"$and": [{"compartir": "usuarios"}, {"usuarios_compartidos": user["id"]}]}
    ]}
    plantillas = list(plantillas_col.find(query).sort("created_at", -1))
    resultado = []
    for p in plantillas:
        resultado.append({
            "id": str(p["_id"]),
            "nombre": p["nombre"],
            "descripcion": p.get("descripcion", ""),
            "layout": p["layout"],
            "compartir": p.get("compartir", "privada"),
            "usuarios_compartidos": p.get("usuarios_compartidos", []),
            "creador_id": p["creador_id"],
            "creador_nombre": p.get("creador_nombre", ""),
            "es_propia": p["creador_id"] == user["id"],
            "widgets_count": len(p["layout"]),
            "created_at": p.get("created_at", ""),
            "updated_at": p.get("updated_at", "")
        })
    return {"plantillas": resultado}

@app.put("/api/plantillas/{plantilla_id}")
def update_plantilla(request: Request, plantilla_id: str, data: PlantillaUpdate):
    user = get_current_user(request)
    plantilla = plantillas_col.find_one({"_id": ObjectId(plantilla_id)})
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    if plantilla["creador_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Solo el creador puede editar esta plantilla")
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.nombre is not None:
        update_data["nombre"] = data.nombre.strip()
    if data.descripcion is not None:
        update_data["descripcion"] = data.descripcion
    if data.compartir is not None:
        update_data["compartir"] = data.compartir
    if data.usuarios_compartidos is not None:
        update_data["usuarios_compartidos"] = data.usuarios_compartidos
    plantillas_col.update_one({"_id": ObjectId(plantilla_id)}, {"$set": update_data})
    registrar_auditoria(user["id"], user["email"], "actualizar_plantilla", "plantillas",
                        {"plantilla_id": plantilla_id, "cambios": list(update_data.keys())})
    return {"message": "Plantilla actualizada"}

@app.delete("/api/plantillas/{plantilla_id}")
def delete_plantilla(request: Request, plantilla_id: str):
    user = get_current_user(request)
    plantilla = plantillas_col.find_one({"_id": ObjectId(plantilla_id)})
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    if plantilla["creador_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Solo el creador puede eliminar esta plantilla")
    plantillas_col.delete_one({"_id": ObjectId(plantilla_id)})
    registrar_auditoria(user["id"], user["email"], "eliminar_plantilla", "plantillas",
                        {"plantilla_id": plantilla_id, "nombre": plantilla["nombre"]})
    return {"message": "Plantilla eliminada"}

@app.post("/api/plantillas/{plantilla_id}/aplicar")
def aplicar_plantilla(request: Request, plantilla_id: str):
    user = get_current_user(request)
    plantilla = plantillas_col.find_one({"_id": ObjectId(plantilla_id)})
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    # Check access
    tiene_acceso = (
        plantilla["creador_id"] == user["id"] or
        plantilla.get("compartir") == "todos" or
        (plantilla.get("compartir") == "usuarios" and user["id"] in plantilla.get("usuarios_compartidos", []))
    )
    if not tiene_acceso:
        raise HTTPException(status_code=403, detail="No tiene acceso a esta plantilla")
    # Apply: copy layout to user's dashboard config
    config_data = {
        "usuario_id": user["id"],
        "template": "personalizado",
        "layout": plantilla["layout"],
        "custom": True,
        "plantilla_origen": str(plantilla["_id"]),
        "plantilla_nombre": plantilla["nombre"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    dashboard_config_col.update_one(
        {"usuario_id": user["id"]},
        {"$set": config_data},
        upsert=True
    )
    registrar_auditoria(user["id"], user["email"], "aplicar_plantilla", "plantillas",
                        {"plantilla_id": plantilla_id, "nombre": plantilla["nombre"]})
    return {"message": f"Plantilla '{plantilla['nombre']}' aplicada", "layout": plantilla["layout"]}

# ============ ESTADÍSTICAS AVANZADAS ============
@app.get("/api/estadisticas/ventas-por-periodo")
def estadisticas_ventas_periodo(
    request: Request,
    periodo: str = "mes",
    limite: int = 12,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None
):
    user = get_current_user(request)
    
    if periodo == "dia":
        group_format = "%Y-%m-%d"
    elif periodo == "semana":
        group_format = "%Y-W%V"
    elif periodo == "año":
        group_format = "%Y"
    else:
        group_format = "%Y-%m"
    
    pipeline = []
    if fecha_desde or fecha_hasta:
        fecha_filter = {}
        if fecha_desde:
            fecha_filter["$gte"] = fecha_desde
        if fecha_hasta:
            fecha_filter["$lte"] = fecha_hasta + "T23:59:59"
        pipeline.append({"$match": {"fecha": fecha_filter}})
    pipeline.extend([
        {"$addFields": {
            "fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}
        }},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {
            "_id": {"$dateToString": {"format": group_format, "date": "$fecha_parsed"}},
            "total_ventas": {"$sum": "$total"},
            "total_costo": {"$sum": "$total_costo"},
            "utilidad": {"$sum": "$utilidad"},
            "cantidad": {"$sum": 1}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": limite}
    ])
    
    ventas = list(ventas_col.aggregate(pipeline))
    ventas.reverse()
    
    return {"data": [{"periodo": v["_id"], "ventas": v["total_ventas"], "costo": v["total_costo"], 
                      "utilidad": v["utilidad"], "cantidad": v["cantidad"]} for v in ventas]}

@app.get("/api/estadisticas/compras-por-periodo")
def estadisticas_compras_periodo(request: Request, periodo: str = "mes", limite: int = 12, fecha_desde: Optional[str] = None, fecha_hasta: Optional[str] = None):
    user = get_current_user(request)
    
    if periodo == "dia":
        group_format = "%Y-%m-%d"
    elif periodo == "semana":
        group_format = "%Y-W%V"
    elif periodo == "año":
        group_format = "%Y"
    else:
        group_format = "%Y-%m"
    
    pipeline = []
    if fecha_desde or fecha_hasta:
        fecha_filter = {}
        if fecha_desde: fecha_filter["$gte"] = fecha_desde
        if fecha_hasta: fecha_filter["$lte"] = fecha_hasta + "T23:59:59"
        pipeline.append({"$match": {"fecha": fecha_filter}})
    pipeline.extend([
        {"$addFields": {"fecha_parsed": {"$dateFromString": {"dateString": "$fecha", "onError": None}}}},
        {"$match": {"fecha_parsed": {"$ne": None}}},
        {"$group": {
            "_id": {"$dateToString": {"format": group_format, "date": "$fecha_parsed"}},
            "total": {"$sum": "$total"},
            "cantidad": {"$sum": 1}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": limite}
    ])
    
    compras = list(compras_col.aggregate(pipeline))
    compras.reverse()
    
    return {"data": [{"periodo": c["_id"], "total": c["total"], "cantidad": c["cantidad"]} for c in compras]}

@app.get("/api/estadisticas/productos-mas-vendidos")
def estadisticas_productos_vendidos(request: Request, limite: int = 10, fecha_desde: Optional[str] = None, fecha_hasta: Optional[str] = None):
    user = get_current_user(request)
    
    pipeline = []
    if fecha_desde or fecha_hasta:
        fecha_filter = {}
        if fecha_desde: fecha_filter["$gte"] = fecha_desde
        if fecha_hasta: fecha_filter["$lte"] = fecha_hasta + "T23:59:59"
        pipeline.append({"$match": {"fecha": fecha_filter}})
    pipeline.extend([
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.producto_id",
            "codigo": {"$first": "$items.codigo"},
            "nombre": {"$first": "$items.nombre"},
            "cantidad": {"$sum": "$items.cantidad"},
            "total": {"$sum": {"$multiply": ["$items.cantidad", "$items.precio_unitario"]}},
            "utilidad": {"$sum": {"$multiply": ["$items.cantidad", {"$subtract": ["$items.precio_unitario", "$items.costo_unitario"]}]}}
        }},
        {"$sort": {"cantidad": -1}},
        {"$limit": limite}
    ])
    
    productos = list(ventas_col.aggregate(pipeline))
    return {"data": productos}

@app.get("/api/estadisticas/ventas-por-cliente")
def estadisticas_ventas_cliente(request: Request, limite: int = 10, fecha_desde: Optional[str] = None, fecha_hasta: Optional[str] = None):
    user = get_current_user(request)
    
    pipeline = []
    if fecha_desde or fecha_hasta:
        fecha_filter = {}
        if fecha_desde: fecha_filter["$gte"] = fecha_desde
        if fecha_hasta: fecha_filter["$lte"] = fecha_hasta + "T23:59:59"
        pipeline.append({"$match": {"fecha": fecha_filter}})
    pipeline.extend([
        {"$group": {
            "_id": "$cliente_id",
            "nombre": {"$first": "$cliente_nombre"},
            "total_compras": {"$sum": "$total"},
            "utilidad": {"$sum": "$utilidad"},
            "cantidad_compras": {"$sum": 1}
        }},
        {"$sort": {"total_compras": -1}},
        {"$limit": limite}
    ])
    
    clientes = list(ventas_col.aggregate(pipeline))
    return {"data": clientes}

@app.get("/api/estadisticas/compras-por-proveedor")
def estadisticas_compras_proveedor(request: Request, limite: int = 10, fecha_desde: Optional[str] = None, fecha_hasta: Optional[str] = None):
    user = get_current_user(request)
    
    pipeline = []
    if fecha_desde or fecha_hasta:
        fecha_filter = {}
        if fecha_desde: fecha_filter["$gte"] = fecha_desde
        if fecha_hasta: fecha_filter["$lte"] = fecha_hasta + "T23:59:59"
        pipeline.append({"$match": {"fecha": fecha_filter}})
    pipeline.extend([
        {"$group": {
            "_id": "$proveedor_id",
            "nombre": {"$first": "$proveedor_nombre"},
            "total": {"$sum": "$total"},
            "cantidad": {"$sum": 1}
        }},
        {"$sort": {"total": -1}},
        {"$limit": limite}
    ])
    
    proveedores = list(compras_col.aggregate(pipeline))
    return {"data": proveedores}

@app.get("/api/estadisticas/stock-por-categoria")
def estadisticas_stock_categoria(request: Request):
    user = get_current_user(request)
    
    pipeline = [
        {"$match": {"activo": True}},
        {"$group": {
            "_id": "$categoria",
            "cantidad_productos": {"$sum": 1},
            "stock_total": {"$sum": "$stock"},
            "valor_costo": {"$sum": {"$multiply": ["$stock", "$costo"]}},
            "valor_venta": {"$sum": {"$multiply": ["$stock", "$precio_con_iva"]}}
        }},
        {"$sort": {"valor_venta": -1}},
        {"$limit": 15}
    ]
    
    categorias = list(productos_col.aggregate(pipeline))
    return {"data": [{"categoria": c["_id"], "productos": c["cantidad_productos"], 
                      "stock": c["stock_total"], "valor_costo": c["valor_costo"],
                      "valor_venta": c["valor_venta"]} for c in categorias]}

@app.get("/api/estadisticas/gastos-por-categoria")
def estadisticas_gastos_categoria(request: Request):
    user = get_current_user(request)
    
    pipeline = [
        {"$group": {
            "_id": "$categoria",
            "total": {"$sum": "$monto"},
            "cantidad": {"$sum": 1}
        }},
        {"$sort": {"total": -1}}
    ]
    
    gastos = list(gastos_col.aggregate(pipeline))
    return {"data": [{"categoria": g["_id"], "total": g["total"], "cantidad": g["cantidad"]} for g in gastos]}

@app.get("/api/estadisticas/resumen-general")
def estadisticas_resumen(request: Request, fecha_desde: Optional[str] = None, fecha_hasta: Optional[str] = None):
    user = get_current_user(request)
    
    fecha_filter = {}
    if fecha_desde: fecha_filter["$gte"] = fecha_desde
    if fecha_hasta: fecha_filter["$lte"] = fecha_hasta + "T23:59:59"
    venta_match = {"fecha": fecha_filter} if fecha_filter else {}
    gasto_match = {"fecha": fecha_filter} if fecha_filter else {}
    compra_match = {"fecha": fecha_filter} if fecha_filter else {}

    # Ventas
    ventas_total = list(ventas_col.aggregate([
        {"$match": venta_match} if venta_match else {"$match": {}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "utilidad": {"$sum": "$utilidad"}, "cantidad": {"$sum": 1}}}
    ]))
    ventas_data = ventas_total[0] if ventas_total else {"total": 0, "utilidad": 0, "cantidad": 0}
    
    # Compras
    compras_total = list(compras_col.aggregate([
        {"$match": compra_match} if compra_match else {"$match": {}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}, "cantidad": {"$sum": 1}}}
    ]))
    compras_data = compras_total[0] if compras_total else {"total": 0, "cantidad": 0}
    
    # Gastos
    gastos_total = list(gastos_col.aggregate([
        {"$match": gasto_match} if gasto_match else {"$match": {}},
        {"$group": {"_id": None, "total": {"$sum": "$monto"}, "cantidad": {"$sum": 1}}}
    ]))
    gastos_data = gastos_total[0] if gastos_total else {"total": 0, "cantidad": 0}
    
    # Stock
    stock_total = list(productos_col.aggregate([
        {"$match": {"activo": True}},
        {"$group": {
            "_id": None,
            "productos": {"$sum": 1},
            "stock_total": {"$sum": "$stock"},
            "valor_costo": {"$sum": {"$multiply": ["$stock", "$costo"]}},
            "valor_venta": {"$sum": {"$multiply": ["$stock", "$precio_con_iva"]}},
            "sin_stock": {"$sum": {"$cond": [{"$lte": ["$stock", 0]}, 1, 0]}},
            "bajo_minimo": {"$sum": {"$cond": [{"$lt": ["$stock", "$stock_minimo"]}, 1, 0]}}
        }}
    ]))
    stock_data = stock_total[0] if stock_total else {"productos": 0, "stock_total": 0, "valor_costo": 0, "valor_venta": 0, "sin_stock": 0, "bajo_minimo": 0}
    
    utilidad_neta = ventas_data.get("utilidad", 0) - gastos_data.get("total", 0)
    
    return {
        "ventas": {
            "total": ventas_data.get("total", 0),
            "utilidad": ventas_data.get("utilidad", 0),
            "cantidad": ventas_data.get("cantidad", 0)
        },
        "compras": {
            "total": compras_data.get("total", 0),
            "cantidad": compras_data.get("cantidad", 0)
        },
        "gastos": {
            "total": gastos_data.get("total", 0),
            "cantidad": gastos_data.get("cantidad", 0)
        },
        "stock": {
            "productos": stock_data.get("productos", 0),
            "unidades": stock_data.get("stock_total", 0),
            "valor_costo": stock_data.get("valor_costo", 0),
            "valor_venta": stock_data.get("valor_venta", 0),
            "sin_stock": stock_data.get("sin_stock", 0),
            "bajo_minimo": stock_data.get("bajo_minimo", 0)
        },
        "utilidad_neta": utilidad_neta,
        "clientes": clientes_col.count_documents({"activo": True}),
        "proveedores": proveedores_col.count_documents({"activo": True})
    }

# ============ SEED DATA ============
@app.post("/api/seed")
def seed_database(request: Request):
    try:
        user = get_current_user(request)
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Solo administradores pueden cargar datos")
    except:
        pass  # Allow seed without auth for initial setup
    
    try:
        with open('/tmp/seed_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo seed no encontrado")
    
    productos_col.delete_many({})
    clientes_col.delete_many({})
    proveedores_col.delete_many({})
    
    if data.get("productos"):
        for p in data["productos"]:
            p["activo"] = True
            p["created_at"] = datetime.now(timezone.utc).isoformat()
        productos_col.insert_many(data["productos"])
    
    if data.get("clientes"):
        for c in data["clientes"]:
            c["activo"] = True
            c["tipo"] = "Odontólogo"
            c["total_compras"] = 0
            c["created_at"] = datetime.now(timezone.utc).isoformat()
        clientes_col.insert_many(data["clientes"])
    
    if data.get("proveedores"):
        for p in data["proveedores"]:
            p["activo"] = True
            p["total_compras"] = 0
            p["created_at"] = datetime.now(timezone.utc).isoformat()
        proveedores_col.insert_many(data["proveedores"])
    
    return {
        "message": "Base de datos inicializada",
        "productos": len(data.get("productos", [])),
        "clientes": len(data.get("clientes", [])),
        "proveedores": len(data.get("proveedores", []))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
