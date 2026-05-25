import React, { useState, useEffect, useCallback } from 'react';
import { Fingerprint, KeyRound, X, ShieldCheck, Delete, AlertTriangle } from 'lucide-react';
import { hashPin, verifyPin, isBiometricAvailable, registerBiometric, verifyBiometric } from '../services/biometricAuth';

/**
 * Modal de Verificación Biométrica + PIN
 * 
 * Props:
 * @param {boolean} isOpen - Controla visibilidad
 * @param {function} onClose - Cerrar modal
 * @param {function} onSuccess - Callback cuando se verifica exitosamente
 * @param {object} currentUser - Documento del usuario actual de Firestore (con pinHash, biometricCredential)
 * @param {function} onSaveCredentials - Guardar PIN/biometría en Firestore: (pinHash, biometricCredential?) => void
 */
const BiometricAuthModal = ({ isOpen, onClose, onSuccess, currentUser, onSaveCredentials }) => {
  // Modos: 'setup-pin' | 'setup-confirm' | 'setup-biometric' | 'auth-biometric' | 'auth-pin' | 'success'
  const [mode, setMode] = useState('auth-biometric');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shake, setShake] = useState(false);

  // Determinar modo inicial al abrir
  useEffect(() => {
    if (!isOpen) return;
    
    setPin('');
    setConfirmPin('');
    setError('');
    setIsProcessing(false);
    setShake(false);

    const init = async () => {
      const bioAvailable = await isBiometricAvailable();
      setBiometricSupported(bioAvailable);

      // ¿El usuario ya tiene PIN configurado?
      if (!currentUser?.pinHash) {
        setMode('setup-pin');
        return;
      }

      // Si tiene biometría registrada y el dispositivo la soporta
      if (currentUser?.biometricCredential && bioAvailable) {
        setMode('auth-biometric');
        // Intentar automáticamente
        attemptBiometric();
      } else {
        setMode('auth-pin');
      }
    };

    init();
  }, [isOpen]);

  // Intentar verificación biométrica
  const attemptBiometric = useCallback(async () => {
    if (!currentUser?.biometricCredential) {
      setMode('auth-pin');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const success = await verifyBiometric(currentUser.biometricCredential.credentialId);
      if (success) {
        setMode('success');
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setMode('auth-pin');
        setError('Verificación biométrica fallida. Usa tu PIN.');
      }
    } catch {
      setMode('auth-pin');
      setError('Biometría no disponible. Usa tu PIN.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, onSuccess]);

  // Manejar ingreso de dígitos del PIN
  const handleDigit = (digit) => {
    if (isProcessing) return;
    setError('');
    setShake(false);

    if (mode === 'setup-pin') {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          // Automáticamente pasar a confirmar
          setTimeout(() => setMode('setup-confirm'), 300);
        }
      }
    } else if (mode === 'setup-confirm') {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 4) {
          handleSetupComplete(newConfirm);
        }
      }
    } else if (mode === 'auth-pin') {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          handlePinVerify(newPin);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isProcessing) return;
    setError('');
    setShake(false);

    if (mode === 'setup-confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  // Completar setup de PIN
  const handleSetupComplete = async (confirmed) => {
    if (pin !== confirmed) {
      setShake(true);
      setError('Los PINs no coinciden. Intenta de nuevo.');
      setTimeout(() => {
        setConfirmPin('');
        setPin('');
        setMode('setup-pin');
        setShake(false);
      }, 1000);
      return;
    }

    setIsProcessing(true);
    try {
      const pinHashed = await hashPin(pin);
      
      // Preguntar si quiere registrar biometría
      if (biometricSupported) {
        setMode('setup-biometric');
        setIsProcessing(false);
        // Guardar el hash en una variable temporal para usarlo después
        window.__tempPinHash = pinHashed;
      } else {
        // Solo guardar PIN, no hay biometría
        await onSaveCredentials(pinHashed, null);
        setMode('success');
        setTimeout(() => onSuccess(), 600);
      }
    } catch {
      setError('Error al configurar el PIN.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Registrar biometría durante setup
  const handleRegisterBiometric = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const credential = await registerBiometric(
        currentUser?.uid || currentUser?.id || 'user',
        currentUser?.nombre || 'Mesero'
      );
      
      const pinHashed = window.__tempPinHash;
      delete window.__tempPinHash;
      
      await onSaveCredentials(pinHashed, credential);
      setMode('success');
      setTimeout(() => onSuccess(), 600);
    } catch {
      setError('Error al registrar biometría. Se guardó solo el PIN.');
      const pinHashed = window.__tempPinHash;
      delete window.__tempPinHash;
      await onSaveCredentials(pinHashed, null);
      setMode('success');
      setTimeout(() => onSuccess(), 600);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipBiometric = async () => {
    const pinHashed = window.__tempPinHash;
    delete window.__tempPinHash;
    await onSaveCredentials(pinHashed, null);
    setMode('success');
    setTimeout(() => onSuccess(), 600);
  };

  // Verificar PIN
  const handlePinVerify = async (enteredPin) => {
    setIsProcessing(true);
    setError('');
    try {
      const isValid = await verifyPin(enteredPin, currentUser.pinHash);
      if (isValid) {
        setMode('success');
        setTimeout(() => onSuccess(), 600);
      } else {
        setShake(true);
        setError('PIN incorrecto');
        setTimeout(() => {
          setPin('');
          setShake(false);
        }, 800);
      }
    } catch {
      setError('Error de verificación');
      setPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentPin = mode === 'setup-confirm' ? confirmPin : pin;
  const showNumpad = mode === 'setup-pin' || mode === 'setup-confirm' || mode === 'auth-pin';

  return (
    <div className="modal-overlay" style={{ zIndex: 1020 }}>
      <div className="biometric-modal">
        {/* Header */}
        <div className="biometric-modal-header">
          <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: '16px', top: '16px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="biometric-modal-body">

          {/* ── MODO: SUCCESS ────────────────────────────── */}
          {mode === 'success' && (
            <div className="biometric-status">
              <div className="biometric-icon-circle success">
                <ShieldCheck size={40} />
              </div>
              <h3>Verificación Exitosa</h3>
              <p style={{ color: '#10b981' }}>Identidad confirmada. Enviando orden...</p>
            </div>
          )}

          {/* ── MODO: AUTH BIOMETRIC ─────────────────────── */}
          {mode === 'auth-biometric' && (
            <div className="biometric-status">
              <div className={`biometric-icon-circle ${isProcessing ? 'scanning' : ''}`}>
                <Fingerprint size={40} />
              </div>
              <h3>Verificación de Identidad</h3>
              <p>Toca el sensor de huella de tu dispositivo</p>
              {isProcessing && (
                <div className="biometric-scanning-text">Escaneando...</div>
              )}
              <button
                className="biometric-fallback-btn"
                onClick={() => { setMode('auth-pin'); setPin(''); setError(''); }}
              >
                <KeyRound size={16} />
                Usar PIN en su lugar
              </button>
            </div>
          )}

          {/* ── MODO: SETUP BIOMETRIC ────────────────────── */}
          {mode === 'setup-biometric' && (
            <div className="biometric-status">
              <div className={`biometric-icon-circle ${isProcessing ? 'scanning' : ''}`}>
                <Fingerprint size={40} />
              </div>
              <h3>¿Activar Huella Digital?</h3>
              <p>Podrás confirmar órdenes con tu huella en lugar del PIN</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
                  onClick={handleRegisterBiometric}
                  disabled={isProcessing}
                >
                  <Fingerprint size={18} />
                  {isProcessing ? 'Registrando...' : 'Activar Huella Digital'}
                </button>
                <button
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
                  onClick={handleSkipBiometric}
                  disabled={isProcessing}
                >
                  Omitir, solo usar PIN
                </button>
              </div>
            </div>
          )}

          {/* ── MODO: SETUP PIN / CONFIRM / AUTH PIN (NUMPAD) ── */}
          {showNumpad && (
            <>
              <div className="biometric-status" style={{ marginBottom: '8px' }}>
                <div className="biometric-icon-circle" style={{ width: '52px', height: '52px' }}>
                  <KeyRound size={26} />
                </div>
                <h3>
                  {mode === 'setup-pin' && 'Crear tu PIN de Seguridad'}
                  {mode === 'setup-confirm' && 'Confirma tu PIN'}
                  {mode === 'auth-pin' && 'Ingresa tu PIN'}
                </h3>
                <p>
                  {mode === 'setup-pin' && 'Crea un PIN de 4 dígitos para confirmar tus órdenes'}
                  {mode === 'setup-confirm' && 'Escribe tu PIN nuevamente para confirmar'}
                  {mode === 'auth-pin' && 'Introduce tu PIN de 4 dígitos para verificar tu identidad'}
                </p>
              </div>

              {/* PIN Display Dots */}
              <div className={`pin-display ${shake ? 'shake' : ''}`}>
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`pin-dot ${i < currentPin.length ? 'filled' : ''}`}
                  />
                ))}
              </div>

              {error && (
                <div className="biometric-error">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              {/* Numpad */}
              <div className="numpad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => {
                  if (key === null) return <div key={idx} className="numpad-spacer" />;
                  if (key === 'del') {
                    return (
                      <button
                        key={idx}
                        className="numpad-btn numpad-del"
                        onClick={handleDelete}
                        disabled={isProcessing}
                      >
                        <Delete size={22} />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={idx}
                      className="numpad-btn"
                      onClick={() => handleDigit(String(key))}
                      disabled={isProcessing}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>

              {/* Link to biometric if available and in auth mode */}
              {mode === 'auth-pin' && currentUser?.biometricCredential && biometricSupported && (
                <button
                  className="biometric-fallback-btn"
                  onClick={() => { setMode('auth-biometric'); attemptBiometric(); }}
                  style={{ marginTop: '8px' }}
                >
                  <Fingerprint size={16} />
                  Usar huella digital
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiometricAuthModal;
