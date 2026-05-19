import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Grid, Package, Tags, FileText, LogOut, Truck, Activity, Menu, X, Users } from 'lucide-react';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';

const Sidebar = ({ userData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeSidebar = () => setIsOpen(false);
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return (
    <>
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo">B</div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>BarManager</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="hamburger-btn">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="sidebar-logo">B</div>
            <h2>BarManager</h2>
          </div>
          <button className="mobile-close-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        <div className="sidebar-nav" style={{ flexGrow: 1 }}>
          {userData?.rol !== 'Usuario' && (
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end onClick={closeSidebar}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
          )}
          
          <NavLink to="/mesas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Grid size={20} />
            Mesas
          </NavLink>
          
          <NavLink to="/productos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Package size={20} />
            Productos
          </NavLink>
          
          <NavLink to="/categorias" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Tags size={20} />
            Categorías
          </NavLink>
          
          {userData?.rol !== 'Usuario' && (
            <>
              <NavLink to="/pedidos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                <Truck size={20} />
                Pedidos
              </NavLink>
              <NavLink to="/reportes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                <FileText size={20} />
                Reportes
              </NavLink>
            </>
          )}

          {userData?.rol === 'SuperAdministrador' && (
            <NavLink to="/movimientos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
              <Activity size={20} />
              Movimientos
            </NavLink>
          )}

          {userData?.rol === 'SuperAdministrador' && (
            <NavLink to="/empleados" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
              <Users size={20} />
              Empleados
            </NavLink>
          )}
      </div>
      <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
        <button 
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444' }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
