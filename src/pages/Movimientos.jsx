import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Activity, Clock, Calendar, User, Trash2, Lock, X } from 'lucide-react';
import { deleteDocument, addDocument } from '../firebase/Services';
import { auth } from '../firebase/firebase';
import PageTransition from '../components/PageTransition';

const CODIGO_VERIFICACION = '7415';

const Movimientos = () => {
  const { movimientos } = useContext(AppContext);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [codigoError, setCodigoError] = useState(false);
  const [limpiando, setLimpiando] = useState(false);

  const handleLimpiar = () => {
    setShowCleanModal(true);
    setCodigoInput('');
    setCodigoError(false);
  };

  const confirmarLimpieza = async () => {
    if (codigoInput !== CODIGO_VERIFICACION) {
      setCodigoError(true);
      return;
    }

    setLimpiando(true);
    try {
      const ahora = new Date();
      const limite = new Date(ahora.getTime() - 24 * 60 * 60 * 1000); // 24 horas atrás

      const movimientosAntiguos = movimientos.filter(m => {
        const fechaMovimiento = new Date(m.fecha);
        return fechaMovimiento < limite;
      });

      if (movimientosAntiguos.length === 0) {
        setShowCleanModal(false);
        setLimpiando(false);
        return;
      }

      // Eliminar todos los movimientos con más de 24 horas
      const deletePromises = movimientosAntiguos.map(m => 
        deleteDocument('movimientos', m.id)
      );
      await Promise.all(deletePromises);

      // Registrar el movimiento de limpieza
      const user = auth.currentUser;
      const nombreUsuario = user?.displayName || user?.email || 'Usuario';
      const fechaActual = new Date();

      await addDocument('movimientos', {
        usuario: nombreUsuario,
        accion: `Limpió ${movimientosAntiguos.length} movimiento(s) con más de 24 horas`,
        fecha: fechaActual.toISOString(),
        hora: fechaActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setShowCleanModal(false);
    } catch (error) {
      console.error('Error al limpiar movimientos:', error);
    } finally {
      setLimpiando(false);
    }
  };

  // Contar cuántos movimientos tienen más de 24h
  const ahora = new Date();
  const limite24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const cantidadAntiguos = movimientos.filter(m => new Date(m.fecha) < limite24h).length;

  return (
    <PageTransition>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>Historial en tiempo real de acciones y cambios</p>
        </div>
        <button 
          className="btn-danger" 
          onClick={handleLimpiar}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '8px'
          }}
        >
          <Trash2 size={16} />
          Limpiar ({cantidadAntiguos})
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-color)' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción o cambio</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hora</th>
              </tr>
            </thead>
            <tbody>
              {movimientos && movimientos.length > 0 ? (
                movimientos.map((movimiento, idx) => (
                  <tr 
                    key={movimiento.id || idx} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.2s ease',
                    }}
                    className="hover-row"
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <User size={16} />
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '14px' }}>{movimiento.usuario}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', opacity: 0.8 }}>
                          <Activity size={16} />
                        </div>
                        <span style={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.4' }}>{movimiento.accion}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        <Calendar size={14} style={{ opacity: 0.7 }} />
                        {new Date(movimiento.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '12px' }}>
                        <Clock size={14} style={{ opacity: 0.7 }} />
                        <span style={{ fontWeight: 500 }}>{movimiento.hora}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Activity size={40} style={{ opacity: 0.2 }} />
                      <p style={{ fontSize: '15px' }}>No hay movimientos registrados aún.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de verificación para limpiar */}
      {showCleanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'flex-end', marginBottom: '0' }}>
              <button className="close-btn" onClick={() => setShowCleanModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Lock size={28} />
              </div>
              <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Verificación Requerida</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>
                Se eliminarán <strong style={{ color: 'var(--text-main)' }}>{cantidadAntiguos}</strong> movimiento(s) con más de 24 horas.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Ingresa el código de verificación para continuar.
              </p>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                className="form-control"
                placeholder="Código de verificación"
                value={codigoInput}
                onChange={(e) => { setCodigoInput(e.target.value); setCodigoError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && confirmarLimpieza()}
                autoFocus
                style={{ 
                  textAlign: 'center', 
                  fontSize: '20px', 
                  letterSpacing: '8px',
                  borderColor: codigoError ? '#ff5252' : 'var(--border-color)'
                }}
              />
              {codigoError && (
                <p style={{ color: '#ff5252', fontSize: '13px', marginTop: '8px' }}>
                  Código incorrecto. Intenta de nuevo.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                onClick={() => setShowCleanModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={confirmarLimpieza}
                disabled={limpiando}
              >
                {limpiando ? 'Limpiando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Movimientos;
