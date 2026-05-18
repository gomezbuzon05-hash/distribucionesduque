import React, { createContext, useState, useEffect, useCallback } from 'react';
import { addDocument, getAllDocuments, updateDocument, deleteDocument } from '../firebase/Services';
import { auth } from '../firebase/firebase';
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

    const tempId = 'temp-mov-' + Date.now();
    setMovimientos(prev => [{ id: tempId, ...nuevoMovimiento }, ...prev].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));

    addDocument('movimientos', nuevoMovimiento)
      .then(realId => {
        setMovimientos(prev => prev.map(m => m.id === tempId ? { ...m, id: realId } : m));
      })
      .catch(console.error);
  };

  const mostrarToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prod = await getAllDocuments('productos');
        const cat = await getAllDocuments('categorias');
        const m = await getAllDocuments('mesas');
        const mc = await getAllDocuments('mesasCerradas');
        const peds = await getAllDocuments('pedidos');
        const movs = await getAllDocuments('movimientos');
        const usrs = await getAllDocuments('usuarios');
        
        setProductos(prod);
        setCategorias(cat);
        setMesas(m.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)));
        // Sort mesasCerradas by date descending
        setMesasCerradas(mc.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
        setPedidos(peds.sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido)));
        setMovimientos(movs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
        setUsuarios(usrs);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const actualizarRolUsuario = async (userId, nuevoRol, nuevoEstado) => {
    try {
      await updateDocument('usuarios', userId, { rol: nuevoRol, estado: nuevoEstado });
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol, estado: nuevoEstado } : u));
      mostrarToast(`Usuario actualizado correctamente`, 'success');
      registrarMovimiento(`Actualizó el rol/estado del usuario`);
    } catch(error) {
      console.error(error);
      mostrarToast(`Error al actualizar usuario`, 'error');
    }
  };

  const generarCodigo = () => Math.floor(1000 + Math.random() * 9000).toString();

  // Funciones para Categorías
  const agregarCategoria = async (nombre) => {
    const nuevaCategoria = { codigo: generarCodigo(), nombre };
    try {
      const id = await addDocument('categorias', nuevaCategoria);
      setCategorias([...categorias, { id, ...nuevaCategoria }]);
      mostrarToast(`Categoría "${nombre}" agregada correctamente`, 'success');
    } catch(e) { console.error(e); }
  };

  const editarCategoria = async (id, nombre) => {
    try {
      await updateDocument('categorias', id, { nombre });
      setCategorias(categorias.map(c => c.id === id ? { ...c, nombre } : c));
      mostrarToast(`Categoría actualizada correctamente`, 'info');
    } catch(e) { console.error(e); }
  };

  const eliminarCategoria = async (id) => {
    try {
      await deleteDocument('categorias', id);
      setCategorias(categorias.filter(c => c.id !== id));
      mostrarToast('Categoría eliminada', 'error');
    } catch(e) { console.error(e); }
  };

  // Funciones para Productos
  const agregarProducto = (producto) => {
    const tempId = 'temp-' + Date.now();
    const nuevoProducto = { ...producto, codigo: generarCodigo() };
    
    // UI Optimista
    setProductos(prev => [...prev, { id: tempId, ...nuevoProducto }]);
    mostrarToast(`Producto "${producto.nombre}" agregado correctamente`, 'success');

    // Sincronización en segundo plano
    addDocument('productos', nuevoProducto)
      .then(realId => {
        setProductos(prev => prev.map(p => p.id === tempId ? { ...p, id: realId } : p));
      })
      .catch(e => {
        console.error(e);
        // Reversión en caso de error
        setProductos(prev => prev.filter(p => p.id !== tempId));
      });
  };

  const editarProducto = (id, productoActualizado) => {
    // UI Optimista
    setProductos(prev => prev.map(p => p.id === id ? { ...p, ...productoActualizado } : p));
    mostrarToast('Producto actualizado correctamente', 'info');
    // Sincronización en segundo plano
    updateDocument('productos', id, productoActualizado).catch(console.error);
  };

  const eliminarProducto = async (id) => {
    try {
      await deleteDocument('productos', id);
      setProductos(productos.filter(p => p.id !== id));
      mostrarToast('Producto eliminado', 'error');
    } catch(e) { console.error(e); }
  };

  // Funciones para Mesas
  const agregarMesa = async (numero) => {
    const nuevaMesa = { numero, titular: '', estado: 'desocupada', productos: [], abonos: 0 };
    try {
      const id = await addDocument('mesas', nuevaMesa);
      setMesas([...mesas, { id, ...nuevaMesa }].sort((a, b) => parseInt(a.numero) - parseInt(b.numero)));
      registrarMovimiento(`Agregó la mesa ${numero}`);
    } catch(e) { console.error(e); }
  };

  const abrirMesa = (mesaId, titular) => {
    // UI Optimista
    const mesaActualizada = { titular, estado: 'ocupada', productos: [], abonos: 0 };
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, ...mesaActualizada } : m));
    
    const mesaActual = mesas.find(m => m.id === mesaId);
    if (mesaActual) {
      registrarMovimiento(`Abrió la mesa ${mesaActual.numero} para ${titular}`);
    }

    // Sincronización en segundo plano
    updateDocument('mesas', mesaId, mesaActualizada).catch(console.error);
  };

  const abonarMesa = (mesaId, monto) => {
    const mesa = mesas.find(m => m.id === mesaId);
    if(!mesa) return;
    const nuevoAbono = (mesa.abonos || 0) + monto;
    
    // UI Optimista
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, abonos: nuevoAbono } : m));
    
    // Sincronización en segundo plano
    updateDocument('mesas', mesaId, { abonos: nuevoAbono }).catch(console.error);
  };

  const agregarProductoAMesa = (mesaId, producto) => {
    const prodActual = productos.find(p => p.id === producto.id);
    if (!prodActual || prodActual.stock <= 0) {
      alert('No hay stock disponible para este producto.');
      return;
    }

    const mesaActual = mesas.find(m => m.id === mesaId);
    if (!mesaActual) return;

    const nuevoStock = prodActual.stock - 1;
    // Deep copy to prevent React state mutation affecting Firebase serialization
    const nuevosProdsMesa = mesaActual.productos.map(p => ({ ...p }));
    const prodIndex = nuevosProdsMesa.findIndex(p => p.productoId === producto.id);
    if (prodIndex >= 0) {
      nuevosProdsMesa[prodIndex].cantidad += 1;
    } else {
      nuevosProdsMesa.push({ productoId: producto.id, cantidad: 1 });
    }

    console.log("Guardando mesa", mesaId, "con productos:", nuevosProdsMesa);

    // UI Optimista
    setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stock: nuevoStock } : p));
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: nuevosProdsMesa } : m));

    registrarMovimiento(`Agregó el producto "${prodActual.nombre}" a la mesa ${mesaActual.numero}`);

    // Sincronización en segundo plano sin bloquear
    updateDocument('productos', producto.id, { stock: nuevoStock }).catch(console.error);
    updateDocument('mesas', mesaId, { productos: nuevosProdsMesa }).catch(console.error);
  };

  const actualizarCantidadProductoMesa = (mesaId, productoId, cambio) => {
    const mesa = mesas.find(m => m.id === mesaId);
    if (!mesa) return;

    const prodMesa = mesa.productos.find(p => p.productoId === productoId);
    const prodActual = productos.find(p => p.id === productoId);
    if (!prodActual) return;

    if (cambio > 0) {
      if (prodActual.stock > 0) {
        const nuevoStock = prodActual.stock - 1;
        const nuevosProdsMesa = mesa.productos.map(p => p.productoId === productoId ? { ...p, cantidad: p.cantidad + 1 } : { ...p });
        
        console.log("Actualizando cantidad mesa", mesaId, "con productos:", nuevosProdsMesa);

        // UI Optimista
        setProductos(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));
        setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: nuevosProdsMesa } : m));

        registrarMovimiento(`Aumentó cantidad de "${prodActual.nombre}" en la mesa ${mesa.numero}`);

        // Sincronización en segundo plano sin bloquear
        updateDocument('productos', productoId, { stock: nuevoStock }).catch(console.error);
        updateDocument('mesas', mesaId, { productos: nuevosProdsMesa }).catch(console.error);
      } else {
        alert('No hay suficiente stock de este producto.');
      }
    } else if (cambio < 0) {
      if (prodMesa && prodMesa.cantidad > 0) {
        const nuevoStock = prodActual.stock + 1;
        const nuevosProdsMesa = mesa.productos.map(p => p.productoId === productoId ? { ...p, cantidad: p.cantidad - 1 } : { ...p }).filter(p => p.cantidad > 0);
        
        console.log("Restando cantidad mesa", mesaId, "con productos:", nuevosProdsMesa);

        // UI Optimista
        setProductos(prev => prev.map(p => p.id === productoId ? { ...p, stock: nuevoStock } : p));
        setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, productos: nuevosProdsMesa } : m));

        registrarMovimiento(`Redujo cantidad de "${prodActual.nombre}" en la mesa ${mesa.numero}`);

        // Sincronización en segundo plano sin bloquear
        updateDocument('productos', productoId, { stock: nuevoStock }).catch(console.error);
        updateDocument('mesas', mesaId, { productos: nuevosProdsMesa }).catch(console.error);
      }
    }
  };

  const cerrarMesa = (mesaId, metodoPago = 'Efectivo') => {
    const mesa = mesas.find(m => m.id === mesaId);
    if (!mesa) return;

    let total = 0;
    let cantProductos = 0;
    mesa.productos.forEach(p => {
      const prod = productos.find(prod => prod.id === p.productoId);
      if (prod) {
        total += prod.precio * p.cantidad;
        cantProductos += p.cantidad;
      }
    });

    const tempId = 'temp-' + Date.now();
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

    // UI Optimista
    setMesasCerradas(prev => [{ id: tempId, ...mesaCerrada }, ...prev]);
    setMesas(prev => prev.map(m => m.id === mesaId ? { ...m, ...mesaReset } : m));

    registrarMovimiento(`Cerró la mesa ${mesa.numero}`);

    // Sincronización en segundo plano
    addDocument('mesasCerradas', mesaCerrada)
      .then(realId => {
        setMesasCerradas(prev => prev.map(mc => mc.id === tempId ? { ...mc, id: realId } : mc));
      })
      .catch(e => {
        console.error(e);
        // Revertir si hay error
        setMesasCerradas(prev => prev.filter(mc => mc.id !== tempId));
      });
      
    updateDocument('mesas', mesaId, mesaReset).catch(console.error);
  };

  // Funciones para Pedidos
  const agregarPedido = async (pedido) => {
    const tempId = 'temp-' + Date.now();
    let pedidoNuevo = { ...pedido, codigo: generarCodigo() };

    // Lógica para auto-sumar stock si ya tiene fecha de entrega
    if (pedidoNuevo.fechaEntrega && !pedidoNuevo.stockSumado && pedidoNuevo.productoId) {
      const prodActual = productos.find(p => p.id === pedidoNuevo.productoId);
      if (prodActual) {
        const nuevoStock = Number(prodActual.stock) + Number(pedidoNuevo.cantidad);
        updateDocument('productos', prodActual.id, { stock: nuevoStock }).catch(console.error);
        setProductos(prev => prev.map(p => p.id === prodActual.id ? { ...p, stock: nuevoStock } : p));
        pedidoNuevo.stockSumado = true;
      }
    }

    // UI Optimista
    setPedidos(prev => [{ id: tempId, ...pedidoNuevo }, ...prev].sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido)));
    mostrarToast('Pedido registrado correctamente', 'success');

    // Sincronización
    addDocument('pedidos', pedidoNuevo)
      .then(realId => {
        setPedidos(prev => prev.map(p => p.id === tempId ? { ...p, id: realId } : p));
      })
      .catch(e => {
        console.error(e);
        setPedidos(prev => prev.filter(p => p.id !== tempId));
      });
  };

  const editarPedido = async (id, pedidoActualizado) => {
    let pedidoUpdate = { ...pedidoActualizado };
    
    // Si se le pone fecha de entrega por primera vez o se actualiza, sumar stock si no se ha sumado
    if (pedidoUpdate.fechaEntrega && !pedidoUpdate.stockSumado && pedidoUpdate.productoId) {
      const prodActual = productos.find(p => p.id === pedidoUpdate.productoId);
      if (prodActual) {
        const nuevoStock = Number(prodActual.stock) + Number(pedidoUpdate.cantidad);
        updateDocument('productos', prodActual.id, { stock: nuevoStock }).catch(console.error);
        setProductos(prev => prev.map(p => p.id === prodActual.id ? { ...p, stock: nuevoStock } : p));
        pedidoUpdate.stockSumado = true;
      }
    }

    setPedidos(prev => prev.map(p => p.id === id ? { ...p, ...pedidoUpdate } : p));
    updateDocument('pedidos', id, pedidoUpdate).catch(console.error);
    if (pedidoUpdate.fechaEntrega && pedidoUpdate.stockSumado) {
      mostrarToast('Pedido entregado — Stock actualizado', 'success');
    } else {
      mostrarToast('Pedido actualizado correctamente', 'info');
    }
  };

  const eliminarPedido = async (id) => {
    try {
      await deleteDocument('pedidos', id);
      setPedidos(pedidos.filter(p => p.id !== id));
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

