import React from 'react';
import { auth } from '../firebase/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import barBg from '../assets/bar_bg.png';

const Login = () => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // El estado de App.jsx detectará el cambio y redirigirá al dashboard
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
      alert("Hubo un error al iniciar sesión. Inténtalo de nuevo.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <div style={styles.card}>
        <div style={styles.logo}>B</div>
        <h1 style={styles.title}>BarManager</h1>
        <p style={styles.subtitle}>Distribuciones Duque</p>
        
        <button style={styles.button} onClick={handleGoogleLogin}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
            style={styles.googleIcon} 
          />
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
};

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
    backgroundColor: 'rgba(18, 20, 24, 0.75)', // Mezcla con el --bg-dark
    backdropFilter: 'blur(3px)',
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
  logo: {
    width: '72px',
    height: '72px',
    backgroundColor: 'var(--primary)',
    color: 'var(--bg-dark)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 auto 24px',
    boxShadow: '0 4px 20px rgba(255, 170, 0, 0.3)',
  },
  title: {
    margin: '0 0 8px 0',
    color: 'var(--text-main)',
    fontSize: '28px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '0 0 36px 0',
    color: 'var(--text-muted)',
    fontSize: '16px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 24px',
    backgroundColor: 'white',
    color: '#334155',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  googleIcon: {
    width: '24px',
    height: '24px',
    marginRight: '12px',
  }
};

export default Login;
