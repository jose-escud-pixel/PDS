#!/usr/bin/env python3
"""
PDS Backend API Testing Suite
Tests all endpoints for the dental supplies management system
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

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

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
        
        # Core tests
        tests = [
            self.test_health_check,
            self.test_dashboard,
            self.test_productos_crud,
            self.test_clientes_crud,
            self.test_proveedores_crud,
            self.test_ventas_crud,
            self.test_compras_crud,
            self.test_gastos_crud
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