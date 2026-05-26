import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { addDocument, updateDocument, deleteDocument } from '../firebase/Services';
import Toast from '../components/Toast';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [mesasCerradas, setMesasCerradas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [toast, setToast] = useState(null);
  const [ordenesMesas, setOrdenesMesas] = useState([]);
  const [solicitudesCaja, setSolicitudesCaja] = useState([]);

  // Refs para tener siempre el estado más reciente en las funciones
  // sin necesidad de re-crearlas (evita closures obsoletos)
  const productosRef = useRef(productos);
  const mesasRef = useRef(mesas);
  const ordenesMesasRef = useRef(ordenesMesas);
  const usuariosRef = useRef(usuarios);
  const solicitudesCajaRef = useRef(solicitudesCaja);
  useEffect(() => { productosRef.current = productos; }, [productos]);
  useEffect(() => { mesasRef.current = mesas; }, [mesas]);
  useEffect(() => { ordenesMesasRef.current = ordenesMesas; }, [ordenesMesas]);
  useEffect(() => { usuariosRef.current = usuarios; }, [usuarios]);
  useEffect(() => { solicitudesCajaRef.current = solicitudesCaja; }, [solicitudesCaja]);

  const registrarMovimiento = (accion) => {
    const user = auth.currentUser;
    const nombreUsuario = user?.displayName || user?.email || 'Usuario';
    const fechaActual = new Date();
    
    const nuevoMovimiento = {
      usuario: nombreUsuario,
      accion: accion,
      fecha: fechaActual.toISOString(),
      hora: fechaActual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Fire-and-forget — onSnapshot actualiza el estado
    addDocument('movimientos', nuevoMovimiento).catch(console.error);
  };

  const mostrarToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  //  LISTENERS EN TIEMPO REAL CON onSnapshot
  //  Cada colección se suscribe una vez. Firestore notifica cualquier
  //  cambio (local o remoto) y el estado de React se actualiza.
  //
  //  NOTA: Para las colecciones críticas de velocidad (mesas, productos)
  //  usamos UI Optimista + onSnapshot. El estado local se actualiza
  //  INMEDIATAMENTE y onSnapshot lo reconcilia después.
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const unsubscribers = [];

    // --- Productos ---
    unsubscribers.push(
      onSnapshot(collection(db, 'productos'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProductos(data);
      }, (error) => console.error('onSnapshot productos:', error))
    );

    // --- Categorías ---
    unsubscribers.push(
      onSnapshot(collection(db, 'categorias'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategorias(data);
      }, (error) => console.error('onSnapshot categorias:', error))
    );

    // --- Mesas (ordenadas por número) ---
    unsubscribers.push(
      onSnapshot(collection(db, 'mesas'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMesas(data.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)));
      }, (error) => console.error('onSnapshot mesas:', error))
    );

    // --- Mesas Cerradas (ordenadas por fecha descendente) ---
    unsubscribers.push(
      onSnapshot(collection(db, 'mesasCerradas'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMesasCerradas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      }, (error) => console.error('onSnapshot mesasCerradas:', error))
    );

    // --- Pedidos (ordenados por fecha descendente) ---
    unsubscribers.push(
      onSnapshot(collection(db, 'pedidos'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPedidos(data.sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido)));
      }, (error) => console.error('onSnapshot pedidos:', error))
    );

    // --- Movimientos (ordenados por fecha descendente) ---
    unsubscribers.push(
      onSnapshot(collection(db, 'movimientos'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMovimientos(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      }, (error) => console.error('onSnapshot movimientos:', error))
    );

    // --- Usuarios ---
    unsubscribers.push(
      onSnapshot(collection(db, 'usuarios'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(data);
      }, (error) => console.error('onSnapshot usuarios:', error))
    );

    // --- Ordenes Mesas ---
    unsubscribers.push(
      onSnapshot(collection(db, 'ordenesMesas'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrdenesMesas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      }, (error) => console.error('onSnapshot ordenesMesas:', error))
    );

    // --- Solicitudes de Caja ---
    unsubscribers.push(
      onSnapshot(collection(db, 'solicitudesCaja'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSolicitudesCaja(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      }, (error) => console.error('onSnapshot solicitudesCaja:', error))
    );

    // Cleanup: desuscribirse al desmontar el componente
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  //  FUNCIONES DE MUTACIÓN — UI OPTIMISTA + FIRE-AND-FORGET
  //
  //  Estrategia: Actualizar el estado local PRIMERO (instantáneo),
  //  luego disparar las escrituras a Firestore SIN esperar (no await).
  //  onSnapshot reconcilia automáticamente cuando Firestore confirma.
  //  Las escrituras paralelas (Promise.all) se usan donde hay
  //  múltiples documentos que actualizar.
  // ═══════════════════════════════════════════════════════════════════

  const sumarACajaUsuario = async (monto) => {
    if (monto <= 0) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const userDoc = usuariosRef.current.find(u => u.uid === currentUser.uid);
    if (userDoc) {
      const nuevaCaja = (userDoc.caja || 0) + monto;
      // UI Optimista
      setUsuarios(prev => prev.map(u => u.id === userDoc.id ? { ...u, caja: nuevaCaja } : u));
      // Firestore
      updateDocument('usuarios', userDoc.id, { caja: nuevaCaja }).catch(console.error);
    }
  };

  // const sumarACajaPorId = async (usuarioId, monto) => {
  //   if (monto <= 0 || !usuarioId) return;
  //   const userDoc = usuariosRef.current.find(u => u.id === usuarioId);
  //   if (userDoc) {
  //     const nuevaCaja = (userDoc.caja || 0) + monto;
  //     setUsuarios(prev => prev.map(u => u.id === userDoc.id ? { ...u, caja: nuevaCaja } : u));
  //     updateDocument('usuarios', userDoc.id, { caja: nuevaCaja }).catch(console.error);
  //   }
  // };

  const recaudarCajaUsuario = async (usuarioId, monto) => {
    const userDoc = usuariosRef.current.find(u => u.id === usuarioId);
    if (!userDoc || monto <= 0) return;

    const nuevaCaja = Math.max(0, (userDoc.caja || 0) - monto);
    try {
      // UI Optimista
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, caja: nuevaCaja } : u));
      await updateDocument('usuarios', usuarioId, { caja: nuevaCaja });
      mostrarToast(`Recaudación exitosa de $${monto.toLocaleString()}`, 'success');
      registrarMovimiento(`Recaudó $${monto.toLocaleString()} de la caja de ${userDoc.nombre}`);
    } catch(e) {
      console.error(e);
      mostrarToast('Error al recaudar', 'error');
    }
  };

  const actualizarRolUsuario = async (userId, nuevoRol, nuevoEstado) => {
    try {
      await updateDocument('usuarios', userId, { rol: nuevoRol, estado: nuevoEstado });
      mostrarToast(`Usuario actualizado correctamente`, 'success');
      registrarMovimiento(`Actualizó el rol/estado del usuario`);
    } catch(error) {
      console.error(error);
      mostrarToast(`Error al actualizar usuario`, 'error');
    }
  };

  const eliminarUsuario = async (id) => {
    try {
      await deleteDocument('usuarios', id);
      mostrarToast('Usuario eliminado', 'error');
      registrarMovimiento('Eliminó a un usuario del sistema');
    } catch(e) { 
      console.error(e); 
      mostrarToast('Error al eliminar usuario', 'error');
    }
  };

  // ── Biometría / PIN ─────────────────────────────────────────────────
  const obtenerUsuarioActual = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return usuariosRef.current.find(u => u.uid === currentUser.uid) || null;
  };

  const guardarCredencialesBiometricasUsuario = async (pinHash, biometricCredential) => {
    const userDoc = obtenerUsuarioActual();
    if (!userDoc) return;

    const updateData = { pinHash };
    if (biometricCredential) {
      updateData.biometricCredential = biometricCredential;
    }

    try {
      // UI Optimista
      setUsuarios(prev => prev.map(u => u.id === userDoc.id ? { ...u, ...updateData } : u));
      await updateDocument('usuarios', userDoc.id, updateData);
      mostrarToast('Credenciales de seguridad guardadas', 'success');
    } catch(e) {
      console.error(e);
      mostrarToast('Error al guardar credenciales', 'error');
    }
  };

  const generarCodigo = () => Math.floor(1000 + Math.random() * 9000).toString();

  // ── Categorías ─────────────────────────────────────────────────────
  const agregarCategoria = async (nombre) => {
    const nuevaCategoria = { codigo: generarCodigo(), nombre };
    try {
      await addDocument('categorias', nuevaCategoria);
      mostrarToast(`Categoría "${nombre}" agregada correctamente`, 'success');
    } catch(e) { console.error(e); }
  };

  const editarCategoria = async (id, nombre) => {
    try {
      await updateDocument('categorias', id, { nombre });
      mostrarToast(`Categoría actualizada correctamente`, 'info');
    } catch(e) { console.error(e); }
  };

  const eliminarCategoria = async (id) => {
    try {
      await deleteDocument('categorias', id);
      mostrarToast('Categoría eliminada', 'error');
    } catch(e) { console.error(e); }
  };

  // ── Productos ──────────────────────────────────────────────────────
  const agregarProducto = async (producto) => {
    const nuevoProducto = { ...producto, codigo: generarCodigo() };
    try {
      await addDocument('productos', nuevoProducto);
      mostrarToast(`Producto "${producto.nombre}" agregado correctamente`, 'success');
    } catch(e) {
      console.error(e);
      mostrarToast('Error al agregar producto', 'error');
    }
  };

  const editarProducto = async (id, productoActualizado) => {
    try {
      await updateDocument('productos', id, productoActualizado);
      mostrarToast('Producto actualizado correctamente', 'info');
    } catch(e) { console.error(e); }
  };

  const eliminarProducto = async (id) => {
    try {
      await deleteDocument('productos', id);
      mostrarToast('Producto eliminado', 'error');
    } catch(e) { console.error(e); }
  };

  // ── Mesas ──────────────────────────────────────────────────────────
  const agregarMesa = async (numero) => {
    const nuevaMesa = { numero, titular: '', estado: 'desocupada', productos: [], abonos: 0, mesasHijas: [], mesaPadreId: null };
    try {
      await addDocument('mesas', nuevaMesa);
      registrarMovimiento(`Agregó la mesa ${numero}`);
    } catch(e) { console.error(e); }
  };

  const abrirMesa = (mesaId, titular) => {
    const usuarioActualId = auth.currentUser?.uid || null;
    const mesaActualizada = { 
      titular, 
      estado: 'ocupada', 
      productos: [], 
      abonos: 0, 
      mesasHijas: [], 
      mesaPadreId: null,
      usuarioAperturaId: usuarioActualId
    };
    const mesaActual = mesasRef.current.find(m => m.id === mesaId);

    // ⚡ UI Optimista — actualización instantánea
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, ...mesaActualizada } : m));

    // 🔥 Fire-and-forget a Firestore
    updateDocument('mesas', mesaId, mesaActualizada).catch(console.error);
    if (mesaActual) {
      registrarMovimiento(`Abrió la mesa ${mesaActual.numero} para ${titular}`);
    }
  };

  const abonarMesa = (mesaId, monto, metodoPago = 'Efectivo') => {
    const mesa = mesasRef.current.find(m => m.id === mesaId);
    if (!mesa) return;
    const nuevoAbono = (mesa.abonos || 0) + monto;

    if (metodoPago === 'Efectivo') {
      sumarACajaUsuario(monto);
    }

    // ⚡ UI Optimista
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, abonos: nuevoAbono } : m));

    // 🔥 Fire-and-forget
    updateDocument('mesas', mesaId, { abonos: nuevoAbono }).catch(console.error);
  };

  const agregarProductoAMesa = (mesaId, producto) => {
    const prodActual = productosRef.current.find(p => p.id === producto.id);
    if (!prodActual || prodActual.stock <= 0) {
      alert('No hay stock disponible para este producto.');
      return;
    }

    const mesaActual = mesasRef.current.find(m => m.id === mesaId);
    if (!mesaActual) return;

    const nuevoStock = prodActual.stock - 1;
    const nuevosProdsMesa = mesaActual.productos.map(p => ({ ...p }));
    const prodIndex = nuevosProdsMesa.findIndex(p => p.productoId === producto.id);
    if (prodIndex >= 0) {
      nuevosProdsMesa[prodIndex].cantidad += 1;
    } else {
      nuevosProdsMesa.push({ productoId: producto.id, cantidad: 1 });
    }

    // ⚡ UI Optimista — el usuario ve el cambio INMEDIATAMENTE
    setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stock: nuevoStock } : p));
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: nuevosProdsMesa } : m));

    // 🔥 Fire-and-forget EN PARALELO — sin bloquear la UI
    Promise.all([
      updateDocument('productos', producto.id, { stock: nuevoStock }),
      updateDocument('mesas', mesaId, { productos: nuevosProdsMesa })
    ]).catch(console.error);

    registrarMovimiento(`Agregó el producto "${prodActual.nombre}" a la mesa ${mesaActual.numero}`);
  };

  const actualizarCantidadProductoMesa = (mesaId, productoId, cambio) => {
    const mesa = mesasRef.current.find(m => m.id === mesaId);
    if (!mesa) return;

    const prodMesa = mesa.productos.find(p => p.productoId === productoId);
    const prodActual = productosRef.current.find(p => p.id === productoId);
    if (!prodActual) return;

    if (cambio > 0) {
      if (prodActual.stock > 0) {
        const nuevoStock = prodActual.stock - 1;
        const nuevosProdsMesa = mesa.productos.map(p =>
          p.productoId === productoId ? { ...p, cantidad: p.cantidad + 1 } : { ...p }
        );

        // ⚡ UI Optimista
        setProductos(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));
        setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: nuevosProdsMesa } : m));

        // 🔥 Fire-and-forget EN PARALELO
        Promise.all([
          updateDocument('productos', productoId, { stock: nuevoStock }),
          updateDocument('mesas', mesaId, { productos: nuevosProdsMesa })
        ]).catch(console.error);

        registrarMovimiento(`Aumentó cantidad de "${prodActual.nombre}" en la mesa ${mesa.numero}`);
      } else {
        alert('No hay suficiente stock de este producto.');
      }
    } else if (cambio < 0) {
      if (prodMesa && prodMesa.cantidad > 0) {
        const nuevoStock = prodActual.stock + 1;
        const nuevosProdsMesa = mesa.productos
          .map(p => p.productoId === productoId ? { ...p, cantidad: p.cantidad - 1 } : { ...p })
          .filter(p => p.cantidad > 0);

        // ⚡ UI Optimista
        setProductos(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));
        setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: nuevosProdsMesa } : m));

        // 🔥 Fire-and-forget EN PARALELO
        Promise.all([
          updateDocument('productos', productoId, { stock: nuevoStock }),
          updateDocument('mesas', mesaId, { productos: nuevosProdsMesa })
        ]).catch(console.error);

        registrarMovimiento(`Redujo cantidad de "${prodActual.nombre}" en la mesa ${mesa.numero}`);
      }
    }
  };

  const cerrarMesa = (mesaId, metodoPago = 'Efectivo') => {
    const mesa = mesasRef.current.find(m => m.id === mesaId);
    if (!mesa) return;

    const usuarioActualId = auth.currentUser?.uid;
    const usuarioInfo = usuariosRef.current.find(u => u.uid === usuarioActualId);

    // Verificación: Solo quien abrió la mesa o un SuperAdmin puede cerrarla
    if (mesa.usuarioAperturaId && mesa.usuarioAperturaId !== usuarioActualId && usuarioInfo?.rol !== 'SuperAdministrador') {
      mostrarToast('Error: No puedes cerrar una mesa que abrió otro mesero.', 'error');
      return;
    }

    let total = 0;
    let cantProductos = 0;
    mesa.productos.forEach(p => {
      const prod = productosRef.current.find(prod => prod.id === p.productoId);
      if (prod) {
        total += prod.precio * p.cantidad;
        cantProductos += p.cantidad;
      }
    });

    const mesaCerrada = {
      numero: mesa.numero,
      titular: mesa.titular,
      productosConsumidos: cantProductos,
      total,
      horaCierre: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toISOString(),
      metodoPago
    };

    const mesaReset = { titular: '', estado: 'desocupada', productos: [], abonos: 0, mesasHijas: [], mesaPadreId: null };

    // ⚡ UI Optimista — la mesa se libera al instante
    let mesasActualizadasOptimista = mesasRef.current.map(m => m.id === mesaId ? { ...m, ...mesaReset } : m);
    
    const promesasCierre = [
      addDocument('mesasCerradas', mesaCerrada),
      updateDocument('mesas', mesaId, mesaReset)
    ];

    if (mesa.mesasHijas && mesa.mesasHijas.length > 0) {
      mesa.mesasHijas.forEach(hijaId => {
         mesasActualizadasOptimista = mesasActualizadasOptimista.map(m => m.id === hijaId ? { ...m, ...mesaReset } : m);
         promesasCierre.push(updateDocument('mesas', hijaId, mesaReset));
      });
    }

    setMesas(mesasActualizadasOptimista);
    setMesasCerradas(prev => [{ id: 'temp-' + Date.now(), ...mesaCerrada }, ...prev]);

    // 🔥 Fire-and-forget EN PARALELO
    Promise.all(promesasCierre).catch(console.error);

    if (metodoPago === 'Efectivo' && total > 0) {
      const totalRecibido = total - (mesa.abonos || 0);
      if (totalRecibido > 0) {
        sumarACajaUsuario(totalRecibido);
      }
    }

    registrarMovimiento(`Cerró la mesa ${mesa.numero} por un total de $${total.toLocaleString()}`);
  };

  const unirMesas = (mesaPrincipalId, mesasSecundariasIds) => {
    const mesaPrincipal = mesasRef.current.find(m => m.id === mesaPrincipalId);
    if (!mesaPrincipal) return;

    let productosExtra = [...(mesaPrincipal.productos || [])];
    let abonosExtra = mesaPrincipal.abonos || 0;
    
    const promesas = [];
    const numerosMesasSecundarias = [];

    mesasSecundariasIds.forEach(id => {
      const mesaSec = mesasRef.current.find(m => m.id === id);
      if (mesaSec) {
        numerosMesasSecundarias.push(mesaSec.numero);
        // Combinar productos
        if (mesaSec.productos) {
          mesaSec.productos.forEach(pSec => {
            const idx = productosExtra.findIndex(p => p.productoId === pSec.productoId);
            if (idx >= 0) {
              productosExtra[idx].cantidad += pSec.cantidad;
            } else {
              productosExtra.push({ ...pSec });
            }
          });
        }
        // Combinar abonos
        abonosExtra += (mesaSec.abonos || 0);

        // Actualizar mesa secundaria
        const updateSec = { estado: 'unida', mesaPadreId: mesaPrincipalId, productos: [], abonos: 0, titular: `Unida a Mesa ${mesaPrincipal.numero}` };
        setMesas(prev => prev.map(m => m.id === id ? { ...m, ...updateSec } : m));
        promesas.push(updateDocument('mesas', id, updateSec));
      }
    });

    const hijasPrevias = mesaPrincipal.mesasHijas || [];
    const nuevasHijas = [...new Set([...hijasPrevias, ...mesasSecundariasIds])];

    const updatePrincipal = { 
      productos: productosExtra, 
      abonos: abonosExtra,
      mesasHijas: nuevasHijas
    };

    setMesas(prev => prev.map(m => m.id === mesaPrincipalId ? { ...m, ...updatePrincipal } : m));
    promesas.push(updateDocument('mesas', mesaPrincipalId, updatePrincipal));

    Promise.all(promesas).catch(console.error);
    registrarMovimiento(`Unió mesas ${numerosMesasSecundarias.join(', ')} a la mesa ${mesaPrincipal.numero}`);
    mostrarToast('Mesas unidas correctamente', 'success');
  };

  const desvincularMesa = (mesaSecundariaId) => {
    const mesaSec = mesasRef.current.find(m => m.id === mesaSecundariaId);
    if (!mesaSec || !mesaSec.mesaPadreId) return;

    const mesaPrincipalId = mesaSec.mesaPadreId;
    const mesaPrincipal = mesasRef.current.find(m => m.id === mesaPrincipalId);

    const updateSec = { estado: 'desocupada', mesaPadreId: null, titular: '', mesasHijas: [] };
    setMesas(prev => prev.map(m => m.id === mesaSecundariaId ? { ...m, ...updateSec } : m));
    
    const promesas = [updateDocument('mesas', mesaSecundariaId, updateSec)];

    if (mesaPrincipal) {
      const nuevasHijas = (mesaPrincipal.mesasHijas || []).filter(id => id !== mesaSecundariaId);
      setMesas(prev => prev.map(m => m.id === mesaPrincipalId ? { ...m, mesasHijas: nuevasHijas } : m));
      promesas.push(updateDocument('mesas', mesaPrincipalId, { mesasHijas: nuevasHijas }));
    }

    Promise.all(promesas).catch(console.error);
    mostrarToast('Mesa desvinculada', 'info');
  };

  const cobrarParcialMesa = (mesaId, productosAcobrar, metodoPago = 'Efectivo') => {
    const mesa = mesasRef.current.find(m => m.id === mesaId);
    if (!mesa) return;

    let totalParcial = 0;
    let cantProductosParcial = 0;
    
    // Calcular el total y actualizar los productos de la mesa
    const nuevosProductosMesa = mesa.productos.map(p => ({...p}));
    
    productosAcobrar.forEach(pCobrar => {
      const prod = productosRef.current.find(prod => prod.id === pCobrar.productoId);
      if (prod) {
        totalParcial += prod.precio * pCobrar.cantidadCobrar;
        cantProductosParcial += pCobrar.cantidadCobrar;
        
        const idx = nuevosProductosMesa.findIndex(p => p.productoId === pCobrar.productoId);
        if (idx >= 0) {
          nuevosProductosMesa[idx].cantidad -= pCobrar.cantidadCobrar;
        }
      }
    });

    // Filtrar los que quedaron en 0
    const productosFinales = nuevosProductosMesa.filter(p => p.cantidad > 0);

    const ticketParcial = {
      numero: mesa.numero,
      titular: mesa.titular + ' (Pago Parcial)',
      productosConsumidos: cantProductosParcial,
      total: totalParcial,
      horaCierre: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toISOString(),
      metodoPago,
      esParcial: true
    };

    // ⚡ UI Optimista
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: productosFinales } : m));
    setMesasCerradas(prev => [{ id: 'temp-' + Date.now(), ...ticketParcial }, ...prev]);

    // 🔥 Fire-and-forget EN PARALELO
    Promise.all([
      addDocument('mesasCerradas', ticketParcial),
      updateDocument('mesas', mesaId, { productos: productosFinales })
    ]).catch(console.error);

    if (metodoPago === 'Efectivo' && totalParcial > 0) {
      sumarACajaUsuario(totalParcial);
    }

    registrarMovimiento(`Cobro parcial en mesa ${mesa.numero} por $${totalParcial}`);
    mostrarToast(`Cobro parcial exitoso: $${totalParcial.toLocaleString()}`, 'success');
  };

  // ── Ordenes Mesas ────────────────────────────────────────────────────────
  const crearOrdenMesa = async (mesaId, numeroMesa, carrito) => {
    const user = auth.currentUser;
    const nombreUsuario = user?.displayName || user?.email || 'Usuario';
    const userDoc = usuariosRef.current.find(u => u.uid === user?.uid);
    
    const nuevaOrden = {
      mesaId,
      numeroMesa,
      usuario: nombreUsuario,
      usuarioId: userDoc ? userDoc.id : null,
      productos: carrito,
      estado: 'pendiente',
      fecha: new Date().toISOString()
    };

    try {
      await addDocument('ordenesMesas', nuevaOrden);
      mostrarToast('Orden enviada. Esperando confirmación.', 'success');
      const totalOrden = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
      registrarMovimiento(`Envió orden de $${totalOrden.toLocaleString()} para la mesa ${numeroMesa}`);
    } catch(e) {
      console.error(e);
      mostrarToast('Error al enviar la orden', 'error');
    }
  };

  const confirmarOrdenMesa = async (ordenId) => {
    const orden = ordenesMesasRef.current.find(o => o.id === ordenId);
    if (!orden) return;

    const mesaActual = mesasRef.current.find(m => m.id === orden.mesaId);
    if (!mesaActual) {
      mostrarToast('La mesa de esta orden ya no existe.', 'error');
      return;
    }

    const promesas = [];
    let hayErrorStock = false;
    let nuevosProductosLocal = [...productosRef.current];
    const nuevosProdsMesa = [...mesaActual.productos];

    for (const item of orden.productos) {
      const prodActualIdx = nuevosProductosLocal.findIndex(p => p.id === item.productoId);
      if (prodActualIdx >= 0) {
        const prodActual = nuevosProductosLocal[prodActualIdx];
        if (prodActual.stock >= item.cantidad) {
          const nuevoStock = prodActual.stock - item.cantidad;
          nuevosProductosLocal[prodActualIdx] = { ...prodActual, stock: nuevoStock };
          promesas.push(updateDocument('productos', item.productoId, { stock: nuevoStock }));
          
          const prodMesaIdx = nuevosProdsMesa.findIndex(p => p.productoId === item.productoId);
          if (prodMesaIdx >= 0) {
            nuevosProdsMesa[prodMesaIdx] = { ...nuevosProdsMesa[prodMesaIdx], cantidad: nuevosProdsMesa[prodMesaIdx].cantidad + item.cantidad };
          } else {
            nuevosProdsMesa.push({ productoId: item.productoId, cantidad: item.cantidad });
          }
        } else {
           hayErrorStock = true;
           mostrarToast(`No hay stock suficiente de ${item.nombre}`, 'error');
        }
      }
    }

    if (hayErrorStock) {
      return; // Stop if there's no stock for any item.
    }

    setProductos(nuevosProductosLocal);
    setMesas(prev => prev.map(m => m.id === orden.mesaId ? { ...m, productos: nuevosProdsMesa } : m));
    setOrdenesMesas(prev => prev.map(o => o.id === ordenId ? { ...o, estado: 'entregada' } : o));

    promesas.push(updateDocument('mesas', orden.mesaId, { productos: nuevosProdsMesa }));
    promesas.push(updateDocument('ordenesMesas', ordenId, { estado: 'entregada' }));


    Promise.all(promesas).catch(console.error);
    registrarMovimiento(`Confirmó orden de mesa ${orden.numeroMesa}`);
    mostrarToast('Orden confirmada y agregada a la mesa', 'success');
  };

  const rechazarOrdenMesa = async (ordenId) => {
    try {
      await updateDocument('ordenesMesas', ordenId, { estado: 'rechazada' });
      mostrarToast('Orden rechazada', 'info');
      registrarMovimiento('Rechazó una orden de mesa');
    } catch(e) { console.error(e); }
  };

  // ── Solicitudes de Caja ─────────────────────────────────────────────
  const crearSolicitudCaja = async (monto) => {
    if (monto <= 0) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const userDoc = usuariosRef.current.find(u => u.uid === currentUser.uid);
    if (!userDoc) return;

    if (monto > (userDoc.caja || 0)) {
      mostrarToast('El monto no puede ser mayor a tu caja actual', 'error');
      return;
    }

    const nuevaSolicitud = {
      usuarioId: userDoc.id,
      usuarioNombre: userDoc.nombre,
      monto,
      estado: 'pendiente',
      fecha: new Date().toISOString()
    };

    try {
      await addDocument('solicitudesCaja', nuevaSolicitud);
      mostrarToast(`Solicitud de entrega por $${monto.toLocaleString()} enviada`, 'success');
      registrarMovimiento(`Envió solicitud de entrega de $${monto.toLocaleString()}`);
    } catch(e) {
      console.error(e);
      mostrarToast('Error al enviar solicitud', 'error');
    }
  };

  const confirmarSolicitudCaja = async (solicitudId) => {
    const solicitud = solicitudesCajaRef.current.find(s => s.id === solicitudId);
    if (!solicitud || solicitud.estado !== 'pendiente') return;

    const userDoc = usuariosRef.current.find(u => u.id === solicitud.usuarioId);
    if (!userDoc) {
      mostrarToast('No se encontró el mesero', 'error');
      return;
    }

    const nuevaCaja = Math.max(0, (userDoc.caja || 0) - solicitud.monto);

    try {
      // UI Optimista
      setUsuarios(prev => prev.map(u => u.id === solicitud.usuarioId ? { ...u, caja: nuevaCaja } : u));
      setSolicitudesCaja(prev => prev.map(s => s.id === solicitudId ? { ...s, estado: 'confirmada' } : s));

      await Promise.all([
        updateDocument('usuarios', solicitud.usuarioId, { caja: nuevaCaja }),
        updateDocument('solicitudesCaja', solicitudId, { estado: 'confirmada', fechaConfirmacion: new Date().toISOString() })
      ]);

      mostrarToast(`Recepción confirmada: $${solicitud.monto.toLocaleString()} de ${solicitud.usuarioNombre}`, 'success');
      registrarMovimiento(`Confirmó recepción de $${solicitud.monto.toLocaleString()} de ${solicitud.usuarioNombre}`);
    } catch(e) {
      console.error(e);
      mostrarToast('Error al confirmar solicitud', 'error');
    }
  };

  // ── Pedidos ────────────────────────────────────────────────────────
  const agregarPedido = async (pedido) => {
    let pedidoNuevo = { ...pedido, codigo: generarCodigo() };

    // Lógica para auto-sumar stock si ya tiene fecha de entrega
    if (pedidoNuevo.fechaEntrega && !pedidoNuevo.stockSumado && pedidoNuevo.productoId) {
      const prodActual = productosRef.current.find(p => p.id === pedidoNuevo.productoId);
      if (prodActual) {
        const nuevoStock = Number(prodActual.stock) + Number(pedidoNuevo.cantidad);
        // UI Optimista para stock
        setProductos(prev => prev.map(p => p.id === prodActual.id ? { ...p, stock: nuevoStock } : p));
        updateDocument('productos', prodActual.id, { stock: nuevoStock }).catch(console.error);
        pedidoNuevo.stockSumado = true;
      }
    }

    try {
      await addDocument('pedidos', pedidoNuevo);
      mostrarToast('Pedido registrado correctamente', 'success');
    } catch(e) {
      console.error(e);
      mostrarToast('Error al registrar pedido', 'error');
    }
  };

  const editarPedido = async (id, pedidoActualizado) => {
    let pedidoUpdate = { ...pedidoActualizado };
    
    // Si se le pone fecha de entrega por primera vez, sumar stock
    if (pedidoUpdate.fechaEntrega && !pedidoUpdate.stockSumado && pedidoUpdate.productoId) {
      const prodActual = productosRef.current.find(p => p.id === pedidoUpdate.productoId);
      if (prodActual) {
        const nuevoStock = Number(prodActual.stock) + Number(pedidoUpdate.cantidad);
        // UI Optimista para stock
        setProductos(prev => prev.map(p => p.id === prodActual.id ? { ...p, stock: nuevoStock } : p));
        updateDocument('productos', prodActual.id, { stock: nuevoStock }).catch(console.error);
        pedidoUpdate.stockSumado = true;
      }
    }

    try {
      await updateDocument('pedidos', id, pedidoUpdate);
      if (pedidoUpdate.fechaEntrega && pedidoUpdate.stockSumado) {
        mostrarToast('Pedido entregado — Stock actualizado', 'success');
      } else {
        mostrarToast('Pedido actualizado correctamente', 'info');
      }
    } catch(e) { console.error(e); }
  };

  const eliminarPedido = async (id) => {
    try {
      await deleteDocument('pedidos', id);
      mostrarToast('Pedido eliminado', 'error');
    } catch(e) { console.error(e); }
  };

  return (
    <AppContext.Provider value={{
      productos, agregarProducto, editarProducto, eliminarProducto,
      categorias, agregarCategoria, editarCategoria, eliminarCategoria,
      mesas, agregarMesa, abrirMesa, abonarMesa, agregarProductoAMesa, actualizarCantidadProductoMesa, cerrarMesa,
      unirMesas, desvincularMesa, cobrarParcialMesa,
      mesasCerradas,
      ordenesMesas, crearOrdenMesa, confirmarOrdenMesa, rechazarOrdenMesa,
      pedidos, agregarPedido, editarPedido, eliminarPedido,
      movimientos,
      usuarios, actualizarRolUsuario, recaudarCajaUsuario, eliminarUsuario,
      obtenerUsuarioActual, guardarCredencialesBiometricasUsuario,
      solicitudesCaja, crearSolicitudCaja, confirmarSolicitudCaja
    }}>
      {children}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppContext.Provider>
  );
};
