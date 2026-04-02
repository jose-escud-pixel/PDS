import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import './App.css';
import axios from 'axios';
import {
  House, Package, ShoppingCart, Receipt, Users, Truck, Money,
  MagnifyingGlass, Plus, Pencil, Trash, Warning, X, Check,
  SignOut, UserCircle, ShieldCheck, ClockCounterClockwise, FileText,
  Download, Lock, Eye, EyeSlash, UserGear, Gear, ChartLine, ChartBar,
  ChartPie, FilePdf, CaretDown, Funnel, Calendar, TrendUp, TrendDown
} from '@phosphor-icons/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Format Guaranies
const formatGs = (value) => {
  if (!value && value !== 0) return 'Gs. 0';
  return 'Gs. ' + Math.round(value).toLocaleString('es-PY');
};

const formatGsShort = (value) => {
  if (!value) return '0';
  if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
  return value.toString();
};

const formatApiError = (detail) => {
  if (detail == null) return "Error desconocido";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  return String(detail);
};

// Chart colors
const COLORS = ['#E63946', '#457B9D', '#2A9D8F', '#E9C46A', '#F4A261', '#264653', '#A8DADC', '#6D6875'];

// API
const api = {
  login: (data) => axios.post(`${API_URL}/api/auth/login`, data),
  logout: () => axios.post(`${API_URL}/api/auth/logout`),
  getMe: () => axios.get(`${API_URL}/api/auth/me`),
  getUsuarios: () => axios.get(`${API_URL}/api/usuarios`),
  createUsuario: (data) => axios.post(`${API_URL}/api/usuarios`, data),
  updateUsuario: (id, data) => axios.put(`${API_URL}/api/usuarios/${id}`, data),
  changePassword: (id, data) => axios.put(`${API_URL}/api/usuarios/${id}/password`, data),
  deleteUsuario: (id) => axios.delete(`${API_URL}/api/usuarios/${id}`),
  getDashboard: () => axios.get(`${API_URL}/api/dashboard`),
  getProductos: (params) => axios.get(`${API_URL}/api/productos`, { params }),
  createProducto: (data) => axios.post(`${API_URL}/api/productos`, data),
  updateProducto: (id, data) => axios.put(`${API_URL}/api/productos/${id}`, data),
  deleteProducto: (id) => axios.delete(`${API_URL}/api/productos/${id}`),
  ajustarStock: (id, data) => axios.post(`${API_URL}/api/productos/${id}/ajuste-stock`, data),
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
  getAuditoria: (params) => axios.get(`${API_URL}/api/auditoria`, { params }),
  getStockMovimientos: (params) => axios.get(`${API_URL}/api/stock-movimientos`, { params }),
  // Estadísticas
  getVentasPorPeriodo: (params) => axios.get(`${API_URL}/api/estadisticas/ventas-por-periodo`, { params }),
  getComprasPorPeriodo: (params) => axios.get(`${API_URL}/api/estadisticas/compras-por-periodo`, { params }),
  getProductosMasVendidos: (params) => axios.get(`${API_URL}/api/estadisticas/productos-mas-vendidos`, { params }),
  getVentasPorCliente: (params) => axios.get(`${API_URL}/api/estadisticas/ventas-por-cliente`, { params }),
  getComprasPorProveedor: (params) => axios.get(`${API_URL}/api/estadisticas/compras-por-proveedor`, { params }),
  getStockPorCategoria: () => axios.get(`${API_URL}/api/estadisticas/stock-por-categoria`),
  getGastosPorCategoria: () => axios.get(`${API_URL}/api/estadisticas/gastos-por-categoria`),
  getResumenGeneral: () => axios.get(`${API_URL}/api/estadisticas/resumen-general`),
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
    setError(''); setLoading(true);
    try {
      const { data } = await api.login({ email, password });
      onLogin(data);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || 'Error de conexión');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#E63946] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-heading font-bold text-3xl">pds</span>
          </div>
        </div>
        <h1 className="text-2xl font-heading font-semibold text-center text-foreground mb-2">Bienvenido</h1>
        <p className="text-center text-muted-foreground mb-8">Sistema de Gestión PDS</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="Ingrese su usuario" required data-testid="login-email" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input pr-10" placeholder="Ingrese su contraseña" required data-testid="login-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#E63946] text-white py-3 rounded-lg font-medium hover:bg-[#D90429] transition-colors disabled:opacity-50" data-testid="login-submit">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-8">PDS Insumos Odontológicos</p>
      </div>
    </div>
  );
}

