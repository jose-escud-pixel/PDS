"""
Test Suite for Iteration 7 - New Features:
1. Mi Perfil - Profile management (GET/PUT /api/perfil, PUT /api/perfil/password, POST /api/perfil/foto)
2. Search bars in all views (Ventas, Compras, Clientes, Proveedores, Gastos)
3. Statistics date range filter and product analysis
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        """Login and return authenticated session"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_login_success(self, session):
        """Test login with correct credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "andy.escudero"
        assert data["role"] == "admin"
        print(f"✓ Login successful: {data['email']} ({data['role']})")


class TestPerfil:
    """Profile management tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200
        return s
    
    def test_get_perfil(self, auth_session):
        """GET /api/perfil returns user data without password_hash"""
        response = auth_session.get(f"{BASE_URL}/api/perfil")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "id" in data
        assert "email" in data
        assert "nombre" in data
        assert "role" in data
        
        # Verify password_hash is NOT returned
        assert "password_hash" not in data
        
        # Verify optional profile fields exist
        assert "telefono" in data
        assert "direccion" in data
        assert "ciudad" in data
        assert "foto_url" in data
        
        print(f"✓ GET /api/perfil: {data['email']}, nombre={data['nombre']}, role={data['role']}")
    
    def test_update_perfil(self, auth_session):
        """PUT /api/perfil updates profile fields"""
        # First get current profile
        get_response = auth_session.get(f"{BASE_URL}/api/perfil")
        original = get_response.json()
        
        # Update profile
        update_data = {
            "nombre": "Andy Escudero Updated",
            "telefono": "0981123456",
            "ciudad": "Asunción",
            "direccion": "Calle Test 123"
        }
        response = auth_session.put(f"{BASE_URL}/api/perfil", json=update_data)
        assert response.status_code == 200
        assert response.json()["message"] == "Perfil actualizado"
        
        # Verify update persisted
        verify_response = auth_session.get(f"{BASE_URL}/api/perfil")
        updated = verify_response.json()
        assert updated["nombre"] == "Andy Escudero Updated"
        assert updated["telefono"] == "0981123456"
        assert updated["ciudad"] == "Asunción"
        assert updated["direccion"] == "Calle Test 123"
        
        # Restore original name
        auth_session.put(f"{BASE_URL}/api/perfil", json={"nombre": original.get("nombre", "Andy Escudero")})
        
        print("✓ PUT /api/perfil: Profile updated and verified")
    
    def test_change_password_wrong_current(self, auth_session):
        """PUT /api/perfil/password with wrong current password returns error"""
        response = auth_session.put(f"{BASE_URL}/api/perfil/password", json={
            "password_actual": "wrongpassword",
            "password_nueva": "newpassword123"
        })
        assert response.status_code == 400
        assert "incorrecta" in response.json()["detail"].lower() or "actual" in response.json()["detail"].lower()
        print("✓ PUT /api/perfil/password: Wrong current password rejected")
    
    def test_change_password_success(self, auth_session):
        """PUT /api/perfil/password with correct current password succeeds"""
        # Change password
        response = auth_session.put(f"{BASE_URL}/api/perfil/password", json={
            "password_actual": "secreto",
            "password_nueva": "newpassword123"
        })
        assert response.status_code == 200
        assert "actualizada" in response.json()["message"].lower()
        
        # Verify new password works by logging in again
        new_session = requests.Session()
        login_response = new_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "newpassword123"
        })
        assert login_response.status_code == 200
        
        # Restore original password
        restore_response = new_session.put(f"{BASE_URL}/api/perfil/password", json={
            "password_actual": "newpassword123",
            "password_nueva": "secreto"
        })
        assert restore_response.status_code == 200
        
        print("✓ PUT /api/perfil/password: Password changed and restored")
    
    def test_upload_foto(self, auth_session):
        """POST /api/perfil/foto accepts file upload"""
        # Create a small test image (1x1 red pixel PNG)
        # This is a minimal valid PNG file
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        )
        
        files = {"foto": ("test.png", png_data, "image/png")}
        
        # For multipart upload, we need to NOT send Content-Type header
        # requests will set it automatically with boundary
        # Save original headers and temporarily remove Content-Type
        original_headers = auth_session.headers.copy()
        if "Content-Type" in auth_session.headers:
            del auth_session.headers["Content-Type"]
        
        try:
            response = auth_session.post(
                f"{BASE_URL}/api/perfil/foto",
                files=files
            )
            assert response.status_code == 200, f"Upload failed: {response.text}"
            data = response.json()
            assert "foto_url" in data
            assert data["foto_url"].startswith("data:image/")
            print("✓ POST /api/perfil/foto: Photo uploaded successfully")
        finally:
            # Restore original headers
            auth_session.headers = original_headers


