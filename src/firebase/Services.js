import { db } from './firebase'; // Importa la instancia de Firestore que ya inicializaste
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

/**
 * Añade un nuevo documento a una colección.
 * @param {string} collectionName - El nombre de la colección.
 * @param {object} data - Los datos a guardar.
 * @returns {Promise<string>} - El ID del documento creado.
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

/**
 * Obtiene todos los documentos de una colección.
 * @param {string} collectionName - El nombre de la colección.
 * @returns {Promise<Array>} - Un array con los documentos.
 */
export const getAllDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

/**
 * Obtiene un documento específico por su ID.
 * @param {string} collectionName - El nombre de la colección.
 * @param {string} documentId - El ID del documento.
 * @returns {Promise<object|null>} - Los datos del documento o null si no existe.
 */
export const getDocumentById = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document: ", error);
    throw error;
  }
};

/**
 * Actualiza un documento existente.
 * @param {string} collectionName - El nombre de la colección.
 * @param {string} documentId - El ID del documento a actualizar.
 * @param {object} data - Los nuevos datos.
 */
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

/**
 * Elimina un documento.
 * @param {string} collectionName - El nombre de la colección.
 * @param {string} documentId - El ID del documento a eliminar.
 */
export const deleteDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

/**
 * Busca documentos en una colección basados en una condición.
 * @param {string} collectionName - El nombre de la colección.
 * @param {string} field - El campo a evaluar.
 * @param {string} operator - El operador (ej: '==', '>', '<').
 * @param {any} value - El valor a comparar.
 * @returns {Promise<Array>} - Un array con los documentos que coinciden.
 */
export const queryDocuments = async (collectionName, field, operator, value) => {
  try {
    const q = query(collection(db, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error) {
    console.error("Error querying documents: ", error);
    throw error;
  }
};