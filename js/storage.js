// js/storage.js (Refatorado para Firebase Firestore)

// Importa a referência do banco de dados do nosso arquivo de configuração
import { db } from './firebase-config.js';

// Importa as funções do Firestore que vamos usar
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, limit } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Referência à coleção 'articles' no Firestore. Pense nisso como a "tabela" de artigos.
const articlesCollection = collection(db, 'articles');

// Mantemos os artigos padrão para popular o banco de dados na primeira vez
const defaultArticles = [
    { 
        category: "Técnico", 
        title: "Como reiniciar o modem +TV", 
        content: "<p>Para reiniciar o modem, primeiro <strong>desconecte o cabo de energia</strong>. Espere 30 segundos e conecte novamente. As luzes começarão a piscar.</p>", 
        images: {} 
    },
    { 
        category: "Planos", 
        title: "Vantagens do Plano Família", 
        content: "<p>O Plano Família oferece 4 pontos de acesso e 200 canais em alta definição. É ideal para residências com múltiplos televisores.</p><ul><li>Ponto Principal</li><li>Até 3 pontos adicionais</li></ul>", 
        images: {} 
    }
];

/**
 * Busca todos os artigos do Firestore.
 * Esta função agora é ASSÍNCRONA.
 * @returns {Promise<Array>} Uma promessa que resolve para uma lista de artigos.
 */
export async function fetchArticles() {
    try {
        const querySnapshot = await getDocs(articlesCollection);
        const articles = [];
        querySnapshot.forEach((doc) => {
            // Adicionamos o ID do documento (gerado pelo Firebase) ao objeto de dados
            articles.push({ id: doc.id, ...doc.data() });
        });
        return articles;
    } catch (error) {
        console.error("Erro ao buscar artigos: ", error);
        return []; // Retorna uma lista vazia em caso de erro
    }
}

/**
 * Cria um novo artigo no Firestore.
 * @param {object} articleData - Os dados do novo artigo (título, conteúdo, etc.).
 * @returns {Promise<string|null>} O ID do novo artigo criado ou null em caso de erro.
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
 * @param {string} articleId - O ID do artigo a ser atualizado.
 * @param {object} articleData - Os novos dados do artigo.
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
 * @param {string} articleId - O ID do artigo a ser deletado.
 */
export async function deleteArticleInDb(articleId) {
    try {
        await deleteDoc(doc(db, 'articles', articleId));
        console.log("Artigo deletado com sucesso: ", articleId);
    } catch (error) {
        console.error("Erro ao deletar artigo: ", error);
    }
}


/**
 * Verifica se o banco de dados está vazio e, se estiver, adiciona os artigos padrão.
 */
export async function initializeStorage() {
    const q = query(articlesCollection, limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log("Banco de dados vazio. Populando com artigos padrão...");
        for (const article of defaultArticles) {
            await addDoc(articlesCollection, article);
        }
    } else {
        console.log("O banco de dados já contém dados.");
    }
}