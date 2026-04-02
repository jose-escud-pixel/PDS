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
  ShareNetwork, Globe, LockSimple, UsersThree, Copy, BookmarkSimple
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
  getDashboard: () => axios.get(`${API_URL}/api/dashboard`),
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
  getProductos: (p) => axios.get(`${API_URL}/api/productos`, { params: p }),
  createProducto: (d) => axios.post(`${API_URL}/api/productos`, d),
  updateProducto: (id, d) => axios.put(`${API_URL}/api/productos/${id}`, d),
  deleteProducto: (id) => axios.delete(`${API_URL}/api/productos/${id}`),
  ajustarStock: (id, d) => axios.post(`${API_URL}/api/productos/${id}/ajuste-stock`, d),
  getCategorias: () => axios.get(`${API_URL}/api/categorias`),
  getClientes: (p) => axios.get(`${API_URL}/api/clientes`, { params: p }),
  createCliente: (d) => axios.post(`${API_URL}/api/clientes`, d),
  updateCliente: (id, d) => axios.put(`${API_URL}/api/clientes/${id}`, d),
  deleteCliente: (id) => axios.delete(`${API_URL}/api/clientes/${id}`),
  getProveedores: (p) => axios.get(`${API_URL}/api/proveedores`, { params: p }),
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
function Sidebar({ activeView, setActiveView, user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const check = (m) => isAdmin || user?.permisos?.[m]?.ver;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House, visible: check('dashboard') },
    { id: 'estadisticas', label: 'Estadísticas', icon: ChartLine, visible: check('reportes') },
    { id: 'productos', label: 'Productos', icon: Package, visible: check('productos') },
    { id: 'ventas', label: 'Ventas', icon: ShoppingCart, visible: check('ventas') },
    { id: 'compras', label: 'Compras', icon: Receipt, visible: check('compras') },
    { id: 'clientes', label: 'Clientes', icon: Users, visible: check('clientes') },
    { id: 'proveedores', label: 'Proveedores', icon: Truck, visible: check('proveedores') },
    { id: 'gastos', label: 'Gastos', icon: Money, visible: check('gastos') },
    { id: 'reportes', label: 'Reportes', icon: FileText, visible: check('reportes') },
    { id: 'stock-historial', label: 'Historial Stock', icon: ClockCounterClockwise, visible: check('reportes') },
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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><UserCircle size={24} className="text-muted-foreground" /></div>
          <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{user?.nombre || user?.email}</p><p className="text-xs text-muted-foreground capitalize">{user?.role}</p></div>
        </div>
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

  const isAdmin = user?.role === 'admin';

  const loadData = useCallback(async () => {
    try {
      const [dashRes, templatesRes, configRes, ventasP, comprasP, prodVend, ventasC, stockCat, gastosCat, comprasProv, metasRes, plantillasRes] = await Promise.all([
        api.getDashboard(),
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
  }, []);

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
      case 'stat-utilidad': return <WidgetStatCard label="Utilidad Bruta" value={formatGs(resumen?.utilidad_bruta)} icon={TrendUp} color="success" />;
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
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getVentasPorPeriodo({ periodo, limite: 12 }),
      api.getComprasPorPeriodo({ periodo, limite: 12 }),
      api.getProductosMasVendidos({ limite: 15 }),
      api.getVentasPorCliente({ limite: 10 }),
      api.getStockPorCategoria(),
      api.getGastosPorCategoria(),
      api.getResumenGeneral()
    ]).then(([vp, cp, pmv, vc, sc, gc, res]) => {
      setData({
        ventasPeriodo: vp.data.data || [],
        comprasPeriodo: cp.data.data || [],
        productosMasVendidos: pmv.data.data || [],
        ventasCliente: vc.data.data || [],
        stockCategoria: sc.data.data || [],
        gastosCategoria: gc.data.data || [],
        resumen: res.data
      });
    }).finally(() => setLoading(false));
  }, [periodo]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6" data-testid="estadisticas-view">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-semibold">Estadísticas</h2>
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="form-input w-40">
          <option value="dia">Por Día</option>
          <option value="semana">Por Semana</option>
          <option value="mes">Por Mes</option>
          <option value="año">Por Año</option>
        </select>
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
    </div>
  );
}

