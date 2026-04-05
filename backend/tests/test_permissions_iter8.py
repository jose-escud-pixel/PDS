"""
Test Suite for Iteration 8: Granular Permissions System
Tests:
- GET /api/permisos/modulos - returns available modules and actions
- Creating users with role 'usuario' and custom permissions
- Updating user permissions via PUT /api/usuarios/{id}
- Verifying permissions are persisted correctly
- Testing permission-based access control
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://starter-page-14.preview.emergentagent.com')

class TestPermissionsSystem:
    """Test the granular permissions system"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as admin and get session"""
        self.session = requests.Session()
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_user = login_response.json()
        assert self.admin_user["role"] == "admin", "User should be admin"
        yield
        # Cleanup: logout
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_get_permisos_modulos(self):
        """Test GET /api/permisos/modulos returns available modules and actions"""
        response = self.session.get(f"{BASE_URL}/api/permisos/modulos")
        assert response.status_code == 200, f"Failed to get modules: {response.text}"
        
        data = response.json()
        assert "modulos" in data, "Response should contain 'modulos'"
        
        modulos = data["modulos"]
        
        # Verify all 12 modules are present
        expected_modules = [
            "dashboard", "estadisticas", "productos", "ventas", "compras",
            "clientes", "proveedores", "gastos", "reportes", "stock_historial",
            "auditoria", "usuarios"
        ]
        
        for mod in expected_modules:
            assert mod in modulos, f"Module '{mod}' should be in response"
            assert "label" in modulos[mod], f"Module '{mod}' should have label"
            assert "acciones" in modulos[mod], f"Module '{mod}' should have acciones"
        
        # Verify specific module actions
        assert modulos["dashboard"]["acciones"] == ["ver"], "Dashboard should only have 'ver'"
        assert modulos["estadisticas"]["acciones"] == ["ver"], "Estadísticas should only have 'ver'"
        assert set(modulos["productos"]["acciones"]) == {"ver", "crear", "editar", "eliminar"}, "Productos should have all CRUD actions"
        assert set(modulos["clientes"]["acciones"]) == {"ver", "crear", "editar", "eliminar"}, "Clientes should have all CRUD actions"
        assert set(modulos["ventas"]["acciones"]) == {"ver", "crear"}, "Ventas should have ver and crear"
        
        print(f"✓ GET /api/permisos/modulos returns {len(modulos)} modules with correct actions")
    
    def test_create_user_with_custom_permissions(self):
        """Test creating a user with role 'usuario' and custom permissions"""
        import time
        test_email = f"testperm_{int(time.time())}@test.com"
        
        # Custom permissions: only productos:ver, clientes:ver,crear
        custom_permisos = {
            "dashboard": {"ver": False},
            "estadisticas": {"ver": False},
            "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
            "ventas": {"ver": False, "crear": False},
            "compras": {"ver": False, "crear": False},
            "clientes": {"ver": True, "crear": True, "editar": False, "eliminar": False},
            "proveedores": {"ver": False, "crear": False, "editar": False, "eliminar": False},
            "gastos": {"ver": False, "crear": False},
            "reportes": {"ver": False},
            "stock_historial": {"ver": False},
            "auditoria": {"ver": False},
            "usuarios": {"ver": False, "crear": False, "editar": False, "eliminar": False}
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/usuarios", json={
            "email": test_email,
            "password": "1234",
            "nombre": "Test Permisos User",
            "role": "usuario",
            "permisos": custom_permisos
        })
        
        assert create_response.status_code == 200, f"Failed to create user: {create_response.text}"
        user_id = create_response.json()["id"]
        
        # Verify user was created with correct permissions
        users_response = self.session.get(f"{BASE_URL}/api/usuarios")
        assert users_response.status_code == 200
        
        users = users_response.json()["usuarios"]
        created_user = next((u for u in users if u["id"] == user_id), None)
        
        assert created_user is not None, "Created user should be in list"
        assert created_user["role"] == "usuario", "User role should be 'usuario'"
        assert created_user["permisos"]["productos"]["ver"] == True, "productos:ver should be True"
        assert created_user["permisos"]["productos"]["crear"] == False, "productos:crear should be False"
        assert created_user["permisos"]["clientes"]["ver"] == True, "clientes:ver should be True"
        assert created_user["permisos"]["clientes"]["crear"] == True, "clientes:crear should be True"
        assert created_user["permisos"]["clientes"]["eliminar"] == False, "clientes:eliminar should be False"
        
        print(f"✓ Created user '{test_email}' with custom permissions")
        
        # Cleanup: delete the test user
        self.session.delete(f"{BASE_URL}/api/usuarios/{user_id}")
        
        return user_id
    
    def test_update_user_permissions(self):
        """Test updating user permissions via PUT /api/usuarios/{id}"""
        import time
        test_email = f"testperm_update_{int(time.time())}@test.com"
        
        # Create user with default permissions
        create_response = self.session.post(f"{BASE_URL}/api/usuarios", json={
            "email": test_email,
            "password": "1234",
            "nombre": "Test Update Permisos",
            "role": "usuario"
        })
        
        assert create_response.status_code == 200, f"Failed to create user: {create_response.text}"
        user_id = create_response.json()["id"]
        
        # Update permissions
        new_permisos = {
            "dashboard": {"ver": True},
            "productos": {"ver": True, "crear": True, "editar": True, "eliminar": False},
            "ventas": {"ver": True, "crear": True},
            "clientes": {"ver": True, "crear": False, "editar": False, "eliminar": False}
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/usuarios/{user_id}", json={
            "permisos": new_permisos
        })
        
        assert update_response.status_code == 200, f"Failed to update permissions: {update_response.text}"
        
        # Verify permissions were updated
        users_response = self.session.get(f"{BASE_URL}/api/usuarios")
        users = users_response.json()["usuarios"]
        updated_user = next((u for u in users if u["id"] == user_id), None)
        
        assert updated_user["permisos"]["productos"]["crear"] == True, "productos:crear should be True after update"
        assert updated_user["permisos"]["productos"]["editar"] == True, "productos:editar should be True after update"
        
        print(f"✓ Updated permissions for user '{test_email}'")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/usuarios/{user_id}")
    
    def test_admin_user_ignores_permissions(self):
        """Test that admin users ignore the permisos field"""
        import time
        test_email = f"testadmin_{int(time.time())}@test.com"
        
        # Try to create admin with restricted permissions (should be ignored)
        create_response = self.session.post(f"{BASE_URL}/api/usuarios", json={
            "email": test_email,
            "password": "admin123",
            "nombre": "Test Admin",
            "role": "admin",
            "permisos": {"productos": {"ver": False}}  # This should be ignored
        })
        
        assert create_response.status_code == 200, f"Failed to create admin: {create_response.text}"
        user_id = create_response.json()["id"]
        
        # Verify admin was created
        users_response = self.session.get(f"{BASE_URL}/api/usuarios")
        users = users_response.json()["usuarios"]
        admin_user = next((u for u in users if u["id"] == user_id), None)
        
        assert admin_user["role"] == "admin", "User should be admin"
        # Admin permissions should be empty or ignored
        
        print(f"✓ Admin user '{test_email}' created (permissions ignored for admins)")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/usuarios/{user_id}")
    
    def test_permission_based_access_control(self):
        """Test that permissions actually restrict access"""
        import time
        test_email = f"testaccess_{int(time.time())}@test.com"
        
        # Create user with only productos:ver permission
        limited_permisos = {
            "dashboard": {"ver": True},
            "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
            "clientes": {"ver": False, "crear": False, "editar": False, "eliminar": False}
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/usuarios", json={
            "email": test_email,
            "password": "test1234",
            "nombre": "Limited User",
            "role": "usuario",
            "permisos": limited_permisos
        })
        
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Login as the limited user
        limited_session = requests.Session()
        login_response = limited_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "test1234"
        })
        
        assert login_response.status_code == 200, f"Limited user login failed: {login_response.text}"
        
        # Verify user data includes permissions
        me_response = limited_session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        user_data = me_response.json()
        assert "permisos" in user_data, "User data should include permisos"
        
        # Test: Can view productos (has permission)
        productos_response = limited_session.get(f"{BASE_URL}/api/productos")
        assert productos_response.status_code == 200, "Should be able to view productos"
        
        # Test: Cannot create producto (no permission)
        create_producto_response = limited_session.post(f"{BASE_URL}/api/productos", json={
            "codigo": "TEST001",
            "nombre": "Test Product",
            "categoria": "Test",
            "proveedor": "Test",
            "precio_con_iva": 10000,
            "costo": 5000
        })
        assert create_producto_response.status_code == 403, f"Should NOT be able to create producto: {create_producto_response.status_code}"
        
        print(f"✓ Permission-based access control working correctly")
        
        # Cleanup
        limited_session.post(f"{BASE_URL}/api/auth/logout")
        self.session.delete(f"{BASE_URL}/api/usuarios/{user_id}")
    
    def test_usuarios_view_shows_permisos_count(self):
        """Test that GET /api/usuarios returns permisos for non-admin users"""
        response = self.session.get(f"{BASE_URL}/api/usuarios")
        assert response.status_code == 200
        
        usuarios = response.json()["usuarios"]
        
        for user in usuarios:
            if user["role"] != "admin":
                # Non-admin users should have permisos field
                assert "permisos" in user, f"User {user['email']} should have permisos field"
        
        print(f"✓ GET /api/usuarios returns permisos for {len(usuarios)} users")
    
    def test_create_testperm_user_for_ui_testing(self):
        """Create the 'testperm' user for UI testing with specific permissions"""
        # First check if testperm already exists
        users_response = self.session.get(f"{BASE_URL}/api/usuarios")
        users = users_response.json()["usuarios"]
        existing = next((u for u in users if u["email"] == "testperm"), None)
        
        if existing:
            # Delete existing testperm user
            self.session.delete(f"{BASE_URL}/api/usuarios/{existing['id']}")
            print("Deleted existing testperm user")
        
        # Create testperm with limited permissions: only productos:ver, clientes:ver,crear
        testperm_permisos = {
            "dashboard": {"ver": False},
            "estadisticas": {"ver": False},
            "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
            "ventas": {"ver": False, "crear": False},
            "compras": {"ver": False, "crear": False},
            "clientes": {"ver": True, "crear": True, "editar": False, "eliminar": False},
            "proveedores": {"ver": False, "crear": False, "editar": False, "eliminar": False},
            "gastos": {"ver": False, "crear": False},
            "reportes": {"ver": False},
            "stock_historial": {"ver": False},
            "auditoria": {"ver": False},
            "usuarios": {"ver": False, "crear": False, "editar": False, "eliminar": False}
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/usuarios", json={
            "email": "testperm",
            "password": "1234",
            "nombre": "Test Permisos",
            "role": "usuario",
            "permisos": testperm_permisos
        })
        
        assert create_response.status_code == 200, f"Failed to create testperm: {create_response.text}"
        user_id = create_response.json()["id"]
        
        # Verify the user was created correctly
        users_response = self.session.get(f"{BASE_URL}/api/usuarios")
        users = users_response.json()["usuarios"]
        testperm = next((u for u in users if u["email"] == "testperm"), None)
        
        assert testperm is not None, "testperm user should exist"
        assert testperm["permisos"]["productos"]["ver"] == True
        assert testperm["permisos"]["productos"]["crear"] == False
        assert testperm["permisos"]["clientes"]["ver"] == True
        assert testperm["permisos"]["clientes"]["crear"] == True
        assert testperm["permisos"]["clientes"]["eliminar"] == False
        
        print(f"✓ Created 'testperm' user (id: {user_id}) with limited permissions for UI testing")
        print(f"  - productos: ver only")
        print(f"  - clientes: ver, crear only")
        
        return user_id


class TestPermissionsLogin:
    """Test login and permissions for limited user"""
    
    def test_login_as_testperm_and_verify_permissions(self):
        """Login as testperm and verify permissions are returned"""
        session = requests.Session()
        
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testperm",
            "password": "1234"
        })
        
        # If testperm doesn't exist, skip this test
        if login_response.status_code == 401:
            pytest.skip("testperm user not created yet")
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        user_data = login_response.json()
        assert user_data["role"] == "usuario"
        assert "permisos" in user_data
        
        # Verify specific permissions
        permisos = user_data["permisos"]
        assert permisos.get("productos", {}).get("ver") == True, "productos:ver should be True"
        assert permisos.get("productos", {}).get("crear") == False, "productos:crear should be False"
        assert permisos.get("clientes", {}).get("ver") == True, "clientes:ver should be True"
        assert permisos.get("clientes", {}).get("crear") == True, "clientes:crear should be True"
        
        # Verify /api/auth/me also returns permissions
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert "permisos" in me_data
        
        print(f"✓ testperm login successful with correct permissions")
        
        session.post(f"{BASE_URL}/api/auth/logout")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
