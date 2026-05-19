import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Plus, X, Search, Edit2, Trash2, Calendar, CheckCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Pedidos = () => {
  const { pedidos, agregarPedido, editarPedido, eliminarPedido, productos, categorias } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPedidoId, setEditPedidoId] = useState(null);
  
  const [nuevoPedido, setNuevoPedido] = useState({
    productoId: '',
    categoria: '',
    cantidad: '',
    fechaPedido: new Date().toISOString().split('T')[0],
    fechaEntrega: ''
  });
  
  const [busqueda, setBusqueda] = useState('');
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  const pedidosFiltrados = pedidos.filter(p => {
    const prod = productos.find(pr => pr.id === p.productoId);
    const nombreProd = prod ? prod.nombre.toLowerCase() : '';
    return nombreProd.includes(busqueda.toLowerCase()) || 
           (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()));
  });

  // Filtrar productos basados en la categoría seleccionada si hay una
  const productosDisponibles = nuevoPedido.categoria 
    ? productos.filter(p => p.categoria === nuevoPedido.categoria)
    : productos;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      editarPedido(editPedidoId, {
        productoId: nuevoPedido.productoId,
        categoria: nuevoPedido.categoria,
        cantidad: parseInt(nuevoPedido.cantidad),
        fechaPedido: nuevoPedido.fechaPedido,
        fechaEntrega: nuevoPedido.fechaEntrega,
        stockSumado: false // Esto permite que se sume el stock si antes no tenía fechaEntrega
      });
    } else {
      agregarPedido({
        productoId: nuevoPedido.productoId,
        categoria: nuevoPedido.categoria,
        cantidad: parseInt(nuevoPedido.cantidad),
        fechaPedido: nuevoPedido.fechaPedido,
        fechaEntrega: nuevoPedido.fechaEntrega,
        stockSumado: false
      });
    }
    cerrarModal();
  };

  const abrirModalNuevo = () => {
    setEditMode(false);
    setEditPedidoId(null);
    setNuevoPedido({ 
      productoId: '', 
      categoria: '', 
      cantidad: '', 
      fechaPedido: new Date().toISOString().split('T')[0], 
      fechaEntrega: '' 
    });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (pedido) => {
    setEditMode(true);
    setEditPedidoId(pedido.id);
    setNuevoPedido({
      productoId: pedido.productoId,
      categoria: pedido.categoria || '',
      cantidad: pedido.cantidad,
      fechaPedido: pedido.fechaPedido,
      fechaEntrega: pedido.fechaEntrega || ''
    });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = (pedido) => {
    setPedidoAEliminar(pedido);
  };

  const handleConfirmarEntrega = (pedido) => {
    const hoy = new Date().toISOString().split('T')[0];
    editarPedido(pedido.id, {
      ...pedido,
      fechaEntrega: hoy,
    });
  };

  const getNombreProducto = (id) => {
    const p = productos.find(prod => prod.id === id);
    return p ? p.nombre : 'Producto Desconocido';
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Registra la entrada de mercancía • <span className="num_productos">{pedidos.length}</span> pedidos registrados</p>
        </div>
        <button className="btn-primary" onClick={abrirModalNuevo}>
          <Plus size={18} />
          Registrar Pedido
        </button>
      </div>

      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por producto o categoría..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No hay pedidos registrados.
        </div>
      ) : (
        <div className="mesas-grid">
          {pedidosFiltrados.map(pedido => (
            <div key={pedido.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>#{pedido.codigo}</span>
                    <span className="badge-categoria">{pedido.categoria || 'N/A'}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', lineHeight: 1.3 }}>{getNombreProducto(pedido.productoId)}</h3>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 170, 0, 0.1)', padding: '8px 12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255, 170, 0, 0.2)' }}>
                  <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 700, fontSize: '18px' }}>+{pedido.cantidad}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uds</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 0', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <Calendar size={16} />
                  <span>Pedido: <strong style={{ color: 'var(--text-main)', fontWeight: 500 }}>{pedido.fechaPedido}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  {pedido.fechaEntrega ? (
                    <>
                      <CheckCircle size={16} color="var(--success)" />
                      <span>Entregado: <strong style={{ color: 'var(--success)', fontWeight: 600 }}>{pedido.fechaEntrega}</strong></span>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></div>
                      </div>
                      <span style={{ color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.5px' }}>EN CAMINO</span>
                    </>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                {!pedido.fechaEntrega && (
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '13px', marginRight: 'auto' }} 
                    onClick={() => handleConfirmarEntrega(pedido)}
                    title="Confirmar Entrega y Sumar Stock"
                  >
                    <CheckCircle size={14} style={{ marginRight: '6px' }} />
                    Confirmar Entrega
                  </button>
                )}
                
                {!pedido.fechaEntrega && (
                  <button className="btn-icon" onClick={() => abrirModalEditar(pedido)} title="Editar">
                    <Edit2 size={18} />
                  </button>
                )}
                <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(pedido)} title="Eliminar">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? 'Editar Pedido' : 'Registrar Pedido'}</h2>
              <button className="close-btn" onClick={cerrarModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  className="form-control" 
                  value={nuevoPedido.categoria}
                  onChange={e => {
                    setNuevoPedido({...nuevoPedido, categoria: e.target.value, productoId: ''})
                  }}
                >
                  <option value="">Seleccione una categoría (Opcional para filtrar)</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
                <div style={{ marginTop: '6px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>¿Es una categoría nueva? </span>
                  <Link to="/categorias" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>¡Agrégala aquí!</Link>
                </div>
              </div>

              <div className="form-group">
                <label>Producto</label>
                <select 
                  className="form-control" 
                  required
                  value={nuevoPedido.productoId}
                  onChange={e => {
                    const selectedProd = productos.find(p => p.id === e.target.value);
                    setNuevoPedido({...nuevoPedido, productoId: e.target.value, categoria: selectedProd ? selectedProd.categoria : nuevoPedido.categoria})
                  }}
                >
                  <option value="" disabled>Seleccione un producto</option>
                  {productosDisponibles.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nombre} (Stock: {prod.stock})</option>
                  ))}
                </select>
                <div style={{ marginTop: '6px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>¿Es un producto nuevo? </span>
                  <Link to="/productos" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>¡Agrégalo aquí!</Link>
                </div>
              </div>

              <div className="form-group">
                <label>Cantidad Solicitada</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  min="1"
                  value={nuevoPedido.cantidad}
                  onChange={e => setNuevoPedido({...nuevoPedido, cantidad: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Fecha de Pedido</label>
                <input 
                  type="date" 
                  className="form-control" 
                  required
                  value={nuevoPedido.fechaPedido}
                  onChange={e => setNuevoPedido({...nuevoPedido, fechaPedido: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Fecha de Llegada / Entrega (Opcional)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={nuevoPedido.fechaEntrega}
                  onChange={e => setNuevoPedido({...nuevoPedido, fechaEntrega: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{editMode ? 'Guardar Cambios' : 'Registrar Pedido'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Pedido */}
      {pedidoAEliminar && (
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Eliminar Pedido</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.
                {pedidoAEliminar.fechaEntrega && ' (El stock ya sumado no se restará automáticamente).'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }} 
                onClick={() => setPedidoAEliminar(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px', display: 'flex' }} 
                onClick={() => {
                  eliminarPedido(pedidoAEliminar.id);
                  setPedidoAEliminar(null);
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

export default Pedidos;