// Simplified other views
function ProductosView({ user }) { const [productos, setProductos] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); useEffect(() => { api.getProductos(search ? { search } : {}).then(r => setProductos(r.data.productos || [])).finally(() => setLoading(false)); }, [search]); return (<div className="space-y-6" data-testid="productos-view"><div className="flex items-center justify-between"><h2 className="text-2xl font-heading font-semibold">Productos</h2></div><div className="relative max-w-md"><MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input pl-10" /></div><div className="bg-white border border-border rounded-md overflow-hidden"><table className="data-table"><thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th className="text-right">Precio</th><th className="text-center">Stock</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> : productos.length === 0 ? <tr><td colSpan={5} className="text-center py-8">Sin productos</td></tr> : productos.map(p => (<tr key={p.id}><td className="font-mono text-sm">{p.codigo}</td><td className="font-medium">{p.nombre}</td><td><span className="badge bg-muted text-foreground">{p.categoria}</span></td><td className="text-right price-gs">{formatGs(p.precio_con_iva)}</td><td className="text-center"><span className={p.stock < p.stock_minimo ? 'text-red-600 font-semibold' : 'text-green-600'}>{p.stock}</span></td></tr>))}</tbody></table></div></div>); }
function VentasView() { const [ventas, setVentas] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getVentas({}).then(r => setVentas(r.data.ventas || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="ventas-view"><h2 className="text-2xl font-heading font-semibold">Ventas</h2><div className="bg-white border border-border rounded-md"><table className="data-table"><thead><tr><th>Fecha</th><th>Cliente</th><th className="text-right">Total</th><th className="text-right">Utilidad</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : ventas.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin ventas</td></tr> : ventas.map(v => (<tr key={v.id}><td>{new Date(v.fecha).toLocaleDateString('es-PY')}</td><td className="font-medium">{v.cliente_nombre}</td><td className="text-right price-gs">{formatGs(v.total)}</td><td className="text-right price-gs text-green-600">{formatGs(v.utilidad)}</td></tr>))}</tbody></table></div></div>); }
function ComprasView() { const [compras, setCompras] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getCompras({}).then(r => setCompras(r.data.compras || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="compras-view"><h2 className="text-2xl font-heading font-semibold">Compras</h2><div className="bg-white border border-border rounded-md"><table className="data-table"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th className="text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : compras.length === 0 ? <tr><td colSpan={4} className="text-center py-8">Sin compras</td></tr> : compras.map(c => (<tr key={c.id}><td>{new Date(c.fecha).toLocaleDateString('es-PY')}</td><td className="font-medium">{c.proveedor_nombre}</td><td>{c.factura || '-'}</td><td className="text-right price-gs">{formatGs(c.total)}</td></tr>))}</tbody></table></div></div>); }
function ClientesView() { const [clientes, setClientes] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getClientes({}).then(r => setClientes(r.data.clientes || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="clientes-view"><h2 className="text-2xl font-heading font-semibold">Clientes</h2><div className="bg-white border border-border rounded-md"><table className="data-table"><thead><tr><th>Nombre</th><th>Teléfono</th><th>Ciudad</th><th className="text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : clientes.map(c => (<tr key={c.id}><td className="font-medium">{c.nombre}</td><td>{c.telefono || '-'}</td><td>{c.ciudad || '-'}</td><td className="text-right price-gs">{formatGs(c.total_compras || 0)}</td></tr>))}</tbody></table></div></div>); }
function ProveedoresView() { const [proveedores, setProveedores] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getProveedores({}).then(r => setProveedores(r.data.proveedores || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="proveedores-view"><h2 className="text-2xl font-heading font-semibold">Proveedores</h2><div className="bg-white border border-border rounded-md"><table className="data-table"><thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th className="text-right">Total</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : proveedores.map(p => (<tr key={p.id}><td className="font-medium">{p.nombre}</td><td>{p.contacto || '-'}</td><td>{p.telefono || '-'}</td><td className="text-right price-gs">{formatGs(p.total_compras || 0)}</td></tr>))}</tbody></table></div></div>); }
function GastosView() { const [gastos, setGastos] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getGastos({}).then(r => setGastos(r.data.gastos || [])).finally(() => setLoading(false)); }, []); const total = gastos.reduce((s, g) => s + (g.monto || 0), 0); return (<div className="space-y-6" data-testid="gastos-view"><div><h2 className="text-2xl font-heading font-semibold">Gastos</h2><p className="text-muted-foreground">Total: {formatGs(total)}</p></div><div className="bg-white border border-border rounded-md"><table className="data-table"><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th className="text-right">Monto</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : gastos.map(g => (<tr key={g.id}><td>{new Date(g.fecha).toLocaleDateString('es-PY')}</td><td><span className="badge bg-orange-100 text-orange-800">{g.categoria}</span></td><td>{g.descripcion}</td><td className="text-right price-gs">{formatGs(g.monto)}</td></tr>))}</tbody></table></div></div>); }
function ReportesView() { const exportCSV = (t) => window.open(`${API_URL}/api/reportes/${t}?formato=csv`, '_blank'); return (<div className="space-y-6" data-testid="reportes-view"><h2 className="text-2xl font-heading font-semibold">Reportes</h2><div className="bg-white border border-border rounded-md p-6"><h3 className="font-semibold mb-4">Exportar Reportes</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><button onClick={() => exportCSV('ventas')} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted"><FileText size={24} className="text-green-600" /><div className="text-left"><p className="font-medium">Ventas CSV</p></div></button><button onClick={() => exportCSV('productos')} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted"><Package size={24} className="text-blue-600" /><div className="text-left"><p className="font-medium">Inventario CSV</p></div></button><button onClick={() => exportCSV('stock-movimientos')} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted"><ClockCounterClockwise size={24} className="text-orange-600" /><div className="text-left"><p className="font-medium">Mov. Stock CSV</p></div></button></div></div></div>); }
function StockHistorialView() { const [movimientos, setMovimientos] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getStockMovimientos({}).then(r => setMovimientos(r.data.movimientos || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="stock-historial-view"><h2 className="text-2xl font-heading font-semibold">Historial Stock</h2><div className="bg-white border border-border rounded-md"><div className="overflow-x-auto max-h-[600px]"><table className="data-table"><thead className="sticky top-0 bg-white"><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th className="text-right">Cant.</th><th className="text-right">Anterior</th><th className="text-right">Nuevo</th><th>Usuario</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="text-center py-8">Cargando...</td></tr> : movimientos.map(m => (<tr key={m.id}><td className="text-sm">{new Date(m.fecha).toLocaleString('es-PY')}</td><td className="font-medium">{m.producto_nombre}</td><td><span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : 'badge-warning'}`}>{m.tipo}</span></td><td className="text-right font-mono">{m.cantidad}</td><td className="text-right text-muted-foreground">{m.stock_anterior}</td><td className="text-right font-medium">{m.stock_nuevo}</td><td className="text-sm">{m.usuario_email || '-'}</td></tr>))}</tbody></table></div></div></div>); }
function UsuariosView() { const [usuarios, setUsuarios] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getUsuarios().then(r => setUsuarios(r.data.usuarios || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="usuarios-view"><h2 className="text-2xl font-heading font-semibold">Usuarios</h2><div className="bg-white border border-border rounded-md"><table className="data-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr> : usuarios.map(u => (<tr key={u.id}><td className="font-medium">{u.email}</td><td>{u.nombre || '-'}</td><td><span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span></td><td><span className={`badge ${u.activo !== false ? 'badge-success' : 'badge-danger'}`}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span></td></tr>))}</tbody></table></div></div>); }
function AuditoriaView() { const [registros, setRegistros] = useState([]); const [loading, setLoading] = useState(true); useEffect(() => { api.getAuditoria({}).then(r => setRegistros(r.data.registros || [])).finally(() => setLoading(false)); }, []); return (<div className="space-y-6" data-testid="auditoria-view"><h2 className="text-2xl font-heading font-semibold">Auditoría</h2><div className="bg-white border border-border rounded-md"><div className="overflow-x-auto max-h-[600px]"><table className="data-table"><thead className="sticky top-0 bg-white"><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Detalle</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr> : registros.map(r => (<tr key={r.id}><td className="text-sm">{new Date(r.fecha).toLocaleString('es-PY')}</td><td className="font-medium">{r.usuario_email}</td><td><span className="badge bg-muted">{r.accion}</span></td><td className="capitalize">{r.modulo}</td><td className="text-sm text-muted-foreground max-w-xs truncate">{JSON.stringify(r.detalle)}</td></tr>))}</tbody></table></div></div></div>); }

// Main App
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
      case 'ventas': return <VentasView />;
      case 'compras': return <ComprasView />;
      case 'clientes': return <ClientesView />;
      case 'proveedores': return <ProveedoresView />;
      case 'gastos': return <GastosView />;
      case 'reportes': return <ReportesView />;
      case 'stock-historial': return <StockHistorialView />;
      case 'usuarios': return <UsuariosView />;
      case 'auditoria': return <AuditoriaView />;
      default: return <DashboardView user={user} />;
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
