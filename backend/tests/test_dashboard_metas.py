"""
Test suite for Dashboard Config and Metas (Sales Goals) endpoints
Tests: GET/POST /api/dashboard/config, GET /api/dashboard/templates, GET/POST /api/metas
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "andy.escudero"
ADMIN_PASSWORD = "secreto"


class TestDashboardAndMetas:
    """Dashboard configuration and Metas (sales goals) tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get auth cookie
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        print(f"✓ Logged in as {ADMIN_EMAIL}")
        yield
        # Logout after tests
        try:
            self.session.post(f"{BASE_URL}/api/auth/logout")
        except:
            pass
    
    # ============ DASHBOARD DATA TESTS ============
    def test_get_dashboard_data(self):
        """Test GET /api/dashboard returns resumen data"""
        response = self.session.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        
        data = response.json()
        assert "resumen" in data, "Missing 'resumen' in dashboard response"
        assert "top_productos" in data, "Missing 'top_productos' in dashboard response"
        assert "top_clientes" in data, "Missing 'top_clientes' in dashboard response"
        assert "bajo_stock" in data, "Missing 'bajo_stock' in dashboard response"
        
        # Validate resumen structure
        resumen = data["resumen"]
        assert "total_ventas" in resumen
        assert "total_compras" in resumen
        assert "total_productos" in resumen
        print(f"✓ Dashboard data loaded: {resumen.get('total_productos', 0)} products")
    
    # ============ DASHBOARD TEMPLATES TESTS ============
    def test_get_dashboard_templates(self):
        """Test GET /api/dashboard/templates returns 4 templates"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/templates")
        assert response.status_code == 200, f"Templates failed: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Missing 'templates' in response"
        
        templates = data["templates"]
        expected_templates = ["ejecutivo", "ventas", "inventario", "analitico"]
        
        for template_key in expected_templates:
            assert template_key in templates, f"Missing template: {template_key}"
            template = templates[template_key]
            assert "nombre" in template, f"Template {template_key} missing 'nombre'"
            assert "descripcion" in template, f"Template {template_key} missing 'descripcion'"
            assert "widgets" in template, f"Template {template_key} missing 'widgets'"
            assert len(template["widgets"]) > 0, f"Template {template_key} has no widgets"
        
        print(f"✓ Found {len(templates)} templates: {list(templates.keys())}")
    
    def test_template_ejecutivo_has_correct_widgets(self):
        """Test Ejecutivo template has expected widgets"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/templates")
        assert response.status_code == 200
        
        ejecutivo = response.json()["templates"]["ejecutivo"]
        widget_ids = [w["i"] for w in ejecutivo["widgets"]]
        
        # Ejecutivo should have stat cards, metas, charts, and alerts
        assert "stat-ventas" in widget_ids, "Ejecutivo missing stat-ventas"
        assert "meta-ventas" in widget_ids, "Ejecutivo missing meta-ventas"
        assert "chart-ventas-periodo" in widget_ids, "Ejecutivo missing chart-ventas-periodo"
        assert "alerta-stock" in widget_ids, "Ejecutivo missing alerta-stock"
        print(f"✓ Ejecutivo template has {len(widget_ids)} widgets")
    
    # ============ DASHBOARD CONFIG TESTS ============
    def test_get_dashboard_config(self):
        """Test GET /api/dashboard/config returns layout config"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/config")
        assert response.status_code == 200, f"Config failed: {response.text}"
        
        data = response.json()
        assert "template" in data, "Missing 'template' in config"
        assert "layout" in data, "Missing 'layout' in config"
        assert "custom" in data, "Missing 'custom' in config"
        
        # Layout should be a list of widget positions
        assert isinstance(data["layout"], list), "Layout should be a list"
        if len(data["layout"]) > 0:
            widget = data["layout"][0]
            assert "i" in widget, "Widget missing 'i' (id)"
            assert "x" in widget, "Widget missing 'x' position"
            assert "y" in widget, "Widget missing 'y' position"
            assert "w" in widget, "Widget missing 'w' (width)"
            assert "h" in widget, "Widget missing 'h' (height)"
        
        print(f"✓ Dashboard config: template={data['template']}, custom={data['custom']}, widgets={len(data['layout'])}")
    
    def test_save_dashboard_config(self):
        """Test POST /api/dashboard/config saves layout successfully"""
        # First get current config
        get_response = self.session.get(f"{BASE_URL}/api/dashboard/config")
        original_config = get_response.json()
        
        # Save a custom layout
        test_layout = [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 4, "h": 2},
            {"i": "stat-compras", "x": 4, "y": 0, "w": 4, "h": 2},
            {"i": "meta-ventas", "x": 8, "y": 0, "w": 4, "h": 3},
        ]
        
        save_response = self.session.post(f"{BASE_URL}/api/dashboard/config", json={
            "template": "ejecutivo",
            "layout": test_layout,
            "custom": True
        })
        assert save_response.status_code == 200, f"Save config failed: {save_response.text}"
        assert "message" in save_response.json()
        
        # Verify the config was saved
        verify_response = self.session.get(f"{BASE_URL}/api/dashboard/config")
        assert verify_response.status_code == 200
        
        saved_config = verify_response.json()
        assert saved_config["custom"] == True, "Custom flag not saved"
        assert len(saved_config["layout"]) == 3, f"Layout not saved correctly, got {len(saved_config['layout'])} widgets"
        
        # Restore original config
        self.session.post(f"{BASE_URL}/api/dashboard/config", json=original_config)
        print("✓ Dashboard config saved and verified")
    
    def test_apply_template_resets_custom(self):
        """Test applying a template resets custom flag"""
        # Get templates
        templates_response = self.session.get(f"{BASE_URL}/api/dashboard/templates")
        ventas_template = templates_response.json()["templates"]["ventas"]
        
        # Apply ventas template
        save_response = self.session.post(f"{BASE_URL}/api/dashboard/config", json={
            "template": "ventas",
            "layout": ventas_template["widgets"],
            "custom": False
        })
        assert save_response.status_code == 200
        
        # Verify
        verify_response = self.session.get(f"{BASE_URL}/api/dashboard/config")
        config = verify_response.json()
        assert config["template"] == "ventas"
        assert config["custom"] == False
        
        # Restore to ejecutivo
        ejecutivo_template = templates_response.json()["templates"]["ejecutivo"]
        self.session.post(f"{BASE_URL}/api/dashboard/config", json={
            "template": "ejecutivo",
            "layout": ejecutivo_template["widgets"],
            "custom": False
        })
        print("✓ Template application works correctly")
    
    # ============ METAS (SALES GOALS) TESTS ============
    def test_get_metas(self):
        """Test GET /api/metas returns current period goals"""
        response = self.session.get(f"{BASE_URL}/api/metas")
        assert response.status_code == 200, f"Metas failed: {response.text}"
        
        data = response.json()
        assert "periodo" in data, "Missing 'periodo' in metas"
        assert "meta_ventas" in data, "Missing 'meta_ventas' in metas"
        assert "actual_ventas" in data, "Missing 'actual_ventas' in metas"
        assert "tiene_meta" in data, "Missing 'tiene_meta' in metas"
        
        # Verify periodo format (YYYY-MM)
        periodo = data["periodo"]
        assert len(periodo) == 7, f"Invalid periodo format: {periodo}"
        assert periodo[4] == "-", f"Invalid periodo format: {periodo}"
        
        print(f"✓ Metas: periodo={periodo}, tiene_meta={data['tiene_meta']}, actual={data['actual_ventas']}")
    
    def test_set_meta_as_admin(self):
        """Test POST /api/metas sets a new sales goal (admin only)"""
        # Get current period
        current_periodo = datetime.now().strftime("%Y-%m")
        
        # Set a test meta
        test_meta = 50000000  # 50 million Gs
        
        response = self.session.post(f"{BASE_URL}/api/metas", json={
            "periodo": current_periodo,
            "meta_ventas": test_meta,
            "meta_utilidad": 10000000,
            "meta_cantidad": 100
        })
        assert response.status_code == 200, f"Set meta failed: {response.text}"
        assert "message" in response.json()
        
        # Verify the meta was saved
        verify_response = self.session.get(f"{BASE_URL}/api/metas")
        assert verify_response.status_code == 200
        
        metas = verify_response.json()
        assert metas["tiene_meta"] == True, "Meta not marked as set"
        assert metas["meta_ventas"] == test_meta, f"Meta value not saved correctly: {metas['meta_ventas']}"
        
        print(f"✓ Meta set successfully: {test_meta} Gs for {current_periodo}")
    
    def test_metas_progress_calculation(self):
        """Test that metas progress is calculated correctly"""
        response = self.session.get(f"{BASE_URL}/api/metas")
        assert response.status_code == 200
        
        data = response.json()
        
        if data["tiene_meta"] and data["meta_ventas"] > 0:
            # Verify percentage calculation
            expected_percentage = min(100, (data["actual_ventas"] / data["meta_ventas"]) * 100)
            actual_percentage = data["porcentaje_ventas"]
            
            # Allow small floating point differences
            assert abs(expected_percentage - actual_percentage) < 0.1, \
                f"Percentage mismatch: expected {expected_percentage}, got {actual_percentage}"
            
            print(f"✓ Progress calculation correct: {actual_percentage:.1f}%")
        else:
            print("✓ No meta set, skipping progress calculation test")
    
    # ============ STATISTICS ENDPOINTS TESTS ============
    def test_ventas_por_periodo(self):
        """Test GET /api/estadisticas/ventas-por-periodo"""
        response = self.session.get(f"{BASE_URL}/api/estadisticas/ventas-por-periodo", params={
            "periodo": "mes",
            "limite": 12
        })
        assert response.status_code == 200, f"Ventas por periodo failed: {response.text}"
        
        data = response.json()
        assert "data" in data
        print(f"✓ Ventas por periodo: {len(data['data'])} periods")
    
    def test_productos_mas_vendidos(self):
        """Test GET /api/estadisticas/productos-mas-vendidos"""
        response = self.session.get(f"{BASE_URL}/api/estadisticas/productos-mas-vendidos", params={
            "limite": 10
        })
        assert response.status_code == 200, f"Productos mas vendidos failed: {response.text}"
        
        data = response.json()
        assert "data" in data
        print(f"✓ Productos mas vendidos: {len(data['data'])} products")
    
    def test_stock_por_categoria(self):
        """Test GET /api/estadisticas/stock-por-categoria"""
        response = self.session.get(f"{BASE_URL}/api/estadisticas/stock-por-categoria")
        assert response.status_code == 200, f"Stock por categoria failed: {response.text}"
        
        data = response.json()
        assert "data" in data
        print(f"✓ Stock por categoria: {len(data['data'])} categories")


class TestDashboardUnauthorized:
    """Test dashboard endpoints require authentication"""
    
    def test_dashboard_requires_auth(self):
        """Test GET /api/dashboard requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard requires authentication")
    
    def test_dashboard_config_requires_auth(self):
        """Test GET /api/dashboard/config requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/dashboard/config")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard config requires authentication")
    
    def test_metas_requires_auth(self):
        """Test GET /api/metas requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/metas")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Metas requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
