#!/usr/bin/env python3
"""
PDS Backend API Testing Suite
Tests all endpoints for the dental supplies management system with JWT authentication
"""
import requests
import sys
import json
from datetime import datetime

class PDSAPITester:
    def __init__(self, base_url="https://starter-page-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_data = {}
        self.session = requests.Session()
        self.admin_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_login(self):
        """Test login with admin credentials"""
        login_data = {
            "email": "andy.escudero",
            "password": "secreto"
        }
        
        success, data = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data,
            auth_required=False
        )
        
        if success:
            self.admin_user = data
            print(f"   Logged in as: {data.get('email')} ({data.get('role')})")
            
            # Test invalid login
            invalid_data = {
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
            
            success, _ = self.run_test(
                "Invalid Login",
                "POST",
                "api/auth/login",
                401,
                data=invalid_data,
                auth_required=False
            )
        
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        success, data = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        
        if success:
            print(f"   User info: {data.get('email')} - {data.get('role')}")
        
        return success

    def test_protected_access(self):
        """Test protected endpoints without authentication"""
        # Save current session
        temp_session = self.session
        self.session = requests.Session()  # New session without auth
        
        success, _ = self.run_test(
            "Protected Access Without Auth",
            "GET",
            "api/dashboard",
            401,
            auth_required=False
        )
        
        # Restore session
        self.session = temp_session
        return success

    def test_usuarios_management(self):
        """Test user management (admin only)"""
        if not self.admin_user or self.admin_user.get('role') != 'admin':
            print("   ⚠️  Skipping user management - not admin")
            return True
        
        # Get usuarios
        success, data = self.run_test(
            "Get Usuarios",
            "GET",
            "api/usuarios",
            200
        )
        if not success:
            return False
        
        usuarios = data.get('usuarios', [])
        print(f"   Found {len(usuarios)} usuarios")
        
        # Create test user
        test_user = {
            "email": f"testuser{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "nombre": "Test User",
            "role": "usuario",
            "permisos": {
                "dashboard": {"ver": True},
                "productos": {"ver": True, "crear": False, "editar": False, "eliminar": False},
                "ventas": {"ver": True, "crear": True, "editar": False, "eliminar": False}
            }
        }
        
        success, data = self.run_test(
            "Create Usuario",
            "POST",
            "api/usuarios",
            200,
            data=test_user
        )
        
        if success:
            user_id = data.get('id')
            self.test_data['test_user_id'] = user_id
            
            # Test update user
            if user_id:
                update_data = {
                    "nombre": "Updated Test User",
                    "role": "usuario"
                }
                success, _ = self.run_test(
                    "Update Usuario",
                    "PUT",
                    f"api/usuarios/{user_id}",
                    200,
                    data=update_data
                )
                
                # Test change password
                if success:
                    password_data = {"password": "newpassword123"}
                    success, _ = self.run_test(
                        "Change User Password",
                        "PUT",
                        f"api/usuarios/{user_id}/password",
                        200,
                        data=password_data
                    )
        
        return success

    def test_auditoria(self):
        """Test audit system (admin only)"""
        if not self.admin_user or self.admin_user.get('role') != 'admin':
            print("   ⚠️  Skipping audit - not admin")
            return True
        
        success, data = self.run_test(
            "Get Auditoria",
            "GET",
            "api/auditoria",
            200
        )
        
        if success:
            registros = data.get('registros', [])
            print(f"   Found {len(registros)} audit records")
            
            # Test filtered audit
            success, data = self.run_test(
                "Get Auditoria Filtered",
                "GET",
                "api/auditoria",
                200,
                params={'modulo': 'auth'}
            )
        
        return success

    def test_stock_movimientos(self):
        """Test stock movements"""
        success, data = self.run_test(
            "Get Stock Movimientos",
            "GET",
            "api/stock-movimientos",
            200
        )
        
        if success:
            movimientos = data.get('movimientos', [])
            print(f"   Found {len(movimientos)} stock movements")
            
            # Test stock adjustment if we have a product
            producto_id = self.test_data.get('test_producto_id')
            if producto_id:
                ajuste_data = {
                    "cantidad": 5,
                    "motivo": "Test adjustment"
                }
                success, _ = self.run_test(
                    "Ajustar Stock",
                    "POST",
                    f"api/productos/{producto_id}/ajuste-stock",
                    200,
                    data=ajuste_data
                )
        
        return success

    def test_reportes(self):
        """Test reports and CSV exports"""
        # Test ventas report
        success, data = self.run_test(
            "Reporte Ventas JSON",
            "GET",
            "api/reportes/ventas",
            200
        )
        if not success:
            return False
        
        # Test productos report
        success, data = self.run_test(
            "Reporte Productos JSON",
            "GET",
            "api/reportes/productos",
            200
        )
        if not success:
            return False
        
        # Test stock movements report
        success, data = self.run_test(
            "Reporte Stock Movimientos JSON",
            "GET",
            "api/reportes/stock-movimientos",
            200
        )
        if not success:
            return False
        
        # Test CSV exports (should return CSV content)
        print("\n   Testing CSV exports...")
        try:
            # Ventas CSV
            url = f"{self.base_url}/api/reportes/ventas?formato=csv"
            response = self.session.get(url, timeout=10)
            if response.status_code == 200 and 'text/csv' in response.headers.get('content-type', ''):
                print("   ✅ Ventas CSV export working")
            else:
                print(f"   ❌ Ventas CSV failed: {response.status_code}")
                success = False
            
            # Productos CSV
            url = f"{self.base_url}/api/reportes/productos?formato=csv"
            response = self.session.get(url, timeout=10)
            if response.status_code == 200 and 'text/csv' in response.headers.get('content-type', ''):
                print("   ✅ Productos CSV export working")
            else:
                print(f"   ❌ Productos CSV failed: {response.status_code}")
                success = False
            
            # Stock movements CSV
            url = f"{self.base_url}/api/reportes/stock-movimientos?formato=csv"
            response = self.session.get(url, timeout=10)
            if response.status_code == 200 and 'text/csv' in response.headers.get('content-type', ''):
                print("   ✅ Stock movements CSV export working")
            else:
                print(f"   ❌ Stock movements CSV failed: {response.status_code}")
                success = False
                
        except Exception as e:
            print(f"   ❌ CSV export test failed: {str(e)}")
            success = False
        
        return success

    def test_logout(self):
        """Test logout functionality"""
        success, data = self.run_test(
            "Logout",
            "POST",
            "api/auth/logout",
            200
        )
        
        if success:
            # Test that we can't access protected endpoints after logout
            success, _ = self.run_test(
                "Access After Logout",
                "GET",
                "api/dashboard",
                401,
                auth_required=False
            )
        
        return success

    def test_health_check(self):
        """Test health check endpoint"""
        success, data = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_dashboard(self):
        """Test dashboard endpoint"""
        success, data = self.run_test(
            "Dashboard",
            "GET", 
            "api/dashboard",
            200
        )
        if success:
            self.test_data['dashboard'] = data
        return success

    def test_productos_crud(self):
        """Test productos CRUD operations"""
        # Get productos
        success, data = self.run_test(
            "Get Productos",
            "GET",
            "api/productos",
            200
        )
        if not success:
            return False
        
        productos = data.get('productos', [])
        print(f"   Found {len(productos)} productos")
        
        # Test search
        success, data = self.run_test(
            "Search Productos",
            "GET",
            "api/productos",
            200,
            params={'search': 'test'}
        )
        if not success:
            return False

        # Test categorias
        success, data = self.run_test(
            "Get Categorias",
            "GET",
            "api/categorias",
            200
        )
        if not success:
            return False

        # Create test producto
        test_producto = {
            "codigo": f"TEST{datetime.now().strftime('%H%M%S')}",
            "nombre": "Producto Test",
            "variante": "Test Variant",
            "categoria": "Test Category",
            "proveedor": "Test Provider",
            "precio_con_iva": 100000,
            "iva_pct": 10,
            "costo": 80000,
            "stock": 10,
            "stock_minimo": 2,
            "margen": 15
        }
        
        success, data = self.run_test(
            "Create Producto",
            "POST",
            "api/productos",
            200,
            data=test_producto
        )
        if success:
            producto_id = data.get('id')
            self.test_data['test_producto_id'] = producto_id
            
            # Test get single producto
            if producto_id:
                success, data = self.run_test(
                    "Get Single Producto",
                    "GET",
                    f"api/productos/{producto_id}",
                    200
                )
                
                # Test update producto
                if success:
                    update_data = {"nombre": "Updated Test Product"}
                    success, data = self.run_test(
                        "Update Producto",
                        "PUT",
                        f"api/productos/{producto_id}",
                        200,
                        data=update_data
                    )
        
        return success

    def test_clientes_crud(self):
        """Test clientes CRUD operations"""
        # Get clientes
        success, data = self.run_test(
            "Get Clientes",
            "GET",
            "api/clientes",
            200
        )
        if not success:
            return False
        
        clientes = data.get('clientes', [])
        print(f"   Found {len(clientes)} clientes")
        
        # Create test cliente
        test_cliente = {
            "nombre": f"Cliente Test {datetime.now().strftime('%H%M%S')}",
            "ruc": "12345678-9",
            "telefono": "0981123456",
            "direccion": "Test Address",
            "ciudad": "Asunción",
            "tipo": "Odontólogo"
        }
        
        success, data = self.run_test(
            "Create Cliente",
            "POST",
            "api/clientes",
            200,
            data=test_cliente
        )
        if success:
            cliente_id = data.get('id')
            self.test_data['test_cliente_id'] = cliente_id
            
            # Test update cliente
            if cliente_id:
                update_data = {"telefono": "0981654321"}
                success, data = self.run_test(
                    "Update Cliente",
                    "PUT",
                    f"api/clientes/{cliente_id}",
                    200,
                    data=test_cliente  # Full object required
                )
        
        return success

    def test_proveedores_crud(self):
        """Test proveedores CRUD operations"""
        # Get proveedores
        success, data = self.run_test(
            "Get Proveedores",
            "GET",
            "api/proveedores",
            200
        )
        if not success:
            return False
        
        proveedores = data.get('proveedores', [])
        print(f"   Found {len(proveedores)} proveedores")
        
        # Create test proveedor
        test_proveedor = {
            "nombre": f"Proveedor Test {datetime.now().strftime('%H%M%S')}",
            "ruc": "87654321-0",
            "direccion": "Test Provider Address",
            "contacto": "Test Contact",
            "telefono": "021123456"
        }
        
        success, data = self.run_test(
            "Create Proveedor",
            "POST",
            "api/proveedores",
            200,
            data=test_proveedor
        )
        if success:
            proveedor_id = data.get('id')
            self.test_data['test_proveedor_id'] = proveedor_id
        
        return success

    def test_ventas_crud(self):
        """Test ventas CRUD operations"""
        # Get ventas
        success, data = self.run_test(
            "Get Ventas",
            "GET",
            "api/ventas",
            200
        )
        if not success:
            return False
        
        ventas = data.get('ventas', [])
        print(f"   Found {len(ventas)} ventas")
        
        # Test venta creation (requires existing cliente and producto)
        cliente_id = self.test_data.get('test_cliente_id')
        producto_id = self.test_data.get('test_producto_id')
        
        if cliente_id and producto_id:
            test_venta = {
                "cliente_id": cliente_id,
                "cliente_nombre": "Cliente Test",
                "items": [{
                    "producto_id": producto_id,
                    "codigo": "TEST123",
                    "nombre": "Producto Test",
                    "cantidad": 2,
                    "precio_unitario": 100000,
                    "costo_unitario": 80000,
                    "iva_pct": 10
                }],
                "observaciones": "Test sale"
            }
            
            success, data = self.run_test(
                "Create Venta",
                "POST",
                "api/ventas",
                200,
                data=test_venta
            )
        else:
            print("   ⚠️  Skipping venta creation - missing cliente or producto")
            success = True
        
        return success

    def test_compras_crud(self):
        """Test compras CRUD operations"""
        # Get compras
        success, data = self.run_test(
            "Get Compras",
            "GET",
            "api/compras",
            200
        )
        if not success:
            return False
        
        compras = data.get('compras', [])
        print(f"   Found {len(compras)} compras")
        
        # Test compra creation (requires existing proveedor and producto)
        proveedor_id = self.test_data.get('test_proveedor_id')
        producto_id = self.test_data.get('test_producto_id')
        
        if proveedor_id and producto_id:
            test_compra = {
                "proveedor_id": proveedor_id,
                "proveedor_nombre": "Proveedor Test",
                "factura": "FAC-001",
                "items": [{
                    "producto_id": producto_id,
                    "codigo": "TEST123",
                    "nombre": "Producto Test",
                    "cantidad": 5,
                    "precio_unitario": 90000,
                    "iva_pct": 10
                }],
                "observaciones": "Test purchase"
            }
            
            success, data = self.run_test(
                "Create Compra",
                "POST",
                "api/compras",
                200,
                data=test_compra
            )
        else:
            print("   ⚠️  Skipping compra creation - missing proveedor or producto")
            success = True
        
        return success

    def test_gastos_crud(self):
        """Test gastos CRUD operations"""
        # Get gastos
        success, data = self.run_test(
            "Get Gastos",
            "GET",
            "api/gastos",
            200
        )
        if not success:
            return False
        
        gastos = data.get('gastos', [])
        print(f"   Found {len(gastos)} gastos")
        
        # Create test gasto
        test_gasto = {
            "fecha": datetime.now().isoformat(),
            "categoria": "Test Category",
            "descripcion": "Test expense",
            "monto": 50000,
            "iva_pct": 10,
            "proveedor": "Test Provider"
        }
        
        success, data = self.run_test(
            "Create Gasto",
            "POST",
            "api/gastos",
            200,
            data=test_gasto
        )
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test user
        if 'test_user_id' in self.test_data:
            self.run_test(
                "Delete Test User",
                "DELETE",
                f"api/usuarios/{self.test_data['test_user_id']}",
                200
            )
        
        # Delete test producto
        if 'test_producto_id' in self.test_data:
            self.run_test(
                "Delete Test Producto",
                "DELETE",
                f"api/productos/{self.test_data['test_producto_id']}",
                200
            )
        
        # Delete test cliente
        if 'test_cliente_id' in self.test_data:
            self.run_test(
                "Delete Test Cliente",
                "DELETE",
                f"api/clientes/{self.test_data['test_cliente_id']}",
                200
            )
        
        # Delete test proveedor
        if 'test_proveedor_id' in self.test_data:
            self.run_test(
                "Delete Test Proveedor",
                "DELETE",
                f"api/proveedores/{self.test_data['test_proveedor_id']}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting PDS API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 50)
        
        # Authentication and core tests
        tests = [
            self.test_health_check,
            self.test_login,
            self.test_auth_me,
            self.test_protected_access,
            self.test_dashboard,
            self.test_usuarios_management,
            self.test_auditoria,
            self.test_productos_crud,
            self.test_clientes_crud,
            self.test_proveedores_crud,
            self.test_ventas_crud,
            self.test_compras_crud,
            self.test_gastos_crud,
            self.test_stock_movimientos,
            self.test_reportes,
            self.test_logout
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
                self.failed_tests.append({
                    'name': test.__name__,
                    'error': str(e)
                })
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
                print(f"   - {failure['name']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = PDSAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())