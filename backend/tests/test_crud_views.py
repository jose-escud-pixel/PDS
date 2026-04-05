"""
Test CRUD operations for all views in PDS Sistema
Tests: Productos, Ventas, Compras, Clientes, Proveedores, Gastos, Usuarios
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_login_success(self, session):
        """Test login with admin credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["email"] == "andy.escudero"
        assert data["role"] == "admin"
        print(f"✓ Login successful: {data['email']} ({data['role']})")
    
    def test_get_me(self, session):
        """Test /api/auth/me endpoint"""
        # First login
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "andy.escudero"
        print(f"✓ Auth/me works: {data['email']}")


class TestProductos:
    """Productos CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_productos(self, auth_session):
        """Test GET /api/productos"""
        response = auth_session.get(f"{BASE_URL}/api/productos")
        assert response.status_code == 200
        data = response.json()
        assert "productos" in data
        assert "total" in data
        print(f"✓ GET productos: {data['total']} products found")
    
    def test_create_producto(self, auth_session):
        """Test POST /api/productos"""
        producto = {
            "codigo": f"TEST-{int(time.time())}",
            "nombre": "TEST Producto Prueba",
            "variante": "Test Variant",
            "categoria": "Test Category",
            "proveedor": "Test Proveedor",
            "precio_con_iva": 50000,
            "iva_pct": 10,
            "costo": 40000,
            "stock": 10,
            "stock_minimo": 2,
            "margen": 15
        }
        response = auth_session.post(f"{BASE_URL}/api/productos", json=producto)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ CREATE producto: {data['id']}")
        return data["id"]
    
    def test_update_producto(self, auth_session):
        """Test PUT /api/productos/{id}"""
        # First create a product
        producto = {
            "codigo": f"TEST-UPD-{int(time.time())}",
            "nombre": "TEST Update Producto",
            "categoria": "Test",
            "proveedor": "Test",
            "precio_con_iva": 50000,
            "costo": 40000,
            "stock": 5
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/productos", json=producto)
        assert create_resp.status_code == 200
        prod_id = create_resp.json()["id"]
        
        # Update it
        update_data = {"nombre": "TEST Updated Name", "precio_con_iva": 60000}
        response = auth_session.put(f"{BASE_URL}/api/productos/{prod_id}", json=update_data)
        assert response.status_code == 200
        print(f"✓ UPDATE producto: {prod_id}")
    
    def test_delete_producto(self, auth_session):
        """Test DELETE /api/productos/{id}"""
        # First create a product
        producto = {
            "codigo": f"TEST-DEL-{int(time.time())}",
            "nombre": "TEST Delete Producto",
            "categoria": "Test",
            "proveedor": "Test",
            "precio_con_iva": 50000,
            "costo": 40000,
            "stock": 5
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/productos", json=producto)
        assert create_resp.status_code == 200
        prod_id = create_resp.json()["id"]
        
        # Delete it
        response = auth_session.delete(f"{BASE_URL}/api/productos/{prod_id}")
        assert response.status_code == 200
        print(f"✓ DELETE producto: {prod_id}")
    
    def test_ajustar_stock(self, auth_session):
        """Test POST /api/productos/{id}/ajuste-stock"""
        # First create a product
        producto = {
            "codigo": f"TEST-STK-{int(time.time())}",
            "nombre": "TEST Stock Adjust",
            "categoria": "Test",
            "proveedor": "Test",
            "precio_con_iva": 50000,
            "costo": 40000,
            "stock": 10
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/productos", json=producto)
        assert create_resp.status_code == 200
        prod_id = create_resp.json()["id"]
        
        # Adjust stock
        response = auth_session.post(f"{BASE_URL}/api/productos/{prod_id}/ajuste-stock", json={
            "cantidad": 5,
            "motivo": "Test adjustment"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["stock_nuevo"] == 15
        print(f"✓ AJUSTAR STOCK: {prod_id} (10 -> 15)")


class TestClientes:
    """Clientes CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_clientes(self, auth_session):
        """Test GET /api/clientes"""
        response = auth_session.get(f"{BASE_URL}/api/clientes")
        assert response.status_code == 200
        data = response.json()
        assert "clientes" in data
        print(f"✓ GET clientes: {len(data['clientes'])} clients found")
    
    def test_create_cliente(self, auth_session):
        """Test POST /api/clientes"""
        cliente = {
            "nombre": f"TEST Cliente {int(time.time())}",
            "ruc": "12345678-9",
            "telefono": "0981123456",
            "direccion": "Test Address",
            "ciudad": "Asunción",
            "tipo": "Odontólogo"
        }
        response = auth_session.post(f"{BASE_URL}/api/clientes", json=cliente)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ CREATE cliente: {data['id']}")
        return data["id"]
    
    def test_update_cliente(self, auth_session):
        """Test PUT /api/clientes/{id}"""
        # First create a client
        cliente = {
            "nombre": f"TEST Update Cliente {int(time.time())}",
            "ruc": "99999999-9",
            "telefono": "0981999999",
            "tipo": "Clínica"
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/clientes", json=cliente)
        assert create_resp.status_code == 200
        client_id = create_resp.json()["id"]
        
        # Update it
        update_data = {
            "nombre": "TEST Updated Cliente Name",
            "ruc": "99999999-9",
            "telefono": "0981888888",
            "tipo": "Laboratorio"
        }
        response = auth_session.put(f"{BASE_URL}/api/clientes/{client_id}", json=update_data)
        assert response.status_code == 200
        print(f"✓ UPDATE cliente: {client_id}")
    
    def test_delete_cliente(self, auth_session):
        """Test DELETE /api/clientes/{id}"""
        # First create a client
        cliente = {
            "nombre": f"TEST Delete Cliente {int(time.time())}",
            "tipo": "Otro"
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/clientes", json=cliente)
        assert create_resp.status_code == 200
        client_id = create_resp.json()["id"]
        
        # Delete it
        response = auth_session.delete(f"{BASE_URL}/api/clientes/{client_id}")
        assert response.status_code == 200
        print(f"✓ DELETE cliente: {client_id}")


class TestProveedores:
    """Proveedores CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_proveedores(self, auth_session):
        """Test GET /api/proveedores"""
        response = auth_session.get(f"{BASE_URL}/api/proveedores")
        assert response.status_code == 200
        data = response.json()
        assert "proveedores" in data
        print(f"✓ GET proveedores: {len(data['proveedores'])} providers found")
    
    def test_create_proveedor(self, auth_session):
        """Test POST /api/proveedores"""
        proveedor = {
            "nombre": f"TEST Proveedor {int(time.time())}",
            "ruc": "80012345-6",
            "direccion": "Test Address",
            "contacto": "Juan Test",
            "telefono": "021123456"
        }
        response = auth_session.post(f"{BASE_URL}/api/proveedores", json=proveedor)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ CREATE proveedor: {data['id']}")
        return data["id"]
    
    def test_update_proveedor(self, auth_session):
        """Test PUT /api/proveedores/{id}"""
        # First create a provider
        proveedor = {
            "nombre": f"TEST Update Proveedor {int(time.time())}",
            "ruc": "80099999-9",
            "contacto": "Maria Test"
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/proveedores", json=proveedor)
        assert create_resp.status_code == 200
        prov_id = create_resp.json()["id"]
        
        # Update it
        update_data = {
            "nombre": "TEST Updated Proveedor Name",
            "ruc": "80099999-9",
            "contacto": "Pedro Updated",
            "telefono": "021888888"
        }
        response = auth_session.put(f"{BASE_URL}/api/proveedores/{prov_id}", json=update_data)
        assert response.status_code == 200
        print(f"✓ UPDATE proveedor: {prov_id}")
    
    def test_delete_proveedor(self, auth_session):
        """Test DELETE /api/proveedores/{id}"""
        # First create a provider
        proveedor = {
            "nombre": f"TEST Delete Proveedor {int(time.time())}"
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/proveedores", json=proveedor)
        assert create_resp.status_code == 200
        prov_id = create_resp.json()["id"]
        
        # Delete it
        response = auth_session.delete(f"{BASE_URL}/api/proveedores/{prov_id}")
        assert response.status_code == 200
        print(f"✓ DELETE proveedor: {prov_id}")


class TestVentas:
    """Ventas CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_ventas(self, auth_session):
        """Test GET /api/ventas"""
        response = auth_session.get(f"{BASE_URL}/api/ventas")
        assert response.status_code == 200
        data = response.json()
        assert "ventas" in data
        assert "total" in data
        print(f"✓ GET ventas: {data['total']} sales found")
    
    def test_create_venta(self, auth_session):
        """Test POST /api/ventas - creates sale and adjusts stock"""
        # First get a client
        clientes_resp = auth_session.get(f"{BASE_URL}/api/clientes")
        clientes = clientes_resp.json()["clientes"]
        if not clientes:
            pytest.skip("No clients available for sale test")
        cliente = clientes[0]
        
        # Get a product with stock
        productos_resp = auth_session.get(f"{BASE_URL}/api/productos")
        productos = [p for p in productos_resp.json()["productos"] if p.get("stock", 0) > 0]
        if not productos:
            pytest.skip("No products with stock available for sale test")
        producto = productos[0]
        
        initial_stock = producto["stock"]
        
        venta = {
            "cliente_id": cliente["id"],
            "cliente_nombre": cliente["nombre"],
            "items": [{
                "producto_id": producto["id"],
                "codigo": producto["codigo"],
                "nombre": producto["nombre"],
                "cantidad": 1,
                "precio_unitario": producto["precio_con_iva"],
                "costo_unitario": producto["costo"],
                "iva_pct": producto.get("iva_pct", 10)
            }],
            "observaciones": "TEST venta"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/ventas", json=venta)
        assert response.status_code == 200, f"Create venta failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "total" in data
        print(f"✓ CREATE venta: {data['id']} - Total: {data['total']}")
        
        # Verify stock was reduced
        prod_resp = auth_session.get(f"{BASE_URL}/api/productos")
        updated_prod = next((p for p in prod_resp.json()["productos"] if p["id"] == producto["id"]), None)
        if updated_prod:
            assert updated_prod["stock"] == initial_stock - 1, "Stock should be reduced by 1"
            print(f"✓ Stock adjusted: {initial_stock} -> {updated_prod['stock']}")


class TestCompras:
    """Compras CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_compras(self, auth_session):
        """Test GET /api/compras"""
        response = auth_session.get(f"{BASE_URL}/api/compras")
        assert response.status_code == 200
        data = response.json()
        assert "compras" in data
        assert "total" in data
        print(f"✓ GET compras: {data['total']} purchases found")
    
    def test_create_compra(self, auth_session):
        """Test POST /api/compras - creates purchase and adds stock"""
        # First get a provider
        proveedores_resp = auth_session.get(f"{BASE_URL}/api/proveedores")
        proveedores = proveedores_resp.json()["proveedores"]
        if not proveedores:
            pytest.skip("No providers available for purchase test")
        proveedor = proveedores[0]
        
        # Get a product
        productos_resp = auth_session.get(f"{BASE_URL}/api/productos")
        productos = productos_resp.json()["productos"]
        if not productos:
            pytest.skip("No products available for purchase test")
        producto = productos[0]
        
        initial_stock = producto["stock"]
        
        compra = {
            "proveedor_id": proveedor["id"],
            "proveedor_nombre": proveedor["nombre"],
            "factura": f"TEST-FAC-{int(time.time())}",
            "items": [{
                "producto_id": producto["id"],
                "codigo": producto["codigo"],
                "nombre": producto["nombre"],
                "cantidad": 5,
                "precio_unitario": producto["costo"],
                "iva_pct": producto.get("iva_pct", 10)
            }],
            "observaciones": "TEST compra"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/compras", json=compra)
        assert response.status_code == 200, f"Create compra failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "total" in data
        print(f"✓ CREATE compra: {data['id']} - Total: {data['total']}")
        
        # Verify stock was increased
        prod_resp = auth_session.get(f"{BASE_URL}/api/productos")
        updated_prod = next((p for p in prod_resp.json()["productos"] if p["id"] == producto["id"]), None)
        if updated_prod:
            assert updated_prod["stock"] == initial_stock + 5, "Stock should be increased by 5"
            print(f"✓ Stock adjusted: {initial_stock} -> {updated_prod['stock']}")


class TestGastos:
    """Gastos CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_gastos(self, auth_session):
        """Test GET /api/gastos"""
        response = auth_session.get(f"{BASE_URL}/api/gastos")
        assert response.status_code == 200
        data = response.json()
        assert "gastos" in data
        assert "total" in data
        print(f"✓ GET gastos: {data['total']} expenses found")
    
    def test_create_gasto(self, auth_session):
        """Test POST /api/gastos"""
        from datetime import datetime
        gasto = {
            "fecha": datetime.now().strftime("%Y-%m-%d"),
            "categoria": "Test Category",
            "descripcion": f"TEST Gasto {int(time.time())}",
            "monto": 100000,
            "iva_pct": 10,
            "proveedor": "Test Proveedor"
        }
        response = auth_session.post(f"{BASE_URL}/api/gastos", json=gasto)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ CREATE gasto: {data['id']}")


class TestUsuarios:
    """Usuarios CRUD tests (Admin only)"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_get_usuarios(self, auth_session):
        """Test GET /api/usuarios"""
        response = auth_session.get(f"{BASE_URL}/api/usuarios")
        assert response.status_code == 200
        data = response.json()
        assert "usuarios" in data
        print(f"✓ GET usuarios: {len(data['usuarios'])} users found")
    
    def test_create_usuario(self, auth_session):
        """Test POST /api/usuarios"""
        usuario = {
            "email": f"test.user.{int(time.time())}@test.com",
            "password": "testpass123",
            "nombre": "TEST User",
            "role": "usuario"
        }
        response = auth_session.post(f"{BASE_URL}/api/usuarios", json=usuario)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ CREATE usuario: {data['id']}")
        return data["id"]
    
    def test_update_usuario_toggle_active(self, auth_session):
        """Test PUT /api/usuarios/{id} - toggle active status"""
        # First create a user
        usuario = {
            "email": f"test.toggle.{int(time.time())}@test.com",
            "password": "testpass123",
            "nombre": "TEST Toggle User",
            "role": "usuario"
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/usuarios", json=usuario)
        assert create_resp.status_code == 200
        user_id = create_resp.json()["id"]
        
        # Deactivate user
        response = auth_session.put(f"{BASE_URL}/api/usuarios/{user_id}", json={"activo": False})
        assert response.status_code == 200
        print(f"✓ DEACTIVATE usuario: {user_id}")
        
        # Reactivate user
        response = auth_session.put(f"{BASE_URL}/api/usuarios/{user_id}", json={"activo": True})
        assert response.status_code == 200
        print(f"✓ ACTIVATE usuario: {user_id}")
    
    def test_delete_usuario(self, auth_session):
        """Test DELETE /api/usuarios/{id}"""
        # First create a user
        usuario = {
            "email": f"test.delete.{int(time.time())}@test.com",
            "password": "testpass123",
            "nombre": "TEST Delete User",
            "role": "usuario"
        }
        create_resp = auth_session.post(f"{BASE_URL}/api/usuarios", json=usuario)
        assert create_resp.status_code == 200
        user_id = create_resp.json()["id"]
        
        # Delete it (actually deactivates)
        response = auth_session.delete(f"{BASE_URL}/api/usuarios/{user_id}")
        assert response.status_code == 200
        print(f"✓ DELETE usuario: {user_id}")


class TestNavigation:
    """Test navigation endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        return session
    
    def test_dashboard(self, auth_session):
        """Test GET /api/dashboard"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "resumen" in data
        print(f"✓ Dashboard loaded: {data['resumen']['total_productos']} products")
    
    def test_categorias(self, auth_session):
        """Test GET /api/categorias"""
        response = auth_session.get(f"{BASE_URL}/api/categorias")
        assert response.status_code == 200
        data = response.json()
        assert "categorias" in data
        print(f"✓ Categorias: {len(data['categorias'])} categories")
    
    def test_auditoria(self, auth_session):
        """Test GET /api/auditoria (admin only)"""
        response = auth_session.get(f"{BASE_URL}/api/auditoria")
        assert response.status_code == 200
        data = response.json()
        assert "registros" in data
        print(f"✓ Auditoria: {data['total']} records")
    
    def test_stock_movimientos(self, auth_session):
        """Test GET /api/stock-movimientos"""
        response = auth_session.get(f"{BASE_URL}/api/stock-movimientos")
        assert response.status_code == 200
        data = response.json()
        assert "movimientos" in data
        print(f"✓ Stock movimientos: {data['total']} movements")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
