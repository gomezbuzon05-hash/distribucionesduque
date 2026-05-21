import React, { useState } from 'react';
import { auth } from '../firebase/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Login = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
      alert("Hubo un error al iniciar sesión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginPulseGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 170, 0, 0.15), 0 0 60px rgba(255, 170, 0, 0.05); }
          50% { box-shadow: 0 0 40px rgba(255, 170, 0, 0.25), 0 0 80px rgba(255, 170, 0, 0.1); }
        }
        @keyframes loginFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes loginShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes loginSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loginGradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes loginParticleFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(50px, -80px) scale(1.2); opacity: 0.5; }
          50% { transform: translate(-30px, -150px) scale(0.8); opacity: 0.2; }
          75% { transform: translate(60px, -60px) scale(1.1); opacity: 0.4; }
        }
        @keyframes loginParticleFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          33% { transform: translate(-60px, -100px) scale(1.3); opacity: 0.4; }
          66% { transform: translate(40px, -120px) scale(0.7); opacity: 0.3; }
        }
        @keyframes loginParticleFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate(30px, -180px) scale(1.5); opacity: 0.1; }
        }

        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100vw;
          background: linear-gradient(135deg, #0a0c10 0%, #121418 25%, #1a1520 50%, #121418 75%, #0a0c10 100%);
          background-size: 400% 400%;
          animation: loginGradientShift 15s ease infinite;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* Ambient light effects */
        .login-page::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 170, 0, 0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-page::after {
          content: '';
          position: absolute;
          bottom: -30%;
          right: -15%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255, 170, 0, 0.04) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .login-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .login-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 170, 0, 0.3);
          border-radius: 50%;
        }

        .login-particle:nth-child(1) { left: 15%; bottom: 20%; animation: loginParticleFloat1 12s ease-in-out infinite; }
        .login-particle:nth-child(2) { left: 30%; bottom: 10%; width: 3px; height: 3px; animation: loginParticleFloat2 15s ease-in-out infinite 1s; }
        .login-particle:nth-child(3) { right: 20%; bottom: 25%; width: 5px; height: 5px; animation: loginParticleFloat3 18s ease-in-out infinite 2s; }
        .login-particle:nth-child(4) { right: 35%; bottom: 15%; width: 3px; height: 3px; animation: loginParticleFloat1 14s ease-in-out infinite 3s; }
        .login-particle:nth-child(5) { left: 50%; bottom: 5%; width: 2px; height: 2px; animation: loginParticleFloat2 10s ease-in-out infinite 0.5s; }
        .login-particle:nth-child(6) { left: 70%; bottom: 30%; width: 4px; height: 4px; animation: loginParticleFloat3 16s ease-in-out infinite 4s; }

        .login-card-wrapper {
          position: relative;
          z-index: 2;
          animation: loginFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .login-card {
          position: relative;
          background: linear-gradient(165deg, rgba(30, 33, 40, 0.95) 0%, rgba(22, 24, 30, 0.98) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 170, 0, 0.12);
          border-radius: 24px;
          padding: 56px 48px;
          width: 440px;
          max-width: 92vw;
          text-align: center;
          box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.4),
            0 16px 56px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: loginPulseGlow 4s ease-in-out infinite;
        }

        /* Decorative top accent line */
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ffaa00, transparent);
          border-radius: 0 0 4px 4px;
        }

        .login-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 28px;
          animation: loginSlideUp 0.6s ease forwards 0.2s;
          opacity: 0;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(145deg, #ffaa00, #e69900);
          color: #121418;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 800;
          box-shadow:
            0 8px 32px rgba(255, 170, 0, 0.3),
            0 2px 8px rgba(255, 170, 0, 0.2);
          animation: loginFloat 6s ease-in-out infinite;
          position: relative;
          letter-spacing: -1px;
        }

        .login-logo::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 24px;
          border: 2px solid rgba(255, 170, 0, 0.15);
          pointer-events: none;
        }

        .login-brand {
          animation: loginSlideUp 0.6s ease forwards 0.35s;
          opacity: 0;
          margin-bottom: 8px;
        }

        .login-title {
          font-size: 32px;
          font-weight: 800;
          color: #f0f0f0;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ffffff, #d0d0d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          font-size: 15px;
          color: #8b92a5;
          margin: 0;
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .login-divider-container {
          animation: loginSlideUp 0.6s ease forwards 0.5s;
          opacity: 0;
          margin: 32px 0;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 170, 0, 0.2), transparent);
        }

        .login-divider-icon {
          color: rgba(255, 170, 0, 0.4);
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid rgba(255, 170, 0, 0.15);
          border-radius: 50%;
        }

        .login-access-label {
          animation: loginSlideUp 0.6s ease forwards 0.55s;
          opacity: 0;
          font-size: 12px;
          font-weight: 600;
          color: #8b92a5;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
        }

        .login-btn-wrapper {
          animation: loginSlideUp 0.6s ease forwards 0.65s;
          opacity: 0;
        }

        .login-google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          width: 100%;
          padding: 16px 28px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          color: #1a1a2e;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          letter-spacing: -0.2px;
        }

        .login-google-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 170, 0, 0.08), transparent);
          background-size: 200% 100%;
          animation: loginShimmer 3s ease-in-out infinite;
          pointer-events: none;
        }

        .login-google-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 32px rgba(255, 170, 0, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #ffffff 0%, #fff8e8 100%);
        }

        .login-google-btn:active {
          transform: translateY(0px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .login-google-btn.loading {
          pointer-events: none;
          opacity: 0.85;
        }

        .login-google-icon {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
        }

        .login-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(26, 26, 46, 0.15);
          border-top-color: #ffaa00;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .login-footer {
          animation: loginSlideUp 0.6s ease forwards 0.8s;
          opacity: 0;
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-footer-text {
          font-size: 12px;
          color: rgba(139, 146, 165, 0.6);
          margin: 0;
        }

        .login-security-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(139, 146, 165, 0.5);
          margin-top: 4px;
          justify-content: center;
        }

        .login-lock-icon {
          font-size: 10px;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-card {
            padding: 40px 28px;
            border-radius: 20px;
          }
          .login-title {
            font-size: 26px;
          }
          .login-logo {
            width: 68px;
            height: 68px;
            font-size: 30px;
            border-radius: 16px;
          }
          .login-google-btn {
            padding: 14px 24px;
            font-size: 15px;
          }
        }
      `}</style>

      <div className="login-page">
        {/* Floating particles */}
        <div className="login-particles">
          <div className="login-particle"></div>
          <div className="login-particle"></div>
          <div className="login-particle"></div>
          <div className="login-particle"></div>
          <div className="login-particle"></div>
          <div className="login-particle"></div>
        </div>

        <div className="login-card-wrapper">
          <div className="login-card">
            {/* Logo */}
            <div className="login-logo-container">
              <div className="login-logo">B</div>
            </div>

            {/* Brand */}
            <div className="login-brand">
              <h1 className="login-title">BarManager</h1>
              <p className="login-subtitle">Sistema de Gestión</p>
            </div>

            {/* Divider */}
            <div className="login-divider-container">
              <div className="login-divider-line"></div>
              <div className="login-divider-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="login-divider-line"></div>
            </div>

            {/* Access label */}
            <p className="login-access-label">Acceso al sistema</p>

            {/* Google Button */}
            <div className="login-btn-wrapper">
              <button
                className={`login-google-btn ${isLoading ? 'loading' : ''}`}
                onClick={handleGoogleLogin}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="login-spinner"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    <svg className="login-google-icon" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Iniciar sesión con Google
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="login-footer">
              <p className="login-footer-text">
                Solo usuarios autorizados
              </p>
              <div className="login-security-badge">
                <span className="login-lock-icon">🔒</span>
                Conexión segura con Google
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
