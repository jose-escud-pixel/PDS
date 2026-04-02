import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
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
  SignOut,
  UserCircle,
  ShieldCheck,
  ClockCounterClockwise,
  FileText,
  Download,
  Lock,
  Eye,
  EyeSlash,
  UserGear,
  Gear
} from '@phosphor-icons/react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Configure axios
axios.defaults.withCredentials = true;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Format Guaranies
const formatGs = (value) => {
  if (!value && value !== 0) return 'Gs. 0';
  return 'Gs. ' + Math.round(value).toLocaleString('es-PY');
};

// Format API error
const formatApiError = (detail) => {
  if (detail == null) return "Error desconocido";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
};

// API functions
const api = {
  // Auth
  login: (data) => axios.post(`${API_URL}/api/auth/login`, data),
  logout: () => axios.post(`${API_URL}/api/auth/logout`),
  getMe: () => axios.get(`${API_URL}/api/auth/me`),
  refresh: () => axios.post(`${API_URL}/api/auth/refresh`),
  // Usuarios
  getUsuarios: () => axios.get(`${API_URL}/api/usuarios`),
  createUsuario: (data) => axios.post(`${API_URL}/api/usuarios`, data),
  updateUsuario: (id, data) => axios.put(`${API_URL}/api/usuarios/${id}`, data),
  changePassword: (id, data) => axios.put(`${API_URL}/api/usuarios/${id}/password`, data),
  deleteUsuario: (id) => axios.delete(`${API_URL}/api/usuarios/${id}`),
  // Dashboard
  getDashboard: () => axios.get(`${API_URL}/api/dashboard`),
  // Productos
  getProductos: (params) => axios.get(`${API_URL}/api/productos`, { params }),
  createProducto: (data) => axios.post(`${API_URL}/api/productos`, data),
  updateProducto: (id, data) => axios.put(`${API_URL}/api/productos/${id}`, data),
  deleteProducto: (id) => axios.delete(`${API_URL}/api/productos/${id}`),
  ajustarStock: (id, data) => axios.post(`${API_URL}/api/productos/${id}/ajuste-stock`, data),
  getCategorias: () => axios.get(`${API_URL}/api/categorias`),
  // Clientes
  getClientes: (params) => axios.get(`${API_URL}/api/clientes`, { params }),
  createCliente: (data) => axios.post(`${API_URL}/api/clientes`, data),
  updateCliente: (id, data) => axios.put(`${API_URL}/api/clientes/${id}`, data),
  deleteCliente: (id) => axios.delete(`${API_URL}/api/clientes/${id}`),
  // Proveedores
  getProveedores: (params) => axios.get(`${API_URL}/api/proveedores`, { params }),
  createProveedor: (data) => axios.post(`${API_URL}/api/proveedores`, data),
  updateProveedor: (id, data) => axios.put(`${API_URL}/api/proveedores/${id}`, data),
  deleteProveedor: (id) => axios.delete(`${API_URL}/api/proveedores/${id}`),
  // Ventas
  getVentas: (params) => axios.get(`${API_URL}/api/ventas`, { params }),
  createVenta: (data) => axios.post(`${API_URL}/api/ventas`, data),
  // Compras
  getCompras: (params) => axios.get(`${API_URL}/api/compras`, { params }),
  createCompra: (data) => axios.post(`${API_URL}/api/compras`, data),
  // Gastos
  getGastos: (params) => axios.get(`${API_URL}/api/gastos`, { params }),
  createGasto: (data) => axios.post(`${API_URL}/api/gastos`, data),
  // Auditoría
  getAuditoria: (params) => axios.get(`${API_URL}/api/auditoria`, { params }),
  // Stock Movimientos
  getStockMovimientos: (params) => axios.get(`${API_URL}/api/stock-movimientos`, { params }),
  // Reportes
  getReporteVentas: (params) => axios.get(`${API_URL}/api/reportes/ventas`, { params }),
  getReporteProductos: (params) => axios.get(`${API_URL}/api/reportes/productos`, { params }),
  // Seed
  seedData: () => axios.post(`${API_URL}/api/seed`),
};