class TestEstadisticasDateRange:
    """Statistics with date range filter tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200
        return s
    
    def test_ventas_por_periodo_with_dates(self, auth_session):
        """GET /api/estadisticas/ventas-por-periodo accepts fecha_desde and fecha_hasta"""
        response = auth_session.get(f"{BASE_URL}/api/estadisticas/ventas-por-periodo", params={
            "periodo": "mes",
            "fecha_desde": "2025-01-01",
            "fecha_hasta": "2026-12-31"
        })
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ GET /api/estadisticas/ventas-por-periodo with dates: {len(data['data'])} periods")
    
    def test_ingresos_por_periodo(self, auth_session):
        """GET /api/estadisticas/ingresos-por-periodo returns merged income/expense data"""
        response = auth_session.get(f"{BASE_URL}/api/estadisticas/ingresos-por-periodo", params={
            "periodo": "mes",
            "limite": 12
        })
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        
        # Check structure of data if available
        if len(data["data"]) > 0:
            item = data["data"][0]
            # Should have ventas, compras, gastos, and neto fields
            assert "periodo" in item or "_id" in item
            print(f"✓ GET /api/estadisticas/ingresos-por-periodo: {len(data['data'])} periods, fields: {list(item.keys())}")
        else:
            print("✓ GET /api/estadisticas/ingresos-por-periodo: No data (empty)")
    
    def test_producto_detalle(self, auth_session):
        """GET /api/estadisticas/producto-detalle returns ventas and compras for specific product"""
        # First get a product ID
        productos_response = auth_session.get(f"{BASE_URL}/api/productos")
        assert productos_response.status_code == 200
        productos = productos_response.json().get("productos", [])
        
        if len(productos) == 0:
            pytest.skip("No products available for testing")
        
        producto_id = productos[0]["id"]
        
        response = auth_session.get(f"{BASE_URL}/api/estadisticas/producto-detalle", params={
            "producto_id": producto_id,
            "periodo": "mes",
            "limite": 12
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should have ventas and compras arrays
        assert "ventas" in data
        assert "compras" in data
        assert isinstance(data["ventas"], list)
        assert isinstance(data["compras"], list)
        
        print(f"✓ GET /api/estadisticas/producto-detalle: ventas={len(data['ventas'])}, compras={len(data['compras'])}")
    
    def test_compras_por_periodo_with_dates(self, auth_session):
        """GET /api/estadisticas/compras-por-periodo accepts date filters"""
        response = auth_session.get(f"{BASE_URL}/api/estadisticas/compras-por-periodo", params={
            "periodo": "mes",
            "fecha_desde": "2025-01-01",
            "fecha_hasta": "2026-12-31"
        })
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ GET /api/estadisticas/compras-por-periodo with dates: {len(data['data'])} periods")
    
    def test_productos_mas_vendidos_with_dates(self, auth_session):
        """GET /api/estadisticas/productos-mas-vendidos accepts date filters"""
        response = auth_session.get(f"{BASE_URL}/api/estadisticas/productos-mas-vendidos", params={
            "limite": 10,
            "fecha_desde": "2025-01-01",
            "fecha_hasta": "2026-12-31"
        })
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ GET /api/estadisticas/productos-mas-vendidos with dates: {len(data['data'])} products")


class TestSearchEndpoints:
    """Test search functionality in API endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200
        return s
    
    def test_productos_search(self, auth_session):
        """GET /api/productos with search parameter"""
        response = auth_session.get(f"{BASE_URL}/api/productos", params={"search": "test"})
        assert response.status_code == 200
        data = response.json()
        assert "productos" in data
        print(f"✓ GET /api/productos?search=test: {len(data['productos'])} results")
    
    def test_clientes_search(self, auth_session):
        """GET /api/clientes with search parameter"""
        response = auth_session.get(f"{BASE_URL}/api/clientes", params={"search": "test"})
        assert response.status_code == 200
        data = response.json()
        assert "clientes" in data
        print(f"✓ GET /api/clientes?search=test: {len(data['clientes'])} results")
    
    def test_proveedores_search(self, auth_session):
        """GET /api/proveedores with search parameter"""
        response = auth_session.get(f"{BASE_URL}/api/proveedores", params={"search": "test"})
        assert response.status_code == 200
        data = response.json()
        assert "proveedores" in data
        print(f"✓ GET /api/proveedores?search=test: {len(data['proveedores'])} results")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
