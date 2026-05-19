import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Categorias = ({ userData }) => {
  const { categorias, agregarCategoria, editarCategoria, eliminarCategoria, productos } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCategoriaId, setEditCategoriaId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      editarCategoria(editCategoriaId, nombre);
    } else {
      agregarCategoria(nombre);
    }
    cerrarModal();
  };

  const abrirModalNuevo = () => {
    setEditMode(false);
    setEditCategoriaId(null);
    setNombre('');
    setIsModalOpen(true);
  };

  const abrirModalEditar = (categoria) => {
    setEditMode(true);
    setEditCategoriaId(categoria.id);
    setNombre(categoria.nombre);
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setNombre('');
  };

  const handleDelete = (categoria) => {
    setCategoriaAEliminar(categoria);
  };

  const obtenerCantidadProductos = (categoriaNombre) => {
    return productos.filter(p => p.categoria === categoriaNombre).length;
  };

  return (
    <PageTransition>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">{categorias.length} categorías registradas</p>
        </div>
        {userData?.rol !== 'Usuario' && (
          <button className="btn-primary" onClick={abrirModalNuevo}>
            <Plus size={18} />
            Nueva Categoría
          </button>
        )}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Productos</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(categoria => {
              const cantidad = obtenerCantidadProductos(categoria.nombre);
              return (
                <tr key={categoria.id}>
                  <td>
                    <span className="badge-codigo">
                      # {categoria.codigo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#f0f0f0' }}>{categoria.nombre}</td>
                  <td>
                    <span className="badge-count">
                      {cantidad} producto{cantidad !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {userData?.rol !== 'Usuario' && (
                      <>
                        <button className="btn-icon" onClick={() => abrirModalEditar(categoria)} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--text-muted)' }} onClick={() => handleDelete(categoria)} title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {categorias.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button className="close-btn" onClick={cerrarModal}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{editMode ? 'Guardar Cambios' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Categoría */}
      {categoriaAEliminar && (
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Eliminar Categoría</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar la categoría <strong style={{ color: 'var(--text-main)' }}>{categoriaAEliminar.nombre}</strong>? 
                <br /><br />
                <span style={{ fontSize: '13px', color: '#ff9800' }}>Nota: Si hay productos usando esta categoría, podrían quedarse sin categoría asignada.</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }} 
                onClick={() => setCategoriaAEliminar(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px', display: 'flex' }} 
                onClick={() => {
                  eliminarCategoria(categoriaAEliminar.id);
                  setCategoriaAEliminar(null);
                }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Categorias;
