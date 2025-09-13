import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const articlesCollection = collection(db, 'articles');
const categoriesCollection = collection(db, 'categories');


// === FUNÇÕES DOS ARTIGOS ===

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

export async function updateArticleInDb(articleId, articleData) {
    try {
        const articleRef = doc(db, 'articles', articleId);
        await updateDoc(articleRef, articleData);
        console.log("Artigo atualizado com sucesso: ", articleId);
    } catch (error) {
        console.error("Erro ao atualizar artigo: ", error);
    }
}

export async function deleteArticleInDb(articleId) {
    try {
        await deleteDoc(doc(db, 'articles', articleId));
        console.log("Artigo deletado com sucesso: ", articleId);
    } catch (error) {
        console.error("Erro ao deletar artigo: ", error);
    }
}


// === FUNÇÕES DAS CATEGORIAS ===

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

export async function createCategory(categoryData) {
    try {
        const dataToSave = {
            name: categoryData.name,
            icon: categoryData.icon || 'fa-folder' 
        };
        await addDoc(categoriesCollection, dataToSave);
        console.log("Categoria criada com sucesso: ", categoryData.name);
    } catch (error) {
        console.error("Erro ao criar categoria: ", error);
    }
}

export async function updateCategory(categoryId, categoryData) {
    try {
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, categoryData);
        console.log("Categoria atualizada com sucesso: ", categoryData.name);
    } catch (error) {
        console.error("Erro ao atualizar categoria: ", error);
    }
}

export async function deleteCategory(categoryId) {
    try {
        await deleteDoc(doc(db, 'categories', categoryId));
        console.log("Categoria deletada com sucesso: ", categoryId);
    } catch (error) {
        console.error("Erro ao deletar categoria: ", error);
    }
}


// === FUNÇÃO DE INICIALIZAÇÃO E SINCRONIZAÇÃO ===
export async function initializeStorage() {
    console.log("Iniciando verificação de sincronia do armazenamento...");
    const existingCategoriesSnapshot = await getDocs(categoriesCollection);
    const existingCategoryNames = existingCategoriesSnapshot.docs.map(doc => doc.data().name);
    const articlesSnapshot = await getDocs(articlesCollection);
    const categoriesFromArticles = new Set();
    articlesSnapshot.forEach(doc => {
        if (doc.data().category) {
            categoriesFromArticles.add(doc.data().category);
        }
    });

    for (const categoryName of categoriesFromArticles) {
        if (!existingCategoryNames.includes(categoryName)) {
            console.log(`Categoria "${categoryName}" encontrada, criando documento oficial...`);
            await createCategory({ name: categoryName, icon: 'fa-folder' });
        }
    }
    console.log("Verificação do armazenamento concluída.");
}
