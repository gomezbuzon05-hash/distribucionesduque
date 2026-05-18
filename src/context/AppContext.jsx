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

  // Refs para tener siempre el estado más reciente en las funciones
  // sin necesidad de re-crearlas (evita closures obsoletos)
  const productosRef = useRef(productos);
  const mesasRef = useRef(mesas);
  useEffect(() => { productosRef.current = productos; }, [productos]);
  useEffect(() => { mesasRef.current = mesas; }, [mesas]);

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

    // Solo escribimos en Firestore — onSnapshot se encarga de actualizar el estado
    addDocument('movimientos', nuevoMovimiento).catch(console.error);
  };

  const mostrarToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  //  LISTENERS EN TIEMPO REAL CON onSnapshot
  //  Cada colección se suscribe una vez. Firestore notifica cualquier
  //  cambio (local o remoto) y el estado de React se actualiza automáticamente.
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

    // Cleanup: desuscribirse al desmontar el componente
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  //  FUNCIONES DE MUTACIÓN
  //  Ahora solo escriben en Firestore. Los onSnapshot se encargan
  //  de reflejar los cambios en el estado de React automáticamente.
  //  Ya no se necesitan actualizaciones manuales del estado local
  //  (excepto donde se necesite lógica secuencial entre colecciones).
  // ═══════════════════════════════════════════════════════════════════

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
    const nuevaMesa = { numero, titular: '', estado: 'desocupada', productos: [], abonos: 0 };
    try {
      await addDocument('mesas', nuevaMesa);
      registrarMovimiento(`Agregó la mesa ${numero}`);
    } catch(e) { console.error(e); }
  };

  const abrirMesa = async (mesaId, titular) => {
    const mesaActualizada = { titular, estado: 'ocupada', productos: [], abonos: 0 };
    try {
      const mesaActual = mesasRef.current.find(m => m.id === mesaId);
      await updateDocument('mesas', mesaId, mesaActualizada);
      if (mesaActual) {
        registrarMovimiento(`Abrió la mesa ${mesaActual.numero} para ${titular}`);
      }
    } catch(e) { console.error(e); }
  };

  const abonarMesa = async (mesaId, monto) => {
    const mesa = mesasRef.current.find(m => m.id === mesaId);
    if (!mesa) return;
    const nuevoAbono = (mesa.abonos || 0) + monto;
    try {
      await updateDocument('mesas', mesaId, { abonos: nuevoAbono });
    } catch(e) { console.error(e); }
  };

  const agregarProductoAMesa = async (mesaId, producto) => {
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

    try {
      await updateDocument('productos', producto.id, { stock: nuevoStock });
      await updateDocument('mesas', mesaId, { productos: nuevosProdsMesa });
      registrarMovimiento(`Agregó el producto "${prodActual.nombre}" a la mesa ${mesaActual.numero}`);
    } catch(e) { console.error(e); }
  };

  const actualizarCantidadProductoMesa = async (mesaId, productoId, cambio) => {
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
        try {
          await updateDocument('productos', productoId, { stock: nuevoStock });
          await updateDocument('mesas', mesaId, { productos: nuevosProdsMesa });
          registrarMovimiento(`Aumentó cantidad de "${prodActual.nombre}" en la mesa ${mesa.numero}`);
        } catch(e) { console.error(e); }
      } else {
        alert('No hay suficiente stock de este producto.');
      }
    } else if (cambio < 0) {
      if (prodMesa && prodMesa.cantidad > 0) {
        const nuevoStock = prodActual.stock + 1;
        const nuevosProdsMesa = mesa.productos
          .map(p => p.productoId === productoId ? { ...p, cantidad: p.cantidad - 1 } : { ...p })
          .filter(p => p.cantidad > 0);
        try {
          await updateDocument('productos', productoId, { stock: nuevoStock });
          await updateDocument('mesas', mesaId, { productos: nuevosProdsMesa });
          registrarMovimiento(`Redujo cantidad de "${prodActual.nombre}" en la mesa ${mesa.numero}`);
        } catch(e) { console.error(e); }
      }
    }
  };

  const cerrarMesa = async (mesaId, metodoPago = 'Efectivo') => {
    const mesa = mesasRef.current.find(m => m.id === mesaId);
    if (!mesa) return;

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

    const mesaReset = { titular: '', estado: 'desocupada', productos: [], abonos: 0 };

    try {
      await addDocument('mesasCerradas', mesaCerrada);
      await updateDocument('mesas', mesaId, mesaReset);
      registrarMovimiento(`Cerró la mesa ${mesa.numero}`);
    } catch(e) { console.error(e); }
  };

  // ── Pedidos ────────────────────────────────────────────────────────
  const agregarPedido = async (pedido) => {
    let pedidoNuevo = { ...pedido, codigo: generarCodigo() };

    // Lógica para auto-sumar stock si ya tiene fecha de entrega
    if (pedidoNuevo.fechaEntrega && !pedidoNuevo.stockSumado && pedidoNuevo.productoId) {
      const prodActual = productosRef.current.find(p => p.id === pedidoNuevo.productoId);
      if (prodActual) {
        const nuevoStock = Number(prodActual.stock) + Number(pedidoNuevo.cantidad);
        await updateDocument('productos', prodActual.id, { stock: nuevoStock });
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
        await updateDocument('productos', prodActual.id, { stock: nuevoStock });
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
      mesasCerradas,
      pedidos, agregarPedido, editarPedido, eliminarPedido,
      movimientos,
      usuarios, actualizarRolUsuario
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
