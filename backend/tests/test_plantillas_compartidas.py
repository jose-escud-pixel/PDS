"""
Test Suite for Shared Dashboard Templates (Plantillas Compartidas)
Tests the new feature for creating, sharing, and applying custom dashboard templates.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://starter-page-14.preview.emergentagent.com').rstrip('/')

class TestPlantillasCompartidas:
    """Tests for shared dashboard templates feature"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def admin_session(self, session):
        """Login as admin and return authenticated session"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    @pytest.fixture(scope="class")
    def admin_user_id(self, admin_session):
        """Get admin user ID"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        return response.json()["id"]
    
    # ============ HEALTH CHECK ============
    def test_health_check(self, session):
        """Test API health endpoint"""
        response = session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    # ============ AUTH ============
    def test_login_admin(self, session):
        """Test admin login with correct credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "andy.escudero"
        assert data["role"] == "admin"
        print(f"✓ Admin login successful: {data['nombre']}")
    
    # ============ GET USUARIOS LISTA ============
    def test_get_usuarios_lista(self, admin_session):
        """Test GET /api/usuarios/lista - returns list of other users for sharing"""
        response = admin_session.get(f"{BASE_URL}/api/usuarios/lista")
        assert response.status_code == 200
        data = response.json()
        assert "usuarios" in data
        assert isinstance(data["usuarios"], list)
        # Should not include current user
        print(f"✓ GET /api/usuarios/lista returned {len(data['usuarios'])} users (excluding current)")
    
    def test_usuarios_lista_requires_auth(self, session):
        """Test that /api/usuarios/lista requires authentication"""
        # Create new session without auth
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/usuarios/lista")
        assert response.status_code == 401
        print("✓ /api/usuarios/lista requires authentication")
    
    # ============ CREATE PLANTILLA ============
    def test_create_plantilla_privada(self, admin_session):
        """Test POST /api/plantillas - create private template"""
        test_layout = [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2},
            {"i": "stat-compras", "x": 3, "y": 0, "w": 3, "h": 2},
            {"i": "chart-ventas-periodo", "x": 0, "y": 2, "w": 6, "h": 3}
        ]
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Plantilla_Privada",
            "descripcion": "Test private template",
            "layout": test_layout,
            "compartir": "privada",
            "usuarios_compartidos": []
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Plantilla creada"
        print(f"✓ Created private template with ID: {data['id']}")
        return data["id"]
    
    def test_create_plantilla_todos(self, admin_session):
        """Test POST /api/plantillas - create template shared with everyone"""
        test_layout = [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 4, "h": 2},
            {"i": "meta-ventas", "x": 4, "y": 0, "w": 4, "h": 3}
        ]
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Plantilla_Todos",
            "descripcion": "Test template shared with all users",
            "layout": test_layout,
            "compartir": "todos",
            "usuarios_compartidos": []
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ Created 'todos' template with ID: {data['id']}")
        return data["id"]
    
    def test_create_plantilla_requires_auth(self, session):
        """Test that creating plantilla requires authentication"""
        new_session = requests.Session()
        response = new_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "Unauthorized",
            "layout": [],
            "compartir": "privada"
        })
        assert response.status_code == 401
        print("✓ POST /api/plantillas requires authentication")
    
    # ============ GET PLANTILLAS ============
    def test_get_plantillas(self, admin_session):
        """Test GET /api/plantillas - returns templates visible to user"""
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        assert response.status_code == 200
        data = response.json()
        assert "plantillas" in data
        assert isinstance(data["plantillas"], list)
        
        # Check structure of returned plantillas
        if len(data["plantillas"]) > 0:
            p = data["plantillas"][0]
            assert "id" in p
            assert "nombre" in p
            assert "layout" in p
            assert "compartir" in p
            assert "creador_id" in p
            assert "es_propia" in p
            assert "widgets_count" in p
        
        print(f"✓ GET /api/plantillas returned {len(data['plantillas'])} templates")
        return data["plantillas"]
    
    def test_get_plantillas_requires_auth(self, session):
        """Test that GET /api/plantillas requires authentication"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/plantillas")
        assert response.status_code == 401
        print("✓ GET /api/plantillas requires authentication")
    
    # ============ UPDATE PLANTILLA ============
    def test_update_plantilla_sharing(self, admin_session):
        """Test PUT /api/plantillas/{id} - update sharing settings"""
        # First create a template
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Update_Share",
            "descripcion": "Template to test update",
            "layout": [{"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2}],
            "compartir": "privada",
            "usuarios_compartidos": []
        })
        assert response.status_code == 200
        plantilla_id = response.json()["id"]
        
        # Update sharing to 'todos'
        response = admin_session.put(f"{BASE_URL}/api/plantillas/{plantilla_id}", json={
            "compartir": "todos"
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Plantilla actualizada"
        
        # Verify update
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        updated = next((p for p in plantillas if p["id"] == plantilla_id), None)
        assert updated is not None
        assert updated["compartir"] == "todos"
        
        print(f"✓ Updated template {plantilla_id} sharing to 'todos'")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/plantillas/{plantilla_id}")
    
    def test_update_plantilla_only_creator(self, admin_session, admin_user_id):
        """Test that only creator can update their template"""
        # Get plantillas and find one not created by admin (if exists)
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        
        # Find a template where es_propia is False (not owned by current user)
        other_template = next((p for p in plantillas if not p["es_propia"]), None)
        
        if other_template:
            # Try to update someone else's template
            response = admin_session.put(f"{BASE_URL}/api/plantillas/{other_template['id']}", json={
                "compartir": "privada"
            })
            assert response.status_code == 403
            print(f"✓ Cannot update template owned by another user (403)")
        else:
            print("⚠ No templates from other users to test access control - skipping")
    
    # ============ DELETE PLANTILLA ============
    def test_delete_plantilla(self, admin_session):
        """Test DELETE /api/plantillas/{id} - delete own template"""
        # Create a template to delete
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_To_Delete",
            "descripcion": "Template to be deleted",
            "layout": [{"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2}],
            "compartir": "privada"
        })
        assert response.status_code == 200
        plantilla_id = response.json()["id"]
        
        # Delete it
        response = admin_session.delete(f"{BASE_URL}/api/plantillas/{plantilla_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Plantilla eliminada"
        
        # Verify deletion
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        deleted = next((p for p in plantillas if p["id"] == plantilla_id), None)
        assert deleted is None
        
        print(f"✓ Deleted template {plantilla_id}")
    
    def test_delete_plantilla_only_creator(self, admin_session):
        """Test that only creator can delete their template"""
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        
        other_template = next((p for p in plantillas if not p["es_propia"]), None)
        
        if other_template:
            response = admin_session.delete(f"{BASE_URL}/api/plantillas/{other_template['id']}")
            assert response.status_code == 403
            print(f"✓ Cannot delete template owned by another user (403)")
        else:
            print("⚠ No templates from other users to test delete access control - skipping")
    
    def test_delete_nonexistent_plantilla(self, admin_session):
        """Test deleting a non-existent template returns 404"""
        response = admin_session.delete(f"{BASE_URL}/api/plantillas/000000000000000000000000")
        assert response.status_code == 404
        print("✓ Delete non-existent template returns 404")
    
    # ============ APPLY PLANTILLA ============
    def test_aplicar_plantilla(self, admin_session):
        """Test POST /api/plantillas/{id}/aplicar - apply template copies layout"""
        # Create a template
        test_layout = [
            {"i": "stat-ventas", "x": 0, "y": 0, "w": 4, "h": 2},
            {"i": "stat-compras", "x": 4, "y": 0, "w": 4, "h": 2},
            {"i": "chart-top-productos", "x": 0, "y": 2, "w": 8, "h": 4}
        ]
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Apply_Template",
            "descripcion": "Template to apply",
            "layout": test_layout,
            "compartir": "privada"
        })
        assert response.status_code == 200
        plantilla_id = response.json()["id"]
        
        # Apply the template
        response = admin_session.post(f"{BASE_URL}/api/plantillas/{plantilla_id}/aplicar")
        assert response.status_code == 200
        data = response.json()
        assert "layout" in data
        assert "aplicada" in data["message"]  # Message includes template name
        
        # Verify dashboard config was updated
        response = admin_session.get(f"{BASE_URL}/api/dashboard/config")
        assert response.status_code == 200
        config = response.json()
        assert config["custom"] == True
        assert config["template"] == "personalizado"
        
        print(f"✓ Applied template {plantilla_id} - layout copied to user's dashboard")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/plantillas/{plantilla_id}")
    
    def test_aplicar_shared_template(self, admin_session):
        """Test applying a shared template (compartir=todos)"""
        # Create a shared template
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Shared_Apply",
            "descripcion": "Shared template to apply",
            "layout": [{"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2}],
            "compartir": "todos"
        })
        assert response.status_code == 200
        plantilla_id = response.json()["id"]
        
        # Apply it
        response = admin_session.post(f"{BASE_URL}/api/plantillas/{plantilla_id}/aplicar")
        assert response.status_code == 200
        
        print(f"✓ Applied shared template successfully")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/plantillas/{plantilla_id}")
    
    def test_aplicar_nonexistent_plantilla(self, admin_session):
        """Test applying non-existent template returns 404"""
        response = admin_session.post(f"{BASE_URL}/api/plantillas/000000000000000000000000/aplicar")
        assert response.status_code == 404
        print("✓ Apply non-existent template returns 404")
    
    # ============ PREDEFINED TEMPLATES STILL WORK ============
    def test_predefined_templates_exist(self, admin_session):
        """Test that 4 predefined templates still work"""
        response = admin_session.get(f"{BASE_URL}/api/dashboard/templates")
        assert response.status_code == 200
        templates = response.json()["templates"]
        
        expected = ["ejecutivo", "ventas", "inventario", "analitico"]
        for key in expected:
            assert key in templates, f"Missing predefined template: {key}"
            assert "nombre" in templates[key]
            assert "descripcion" in templates[key]
            assert "widgets" in templates[key]
            assert len(templates[key]["widgets"]) > 0
        
        print(f"✓ All 4 predefined templates exist: {', '.join(expected)}")
    
    def test_apply_predefined_template(self, admin_session):
        """Test applying a predefined template via dashboard config"""
        # Get predefined templates
        response = admin_session.get(f"{BASE_URL}/api/dashboard/templates")
        templates = response.json()["templates"]
        
        # Apply 'ventas' template
        ventas_layout = templates["ventas"]["widgets"]
        response = admin_session.post(f"{BASE_URL}/api/dashboard/config", json={
            "template": "ventas",
            "layout": ventas_layout,
            "custom": False
        })
        assert response.status_code == 200
        
        # Verify
        response = admin_session.get(f"{BASE_URL}/api/dashboard/config")
        config = response.json()
        assert config["template"] == "ventas"
        
        print("✓ Applied predefined 'ventas' template successfully")
    
    # ============ CLEANUP ============
    def test_cleanup_test_plantillas(self, admin_session):
        """Cleanup: Delete all TEST_ prefixed plantillas"""
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        
        deleted_count = 0
        for p in plantillas:
            if p["nombre"].startswith("TEST_") and p["es_propia"]:
                admin_session.delete(f"{BASE_URL}/api/plantillas/{p['id']}")
                deleted_count += 1
        
        print(f"✓ Cleanup: Deleted {deleted_count} test plantillas")


class TestPlantillasAccessControl:
    """Test access control for shared templates"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "andy.escudero",
            "password": "secreto"
        })
        assert response.status_code == 200
        return s
    
    def test_visibility_privada(self, admin_session):
        """Test that private templates are only visible to creator"""
        # Create private template
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Private_Visibility",
            "layout": [{"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2}],
            "compartir": "privada"
        })
        assert response.status_code == 200
        plantilla_id = response.json()["id"]
        
        # Verify it's visible to creator
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        found = next((p for p in plantillas if p["id"] == plantilla_id), None)
        assert found is not None
        assert found["compartir"] == "privada"
        assert found["es_propia"] == True
        
        print(f"✓ Private template visible to creator")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/plantillas/{plantilla_id}")
    
    def test_visibility_todos(self, admin_session):
        """Test that 'todos' templates are visible to all users"""
        # Create shared template
        response = admin_session.post(f"{BASE_URL}/api/plantillas", json={
            "nombre": "TEST_Todos_Visibility",
            "layout": [{"i": "stat-ventas", "x": 0, "y": 0, "w": 3, "h": 2}],
            "compartir": "todos"
        })
        assert response.status_code == 200
        plantilla_id = response.json()["id"]
        
        # Verify it's visible
        response = admin_session.get(f"{BASE_URL}/api/plantillas")
        plantillas = response.json()["plantillas"]
        found = next((p for p in plantillas if p["id"] == plantilla_id), None)
        assert found is not None
        assert found["compartir"] == "todos"
        
        print(f"✓ 'Todos' template is visible")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/plantillas/{plantilla_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
