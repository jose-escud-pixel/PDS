import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import axios from 'axios';
import {
  House,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Truck,
  Money,
  MagnifyingGlass,
  Plus,
  Pencil,
  Trash,
  Warning,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  CaretDown,
  Funnel,
  Export
} from '@phosphor-icons/react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Format Guaranies
const formatGs = (value) => {
  if (!value && value !== 0) return 'Gs. 0';
  return 'Gs. ' + Math.round(value).toLocaleString('es-PY');
};

// API functions
const api = {
  getDashboard: () => axios.get(`${API_URL}/api/dashboard`),
  getProductos: (params) => axios.get(`${API_URL}/api/productos`, { params }),
  createProducto: (data) => axios.post(`${API_URL}/api/productos`, data),
  updateProducto: (id, data) => axios.put(`${API_URL}/api/productos/${id}`, data),
  deleteProducto: (id) => axios.delete(`${API_URL}/api/productos/${id}`),
  getCategorias: () => axios.get(`${API_URL}/api/categorias`),
  getClientes: (params) => axios.get(`${API_URL}/api/clientes`, { params }),
  createCliente: (data) => axios.post(`${API_URL}/api/clientes`, data),
  updateCliente: (id, data) => axios.put(`${API_URL}/api/clientes/${id}`, data),
  deleteCliente: (id) => axios.delete(`${API_URL}/api/clientes/${id}`),
  getProveedores: (params) => axios.get(`${API_URL}/api/proveedores`, { params }),
  createProveedor: (data) => axios.post(`${API_URL}/api/proveedores`, data),
  updateProveedor: (id, data) => axios.put(`${API_URL}/api/proveedores/${id}`, data),
  deleteProveedor: (id) => axios.delete(`${API_URL}/api/proveedores/${id}`),
  getVentas: (params) => axios.get(`${API_URL}/api/ventas`, { params }),
  createVenta: (data) => axios.post(`${API_URL}/api/ventas`, data),
  getCompras: (params) => axios.get(`${API_URL}/api/compras`, { params }),
  createCompra: (data) => axios.post(`${API_URL}/api/compras`, data),
  getGastos: (params) => axios.get(`${API_URL}/api/gastos`, { params }),
  createGasto: (data) => axios.post(`${API_URL}/api/gastos`, data),
  seedData: () => axios.post(`${API_URL}/api/seed`),
};