// Login Page
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.login({ email, password });
      onLogin(data);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#E63946] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-heading font-bold text-3xl">pds</span>
          </div>
        </div>

        <h1 className="text-2xl font-heading font-semibold text-center text-foreground mb-2">
          Bienvenido
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Sistema de Gestión PDS
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Ingrese su usuario"
              required
              data-testid="login-email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
                placeholder="Ingrese su contraseña"
                required
                data-testid="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E63946] text-white py-3 rounded-lg font-medium hover:bg-[#D90429] transition-colors disabled:opacity-50"
            data-testid="login-submit"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          PDS Insumos Odontológicos
        </p>
      </div>
    </div>
  );
}

// Sidebar Navigation
function Sidebar({ activeView, setActiveView, user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  
  const checkPermission = (modulo) => {
    if (isAdmin) return true;
    return user?.permisos?.[modulo]?.ver ?? false;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House, visible: checkPermission('dashboard') },
    { id: 'productos', label: 'Productos', icon: Package, visible: checkPermission('productos') },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart, visible: checkPermission('ventas') },
    { id: 'compras', label: 'Compras', icon: Receipt, visible: checkPermission('compras') },
    { id: 'clientes', label: 'Clientes', icon: Users, visible: checkPermission('clientes') },
    { id: 'proveedores', label: 'Proveedores', icon: Truck, visible: checkPermission('proveedores') },
    { id: 'gastos', label: 'Gastos', icon: Money, visible: checkPermission('gastos') },
    { id: 'reportes', label: 'Reportes', icon: FileText, visible: checkPermission('reportes') },
    { id: 'stock-historial', label: 'Historial Stock', icon: ClockCounterClockwise, visible: checkPermission('reportes') },
  ];

  const adminItems = [
    { id: 'usuarios', label: 'Usuarios', icon: UserGear, visible: isAdmin },
    { id: 'auditoria', label: 'Auditoría', icon: ShieldCheck, visible: isAdmin },
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.filter(i => i.visible).map((item) => (
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

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administración
              </p>
            </div>
            {adminItems.filter(i => i.visible).map((item) => (
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
          </>
        )}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <UserCircle size={24} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.nombre || user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          data-testid="logout-btn"
        >
          <SignOut size={18} />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="modal-overlay flex items-center justify-center" onClick={onClose}>
      <div className={`modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors" data-testid="modal-close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Stat Card
function StatCard({ label, value, icon: Icon, color = 'primary' }) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Ventas" value={formatGs(resumen.total_ventas)} icon={ShoppingCart} color="success" />
        <StatCard label="Total Compras" value={formatGs(resumen.total_compras)} icon={Receipt} color="primary" />
        <StatCard label="Utilidad Bruta" value={formatGs(resumen.utilidad_bruta)} icon={Money} color="success" />
        <StatCard label="Total Gastos" value={formatGs(resumen.total_gastos)} icon={Money} color="warning" />
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-md">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-heading font-semibold text-foreground">Top Productos Vendidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Producto</th><th className="text-right">Cantidad</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {top_productos?.length > 0 ? top_productos.map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-right">{p.cantidad}</td>
                    <td className="text-right price-gs">{formatGs(p.total)}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="text-center text-muted-foreground py-8">Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-border rounded-md">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-heading font-semibold text-foreground">Top Clientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Cliente</th><th className="text-right">Compras</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {top_clientes?.length > 0 ? top_clientes.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.nombre}</td>
                    <td className="text-right">{c.cantidad_compras}</td>
                    <td className="text-right price-gs">{formatGs(c.total_compras)}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="text-center text-muted-foreground py-8">Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {bajo_stock?.length > 0 && (
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

// Usuarios View (Admin)
function UsuariosView() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    email: '', password: '', nombre: '', role: 'usuario',
    permisos: {
      dashboard: { ver: true },
      productos: { ver: true, crear: false, editar: false, eliminar: false },
      ventas: { ver: true, crear: true, editar: false, eliminar: false },
      compras: { ver: true, crear: true, editar: false, eliminar: false },
      clientes: { ver: true, crear: true, editar: false, eliminar: false },
      proveedores: { ver: true, crear: false, editar: false, eliminar: false },
      gastos: { ver: true, crear: true, editar: false, eliminar: false },
      reportes: { ver: true },
      auditoria: { ver: false },
      usuarios: { ver: false, crear: false, editar: false, eliminar: false }
    }
  });
  const [newPassword, setNewPassword] = useState('');

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getUsuarios();
      setUsuarios(res.data.usuarios || []);
    } catch (error) {
      console.error('Error loading usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsuarios(); }, [loadUsuarios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUsuario) {
        await api.updateUsuario(editingUsuario.id, {
          nombre: formData.nombre,
          role: formData.role,
          permisos: formData.permisos
        });
      } else {
        await api.createUsuario(formData);
      }
      setShowModal(false);
      setEditingUsuario(null);
      loadUsuarios();
    } catch (error) {
      alert(formatApiError(error.response?.data?.detail));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.changePassword(editingUsuario.id, { password: newPassword });
      alert('Contraseña actualizada');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error) {
      alert(formatApiError(error.response?.data?.detail));
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      email: usuario.email,
      password: '',
      nombre: usuario.nombre || '',
      role: usuario.role || 'usuario',
      permisos: usuario.permisos || formData.permisos
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Desactivar este usuario?')) {
      try {
        await api.deleteUsuario(id);
        loadUsuarios();
      } catch (error) {
        alert(formatApiError(error.response?.data?.detail));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '', password: '', nombre: '', role: 'usuario',
      permisos: {
        dashboard: { ver: true },
        productos: { ver: true, crear: false, editar: false, eliminar: false },
        ventas: { ver: true, crear: true, editar: false, eliminar: false },
        compras: { ver: true, crear: true, editar: false, eliminar: false },
        clientes: { ver: true, crear: true, editar: false, eliminar: false },
        proveedores: { ver: true, crear: false, editar: false, eliminar: false },
        gastos: { ver: true, crear: true, editar: false, eliminar: false },
        reportes: { ver: true },
        auditoria: { ver: false },
        usuarios: { ver: false, crear: false, editar: false, eliminar: false }
      }
    });
  };

  const updatePermiso = (modulo, accion, valor) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [modulo]: {
          ...prev.permisos[modulo],
          [accion]: valor
        }
      }
    }));
  };

  const modulos = ['dashboard', 'productos', 'ventas', 'compras', 'clientes', 'proveedores', 'gastos', 'reportes'];
  const acciones = ['ver', 'crear', 'editar', 'eliminar'];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="usuarios-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Gestión de Usuarios</h2>
        <button
          onClick={() => { resetForm(); setEditingUsuario(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors"
          data-testid="add-usuario-btn"
        >
          <Plus size={20} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No hay usuarios</td></tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.email}</td>
                  <td>{u.nombre || '-'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo !== false ? 'badge-success' : 'badge-danger'}`}>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(u)} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <Pencil size={16} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => { setEditingUsuario(u); setShowPasswordModal(true); }} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <Lock size={16} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-50 rounded-md transition-colors">
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

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingUsuario(null); }} title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Email/Usuario</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                required
                disabled={!!editingUsuario}
                data-testid="input-usuario-email"
              />
            </div>
            {!editingUsuario && (
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  required={!editingUsuario}
                  minLength={6}
                  data-testid="input-usuario-password"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="form-input"
                required
                data-testid="input-usuario-nombre"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="form-input"
                data-testid="input-usuario-role"
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {formData.role === 'usuario' && (
            <div className="border border-border rounded-md p-4">
              <h4 className="font-semibold mb-3">Permisos por Módulo</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Módulo</th>
                      {acciones.map(a => <th key={a} className="text-center py-2 px-2 capitalize">{a}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {modulos.map(m => (
                      <tr key={m} className="border-b last:border-0">
                        <td className="py-2 px-2 capitalize font-medium">{m}</td>
                        {acciones.map(a => (
                          <td key={a} className="text-center py-2 px-2">
                            {(m === 'dashboard' || m === 'reportes') && a !== 'ver' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <input
                                type="checkbox"
                                checked={formData.permisos[m]?.[a] || false}
                                onChange={(e) => updatePermiso(m, a, e.target.checked)}
                                className="w-4 h-4 accent-[#E63946]"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowModal(false); setEditingUsuario(null); }} className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] transition-colors" data-testid="submit-usuario">
              <Check size={18} />
              <span>{editingUsuario ? 'Actualizar' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setNewPassword(''); }} title="Cambiar Contraseña" size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              data-testid="input-new-password"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowPasswordModal(false); setNewPassword(''); }} className="px-4 py-2 border border-border rounded-md hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="submit-password">
              Cambiar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Auditoría View (Admin)
function AuditoriaView() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState('');

  const loadAuditoria = useCallback(async () => {
    try {
      setLoading(true);
      const params = filtroModulo ? { modulo: filtroModulo } : {};
      const res = await api.getAuditoria(params);
      setRegistros(res.data.registros || []);
    } catch (error) {
      console.error('Error loading auditoria:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroModulo]);

  useEffect(() => { loadAuditoria(); }, [loadAuditoria]);

  const modulos = ['auth', 'usuarios', 'productos', 'ventas', 'compras', 'clientes', 'proveedores', 'gastos'];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="auditoria-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Auditoría del Sistema</h2>
        <select
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
          className="form-input w-48"
        >
          <option value="">Todos los módulos</option>
          {modulos.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
        </select>
      </div>

      <div className="bg-white border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Módulo</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
              ) : registros.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No hay registros</td></tr>
              ) : (
                registros.map((r) => (
                  <tr key={r.id}>
                    <td className="text-sm whitespace-nowrap">{new Date(r.fecha).toLocaleString('es-PY')}</td>
                    <td className="font-medium">{r.usuario_email}</td>
                    <td>
                      <span className="badge bg-muted text-foreground">{r.accion}</span>
                    </td>
                    <td className="capitalize">{r.modulo}</td>
                    <td className="text-sm text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(r.detalle)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Stock Historial View
function StockHistorialView() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');

  const loadMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const params = filtroTipo ? { tipo: filtroTipo } : {};
      const res = await api.getStockMovimientos(params);
      setMovimientos(res.data.movimientos || []);
    } catch (error) {
      console.error('Error loading movimientos:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo]);

  useEffect(() => { loadMovimientos(); }, [loadMovimientos]);

  const exportCSV = async () => {
    window.open(`${API_URL}/api/reportes/stock-movimientos?formato=csv`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="stock-historial-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Historial de Movimientos de Stock</h2>
        <div className="flex gap-3">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="form-input w-40">
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted">
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th className="text-right">Cantidad</th>
                <th className="text-right">Stock Ant.</th>
                <th className="text-right">Stock Nuevo</th>
                <th>Referencia</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
              ) : movimientos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No hay movimientos</td></tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="text-sm whitespace-nowrap">{new Date(m.fecha).toLocaleString('es-PY')}</td>
                    <td className="font-medium">{m.producto_nombre}</td>
                    <td>
                      <span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : 'badge-warning'}`}>
                        {m.tipo === 'entrada' ? '+ Entrada' : '- Salida'}
                      </span>
                    </td>
                    <td className="text-right font-mono">{m.cantidad}</td>
                    <td className="text-right font-mono text-muted-foreground">{m.stock_anterior}</td>
                    <td className="text-right font-mono font-medium">{m.stock_nuevo}</td>
                    <td className="capitalize">{m.referencia_tipo || '-'}</td>
                    <td className="text-sm">{m.usuario_email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Reportes View
function ReportesView() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const exportVentasCSV = () => {
    let url = `${API_URL}/api/reportes/ventas?formato=csv`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    window.open(url, '_blank');
  };

  const exportProductosCSV = () => {
    window.open(`${API_URL}/api/reportes/productos?formato=csv`, '_blank');
  };

  const exportStockCSV = () => {
    let url = `${API_URL}/api/reportes/stock-movimientos?formato=csv`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reportes-view">
      <h2 className="text-2xl font-heading font-semibold text-foreground">Reportes</h2>

      <div className="bg-white border border-border rounded-md p-6">
        <h3 className="font-semibold mb-4">Filtros de Fecha</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md mb-6">
          <div className="form-group">
            <label className="form-label">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="form-input" />
          </div>
        </div>

        <h3 className="font-semibold mb-4">Exportar Reportes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={exportVentasCSV} className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors" data-testid="export-ventas">
            <FileText size={24} className="text-green-600" />
            <div className="text-left">
              <p className="font-medium">Reporte de Ventas</p>
              <p className="text-xs text-muted-foreground">Exportar a CSV</p>
            </div>
          </button>
          <button onClick={exportProductosCSV} className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors" data-testid="export-productos">
            <Package size={24} className="text-blue-600" />
            <div className="text-left">
              <p className="font-medium">Reporte de Productos</p>
              <p className="text-xs text-muted-foreground">Inventario actual</p>
            </div>
          </button>
          <button onClick={exportStockCSV} className="flex items-center justify-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors" data-testid="export-stock">
            <ClockCounterClockwise size={24} className="text-orange-600" />
            <div className="text-left">
              <p className="font-medium">Movimientos Stock</p>
              <p className="text-xs text-muted-foreground">Historial completo</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Placeholder views for other modules (keeping original logic)
function ProductosView({ user }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [ajusteData, setAjusteData] = useState({ cantidad: 0, motivo: '' });
  const [formData, setFormData] = useState({
    codigo: '', nombre: '', variante: '', categoria: '', proveedor: '',
    precio_con_iva: 0, iva_pct: 10, costo: 0, stock: 0, stock_minimo: 2, margen: 15
  });

  const canCreate = user?.role === 'admin' || user?.permisos?.productos?.crear;
  const canEdit = user?.role === 'admin' || user?.permisos?.productos?.editar;
  const canDelete = user?.role === 'admin' || user?.permisos?.productos?.eliminar;

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoriaFilter) params.categoria = categoriaFilter;
      const [prodRes, catRes] = await Promise.all([api.getProductos(params), api.getCategorias()]);
      setProductos(prodRes.data.productos || []);
      setCategorias(catRes.data.categorias || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search, categoriaFilter]);

  useEffect(() => { loadProductos(); }, [loadProductos]);

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
      loadProductos();
    } catch (error) {
      alert(formatApiError(error.response?.data?.detail));
    }
  };

  const handleAjusteStock = async (e) => {
    e.preventDefault();
    try {
      await api.ajustarStock(editingProduct.id, ajusteData);
      setShowAjusteModal(false);
      setAjusteData({ cantidad: 0, motivo: '' });
      loadProductos();
    } catch (error) {
      alert(formatApiError(error.response?.data?.detail));
    }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      codigo: producto.codigo, nombre: producto.nombre, variante: producto.variante || '',
      categoria: producto.categoria, proveedor: producto.proveedor,
      precio_con_iva: producto.precio_con_iva, iva_pct: producto.iva_pct,
      costo: producto.costo, stock: producto.stock, stock_minimo: producto.stock_minimo, margen: producto.margen
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      try { await api.deleteProducto(id); loadProductos(); }
      catch (error) { alert('Error al eliminar'); }
    }
  };

  const resetForm = () => {
    setFormData({ codigo: '', nombre: '', variante: '', categoria: '', proveedor: '',
      precio_con_iva: 0, iva_pct: 10, costo: 0, stock: 0, stock_minimo: 2, margen: 15 });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="productos-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Productos</h2>
        {canCreate && (
          <button onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="add-producto-btn">
            <Plus size={20} /><span>Nuevo Producto</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10" data-testid="search-productos" />
        </div>
        <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="form-input w-48">
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="bg-white border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Categoría</th><th>Proveedor</th>
                <th className="text-right">Costo</th><th className="text-right">Precio</th>
                <th className="text-center">Stock</th><th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
              ) : productos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No hay productos</td></tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-sm">{p.codigo}</td>
                    <td><div><p className="font-medium">{p.nombre}</p>{p.variante && <p className="text-xs text-muted-foreground">{p.variante}</p>}</div></td>
                    <td><span className="badge bg-muted text-foreground">{p.categoria}</span></td>
                    <td className="text-sm">{p.proveedor}</td>
                    <td className="text-right price-gs text-sm">{formatGs(p.costo)}</td>
                    <td className="text-right price-gs font-medium">{formatGs(p.precio_con_iva)}</td>
                    <td className="text-center">
                      <span className={`font-semibold ${p.stock < p.stock_minimo ? 'low-stock' : 'ok-stock'}`}>{p.stock}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <>
                            <button onClick={() => handleEdit(p)} className="p-2 hover:bg-muted rounded-md">
                              <Pencil size={16} className="text-muted-foreground" />
                            </button>
                            <button onClick={() => { setEditingProduct(p); setShowAjusteModal(true); }} className="p-2 hover:bg-muted rounded-md" title="Ajustar stock">
                              <Gear size={16} className="text-muted-foreground" />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-md">
                            <Trash size={16} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProduct(null); }} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Código</label>
              <input type="text" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="form-input" required disabled={!!editingProduct} />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <input type="text" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="form-input" required list="categorias-list" />
              <datalist id="categorias-list">{categorias.map((cat) => <option key={cat} value={cat} />)}</datalist>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="form-input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Variante</label>
              <input type="text" value={formData.variante} onChange={(e) => setFormData({ ...formData, variante: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Proveedor</label>
              <input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} className="form-input" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Costo</label>
              <input type="number" value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })} className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Precio (con IVA)</label>
              <input type="number" value={formData.precio_con_iva} onChange={(e) => setFormData({ ...formData, precio_con_iva: parseFloat(e.target.value) || 0 })} className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">IVA %</label>
              <select value={formData.iva_pct} onChange={(e) => setFormData({ ...formData, iva_pct: parseInt(e.target.value) })} className="form-input">
                <option value={5}>5%</option><option value={10}>10%</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Mínimo</label>
              <input type="number" value={formData.stock_minimo} onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })} className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Margen %</label>
              <input type="number" value={formData.margen} onChange={(e) => setFormData({ ...formData, margen: parseInt(e.target.value) || 0 })} className="form-input" min="0" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowModal(false); setEditingProduct(null); }} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">
              <Check size={18} /><span>{editingProduct ? 'Actualizar' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Ajuste Stock Modal */}
      <Modal isOpen={showAjusteModal} onClose={() => { setShowAjusteModal(false); setAjusteData({ cantidad: 0, motivo: '' }); }} title="Ajustar Stock" size="sm">
        <form onSubmit={handleAjusteStock} className="space-y-4">
          <p className="text-sm text-muted-foreground">Producto: <span className="font-medium text-foreground">{editingProduct?.nombre}</span></p>
          <p className="text-sm text-muted-foreground">Stock actual: <span className="font-medium text-foreground">{editingProduct?.stock}</span></p>
          <div className="form-group">
            <label className="form-label">Cantidad (+ entrada, - salida)</label>
            <input type="number" value={ajusteData.cantidad} onChange={(e) => setAjusteData({ ...ajusteData, cantidad: parseInt(e.target.value) || 0 })}
              className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Motivo</label>
            <input type="text" value={ajusteData.motivo} onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
              className="form-input" required placeholder="Ej: Inventario físico, Merma, etc." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowAjusteModal(false); setAjusteData({ cantidad: 0, motivo: '' }); }} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">Ajustar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Simple placeholder components for other views (shortened for brevity)
function ClientesView({ user }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', ruc: '', telefono: '', direccion: '', ciudad: '', tipo: 'Odontólogo' });

  const canCreate = user?.role === 'admin' || user?.permisos?.clientes?.crear;

  const loadClientes = useCallback(async () => {
    try { setLoading(true); const res = await api.getClientes(search ? { search } : {}); setClientes(res.data.clientes || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) await api.updateCliente(editingCliente.id, formData);
      else await api.createCliente(formData);
      setShowModal(false); setEditingCliente(null); loadClientes();
    } catch (error) { alert(formatApiError(error.response?.data?.detail)); }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="clientes-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Clientes</h2>
        {canCreate && (
          <button onClick={() => { setFormData({ nombre: '', ruc: '', telefono: '', direccion: '', ciudad: '', tipo: 'Odontólogo' }); setEditingCliente(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="add-cliente-btn">
            <Plus size={20} /><span>Nuevo Cliente</span>
          </button>
        )}
      </div>
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" />
      </div>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Tipo</th><th>Teléfono</th><th>Ciudad</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> :
              clientes.length === 0 ? <tr><td colSpan={5} className="text-center py-8">No hay clientes</td></tr> :
              clientes.map(c => (
                <tr key={c.id}>
                  <td className="font-medium">{c.nombre}</td>
                  <td><span className="badge bg-blue-100 text-blue-800">{c.tipo}</span></td>
                  <td>{c.telefono || '-'}</td>
                  <td>{c.ciudad || '-'}</td>
                  <td className="text-right price-gs">{formatGs(c.total_compras || 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="form-input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <input type="text" value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function VentasView({ user }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVentas({}).then(res => setVentas(res.data.ventas || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="ventas-view">
      <h2 className="text-2xl font-heading font-semibold text-foreground">Ventas</h2>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Cliente</th><th>Items</th><th className="text-right">Total</th><th className="text-right">Utilidad</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> :
              ventas.length === 0 ? <tr><td colSpan={5} className="text-center py-8">No hay ventas</td></tr> :
              ventas.map(v => (
                <tr key={v.id}>
                  <td>{new Date(v.fecha).toLocaleDateString('es-PY')}</td>
                  <td className="font-medium">{v.cliente_nombre}</td>
                  <td>{v.items?.length || 0} productos</td>
                  <td className="text-right price-gs font-medium">{formatGs(v.total)}</td>
                  <td className="text-right price-gs text-green-600">{formatGs(v.utilidad)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComprasView({ user }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompras({}).then(res => setCompras(res.data.compras || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="compras-view">
      <h2 className="text-2xl font-heading font-semibold text-foreground">Compras</h2>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th>Items</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> :
              compras.length === 0 ? <tr><td colSpan={5} className="text-center py-8">No hay compras</td></tr> :
              compras.map(c => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha).toLocaleDateString('es-PY')}</td>
                  <td className="font-medium">{c.proveedor_nombre}</td>
                  <td>{c.factura || '-'}</td>
                  <td>{c.items?.length || 0} productos</td>
                  <td className="text-right price-gs font-medium">{formatGs(c.total)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProveedoresView({ user }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProveedores({}).then(res => setProveedores(res.data.proveedores || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="proveedores-view">
      <h2 className="text-2xl font-heading font-semibold text-foreground">Proveedores</h2>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>RUC</th><th>Contacto</th><th>Teléfono</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> :
              proveedores.length === 0 ? <tr><td colSpan={5} className="text-center py-8">No hay proveedores</td></tr> :
              proveedores.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td>{p.ruc || '-'}</td>
                  <td>{p.contacto || '-'}</td>
                  <td>{p.telefono || '-'}</td>
                  <td className="text-right price-gs">{formatGs(p.total_compras || 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GastosView({ user }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGastos({}).then(res => setGastos(res.data.gastos || [])).finally(() => setLoading(false));
  }, []);

  const totalGastos = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="gastos-view">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-foreground">Gastos Operativos</h2>
        <p className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatGs(totalGastos)}</span></p>
      </div>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th className="text-right">Monto</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> :
              gastos.length === 0 ? <tr><td colSpan={4} className="text-center py-8">No hay gastos</td></tr> :
              gastos.map(g => (
                <tr key={g.id}>
                  <td>{new Date(g.fecha).toLocaleDateString('es-PY')}</td>
                  <td><span className="badge bg-orange-100 text-orange-800">{g.categoria}</span></td>
                  <td>{g.descripcion}</td>
                  <td className="text-right price-gs font-medium">{formatGs(g.monto)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main App
function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);

  // Check auth on mount
  useEffect(() => {
    api.getMe()
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Load dashboard when authenticated
  useEffect(() => {
    if (user) {
      api.getDashboard()
        .then(res => setDashboardData(res.data))
        .catch(console.error);
    }
  }, [user]);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    setUser(null);
    setActiveView('dashboard');
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#E63946] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-heading font-bold text-2xl">pds</span>
          </div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  // Render view based on activeView
  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard data={dashboardData} />;
      case 'productos': return <ProductosView user={user} />;
      case 'ventas': return <VentasView user={user} />;
      case 'compras': return <ComprasView user={user} />;
      case 'clientes': return <ClientesView user={user} />;
      case 'proveedores': return <ProveedoresView user={user} />;
      case 'gastos': return <GastosView user={user} />;
      case 'reportes': return <ReportesView />;
      case 'stock-historial': return <StockHistorialView />;
      case 'usuarios': return <UsuariosView />;
      case 'auditoria': return <AuditoriaView />;
      default: return <Dashboard data={dashboardData} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="min-h-screen bg-background">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} onLogout={handleLogout} />
        <main className="ml-64 p-8">
          {renderView()}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
