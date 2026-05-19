import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, X, Search, Minus, Armchair, CheckCircle, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Mesas = () => {
  const { 
    mesas, agregarMesa, abrirMesa, abonarMesa, productos, 
    agregarProductoAMesa, actualizarCantidadProductoMesa, cerrarMesa 
  } = useContext(AppContext);
  
  const [filtro, setFiltro] = useState('todas');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nuevaMesaNum, setNuevaMesaNum] = useState('');
  
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null);
  const mesaSeleccionada = mesas.find(m => m.id === mesaSeleccionadaId) || null;
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [titular, setTitular] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);

  const mesasFiltradas = mesas.filter(m => {
    if (filtro === 'ocupadas') return m.estado === 'ocupada';
    if (filtro === 'desocupadas') return m.estado === 'desocupada';
    return true;
  });

  const handleAgregarMesa = (e) => {
    e.preventDefault();
    agregarMesa(nuevaMesaNum);
    setIsAddModalOpen(false);
    setNuevaMesaNum('');
  };

  const handleMesaClick = (mesa) => {
    setMesaSeleccionadaId(mesa.id);
    if (mesa.estado === 'desocupada') {
      setTitular('');
    }
    setIsDetailsModalOpen(true);
    setBusquedaProducto('');
    setMontoAbono('');
  };

  const handleAbrirMesa = (e) => {
    e.preventDefault();
    abrirMesa(mesaSeleccionada.id, titular);
    // El estado local ya no se actualiza manualmente porque se deriva del contexto
  };

  const handleCerrarMesa = () => {
    setIsConfirmCloseModalOpen(true);
  };

  const calcularTotalMesa = () => {
    if (!mesaSeleccionada || !mesaSeleccionada.productos) return 0;
    return mesaSeleccionada.productos.reduce((total, p) => {
      const prodInfo = productos.find(prod => prod.id === p.productoId);
      return total + (prodInfo ? prodInfo.precio * p.cantidad : 0);
    }, 0);
  };

  const calcularTotalMesaCard = (mesa) => {
    if (!mesa || !mesa.productos) return 0;
    return mesa.productos.reduce((total, p) => {
      const prodInfo = productos.find(prod => prod.id === p.productoId);
      return total + (prodInfo ? prodInfo.precio * p.cantidad : 0);
    }, 0);
  };

  const handleAbonar = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAbono);
    if (monto > 0) {
      abonarMesa(mesaSeleccionada.id, monto);
      setMontoAbono('');
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mesas</h1>
          <p className="page-subtitle">{mesas.length} mesas en total</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Nueva Mesa
        </button>
      </div>

      <div className="mesas-filters">
        <button 
          className={`filter-btn ${filtro === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: filtro === 'todas' ? 'var(--bg-dark)' : 'transparent', border: '1px solid currentColor' }}></div>
          Todas <span style={{ opacity: 0.7 }}>{mesas.length}</span>
        </button>
        <button 
          className={`filter-btn ${filtro === 'ocupadas' ? 'active' : ''}`}
          onClick={() => setFiltro('ocupadas')}
        >
          <User size={14} />
          Ocupadas <span style={{ opacity: 0.7 }}>{mesas.filter(m => m.estado === 'ocupada').length}</span>
        </button>
        <button 
          className={`filter-btn ${filtro === 'desocupadas' ? 'active' : ''}`}
          onClick={() => setFiltro('desocupadas')}
        >
          <CheckCircle size={14} />
          Desocupadas <span style={{ opacity: 0.7 }}>{mesas.filter(m => m.estado === 'desocupada').length}</span>
        </button>
      </div>

      <div className="mesas-grid">
        {mesasFiltradas.map(mesa => (
          <div 
            key={mesa.id} 
            className={`mesa-card ${mesa.estado === 'ocupada' ? 'ocupada' : ''}`}
            onClick={() => handleMesaClick(mesa)}
          >
            <div className={`status-dot ${mesa.estado}`}></div>
            <div className="mesa-icon">
              <Armchair size={32} />
            </div>
            <div className="mesa-info">
              <h3>Mesa {mesa.numero}</h3>
              {mesa.estado === 'ocupada' ? (
                <>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} /> {mesa.titular}
                  </p>
                  <p style={{ marginTop: '4px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                      ${Math.max(0, calcularTotalMesaCard(mesa) - (mesa.abonos || 0)).toLocaleString()}
                    </span>{' '}
                    <span style={{ fontSize: '12px' }}>pendiente</span>
                  </p>
                </>
              ) : (
                <p>Disponible</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Agregar Mesa */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Agregar Nueva Mesa</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAgregarMesa}>
              <div className="form-group">
                <label>Número o Nombre de Mesa</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={nuevaMesaNum}
                  onChange={e => setNuevaMesaNum(e.target.value)}
                  placeholder="Ej: 10, VIP, Barra 1"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear Mesa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles Mesa */}
      {isDetailsModalOpen && mesaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <div>
                <h2>Mesa {mesaSeleccionada.numero}</h2>
                <p className="page-subtitle" style={{ marginTop: '4px' }}>
                  {mesaSeleccionada.estado === 'ocupada' ? `Atendiendo a: ${mesaSeleccionada.titular}` : 'Mesa desocupada'}
                </p>
              </div>
              <button className="close-btn" onClick={() => setIsDetailsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {mesaSeleccionada.estado === 'desocupada' ? (
              <form onSubmit={handleAbrirMesa}>
                <div className="form-group">
                  <label>Nombre del Titular (Cliente)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    value={titular}
                    onChange={e => setTitular(e.target.value)}
                    placeholder="Ingrese nombre"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="submit" className="btn-primary">Abrir Mesa</button>
                </div>
              </form>
            ) : (
              <div className="mesa-details-grid">
                <div>
                  <div className="product-search">
                    <Search className="search-icon" size={18} />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Buscar producto..."
                      value={busquedaProducto}
                      onChange={e => setBusquedaProducto(e.target.value)}
                    />
                    {busquedaProducto && (
                      <div className="search-results">
                        {productosFiltrados.length > 0 ? (
                          productosFiltrados.map(prod => (
                            <div 
                              key={prod.id} 
                              className="search-item"
                              onClick={() => {
                                agregarProductoAMesa(mesaSeleccionada.id, prod);
                                // El estado se actualiza automáticamente desde el Contexto
                                setBusquedaProducto('');
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 500 }}>{prod.nombre}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>${prod.precio} - Stock: {prod.stock}</div>
                              </div>
                              <Plus size={18} color="var(--primary)" />
                            </div>
                          ))
                        ) : (
                          <div className="search-item" style={{ color: 'var(--text-muted)' }}>No se encontraron productos.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 style={{ marginBottom: 12, fontSize: 16 }}>Consumo Actual</h3>
                  <div className="order-list">
                    {mesaSeleccionada.productos?.length > 0 ? (
                      mesaSeleccionada.productos.map(item => {
                        const prod = productos.find(p => p.id === item.productoId);
                        if (!prod) return null;
                        return (
                          <div key={item.productoId} className="order-item">
                            <div className="order-item-info">
                              <div className="order-item-name">{prod.nombre}</div>
                              <div className="order-item-price">${prod.precio} c/u</div>
                            </div>
                            <div className="qty-control">
                              <button 
                                className="qty-btn"
                                onClick={() => {
                                  actualizarCantidadProductoMesa(mesaSeleccionada.id, item.productoId, -1);
                                  // Context update is enough
                                }}
                              >
                                <Minus size={14} />
                              </button>
                              <span style={{ width: 20, textAlign: 'center', fontWeight: 600 }}>{item.cantidad}</span>
                              <button 
                                className="qty-btn"
                                onClick={() => {
                                  actualizarCantidadProductoMesa(mesaSeleccionada.id, item.productoId, 1);
                                  // Context update is enough
                                }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>
                              ${(prod.precio * item.cantidad).toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                        No hay productos agregados a esta mesa.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="order-summary" style={{ flex: 1, margin: 0, borderRadius: 16 }}>
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>${calcularTotalMesa().toLocaleString()}</span>
                    </div>
                    {mesaSeleccionada.abonos > 0 && (
                      <div className="summary-row" style={{ color: '#4caf50' }}>
                        <span>Abonos recibidos</span>
                        <span>-${mesaSeleccionada.abonos.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="summary-row total" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                      <span>Por Pagar</span>
                      <span>${Math.max(0, calcularTotalMesa() - (mesaSeleccionada.abonos || 0)).toLocaleString()}</span>
                    </div>

                    <form onSubmit={handleAbonar} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="Abonar cantidad..." 
                        value={montoAbono}
                        onChange={e => setMontoAbono(e.target.value)}
                        min="1"
                        style={{ padding: '10px 12px', fontSize: '14px' }}
                      />
                      <button type="submit" className="btn-secondary" style={{ padding: '10px 16px' }}>Abonar</button>
                    </form>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Método de Pago</label>
                      <select 
                        className="form-control" 
                        value={metodoPago} 
                        onChange={(e) => setMetodoPago(e.target.value)}
                        style={{ padding: '10px 12px', fontSize: '14px', backgroundColor: 'var(--bg-dark)' }}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px', marginTop: 'auto' }}
                      onClick={handleCerrarMesa}
                    >
                      Cerrar Mesa y Cobrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Confirmación Cierre Mesa */}
      {isConfirmCloseModalOpen && mesaSeleccionada && (
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255, 170, 0, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Cerrar Mesa {mesaSeleccionada.numero}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas cerrar esta mesa y cobrar <strong style={{ color: 'var(--text-main)' }}>${Math.max(0, calcularTotalMesa() - (mesaSeleccionada.abonos || 0)).toLocaleString()}</strong> en <strong style={{ color: 'var(--primary)' }}>{metodoPago}</strong>?
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }} 
                onClick={() => setIsConfirmCloseModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }} 
                onClick={() => {
                  cerrarMesa(mesaSeleccionada.id, metodoPago);
                  setIsConfirmCloseModalOpen(false);
                  setIsDetailsModalOpen(false);
                  setMesaSeleccionadaId(null);
                }}
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Mesas;
