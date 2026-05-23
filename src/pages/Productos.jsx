import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, X, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Productos = ({ userData }) => {
  const { productos, agregarProducto, editarProducto, eliminarProducto, categorias } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editProductoId, setEditProductoId] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    categoria: '',
    stock: ''
  });
  const [busqueda, setBusqueda] = useState('');
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const productosStockBajo = productos.filter(p => p.stock < 50).sort((a, b) => a.stock - b.stock);

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      editarProducto(editProductoId, {
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        categoria: nuevoProducto.categoria,
        stock: parseInt(nuevoProducto.stock)
      });
    } else {
      agregarProducto({
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        categoria: nuevoProducto.categoria,
        stock: parseInt(nuevoProducto.stock)
      });
    }
    cerrarModal();
  };

  const abrirModalNuevo = () => {
    setEditMode(false);
    setEditProductoId(null);
    setNuevoProducto({ nombre: '', precio: '', categoria: '', stock: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setEditMode(true);
    setEditProductoId(producto.id);
    setNuevoProducto({
      nombre: producto.nombre,
      precio: producto.precio,
      categoria: producto.categoria,
      stock: producto.stock
    });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setNuevoProducto({ nombre: '', precio: '', categoria: '', stock: '' });
  };

  const handleDelete = (producto) => {
    setProductoAEliminar(producto);
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Gestiona el inventario de tu local • <span className="num_productos">{productos.length}</span> productos en total</p>
        </div>
        {userData?.rol === 'SuperAdministrador' && (
          <button className="btn-primary" onClick={abrirModalNuevo}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        )}
      </div>

      {productosStockBajo.length > 0 && (
        <div className="stock-alert-banner">
          <div className="stock-alert-header">
            <AlertTriangle size={18} />
            <span>Stock bajo (menos de 50 unidades)</span>
          </div>
          <div className="stock-alert-list">
            {productosStockBajo.map((p, i) => (
              <span key={p.id} className="stock-alert-item">
                {p.nombre} ({p.stock} uds.){i < productosStockBajo.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o categoría..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map(producto => (
              <tr key={producto.id}>
                <td style={{ fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginRight: '8px', fontWeight: 500 }}>
                    #{producto.codigo}
                  </span>
                  {producto.nombre}
                </td>
                <td>
                  <span className="badge-categoria">{producto.categoria}</span>
                </td>
                <td>
                  <span className={`badge-stock ${producto.stock < 50 ? 'warning' : 'normal'}`}>
                    {producto.stock} uds.
                  </span>
                  {producto.stock < 50 && (
                    <AlertTriangle size={14} className="stock-warning-icon" />
                  )}
                </td>
                <td className="table-price">${producto.precio.toLocaleString()}</td>
                <td style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  {userData?.rol === 'SuperAdministrador' && (
                    <>
                      <button className="btn-icon" onClick={() => abrirModalEditar(producto)} title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(producto)} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
              <button className="close-btn" onClick={cerrarModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={nuevoProducto.nombre}
                  onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Precio</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  min="0"
                  step="100"
                  value={nuevoProducto.precio}
                  onChange={e => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  className="form-control" 
                  required
                  value={nuevoProducto.categoria}
                  onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                >
                  <option value="" disabled>Seleccione una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{editMode ? 'Stock Actual' : 'Stock Inicial'}</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  min="0"
                  value={nuevoProducto.stock}
                  onChange={e => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
                  disabled={editMode}
                  style={editMode ? { backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: 'var(--text-muted)' } : {}}
                />
                {editMode && (
                  <small style={{ color: 'var(--primary)', marginTop: '4px', display: 'block' }}>
                    El stock se gestiona automáticamente mediante los <strong>Pedidos</strong> y ventas.
                  </small>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{editMode ? 'Guardar Cambios' : 'Guardar Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmar Eliminar Producto */}
      {productoAEliminar && (
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Eliminar Producto</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar <strong style={{ color: 'var(--text-main)' }}>{productoAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }} 
                onClick={() => setProductoAEliminar(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px', display: 'flex' }} 
                onClick={() => {
                  eliminarProducto(productoAEliminar.id);
                  setProductoAEliminar(null);
                }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Productos;