// Sidebar
function Sidebar({ activeView, setActiveView, user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const checkPermission = (modulo) => isAdmin || user?.permisos?.[modulo]?.ver;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House, visible: checkPermission('dashboard') },
    { id: 'estadisticas', label: 'Estadísticas', icon: ChartLine, visible: checkPermission('reportes') },
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.filter(i => i.visible).map((item) => (
          <button key={item.id} onClick={() => setActiveView(item.id)} data-testid={`nav-${item.id}`}
            className={`nav-link w-full ${activeView === item.id ? 'active' : ''}`}>
            <item.icon size={20} weight={activeView === item.id ? 'fill' : 'regular'} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administración</p>
            </div>
            {adminItems.filter(i => i.visible).map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id)} data-testid={`nav-${item.id}`}
                className={`nav-link w-full ${activeView === item.id ? 'active' : ''}`}>
                <item.icon size={20} weight={activeView === item.id ? 'fill' : 'regular'} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>
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
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-testid="logout-btn">
          <SignOut size={18} /><span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

// Modal
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl' };
  return (
    <div className="modal-overlay flex items-center justify-center" onClick={onClose}>
      <div className={`modal-content ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Stat Card with trend
function StatCard({ label, value, icon: Icon, color = 'primary', trend, subtext }) {
  const colorClasses = { primary: 'text-[#E63946]', success: 'text-green-600', warning: 'text-yellow-600', danger: 'text-red-600', blue: 'text-blue-600' };
  return (
    <div className="stat-card card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className={`stat-value mt-2 ${colorClasses[color]}`}>{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        {Icon && <div className={`p-3 rounded-lg bg-muted ${colorClasses[color]}`}><Icon size={24} weight="duotone" /></div>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatGs(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dashboard with Charts
function Dashboard({ data, stats }) {
  if (!data || !stats) return <div className="p-8 text-center text-muted-foreground">Cargando dashboard...</div>;

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
        <StatCard label="Total Ventas" value={formatGs(resumen.total_ventas)} icon={ShoppingCart} color="success" subtext={`${resumen.cantidad_ventas} operaciones`} />
        <StatCard label="Total Compras" value={formatGs(resumen.total_compras)} icon={Receipt} color="primary" subtext={`${resumen.cantidad_compras} operaciones`} />
        <StatCard label="Utilidad Bruta" value={formatGs(resumen.utilidad_bruta)} icon={TrendUp} color="success" />
        <StatCard label="Total Gastos" value={formatGs(resumen.total_gastos)} icon={Money} color="warning" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas vs Compras Chart */}
        {stats.ventasPeriodo && stats.ventasPeriodo.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Ventas y Utilidad por Período</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.ventasPeriodo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatGsShort} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#2A9D8F" fill="#2A9D8F" fillOpacity={0.3} />
                <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#E63946" fill="#E63946" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Productos Chart */}
        {stats.productosMasVendidos && stats.productosMasVendidos.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Top 10 Productos Vendidos</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.productosMasVendidos.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatGsShort} />
                <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total Vendido" fill="#E63946" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card"><p className="stat-label">Productos</p><p className="stat-value text-foreground">{resumen.total_productos}</p></div>
        <div className="stat-card"><p className="stat-label">Stock Valorizado</p><p className="stat-value text-foreground text-lg">{formatGs(resumen.valor_stock_venta)}</p></div>
        <div className="stat-card"><p className="stat-label">Sin Stock</p><p className={`stat-value ${resumen.productos_sin_stock > 0 ? 'text-red-600' : 'text-green-600'}`}>{resumen.productos_sin_stock}</p></div>
        <div className="stat-card"><p className="stat-label">Bajo Mínimo</p><p className={`stat-value ${resumen.productos_bajo_minimo > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{resumen.productos_bajo_minimo}</p></div>
        <div className="stat-card"><p className="stat-label">Clientes</p><p className="stat-value text-foreground">{resumen.total_clientes}</p></div>
        <div className="stat-card"><p className="stat-label">Proveedores</p><p className="stat-value text-foreground">{resumen.total_proveedores}</p></div>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock por Categoría */}
        {stats.stockCategoria && stats.stockCategoria.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Stock por Categoría (Top 10)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stats.stockCategoria.slice(0, 10)} dataKey="valor_venta" nameKey="categoria" cx="50%" cy="50%" outerRadius={100} label={({ categoria, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {stats.stockCategoria.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatGs(value)} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ventas por Cliente */}
        {stats.ventasCliente && stats.ventasCliente.length > 0 && (
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Top Clientes por Ventas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.ventasCliente.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatGsShort} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_compras" name="Total Compras" fill="#457B9D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-md">
          <div className="px-6 py-4 border-b border-border"><h3 className="font-heading font-semibold text-foreground">Top Productos Vendidos</h3></div>
          <table className="data-table">
            <thead><tr><th>Producto</th><th className="text-right">Cant.</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {top_productos?.length > 0 ? top_productos.map((p, i) => (
                <tr key={i}><td className="font-medium">{p.nombre}</td><td className="text-right">{p.cantidad}</td><td className="text-right price-gs">{formatGs(p.total)}</td></tr>
              )) : <tr><td colSpan={3} className="text-center text-muted-foreground py-8">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-border rounded-md">
          <div className="px-6 py-4 border-b border-border"><h3 className="font-heading font-semibold text-foreground">Top Clientes</h3></div>
          <table className="data-table">
            <thead><tr><th>Cliente</th><th className="text-right">Compras</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {top_clientes?.length > 0 ? top_clientes.map((c, i) => (
                <tr key={i}><td className="font-medium">{c.nombre}</td><td className="text-right">{c.cantidad_compras}</td><td className="text-right price-gs">{formatGs(c.total_compras)}</td></tr>
              )) : <tr><td colSpan={3} className="text-center text-muted-foreground py-8">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
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
                <p className="text-xs text-muted-foreground">{p.codigo} | Stock: <span className="text-red-600 font-semibold">{p.stock}</span> / Min: {p.stock_minimo}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Estadísticas View
function EstadisticasView() {
  const [periodo, setPeriodo] = useState('mes');
  const [ventasPeriodo, setVentasPeriodo] = useState([]);
  const [comprasPeriodo, setComprasPeriodo] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [ventasCliente, setVentasCliente] = useState([]);
  const [comprasProveedor, setComprasProveedor] = useState([]);
  const [stockCategoria, setStockCategoria] = useState([]);
  const [gastosCategoria, setGastosCategoria] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [vp, cp, pmv, vc, cpr, sc, gc, res] = await Promise.all([
        api.getVentasPorPeriodo({ periodo, limite: 12 }),
        api.getComprasPorPeriodo({ periodo, limite: 12 }),
        api.getProductosMasVendidos({ limite: 15 }),
        api.getVentasPorCliente({ limite: 10 }),
        api.getComprasPorProveedor({ limite: 10 }),
        api.getStockPorCategoria(),
        api.getGastosPorCategoria(),
        api.getResumenGeneral()
      ]);
      setVentasPeriodo(vp.data.data || []);
      setComprasPeriodo(cp.data.data || []);
      setProductosMasVendidos(pmv.data.data || []);
      setVentasCliente(vc.data.data || []);
      setComprasProveedor(cpr.data.data || []);
      setStockCategoria(sc.data.data || []);
      setGastosCategoria(gc.data.data || []);
      setResumen(res.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const exportPDF = async () => {
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFillColor(230, 57, 70);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('PDS - Reporte de Estadísticas', 14, 17);
    pdf.setFontSize(10);
    pdf.text(new Date().toLocaleDateString('es-PY', { dateStyle: 'full' }), pageWidth - 14, 17, { align: 'right' });
    
    // Reset colors
    pdf.setTextColor(0, 0, 0);
    
    // Resumen General
    let y = 35;
    pdf.setFontSize(14);
    pdf.text('Resumen General', 14, y);
    y += 8;
    
    if (resumen) {
      autoTable(pdf, {
        startY: y,
        head: [['Concepto', 'Valor']],
        body: [
          ['Total Ventas', formatGs(resumen.ventas.total)],
          ['Utilidad en Ventas', formatGs(resumen.ventas.utilidad)],
          ['Total Compras', formatGs(resumen.compras.total)],
          ['Total Gastos', formatGs(resumen.gastos.total)],
          ['Utilidad Neta', formatGs(resumen.utilidad_neta)],
          ['Valor Stock (Venta)', formatGs(resumen.stock.valor_venta)],
          ['Productos Activos', resumen.stock.productos.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [230, 57, 70] },
        margin: { left: 14, right: pageWidth / 2 + 10 },
        tableWidth: pageWidth / 2 - 20,
      });
    }
    
    // Top Productos
    if (productosMasVendidos.length > 0) {
      autoTable(pdf, {
        startY: y,
        head: [['Top Productos Vendidos', 'Cantidad', 'Total']],
        body: productosMasVendidos.slice(0, 10).map(p => [p.nombre, p.cantidad, formatGs(p.total)]),
        theme: 'striped',
        headStyles: { fillColor: [69, 123, 157] },
        margin: { left: pageWidth / 2 + 5, right: 14 },
        tableWidth: pageWidth / 2 - 20,
      });
    }
    
    // Page 2 - Charts as images
    pdf.addPage();
    pdf.setFillColor(230, 57, 70);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('PDS - Gráficos de Estadísticas', 14, 17);
    
    // Capture charts
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 14, 35, imgWidth, Math.min(imgHeight, 160));
    }
    
    pdf.save('pds_estadisticas.pdf');
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando estadísticas...</div>;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="estadisticas-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Estadísticas</h2>
        <div className="flex gap-3">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="form-input w-40">
            <option value="dia">Por Día</option>
            <option value="semana">Por Semana</option>
            <option value="mes">Por Mes</option>
            <option value="año">Por Año</option>
          </select>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="export-pdf">
            <FilePdf size={20} /><span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Resumen Cards */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Total Ventas" value={formatGs(resumen.ventas.total)} color="success" subtext={`${resumen.ventas.cantidad} ventas`} />
          <StatCard label="Utilidad Ventas" value={formatGs(resumen.ventas.utilidad)} color="success" />
          <StatCard label="Total Compras" value={formatGs(resumen.compras.total)} color="primary" subtext={`${resumen.compras.cantidad} compras`} />
          <StatCard label="Total Gastos" value={formatGs(resumen.gastos.total)} color="warning" />
          <StatCard label="Utilidad Neta" value={formatGs(resumen.utilidad_neta)} color={resumen.utilidad_neta >= 0 ? 'success' : 'danger'} />
          <StatCard label="Valor Stock" value={formatGs(resumen.stock.valor_venta)} color="blue" subtext={`${resumen.stock.unidades} unidades`} />
        </div>
      )}

      {/* Charts Grid */}
      <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Período */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Ventas y Utilidad por {periodo}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={ventasPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#2A9D8F" fill="#2A9D8F" fillOpacity={0.4} />
              <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#E63946" fill="#E63946" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compras por Período */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Compras por {periodo}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comprasPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total Compras" fill="#457B9D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Top 15 Productos Más Vendidos</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={productosMasVendidos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <YAxis type="category" dataKey="nombre" width={150} tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" name="Total Vendido" fill="#E63946" radius={[0, 4, 4, 0]} />
              <Bar dataKey="utilidad" name="Utilidad" fill="#2A9D8F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por Cliente */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Ventas por Cliente</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={ventasCliente} dataKey="total_compras" nameKey="nombre" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {ventasCliente.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(value) => formatGs(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stock por Categoría */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Valor de Stock por Categoría</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stockCategoria.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="categoria" tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={80} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="valor_venta" name="Valor Venta" fill="#264653" radius={[4, 4, 0, 0]} />
              <Bar dataKey="valor_costo" name="Valor Costo" fill="#A8DADC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gastos por Categoría */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={gastosCategoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}>
                {gastosCategoria.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(value) => formatGs(value)} />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Compras por Proveedor */}
        <div className="bg-white border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="font-heading font-semibold text-foreground mb-4">Compras por Proveedor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comprasProveedor}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total Compras" fill="#F4A261" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Reportes View con PDF
function ReportesView() {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportCSV = (tipo) => {
    let url = `${API_URL}/api/reportes/${tipo}?formato=csv`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    window.open(url, '_blank');
  };

  const exportVentasPDF = async () => {
    setExporting(true);
    try {
      const params = {};
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      
      const res = await axios.get(`${API_URL}/api/reportes/ventas`, { params });
      const { resumen, ventas } = res.data;
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      pdf.setFillColor(230, 57, 70);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('PDS - Reporte de Ventas', 14, 17);
      pdf.setFontSize(10);
      const fechaStr = fechaDesde || fechaHasta ? `${fechaDesde || 'Inicio'} a ${fechaHasta || 'Hoy'}` : 'Todas las fechas';
      pdf.text(fechaStr, pageWidth - 14, 17, { align: 'right' });
      
      pdf.setTextColor(0, 0, 0);
      
      // Resumen
      let y = 35;
      pdf.setFontSize(12);
      pdf.text('Resumen', 14, y);
      autoTable(pdf, {
        startY: y + 5,
        head: [['Total Ventas', 'Total Costo', 'Utilidad', 'Cantidad']],
        body: [[formatGs(resumen.total_ventas), formatGs(resumen.total_costo), formatGs(resumen.total_utilidad), resumen.cantidad_ventas]],
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] },
      });
      
      // Detalle
      autoTable(pdf, {
        startY: pdf.lastAutoTable.finalY + 10,
        head: [['Fecha', 'Cliente', 'Total', 'Costo', 'Utilidad', 'Vendedor']],
        body: ventas.slice(0, 50).map(v => [
          v.fecha?.substring(0, 10) || '',
          v.cliente_nombre || '',
          formatGs(v.total),
          formatGs(v.total_costo),
          formatGs(v.utilidad),
          v.vendedor || ''
        ]),
        theme: 'striped',
        headStyles: { fillColor: [69, 123, 157] },
        styles: { fontSize: 9 },
      });
      
      pdf.save('pds_reporte_ventas.pdf');
    } catch (error) {
      alert('Error al generar PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportProductosPDF = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API_URL}/api/reportes/productos`);
      const { productos } = res.data;
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(230, 57, 70);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('PDS - Reporte de Inventario', 14, 17);
      pdf.setFontSize(10);
      pdf.text(new Date().toLocaleDateString('es-PY'), pageWidth - 14, 17, { align: 'right' });
      
      pdf.setTextColor(0, 0, 0);
      
      autoTable(pdf, {
        startY: 35,
        head: [['Código', 'Nombre', 'Categoría', 'Proveedor', 'Stock', 'Costo', 'Precio', 'Valor Stock']],
        body: productos.map(p => [
          p.codigo,
          p.nombre?.substring(0, 30),
          p.categoria?.substring(0, 15),
          p.proveedor?.substring(0, 15),
          p.stock,
          formatGs(p.costo),
          formatGs(p.precio_con_iva),
          formatGs(p.stock * p.precio_con_iva)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [69, 123, 157] },
        styles: { fontSize: 8 },
      });
      
      pdf.save('pds_inventario.pdf');
    } catch (error) {
      alert('Error al generar PDF');
    } finally {
      setExporting(false);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => exportCSV('ventas')} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
            <FileText size={24} className="text-green-600" />
            <div className="text-left"><p className="font-medium">Ventas CSV</p><p className="text-xs text-muted-foreground">Excel compatible</p></div>
          </button>
          <button onClick={exportVentasPDF} disabled={exporting} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
            <FilePdf size={24} className="text-red-600" />
            <div className="text-left"><p className="font-medium">Ventas PDF</p><p className="text-xs text-muted-foreground">Con resumen</p></div>
          </button>
          <button onClick={() => exportCSV('productos')} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
            <Package size={24} className="text-blue-600" />
            <div className="text-left"><p className="font-medium">Inventario CSV</p><p className="text-xs text-muted-foreground">Productos</p></div>
          </button>
          <button onClick={exportProductosPDF} disabled={exporting} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
            <FilePdf size={24} className="text-red-600" />
            <div className="text-left"><p className="font-medium">Inventario PDF</p><p className="text-xs text-muted-foreground">Completo</p></div>
          </button>
          <button onClick={() => exportCSV('stock-movimientos')} className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
            <ClockCounterClockwise size={24} className="text-orange-600" />
            <div className="text-left"><p className="font-medium">Movimientos Stock</p><p className="text-xs text-muted-foreground">Historial CSV</p></div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Simplified views (keeping core functionality)
function ProductosView({ user }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '', variante: '', categoria: '', proveedor: '', precio_con_iva: 0, iva_pct: 10, costo: 0, stock: 0, stock_minimo: 2, margen: 15 });

  const canCreate = user?.role === 'admin' || user?.permisos?.productos?.crear;
  const canEdit = user?.role === 'admin' || user?.permisos?.productos?.editar;
  const canDelete = user?.role === 'admin' || user?.permisos?.productos?.eliminar;

  const loadProductos = useCallback(async () => {
    try { setLoading(true); const params = {}; if (search) params.search = search; if (categoriaFilter) params.categoria = categoriaFilter;
      const [prodRes, catRes] = await Promise.all([api.getProductos(params), api.getCategorias()]);
      setProductos(prodRes.data.productos || []); setCategorias(catRes.data.categorias || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, categoriaFilter]);

  useEffect(() => { loadProductos(); }, [loadProductos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { if (editingProduct) await api.updateProducto(editingProduct.id, formData); else await api.createProducto(formData);
      setShowModal(false); setEditingProduct(null); loadProductos();
    } catch (error) { alert(formatApiError(error.response?.data?.detail)); }
  };

  const handleEdit = (p) => { setEditingProduct(p); setFormData({ codigo: p.codigo, nombre: p.nombre, variante: p.variante || '', categoria: p.categoria, proveedor: p.proveedor, precio_con_iva: p.precio_con_iva, iva_pct: p.iva_pct, costo: p.costo, stock: p.stock, stock_minimo: p.stock_minimo, margen: p.margen }); setShowModal(true); };
  const handleDelete = async (id) => { if (window.confirm('¿Eliminar?')) { try { await api.deleteProducto(id); loadProductos(); } catch { alert('Error'); } } };
  const resetForm = () => setFormData({ codigo: '', nombre: '', variante: '', categoria: '', proveedor: '', precio_con_iva: 0, iva_pct: 10, costo: 0, stock: 0, stock_minimo: 2, margen: 15 });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="productos-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold text-foreground">Productos</h2>
        {canCreate && <button onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }} className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="add-producto-btn"><Plus size={20} /><span>Nuevo</span></button>}
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]"><MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" /></div>
        <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="form-input w-48"><option value="">Todas</option>{categorias.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select>
      </div>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th className="text-right">Costo</th><th className="text-right">Precio</th><th className="text-center">Stock</th><th className="text-center">Acciones</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr> : productos.length === 0 ? <tr><td colSpan={7} className="text-center py-8">No hay productos</td></tr> :
              productos.map((p) => (<tr key={p.id}><td className="font-mono text-sm">{p.codigo}</td><td><p className="font-medium">{p.nombre}</p>{p.variante && <p className="text-xs text-muted-foreground">{p.variante}</p>}</td><td><span className="badge bg-muted text-foreground">{p.categoria}</span></td><td className="text-right price-gs text-sm">{formatGs(p.costo)}</td><td className="text-right price-gs font-medium">{formatGs(p.precio_con_iva)}</td><td className="text-center"><span className={`font-semibold ${p.stock < p.stock_minimo ? 'low-stock' : 'ok-stock'}`}>{p.stock}</span></td>
                <td><div className="flex items-center justify-center gap-1">{canEdit && <button onClick={() => handleEdit(p)} className="p-2 hover:bg-muted rounded-md"><Pencil size={16} className="text-muted-foreground" /></button>}{canDelete && <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-md"><Trash size={16} className="text-red-500" /></button>}</div></td></tr>))}</tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingProduct(null); }} title={editingProduct ? 'Editar' : 'Nuevo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="form-group"><label className="form-label">Código</label><input type="text" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="form-input" required disabled={!!editingProduct} /></div><div className="form-group"><label className="form-label">Categoría</label><input type="text" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="form-input" required list="cat-list" /><datalist id="cat-list">{categorias.map(c => <option key={c} value={c} />)}</datalist></div></div>
          <div className="form-group"><label className="form-label">Nombre</label><input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="form-input" required /></div>
          <div className="grid grid-cols-2 gap-4"><div className="form-group"><label className="form-label">Variante</label><input type="text" value={formData.variante} onChange={(e) => setFormData({ ...formData, variante: e.target.value })} className="form-input" /></div><div className="form-group"><label className="form-label">Proveedor</label><input type="text" value={formData.proveedor} onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })} className="form-input" required /></div></div>
          <div className="grid grid-cols-3 gap-4"><div className="form-group"><label className="form-label">Costo</label><input type="number" value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })} className="form-input" min="0" /></div><div className="form-group"><label className="form-label">Precio (IVA)</label><input type="number" value={formData.precio_con_iva} onChange={(e) => setFormData({ ...formData, precio_con_iva: parseFloat(e.target.value) || 0 })} className="form-input" min="0" /></div><div className="form-group"><label className="form-label">Stock</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="form-input" min="0" /></div></div>
          <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingProduct(null); }} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button><button type="submit" className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">{editingProduct ? 'Actualizar' : 'Crear'}</button></div>
        </form>
      </Modal>
    </div>
  );
}

// Other views (simplified)
function VentasView() { const [ventas, setVentas] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getVentas({}).then(r => setVentas(r.data.ventas || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="ventas-view"><h2 className="text-2xl font-heading font-semibold">Ventas</h2><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Fecha</th><th>Cliente</th><th className="text-right">Total</th><th className="text-right">Utilidad</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : ventas.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin ventas</td></tr> : ventas.map(v => (<tr key={v.id}><td>{new Date(v.fecha).toLocaleDateString('es-PY')}</td><td className="font-medium">{v.cliente_nombre}</td><td className="text-right price-gs">{formatGs(v.total)}</td><td className="text-right price-gs text-green-600">{formatGs(v.utilidad)}</td></tr>))}</tbody></table></div></div>); }
function ComprasView() { const [compras, setCompras] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getCompras({}).then(r => setCompras(r.data.compras || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="compras-view"><h2 className="text-2xl font-heading font-semibold">Compras</h2><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th className="text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : compras.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin compras</td></tr> : compras.map(c => (<tr key={c.id}><td>{new Date(c.fecha).toLocaleDateString('es-PY')}</td><td className="font-medium">{c.proveedor_nombre}</td><td>{c.factura || '-'}</td><td className="text-right price-gs">{formatGs(c.total)}</td></tr>))}</tbody></table></div></div>); }
function ClientesView() { const [clientes, setClientes] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getClientes({}).then(r => setClientes(r.data.clientes || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="clientes-view"><h2 className="text-2xl font-heading font-semibold">Clientes</h2><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Nombre</th><th>Teléfono</th><th>Ciudad</th><th className="text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : clientes.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin clientes</td></tr> : clientes.map(c => (<tr key={c.id}><td className="font-medium">{c.nombre}</td><td>{c.telefono || '-'}</td><td>{c.ciudad || '-'}</td><td className="text-right price-gs">{formatGs(c.total_compras || 0)}</td></tr>))}</tbody></table></div></div>); }
function ProveedoresView() { const [proveedores, setProveedores] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getProveedores({}).then(r => setProveedores(r.data.proveedores || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="proveedores-view"><h2 className="text-2xl font-heading font-semibold">Proveedores</h2><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th className="text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : proveedores.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin proveedores</td></tr> : proveedores.map(p => (<tr key={p.id}><td className="font-medium">{p.nombre}</td><td>{p.contacto || '-'}</td><td>{p.telefono || '-'}</td><td className="text-right price-gs">{formatGs(p.total_compras || 0)}</td></tr>))}</tbody></table></div></div>); }
function GastosView() { const [gastos, setGastos] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getGastos({}).then(r => setGastos(r.data.gastos || [])).finally(() => setLoading(false)); }, []); const total = gastos.reduce((s, g) => s + (g.monto || 0), 0); return (<div className="space-y-6" data-testid="gastos-view"><div><h2 className="text-2xl font-heading font-semibold">Gastos</h2><p className="text-muted-foreground">Total: {formatGs(total)}</p></div><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th className="text-right">Monto</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : gastos.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin gastos</td></tr> : gastos.map(g => (<tr key={g.id}><td>{new Date(g.fecha).toLocaleDateString('es-PY')}</td><td><span className="badge bg-orange-100 text-orange-800">{g.categoria}</span></td><td>{g.descripcion}</td><td className="text-right price-gs">{formatGs(g.monto)}</td></tr>))}</tbody></table></div></div>); }
function StockHistorialView() { const [movimientos, setMovimientos] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getStockMovimientos({}).then(r => setMovimientos(r.data.movimientos || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="stock-historial-view"><h2 className="text-2xl font-heading font-semibold">Historial de Stock</h2><div className="bg-white border border-border rounded-md overflow-hidden"><div className="overflow-x-auto max-h-[600px]"><table className="data-table"><thead className="sticky top-0 bg-white"><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th className="text-right">Cant.</th><th className="text-right">Anterior</th><th className="text-right">Nuevo</th><th>Usuario</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr> : movimientos.length === 0 ? <tr><td colSpan={7} className="text-center py-8">Sin movimientos</td></tr> : movimientos.map(m => (<tr key={m.id}><td className="text-sm whitespace-nowrap">{new Date(m.fecha).toLocaleString('es-PY')}</td><td className="font-medium">{m.producto_nombre}</td><td><span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : 'badge-warning'}`}>{m.tipo === 'entrada' ? '+' : '-'} {m.tipo}</span></td><td className="text-right font-mono">{m.cantidad}</td><td className="text-right font-mono text-muted-foreground">{m.stock_anterior}</td><td className="text-right font-mono font-medium">{m.stock_nuevo}</td><td className="text-sm">{m.usuario_email || '-'}</td></tr>))}</tbody></table></div></div></div>); }
function UsuariosView() { const [usuarios, setUsuarios] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getUsuarios().then(r => setUsuarios(r.data.usuarios || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="usuarios-view"><h2 className="text-2xl font-heading font-semibold">Usuarios</h2><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : usuarios.map(u => (<tr key={u.id}><td className="font-medium">{u.email}</td><td>{u.nombre || '-'}</td><td><span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span></td><td><span className={`badge ${u.activo !== false ? 'badge-success' : 'badge-danger'}`}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span></td></tr>))}</tbody></table></div></div>); }
function AuditoriaView() { const [registros, setRegistros] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getAuditoria({}).then(r => setRegistros(r.data.registros || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="auditoria-view"><h2 className="text-2xl font-heading font-semibold">Auditoría</h2><div className="bg-white border border-border rounded-md overflow-hidden"><div className="overflow-x-auto max-h-[600px]"><table className="data-table"><thead className="sticky top-0 bg-white"><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Detalle</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> : registros.map(r => (<tr key={r.id}><td className="text-sm whitespace-nowrap">{new Date(r.fecha).toLocaleString('es-PY')}</td><td className="font-medium">{r.usuario_email}</td><td><span className="badge bg-muted text-foreground">{r.accion}</span></td><td className="capitalize">{r.modulo}</td><td className="text-sm text-muted-foreground max-w-xs truncate">{JSON.stringify(r.detalle)}</td></tr>))}</tbody></table></div></div></div>); }

// Main App
function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({});

  useEffect(() => {
    api.getMe().then(res => setUser(res.data)).catch(() => setUser(null)).finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getDashboard(),
        api.getVentasPorPeriodo({ periodo: 'mes', limite: 12 }),
        api.getProductosMasVendidos({ limite: 10 }),
        api.getStockPorCategoria(),
        api.getVentasPorCliente({ limite: 8 })
      ]).then(([dash, vp, pmv, sc, vc]) => {
        setDashboardData(dash.data);
        setDashboardStats({
          ventasPeriodo: vp.data.data || [],
          productosMasVendidos: pmv.data.data || [],
          stockCategoria: sc.data.data || [],
          ventasCliente: vc.data.data || []
        });
      }).catch(console.error);
    }
  }, [user]);

  const handleLogout = async () => { try { await api.logout(); } catch {} setUser(null); setActiveView('dashboard'); };

  if (!authChecked) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 bg-[#E63946] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse"><span className="text-white font-heading font-bold text-2xl">pds</span></div><p className="text-muted-foreground">Cargando...</p></div></div>);
  if (!user) return <LoginPage onLogin={setUser} />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard data={dashboardData} stats={dashboardStats} />;
      case 'estadisticas': return <EstadisticasView />;
      case 'productos': return <ProductosView user={user} />;
      case 'ventas': return <VentasView />;
      case 'compras': return <ComprasView />;
      case 'clientes': return <ClientesView />;
      case 'proveedores': return <ProveedoresView />;
      case 'gastos': return <GastosView />;
      case 'reportes': return <ReportesView />;
      case 'stock-historial': return <StockHistorialView />;
      case 'usuarios': return <UsuariosView />;
      case 'auditoria': return <AuditoriaView />;
      default: return <Dashboard data={dashboardData} stats={dashboardStats} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="min-h-screen bg-background">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} onLogout={handleLogout} />
        <main className="ml-64 p-8">{renderView()}</main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
