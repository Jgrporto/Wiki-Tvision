// js/main.js (Corrigido para busca assíncrona)

import * as D from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Router from './router.js';
import * as Admin from './admin.js';
import { setupTheme } from './theme.js'

document.addEventListener('DOMContentLoaded', () => {
    Storage.initializeStorage();
    Admin.checkAdminStatus();
    setupStaticEventListeners();
    
    if (Admin.isAdmin()) {
        Admin.displayAdminDashboard();
    } else {
        Router.handleInitialRoute();
    }
    console.log("Aplicação Wiki modularizada iniciada com sucesso!")
    setupTheme(); // <-- ADICIONE ESTA LINHA
});

function setupStaticEventListeners() {
    UI.setupSidebar();

    D.homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (Admin.isAdmin()) {
            Admin.displayAdminDashboard();
        } else {
            history.pushState({ view: 'welcome' }, '', window.location.pathname);
            Router.route({ view: 'welcome' });
        }
    });

    // Listener da barra de busca CORRIGIDO
    const performSearch = async () => { // <--- Função agora é async
        const searchTerm = D.heroSearchInput.value.trim();
        if (!searchTerm) return;
        
        // Usa await para esperar os artigos do Firebase
        const articles = await Storage.fetchArticles(); 
        
        const results = articles.filter(article =>
            (article.title && article.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (article.content && article.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        Router.displaySearchResults(results, searchTerm);
    };

    // Mantemos o listener de 'submit' do formulário
    D.heroSearchBtn.addEventListener('click', performSearch);
    D.heroSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    D.quickAccessCards.forEach(card => {
        card.addEventListener('click', () => {
            Router.displayCategory(card.dataset.category);
        });
    });

    window.addEventListener('popstate', (event) => {
        if (Admin.isAdmin()) return;
        Router.route(event.state);
    });
}