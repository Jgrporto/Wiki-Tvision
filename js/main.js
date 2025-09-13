import * as D from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Router from './router.js';
import * as Admin from './admin.js';
import { setupTheme } from './theme.js';

/**
 * Busca as categorias e cria os cards da página inicial dinamicamente.
 */
async function renderHomepageCards() {
    const categories = await Storage.fetchCategories();
    const cardContainer = document.querySelector('.card-container');
    
    if (!cardContainer) return;

    cardContainer.innerHTML = ''; 

    if (categories.length > 0) {
        categories.forEach(category => {
            // CORREÇÃO: Usa o ícone salvo no banco de dados para a categoria.
            // Fornece 'fa-folder' como um ícone padrão caso nenhum tenha sido salvo.
            const iconClass = category.icon || 'fa-folder';

            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.category = category.name;
            card.innerHTML = `
                <i class="fa-solid ${iconClass}"></i>
                <span>${category.name}</span>
            `;
            card.addEventListener('click', () => {
                Router.displayCategory(card.dataset.category);
            });
            cardContainer.appendChild(card);
        });
    } else {
        cardContainer.innerHTML = '<p>Nenhuma categoria foi criada ainda.</p>';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    Storage.initializeStorage();
    Admin.checkAdminStatus();
    setupStaticEventListeners();
    
    if (Admin.isAdmin()) {
        Admin.displayAdminDashboard(); 
    } else {
        Router.handleInitialRoute();
        renderHomepageCards();
    }
    
    console.log("Aplicação Wiki modularizada iniciada com sucesso!");
    setupTheme();
});


function setupStaticEventListeners() {
    UI.setupSidebar();

    D.homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (Admin.isAdmin()) {
            Admin.displayAdminDashboard(); 
        } else {
            window.location.hash = '';
            UI.showView('welcome'); // Usando a função importada de UI
            renderHomepageCards();
        }
    });

    const performSearch = async () => {
        const searchTerm = D.heroSearchInput.value.trim();
        if (!searchTerm) return;
        const articles = await Storage.fetchArticles(); 
        const results = articles.filter(article =>
            (article.title && article.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (article.content && article.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        Router.displaySearchResults(results, searchTerm);
    };

    D.heroSearchBtn.addEventListener('click', performSearch);
    D.heroSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    window.addEventListener('popstate', (event) => {
        if (Admin.isAdmin()) return;
        Router.route(event.state);
    });
}
