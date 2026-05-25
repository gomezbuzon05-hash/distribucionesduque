/**
 * Servicio de Autenticación Biométrica + PIN
 * 
 * Usa APIs nativas del navegador:
 * - Web Crypto API para hash SHA-256 del PIN
 * - Web Credential API (navigator.credentials) para biometría local
 * 
 * NO requiere backend ni librerías externas.
 */

// ═══════════════════════════════════════════════════════════════════
//  UTILIDADES DE CODIFICACIÓN
// ═══════════════════════════════════════════════════════════════════

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str);
};

const base64ToBuffer = (base64) => {
  const str = atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes.buffer;
};

// ═══════════════════════════════════════════════════════════════════
//  PIN — HASH & VERIFICACIÓN
// ═══════════════════════════════════════════════════════════════════

/**
 * Genera un hash SHA-256 del PIN usando Web Crypto API nativa.
 * @param {string} pin - PIN de 4 dígitos
 * @returns {Promise<string>} - Hash en formato hexadecimal
 */
export const hashPin = async (pin) => {
  const encoder = new TextEncoder();
  // Salamos con un prefijo fijo para evitar rainbow tables básicas
  const data = encoder.encode(`duque_salt_2024_${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verifica un PIN contra su hash almacenado.
 * @param {string} pin - PIN ingresado
 * @param {string} storedHash - Hash almacenado en Firestore
 * @returns {Promise<boolean>}
 */
export const verifyPin = async (pin, storedHash) => {
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
};

// ═══════════════════════════════════════════════════════════════════
//  BIOMETRÍA — DETECCIÓN, REGISTRO Y VERIFICACIÓN
// ═══════════════════════════════════════════════════════════════════

/**
 * Detecta si el dispositivo actual soporta autenticación biométrica.
 * @returns {Promise<boolean>}
 */
export const isBiometricAvailable = async () => {
  try {
    if (!window.PublicKeyCredential) return false;
    
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};

/**
 * Registra una credencial biométrica local para el usuario.
 * @param {string} userId - ID del usuario en Firestore
 * @param {string} userName - Nombre del usuario para mostrar
 * @returns {Promise<{credentialId: string, publicKey: string} | null>}
 */
export const registerBiometric = async (userId, userName) => {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Distribuciones Duque',
          id: window.location.hostname
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }   // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',    // Solo biometría del dispositivo
          userVerification: 'required',           // Exige huella/face
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    });

    if (!credential) return null;

    return {
      credentialId: bufferToBase64(credential.rawId),
      publicKey: bufferToBase64(credential.response.getPublicKey ? credential.response.getPublicKey() : credential.response.attestationObject),
      counter: 0
    };
  } catch (error) {
    console.warn('Registro biométrico cancelado o fallido:', error.name);
    return null;
  }
};

/**
 * Verifica la identidad del usuario usando biometría local.
 * @param {string} credentialId - ID de la credencial almacenada (base64)
 * @returns {Promise<boolean>}
 */
export const verifyBiometric = async (credentialId) => {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: base64ToBuffer(credentialId),
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 30000
      }
    });

    // Si el navegador devuelve una assertion, el usuario pasó la verificación biométrica
    return !!assertion;
  } catch (error) {
    console.warn('Verificación biométrica cancelada o fallida:', error.name);
    return false;
  }
};
