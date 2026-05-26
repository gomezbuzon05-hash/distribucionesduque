import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useOutletContext } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { Wallet, Send, Clock, CheckCircle, DollarSign, TrendingDown, User } from 'lucide-react';

const Caja = () => {
  const userData = useOutletContext();
  const { usuarios, solicitudesCaja, crearSolicitudCaja, confirmarSolicitudCaja } = useContext(AppContext);
  const [monto, setMonto] = useState('');

  const esAdmin = userData?.rol === 'Administrador' || userData?.rol === 'SuperAdministrador';

  // Obtener datos actuales del mesero logueado
  const meseroActual = (usuarios || []).find(u => u.uid === userData?.uid);
  const cajaActual = meseroActual?.caja || 0;

  // Solicitudes de este mesero
  const misSolicitudes = (solicitudesCaja || []).filter(s => s.usuarioId === meseroActual?.id);
  const solicitudesPendientes = misSolicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesConfirmadas = misSolicitudes.filter(s => s.estado === 'confirmada');

  const handleSubmit = (e) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (montoNum > 0 && montoNum <= cajaActual) {
      crearSolicitudCaja(montoNum);
      setMonto('');
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-MX', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // ── Admin data ──
  const meserosConCaja = esAdmin ? (usuarios || []).filter(u => u.rol === 'Usuario' || (u.caja && u.caja > 0)) : [];
  const todasSolicitudesPendientes = esAdmin ? (solicitudesCaja || []).filter(s => s.estado === 'pendiente') : [];
  const todasSolicitudesConfirmadas = esAdmin ? (solicitudesCaja || []).filter(s => s.estado === 'confirmada') : [];

  // ════════════════════════════════════════════════════════════
  //  VISTA ADMIN
  // ════════════════════════════════════════════════════════════
  if (esAdmin) {
    return (
      <PageTransition>
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Wallet size={28} color="var(--primary)" />
              Caja — Administración
            </h1>
            <p className="page-subtitle">Recibe las entregas de dinero de los meseros y monitorea sus saldos.</p>
          </div>
        </div>

        {/* ─── SOLICITUDES PENDIENTES DE MESEROS ─────────────── */}
        <h2 style={styles.sectionTitle}>
          <Send size={20} color="var(--primary)" />
          Solicitudes de Entrega de Dinero
          {todasSolicitudesPendientes.length > 0 && (
            <span style={{ backgroundColor: '#f97316', color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '14px', fontWeight: 'bold', marginLeft: '4px' }}>
              {todasSolicitudesPendientes.length}
            </span>
          )}
        </h2>

        {todasSolicitudesPendientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3>No hay solicitudes pendientes</h3>
            <p>Los meseros aún no han enviado solicitudes de entrega.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {todasSolicitudesPendientes.map(sol => (
              <div key={sol.id} style={styles.solicitudCard}>
                <div style={styles.solicitudPendingIndicator} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={styles.avatarCircle}>
                    <User size={20} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>
                      {sol.usuarioNombre}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatearFecha(sol.fecha)}
                    </div>
                  </div>
                  <div style={styles.statusPending}>
                    <Clock size={14} />
                    Pendiente
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.08) 0%, rgba(255, 120, 0, 0.04) 100%)', borderRadius: '10px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Monto a Recibir</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-1px' }}>
                    ${sol.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => confirmarSolicitudCaja(sol.id)}
                  style={{ width: '100%', justifyContent: 'center', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', fontSize: '14px', fontWeight: '600', borderRadius: '10px' }}
                >
                  <CheckCircle size={18} />
                  Confirmar Recepción
                </button>
              </div>
            ))}
          </div>
        )}



        {/* ─── HISTORIAL DE CONFIRMACIONES ────────────────────── */}
        <h2 style={{ ...styles.sectionTitle, marginTop: '48px' }}>
          <TrendingDown size={20} color="#10b981" />
          Historial de Recepciones
        </h2>
        {todasSolicitudesConfirmadas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No hay recepciones confirmadas aún.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mesero</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th style={{ textAlign: 'right' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {todasSolicitudesConfirmadas.map(sol => (
                  <tr key={sol.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} />
                        {sol.usuarioNombre}
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatearFecha(sol.fecha)}</td>
                    <td style={{ fontWeight: 'bold', color: '#10b981' }}>${sol.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={styles.statusConfirmed}><CheckCircle size={14} /> Confirmada</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageTransition>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  VISTA MESERO (Usuario)
  // ════════════════════════════════════════════════════════════
  return (
    <PageTransition>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={28} color="var(--primary)" />
            Mi Caja
          </h1>
          <p className="page-subtitle">Controla tu efectivo y envía solicitudes de entrega al administrador.</p>
        </div>
      </div>

      <div style={styles.balanceCard}>
        <div style={styles.balanceGlow} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={styles.balanceLabel}>
            <Wallet size={18} style={{ opacity: 0.7 }} />
            Efectivo en Caja
          </div>
          <div style={styles.balanceAmount}>
            ${cajaActual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          {solicitudesPendientes.length > 0 && (
            <div style={styles.pendingBadge}>
              <Clock size={14} />
              {solicitudesPendientes.length} solicitud{solicitudesPendientes.length > 1 ? 'es' : ''} pendiente{solicitudesPendientes.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div style={styles.formCard}>
        <h2 style={styles.sectionTitle}>
          <Send size={20} color="var(--primary)" />
          Enviar Solicitud de Entrega
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px 0' }}>
          Indica el monto que vas a entregar al administrador.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={styles.inputLabel}>Monto a Entregar</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="number"
                className="form-control"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                min="1"
                max={cajaActual}
                step="0.01"
                required
                style={{ paddingLeft: '44px', fontSize: '22px', fontWeight: 'bold', height: '56px', color: 'var(--primary)', backgroundColor: 'rgba(255, 170, 0, 0.05)', borderColor: 'rgba(255, 170, 0, 0.2)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mínimo: $1.00</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Máximo: ${cajaActual.toLocaleString()}</span>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={!monto || parseFloat(monto) <= 0 || parseFloat(monto) > cajaActual || cajaActual <= 0} style={{ height: '56px', padding: '0 32px', fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            <Send size={18} /> Enviar Solicitud
          </button>
        </form>
      </div>

      {solicitudesPendientes.length > 0 && (
        <>
          <h2 style={{ ...styles.sectionTitle, marginTop: '40px' }}>
            <Clock size={20} color="#f59e0b" />
            Solicitudes Pendientes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {solicitudesPendientes.map(sol => (
              <div key={sol.id} style={styles.solicitudCard}>
                <div style={styles.solicitudPendingIndicator} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={styles.solicitudMonto}>${sol.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatearFecha(sol.fecha)}</div>
                  </div>
                  <div style={styles.statusPending}><Clock size={14} /> Pendiente</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 style={{ ...styles.sectionTitle, marginTop: '40px' }}>
        <TrendingDown size={20} color="#10b981" />
        Historial de Entregas
      </h2>
      {solicitudesConfirmadas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No hay entregas confirmadas aún.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto Entregado</th>
                <th style={{ textAlign: 'right' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesConfirmadas.map(sol => (
                <tr key={sol.id}>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatearFecha(sol.fecha)}</td>
                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>${sol.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}><span style={styles.statusConfirmed}><CheckCircle size={14} /> Confirmada</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageTransition>
  );
};

export default Caja;

const styles = {
  balanceCard: {
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.12) 0%, rgba(255, 120, 0, 0.06) 100%)',
    border: '1px solid rgba(255, 170, 0, 0.25)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '32px',
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: '-50%',
    right: '-20%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255, 170, 0, 0.15) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
  },
  balanceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  balanceAmount: {
    fontSize: '48px',
    fontWeight: '800',
    color: 'var(--primary)',
    lineHeight: 1.1,
    letterSpacing: '-2px',
  },
  pendingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
    padding: '6px 14px',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '32px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-main)',
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 20px 0',
  },
  inputLabel: {
    display: 'block',
    color: 'var(--text-muted)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  solicitudCard: {
    position: 'relative',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: '12px',
    padding: '20px 20px 20px 28px',
    overflow: 'hidden',
  },
  solicitudPendingIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: 'linear-gradient(180deg, #f59e0b, #f97316)',
    borderRadius: '4px 0 0 4px',
  },
  solicitudMonto: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  statusPending: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: '#f59e0b',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusConfirmed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    color: '#10b981',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
};
