"""
PDS - Sistema de Gestión Integral para Insumos Odontológicos
Backend API con FastAPI + MongoDB
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import os
import json
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pds_database")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

app = FastAPI(title="PDS API", description="Sistema de Gestión de Insumos Odontológicos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if CORS_ORIGINS == "*" else CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
productos_col = db["productos"]
clientes_col = db["clientes"]
proveedores_col = db["proveedores"]
ventas_col = db["ventas"]
compras_col = db["compras"]
gastos_col = db["gastos"]
categorias_col = db["categorias"]

# Pydantic Models
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
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

# ============ HEALTH CHECK ============
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "PDS API"}

# ============ DASHBOARD ============
@app.get("/api/dashboard")
def get_dashboard():
    # Total productos
    total_productos = productos_col.count_documents({"activo": True})
    
    # Stock valorizado
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
        "valor_stock_costo": 0, 
        "valor_stock_venta": 0,
        "productos_sin_stock": 0,
        "productos_bajo_minimo": 0
    }
    
    # Ventas totales
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
    
    # Compras totales
    compras_pipeline = [
        {"$group": {
            "_id": None,
            "total_compras": {"$sum": "$total"},
            "cantidad_compras": {"$sum": 1}
        }}
    ]
    compras_stats = list(compras_col.aggregate(compras_pipeline))
    compras_data = compras_stats[0] if compras_stats else {"total_compras": 0, "cantidad_compras": 0}
    
    # Gastos totales
    gastos_pipeline = [
        {"$group": {
            "_id": None,
            "total_gastos": {"$sum": "$monto"}
        }}
    ]
    gastos_stats = list(gastos_col.aggregate(gastos_pipeline))
    gastos_data = gastos_stats[0] if gastos_stats else {"total_gastos": 0}
    
    # Top productos vendidos
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
    
    # Top clientes
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
    
    # Productos con bajo stock
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
    search: Optional[str] = None,
    categoria: Optional[str] = None,
    proveedor: Optional[str] = None,
    bajo_stock: Optional[bool] = False,
    skip: int = 0,
    limit: int = 50
):
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
    
    return {
        "total": total,
        "productos": serialize_docs(productos)
    }

@app.get("/api/productos/{producto_id}")
def get_producto(producto_id: str):
    try:
        producto = productos_col.find_one({"_id": ObjectId(producto_id)})
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return serialize_doc(producto)

@app.post("/api/productos")
def create_producto(producto: ProductoBase):
    # Check if codigo exists
    if productos_col.find_one({"codigo": producto.codigo}):
        raise HTTPException(status_code=400, detail="El código ya existe")
    
    data = producto.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    result = productos_col.insert_one(data)
    
    return {"id": str(result.inserted_id), "message": "Producto creado"}

@app.put("/api/productos/{producto_id}")
def update_producto(producto_id: str, producto: ProductoUpdate):
    try:
        oid = ObjectId(producto_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = {k: v for k, v in producto.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = productos_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"message": "Producto actualizado"}

@app.delete("/api/productos/{producto_id}")
def delete_producto(producto_id: str):
    try:
        oid = ObjectId(producto_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    result = productos_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"message": "Producto eliminado"}

# ============ CATEGORIAS ============
@app.get("/api/categorias")
def get_categorias():
    categorias = productos_col.distinct("categoria", {"activo": True})
    return {"categorias": sorted([c for c in categorias if c])}

# ============ CLIENTES ============
@app.get("/api/clientes")
def get_clientes(search: Optional[str] = None):
    query = {"activo": True}
    if search:
        query["$or"] = [
            {"nombre": {"$regex": search, "$options": "i"}},
            {"telefono": {"$regex": search, "$options": "i"}}
        ]
    
    clientes = list(clientes_col.find(query))
    return {"clientes": serialize_docs(clientes)}

@app.post("/api/clientes")
def create_cliente(cliente: ClienteBase):
    data = cliente.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["total_compras"] = 0
    result = clientes_col.insert_one(data)
    return {"id": str(result.inserted_id), "message": "Cliente creado"}

@app.put("/api/clientes/{cliente_id}")
def update_cliente(cliente_id: str, cliente: ClienteBase):
    try:
        oid = ObjectId(cliente_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = cliente.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = clientes_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    return {"message": "Cliente actualizado"}

@app.delete("/api/clientes/{cliente_id}")
def delete_cliente(cliente_id: str):
    try:
        oid = ObjectId(cliente_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    result = clientes_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    return {"message": "Cliente eliminado"}

# ============ PROVEEDORES ============
@app.get("/api/proveedores")
def get_proveedores(search: Optional[str] = None):
    query = {"activo": True}
    if search:
        query["nombre"] = {"$regex": search, "$options": "i"}
    
    proveedores = list(proveedores_col.find(query))
    return {"proveedores": serialize_docs(proveedores)}

@app.post("/api/proveedores")
def create_proveedor(proveedor: ProveedorBase):
    data = proveedor.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    data["total_compras"] = 0
    result = proveedores_col.insert_one(data)
    return {"id": str(result.inserted_id), "message": "Proveedor creado"}

@app.put("/api/proveedores/{proveedor_id}")
def update_proveedor(proveedor_id: str, proveedor: ProveedorBase):
    try:
        oid = ObjectId(proveedor_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    update_data = proveedor.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = proveedores_col.update_one({"_id": oid}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    return {"message": "Proveedor actualizado"}

@app.delete("/api/proveedores/{proveedor_id}")
def delete_proveedor(proveedor_id: str):
    try:
        oid = ObjectId(proveedor_id)
    except:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    result = proveedores_col.update_one({"_id": oid}, {"$set": {"activo": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    return {"message": "Proveedor eliminado"}

# ============ VENTAS ============
@app.get("/api/ventas")
def get_ventas(
    cliente_id: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
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
def create_venta(venta: VentaBase):
    total = 0
    total_costo = 0
    total_iva = 0
    
    # Validate stock and calculate totals
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
    
    # Create venta document
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = ventas_col.insert_one(venta_data)
    
    # Update stock
    for item in venta.items:
        productos_col.update_one(
            {"_id": ObjectId(item.producto_id)},
            {"$inc": {"stock": -item.cantidad}}
        )
    
    # Update cliente total
    clientes_col.update_one(
        {"_id": ObjectId(venta.cliente_id)},
        {
            "$inc": {"total_compras": total},
            "$set": {"ultima_compra": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {
        "id": str(result.inserted_id), 
        "message": "Venta registrada",
        "total": total,
        "utilidad": total - total_costo
    }

# ============ COMPRAS ============
@app.get("/api/compras")
def get_compras(
    proveedor_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if proveedor_id:
        query["proveedor_id"] = proveedor_id
    
    total = compras_col.count_documents(query)
    compras = list(compras_col.find(query).sort("fecha", -1).skip(skip).limit(limit))
    
    return {"total": total, "compras": serialize_docs(compras)}

@app.post("/api/compras")
def create_compra(compra: CompraBase):
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = compras_col.insert_one(compra_data)
    
    # Update stock and cost for each product
    for item in compra.items:
        productos_col.update_one(
            {"_id": ObjectId(item.producto_id)},
            {
                "$inc": {"stock": item.cantidad},
                "$set": {"costo": item.precio_unitario * (1 - item.iva_pct/(100+item.iva_pct))}
            }
        )
    
    # Update proveedor
    proveedores_col.update_one(
        {"_id": ObjectId(compra.proveedor_id)},
        {
            "$inc": {"total_compras": total},
            "$set": {"ultima_compra": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"id": str(result.inserted_id), "message": "Compra registrada", "total": total}

# ============ GASTOS ============
@app.get("/api/gastos")
def get_gastos(skip: int = 0, limit: int = 50):
    total = gastos_col.count_documents({})
    gastos = list(gastos_col.find({}).sort("fecha", -1).skip(skip).limit(limit))
    return {"total": total, "gastos": serialize_docs(gastos)}

@app.post("/api/gastos")
def create_gasto(gasto: GastoBase):
    data = gasto.model_dump()
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    result = gastos_col.insert_one(data)
    return {"id": str(result.inserted_id), "message": "Gasto registrado"}

# ============ SEED DATA ============
@app.post("/api/seed")
def seed_database():
    """Seed database with initial data from Excel"""
    try:
        with open('/tmp/seed_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo seed no encontrado")
    
    # Clear existing data
    productos_col.delete_many({})
    clientes_col.delete_many({})
    proveedores_col.delete_many({})
    
    # Insert productos
    if data.get("productos"):
        for p in data["productos"]:
            p["activo"] = True
            p["created_at"] = datetime.now(timezone.utc).isoformat()
        productos_col.insert_many(data["productos"])
    
    # Insert clientes
    if data.get("clientes"):
        for c in data["clientes"]:
            c["activo"] = True
            c["tipo"] = "Odontólogo"
            c["total_compras"] = 0
            c["created_at"] = datetime.now(timezone.utc).isoformat()
        clientes_col.insert_many(data["clientes"])
    
    # Insert proveedores
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
