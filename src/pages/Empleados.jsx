
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { User, Check, X, ShieldAlert, ShieldCheck, UserCog } from 'lucide-react';

const Empleados = () => {
  const { usuarios, actualizarRolUsuario } = useContext(AppContext);

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

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
                  <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)' }}>Cambiar Rol</th>
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
                      <select 
                        className="form-control" 
                        style={{ padding: '6px 10px', fontSize: '13px', width: 'auto', display: 'inline-block' }}
                        value={usuario.rol}
                        onChange={(e) => handleChangeRol(usuario.id, e.target.value)}
                      >
                        <option value="Usuario">Usuario común</option>
                        <option value="Administrador">Administrador</option>
                        <option value="SuperAdministrador">SuperAdministrador</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Empleados;
