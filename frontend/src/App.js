import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import './App.css';
import axios from 'axios';
import {
  House, Package, ShoppingCart, Receipt, Users, Truck, Money,
  MagnifyingGlass, Plus, Pencil, Trash, Warning, X, Check,
  SignOut, UserCircle, ShieldCheck, ClockCounterClockwise, FileText,
  Download, Lock, Eye, EyeSlash, UserGear, Gear, ChartLine, ChartBar,
  ChartPie, FilePdf, TrendUp, TrendDown, Target, Sliders, FloppyDisk,
  ArrowsOutCardinal, Layout, Rows, SquaresFour,
  ShareNetwork, Globe, LockSimple, UsersThree, Copy, BookmarkSimple,
  Camera, CalendarBlank, Funnel, Archive, LinkSimple
} from '@phosphor-icons/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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
const formatApiError = (d) => d == null ? "Error" : typeof d === "string" ? d : Array.isArray(d) ? d.map(e => e?.msg || JSON.stringify(e)).join(" ") : String(d);
const hasPermission = (user, modulo, accion = 'ver') => {
  if (user?.role === 'admin') return true;
  return user?.permisos?.[modulo]?.[accion] === true;
};

const COLORS = ['#E63946', '#457B9D', '#2A9D8F', '#E9C46A', '#F4A261', '#264653', '#A8DADC', '#6D6875'];

