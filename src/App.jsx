import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { auth } from './firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { queryDocuments, getAllDocuments, addDocument } from './firebase/Services';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Mesas from './pages/Mesas';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Reportes from './pages/Reportes';
import Pedidos from './pages/Pedidos';
import Movimientos from './pages/Movimientos';
import Empleados from './pages/Empleados';
import Ordenes from './pages/Ordenes';
import Login from './pages/Login';
import barBg from './assets/bar_bg.png';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const result = await queryDocuments('usuarios', 'uid', '==', currentUser.uid);
          if (result.length > 0) {
            setUserData(result[0]);
          } else {
            const allUsers = await getAllDocuments('usuarios');
            const isFirst = allUsers.length === 0;
            
            const newUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              nombre: currentUser.displayName || currentUser.email,
              rol: isFirst ? 'SuperAdministrador' : 'Pendiente',
              estado: isFirst ? 'aprobado' : 'pendiente',
              fechaRegistro: new Date().toISOString()
            };
            await addDocument('usuarios', newUser);
            setUserData(newUser);
          }
        } catch (error) {
          console.error("Error al obtener usuario:", error);
        }
      } else {
        setUserData(null);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="app-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-dark)'}}><div className="loading-spinner">Cargando...</div></div>;
  }

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user && userData) {
    if (userData.estado === 'pendiente') {
      return (
        <div style={styles.container}>
          <div style={styles.overlay}></div>
          <div style={styles.card}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255, 170, 0, 0.1)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: '32px' }}>⏳</span>
            </div>
            <h2 style={styles.title}>Esperando Aprobación</h2>
            <p style={styles.subtitle}>Tu cuenta ha sido registrada, pero necesitas que un administrador la apruebe para poder acceder al sistema.</p>
            <button className="btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>Volver al inicio</button>
          </div>
        </div>
      );
    }
    if (userData.estado === 'rechazado') {
      return (
        <div style={styles.container}>
          <div style={styles.overlay}></div>
          <div style={styles.card}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: '32px' }}>❌</span>
            </div>
            <h2 style={styles.title}>Acceso Denegado</h2>
            <p style={styles.subtitle}>Lo sentimos, tu solicitud de acceso ha sido rechazada.</p>
            <button className="btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>Volver al inicio</button>
          </div>
        </div>
      );
    }
  }

  return (
    <AppProvider>
      <Router>
        <Routes>
          {user && userData && userData.estado === 'aprobado' ? (
            <Route path="/" element={<Layout userData={userData} />}>
              {userData.rol !== 'Usuario' && <Route index element={<Dashboard />} />}
              {userData.rol === 'Usuario' && <Route index element={<Navigate to="/mesas" replace />} />}
              
              <Route path="mesas" element={<Mesas />} />
              <Route path="productos" element={<Productos userData={userData} />} />
              <Route path="categorias" element={<Categorias userData={userData} />} />
              
              {userData.rol !== 'Usuario' && <Route path="ordenes" element={<Ordenes />} />}
              {userData.rol === 'SuperAdministrador' && (
                <>
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="reportes" element={<Reportes />} />
                </>
              )}

              {userData.rol === 'SuperAdministrador' && (
                <Route path="movimientos" element={<Movimientos />} />
              )}
              
              {userData.rol === 'SuperAdministrador' && (
                <Route path="empleados" element={<Empleados />} />
              )}
              
              <Route path="*" element={<Navigate to={userData.rol === 'Usuario' ? "/mesas" : "/"} replace />} />
            </Route>
          ) : (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundImage: `url(${barBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 20, 24, 0.85)',
    backdropFilter: 'blur(5px)',
    zIndex: 1,
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    padding: '48px',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    textAlign: 'center',
    maxWidth: '420px',
    width: '90%',
    zIndex: 2,
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    margin: '0 0 8px 0',
    color: 'var(--text-main)',
    fontSize: '24px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '0 0 36px 0',
    color: 'var(--text-muted)',
    fontSize: '15px',
    lineHeight: '1.5',
  }
};
