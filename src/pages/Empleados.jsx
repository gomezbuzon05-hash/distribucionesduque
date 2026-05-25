
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { auth } from '../firebase/firebase';
import { User, Check, X, ShieldAlert, ShieldCheck, UserCog, Lock, Trash2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const CODIGO_VERIFICACION = '7415';

const Empleados = () => {
  const { usuarios, actualizarRolUsuario, eliminarUsuario } = useContext(AppContext);
  const [autenticado, setAutenticado] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [codigoError, setCodigoError] = useState(false);

  const pendientes = usuarios.filter(u => u.estado === 'pendiente');
  const activos = usuarios.filter(u => u.estado === 'aprobado');

  const handleAprobar = (id) => {
    // Por defecto se aprueba como 'Usuario' común
    actualizarRolUsuario(id, 'Usuario', 'aprobado');
  };

  const handleRechazar = (id) => {
    actualizarRolUsuario(id, 'Pendiente', 'rechazado');
  };

  const handleChangeRol = (id, nuevoRol) => {
    actualizarRolUsuario(id, nuevoRol, 'aprobado');
  };

  const handleEliminarUsuario = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario del sistema?')) {
      eliminarUsuario(id);
    }
  };

  const handleVerificar = () => {
    if (codigoInput === CODIGO_VERIFICACION) {
      setAutenticado(true);
      setCodigoError(false);
    } else {
      setCodigoError(true);
    }
  };

  // Si no está autenticado, mostrar la pantalla de verificación
  if (!autenticado) {
    return (
      <PageTransition>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '48px 40px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '64px', height: '64px',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              color: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Lock size={28} />
            </div>
            <h2 style={{ marginBottom: '8px', fontSize: '22px', color: 'var(--text-main)' }}>
              Acceso Restringido
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '28px' }}>
              Ingresa el código de verificación para acceder a la gestión de empleados.
            </p>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="password"
                className="form-control"
                placeholder="Código de verificación"
                value={codigoInput}
                onChange={(e) => { setCodigoInput(e.target.value); setCodigoError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerificar()}
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
            <button
              className="btn-primary"
              onClick={handleVerificar}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
            >
              Verificar Acceso
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Gestión de Empleados</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>Administra el acceso y roles de los usuarios del sistema</p>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="#f59e0b" />
            Solicitudes Pendientes ({pendientes.length})
          </h2>
          <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #f59e0b40' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)' }}>Usuario</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)' }}>Email</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)' }}>Fecha Registro</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map(usuario => (
                    <tr key={usuario.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} />
                          </div>
                          <span style={{ fontWeight: 500 }}>{usuario.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{usuario.email}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                        {new Date(usuario.fechaRegistro).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn-primary"
                            style={{ backgroundColor: '#10b981', padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handleAprobar(usuario.id)}
                          >
                            <Check size={16} style={{ marginRight: '4px' }} /> Aprobar
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handleRechazar(usuario.id)}
                          >
                            <X size={16} style={{ marginRight: '4px' }} /> Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="var(--primary)" />
          Usuarios Activos ({activos.length})
        </h2>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)' }}>Usuario</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)' }}>Rol Actual</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activos.map(usuario => (
                  <tr key={usuario.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <UserCog size={16} />
                        </div>
                        <span style={{ fontWeight: 500 }}>{usuario.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{usuario.email}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge-categoria`} style={{
                        backgroundColor: usuario.rol === 'SuperAdministrador' ? 'rgba(139, 92, 246, 0.2)' : usuario.rol === 'Administrador' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: usuario.rol === 'SuperAdministrador' ? '#a78bfa' : usuario.rol === 'Administrador' ? '#38bdf8' : '#e2e8f0'
                      }}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <select
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '13px', width: 'auto', display: 'inline-block', margin: 0 }}
                          value={usuario.rol}
                          onChange={(e) => handleChangeRol(usuario.id, e.target.value)}
                        >
                          <option value="Usuario">Usuario común</option>
                          <option value="Administrador">Administrador</option>
                          <option value="SuperAdministrador">SuperAdministrador</option>
                        </select>
                        {auth.currentUser?.uid !== usuario.uid && (
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 10px', fontSize: '13px', height: '34px', display: 'flex', alignItems: 'center' }}
                            onClick={() => handleEliminarUsuario(usuario.id)}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Empleados;
