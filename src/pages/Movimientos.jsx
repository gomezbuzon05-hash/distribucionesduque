import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Activity, Clock, Calendar, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Movimientos = () => {
  const { movimientos } = useContext(AppContext);

  return (
    <PageTransition>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>Historial en tiempo real de acciones y cambios</p>
        </div>
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
    </PageTransition>
  );
};

export default Movimientos;
