// js/router.js (Corrigido para ser assíncrono)

import * as D from './dom.js';
import * as Storage from './storage.js';
import { showView } from './ui.js';
import { displayFormView } from './editor.js';

function renderContent(htmlContent) {
    return htmlContent || '';
}

// A função agora é ASYNC
export async function displayArticle(id, categoryName, updateHistory = true) {
    // Usa await para esperar os artigos do Firebase
    const articles = await Storage.fetchArticles();
    const article = articles.find(a => a.id == id);

    if (!article) {
        console.error(`Artigo com ID ${id} não encontrado.`);
        return;
    }
    if (updateHistory) {
        history.pushState({ view: 'article', id: id, categoryName: categoryName }, '', `#/${categoryName}/${id}`);
    }
    
    // ... (o resto da função continua igual)
    D.categoryView.innerHTML = '';
    const titleDisplay = D.articleView.querySelector('#article-title-display');
    const contentDisplay = D.articleView.querySelector('#article-content-display');
    if(titleDisplay) {
        titleDisplay.innerHTML = `<h2><i class="fa-solid fa-book"></i> ${article.title}</h2>`;
        const backButton = document.createElement('button');
        backButton.className = 'header-back-btn';
        backButton.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Voltar`;
        backButton.onclick = () => window.history.back();
        titleDisplay.prepend(backButton);
    }
    if(contentDisplay) {
        contentDisplay.innerHTML = renderContent(article.content); 
    }
    showView('article');
}

// A função agora é ASYNC
export async function displayCategory(categoryName, updateHistory = true) {
    if (updateHistory) {
        history.pushState({ view: 'category', name: categoryName }, '', `#/${categoryName}`);
    }
    
    D.articleView.innerHTML = `<h2 id="article-title-display"></h2><div id="article-content-display"></div>`;
    
    // Usa await para esperar os artigos do Firebase
    const articles = await Storage.fetchArticles();
    const articlesInCategory = articles.filter(a => a.category === categoryName);

    // ... (o resto da função continua igual)
    D.categoryView.innerHTML = `
        <div class="category-header-main">
            <button class="header-back-btn"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
            <h2><i class="fa-solid fa-folder-open"></i> Categoria: ${categoryName}</h2>
            <p>Encontre abaixo todos os artigos relacionados a ${categoryName}.</p>
        </div>
        <div class="article-grid">
            ${articlesInCategory.map(article => `
                <div class="article-card" data-id="${article.id}" data-category="${article.category}">
                    <h3>${article.title}</h3>
                    <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            `).join('') || `<p>Ainda não há artigos nesta categoria.</p>`}
        </div>
    `;
    D.categoryView.querySelector('.header-back-btn').addEventListener('click', () => window.history.back());
    D.categoryView.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => displayArticle(card.dataset.id, card.dataset.category));
    });
    
    showView('category');
}

// A função de busca já recebe os resultados, mas as funções que ela chama (displayArticle) são async
export function displaySearchResults(results, searchTerm) {
    D.articleView.innerHTML = `<h2 id="article-title-display"></h2><div id="article-content-display"></div>`;
    let content = `
        <div class="category-header-main">
            <button class="header-back-btn"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
            <h2><i class="fa-solid fa-search"></i> Resultados para "${searchTerm}"</h2>
            <p>${results.length} artigo(s) encontrado(s).</p>
        </div>
    `;
    if (results.length > 0) {
        content += `<div class="article-grid">
            ${results.map(article => `
                <div class="article-card" data-id="${article.id}" data-category="${article.category}">
                    <h3>${article.title}</h3>
                    <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            `).join('')}
        </div>`;
    }
    D.categoryView.innerHTML = content;
    D.categoryView.querySelector('.header-back-btn').addEventListener('click', () => window.history.back());
    D.categoryView.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => displayArticle(card.dataset.id, card.dataset.category));
    });
    
    showView('category');
}


// A função agora é ASYNC
export async function handleInitialRoute() {
    const hash = window.location.hash;
    if (hash) {
        const parts = hash.substring(2).split('/');
        // Usa await para esperar os artigos do Firebase
        const articles = await Storage.fetchArticles();
        
        if (parts.length === 2 && articles.find(a => a.id == parts[1])) {
            displayArticle(parts[1], parts[0], false);
        } else if (parts.length === 1 && Array.from(D.quickAccessCards).find(c => c.dataset.category === parts[0])) {
            displayCategory(parts[0], false);
        } else {
            showView('welcome');
        }
    } else {
        showView('welcome');
    }
}

// A função route agora chama funções async
export function route(state) {
    if (!state) {
        showView('welcome');
        return;
    }
    switch (state.view) {
        case 'welcome': showView('welcome', false); break;
        case 'category': displayCategory(state.name, false); break;
        case 'article': displayArticle(state.id, state.categoryName, false); break;
        case 'create': displayFormView(null, false); break;
        default: showView('welcome', false);
    }
}
