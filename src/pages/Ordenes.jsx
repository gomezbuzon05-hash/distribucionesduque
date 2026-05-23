import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import PageTransition from '../components/PageTransition';
import { Check, X, Clock, User, Armchair, ClipboardList, DollarSign, Wallet } from 'lucide-react';

const Ordenes = () => {
  const { ordenesMesas, confirmarOrdenMesa, rechazarOrdenMesa, usuarios, recaudarCajaUsuario } = useContext(AppContext);
  
  const [isRecaudarModalOpen, setIsRecaudarModalOpen] = useState(false);
  const [meseroSeleccionado, setMeseroSeleccionado] = useState(null);
  const [montoRecaudar, setMontoRecaudar] = useState('');

  // Filtrar solo las órdenes pendientes (con fallback seguro)
  const ordenesPendientes = (ordenesMesas || []).filter(o => o.estado === 'pendiente');

  // Historial de órdenes confirmadas
  const ordenesConfirmadas = (ordenesMesas || []).filter(o => o.estado === 'entregada').sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Filtrar meseros para la tabla de control de caja
  const meserosConCaja = (usuarios || []).filter(u => u.rol === 'Usuario' || (u.caja && u.caja > 0));

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatearFechaCorta = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('en-US'); // MM/DD/YYYY
  };

  const handleRecaudarClick = (mesero) => {
    setMeseroSeleccionado(mesero);
    setMontoRecaudar(mesero.caja || 0);
    setIsRecaudarModalOpen(true);
  };

  const handleRecaudarSubmit = (e) => {
    e.preventDefault();
    const monto = parseFloat(montoRecaudar);
    if (monto > 0 && meseroSeleccionado) {
      recaudarCajaUsuario(meseroSeleccionado.id, monto);
      setIsRecaudarModalOpen(false);
      setMeseroSeleccionado(null);
    }
  };

  return (
    <PageTransition>
      {/* ─────────────────────────────────────────────────────────
          SECCIÓN 1: ÓRDENES PENDIENTES
      ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes Pendientes</h1>
          <p className="page-subtitle">Revisa y confirma las solicitudes de los meseros.</p>
        </div>
      </div>

      {ordenesPendientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>No hay órdenes pendientes</h3>
          <p>Todas las solicitudes han sido procesadas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
          {ordenesPendientes.map(orden => {
            const total = orden.productos ? orden.productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0) : 0;
            return (
              <div key={orden.id} className="receipt-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="receipt-header">
                  <h2>MESA #{orden.numeroMesa || '?'}</h2>
                  <p><strong>MESERO:</strong> {orden.usuario || 'Desconocido'}</p>
                  <p>Fecha: {orden.fecha ? formatearFechaCorta(orden.fecha) : '--/--/----'}</p>
                  <p>Hora: {orden.fecha ? formatearFecha(orden.fecha) : '--:--'}</p>
                </div>
                
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Item</th>
                      <th style={{ textAlign: 'center', width: '20%' }}>Ctd</th>
                      <th style={{ textAlign: 'right', width: '30%' }}>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.productos && orden.productos.map((prod, idx) => (
                      <tr key={idx}>
                        <td>{prod.nombre}</td>
                        <td style={{ textAlign: 'center' }}>{prod.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>${prod.precio.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!orden.productos || orden.productos.length === 0) && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '16px 0' }}>Sin productos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                <div className="receipt-total" style={{ marginBottom: '24px' }}>
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px dashed #ccc', paddingTop: '16px' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, justifyContent: 'center', color: '#ef4444', borderColor: '#ef4444', backgroundColor: 'transparent' }}
                    onClick={() => rechazarOrdenMesa(orden.id)}
                  >
                    <X size={16} /> Rechazar
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, justifyContent: 'center', backgroundColor: '#10b981', color: 'white', border: 'none' }}
                    onClick={() => confirmarOrdenMesa(orden.id)}
                  >
                    <Check size={16} /> Confirmar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN 2: CONTROL DE CAJAS (MESEROS)
      ────────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginTop: '48px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={24} color="var(--primary)" />
            Control de Cajas
          </h1>
          <p className="page-subtitle">Monitorea y recauda el efectivo que poseen los meseros.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mesero</th>
              <th>Efectivo Actual en Caja</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {meserosConCaja.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay meseros registrados.</td></tr>
            ) : (
              meserosConCaja.map(mesero => (
                <tr key={mesero.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} />
                      {mesero.nombre}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold', color: (mesero.caja || 0) > 0 ? '#10b981' : 'var(--text-main)' }}>
                    ${(mesero.caja || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-primary"
                      onClick={() => handleRecaudarClick(mesero)}
                      disabled={!mesero.caja || mesero.caja <= 0}
                    >
                      <DollarSign size={16} /> Recaudar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Recaudar Dinero */}
      {isRecaudarModalOpen && meseroSeleccionado && (
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Recaudar Dinero</h2>
              <button className="btn-icon" onClick={() => setIsRecaudarModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRecaudarSubmit} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mesero</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={meseroSeleccionado.nombre} 
                    disabled 
                    style={{ paddingLeft: '44px', backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'transparent', opacity: 0.8 }} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dinero a Recaudar</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                  <input 
                    type="number" 
                    className="form-control" 
                    value={montoRecaudar}
                    onChange={(e) => setMontoRecaudar(e.target.value)}
                    min="1"
                    max={meseroSeleccionado.caja || 0}
                    step="0.01"
                    required
                    autoFocus
                    style={{ 
                      paddingLeft: '44px', 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      height: '60px', 
                      color: 'var(--primary)',
                      backgroundColor: 'rgba(255, 170, 0, 0.05)',
                      borderColor: 'rgba(255, 170, 0, 0.2)'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Monto sugerido (total en caja)</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    Máx: ${(meseroSeleccionado.caja || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsRecaudarModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>Confirmar Recaudación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          SECCIÓN 3: HISTORIAL DE ÓRDENES (FACTURAS)
      ────────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginTop: '48px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={24} color="var(--primary)" />
            Historial de Órdenes
          </h1>
          <p className="page-subtitle">Facturas de las órdenes que ya han sido entregadas y procesadas.</p>
        </div>
      </div>

      {ordenesConfirmadas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>No hay historial</h3>
          <p>Aún no se han confirmado órdenes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
          {ordenesConfirmadas.map(orden => {
            const total = orden.productos ? orden.productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0) : 0;
            return (
              <div key={orden.id} className="receipt-card">
                <div className="receipt-header">
                  <h2>MESA #{orden.numeroMesa}</h2>
                  <p><strong>MESERO:</strong> {orden.usuario || 'Usuario'}</p>
                  <p>Fecha: {orden.fecha ? formatearFechaCorta(orden.fecha) : '--/--/----'}</p>
                  <p>Hora: {orden.fecha ? formatearFecha(orden.fecha) : '--:--'}</p>
                </div>
                
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Item</th>
                      <th style={{ textAlign: 'center', width: '20%' }}>Ctd</th>
                      <th style={{ textAlign: 'right', width: '30%' }}>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.productos && orden.productos.map((prod, idx) => (
                      <tr key={idx}>
                        <td>{prod.nombre}</td>
                        <td style={{ textAlign: 'center' }}>{prod.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>${prod.precio.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="receipt-total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </PageTransition>
  );
};

export default Ordenes;