// Sidebar Navigation
function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
    { id: 'compras', label: 'Compras', icon: Receipt },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
    { id: 'gastos', label: 'Gastos', icon: Money },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#E63946] rounded-lg flex items-center justify-center">
            <span className="text-white font-heading font-bold text-xl">pds</span>
          </div>
          <div>
            <h1 className="font-heading font-semibold text-foreground">PDS</h1>
            <p className="text-xs text-muted-foreground">Gestión Integral</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            data-testid={`nav-${item.id}`}
            className={`nav-link w-full ${activeView === item.id ? 'active' : ''}`}
          >
            <item.icon size={20} weight={activeView === item.id ? 'fill' : 'regular'} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          PDS Insumos Odontológicos
        </p>
      </div>
    </aside>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, trend, color = 'primary' }) {
  const colorClasses = {
    primary: 'text-[#E63946]',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <div className="stat-card card-hover" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className={`stat-value mt-2 ${colorClasses[color]}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-muted ${colorClasses[color]}`}>
            <Icon size={24} weight="duotone" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

// Dashboard View
function Dashboard({ data }) {
  if (!data) return <div className="p-8 text-center text-muted-foreground">Cargando dashboard...</div>;

  const { resumen, top_productos, top_clientes, bajo_stock } = data;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('es-PY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Ventas"
          value={formatGs(resumen.total_ventas)}
          icon={ShoppingCart}
          color="success"
        />
        <StatCard
          label="Total Compras"
          value={formatGs(resumen.total_compras)}
          icon={Receipt}
          color="primary"
        />
        <StatCard
          label="Utilidad Bruta"
          value={formatGs(resumen.utilidad_bruta)}
          icon={Money}
          color="success"
        />
        <StatCard
          label="Total Gastos"
          value={formatGs(resumen.total_gastos)}
          icon={Money}
          color="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <p className="stat-label">Productos</p>
          <p className="stat-value text-foreground">{resumen.total_productos}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Stock Valorizado</p>
          <p className="stat-value text-foreground text-lg">{formatGs(resumen.valor_stock_venta)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Sin Stock</p>
          <p className={`stat-value ${resumen.productos_sin_stock > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {resumen.productos_sin_stock}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Bajo Mínimo</p>
          <p className={`stat-value ${resumen.productos_bajo_minimo > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {resumen.productos_bajo_minimo}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Clientes</p>
          <p className="stat-value text-foreground">{resumen.total_clientes}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Proveedores</p>
          <p className="stat-value text-foreground">{resumen.total_proveedores}</p>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        <div className="bg-white border border-border rounded-md">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-heading font-semibold text-foreground">Top Productos Vendidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {top_productos && top_productos.length > 0 ? (
                  top_productos.map((p, i) => (
                    <tr key={i}>
                      <td className="font-medium">{p.nombre}</td>
                      <td className="text-right">{p.cantidad}</td>
                      <td className="text-right price-gs">{formatGs(p.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-muted-foreground py-8">
                      Sin datos de ventas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-white border border-border rounded-md">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-heading font-semibold text-foreground">Top Clientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="text-right">Compras</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {top_clientes && top_clientes.length > 0 ? (
                  top_clientes.map((c, i) => (
                    <tr key={i}>
                      <td className="font-medium">{c.nombre}</td>
                      <td className="text-right">{c.cantidad_compras}</td>
                      <td className="text-right price-gs">{formatGs(c.total_compras)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-muted-foreground py-8">
                      Sin datos de clientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {bajo_stock && bajo_stock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Warning size={20} className="text-yellow-600" weight="fill" />
            <h3 className="font-heading font-semibold text-yellow-800">Productos con Bajo Stock</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bajo_stock.map((p, i) => (
              <div key={i} className="bg-white border border-yellow-200 rounded px-3 py-2">
                <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {p.codigo} | Stock: <span className="text-red-600 font-semibold">{p.stock}</span> / Min: {p.stock_minimo}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay flex items-center justify-center" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            data-testid="modal-close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Productos View
function ProductosView() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    variante: '',
    categoria: '',
    proveedor: '',
    precio_con_iva: 0,
    iva_pct: 10,
    costo: 0,
    stock: 0,
    stock_minimo: 2,
    margen: 15
  });

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoriaFilter) params.categoria = categoriaFilter;
      
      const [prodRes, catRes] = await Promise.all([
        api.getProductos(params),
        api.getCategorias()
      ]);
      
      setProductos(prodRes.data.productos || []);
      setCategorias(catRes.data.categorias || []);
    } catch (error) {
      console.error('Error loading productos:', error);
    } finally {
      setLoading(false);
    }
  }, [search, categoriaFilter]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProducto(editingProduct.id, formData);
      } else {
        await api.createProducto(formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProductos();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al guardar producto');
    }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      variante: producto.variante || '',
      categoria: producto.categoria,
      proveedor: producto.proveedor,
      precio_con_iva: producto.precio_con_iva,
      iva_pct: producto.iva_pct,
      costo: producto.costo,
      stock: producto.stock,
      stock_minimo: producto.stock_minimo,
      margen: producto.margen
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await api.deleteProducto(id);
        loadProductos();
      } catch (error) {
        alert('Error al eliminar producto');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      variante: '',
      categoria: '',
      proveedor: '',
      precio_con_iva: 0,
      iva_pct: 10,
      costo: 0,
      stock: 0,
      stock_minimo: 2,
      margen: 15
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="productos-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Productos</h2>
        <button
          onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-producto-btn"
        >
          <Plus size={20} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
            data-testid="search-productos"
          />
        </div>
        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          className="form-input w-48"
          data-testid="filter-categoria"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th className="text-right">Costo</th>
                <th className="text-right">Precio</th>
                <th className="text-center">Stock</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">No hay productos</td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-sm">{p.codigo}</td>
                    <td>
                      <div>
                        <p className="font-medium">{p.nombre}</p>
                        {p.variante && <p className="text-xs text-muted-foreground">{p.variante}</p>}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-muted text-foreground">{p.categoria}</span>
                    </td>
                    <td className="text-sm">{p.proveedor}</td>
                    <td className="text-right price-gs text-sm">{formatGs(p.costo)}</td>
                    <td className="text-right price-gs font-medium">{formatGs(p.precio_con_iva)}</td>
                    <td className="text-center">
                      <span className={`font-semibold ${p.stock < p.stock_minimo ? 'low-stock' : 'ok-stock'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 hover:bg-muted rounded-md transition-colors"
                          data-testid={`edit-producto-${p.id}`}
                        >
                          <Pencil size={16} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 hover:bg-red-50 rounded-md transition-colors"
                          data-testid={`delete-producto-${p.id}`}
                        >
                          <Trash size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingProduct(null); }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Código</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="form-input"
                required
                disabled={!!editingProduct}
                data-testid="input-codigo"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="form-input"
                required
                list="categorias-list"
                data-testid="input-categoria"
              />
              <datalist id="categorias-list">
                {categorias.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="form-input"
              required
              data-testid="input-nombre"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Variante</label>
              <input
                type="text"
                value={formData.variante}
                onChange={(e) => setFormData({ ...formData, variante: e.target.value })}
                className="form-input"
                data-testid="input-variante"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                className="form-input"
                required
                data-testid="input-proveedor"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Costo (sin IVA)</label>
              <input
                type="number"
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
                className="form-input"
                min="0"
                data-testid="input-costo"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio (con IVA)</label>
              <input
                type="number"
                value={formData.precio_con_iva}
                onChange={(e) => setFormData({ ...formData, precio_con_iva: parseFloat(e.target.value) || 0 })}
                className="form-input"
                min="0"
                data-testid="input-precio"
              />
            </div>
            <div className="form-group">
              <label className="form-label">IVA %</label>
              <select
                value={formData.iva_pct}
                onChange={(e) => setFormData({ ...formData, iva_pct: parseInt(e.target.value) })}
                className="form-input"
                data-testid="input-iva"
              >
                <option value={5}>5%</option>
                <option value={10}>10%</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="form-input"
                min="0"
                data-testid="input-stock"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Mínimo</label>
              <input
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                className="form-input"
                min="0"
                data-testid="input-stock-minimo"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Margen %</label>
              <input
                type="number"
                value={formData.margen}
                onChange={(e) => setFormData({ ...formData, margen: parseInt(e.target.value) || 0 })}
                className="form-input"
                min="0"
                data-testid="input-margen"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingProduct(null); }}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
              data-testid="submit-producto"
            >
              <Check size={18} />
              <span>{editingProduct ? 'Actualizar' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Clientes View
function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    tipo: 'Odontólogo'
  });

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      const params = search ? { search } : {};
      const res = await api.getClientes(params);
      setClientes(res.data.clientes || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await api.updateCliente(editingCliente.id, formData);
      } else {
        await api.createCliente(formData);
      }
      setShowModal(false);
      setEditingCliente(null);
      resetForm();
      loadClientes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al guardar cliente');
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      ruc: cliente.ruc || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      tipo: cliente.tipo || 'Odontólogo'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await api.deleteCliente(id);
        loadClientes();
      } catch (error) {
        alert('Error al eliminar cliente');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruc: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      tipo: 'Odontólogo'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="clientes-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Clientes</h2>
        <button
          onClick={() => { resetForm(); setEditingCliente(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-cliente-btn"
        >
          <Plus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
          data-testid="search-clientes"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th className="text-right">Total Compras</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">No hay clientes</td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.nombre}</td>
                  <td>
                    <span className="badge bg-blue-100 text-blue-800">{c.tipo}</span>
                  </td>
                  <td>{c.telefono || '-'}</td>
                  <td>{c.ciudad || '-'}</td>
                  <td className="text-right price-gs">{formatGs(c.total_compras || 0)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                        data-testid={`edit-cliente-${c.id}`}
                      >
                        <Pencil size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                        data-testid={`delete-cliente-${c.id}`}
                      >
                        <Trash size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCliente(null); }}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="form-input"
              required
              data-testid="input-cliente-nombre"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">RUC/Cédula</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                className="form-input"
                data-testid="input-cliente-ruc"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="form-input"
                data-testid="input-cliente-tipo"
              >
                <option value="Odontólogo">Odontólogo</option>
                <option value="Clínica">Clínica</option>
                <option value="Consultorio">Consultorio</option>
                <option value="Laboratorio">Laboratorio</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="form-input"
                data-testid="input-cliente-telefono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="form-input"
                data-testid="input-cliente-ciudad"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="form-input"
              data-testid="input-cliente-direccion"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingCliente(null); }}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
              data-testid="submit-cliente"
            >
              <Check size={18} />
              <span>{editingCliente ? 'Actualizar' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Proveedores View
function ProveedoresView() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    direccion: '',
    contacto: '',
    telefono: ''
  });

  const loadProveedores = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getProveedores({});
      setProveedores(res.data.proveedores || []);
    } catch (error) {
      console.error('Error loading proveedores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProveedor) {
        await api.updateProveedor(editingProveedor.id, formData);
      } else {
        await api.createProveedor(formData);
      }
      setShowModal(false);
      setEditingProveedor(null);
      resetForm();
      loadProveedores();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al guardar proveedor');
    }
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || '',
      direccion: proveedor.direccion || '',
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        await api.deleteProveedor(id);
        loadProveedores();
      } catch (error) {
        alert('Error al eliminar proveedor');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruc: '',
      direccion: '',
      contacto: '',
      telefono: ''
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="proveedores-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Proveedores</h2>
        <button
          onClick={() => { resetForm(); setEditingProveedor(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-proveedor-btn"
        >
          <Plus size={20} />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUC</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th className="text-right">Total Compras</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</td>
              </tr>
            ) : proveedores.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">No hay proveedores</td>
              </tr>
            ) : (
              proveedores.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td>{p.ruc || '-'}</td>
                  <td>{p.contacto || '-'}</td>
                  <td>{p.telefono || '-'}</td>
                  <td className="text-right price-gs">{formatGs(p.total_compras || 0)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                        data-testid={`edit-proveedor-${p.id}`}
                      >
                        <Pencil size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                        data-testid={`delete-proveedor-${p.id}`}
                      >
                        <Trash size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingProveedor(null); }}
        title={editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="form-input"
              required
              data-testid="input-proveedor-nombre"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">RUC</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                className="form-input"
                data-testid="input-proveedor-ruc"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="form-input"
                data-testid="input-proveedor-telefono"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contacto</label>
            <input
              type="text"
              value={formData.contacto}
              onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
              className="form-input"
              data-testid="input-proveedor-contacto"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="form-input"
              data-testid="input-proveedor-direccion"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingProveedor(null); }}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
              data-testid="submit-proveedor"
            >
              <Check size={18} />
              <span>{editingProveedor ? 'Actualizar' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Ventas View
function VentasView() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [items, setItems] = useState([]);
  const [searchProducto, setSearchProducto] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ventasRes, clientesRes] = await Promise.all([
        api.getVentas({}),
        api.getClientes({})
      ]);
      setVentas(ventasRes.data.ventas || []);
      setClientes(clientesRes.data.clientes || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchProductos = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.getProductos({ search: query, limit: 10 });
      setSearchResults(res.data.productos || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const addItem = (producto) => {
    const existing = items.find((i) => i.producto_id === producto.id);
    if (existing) {
      setItems(items.map((i) =>
        i.producto_id === producto.id
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      ));
    } else {
      setItems([...items, {
        producto_id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio_con_iva,
        costo_unitario: producto.costo,
        iva_pct: producto.iva_pct,
        stock_disponible: producto.stock
      }]);
    }
    setSearchProducto('');
    setSearchResults([]);
  };

  const updateItemQuantity = (productoId, cantidad) => {
    if (cantidad <= 0) {
      setItems(items.filter((i) => i.producto_id !== productoId));
    } else {
      setItems(items.map((i) =>
        i.producto_id === productoId
          ? { ...i, cantidad }
          : i
      ));
    }
  };

  const removeItem = (productoId) => {
    setItems(items.filter((i) => i.producto_id !== productoId));
  };

  const calcTotal = () => items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0);
  const calcUtilidad = () => items.reduce((sum, i) => sum + i.cantidad * (i.precio_unitario - i.costo_unitario), 0);

  const handleSubmit = async () => {
    if (!selectedCliente) {
      alert('Seleccione un cliente');
      return;
    }
    if (items.length === 0) {
      alert('Agregue al menos un producto');
      return;
    }

    // Validate stock
    for (const item of items) {
      if (item.cantidad > item.stock_disponible) {
        alert(`Stock insuficiente para ${item.nombre}. Disponible: ${item.stock_disponible}`);
        return;
      }
    }

    try {
      await api.createVenta({
        cliente_id: selectedCliente.id,
        cliente_nombre: selectedCliente.nombre,
        items: items.map((i) => ({
          producto_id: i.producto_id,
          codigo: i.codigo,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          costo_unitario: i.costo_unitario,
          iva_pct: i.iva_pct
        })),
        observaciones: ''
      });
      setShowModal(false);
      setSelectedCliente(null);
      setItems([]);
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al registrar venta');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="ventas-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Ventas</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-venta-btn"
        >
          <Plus size={20} />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Ventas Table */}
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Items</th>
              <th className="text-right">Total</th>
              <th className="text-right">Utilidad</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">No hay ventas registradas</td>
              </tr>
            ) : (
              ventas.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleDateString('es-PY')}</td>
                  <td className="font-medium">{v.cliente_nombre}</td>
                  <td>{v.items?.length || 0} productos</td>
                  <td className="text-right price-gs font-medium">{formatGs(v.total)}</td>
                  <td className="text-right price-gs text-green-600">{formatGs(v.utilidad)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Nueva Venta Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedCliente(null); setItems([]); }}
        title="Nueva Venta"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Cliente Selection */}
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select
              value={selectedCliente?.id || ''}
              onChange={(e) => {
                const cliente = clientes.find((c) => c.id === e.target.value);
                setSelectedCliente(cliente || null);
              }}
              className="form-input"
              data-testid="select-cliente"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Product Search */}
          <div className="form-group">
            <label className="form-label">Buscar Producto</label>
            <div className="relative">
              <input
                type="text"
                value={searchProducto}
                onChange={(e) => {
                  setSearchProducto(e.target.value);
                  searchProductos(e.target.value);
                }}
                placeholder="Buscar por código o nombre..."
                className="form-input"
                data-testid="search-producto-venta"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center"
                      data-testid={`add-producto-${p.id}`}
                    >
                      <div>
                        <span className="font-medium">{p.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2">({p.codigo})</span>
                      </div>
                      <div className="text-right">
                        <p className="price-gs text-sm">{formatGs(p.precio_con_iva)}</p>
                        <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border border-border rounded-md overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.producto_id}>
                      <td>
                        <p className="font-medium text-sm">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground">Stock: {item.stock_disponible}</p>
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItemQuantity(item.producto_id, parseInt(e.target.value) || 0)}
                          min="1"
                          max={item.stock_disponible}
                          className="w-16 text-center form-input"
                        />
                      </td>
                      <td className="text-right price-gs text-sm">{formatGs(item.precio_unitario)}</td>
                      <td className="text-right price-gs font-medium">{formatGs(item.cantidad * item.precio_unitario)}</td>
                      <td>
                        <button
                          onClick={() => removeItem(item.producto_id)}
                          className="p-1 hover:bg-red-50 rounded"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold price-gs">{formatGs(calcTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Utilidad:</span>
                <span className="font-semibold text-green-600 price-gs">{formatGs(calcUtilidad())}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowModal(false); setSelectedCliente(null); setItems([]); }}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedCliente || items.length === 0}
              className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors disabled:opacity-50"
              data-testid="submit-venta"
            >
              <Check size={18} />
              <span>Registrar Venta</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Compras View
function ComprasView() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [factura, setFactura] = useState('');
  const [items, setItems] = useState([]);
  const [searchProducto, setSearchProducto] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [comprasRes, provRes] = await Promise.all([
        api.getCompras({}),
        api.getProveedores({})
      ]);
      setCompras(comprasRes.data.compras || []);
      setProveedores(provRes.data.proveedores || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchProductos = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.getProductos({ search: query, limit: 10 });
      setSearchResults(res.data.productos || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const addItem = (producto) => {
    const existing = items.find((i) => i.producto_id === producto.id);
    if (existing) {
      setItems(items.map((i) =>
        i.producto_id === producto.id
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      ));
    } else {
      setItems([...items, {
        producto_id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.costo * (1 + producto.iva_pct / 100),
        iva_pct: producto.iva_pct
      }]);
    }
    setSearchProducto('');
    setSearchResults([]);
  };

  const updateItem = (productoId, field, value) => {
    setItems(items.map((i) =>
      i.producto_id === productoId
        ? { ...i, [field]: value }
        : i
    ));
  };

  const removeItem = (productoId) => {
    setItems(items.filter((i) => i.producto_id !== productoId));
  };

  const calcTotal = () => items.reduce((sum, i) => sum + i.cantidad * i.precio_unitario, 0);

  const handleSubmit = async () => {
    if (!selectedProveedor) {
      alert('Seleccione un proveedor');
      return;
    }
    if (items.length === 0) {
      alert('Agregue al menos un producto');
      return;
    }

    try {
      await api.createCompra({
        proveedor_id: selectedProveedor.id,
        proveedor_nombre: selectedProveedor.nombre,
        factura,
        items: items.map((i) => ({
          producto_id: i.producto_id,
          codigo: i.codigo,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          iva_pct: i.iva_pct
        })),
        observaciones: ''
      });
      setShowModal(false);
      setSelectedProveedor(null);
      setFactura('');
      setItems([]);
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al registrar compra');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="compras-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Compras</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-compra-btn"
        >
          <Plus size={20} />
          <span>Nueva Compra</span>
        </button>
      </div>

      {/* Compras Table */}
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Factura</th>
              <th>Items</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</td>
              </tr>
            ) : compras.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">No hay compras registradas</td>
              </tr>
            ) : (
              compras.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha).toLocaleDateString('es-PY')}</td>
                  <td className="font-medium">{c.proveedor_nombre}</td>
                  <td>{c.factura || '-'}</td>
                  <td>{c.items?.length || 0} productos</td>
                  <td className="text-right price-gs font-medium">{formatGs(c.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Nueva Compra Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedProveedor(null); setItems([]); setFactura(''); }}
        title="Nueva Compra"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <select
                value={selectedProveedor?.id || ''}
                onChange={(e) => {
                  const prov = proveedores.find((p) => p.id === e.target.value);
                  setSelectedProveedor(prov || null);
                }}
                className="form-input"
                data-testid="select-proveedor"
              >
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nro. Factura</label>
              <input
                type="text"
                value={factura}
                onChange={(e) => setFactura(e.target.value)}
                className="form-input"
                placeholder="Opcional"
                data-testid="input-factura"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Buscar Producto</label>
            <div className="relative">
              <input
                type="text"
                value={searchProducto}
                onChange={(e) => {
                  setSearchProducto(e.target.value);
                  searchProductos(e.target.value);
                }}
                placeholder="Buscar por código o nombre..."
                className="form-input"
                data-testid="search-producto-compra"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="w-full px-4 py-2 text-left hover:bg-muted"
                    >
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-xs text-muted-foreground ml-2">({p.codigo})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="border border-border rounded-md overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.producto_id}>
                      <td className="font-medium text-sm">{item.nombre}</td>
                      <td className="text-center">
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItem(item.producto_id, 'cantidad', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-16 text-center form-input"
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => updateItem(item.producto_id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                          min="0"
                          className="w-28 text-right form-input"
                        />
                      </td>
                      <td className="text-right price-gs font-medium">{formatGs(item.cantidad * item.precio_unitario)}</td>
                      <td>
                        <button
                          onClick={() => removeItem(item.producto_id)}
                          className="p-1 hover:bg-red-50 rounded"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Compra:</span>
                <span className="font-semibold price-gs">{formatGs(calcTotal())}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowModal(false); setSelectedProveedor(null); setItems([]); setFactura(''); }}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedProveedor || items.length === 0}
              className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors disabled:opacity-50"
              data-testid="submit-compra"
            >
              <Check size={18} />
              <span>Registrar Compra</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Gastos View
function GastosView() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: '',
    descripcion: '',
    monto: 0,
    iva_pct: 10,
    proveedor: ''
  });

  const categorias_gasto = [
    'Alquiler', 'Servicios', 'Salarios', 'Transporte', 'Comisiones', 
    'Marketing', 'Oficina', 'Mantenimiento', 'Impuestos', 'Otros'
  ];

  const loadGastos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getGastos({});
      setGastos(res.data.gastos || []);
    } catch (error) {
      console.error('Error loading gastos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGastos();
  }, [loadGastos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createGasto(formData);
      setShowModal(false);
      resetForm();
      loadGastos();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al registrar gasto');
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      categoria: '',
      descripcion: '',
      monto: 0,
      iva_pct: 10,
      proveedor: ''
    });
  };

  const totalGastos = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="gastos-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-foreground">Gastos Operativos</h2>
          <p className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatGs(totalGastos)}</span></p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-gasto-btn"
        >
          <Plus size={20} />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      {/* Gastos Table */}
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Proveedor</th>
              <th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</td>
              </tr>
            ) : gastos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">No hay gastos registrados</td>
              </tr>
            ) : (
              gastos.map((g) => (
                <tr key={g.id}>
                  <td>{new Date(g.fecha).toLocaleDateString('es-PY')}</td>
                  <td>
                    <span className="badge bg-orange-100 text-orange-800">{g.categoria}</span>
                  </td>
                  <td>{g.descripcion}</td>
                  <td>{g.proveedor || '-'}</td>
                  <td className="text-right price-gs font-medium">{formatGs(g.monto)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo Gasto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="form-input"
                required
                data-testid="input-gasto-fecha"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="form-input"
                required
                data-testid="input-gasto-categoria"
              >
                <option value="">Seleccionar...</option>
                {categorias_gasto.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="form-input"
              required
              data-testid="input-gasto-descripcion"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Monto</label>
              <input
                type="number"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                className="form-input"
                min="0"
                required
                data-testid="input-gasto-monto"
              />
            </div>
            <div className="form-group">
              <label className="form-label">IVA %</label>
              <select
                value={formData.iva_pct}
                onChange={(e) => setFormData({ ...formData, iva_pct: parseInt(e.target.value) })}
                className="form-input"
                data-testid="input-gasto-iva"
              >
                <option value={5}>5%</option>
                <option value={10}>10%</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                className="form-input"
                placeholder="Opcional"
                data-testid="input-gasto-proveedor"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
              data-testid="submit-gasto"
            >
              <Check size={18} />
              <span>Registrar</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Main App
function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSeedData = async () => {
    if (!window.confirm('¿Cargar datos iniciales desde Excel? Esto reemplazará los datos existentes.')) {
      return;
    }
    try {
      setSeeding(true);
      await api.seedData();
      alert('Datos cargados correctamente');
      loadDashboard();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al cargar datos');
    } finally {
      setSeeding(false);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard data={dashboardData} />;
      case 'productos':
        return <ProductosView />;
      case 'ventas':
        return <VentasView />;
      case 'compras':
        return <ComprasView />;
      case 'clientes':
        return <ClientesView />;
      case 'proveedores':
        return <ProveedoresView />;
      case 'gastos':
        return <GastosView />;
      default:
        return <Dashboard data={dashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div></div>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm"
            data-testid="seed-data-btn"
          >
            <Export size={18} />
            <span>{seeding ? 'Cargando...' : 'Cargar Datos Excel'}</span>
          </button>
        </header>

        {renderView()}
      </main>
    </div>
  );
}

export default App;