const api = {
  login: (d) => axios.post(`${API_URL}/api/auth/login`, d),
  logout: () => axios.post(`${API_URL}/api/auth/logout`),
  getMe: () => axios.get(`${API_URL}/api/auth/me`),
  getUsuarios: () => axios.get(`${API_URL}/api/usuarios`),
  createUsuario: (d) => axios.post(`${API_URL}/api/usuarios`, d),
  updateUsuario: (id, d) => axios.put(`${API_URL}/api/usuarios/${id}`, d),
  changePassword: (id, d) => axios.put(`${API_URL}/api/usuarios/${id}/password`, d),
  deleteUsuario: (id) => axios.delete(`${API_URL}/api/usuarios/${id}`),
  getDashboard: (p) => axios.get(`${API_URL}/api/dashboard`, { params: p }),
  getDashboardTemplates: () => axios.get(`${API_URL}/api/dashboard/templates`),
  getDashboardConfig: () => axios.get(`${API_URL}/api/dashboard/config`),
  saveDashboardConfig: (d) => axios.post(`${API_URL}/api/dashboard/config`, d),
  getMetas: () => axios.get(`${API_URL}/api/metas`),
  setMeta: (d) => axios.post(`${API_URL}/api/metas`, d),
  getMetasHistorial: () => axios.get(`${API_URL}/api/metas/historial`),
  getPlantillas: () => axios.get(`${API_URL}/api/plantillas`),
  crearPlantilla: (d) => axios.post(`${API_URL}/api/plantillas`, d),
  updatePlantilla: (id, d) => axios.put(`${API_URL}/api/plantillas/${id}`, d),
  deletePlantilla: (id) => axios.delete(`${API_URL}/api/plantillas/${id}`),
  aplicarPlantilla: (id) => axios.post(`${API_URL}/api/plantillas/${id}/aplicar`),
  getUsuariosLista: () => axios.get(`${API_URL}/api/usuarios/lista`),
  getPerfil: () => axios.get(`${API_URL}/api/perfil`),
  updatePerfil: (d) => axios.put(`${API_URL}/api/perfil`, d),
  changePassword: (d) => axios.put(`${API_URL}/api/perfil/password`, d),
  uploadFoto: (f) => { const fd = new FormData(); fd.append('foto', f); return axios.post(`${API_URL}/api/perfil/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  getProductoDetalle: (id, p) => axios.get(`${API_URL}/api/estadisticas/producto-detalle`, { params: { producto_id: id, ...p } }),
  getIngresosPorPeriodo: (p) => axios.get(`${API_URL}/api/estadisticas/ingresos-por-periodo`, { params: p }),
  getProductos: (p) => axios.get(`${API_URL}/api/productos`, { params: p }),
  createProducto: (d) => axios.post(`${API_URL}/api/productos`, d),
  updateProducto: (id, d) => axios.put(`${API_URL}/api/productos/${id}`, d),
  deleteProducto: (id) => axios.delete(`${API_URL}/api/productos/${id}`),
  ajustarStock: (id, d) => axios.post(`${API_URL}/api/productos/${id}/ajuste-stock`, d),
  getCategorias: () => axios.get(`${API_URL}/api/categorias`),
  getClientes: (p) => axios.get(`${API_URL}/api/clientes`, { params: p }),
  getClienteVentas: (id, p) => axios.get(`${API_URL}/api/clientes/${id}/ventas`, { params: p }),
  createCliente: (d) => axios.post(`${API_URL}/api/clientes`, d),
  updateCliente: (id, d) => axios.put(`${API_URL}/api/clientes/${id}`, d),
  deleteCliente: (id) => axios.delete(`${API_URL}/api/clientes/${id}`),
  getLeads: (p) => axios.get(`${API_URL}/api/leads`, { params: p }),
  createLead: (d) => axios.post(`${API_URL}/api/leads`, d),
  updateLead: (id, d) => axios.put(`${API_URL}/api/leads/${id}`, d),
  deleteLead: (id) => axios.delete(`${API_URL}/api/leads/${id}`),
  getProveedores: (p) => axios.get(`${API_URL}/api/proveedores`, { params: p }),
  getProveedorCompras: (id, p) => axios.get(`${API_URL}/api/proveedores/${id}/compras`, { params: p }),
  createProveedor: (d) => axios.post(`${API_URL}/api/proveedores`, d),
  updateProveedor: (id, d) => axios.put(`${API_URL}/api/proveedores/${id}`, d),
  deleteProveedor: (id) => axios.delete(`${API_URL}/api/proveedores/${id}`),
  getVentas: (p) => axios.get(`${API_URL}/api/ventas`, { params: p }),
  createVenta: (d) => axios.post(`${API_URL}/api/ventas`, d),
  getCompras: (p) => axios.get(`${API_URL}/api/compras`, { params: p }),
  createCompra: (d) => axios.post(`${API_URL}/api/compras`, d),
  getGastos: (p) => axios.get(`${API_URL}/api/gastos`, { params: p }),
  createGasto: (d) => axios.post(`${API_URL}/api/gastos`, d),
  getAuditoria: (p) => axios.get(`${API_URL}/api/auditoria`, { params: p }),
  getStockMovimientos: (p) => axios.get(`${API_URL}/api/stock-movimientos`, { params: p }),
  getVentasPorPeriodo: (p) => axios.get(`${API_URL}/api/estadisticas/ventas-por-periodo`, { params: p }),
  getComprasPorPeriodo: (p) => axios.get(`${API_URL}/api/estadisticas/compras-por-periodo`, { params: p }),
  getProductosMasVendidos: (p) => axios.get(`${API_URL}/api/estadisticas/productos-mas-vendidos`, { params: p }),
  getVentasPorCliente: (p) => axios.get(`${API_URL}/api/estadisticas/ventas-por-cliente`, { params: p }),
  getComprasPorProveedor: (p) => axios.get(`${API_URL}/api/estadisticas/compras-por-proveedor`, { params: p }),
  getStockPorCategoria: () => axios.get(`${API_URL}/api/estadisticas/stock-por-categoria`),
  getGastosPorCategoria: () => axios.get(`${API_URL}/api/estadisticas/gastos-por-categoria`),
  getResumenGeneral: (p) => axios.get(`${API_URL}/api/estadisticas/resumen-general`, { params: p }),
  seedData: () => axios.post(`${API_URL}/api/seed`),
  // Gastos - Additional
  updateGasto: (id, d) => axios.put(`${API_URL}/api/gastos/${id}`, d),
  deleteGasto: (id) => axios.delete(`${API_URL}/api/gastos/${id}`),
  getGastosCategorias: () => axios.get(`${API_URL}/api/gastos/categorias`),
  // Ventas - Additional
  getVenta: (id) => axios.get(`${API_URL}/api/ventas/${id}`),
  updateVenta: (id, d) => axios.put(`${API_URL}/api/ventas/${id}`, d),
  deleteVenta: (id) => axios.delete(`${API_URL}/api/ventas/${id}`),
  // Compras - Additional
  getCompra: (id) => axios.get(`${API_URL}/api/compras/${id}`),
  updateCompra: (id, d) => axios.put(`${API_URL}/api/compras/${id}`, d),
  deleteCompra: (id) => axios.delete(`${API_URL}/api/compras/${id}`),
  // Inventario
  getInventario: (p) => axios.get(`${API_URL}/api/inventario`, { params: p }),
  getInventarioDetalle: (id) => axios.get(`${API_URL}/api/inventario/${id}`),
  // Estadísticas adicionales
  getProductosMasRentables: (p) => axios.get(`${API_URL}/api/estadisticas/productos-mas-rentables`, { params: p }),
  getProductosSinMovimiento: (p) => axios.get(`${API_URL}/api/estadisticas/productos-sin-movimiento`, { params: p }),
  getRotacionStock: (p) => axios.get(`${API_URL}/api/estadisticas/rotacion-stock`, { params: p }),
  getClientesTop: (p) => axios.get(`${API_URL}/api/estadisticas/clientes-top`, { params: p })
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
    try { const { data } = await api.login({ email, password }); onLogin(data); }
    catch (err) { setError(formatApiError(err.response?.data?.detail) || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#E63946] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-heading font-bold text-3xl">pds</span>
          </div>
        </div>
        <h1 className="text-2xl font-heading font-semibold text-center mb-2">Bienvenido</h1>
        <p className="text-center text-muted-foreground mb-8">Sistema de Gestión PDS</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" required data-testid="login-email" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-input pr-10" required data-testid="login-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#E63946] text-white py-3 rounded-lg font-medium hover:bg-[#D90429] disabled:opacity-50" data-testid="login-submit">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Sidebar
function Sidebar({ activeView, setActiveView, user, onLogout, onNavigate }) {
  const isAdmin = user?.role === 'admin';
  const check = (m) => isAdmin || user?.permisos?.[m]?.ver;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House, visible: true },
    { id: 'estadisticas', label: 'Estadísticas', icon: ChartLine, visible: check('estadisticas') },
    { id: 'productos', label: 'Productos', icon: Package, visible: check('productos') },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart, visible: check('ventas') },
    { id: 'compras', label: 'Compras', icon: Receipt, visible: check('compras') },
    { id: 'clientes', label: 'Clientes', icon: Users, visible: check('clientes') },
    { id: 'leads', label: 'Leads', icon: Funnel, visible: check('clientes') || isAdmin },
    { id: 'proveedores', label: 'Proveedores', icon: Truck, visible: check('proveedores') },
    { id: 'gastos', label: 'Gastos', icon: Money, visible: check('gastos') },
    { id: 'inventario', label: 'Inventario', icon: Archive, visible: check('inventario') },
    { id: 'reportes', label: 'Reportes', icon: FileText, visible: check('reportes') },
    { id: 'stock-historial', label: 'Historial Stock', icon: ClockCounterClockwise, visible: check('stock_historial') },
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
          <div><h1 className="font-heading font-semibold">PDS</h1><p className="text-xs text-muted-foreground">Gestión Integral</p></div>
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
            <div className="pt-4 pb-2"><p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p></div>
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
        <button onClick={() => onNavigate('perfil')} className="flex items-center gap-3 mb-3 w-full hover:bg-muted rounded-lg p-2 cursor-pointer" data-testid="sidebar-perfil-btn">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {user?.foto_url ? <img src={user.foto_url} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} className="text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0 text-left"><p className="font-medium text-sm truncate">{user?.nombre || user?.email}</p><p className="text-xs text-muted-foreground capitalize">{user?.role}</p></div>
        </button>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg" data-testid="logout-btn">
          <SignOut size={18} /><span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

// Modal
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl' };
  return (
    <div className="modal-overlay flex items-center justify-center" onClick={onClose}>
      <div className={`modal-content ${sizes[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((e, i) => (<p key={i} className="text-sm" style={{ color: e.color }}>{e.name}: {formatGs(e.value)}</p>))}
      </div>
    );
  }
  return null;
};

// Widget Components
function WidgetStatCard({ label, value, icon: Icon, color = 'primary', subtext }) {
  const colors = { primary: 'text-[#E63946]', success: 'text-green-600', warning: 'text-yellow-600', danger: 'text-red-600', blue: 'text-blue-600' };
  return (
    <div className="h-full flex flex-col justify-center p-4 bg-white rounded-lg border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label text-xs">{label}</p>
          <p className={`text-xl font-semibold mt-1 ${colors[color]}`}>{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        {Icon && <div className={`p-2 rounded-lg bg-muted ${colors[color]}`}><Icon size={20} weight="duotone" /></div>}
      </div>
    </div>
  );
}

function WidgetMetas({ metas, isAdmin, onSetMeta }) {
  const [showModal, setShowModal] = useState(false);
  const [metaVentas, setMetaVentas] = useState(metas?.meta_ventas || 0);

  const handleSave = async () => {
    await onSetMeta({ periodo: metas?.periodo, meta_ventas: metaVentas });
    setShowModal(false);
  };

  if (!metas) return <div className="h-full flex items-center justify-center text-muted-foreground">Cargando...</div>;

  const porcentaje = metas.porcentaje_ventas || 0;
  const colorBarra = porcentaje >= 100 ? '#2A9D8F' : porcentaje >= 70 ? '#E9C46A' : '#E63946';

  return (
    <div className="h-full p-4 bg-white rounded-lg border border-border flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-[#E63946]" weight="duotone" />
          <span className="font-semibold text-sm">Meta del Mes</span>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="p-1 hover:bg-muted rounded"><Gear size={16} /></button>
        )}
      </div>
      
      {metas.tiene_meta ? (
        <>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-semibold">{porcentaje.toFixed(0)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, porcentaje)}%`, backgroundColor: colorBarra }}></div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actual:</span>
                <span className="font-medium">{formatGs(metas.actual_ventas)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Meta:</span>
                <span className="font-medium">{formatGs(metas.meta_ventas)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Faltan:</span>
                <span className={`font-medium ${metas.meta_ventas - metas.actual_ventas <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatGs(Math.max(0, metas.meta_ventas - metas.actual_ventas))}
                </span>
              </div>
            </div>
          </div>
          {porcentaje >= 100 && (
            <div className="mt-2 bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded text-center">
              ¡Meta cumplida!
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Target size={40} className="text-gray-300 mb-2" />
          <p className="text-sm text-muted-foreground">Sin meta definida</p>
          {isAdmin && <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-[#E63946] hover:underline">Definir meta</button>}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Definir Meta de Ventas" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Período: {metas?.periodo}</p>
          <div className="form-group">
            <label className="form-label">Meta de Ventas (Gs.)</label>
            <input type="number" value={metaVentas} onChange={(e) => setMetaVentas(parseFloat(e.target.value) || 0)} className="form-input" min="0" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function WidgetChart({ type, data, title, dataKey, nameKey, colors }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full p-4 bg-white rounded-lg border border-border flex flex-col">
        <h4 className="font-semibold text-sm mb-2">{title}</h4>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 bg-white rounded-lg border border-border flex flex-col">
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#2A9D8F" fill="#2A9D8F" fillOpacity={0.3} />
              <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#E63946" fill="#E63946" fillOpacity={0.3} />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} name="Total" fill={colors?.[0] || "#E63946"} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : type === 'bar-horizontal' ? (
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={formatGsShort} />
              <YAxis type="category" dataKey={nameKey} width={100} tick={{ fontSize: 8 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} name="Total" fill={colors?.[0] || "#E63946"} radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius="80%" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(v) => formatGs(v)} />
              <Legend wrapperStyle={{ fontSize: '9px' }} />
            </PieChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WidgetTable({ title, data, columns }) {
  return (
    <div className="h-full p-4 bg-white rounded-lg border border-border flex flex-col">
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b">{columns.map((c, i) => <th key={i} className={`py-1 px-2 text-left text-xs ${c.align || ''}`}>{c.label}</th>)}</tr></thead>
          <tbody>
            {data?.length > 0 ? data.slice(0, 5).map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                {columns.map((c, j) => <td key={j} className={`py-1 px-2 ${c.align || ''}`}>{c.format ? c.format(r[c.key]) : r[c.key]}</td>)}
              </tr>
            )) : <tr><td colSpan={columns.length} className="text-center py-4 text-muted-foreground">Sin datos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WidgetAlertaStock({ bajoStock }) {
  if (!bajoStock || bajoStock.length === 0) {
    return (
      <div className="h-full p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-center">
        <Check size={20} className="text-green-600 mr-2" />
        <span className="text-green-700 font-medium text-sm">Todos los productos tienen stock suficiente</span>
      </div>
    );
  }

  return (
    <div className="h-full p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Warning size={18} className="text-yellow-600" weight="fill" />
        <span className="font-semibold text-sm text-yellow-800">Productos con Bajo Stock ({bajoStock.length})</span>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {bajoStock.slice(0, 8).map((p, i) => (
            <div key={i} className="bg-white border border-yellow-200 rounded px-2 py-1">
              <p className="text-xs font-medium truncate">{p.nombre}</p>
              <p className="text-xs text-muted-foreground">Stock: <span className="text-red-600 font-semibold">{p.stock}</span>/{p.stock_minimo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Widget Definitions
const WIDGET_DEFINITIONS = {
  'stat-ventas': { label: 'Total Ventas', category: 'stat', minW: 2, minH: 2 },
  'stat-compras': { label: 'Total Compras', category: 'stat', minW: 2, minH: 2 },
  'stat-utilidad': { label: 'Utilidad', category: 'stat', minW: 2, minH: 2 },
  'stat-gastos': { label: 'Total Gastos', category: 'stat', minW: 2, minH: 2 },
  'stat-productos': { label: 'Productos', category: 'stat', minW: 2, minH: 2 },
  'stat-stock-valor': { label: 'Valor Stock', category: 'stat', minW: 2, minH: 2 },
  'stat-sin-stock': { label: 'Sin Stock', category: 'stat', minW: 2, minH: 2 },
  'stat-bajo-minimo': { label: 'Bajo Mínimo', category: 'stat', minW: 2, minH: 2 },
  'meta-ventas': { label: 'Meta de Ventas', category: 'meta', minW: 3, minH: 3 },
  'chart-ventas-periodo': { label: 'Ventas por Período', category: 'chart', minW: 4, minH: 3 },
  'chart-compras-periodo': { label: 'Compras por Período', category: 'chart', minW: 4, minH: 3 },
  'chart-top-productos': { label: 'Top Productos', category: 'chart', minW: 4, minH: 3 },
  'chart-top-clientes': { label: 'Top Clientes', category: 'chart', minW: 4, minH: 3 },
  'chart-stock-categoria': { label: 'Stock por Categoría', category: 'chart', minW: 4, minH: 3 },
  'chart-gastos-categoria': { label: 'Gastos por Categoría', category: 'chart', minW: 4, minH: 3 },
  'chart-compras-proveedor': { label: 'Compras por Proveedor', category: 'chart', minW: 4, minH: 3 },
  'table-top-productos': { label: 'Tabla Top Productos', category: 'table', minW: 4, minH: 3 },
  'table-top-clientes': { label: 'Tabla Top Clientes', category: 'table', minW: 4, minH: 3 },
  'alerta-stock': { label: 'Alertas de Stock', category: 'alert', minW: 6, minH: 2 },
};

// ==================== PERFIL VIEW ====================
function PerfilView({ user, onProfileUpdate }) {
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({ password_actual: '', password_nueva: '', password_confirmar: '' });
  const [saving, setSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    api.getPerfil().then(r => {
      setPerfil(r.data);
      setForm({ nombre: r.data.nombre || '', telefono: r.data.telefono || '', direccion: r.data.direccion || '', ciudad: r.data.ciudad || '' });
    });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true); setProfileMsg('');
    try {
      await api.updatePerfil(form);
      setProfileMsg('Perfil actualizado');
      if (onProfileUpdate) onProfileUpdate();
    } catch (e) { setProfileMsg(formatApiError(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPassMsg('');
    if (passForm.password_nueva !== passForm.password_confirmar) return setPassMsg('Las contraseñas no coinciden');
    if (passForm.password_nueva.length < 4) return setPassMsg('Mínimo 4 caracteres');
    setSaving(true);
    try {
      await api.changePassword({ password_actual: passForm.password_actual, password_nueva: passForm.password_nueva });
      setPassMsg('Contraseña actualizada');
      setPassForm({ password_actual: '', password_nueva: '', password_confirmar: '' });
    } catch (e) { setPassMsg(formatApiError(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFoto(file);
      setPerfil({ ...perfil, foto_url: res.data.foto_url });
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) { alert(formatApiError(err.response?.data?.detail)); }
  };

  if (!perfil) return <div className="p-8 text-center">Cargando perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="perfil-view">
      <h2 className="text-2xl font-heading font-semibold">Mi Perfil</h2>

      {/* Foto + Info */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
              {perfil.foto_url ? <img src={perfil.foto_url} alt="" className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-muted-foreground" />}
            </div>
            <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera size={24} className="text-white" />
              <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" data-testid="foto-upload" />
            </label>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{perfil.nombre || perfil.email}</h3>
            <p className="text-muted-foreground text-sm">{perfil.email}</p>
            <span className="badge bg-purple-100 text-purple-800 capitalize mt-1 inline-block">{perfil.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Nombre</label><input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="form-input" data-testid="perfil-nombre" /></div>
          <div className="form-group"><label className="form-label">Teléfono</label><input type="text" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="form-input" data-testid="perfil-telefono" /></div>
          <div className="form-group"><label className="form-label">Ciudad</label><input type="text" value={form.ciudad} onChange={(e) => setForm({...form, ciudad: e.target.value})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Dirección</label><input type="text" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} className="form-input" /></div>
        </div>
        {profileMsg && <p className={`text-sm mt-2 ${profileMsg.includes('actualizado') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>}
        <button onClick={handleSaveProfile} disabled={saving} className="mt-4 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] disabled:opacity-50" data-testid="save-perfil-btn">
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Cambiar Contraseña</h3>
        <div className="space-y-4 max-w-md">
          <div className="form-group"><label className="form-label">Contraseña actual</label><input type="password" value={passForm.password_actual} onChange={(e) => setPassForm({...passForm, password_actual: e.target.value})} className="form-input" data-testid="pass-actual" /></div>
          <div className="form-group"><label className="form-label">Nueva contraseña</label><input type="password" value={passForm.password_nueva} onChange={(e) => setPassForm({...passForm, password_nueva: e.target.value})} className="form-input" data-testid="pass-nueva" /></div>
          <div className="form-group"><label className="form-label">Confirmar nueva contraseña</label><input type="password" value={passForm.password_confirmar} onChange={(e) => setPassForm({...passForm, password_confirmar: e.target.value})} className="form-input" data-testid="pass-confirmar" /></div>
        </div>
        {passMsg && <p className={`text-sm mt-2 ${passMsg.includes('actualizada') ? 'text-green-600' : 'text-red-600'}`}>{passMsg}</p>}
        <button onClick={handleChangePassword} disabled={saving || !passForm.password_actual || !passForm.password_nueva} className="mt-4 bg-[#457B9D] text-white px-4 py-2 rounded-md hover:bg-[#3A6A8A] disabled:opacity-50" data-testid="change-pass-btn">
          Cambiar Contraseña
        </button>
      </div>
    </div>
  );
}

// User Selector for sharing
function UserSelector({ selectedUsers, onChange }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getUsuariosLista().then(r => { setUsuarios(r.data.usuarios || []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <p className="text-sm text-muted-foreground">Cargando usuarios...</p>;
  if (usuarios.length === 0) return <p className="text-sm text-muted-foreground">No hay otros usuarios registrados</p>;
  return (
    <div className="space-y-2">
      <label className="form-label">Seleccionar usuarios</label>
      <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y">
        {usuarios.map(u => (
          <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
            <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={(e) => {
              onChange(e.target.checked ? [...selectedUsers, u.id] : selectedUsers.filter(id => id !== u.id));
            }} />
            <div><p className="text-sm font-medium">{u.nombre}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Dashboard View with Widgets
function DashboardView({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({});
  const [metas, setMetas] = useState(null);
  const [templates, setTemplates] = useState({});
  const [layout, setLayout] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState('ejecutivo');
  const [isCustom, setIsCustom] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showSavePlantillaModal, setShowSavePlantillaModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [saving, setSaving] = useState(false);
  const [plantillaForm, setPlantillaForm] = useState({ nombre: '', descripcion: '', compartir: 'privada', usuarios_compartidos: [] });
  const [dashFechaDesde, setDashFechaDesde] = useState('');
  const [dashFechaHasta, setDashFechaHasta] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadData = useCallback(async () => {
    try {
      const dashParams = {};
      if (dashFechaDesde) dashParams.fecha_desde = dashFechaDesde;
      if (dashFechaHasta) dashParams.fecha_hasta = dashFechaHasta;
      const [dashRes, templatesRes, configRes, ventasP, comprasP, prodVend, ventasC, stockCat, gastosCat, comprasProv, metasRes, plantillasRes] = await Promise.all([
        api.getDashboard(dashParams),
        api.getDashboardTemplates(),
        api.getDashboardConfig(),
        api.getVentasPorPeriodo({ periodo: 'mes', limite: 12 }),
        api.getComprasPorPeriodo({ periodo: 'mes', limite: 12 }),
        api.getProductosMasVendidos({ limite: 10 }),
        api.getVentasPorCliente({ limite: 8 }),
        api.getStockPorCategoria(),
        api.getGastosPorCategoria(),
        api.getComprasPorProveedor({ limite: 8 }),
        api.getMetas(),
        api.getPlantillas()
      ]);

      setDashboardData(dashRes.data);
      setTemplates(templatesRes.data.templates);
      setMetas(metasRes.data);
      setPlantillas(plantillasRes.data.plantillas || []);
      setStats({
        ventasPeriodo: ventasP.data.data || [],
        comprasPeriodo: comprasP.data.data || [],
        productosMasVendidos: prodVend.data.data || [],
        ventasCliente: ventasC.data.data || [],
        stockCategoria: stockCat.data.data || [],
        gastosCategoria: gastosCat.data.data || [],
        comprasProveedor: comprasProv.data.data || []
      });

      setLayout(configRes.data.layout || []);
      setCurrentTemplate(configRes.data.template || 'ejecutivo');
      setIsCustom(configRes.data.custom || false);
    } catch (e) { console.error(e); }
  }, [dashFechaDesde, dashFechaHasta]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetMeta = async (data) => {
    await api.setMeta(data);
    const metasRes = await api.getMetas();
    setMetas(metasRes.data);
  };

  const handleLayoutChange = (newLayout) => {
    if (editMode) {
      setLayout(newLayout);
      setIsCustom(true);
    }
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      await api.saveDashboardConfig({ template: currentTemplate, layout, custom: isCustom });
      setEditMode(false);
    } catch (e) { alert('Error al guardar'); }
    finally { setSaving(false); }
  };

  const applyTemplate = (templateKey) => {
    const template = templates[templateKey];
    if (template) {
      setLayout(template.widgets);
      setCurrentTemplate(templateKey);
      setIsCustom(false);
      setShowTemplateModal(false);
      // Auto-save
      api.saveDashboardConfig({ template: templateKey, layout: template.widgets, custom: false });
    }
  };

  const handleSavePlantilla = async () => {
    if (!plantillaForm.nombre.trim()) return alert('Ingrese un nombre');
    setSaving(true);
    try {
      await api.crearPlantilla({
        nombre: plantillaForm.nombre,
        descripcion: plantillaForm.descripcion,
        layout: layout,
        compartir: plantillaForm.compartir,
        usuarios_compartidos: plantillaForm.usuarios_compartidos
      });
      setShowSavePlantillaModal(false);
      setPlantillaForm({ nombre: '', descripcion: '', compartir: 'privada', usuarios_compartidos: [] });
      const res = await api.getPlantillas();
      setPlantillas(res.data.plantillas || []);
    } catch (e) { alert('Error al guardar plantilla'); }
    finally { setSaving(false); }
  };

  const handleAplicarPlantilla = async (plantillaId) => {
    try {
      const res = await api.aplicarPlantilla(plantillaId);
      setLayout(res.data.layout);
      setCurrentTemplate('personalizado');
      setIsCustom(true);
      setShowTemplateModal(false);
    } catch (e) { alert('Error al aplicar plantilla'); }
  };

  const handleDeletePlantilla = async (plantillaId) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return;
    try {
      await api.deletePlantilla(plantillaId);
      const res = await api.getPlantillas();
      setPlantillas(res.data.plantillas || []);
    } catch (e) { alert('Error al eliminar'); }
  };

  const openShareModal = async (plantilla) => {
    setShowShareModal(plantilla);
    try {
      const res = await api.getUsuariosLista();
      setUsuariosLista(res.data.usuarios || []);
    } catch (e) { console.error(e); }
  };

  const handleUpdateShare = async () => {
    if (!showShareModal) return;
    try {
      await api.updatePlantilla(showShareModal.id, {
        compartir: showShareModal.compartir,
        usuarios_compartidos: showShareModal.usuarios_compartidos || []
      });
      setShowShareModal(null);
      const res = await api.getPlantillas();
      setPlantillas(res.data.plantillas || []);
    } catch (e) { alert('Error al actualizar'); }
  };

  const addWidget = (widgetId) => {
    const def = WIDGET_DEFINITIONS[widgetId];
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    setLayout([...layout, { i: widgetId, x: 0, y: maxY, w: def.minW + 2, h: def.minH }]);
    setIsCustom(true);
    setShowAddWidgetModal(false);
  };

  const removeWidget = (widgetId) => {
    setLayout(layout.filter(l => l.i !== widgetId));
    setIsCustom(true);
  };

  const renderWidget = (widgetId) => {
    const { resumen, top_productos, top_clientes, bajo_stock } = dashboardData || {};

    switch (widgetId) {
      case 'stat-ventas': return <WidgetStatCard label="Total Ventas" value={formatGs(resumen?.total_ventas)} icon={ShoppingCart} color="success" subtext={`${resumen?.cantidad_ventas || 0} ventas`} />;
      case 'stat-compras': return <WidgetStatCard label="Total Compras" value={formatGs(resumen?.total_compras)} icon={Receipt} color="primary" subtext={`${resumen?.cantidad_compras || 0} compras`} />;
      case 'stat-utilidad': return <WidgetStatCard label="Utilidad Bruta" value={formatGs(resumen?.utilidad_bruta)} icon={TrendUp} color="success" subtext={resumen?.utilidad_neta !== undefined ? `Neta: ${formatGs(resumen.utilidad_neta)}` : undefined} />;
      case 'stat-gastos': return <WidgetStatCard label="Total Gastos" value={formatGs(resumen?.total_gastos)} icon={Money} color="warning" />;
      case 'stat-productos': return <WidgetStatCard label="Productos" value={resumen?.total_productos} icon={Package} color="blue" />;
      case 'stat-stock-valor': return <WidgetStatCard label="Valor Stock" value={formatGs(resumen?.valor_stock_venta)} icon={Package} color="blue" />;
      case 'stat-sin-stock': return <WidgetStatCard label="Sin Stock" value={resumen?.productos_sin_stock} icon={Warning} color={resumen?.productos_sin_stock > 0 ? 'danger' : 'success'} />;
      case 'stat-bajo-minimo': return <WidgetStatCard label="Bajo Mínimo" value={resumen?.productos_bajo_minimo} icon={Warning} color={resumen?.productos_bajo_minimo > 0 ? 'warning' : 'success'} />;
      case 'meta-ventas': return <WidgetMetas metas={metas} isAdmin={isAdmin} onSetMeta={handleSetMeta} />;
      case 'chart-ventas-periodo': return <WidgetChart type="area" data={stats.ventasPeriodo} title="Ventas y Utilidad por Mes" nameKey="periodo" />;
      case 'chart-compras-periodo': return <WidgetChart type="bar" data={stats.comprasPeriodo} title="Compras por Mes" dataKey="total" nameKey="periodo" colors={['#457B9D']} />;
      case 'chart-top-productos': return <WidgetChart type="bar-horizontal" data={stats.productosMasVendidos} title="Top Productos Vendidos" dataKey="total" nameKey="nombre" colors={['#E63946']} />;
      case 'chart-top-clientes': return <WidgetChart type="bar" data={stats.ventasCliente} title="Ventas por Cliente" dataKey="total_compras" nameKey="nombre" colors={['#2A9D8F']} />;
      case 'chart-stock-categoria': return <WidgetChart type="pie" data={stats.stockCategoria?.slice(0, 8)} title="Stock por Categoría" dataKey="valor_venta" nameKey="categoria" />;
      case 'chart-gastos-categoria': return <WidgetChart type="pie" data={stats.gastosCategoria} title="Gastos por Categoría" dataKey="total" nameKey="categoria" />;
      case 'chart-compras-proveedor': return <WidgetChart type="bar" data={stats.comprasProveedor} title="Compras por Proveedor" dataKey="total" nameKey="nombre" colors={['#F4A261']} />;
      case 'table-top-productos': return <WidgetTable title="Top Productos" data={top_productos} columns={[{ key: 'nombre', label: 'Producto' }, { key: 'cantidad', label: 'Cant.', align: 'text-right' }, { key: 'total', label: 'Total', align: 'text-right', format: formatGs }]} />;
      case 'table-top-clientes': return <WidgetTable title="Top Clientes" data={top_clientes} columns={[{ key: 'nombre', label: 'Cliente' }, { key: 'cantidad_compras', label: 'Compras', align: 'text-right' }, { key: 'total_compras', label: 'Total', align: 'text-right', format: formatGs }]} />;
      case 'alerta-stock': return <WidgetAlertaStock bajoStock={bajo_stock} />;
      default: return <div className="h-full flex items-center justify-center bg-white rounded-lg border">Widget: {widgetId}</div>;
    }
  };

  if (!dashboardData) return <div className="p-8 text-center text-muted-foreground">Cargando dashboard...</div>;

  const widgetsInLayout = layout.map(l => l.i);
  const availableWidgets = Object.keys(WIDGET_DEFINITIONS).filter(w => !widgetsInLayout.includes(w));

  const shareIcon = (compartir) => {
    if (compartir === 'todos') return <Globe size={14} className="text-green-600" />;
    if (compartir === 'usuarios') return <UsersThree size={14} className="text-blue-600" />;
    return <LockSimple size={14} className="text-gray-500" />;
  };

  const shareLabel = (compartir) => {
    if (compartir === 'todos') return 'Todos';
    if (compartir === 'usuarios') return 'Usuarios';
    return 'Privada';
  };

  return (
    <div className="space-y-4" data-testid="dashboard-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {isCustom ? 'Personalizado' : `Plantilla: ${templates[currentTemplate]?.nombre || currentTemplate}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={() => setShowAddWidgetModal(true)} className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted text-sm" data-testid="add-widget-btn">
                <Plus size={16} /> Widget
              </button>
              <button onClick={() => { setPlantillaForm({ nombre: '', descripcion: '', compartir: 'privada', usuarios_compartidos: [] }); setShowSavePlantillaModal(true); }} className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 text-sm" data-testid="save-as-template-btn">
                <BookmarkSimple size={16} /> Guardar como Plantilla
              </button>
              <button onClick={handleSaveLayout} disabled={saving} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm" data-testid="save-layout-btn">
                <FloppyDisk size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditMode(false); loadData(); }} className="px-3 py-2 border border-border rounded-md hover:bg-muted text-sm" data-testid="cancel-edit-btn">
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted text-sm" data-testid="templates-btn">
                <Layout size={16} /> Plantillas
              </button>
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-3 py-2 bg-[#E63946] text-white rounded-md hover:bg-[#D90429] text-sm" data-testid="customize-btn">
                <Sliders size={16} /> Personalizar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Date filter */}
      {!editMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5">
            <CalendarBlank size={16} className="text-muted-foreground" />
            <input type="date" value={dashFechaDesde} onChange={(e) => setDashFechaDesde(e.target.value)} className="text-sm border-0 focus:ring-0 p-0 w-32 bg-transparent" placeholder="Desde" />
            <span className="text-muted-foreground text-sm">-</span>
            <input type="date" value={dashFechaHasta} onChange={(e) => setDashFechaHasta(e.target.value)} className="text-sm border-0 focus:ring-0 p-0 w-32 bg-transparent" placeholder="Hasta" />
            {(dashFechaDesde || dashFechaHasta) && (
              <button onClick={() => { setDashFechaDesde(''); setDashFechaHasta(''); }} className="text-red-500 hover:text-red-700"><X size={14} /></button>
            )}
          </div>
          {(dashFechaDesde || dashFechaHasta) && <span className="text-xs text-muted-foreground">Filtrando ventas/compras/gastos por fecha</span>}
        </div>
      )}

      {editMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <ArrowsOutCardinal size={16} className="inline mr-2" />
          <strong>Modo edición:</strong> Arrastra y redimensiona los widgets. Haz clic en la X para eliminar. Usa "Guardar como Plantilla" para compartir tu layout.
        </div>
      )}

      {/* Grid */}
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".widget-drag-handle"
      >
        {layout.map((item) => (
          <div key={item.i} className="relative">
            {editMode && (
              <>
                <div className="widget-drag-handle absolute top-0 left-0 right-8 h-8 cursor-move z-10"></div>
                <button onClick={() => removeWidget(item.i)} className="absolute top-1 right-1 z-20 p-1 bg-red-500 text-white rounded hover:bg-red-600" data-testid={`remove-widget-${item.i}`}>
                  <X size={12} />
                </button>
              </>
            )}
            {renderWidget(item.i)}
          </div>
        ))}
      </GridLayout>

      {/* Templates Modal - Now includes shared templates */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Plantillas de Dashboard" size="xl">
        <div className="space-y-6">
          {/* Predefined templates */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Plantillas del Sistema</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  data-testid={`template-${key}`}
                  className={`p-4 border rounded-lg text-left hover:border-[#E63946] transition-colors ${currentTemplate === key && !isCustom ? 'border-[#E63946] bg-red-50' : 'border-border'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {key === 'ejecutivo' && <House size={18} className="text-[#E63946]" />}
                    {key === 'ventas' && <ShoppingCart size={18} className="text-green-600" />}
                    {key === 'inventario' && <Package size={18} className="text-blue-600" />}
                    {key === 'analitico' && <ChartBar size={18} className="text-purple-600" />}
                    <span className="font-semibold text-sm">{template.nombre}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.widgets.length} widgets</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom/Shared templates */}
          {plantillas.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Plantillas Personalizadas</h4>
              <div className="space-y-2">
                {plantillas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50" data-testid={`plantilla-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.nombre}</span>
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                          {shareIcon(p.compartir)} {shareLabel(p.compartir)}
                        </span>
                        {!p.es_propia && <span className="text-xs text-muted-foreground">por {p.creador_nombre}</span>}
                      </div>
                      {p.descripcion && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.descripcion}</p>}
                      <p className="text-xs text-muted-foreground">{p.widgets_count} widgets</p>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <button onClick={() => handleAplicarPlantilla(p.id)} className="px-3 py-1.5 bg-[#E63946] text-white text-xs rounded-md hover:bg-[#D90429]" data-testid={`apply-plantilla-${p.id}`}>
                        <Copy size={12} className="inline mr-1" /> Aplicar
                      </button>
                      {p.es_propia && (
                        <>
                          <button onClick={() => openShareModal({...p})} className="p-1.5 border border-border rounded-md hover:bg-blue-50 text-blue-600" data-testid={`share-plantilla-${p.id}`}>
                            <ShareNetwork size={14} />
                          </button>
                          <button onClick={() => handleDeletePlantilla(p.id)} className="p-1.5 border border-border rounded-md hover:bg-red-50 text-red-600" data-testid={`delete-plantilla-${p.id}`}>
                            <Trash size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Save as Template Modal */}
      <Modal isOpen={showSavePlantillaModal} onClose={() => setShowSavePlantillaModal(false)} title="Guardar como Plantilla" size="md">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre de la plantilla *</label>
            <input type="text" value={plantillaForm.nombre} onChange={(e) => setPlantillaForm({...plantillaForm, nombre: e.target.value})} className="form-input" placeholder="Ej: Mi Dashboard de Ventas" data-testid="plantilla-nombre-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción (opcional)</label>
            <input type="text" value={plantillaForm.descripcion} onChange={(e) => setPlantillaForm({...plantillaForm, descripcion: e.target.value})} className="form-input" placeholder="Descripción breve..." data-testid="plantilla-desc-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Visibilidad</label>
            <div className="space-y-2 mt-1">
              {[
                { value: 'privada', label: 'Privada', desc: 'Solo visible para ti', icon: LockSimple, color: 'text-gray-600' },
                { value: 'usuarios', label: 'Usuarios específicos', desc: 'Compartir con usuarios seleccionados', icon: UsersThree, color: 'text-blue-600' },
                { value: 'todos', label: 'Todos los usuarios', desc: 'Visible para todo el equipo', icon: Globe, color: 'text-green-600' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${plantillaForm.compartir === opt.value ? 'border-[#E63946] bg-red-50' : 'border-border hover:bg-muted/50'}`} data-testid={`share-option-${opt.value}`}>
                  <input type="radio" name="compartir" value={opt.value} checked={plantillaForm.compartir === opt.value} onChange={(e) => setPlantillaForm({...plantillaForm, compartir: e.target.value, usuarios_compartidos: []})} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <opt.icon size={16} className={opt.color} weight="duotone" />
                      <span className="font-medium text-sm">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {plantillaForm.compartir === 'usuarios' && (
            <UserSelector
              selectedUsers={plantillaForm.usuarios_compartidos}
              onChange={(ids) => setPlantillaForm({...plantillaForm, usuarios_compartidos: ids})}
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowSavePlantillaModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSavePlantilla} disabled={saving || !plantillaForm.nombre.trim()} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] disabled:opacity-50" data-testid="save-plantilla-btn">
              {saving ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Settings Modal */}
      <Modal isOpen={!!showShareModal} onClose={() => setShowShareModal(null)} title={`Compartir: ${showShareModal?.nombre || ''}`} size="md">
        {showShareModal && (
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Visibilidad</label>
              <div className="space-y-2 mt-1">
                {[
                  { value: 'privada', label: 'Privada', icon: LockSimple, color: 'text-gray-600' },
                  { value: 'usuarios', label: 'Usuarios específicos', icon: UsersThree, color: 'text-blue-600' },
                  { value: 'todos', label: 'Todos los usuarios', icon: Globe, color: 'text-green-600' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${showShareModal.compartir === opt.value ? 'border-[#E63946] bg-red-50' : 'border-border hover:bg-muted/50'}`}>
                    <input type="radio" name="share-compartir" value={opt.value} checked={showShareModal.compartir === opt.value}
                      onChange={(e) => setShowShareModal({...showShareModal, compartir: e.target.value, usuarios_compartidos: e.target.value === 'usuarios' ? showShareModal.usuarios_compartidos : []})} />
                    <opt.icon size={16} className={opt.color} weight="duotone" />
                    <span className="font-medium text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {showShareModal.compartir === 'usuarios' && (
              <div className="space-y-2">
                <label className="form-label">Seleccionar usuarios</label>
                {usuariosLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay otros usuarios registrados</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y">
                    {usuariosLista.map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                        <input type="checkbox" checked={(showShareModal.usuarios_compartidos || []).includes(u.id)}
                          onChange={(e) => {
                            const ids = showShareModal.usuarios_compartidos || [];
                            setShowShareModal({
                              ...showShareModal,
                              usuarios_compartidos: e.target.checked ? [...ids, u.id] : ids.filter(id => id !== u.id)
                            });
                          }} />
                        <div>
                          <p className="text-sm font-medium">{u.nombre}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowShareModal(null)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={handleUpdateShare} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="update-share-btn">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Widget Modal */}
      <Modal isOpen={showAddWidgetModal} onClose={() => setShowAddWidgetModal(false)} title="Agregar Widget" size="lg">
        <div className="space-y-4">
          {['stat', 'meta', 'chart', 'table', 'alert'].map((category) => {
            const widgets = availableWidgets.filter(w => WIDGET_DEFINITIONS[w].category === category);
            if (widgets.length === 0) return null;
            return (
              <div key={category}>
                <h4 className="font-semibold text-sm mb-2 capitalize">{category === 'stat' ? 'Indicadores' : category === 'meta' ? 'Metas' : category === 'chart' ? 'Gráficos' : category === 'table' ? 'Tablas' : 'Alertas'}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {widgets.map((widgetId) => (
                    <button
                      key={widgetId}
                      onClick={() => addWidget(widgetId)}
                      className="p-3 border border-border rounded-lg hover:border-[#E63946] hover:bg-red-50 text-left"
                      data-testid={`add-widget-option-${widgetId}`}
                    >
                      <span className="text-sm font-medium">{WIDGET_DEFINITIONS[widgetId].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {availableWidgets.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Todos los widgets ya están en el dashboard</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

// Other Views (simplified)
function EstadisticasView() {
  const [periodo, setPeriodo] = useState('mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [productoStats, setProductoStats] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [productosRentables, setProductosRentables] = useState([]);
  const [productosSinMovimiento, setProductosSinMovimiento] = useState([]);
  const [rotacionStock, setRotacionStock] = useState([]);

  const loadData = useCallback(() => {
    setLoading(true);
    const fp = { periodo, limite: 24 };
    const fd = {};
    if (fechaDesde) { fp.fecha_desde = fechaDesde; fd.fecha_desde = fechaDesde; }
    if (fechaHasta) { fp.fecha_hasta = fechaHasta; fd.fecha_hasta = fechaHasta; }

    Promise.all([
      api.getVentasPorPeriodo(fp),
      api.getComprasPorPeriodo(fp),
      api.getProductosMasVendidos({ limite: 15, ...fd }),
      api.getVentasPorCliente({ limite: 10, ...fd }),
      api.getStockPorCategoria(),
      api.getGastosPorCategoria(),
      api.getResumenGeneral(fd),
      api.getIngresosPorPeriodo(fp),
      api.getProductosMasRentables({ limite: 15, ...fd }),
      api.getProductosSinMovimiento({ limite: 30, ...fd }),
      api.getRotacionStock({ limite: 20, ...fd })
    ]).then(([vp, cp, pmv, vc, sc, gc, res, ing, rent, sinMov, rot]) => {
      setData({
        ventasPeriodo: vp.data.data || [],
        comprasPeriodo: cp.data.data || [],
        productosMasVendidos: pmv.data.data || [],
        ventasCliente: vc.data.data || [],
        stockCategoria: sc.data.data || [],
        gastosCategoria: gc.data.data || [],
        resumen: res.data
      });
      setIngresos(ing.data.data || []);
      setProductosRentables(rent.data.data || []);
      setProductosSinMovimiento(sinMov.data.data || []);
      setRotacionStock(rot.data.data || []);
    }).finally(() => setLoading(false));
  }, [periodo, fechaDesde, fechaHasta]);

  useEffect(() => { loadData(); }, [loadData]);

  const openProductoDetail = async () => {
    if (productos.length === 0) { const r = await api.getProductos({ limit: 1000 }); setProductos(r.data.productos || []); }
    setShowProductoModal(true);
  };

  const loadProductoStats = async (id) => {
    setSelectedProducto(id);
    const r = await api.getProductoDetalle(id, { periodo, limite: 12 });
    setProductoStats(r.data);
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6" data-testid="estadisticas-view">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-heading font-semibold">Estadísticas</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5">
            <CalendarBlank size={16} className="text-muted-foreground" />
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="text-sm border-0 focus:ring-0 p-0 w-32 bg-transparent" data-testid="fecha-desde" />
            <span className="text-muted-foreground text-sm">-</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="text-sm border-0 focus:ring-0 p-0 w-32 bg-transparent" data-testid="fecha-hasta" />
            {(fechaDesde || fechaHasta) && <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="text-red-500 hover:text-red-700"><X size={14} /></button>}
          </div>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="form-input w-40" data-testid="periodo-select">
            <option value="dia">Por Día</option>
            <option value="semana">Por Semana</option>
            <option value="mes">Por Mes</option>
            <option value="año">Por Año</option>
          </select>
          <button onClick={openProductoDetail} className="flex items-center gap-2 px-3 py-2 bg-[#457B9D] text-white rounded-lg hover:bg-[#3A6A8A] text-sm" data-testid="producto-stats-btn">
            <Funnel size={16} /> Análisis Producto
          </button>
        </div>
      </div>
      
      {data.resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="stat-card"><p className="stat-label">Total Ventas</p><p className="stat-value text-green-600">{formatGs(data.resumen.ventas?.total)}</p></div>
          <div className="stat-card"><p className="stat-label">Utilidad</p><p className="stat-value text-green-600">{formatGs(data.resumen.ventas?.utilidad)}</p></div>
          <div className="stat-card"><p className="stat-label">Total Compras</p><p className="stat-value text-[#E63946]">{formatGs(data.resumen.compras?.total)}</p></div>
          <div className="stat-card"><p className="stat-label">Total Gastos</p><p className="stat-value text-yellow-600">{formatGs(data.resumen.gastos?.total)}</p></div>
          <div className="stat-card"><p className="stat-label">Utilidad Neta</p><p className={`stat-value ${data.resumen.utilidad_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatGs(data.resumen.utilidad_neta)}</p></div>
          <div className="stat-card"><p className="stat-label">Valor Stock</p><p className="stat-value text-blue-600">{formatGs(data.resumen.stock?.valor_venta)}</p></div>
        </div>
      )}

      {/* Ingresos vs Gastos vs Compras */}
      {ingresos.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-6 h-80">
          <h3 className="font-semibold mb-4">Ingresos vs Compras vs Gastos</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={ingresos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="ingresos" name="Ingresos" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compras" name="Compras" fill="#457B9D" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#E9C46A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-lg p-6 h-80">
          <h3 className="font-semibold mb-4">Ventas y Utilidad</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={data.ventasPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#2A9D8F" fill="#2A9D8F" fillOpacity={0.3} />
              <Area type="monotone" dataKey="utilidad" name="Utilidad" stroke="#E63946" fill="#E63946" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-border rounded-lg p-6 h-80">
          <h3 className="font-semibold mb-4">Top Productos</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.productosMasVendidos?.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatGsShort} />
              <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Total" fill="#E63946" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rotación de stock */}
      {rotacionStock.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-1">Rotación de Stock</h3>
          <p className="text-xs text-muted-foreground mb-4">Índice = unidades vendidas ÷ stock actual. Mayor índice = mayor rotación.</p>
          <div className="overflow-x-auto max-h-72">
            <table className="data-table">
              <thead className="sticky top-0 bg-white"><tr><th>Producto</th><th className="text-right">Stock Actual</th><th className="text-right">Unid. Vendidas</th><th className="text-right">Índice Rotación</th></tr></thead>
              <tbody>
                {rotacionStock.map((p, i) => (
                  <tr key={p.producto_id || i}>
                    <td>{p.nombre}</td>
                    <td className="text-right">{p.stock_actual}</td>
                    <td className="text-right">{p.cantidad_vendida}</td>
                    <td className="text-right">
                      <span className={`badge ${p.rotacion >= 3 ? 'badge-success' : p.rotacion >= 1 ? 'bg-yellow-100 text-yellow-800' : 'badge-warning'}`}>
                        {p.rotacion}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Productos más rentables */}
      {productosRentables.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Productos más Rentables</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Producto</th><th className="text-right">Cant. Vendida</th><th className="text-right">Ingresos</th><th className="text-right">Utilidad</th><th className="text-right">Margen %</th></tr></thead>
              <tbody>
                {productosRentables.map((p, i) => (
                  <tr key={p.producto_id || i}>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-right">{p.cantidad_vendida}</td>
                    <td className="text-right text-sm">{formatGs(p.ingresos)}</td>
                    <td className="text-right font-semibold text-green-600">{formatGs(p.utilidad)}</td>
                    <td className="text-right"><span className={`badge ${p.margen_pct >= 20 ? 'badge-success' : p.margen_pct >= 10 ? 'bg-yellow-100 text-yellow-800' : 'badge-warning'}`}>{p.margen_pct}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Productos sin movimiento */}
      {productosSinMovimiento.length > 0 && (
        <div className="bg-white border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-1">Productos sin Movimiento <span className="text-sm font-normal text-muted-foreground">({productosSinMovimiento.length})</span></h3>
          <p className="text-xs text-muted-foreground mb-4">Productos activos sin ventas en el período seleccionado</p>
          <div className="overflow-x-auto max-h-72">
            <table className="data-table">
              <thead className="sticky top-0 bg-white"><tr><th>Código</th><th>Producto</th><th>Variante</th><th className="text-right">Stock</th><th className="text-right">Valor Stock</th></tr></thead>
              <tbody>
                {productosSinMovimiento.map((p, i) => (
                  <tr key={p.producto_id || i}>
                    <td className="font-mono text-sm">{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td className="text-sm text-muted-foreground">{p.variante || '-'}</td>
                    <td className="text-right"><span className={p.stock <= 0 ? 'text-red-600 font-semibold' : ''}>{p.stock}</span></td>
                    <td className="text-right text-sm">{formatGs(p.valor_stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Análisis por Producto Modal */}
      <Modal isOpen={showProductoModal} onClose={() => { setShowProductoModal(false); setProductoStats(null); setSelectedProducto(null); }} title="Análisis por Producto" size="xl">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Seleccionar Producto</label>
            <select value={selectedProducto || ''} onChange={(e) => e.target.value && loadProductoStats(e.target.value)} className="form-input" data-testid="producto-detail-select">
              <option value="">Elegir producto...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nombre} {p.variante ? `(${p.variante})` : ''}</option>)}
            </select>
          </div>
          {productoStats && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold">{productoStats.producto?.nombre}</h4>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>Stock: <strong>{productoStats.producto?.stock}</strong></span>
                  <span>Costo: <strong>{formatGs(productoStats.producto?.costo)}</strong></span>
                  <span>Precio: <strong>{formatGs(productoStats.producto?.precio_con_iva)}</strong></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-green-700">Ventas por Período</h4>
                  {productoStats.ventas.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={productoStats.ventas}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="periodo" tick={{ fontSize: 10 }} /><YAxis /><Tooltip content={<CustomTooltip />} /><Bar dataKey="cantidad" fill="#2A9D8F" name="Cantidad" /><Bar dataKey="total" fill="#E63946" name="Total" /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground">Sin ventas registradas</p>}
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-blue-700">Compras por Período</h4>
                  {productoStats.compras.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={productoStats.compras}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="periodo" tick={{ fontSize: 10 }} /><YAxis /><Tooltip content={<CustomTooltip />} /><Bar dataKey="cantidad" fill="#457B9D" name="Cantidad" /></BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground">Sin compras registradas</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ==================== PRODUCTOS VIEW ====================
function ProductosView({ user }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({ codigo: '', nombre: '', variante: '', categoria: '', proveedor: '', precio_con_iva: 0, costo: 0, stock: 0, stock_minimo: 2, iva_pct: 10, margen: 20 });
  const [ajusteForm, setAjusteForm] = useState({ cantidad: 0, motivo: '' });
  const isAdmin = user?.role === 'admin';
  const canCreate = hasPermission(user, 'productos', 'crear');
  const canEdit = hasPermission(user, 'productos', 'editar');
  const canDelete = hasPermission(user, 'productos', 'eliminar');

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getProductos(search ? { search, limit: 1000 } : { limit: 1000 }),
      api.getCategorias()
    ]).then(([p, c]) => {
      setProductos(p.data.productos || []);
      setCategorias(c.data.categorias || []);
    }).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew = () => { setEditItem(null); setForm({ codigo: '', nombre: '', variante: '', categoria: categorias[0] || '', proveedor: '', precio_con_iva: 0, costo: 0, stock: 0, stock_minimo: 2, iva_pct: 10, margen: 20 }); setShowModal(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ codigo: p.codigo, nombre: p.nombre, variante: p.variante || '', categoria: p.categoria, proveedor: p.proveedor || '', precio_con_iva: p.precio_con_iva, costo: p.costo, stock: p.stock, stock_minimo: p.stock_minimo, iva_pct: p.iva_pct || 10, margen: p.margen || 15 }); setShowModal(true); };

  const precioSugerido = form.costo > 0 ? Math.round(form.costo * (1 + (form.margen || 0) / 100)) : 0;

  const handleSave = async () => {
    try {
      const payload = { ...form, precio_con_iva: precioSugerido };
      if (editItem) { await api.updateProducto(editItem.id, payload); }
      else { await api.createProducto(payload); }
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try { await api.deleteProducto(id); loadData(); } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleAjuste = async () => {
    try { await api.ajustarStock(showAjusteModal.id, ajusteForm); setShowAjusteModal(null); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-6" data-testid="productos-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Productos</h2>
        {canCreate && <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-producto-btn"><Plus size={18} /> Nuevo Producto</button>}
      </div>
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar por código, nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" data-testid="productos-search" />
      </div>
      <div className="bg-white border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white"><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th className="text-right">Costo</th><th className="text-right">Precio</th><th className="text-center">Stock</th>{(canEdit || canDelete) && <th className="text-center">Acciones</th>}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr>
              : productos.length === 0 ? <tr><td colSpan={7} className="text-center py-8">Sin productos</td></tr>
              : productos.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-sm">{p.codigo}</td>
                  <td className="font-medium">{p.nombre}{p.variante ? <div className="font-semibold text-black text-sm">{p.variante}</div> : ''}</td>
                  <td><span className="badge bg-muted text-foreground">{p.categoria}</span></td>
                  <td className="text-right text-sm">{formatGs(p.costo)}</td>
                  <td className="text-right price-gs">{formatGs(p.precio_con_iva)}</td>
                  <td className="text-center"><span className={p.stock <= p.stock_minimo ? 'text-red-600 font-semibold' : 'text-green-600'}>{p.stock}</span></td>
                  {(canEdit || canDelete) && <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && <button onClick={() => { setShowAjusteModal(p); setAjusteForm({ cantidad: 0, motivo: '' }); }} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Ajustar stock"><Package size={16} /></button>}
                      {canEdit && <button onClick={() => openEdit(p)} className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                      {canDelete && <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Eliminar"><Trash size={16} /></button>}
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group"><label className="form-label">Código *</label><input type="text" value={form.codigo} onChange={(e) => setForm({...form, codigo: e.target.value})} className="form-input" data-testid="producto-codigo" /></div>
          <div className="form-group"><label className="form-label">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="form-input" data-testid="producto-nombre" /></div>
          <div className="form-group"><label className="form-label">Variante</label><input type="text" value={form.variante} onChange={(e) => setForm({...form, variante: e.target.value})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Categoría *</label><input type="text" value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} className="form-input" list="categorias-list" /><datalist id="categorias-list">{categorias.map(c => <option key={c} value={c} />)}</datalist></div>
          <div className="form-group"><label className="form-label">Proveedor</label><input type="text" value={form.proveedor} onChange={(e) => setForm({...form, proveedor: e.target.value})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">IVA %</label><input type="number" value={form.iva_pct} onChange={(e) => setForm({...form, iva_pct: parseInt(e.target.value) || 0})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Costo con IVA</label><input type="number" value={form.costo} onChange={(e) => setForm({...form, costo: parseFloat(e.target.value) || 0})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">% Utilidad esperada</label><input type="number" value={form.margen} onChange={(e) => setForm({...form, margen: parseFloat(e.target.value) || 0})} className="form-input" min="0" /></div>
          <div className="form-group col-span-2"><label className="form-label">Precio de venta sugerido</label><div className="form-input bg-muted cursor-default text-lg font-semibold text-green-700">{formatGs(precioSugerido)}</div></div>
          <div className="form-group"><label className="form-label">Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: parseInt(e.target.value) || 0})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Stock Mínimo</label><input type="number" value={form.stock_minimo} onChange={(e) => setForm({...form, stock_minimo: parseInt(e.target.value) || 0})} className="form-input" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
          <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="save-producto-btn">{editItem ? 'Actualizar' : 'Crear'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!showAjusteModal} onClose={() => setShowAjusteModal(null)} title={`Ajustar Stock: ${showAjusteModal?.nombre || ''}`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Stock actual: <strong>{showAjusteModal?.stock}</strong></p>
          <div className="form-group"><label className="form-label">Cantidad (+ entrada, - salida)</label><input type="number" value={ajusteForm.cantidad} onChange={(e) => setAjusteForm({...ajusteForm, cantidad: parseInt(e.target.value) || 0})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Motivo *</label><input type="text" value={ajusteForm.motivo} onChange={(e) => setAjusteForm({...ajusteForm, motivo: e.target.value})} className="form-input" placeholder="Ej: Ajuste por inventario" /></div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAjusteModal(null)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleAjuste} disabled={!ajusteForm.motivo} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">Ajustar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== VENTAS VIEW ====================
function VentasView({ user }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [showProdSearch, setShowProdSearch] = useState(false);
  const [form, setForm] = useState({
    cliente_id: '', cliente_nombre: '', fecha: new Date().toISOString().split('T')[0],
    items: [], observaciones: ''
  });
  const [itemQty, setItemQty] = useState(1);
  const isAdmin = user?.role === 'admin';
  const canEdit = hasPermission(user, 'ventas', 'editar') || isAdmin;
  const canDelete = hasPermission(user, 'ventas', 'eliminar') || isAdmin;

  const loadData = useCallback(() => {
    setLoading(true);
    api.getVentas({ limit: 1000 }).then(r => setVentas(r.data.ventas || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew = async () => {
    const [cRes, pRes] = await Promise.all([api.getClientes({}), api.getProductos({ limit: 1000 })]);
    setClientes(cRes.data.clientes || []);
    setProductos(pRes.data.productos || []);
    setEditItem(null);
    setForm({ cliente_id: '', cliente_nombre: '', fecha: new Date().toISOString().split('T')[0], items: [], observaciones: '' });
    setProdSearch('');
    setShowModal(true);
  };

  const openEdit = async (v) => {
    const [cRes, pRes] = await Promise.all([api.getClientes({}), api.getProductos({ limit: 1000 })]);
    setClientes(cRes.data.clientes || []);
    setProductos(pRes.data.productos || []);
    setEditItem(v);
    setForm({
      cliente_id: v.cliente_id || '', cliente_nombre: v.cliente_nombre || '',
      fecha: v.fecha ? v.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      items: (v.items || []).map(i => ({
        producto_id: i.producto_id, codigo: i.codigo, nombre: i.nombre, variante: i.variante || '',
        cantidad: i.cantidad, precio_unitario: i.precio_unitario, costo_unitario: i.costo_unitario || 0, iva_pct: i.iva_pct || 10
      })),
      observaciones: v.observaciones || ''
    });
    setShowModal(true);
  };

  const openDetail = (v) => { setSelectedVenta(v); setShowDetailModal(true); };

  const filteredProds = prodSearch.length >= 1
    ? productos.filter(p =>
        p.codigo?.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.nombre?.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.variante?.toLowerCase().includes(prodSearch.toLowerCase()))
    : [];

  const addItem = (prod) => {
    if (form.items.find(i => i.producto_id === prod.id)) { setProdSearch(''); setShowProdSearch(false); return; }
    setForm({ ...form, items: [...form.items, {
      producto_id: prod.id, codigo: prod.codigo, nombre: prod.nombre, variante: prod.variante || '',
      cantidad: 1, precio_unitario: prod.precio_con_iva, costo_unitario: prod.costo || 0, iva_pct: prod.iva_pct || 10
    }]});
    setProdSearch(''); setShowProdSearch(false);
  };

  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItemQty = (idx, qty) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], cantidad: Math.max(1, parseInt(qty) || 1) };
    setForm({ ...form, items });
  };
  const updateItemPrice = (idx, price) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], precio_unitario: parseFloat(price) || 0 };
    setForm({ ...form, items });
  };

  const total = form.items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const handleSave = async () => {
    if (!form.cliente_id || form.items.length === 0) return alert('Seleccione cliente y agregue productos');
    try {
      if (editItem) { await api.updateVenta(editItem.id, form); }
      else { await api.createVenta(form); }
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta venta? Se restaurará el stock.')) return;
    try { await api.deleteVenta(id); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const getItemsLabel = (items) => {
    if (!items || items.length === 0) return '-';
    const first = items[0];
    const name = first.variante ? `${first.nombre} | Variante: ${first.variante}` : first.nombre;
    if (items.length === 1) return name;
    return `${name} + ${items.length - 1} más`;
  };

  const filteredVentas = ventas.filter(v =>
    !search || v.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    v.fecha?.includes(search)
  );

  return (
    <div className="space-y-6" data-testid="ventas-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Ventas</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-venta-btn">
          <Plus size={18} /> Nueva Venta
        </button>
      </div>
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar por cliente, fecha..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" data-testid="ventas-search" />
      </div>
      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th className="text-right">Total</th><th className="text-right">Utilidad</th><th className="text-center">Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              : filteredVentas.length === 0 ? <tr><td colSpan={6} className="text-center py-8">Sin ventas registradas</td></tr>
              : filteredVentas.map(v => (
                <tr key={v.id}>
                  <td className="whitespace-nowrap">{new Date(v.fecha).toLocaleDateString('es-PY')}</td>
                  <td className="font-medium">{v.cliente_nombre}</td>
                  <td className="text-sm max-w-xs truncate">{getItemsLabel(v.items)}</td>
                  <td className="text-right font-mono">{formatGs(v.total)}</td>
                  <td className="text-right font-mono text-green-600">{formatGs(v.utilidad)}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDetail(v)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Ver detalle"><Eye size={16} /></button>
                      {canEdit && <button onClick={() => openEdit(v)} className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                      {canDelete && <button onClick={() => handleDelete(v.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Eliminar"><Trash size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detalle de Venta" size="xl">
        {selectedVenta && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 rounded-lg p-3">
              <div><span className="text-muted-foreground">Cliente</span><div className="font-medium">{selectedVenta.cliente_nombre}</div></div>
              <div><span className="text-muted-foreground">Fecha</span><div className="font-medium">{new Date(selectedVenta.fecha).toLocaleDateString('es-PY')}</div></div>
              {selectedVenta.vendedor_nombre && <div><span className="text-muted-foreground">Vendedor</span><div className="font-medium">{selectedVenta.vendedor_nombre}</div></div>}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center w-16">Cant.</th>
                    <th className="text-right w-32">Precio</th>
                    <th className="text-right w-32">Costo Unit.</th>
                    <th className="text-right w-32">Subtotal</th>
                    <th className="text-right w-28">Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedVenta.items || []).map((item, i) => {
                    const subtotal = item.precio_unitario * item.cantidad;
                    const costoTotal = (item.costo_unitario || 0) * item.cantidad;
                    const utilidad = subtotal - costoTotal;
                    return (
                      <tr key={i}>
                        <td>
                          <div className="font-medium">{item.nombre}</div>
                          {item.variante && <div className="text-xs text-muted-foreground">Variante: {item.variante}</div>}
                        </td>
                        <td className="text-center">{item.cantidad}</td>
                        <td className="text-right font-mono">{formatGs(item.precio_unitario)}</td>
                        <td className="text-right font-mono text-muted-foreground">{formatGs(item.costo_unitario || 0)}</td>
                        <td className="text-right font-mono font-medium">{formatGs(subtotal)}</td>
                        <td className={`text-right font-mono font-medium ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatGs(utilidad)}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold bg-muted">
                    <td colSpan={4} className="text-right">TOTAL:</td>
                    <td className="text-right text-lg font-mono">{formatGs(selectedVenta.total)}</td>
                    <td className="text-right text-lg font-mono text-green-600">{formatGs(selectedVenta.utilidad || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {selectedVenta.observaciones && <p className="text-sm text-muted-foreground">Obs: {selectedVenta.observaciones}</p>}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Venta' : 'Nueva Venta'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Cliente *</label>
              <select value={form.cliente_id} onChange={(e) => {
                const c = clientes.find(cl => cl.id === e.target.value);
                setForm({ ...form, cliente_id: e.target.value, cliente_nombre: c?.nombre || '' });
              }} className="form-input" data-testid="venta-cliente">
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de venta *</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="form-input" />
          </div>

          <div className="border border-border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Agregar Productos</h4>
            <div className="relative mb-3">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Buscar por código, nombre o variante..."
                value={prodSearch}
                onChange={(e) => { setProdSearch(e.target.value); setShowProdSearch(true); }}
                onFocus={() => setShowProdSearch(true)}
                className="form-input pl-9"
                data-testid="venta-prod-search"
              />
              {showProdSearch && filteredProds.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                  {filteredProds.map(p => (
                    <button key={p.id} onClick={() => addItem(p)}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-0">
                      <span className="font-medium">{p.codigo} | {p.nombre}</span>
                      {p.variante && <span className="text-muted-foreground"> | Variante: {p.variante}</span>}
                      <span className="float-right text-muted-foreground">Stock: {p.stock} | {formatGs(p.precio_con_iva)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="text-center w-24">Cant.</th>
                      <th className="text-right w-36">Precio Venta</th>
                      <th className="text-right w-32">Costo</th>
                      <th className="text-right w-36">Subtotal</th>
                      <th className="text-right w-28">Utilidad</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, i) => {
                      const subtotal = item.precio_unitario * item.cantidad;
                      const costoTotal = (item.costo_unitario || 0) * item.cantidad;
                      const utilidad = subtotal - costoTotal;
                      return (
                        <tr key={i}>
                          <td>
                            <div className="font-medium text-sm">{item.nombre}</div>
                            {item.variante && <div className="text-xs text-muted-foreground">Variante: {item.variante}</div>}
                          </td>
                          <td className="text-center">
                            <input type="number" value={item.cantidad} min="1"
                              onChange={(e) => updateItemQty(i, e.target.value)}
                              className="form-input text-center p-1 w-20" />
                          </td>
                          <td className="text-right">
                            <input type="number" value={item.precio_unitario} min="0"
                              onChange={(e) => updateItemPrice(i, e.target.value)}
                              className="form-input text-right p-1 w-32" />
                          </td>
                          <td className="text-right font-mono text-muted-foreground text-sm">{formatGs(item.costo_unitario || 0)}</td>
                          <td className="text-right font-mono font-medium">{formatGs(subtotal)}</td>
                          <td className={`text-right font-mono font-medium text-sm ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatGs(utilidad)}</td>
                          <td className="text-center">
                            <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-semibold bg-muted">
                      <td colSpan={4} className="text-right">TOTAL:</td>
                      <td className="text-right text-lg font-mono">{formatGs(total)}</td>
                      <td className="text-right font-mono text-green-600">
                        {formatGs(form.items.reduce((s, i) => s + (i.precio_unitario - (i.costo_unitario || 0)) * i.cantidad, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} disabled={!form.cliente_id || form.items.length === 0}
              className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] disabled:opacity-50" data-testid="save-venta-btn">
              {editItem ? 'Actualizar Venta' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== COMPRAS VIEW ====================
function ComprasView({ user }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [showProdSearch, setShowProdSearch] = useState(false);
  const [form, setForm] = useState({
    proveedor_id: '', proveedor_nombre: '', fecha: new Date().toISOString().split('T')[0],
    numero_factura: '', items: [], observaciones: ''
  });
  const isAdmin = user?.role === 'admin';
  const canEdit = hasPermission(user, 'compras', 'editar') || isAdmin;
  const canDelete = hasPermission(user, 'compras', 'eliminar') || isAdmin;

  const loadData = useCallback(() => {
    setLoading(true);
    api.getCompras({ limit: 1000 }).then(r => setCompras(r.data.compras || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew = async () => {
    const [pRes, prodRes] = await Promise.all([api.getProveedores({}), api.getProductos({ limit: 1000 })]);
    setProveedores(pRes.data.proveedores || []);
    setProductos(prodRes.data.productos || []);
    setEditItem(null);
    setForm({ proveedor_id: '', proveedor_nombre: '', fecha: new Date().toISOString().split('T')[0], numero_factura: '', items: [], observaciones: '' });
    setProdSearch('');
    setShowModal(true);
  };

  const openEdit = async (c) => {
    const [pRes, prodRes] = await Promise.all([api.getProveedores({}), api.getProductos({ limit: 1000 })]);
    setProveedores(pRes.data.proveedores || []);
    setProductos(prodRes.data.productos || []);
    setEditItem(c);
    setForm({
      proveedor_id: c.proveedor_id || '', proveedor_nombre: c.proveedor_nombre || '',
      fecha: c.fecha ? c.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      numero_factura: c.numero_factura || '',
      items: (c.items || []).map(i => ({
        producto_id: i.producto_id, codigo: i.codigo, nombre: i.nombre, variante: i.variante || '',
        cantidad: i.cantidad, precio_unitario: i.precio_unitario, iva_pct: i.iva_pct || 10
      })),
      observaciones: c.observaciones || ''
    });
    setShowModal(true);
  };

  const openDetail = (c) => { setSelectedCompra(c); setShowDetailModal(true); };

  const filteredProds = prodSearch.length >= 1
    ? productos.filter(p =>
        p.codigo?.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.nombre?.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.variante?.toLowerCase().includes(prodSearch.toLowerCase()))
    : [];

  const addItem = (prod) => {
    if (form.items.find(i => i.producto_id === prod.id)) { setProdSearch(''); setShowProdSearch(false); return; }
    setForm({ ...form, items: [...form.items, {
      producto_id: prod.id, codigo: prod.codigo, nombre: prod.nombre, variante: prod.variante || '',
      cantidad: 1, precio_unitario: prod.costo || 0, iva_pct: prod.iva_pct || 10
    }]});
    setProdSearch(''); setShowProdSearch(false);
  };

  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItemQty = (idx, qty) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], cantidad: Math.max(1, parseInt(qty) || 1) };
    setForm({ ...form, items });
  };
  const updateItemPrice = (idx, price) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], precio_unitario: parseFloat(price) || 0 };
    setForm({ ...form, items });
  };

  const total = form.items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const handleSave = async () => {
    if (!form.proveedor_id || form.items.length === 0) return alert('Seleccione proveedor y agregue productos');
    try {
      if (editItem) { await api.updateCompra(editItem.id, form); }
      else { await api.createCompra(form); }
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta compra? Se revertirá el stock.')) return;
    try { await api.deleteCompra(id); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const getItemsLabel = (items) => {
    if (!items || items.length === 0) return '-';
    const first = items[0];
    const name = first.variante ? `${first.nombre} | Variante: ${first.variante}` : first.nombre;
    if (items.length === 1) return name;
    return `${name} + ${items.length - 1} más`;
  };

  const filteredCompras = compras.filter(c =>
    !search || c.proveedor_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.numero_factura?.includes(search)
  );

  return (
    <div className="space-y-6" data-testid="compras-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Compras</h2>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-compra-btn">
          <Plus size={18} /> Nueva Compra
        </button>
      </div>
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar por proveedor, factura..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" data-testid="compras-search" />
      </div>
      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th>Productos</th><th className="text-right">Total</th><th className="text-center">Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
              : filteredCompras.length === 0 ? <tr><td colSpan={6} className="text-center py-8">Sin compras registradas</td></tr>
              : filteredCompras.map(c => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap">{new Date(c.fecha).toLocaleDateString('es-PY')}</td>
                  <td className="font-medium">{c.proveedor_nombre}</td>
                  <td className="text-sm">{c.numero_factura || '-'}</td>
                  <td className="text-sm max-w-xs truncate">{getItemsLabel(c.items)}</td>
                  <td className="text-right font-mono">{formatGs(c.total)}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDetail(c)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Ver detalle"><Eye size={16} /></button>
                      {canEdit && <button onClick={() => openEdit(c)} className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                      {canDelete && <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Eliminar"><Trash size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detalle de Compra" size="lg">
        {selectedCompra && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 rounded-lg p-3">
              <div><span className="text-muted-foreground">Proveedor</span><div className="font-medium">{selectedCompra.proveedor_nombre}</div></div>
              <div><span className="text-muted-foreground">Fecha</span><div className="font-medium">{new Date(selectedCompra.fecha).toLocaleDateString('es-PY')}</div></div>
              {selectedCompra.numero_factura && <div><span className="text-muted-foreground">Factura</span><div className="font-medium">{selectedCompra.numero_factura}</div></div>}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center w-16">Cant.</th>
                    <th className="text-right w-36">Costo Unit.</th>
                    <th className="text-right w-36">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCompra.items || []).map((item, i) => (
                    <tr key={i}>
                      <td><div className="font-medium">{item.nombre}</div>{item.variante && <div className="text-xs text-muted-foreground">Variante: {item.variante}</div>}</td>
                      <td className="text-center">{item.cantidad}</td>
                      <td className="text-right font-mono">{formatGs(item.precio_unitario)}</td>
                      <td className="text-right font-mono font-medium">{formatGs(item.precio_unitario * item.cantidad)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-muted">
                    <td colSpan={3} className="text-right">TOTAL:</td>
                    <td className="text-right text-lg font-mono">{formatGs(selectedCompra.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {selectedCompra.observaciones && <p className="text-sm text-muted-foreground">Obs: {selectedCompra.observaciones}</p>}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Compra' : 'Nueva Compra'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Proveedor *</label>
              <select value={form.proveedor_id} onChange={(e) => {
                const p = proveedores.find(pr => pr.id === e.target.value);
                setForm({ ...form, proveedor_id: e.target.value, proveedor_nombre: p?.nombre || '' });
              }} className="form-input" data-testid="compra-proveedor">
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de compra *</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Número de factura</label>
              <input type="text" value={form.numero_factura} onChange={(e) => setForm({ ...form, numero_factura: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones</label>
              <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="form-input" />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-3">Agregar Productos</h4>
            <div className="relative mb-3">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" placeholder="Buscar por código, nombre o variante..."
                value={prodSearch}
                onChange={(e) => { setProdSearch(e.target.value); setShowProdSearch(true); }}
                onFocus={() => setShowProdSearch(true)}
                className="form-input pl-9"
              />
              {showProdSearch && filteredProds.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                  {filteredProds.map(p => (
                    <button key={p.id} onClick={() => addItem(p)}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-0">
                      <span className="font-medium">{p.codigo} | {p.nombre}</span>
                      {p.variante && <span className="text-muted-foreground"> | Variante: {p.variante}</span>}
                      <span className="float-right text-muted-foreground">Costo: {formatGs(p.costo || 0)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="text-center w-20">Cant.</th>
                      <th className="text-right w-44">Costo Unit.</th>
                      <th className="text-right w-36">Subtotal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div className="font-medium text-sm">{item.nombre}</div>
                          {item.variante && <div className="text-xs text-muted-foreground">Variante: {item.variante}</div>}
                        </td>
                        <td className="text-center">
                          <input type="number" value={item.cantidad} min="1"
                            onChange={(e) => updateItemQty(i, e.target.value)}
                            className="form-input text-center p-1 w-16" />
                        </td>
                        <td className="text-right">
                          <input type="number" value={item.precio_unitario} min="0"
                            onChange={(e) => updateItemPrice(i, e.target.value)}
                            className="form-input text-right p-1 w-36" />
                        </td>
                        <td className="text-right font-mono font-medium">{formatGs(item.precio_unitario * item.cantidad)}</td>
                        <td className="text-center">
                          <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-muted">
                      <td colSpan={3} className="text-right">TOTAL:</td>
                      <td className="text-right text-lg font-mono">{formatGs(total)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} disabled={!form.proveedor_id || form.items.length === 0}
              className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429] disabled:opacity-50" data-testid="save-compra-btn">
              {editItem ? 'Actualizar Compra' : 'Registrar Compra'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== CLIENTES VIEW ====================
const TIPOS_CLIENTE = ['Odontólogo', 'Clínica', 'Laboratorio', 'Otro'];

function ClientesView({ user }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Filtros lista
  const [showFilters, setShowFilters] = useState(false);
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterTotalMin, setFilterTotalMin]     = useState('');
  const [filterCantMin, setFilterCantMin]       = useState('');
  const [filterCiudad, setFilterCiudad]         = useState('');
  const [filterTipo, setFilterTipo]             = useState('');
  // Modales
  const [showModal, setShowModal]       = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [historialStats, setHistorialStats]   = useState({});
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  // Filtros historial
  const [hFechaDesde, setHFechaDesde] = useState('');
  const [hFechaHasta, setHFechaHasta] = useState('');
  const [hTotalMin, setHTotalMin]     = useState('');
  const [hCiudad, setHCiudad]         = useState('');
  const [hTipo, setHTipo]             = useState('');

  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', direccion: '', ciudad: '', tipo: 'Odontólogo', ultimo_contacto: '', observaciones: '' });

  const isAdmin  = user?.role === 'admin';
  const canCreate = hasPermission(user, 'clientes', 'crear')    || isAdmin;
  const canEdit   = hasPermission(user, 'clientes', 'editar')   || isAdmin;
  const canDelete = hasPermission(user, 'clientes', 'eliminar') || isAdmin;

  const loadData = useCallback(() => {
    setLoading(true);
    api.getClientes({ search }).then(r => setClientes(r.data.clientes || [])).finally(() => setLoading(false));
  }, [search]);
  useEffect(() => { loadData(); }, [loadData]);

  const openNew  = () => { setEditItem(null); setForm({ nombre: '', ruc: '', telefono: '', direccion: '', ciudad: '', tipo: 'Odontólogo', ultimo_contacto: '', observaciones: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ nombre: c.nombre, ruc: c.ruc || '', telefono: c.telefono || '', direccion: c.direccion || '', ciudad: c.ciudad || '', tipo: c.tipo || 'Odontólogo', ultimo_contacto: c.ultimo_contacto || '', observaciones: c.observaciones || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nombre) return alert('El nombre es obligatorio');
    try {
      if (editItem) { await api.updateCliente(editItem.id, form); }
      else          { await api.createCliente(form); }
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    try { await api.deleteCliente(id); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const openHistorial = async (cliente, params = {}) => {
    setSelectedCliente(cliente);
    setShowHistorial(true);
    setLoadingHistorial(true);
    setHistorialVentas([]);
    try {
      const r = await api.getClienteVentas(cliente.id, params);
      setHistorialVentas(r.data.ventas || []);
      setHistorialStats({ cantidad: r.data.cantidad_ventas, total: r.data.total_comprado });
    } catch (e) { alert(formatApiError(e.response?.data?.detail || e.message)); }
    finally { setLoadingHistorial(false); }
  };

  const aplicarFiltrosHistorial = () => {
    if (!selectedCliente) return;
    openHistorial(selectedCliente, {
      fecha_desde: hFechaDesde || undefined,
      fecha_hasta: hFechaHasta || undefined,
      total_min:   hTotalMin   || undefined,
      ciudad:      hCiudad     || undefined,
      tipo:        hTipo       || undefined,
    });
  };

  // Ciudades y tipos únicos para selects de filtro
  const ciudades = [...new Set(clientes.map(c => c.ciudad).filter(Boolean))].sort();
  const tipos    = [...new Set(clientes.map(c => c.tipo).filter(Boolean))].sort();

  const filtrados = clientes.filter(c => {
    if (filterFechaDesde && c.ultima_venta_fecha && c.ultima_venta_fecha < filterFechaDesde) return false;
    if (filterFechaHasta && c.ultima_venta_fecha && c.ultima_venta_fecha > filterFechaHasta + 'T23:59:59') return false;
    if (filterTotalMin && (c.total_comprado || 0) < parseFloat(filterTotalMin)) return false;
    if (filterCantMin  && (c.cantidad_compras || 0) < parseInt(filterCantMin))  return false;
    if (filterCiudad   && c.ciudad !== filterCiudad)  return false;
    if (filterTipo     && c.tipo   !== filterTipo)    return false;
    return true;
  });

  const hasActiveFilters = filterFechaDesde || filterFechaHasta || filterTotalMin || filterCantMin || filterCiudad || filterTipo;

  const limpiarFiltros = () => {
    setFilterFechaDesde(''); setFilterFechaHasta('');
    setFilterTotalMin(''); setFilterCantMin('');
    setFilterCiudad(''); setFilterTipo('');
  };

  return (
    <div className="space-y-6" data-testid="clientes-view">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Clientes</h2>
        {canCreate && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-cliente-btn">
            <Plus size={18} /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* Búsqueda + Filtros */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nombre, RUC, ciudad..." value={search}
            onChange={e => setSearch(e.target.value)} className="form-input pl-10" data-testid="clientes-search" />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters || hasActiveFilters ? 'bg-[#E63946] text-white border-[#E63946]' : 'border-border hover:bg-muted'}`}>
          <Funnel size={16} /> Filtros {hasActiveFilters ? '●' : ''}
        </button>
      </div>

      {/* Panel filtros */}
      {showFilters && (
        <div className="bg-white border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Última venta desde</label>
            <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Última venta hasta</label>
            <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Total comprado mín. (Gs.)</label>
            <input type="number" value={filterTotalMin} onChange={e => setFilterTotalMin(e.target.value)} className="form-input" placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad compras mín.</label>
            <input type="number" value={filterCantMin} onChange={e => setFilterCantMin(e.target.value)} className="form-input" placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Ciudad</label>
            <select value={filterCiudad} onChange={e => setFilterCiudad(e.target.value)} className="form-input">
              <option value="">Todas</option>
              {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="form-input">
              <option value="">Todos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <div className="col-span-full flex justify-end">
              <button onClick={limpiarFiltros} className="text-sm text-[#E63946] hover:underline">Limpiar filtros</button>
            </div>
          )}
        </div>
      )}

      {/* Tabla principal */}
      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Nombre</th>
                <th>Ciudad</th>
                <th>Tipo</th>
                <th className="text-center">Cant. Compras</th>
                <th className="text-right">Total Comprado</th>
                <th className="text-right">Última Venta</th>
                <th className="text-right">Monto Últ. Venta</th>
                <th>Último Producto</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
                : filtrados.length === 0
                ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Sin clientes</td></tr>
                : filtrados.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-medium">{c.nombre}</div>
                      {c.ruc && <div className="text-xs text-muted-foreground">RUC: {c.ruc}</div>}
                      {c.telefono && <div className="text-xs text-muted-foreground">{c.telefono}</div>}
                      {c.ultimo_contacto && <div className="text-xs text-blue-500">📅 {new Date(c.ultimo_contacto).toLocaleDateString('es-PY')}</div>}
                      {c.observaciones && <div className="text-xs text-muted-foreground italic truncate max-w-[160px]" title={c.observaciones}>{c.observaciones}</div>}
                    </td>
                    <td className="text-sm">{c.ciudad || '-'}</td>
                    <td>
                      <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>{c.tipo || '-'}</span>
                    </td>
                    <td className="text-center">
                      {c.cantidad_compras > 0
                        ? <span className="badge badge-success">{c.cantidad_compras}</span>
                        : <span className="text-muted-foreground text-sm">0</span>}
                    </td>
                    <td className="text-right font-mono font-semibold">{c.total_comprado ? formatGs(c.total_comprado) : <span className="text-muted-foreground">-</span>}</td>
                    <td className="text-right text-sm">
                      {c.ultima_venta_fecha
                        ? new Date(c.ultima_venta_fecha).toLocaleDateString('es-PY')
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="text-right font-mono text-sm">
                      {c.ultima_venta_monto ? formatGs(c.ultima_venta_monto) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="text-sm max-w-[180px] truncate" title={c.ultimo_producto}>
                      {c.ultimo_producto || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openHistorial(c)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Ver historial de ventas"><Eye size={16} /></button>
                        {canEdit   && <button onClick={() => openEdit(c)}       className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                        {canDelete && <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-red-50 rounded text-red-600"    title="Eliminar"><Trash size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Historial de Ventas */}
      <Modal isOpen={showHistorial} onClose={() => setShowHistorial(false)} title="Historial de Ventas" size="xl">
        {selectedCliente && (
          <div className="space-y-4">
            {/* Info cliente */}
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 rounded-lg p-3">
              <div>
                <span className="text-muted-foreground">Cliente</span>
                <div className="font-semibold">{selectedCliente.nombre}</div>
                <div className="text-xs text-muted-foreground">{selectedCliente.ciudad} · {selectedCliente.tipo}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Ventas totales</span>
                <div className="font-semibold text-lg text-blue-600">{historialStats.cantidad ?? selectedCliente.cantidad_compras ?? 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total comprado</span>
                <div className="font-semibold font-mono text-[#E63946]">{formatGs(historialStats.total ?? selectedCliente.total_comprado ?? 0)}</div>
              </div>
            </div>

            {/* Filtros historial */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/20 rounded-lg">
              <div className="form-group">
                <label className="form-label text-xs">Desde</label>
                <input type="date" value={hFechaDesde} onChange={e => setHFechaDesde(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Hasta</label>
                <input type="date" value={hFechaHasta} onChange={e => setHFechaHasta(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Total mín. (Gs.)</label>
                <input type="number" value={hTotalMin} onChange={e => setHTotalMin(e.target.value)} className="form-input" placeholder="0" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Ciudad</label>
                <input type="text" value={hCiudad} onChange={e => setHCiudad(e.target.value)} className="form-input" placeholder="Ej: Asunción" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Tipo cliente</label>
                <select value={hTipo} onChange={e => setHTipo(e.target.value)} className="form-input">
                  <option value="">Todos</option>
                  {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={() => { setHFechaDesde(''); setHFechaHasta(''); setHTotalMin(''); setHCiudad(''); setHTipo(''); openHistorial(selectedCliente); }}
                  className="text-sm px-3 py-1.5 border border-border rounded hover:bg-muted">Limpiar</button>
                <button onClick={aplicarFiltrosHistorial}
                  className="text-sm px-3 py-1.5 bg-[#E63946] text-white rounded hover:bg-[#D90429]">Aplicar</button>
              </div>
            </div>

            {/* Tabla historial */}
            {loadingHistorial ? (
              <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
            ) : historialVentas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Sin ventas registradas para este cliente</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Productos</th>
                      <th className="text-center">Ítems</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Utilidad</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialVentas.map((v, i) => {
                      const firstItem = (v.items || [])[0];
                      const productoLabel = firstItem
                        ? `${firstItem.nombre}${firstItem.variante ? ' | ' + firstItem.variante : ''}${v.items.length > 1 ? ` +${v.items.length - 1} más` : ''}`
                        : '-';
                      return (
                        <tr key={i}>
                          <td className="whitespace-nowrap">{v.fecha ? new Date(v.fecha).toLocaleDateString('es-PY') : '-'}</td>
                          <td className="text-sm max-w-[200px] truncate" title={productoLabel}>{productoLabel}</td>
                          <td className="text-center">
                            <span className="badge badge-success">{(v.items || []).length}</span>
                          </td>
                          <td className="text-right font-mono font-semibold">{formatGs(v.total || 0)}</td>
                          <td className="text-right font-mono text-green-600">{formatGs(v.utilidad || 0)}</td>
                          <td className="text-sm text-muted-foreground">{v.observaciones || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={3} className="text-right px-4 py-2">TOTAL:</td>
                      <td className="text-right font-mono px-4 py-2 text-[#E63946]">{formatGs(historialStats.total || 0)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Crear / Editar Cliente */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Cliente' : 'Nuevo Cliente'} size="md">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="form-input" data-testid="cliente-nombre" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">RUC</label><input type="text" value={form.ruc} onChange={e => setForm({...form, ruc: e.target.value})} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="form-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Ciudad</label><input type="text" value={form.ciudad} onChange={e => setForm({...form, ciudad: e.target.value})} className="form-input" /></div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="form-input">
                {TIPOS_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Dirección</label><input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="form-input" /></div>
          <div className="form-group">
            <label className="form-label">Último contacto</label>
            <input type="date" value={form.ultimo_contacto} onChange={e => setForm({...form, ultimo_contacto: e.target.value})} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} className="form-input" rows={3} placeholder="Notas adicionales..." style={{resize:'vertical'}} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="save-cliente-btn">{editItem ? 'Actualizar' : 'Crear'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== LEADS VIEW ====================
function LeadsView({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCanal, setFilterCanal] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [sortBy, setSortBy] = useState('fecha_primer_contacto');
  const [sortDir, setSortDir] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const emptyForm = { nombre: '', telefono: '', fecha_primer_contacto: '', canal_origen: '', fecha_ultimo_contacto: '', observaciones: '' };
  const [form, setForm] = useState(emptyForm);

  const isAdmin  = user?.role === 'admin';
  const canCreate = hasPermission(user, 'clientes', 'crear') || isAdmin;
  const canEdit   = hasPermission(user, 'clientes', 'editar') || isAdmin;
  const canDelete = hasPermission(user, 'clientes', 'eliminar') || isAdmin;

  const loadData = useCallback(() => {
    setLoading(true);
    api.getLeads({ search, canal: filterCanal || undefined, fecha_desde: filterFechaDesde || undefined, fecha_hasta: filterFechaHasta || undefined, sort_by: sortBy, sort_dir: sortDir })
      .then(r => setLeads(r.data.leads || []))
      .finally(() => setLoading(false));
  }, [search, filterCanal, filterFechaDesde, filterFechaHasta, sortBy, sortDir]);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew  = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (l) => {
    setEditItem(l);
    setForm({
      nombre: l.nombre,
      telefono: l.telefono,
      fecha_primer_contacto: l.fecha_primer_contacto || '',
      canal_origen: l.canal_origen || '',
      fecha_ultimo_contacto: l.fecha_ultimo_contacto || '',
      observaciones: l.observaciones || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre) return alert('El nombre es obligatorio');
    if (!form.telefono) return alert('El teléfono es obligatorio');
    if (!form.fecha_primer_contacto) return alert('La fecha de primer contacto es obligatoria');
    try {
      if (editItem) { await api.updateLead(editItem.id, form); }
      else          { await api.createLead(form); }
      setShowModal(false);
      loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este lead?')) return;
    try { await api.deleteLead(id); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const toggleSort = (field) => {
    if (sortBy === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-muted-foreground ml-1">↕</span>;
    return <span className="text-[#E63946] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const hasActiveFilters = filterCanal || filterFechaDesde || filterFechaHasta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm">Gestión de prospectos y seguimiento comercial</p>
        </div>
        {canCreate && (
          <button onClick={openNew} className="flex items-center gap-2 bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">
            <Plus size={16} /> Nuevo Lead
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-border rounded-md p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 w-full" />
          </div>
          <button onClick={() => setShowFilters(f => !f)} className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm ${hasActiveFilters ? 'border-[#E63946] text-[#E63946]' : 'border-border hover:bg-muted'}`}>
            <Funnel size={16} /> Filtros {hasActiveFilters && `(activos)`}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border">
            <div className="form-group">
              <label className="form-label">Canal de origen</label>
              <input type="text" value={filterCanal} onChange={e => setFilterCanal(e.target.value)} className="form-input" placeholder="Ej: Instagram, WhatsApp..." />
            </div>
            <div className="form-group">
              <label className="form-label">Primer contacto desde</label>
              <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Primer contacto hasta</label>
              <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} className="form-input" />
            </div>
            {hasActiveFilters && (
              <div className="col-span-full flex justify-end">
                <button onClick={() => { setFilterCanal(''); setFilterFechaDesde(''); setFilterFechaHasta(''); }} className="text-sm text-[#E63946] hover:underline">Limpiar filtros</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Nombre / Teléfono</th>
                <th>Canal Origen</th>
                <th className="cursor-pointer select-none" onClick={() => toggleSort('fecha_primer_contacto')}>
                  Primer Contacto <SortIcon field="fecha_primer_contacto" />
                </th>
                <th className="cursor-pointer select-none" onClick={() => toggleSort('fecha_ultimo_contacto')}>
                  Último Contacto <SortIcon field="fecha_ultimo_contacto" />
                </th>
                <th>Observaciones</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
                : leads.length === 0
                ? <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Sin leads registrados</td></tr>
                : leads.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="font-medium">{l.nombre}</div>
                      <div className="text-xs text-muted-foreground">{l.telefono}</div>
                    </td>
                    <td className="text-sm">
                      {l.canal_origen
                        ? <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>{l.canal_origen}</span>
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="text-sm whitespace-nowrap">
                      {l.fecha_primer_contacto
                        ? new Date(l.fecha_primer_contacto).toLocaleDateString('es-PY')
                        : '-'}
                    </td>
                    <td className="text-sm whitespace-nowrap">
                      {l.fecha_ultimo_contacto
                        ? new Date(l.fecha_ultimo_contacto).toLocaleDateString('es-PY')
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="text-sm text-muted-foreground max-w-[200px] truncate" title={l.observaciones}>
                      {l.observaciones || '-'}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit   && <button onClick={() => openEdit(l)}   className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                        {canDelete && <button onClick={() => handleDelete(l.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Eliminar"><Trash size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Lead */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Lead' : 'Nuevo Lead'} size="md">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="form-input" placeholder="Nombre del prospecto" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono *</label>
            <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="form-input" placeholder="Ej: 0981 123456" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha primer contacto *</label>
            <input type="date" value={form.fecha_primer_contacto} onChange={e => setForm({...form, fecha_primer_contacto: e.target.value})} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Canal de origen</label>
            <input type="text" value={form.canal_origen} onChange={e => setForm({...form, canal_origen: e.target.value})} className="form-input" placeholder="Ej: Instagram, WhatsApp, referido..." />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha último contacto</label>
            <input type="date" value={form.fecha_ultimo_contacto} onChange={e => setForm({...form, fecha_ultimo_contacto: e.target.value})} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} className="form-input" rows={3} placeholder="Notas sobre el prospecto..." style={{resize:'vertical'}} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]">{editItem ? 'Actualizar' : 'Crear'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== PROVEEDORES VIEW ====================
function ProveedoresView({ user }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Filtros comerciales
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterTotalMin, setFilterTotalMin] = useState('');
  const [filterCantMin, setFilterCantMin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedProv, setSelectedProv] = useState(null);
  const [historialCompras, setHistorialCompras] = useState([]);
  const [historialStats, setHistorialStats] = useState({});
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  // Filtros del historial
  const [hFechaDesde, setHFechaDesde] = useState('');
  const [hFechaHasta, setHFechaHasta] = useState('');
  const [hTotalMin, setHTotalMin]     = useState('');
  const [hCantMin, setHCantMin]       = useState('');

  const [form, setForm] = useState({ nombre: '', ruc: '', direccion: '', contacto: '', telefono: '' });
  const canCreate = hasPermission(user, 'proveedores', 'crear') || user?.role === 'admin';
  const canEdit   = hasPermission(user, 'proveedores', 'editar')   || user?.role === 'admin';
  const canDelete = hasPermission(user, 'proveedores', 'eliminar') || user?.role === 'admin';

  const loadData = useCallback(() => {
    setLoading(true);
    api.getProveedores({ search }).then(r => setProveedores(r.data.proveedores || [])).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const openNew  = () => { setEditItem(null); setForm({ nombre: '', ruc: '', direccion: '', contacto: '', telefono: '' }); setShowModal(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ nombre: p.nombre, ruc: p.ruc || '', direccion: p.direccion || '', contacto: p.contacto || '', telefono: p.telefono || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nombre) return alert('El nombre es obligatorio');
    try {
      if (editItem) { await api.updateProveedor(editItem.id, form); }
      else { await api.createProveedor(form); }
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;
    try { await api.deleteProveedor(id); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const openHistorial = async (prov, params = {}) => {
    setSelectedProv(prov);
    setShowHistorial(true);
    setLoadingHistorial(true);
    setHistorialCompras([]);
    try {
      const r = await api.getProveedorCompras(prov.id, params);
      setHistorialCompras(r.data.compras || []);
      setHistorialStats({ cantidad: r.data.cantidad_compras, total: r.data.total_comprado });
    } catch (e) { alert(formatApiError(e.response?.data?.detail || e.message)); }
    finally { setLoadingHistorial(false); }
  };

  const aplicarFiltrosHistorial = () => {
    if (!selectedProv) return;
    openHistorial(selectedProv, {
      fecha_desde: hFechaDesde || undefined,
      fecha_hasta: hFechaHasta || undefined,
      total_min:   hTotalMin   || undefined,
      cantidad_min: hCantMin   || undefined,
    });
  };

  // Filtros locales sobre la lista principal
  const filtrados = proveedores.filter(p => {
    if (filterFechaDesde && p.ultima_compra && p.ultima_compra < filterFechaDesde) return false;
    if (filterFechaHasta && p.ultima_compra && p.ultima_compra > filterFechaHasta + 'T23:59:59') return false;
    if (filterTotalMin && (p.total_comprado || 0) < parseFloat(filterTotalMin)) return false;
    if (filterCantMin  && (p.cantidad_compras || 0) < parseInt(filterCantMin))  return false;
    return true;
  });

  const hasActiveFilters = filterFechaDesde || filterFechaHasta || filterTotalMin || filterCantMin;

  return (
    <div className="space-y-6" data-testid="proveedores-view">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Proveedores</h2>
        {canCreate && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-proveedor-btn">
            <Plus size={18} /> Nuevo Proveedor
          </button>
        )}
      </div>

      {/* Búsqueda + botón filtros */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nombre, RUC, contacto..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" data-testid="proveedores-search" />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters || hasActiveFilters ? 'bg-[#E63946] text-white border-[#E63946]' : 'border-border hover:bg-muted'}`}>
          <Funnel size={16} /> Filtros {hasActiveFilters ? '●' : ''}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white border border-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label">Última compra desde</label>
            <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Última compra hasta</label>
            <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Total comprado mín. (Gs.)</label>
            <input type="number" value={filterTotalMin} onChange={e => setFilterTotalMin(e.target.value)} className="form-input" placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad compras mín.</label>
            <input type="number" value={filterCantMin} onChange={e => setFilterCantMin(e.target.value)} className="form-input" placeholder="0" min="0" />
          </div>
          {hasActiveFilters && (
            <div className="col-span-full flex justify-end">
              <button onClick={() => { setFilterFechaDesde(''); setFilterFechaHasta(''); setFilterTotalMin(''); setFilterCantMin(''); }}
                className="text-sm text-[#E63946] hover:underline">Limpiar filtros</button>
            </div>
          )}
        </div>
      )}

      {/* Tabla principal */}
      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Nombre</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th className="text-center">Cant. Compras</th>
                <th className="text-right">Total Comprado</th>
                <th className="text-right">Última Compra</th>
                <th className="text-right">Monto Últ. Compra</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
                : filtrados.length === 0
                ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Sin proveedores</td></tr>
                : filtrados.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-sm text-muted-foreground">{p.ruc || '-'}</td>
                    <td className="text-sm">{p.contacto || '-'}</td>
                    <td className="text-sm">{p.telefono || '-'}</td>
                    <td className="text-center">
                      {p.cantidad_compras > 0
                        ? <span className="badge badge-success">{p.cantidad_compras}</span>
                        : <span className="text-muted-foreground text-sm">0</span>}
                    </td>
                    <td className="text-right font-mono font-semibold">{formatGs(p.total_comprado || 0)}</td>
                    <td className="text-right text-sm">
                      {p.ultima_compra
                        ? new Date(p.ultima_compra).toLocaleDateString('es-PY')
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="text-right font-mono text-sm">{p.monto_ultima_compra ? formatGs(p.monto_ultima_compra) : <span className="text-muted-foreground">-</span>}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openHistorial(p)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Ver historial de compras"><Eye size={16} /></button>
                        {canEdit   && <button onClick={() => openEdit(p)}      className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                        {canDelete && <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-50 rounded text-red-600"    title="Eliminar"><Trash size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Historial de Compras */}
      <Modal isOpen={showHistorial} onClose={() => setShowHistorial(false)} title="Historial de Compras" size="xl">
        {selectedProv && (
          <div className="space-y-4">
            {/* Info proveedor */}
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 rounded-lg p-3">
              <div>
                <span className="text-muted-foreground">Proveedor</span>
                <div className="font-semibold">{selectedProv.nombre}</div>
                {selectedProv.ruc && <div className="text-xs text-muted-foreground">RUC: {selectedProv.ruc}</div>}
              </div>
              <div>
                <span className="text-muted-foreground">Compras totales</span>
                <div className="font-semibold text-lg text-blue-600">{historialStats.cantidad ?? selectedProv.cantidad_compras ?? 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Total comprado</span>
                <div className="font-semibold font-mono text-[#E63946]">{formatGs(historialStats.total ?? selectedProv.total_comprado ?? 0)}</div>
              </div>
            </div>

            {/* Filtros del historial */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg">
              <div className="form-group">
                <label className="form-label text-xs">Desde</label>
                <input type="date" value={hFechaDesde} onChange={e => setHFechaDesde(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Hasta</label>
                <input type="date" value={hFechaHasta} onChange={e => setHFechaHasta(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Total mín. (Gs.)</label>
                <input type="number" value={hTotalMin} onChange={e => setHTotalMin(e.target.value)} className="form-input" placeholder="0" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Cant. ítems mín.</label>
                <input type="number" value={hCantMin} onChange={e => setHCantMin(e.target.value)} className="form-input" placeholder="0" min="0" />
              </div>
              <div className="col-span-full flex gap-2 justify-end">
                <button onClick={() => { setHFechaDesde(''); setHFechaHasta(''); setHTotalMin(''); setHCantMin(''); openHistorial(selectedProv); }}
                  className="text-sm px-3 py-1.5 border border-border rounded hover:bg-muted">Limpiar</button>
                <button onClick={aplicarFiltrosHistorial}
                  className="text-sm px-3 py-1.5 bg-[#E63946] text-white rounded hover:bg-[#D90429]">Aplicar filtros</button>
              </div>
            </div>

            {/* Tabla historial */}
            {loadingHistorial ? (
              <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
            ) : historialCompras.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Sin compras registradas para este proveedor</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Factura</th>
                      <th className="text-center">Ítems</th>
                      <th className="text-right">Total</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialCompras.map((c, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap">{c.fecha ? new Date(c.fecha).toLocaleDateString('es-PY') : '-'}</td>
                        <td className="text-sm font-mono">{c.numero_factura || '-'}</td>
                        <td className="text-center">
                          <span className="badge badge-success">{(c.items || []).length}</span>
                        </td>
                        <td className="text-right font-mono font-semibold">{formatGs(c.total || 0)}</td>
                        <td className="text-sm text-muted-foreground">{c.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-semibold">
                    <tr>
                      <td colSpan={3} className="text-right px-4 py-2">TOTAL:</td>
                      <td className="text-right font-mono px-4 py-2 text-[#E63946]">{formatGs(historialStats.total || 0)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Crear / Editar Proveedor */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="md">
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="form-input" data-testid="proveedor-nombre" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">RUC</label><input type="text" value={form.ruc} onChange={(e) => setForm({...form, ruc: e.target.value})} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input type="text" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Contacto</label><input type="text" value={form.contacto} onChange={(e) => setForm({...form, contacto: e.target.value})} className="form-input" /></div>
          <div className="form-group"><label className="form-label">Dirección</label><input type="text" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} className="form-input" /></div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="save-proveedor-btn">{editItem ? 'Actualizar' : 'Crear'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== GASTOS VIEW ====================
function GastosView({ user }) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedGasto, setSelectedGasto] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [categorias] = useState(['Transporte', 'Marketing', 'Servicios', 'Operativos', 'Alquiler', 'Sueldos', 'Impuestos', 'Varios']);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0], categoria: '', descripcion: '',
    proveedor_id: '', proveedor_nombre: '', monto: 0, observaciones: '', comprobante_url: ''
  });
  const isAdmin = user?.role === 'admin';
  const canEdit = hasPermission(user, 'gastos', 'editar') || isAdmin;
  const canDelete = hasPermission(user, 'gastos', 'eliminar') || isAdmin;

  const loadData = useCallback(() => {
    setLoading(true);
    api.getGastos({ limit: 1000 }).then(r => setGastos(r.data.gastos || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    api.getProveedores({}).then(r => setProveedores(r.data.proveedores || []));
  }, [loadData]);

  const openNew = () => {
    setEditItem(null);
    setForm({ fecha: new Date().toISOString().split('T')[0], categoria: '', descripcion: '', proveedor_id: '', proveedor_nombre: '', monto: 0, observaciones: '', comprobante_url: '' });
    setShowModal(true);
  };

  const openEdit = (g) => {
    setEditItem(g);
    setForm({
      fecha: g.fecha ? g.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
      categoria: g.categoria || '', descripcion: g.descripcion || '',
      proveedor_id: g.proveedor_id || '', proveedor_nombre: g.proveedor_nombre || g.proveedor || '',
      monto: g.monto || 0, observaciones: g.observaciones || '', comprobante_url: g.comprobante_url || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.categoria || !form.descripcion || !form.monto) return alert('Complete los campos obligatorios');
    try {
      if (editItem) { await api.updateGasto(editItem.id, form); }
      else { await api.createGasto(form); }
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    try { await api.deleteGasto(id); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const filteredGastos = gastos.filter(g => {
    const matchSearch = !search || g.descripcion?.toLowerCase().includes(search.toLowerCase()) || g.categoria?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategoria || g.categoria === filterCategoria;
    const gFecha = g.fecha ? g.fecha.split('T')[0] : '';
    const matchDesde = !filterFechaDesde || gFecha >= filterFechaDesde;
    const matchHasta = !filterFechaHasta || gFecha <= filterFechaHasta;
    return matchSearch && matchCat && matchDesde && matchHasta;
  });

  const totalFiltrado = filteredGastos.reduce((s, g) => s + (g.monto || 0), 0);

  return (
    <div className="space-y-6" data-testid="gastos-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold">Gastos</h2>
          <p className="text-muted-foreground text-sm">Total filtrado: <span className="font-semibold text-foreground">{formatGs(totalFiltrado)}</span></p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-gasto-btn">
          <Plus size={18} /> Nuevo Gasto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-9" data-testid="gastos-search" />
          </div>
          <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="form-input">
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} className="form-input" placeholder="Desde" />
          <input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} className="form-input" placeholder="Hasta" />
        </div>
      </div>

      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Proveedor</th><th className="text-right">Monto</th><th className="text-center">Comp.</th><th className="text-center">Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr>
              : filteredGastos.length === 0 ? <tr><td colSpan={7} className="text-center py-8">Sin gastos registrados</td></tr>
              : filteredGastos.map(g => (
                <tr key={g.id}>
                  <td className="whitespace-nowrap">{new Date(g.fecha).toLocaleDateString('es-PY')}</td>
                  <td><span className="badge bg-orange-100 text-orange-800">{g.categoria}</span></td>
                  <td>{g.descripcion}</td>
                  <td className="text-sm">{g.proveedor_nombre || g.proveedor || '-'}</td>
                  <td className="text-right font-mono">{formatGs(g.monto)}</td>
                  <td className="text-center">{g.comprobante_url ? <a href={g.comprobante_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Ver comprobante"><LinkSimple size={16} /></a> : <span className="text-muted-foreground">-</span>}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setSelectedGasto(g); setShowDetailModal(true); }} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Ver"><Eye size={16} /></button>
                      {canEdit && <button onClick={() => openEdit(g)} className="p-1 hover:bg-yellow-50 rounded text-yellow-600" title="Editar"><Pencil size={16} /></button>}
                      {canDelete && <button onClick={() => handleDelete(g.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Eliminar"><Trash size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Detalle de Gasto" size="md">
        {selectedGasto && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Fecha:</span> <span className="font-medium">{new Date(selectedGasto.fecha).toLocaleDateString('es-PY')}</span></div>
              <div><span className="text-muted-foreground">Categoría:</span> <span className="badge bg-orange-100 text-orange-800">{selectedGasto.categoria}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Descripción:</span> <span className="font-medium">{selectedGasto.descripcion}</span></div>
              {(selectedGasto.proveedor_nombre || selectedGasto.proveedor) && <div><span className="text-muted-foreground">Proveedor:</span> <span className="font-medium">{selectedGasto.proveedor_nombre || selectedGasto.proveedor}</span></div>}
              <div><span className="text-muted-foreground">Monto:</span> <span className="font-semibold text-lg">{formatGs(selectedGasto.monto)}</span></div>
              {selectedGasto.observaciones && <div className="col-span-2"><span className="text-muted-foreground">Obs:</span> {selectedGasto.observaciones}</div>}
              {selectedGasto.comprobante_url && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Comprobante:</span>{' '}
                  <a href={selectedGasto.comprobante_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedGasto.comprobante_url}</a>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Gasto' : 'Nuevo Gasto'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Fecha *</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="form-input">
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="form-input" data-testid="gasto-descripcion" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Monto *</label>
              <input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })} className="form-input" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Proveedor (opcional)</label>
              <select value={form.proveedor_id} onChange={(e) => {
                const p = proveedores.find(pr => pr.id === e.target.value);
                setForm({ ...form, proveedor_id: e.target.value, proveedor_nombre: p?.nombre || '' });
              }} className="form-input">
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="form-input h-20 resize-none" />
          </div>
          <div className="form-group">
            <label className="form-label">URL Comprobante (opcional)</label>
            <input type="url" value={form.comprobante_url} onChange={(e) => setForm({ ...form, comprobante_url: e.target.value })} className="form-input" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="save-gasto-btn">
              {editItem ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==================== USUARIOS VIEW ====================
const MODULOS_CONFIG = [
  { key: 'dashboard', label: 'Dashboard', acciones: ['ver'], siempreVisible: true },
  { key: 'estadisticas', label: 'Estadísticas', acciones: ['ver'] },
  { key: 'productos', label: 'Productos', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { key: 'ventas', label: 'Ventas', acciones: ['ver', 'crear'] },
  { key: 'compras', label: 'Compras', acciones: ['ver', 'crear'] },
  { key: 'clientes', label: 'Clientes', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { key: 'proveedores', label: 'Proveedores', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
  { key: 'gastos', label: 'Gastos', acciones: ['ver', 'crear'] },
  { key: 'reportes', label: 'Reportes', acciones: ['ver'] },
  { key: 'stock_historial', label: 'Historial Stock', acciones: ['ver'] },
  { key: 'auditoria', label: 'Auditoría', acciones: ['ver'] },
  { key: 'usuarios', label: 'Usuarios', acciones: ['ver', 'crear', 'editar', 'eliminar'] },
];

const ACCION_LABELS = { ver: 'Ver', crear: 'Crear', editar: 'Editar', eliminar: 'Eliminar' };

function PermisosEditor({ permisos, onChange, disabled }) {
  const togglePermiso = (modulo, accion) => {
    if (disabled) return;
    const newPermisos = { ...permisos };
    if (!newPermisos[modulo]) newPermisos[modulo] = {};
    newPermisos[modulo] = { ...newPermisos[modulo], [accion]: !newPermisos[modulo][accion] };
    // If disabling 'ver', disable all other actions
    if (accion === 'ver' && !newPermisos[modulo][accion]) {
      Object.keys(newPermisos[modulo]).forEach(a => { if (a !== 'ver') newPermisos[modulo][a] = false; });
    }
    // If enabling any action, enable 'ver' too
    if (accion !== 'ver' && newPermisos[modulo][accion]) {
      newPermisos[modulo].ver = true;
    }
    onChange(newPermisos);
  };

  const toggleAll = (modulo, enable) => {
    if (disabled) return;
    const mod = MODULOS_CONFIG.find(m => m.key === modulo);
    const newPermisos = { ...permisos };
    newPermisos[modulo] = {};
    mod.acciones.forEach(a => { newPermisos[modulo][a] = enable; });
    onChange(newPermisos);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden" data-testid="permisos-editor">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Módulo</th>
            {Object.entries(ACCION_LABELS).map(([k, v]) => (
              <th key={k} className="text-center px-2 py-2 font-semibold w-20">{v}</th>
            ))}
            <th className="text-center px-2 py-2 w-16">Todo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {MODULOS_CONFIG.map(mod => {
            const isSiempreVisible = mod.siempreVisible;
            const modPermisos = isSiempreVisible ? { ver: true } : (permisos?.[mod.key] || {});
            const allEnabled = mod.acciones.every(a => modPermisos[a]);
            return (
              <tr key={mod.key} className={`hover:bg-muted/30 ${isSiempreVisible ? 'opacity-60' : ''}`}>
                <td className="px-3 py-2 font-medium">{mod.label}{isSiempreVisible ? ' (siempre)' : ''}</td>
                {Object.keys(ACCION_LABELS).map(accion => (
                  <td key={accion} className="text-center px-2 py-2">
                    {mod.acciones.includes(accion) ? (
                      <input
                        type="checkbox"
                        checked={isSiempreVisible ? true : !!modPermisos[accion]}
                        onChange={() => togglePermiso(mod.key, accion)}
                        disabled={disabled || isSiempreVisible}
                        className="w-4 h-4 accent-[#E63946] cursor-pointer"
                        data-testid={`perm-${mod.key}-${accion}`}
                      />
                    ) : <span className="text-muted-foreground">-</span>}
                  </td>
                ))}
                <td className="text-center px-2 py-2">
                  <input
                    type="checkbox"
                    checked={isSiempreVisible ? true : allEnabled}
                    onChange={() => toggleAll(mod.key, !allEnabled)}
                    disabled={disabled || isSiempreVisible}
                    className="w-4 h-4 accent-[#457B9D] cursor-pointer"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UsuariosView() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(null);
  const [editPermisos, setEditPermisos] = useState({});
  const [form, setForm] = useState({ email: '', password: '', nombre: '', role: 'usuario', permisos: {} });

  const getDefaultPermisos = () => {
    const p = {};
    MODULOS_CONFIG.forEach(m => { p[m.key] = {}; m.acciones.forEach(a => { p[m.key][a] = a === 'ver'; }); });
    return p;
  };

  const loadData = useCallback(() => { setLoading(true); api.getUsuarios().then(r => setUsuarios(r.data.usuarios || [])).finally(() => setLoading(false)); }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!form.email || !form.password || !form.nombre) return alert('Complete todos los campos');
    try {
      const payload = { ...form };
      if (payload.role === 'admin') payload.permisos = {};
      await api.createUsuario(payload);
      setShowModal(false); loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try { await api.deleteUsuario(id); loadData(); } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const toggleActive = async (u) => {
    try { await api.updateUsuario(u.id, { activo: u.activo === false ? true : false }); loadData(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const openPermisos = (u) => {
    setEditPermisos(u.permisos && Object.keys(u.permisos).length > 0 ? JSON.parse(JSON.stringify(u.permisos)) : getDefaultPermisos());
    setShowPermisosModal(u);
  };

  const savePermisos = async () => {
    try {
      await api.updateUsuario(showPermisosModal.id, { permisos: editPermisos });
      setShowPermisosModal(null);
      loadData();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const countPermisos = (permisos) => {
    if (!permisos || Object.keys(permisos).length === 0) return '0';
    let count = 0;
    Object.values(permisos).forEach(mod => { Object.values(mod).forEach(v => { if (v) count++; }); });
    return count;
  };

  return (
    <div className="space-y-6" data-testid="usuarios-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Usuarios</h2>
        <button onClick={() => { setForm({ email: '', password: '', nombre: '', role: 'usuario', permisos: getDefaultPermisos() }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#D90429]" data-testid="add-usuario-btn"><Plus size={18} /> Nuevo Usuario</button>
      </div>
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Buscar por usuario, nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" data-testid="usuarios-search" />
      </div>
      <div className="bg-white border border-border rounded-md">
        <table className="data-table">
          <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th className="text-center">Permisos</th><th>Estado</th><th className="text-center">Acciones</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-8">Cargando...</td></tr>
            : usuarios.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.nombre?.toLowerCase().includes(search.toLowerCase())).map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.email}</td>
                <td>{u.nombre || '-'}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role === 'admin' ? 'Administrador' : 'Usuario'}</span></td>
                <td className="text-center">
                  {u.role === 'admin'
                    ? <span className="text-xs text-muted-foreground">Acceso total</span>
                    : <button onClick={() => openPermisos(u)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100" data-testid={`edit-permisos-${u.id}`}>
                        {countPermisos(u.permisos)} permisos
                      </button>
                  }
                </td>
                <td><span className={`badge ${u.activo !== false ? 'badge-success' : 'badge-danger'}`}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {u.role !== 'admin' && <button onClick={() => openPermisos(u)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Editar permisos"><ShieldCheck size={16} /></button>}
                    <button onClick={() => toggleActive(u)} className={`p-1 rounded ${u.activo !== false ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`} title={u.activo !== false ? 'Desactivar' : 'Activar'}>{u.activo !== false ? <Lock size={16} /> : <Check size={16} />}</button>
                    <button onClick={() => handleDelete(u.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Eliminar"><Trash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Crear usuario */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Usuario" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Email/Usuario *</label><input type="text" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="form-input" data-testid="usuario-email" /></div>
            <div className="form-group"><label className="form-label">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="form-input" data-testid="usuario-nombre" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="form-label">Contraseña *</label><input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="form-input" data-testid="usuario-password" /></div>
            <div className="form-group"><label className="form-label">Rol</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="form-input"><option value="usuario">Usuario</option><option value="admin">Administrador</option></select></div>
          </div>
          {form.role === 'usuario' && (
            <div>
              <label className="form-label mb-2 block">Permisos por Módulo</label>
              <PermisosEditor permisos={form.permisos} onChange={(p) => setForm({...form, permisos: p})} />
            </div>
          )}
          {form.role === 'admin' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
              Los administradores tienen acceso completo a todos los módulos.
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={handleSave} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="save-usuario-btn">Crear Usuario</button>
          </div>
        </div>
      </Modal>

      {/* Editar permisos */}
      <Modal isOpen={!!showPermisosModal} onClose={() => setShowPermisosModal(null)} title={`Permisos: ${showPermisosModal?.nombre || showPermisosModal?.email || ''}`} size="xl">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Configura qué puede hacer este usuario en cada sección del sistema. Si desmarcas "Ver", se desactivan todas las acciones de ese módulo.</p>
          <PermisosEditor permisos={editPermisos} onChange={setEditPermisos} />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowPermisosModal(null)} className="px-4 py-2 border border-border rounded-md hover:bg-muted">Cancelar</button>
            <button onClick={savePermisos} className="bg-[#E63946] text-white px-4 py-2 rounded-md hover:bg-[#D90429]" data-testid="save-permisos-btn">Guardar Permisos</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReportesView() { const exportCSV = (t) => window.open(`${API_URL}/api/reportes/${t}?formato=csv`, '_blank'); return (<div className="space-y-6" data-testid="reportes-view"><h2 className="text-2xl font-heading font-semibold">Reportes</h2><div className="bg-white border border-border rounded-md p-6"><h3 className="font-semibold mb-4">Exportar Reportes</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><button onClick={() => exportCSV('ventas')} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted"><FileText size={24} className="text-green-600" /><div className="text-left"><p className="font-medium">Ventas CSV</p></div></button><button onClick={() => exportCSV('productos')} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted"><Package size={24} className="text-blue-600" /><div className="text-left"><p className="font-medium">Inventario CSV</p></div></button><button onClick={() => exportCSV('stock-movimientos')} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted"><ClockCounterClockwise size={24} className="text-orange-600" /><div className="text-left"><p className="font-medium">Mov. Stock CSV</p></div></button></div></div></div>); }
function StockHistorialView() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [search, setSearch] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterTipo) params.tipo = filterTipo;
    if (filterFechaDesde) params.fecha_desde = filterFechaDesde;
    if (filterFechaHasta) params.fecha_hasta = filterFechaHasta;
    api.getStockMovimientos(params).then(r => setMovimientos(r.data.movimientos || [])).finally(() => setLoading(false));
  }, [filterTipo, filterFechaDesde, filterFechaHasta]);

  useEffect(() => { loadData(); }, [loadData]);

  const ORIGEN_MAP = { 'compra': 'Compra', 'venta': 'Venta', 'ajuste': 'Ajuste manual', 'devolucion': 'Devolución' };
  const TIPO_BADGE = { 'entrada': 'badge-success', 'salida': 'badge-warning', 'ajuste': 'bg-blue-100 text-blue-800' };

  const filtered = movimientos.filter(m =>
    !search || m.producto_nombre?.toLowerCase().includes(search.toLowerCase()) || m.variante?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="stock-historial-view">
      <h2 className="text-2xl font-heading font-semibold">Historial de Stock</h2>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-9" />
          </div>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="form-input">
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>
          <input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} className="form-input" />
          <input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} className="form-input" />
        </div>
      </div>

      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Referencia</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">Anterior</th>
                <th className="text-right">Nuevo</th>
                <th className="text-right">Costo Unit.</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10} className="text-center py-8">Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={10} className="text-center py-8">Sin movimientos</td></tr>
              : filtered.map(m => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-sm">{new Date(m.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>
                    <div className="font-medium text-sm">{m.producto_nombre}</div>
                    {m.variante && <div className="text-xs text-muted-foreground">Variante: {m.variante}</div>}
                  </td>
                  <td><span className={`badge ${TIPO_BADGE[m.tipo] || 'badge-warning'}`}>{m.tipo}</span></td>
                  <td className="text-sm">{ORIGEN_MAP[m.referencia_tipo] || m.referencia_tipo || '-'}</td>
                  <td className="text-sm font-mono text-muted-foreground">{m.referencia_id ? m.referencia_id.slice(0, 8) + '…' : '-'}</td>
                  <td className={`text-right font-mono font-medium ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                  </td>
                  <td className="text-right text-muted-foreground">{m.stock_anterior}</td>
                  <td className="text-right font-medium">{m.stock_nuevo}</td>
                  <td className="text-right text-sm">{m.costo_unitario ? formatGs(m.costo_unitario) : '-'}</td>
                  <td className="text-sm">{m.usuario_email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function AuditoriaView() { const [registros, setRegistros] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getAuditoria({}).then(r => setRegistros(r.data.registros || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="auditoria-view"><h2 className="text-2xl font-heading font-semibold">Auditoría</h2><div className="bg-white border border-border rounded-md"><div className="overflow-x-auto max-h-[600px]"><table className="data-table"><thead className="sticky top-0 bg-white"><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Detalle</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> : registros.map(r => (<tr key={r.id}><td className="text-sm">{new Date(r.fecha).toLocaleString('es-PY')}</td><td className="font-medium">{r.usuario_email}</td><td><span className="badge bg-muted">{r.accion}</span></td><td className="capitalize">{r.modulo}</td><td className="text-sm text-muted-foreground max-w-xs truncate">{JSON.stringify(r.detalle)}</td></tr>))}</tbody></table></div></div></div>); }

// Main App

// ============ INVENTARIO VIEW ============
const InventarioView = () => {
  const { user } = useAuth();
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    if (user) loadInventario();
  }, [user]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { if (user) loadInventario(); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadInventario = async () => {
    try {
      setLoading(true);
      const resp = await api.getInventario({ search });
      setInventario(resp.data.inventario || []);
    } catch (e) {
      alert('Error al cargar inventario: ' + formatApiError(e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (item) => {
    try {
      setLoadingDetalle(true);
      setShowDetalle(true);
      setSelectedProducto(item);
      setMovimientos([]);
      const resp = await api.getInventarioDetalle(item.id);
      setMovimientos(resp.data.movimientos || []);
    } catch (e) {
      alert('Error al cargar detalle: ' + formatApiError(e.response?.data?.detail || e.message));
    } finally {
      setLoadingDetalle(false);
    }
  };

  const totalValor = inventario.reduce((s, i) => s + (i.valor_stock || 0), 0);
  const sinStock   = inventario.filter(i => i.stock_actual <= 0).length;
  const totalCosto = inventario.reduce((s, i) => s + (i.costo_promedio || 0), 0);

  const tipoLabel = (tipo) => {
    if (tipo === 'entrada')  return <span className="badge badge-success">Entrada</span>;
    if (tipo === 'salida')   return <span className="badge badge-danger">Salida</span>;
    if (tipo === 'ajuste')   return <span className="badge badge-warning">Ajuste</span>;
    return <span className="badge">{tipo}</span>;
  };

  const refLabel = (ref) => {
    if (ref === 'compra')  return 'Compra';
    if (ref === 'venta')   return 'Venta';
    if (ref === 'ajuste')  return 'Ajuste manual';
    if (ref === 'inicial') return 'Stock inicial';
    return ref || '-';
  };

  return (
    <div className="space-y-6" data-testid="inventario-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Inventario</h2>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valor Total Stock</p>
          <p className="text-xl font-semibold text-[#E63946] font-mono">{formatGs(totalValor)}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Productos Activos</p>
          <p className="text-xl font-semibold text-blue-600">{inventario.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Sin Stock</p>
          <p className={`text-xl font-semibold ${sinStock > 0 ? 'text-red-600' : 'text-green-600'}`}>{sinStock}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por producto, código o variante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Tabla principal */}
      <div className="bg-white border border-border rounded-md">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="data-table">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Variante</th>
                <th className="text-right">Stock</th>
                <th className="text-right">Costo Prom.</th>
                <th className="text-right">Precio Venta</th>
                <th className="text-right">Valor Stock</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Cargando inventario...</td></tr>
              ) : inventario.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Sin productos en inventario</td></tr>
              ) : inventario.map((item) => {
                const sinStockItem = item.stock_actual <= 0;
                return (
                  <tr key={item.id}>
                    <td className="text-sm text-muted-foreground font-mono">{item.codigo}</td>
                    <td className="font-medium">{item.nombre}</td>
                    <td className="text-sm text-muted-foreground">{item.variante || '-'}</td>
                    <td className={`text-right font-semibold ${sinStockItem ? 'text-red-600' : item.stock_actual <= 3 ? 'text-yellow-600' : 'text-green-700'}`}>
                      {item.stock_actual}
                    </td>
                    <td className="text-right font-mono text-sm">{formatGs(item.costo_promedio)}</td>
                    <td className="text-right font-mono text-sm">{formatGs(item.precio_venta)}</td>
                    <td className="text-right font-mono font-semibold">{formatGs(item.valor_stock)}</td>
                    <td className="text-center">
                      {sinStockItem
                        ? <span className="badge badge-danger">Sin stock</span>
                        : item.stock_actual <= 3
                        ? <span className="badge badge-warning">Bajo</span>
                        : <span className="badge badge-success">OK</span>}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleVerDetalle(item)}
                        className="p-1 hover:bg-blue-50 rounded text-blue-600"
                        title="Ver historial de movimientos"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {inventario.length > 0 && (
              <tfoot className="bg-muted font-semibold sticky bottom-0">
                <tr>
                  <td colSpan={6} className="text-right px-4 py-3">TOTAL VALOR INVENTARIO:</td>
                  <td className="text-right font-mono px-4 py-3 text-[#E63946]">{formatGs(totalValor)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Historial de Movimientos */}
      <Modal isOpen={showDetalle} onClose={() => setShowDetalle(false)} title="Historial de Movimientos" size="xl">
        {selectedProducto && (
          <div className="space-y-4">
            {/* Info del producto */}
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/30 rounded-lg p-3">
              <div>
                <span className="text-muted-foreground">Producto</span>
                <div className="font-medium">{selectedProducto.nombre}</div>
                {selectedProducto.variante && <div className="text-xs text-muted-foreground">Variante: {selectedProducto.variante}</div>}
              </div>
              <div>
                <span className="text-muted-foreground">Stock Actual</span>
                <div className={`font-semibold text-lg ${selectedProducto.stock_actual <= 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {selectedProducto.stock_actual}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Costo Promedio</span>
                <div className="font-semibold font-mono">{formatGs(selectedProducto.costo_promedio)}</div>
                <div className="text-xs text-muted-foreground">Valor stock: {formatGs(selectedProducto.valor_stock)}</div>
              </div>
            </div>

            {/* Tabla de movimientos */}
            {loadingDetalle ? (
              <div className="text-center py-8 text-muted-foreground">Cargando movimientos...</div>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Sin movimientos registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th className="text-center">Tipo</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">Costo Unit.</th>
                      <th className="text-right">Stock Ant.</th>
                      <th className="text-right">Stock Nuevo</th>
                      <th>Referencia</th>
                      <th>Motivo / Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov, idx) => (
                      <tr key={idx}>
                        <td className="whitespace-nowrap text-sm">
                          {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-PY') : '-'}
                        </td>
                        <td className="text-center">{tipoLabel(mov.tipo)}</td>
                        <td className={`text-right font-mono font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : mov.tipo === 'salida' ? 'text-red-600' : 'text-yellow-600'}`}>
                          {mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : '±'}{Math.abs(mov.cantidad)}
                        </td>
                        <td className="text-right font-mono text-sm">{formatGs(mov.costo_unitario || 0)}</td>
                        <td className="text-right font-mono text-sm text-muted-foreground">{mov.stock_anterior ?? '-'}</td>
                        <td className="text-right font-mono text-sm font-medium">{mov.stock_nuevo ?? '-'}</td>
                        <td className="text-sm">{refLabel(mov.referencia_tipo)}</td>
                        <td className="text-sm text-muted-foreground">
                          <div>{mov.motivo || '-'}</div>
                          {mov.usuario_email && <div className="text-xs">{mov.usuario_email}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};


function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => { api.getMe().then(r => setUser(r.data)).catch(() => setUser(null)).finally(() => setAuthChecked(true)); }, []);

  const handleLogout = async () => { try { await api.logout(); } catch {} setUser(null); setActiveView('dashboard'); };

  if (!authChecked) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-16 h-16 bg-[#E63946] rounded-2xl flex items-center justify-center animate-pulse"><span className="text-white font-heading font-bold text-2xl">pds</span></div></div>);
  if (!user) return <LoginPage onLogin={setUser} />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView user={user} />;
      case 'estadisticas': return <EstadisticasView />;
      case 'productos': return <ProductosView user={user} />;
      case 'ventas': return <VentasView user={user} />;
      case 'compras': return <ComprasView user={user} />;
      case 'clientes': return <ClientesView user={user} />;
      case 'leads': return <LeadsView user={user} />;
      case 'proveedores': return <ProveedoresView user={user} />;
      case 'gastos': return <GastosView user={user} />;
      case 'inventario': return <InventarioView />;
      case 'reportes': return <ReportesView />;
      case 'stock-historial': return <StockHistorialView />;
      case 'usuarios': return <UsuariosView />;
      case 'auditoria': return <AuditoriaView />;
      case 'perfil': return <PerfilView user={user} onProfileUpdate={() => checkAuth()} />;
      default: return <DashboardView user={user} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="min-h-screen bg-background">
        <Sidebar activeView={activeView} setActiveView={setActiveView} user={user} onLogout={handleLogout} onNavigate={setActiveView} />
        <main className="ml-64 p-8">{renderView()}</main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
