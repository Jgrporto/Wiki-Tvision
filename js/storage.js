// js/storage.js (Versão Final com Sincronização de Categorias)

import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// === REFERÊNCIAS DAS COLEÇÕES ===
const articlesCollection = collection(db, 'articles');
const categoriesCollection = collection(db, 'categories');


// === FUNÇÕES DOS ARTIGOS ===

/**
 * Busca todos os artigos do Firestore.
 */
export async function fetchArticles() {
    try {
        const querySnapshot = await getDocs(articlesCollection);
        const articles = [];
        querySnapshot.forEach((doc) => {
            articles.push({ id: doc.id, ...doc.data() });
        });
        return articles;
    } catch (error) {
        console.error("Erro ao buscar artigos: ", error);
        return [];
    }
}

/**
 * Cria um novo artigo no Firestore.
 */
export async function createArticleInDb(articleData) {
    try {
        const docRef = await addDoc(articlesCollection, articleData);
        console.log("Artigo criado com ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Erro ao criar artigo: ", error);
        return null;
    }
}

/**
 * Atualiza um artigo existente no Firestore.
 */
export async function updateArticleInDb(articleId, articleData) {
    try {
        const articleRef = doc(db, 'articles', articleId);
        await updateDoc(articleRef, articleData);
        console.log("Artigo atualizado com sucesso: ", articleId);
    } catch (error) {
        console.error("Erro ao atualizar artigo: ", error);
    }
}

/**
 * Deleta um artigo do Firestore.
 */
export async function deleteArticleInDb(articleId) {
    try {
        await deleteDoc(doc(db, 'articles', articleId));
        console.log("Artigo deletado com sucesso: ", articleId);
    } catch (error) {
        console.error("Erro ao deletar artigo: ", error);
    }
}


// === FUNÇÕES DAS CATEGORIAS ===

/**
 * Busca todas as categorias do Firestore.
 */
export async function fetchCategories() {
    try {
        const querySnapshot = await getDocs(categoriesCollection);
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        return categories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Erro ao buscar categorias: ", error);
        return [];
    }
}

/**
 * Cria uma nova categoria no Firestore.
 */
export async function createCategory(categoryName) {
    try {
        await addDoc(categoriesCollection, { name: categoryName });
        console.log("Categoria criada com sucesso: ", categoryName);
    } catch (error) {
        console.error("Erro ao criar categoria: ", error);
    }
}

/**
 * Atualiza o nome de uma categoria existente no Firestore.
 */
export async function updateCategory(categoryId, newName) {
    try {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, { name: newName });
        console.log("Categoria atualizada com sucesso: ", newName);
    } catch (error) {
        console.error("Erro ao atualizar categoria: ", error);
    }
}

/**
 * Deleta uma categoria do Firestore.
 */
export async function deleteCategory(categoryId) {
    try {
        await deleteDoc(doc(db, 'categories', categoryId));
        console.log("Categoria deletada com sucesso: ", categoryId);
    } catch (error) {
        console.error("Erro ao deletar categoria: ", error);
    }
}


// === FUNÇÃO DE INICIALIZAÇÃO E SINCRONIZAÇÃO (ATUALIZADA) ===
export async function initializeStorage() {
    console.log("Iniciando verificação de sincronia do armazenamento...");

    // 1. Pega todas as categorias que já existem oficialmente na coleção 'categories'
    const existingCategoriesSnapshot = await getDocs(categoriesCollection);
    const existingCategoryNames = existingCategoriesSnapshot.docs.map(doc => doc.data().name);

    // 2. Pega todos os artigos da coleção 'articles'
    const articlesSnapshot = await getDocs(articlesCollection);
    
    // 3. Encontra todas as categorias únicas que estão sendo usadas nos artigos
    const categoriesFromArticles = new Set();
    articlesSnapshot.forEach(doc => {
        if (doc.data().category) {
            categoriesFromArticles.add(doc.data().category);
        }
    });

    // 4. Compara as duas listas e cria na coleção 'categories' aquelas que estão faltando
    for (const categoryName of categoriesFromArticles) {
        if (!existingCategoryNames.includes(categoryName)) {
            console.log(`Categoria "${categoryName}" encontrada nos artigos, mas não na coleção 'categories'. Criando...`);
            await createCategory(categoryName);
        }
    }
    console.log("Verificação do armazenamento concluída.");
}
