import * as D from './dom.js';
import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Router from './router.js';
import * as Admin from './admin.js';
import { setupTheme } from './theme.js';

/**
 * NOVA FUNÇÃO: Busca as categorias e cria os cards da página inicial.
 */
async function renderHomepageCards() {
    const categories = await Storage.fetchCategories();
    const cardContainer = document.querySelector('.card-container');
    
    // Se não encontrar o container, interrompe a função
    if (!cardContainer) return;

    // Limpa os cards estáticos que estão no HTML
    cardContainer.innerHTML = ''; 

    // Cria um novo card para cada categoria vinda do Firebase
    if (categories.length > 0) {
        categories.forEach(category => {
            // Define um ícone padrão ou customizado por categoria
            const iconMap = {
                'Técnico': 'fa-screwdriver-wrench',
                'Planos': 'fa-receipt',
                'Atendimento': 'fa-headset',
                'Políticas': 'fa-building-shield'
            };
            const iconClass = iconMap[category.name] || 'fa-folder'; // Ícone padrão

            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.category = category.name;
            card.innerHTML = `
                <i class="fa-solid ${iconClass}"></i>
                <span>${category.name}</span>
            `;
            // Adiciona o listener de clique diretamente no novo card
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
        Admin.displayCategoryDashboard(); // Ajustado para a nova tela de admin
    } else {
        Router.handleInitialRoute();
        renderHomepageCards(); // Chama a função para renderizar os cards dinâmicos
    }
    
    console.log("Aplicação Wiki modularizada iniciada com sucesso!");
    setupTheme();
});


function setupStaticEventListeners() {
    UI.setupSidebar();

    D.homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (Admin.isAdmin()) {
            Admin.displayCategoryDashboard(); // Ajustado para a nova tela de admin
        } else {
            // Limpa o hash para garantir que a home seja exibida
            window.location.hash = '';
            showView('welcome');
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

    // A lógica de clique dos cards foi MOVIDA para dentro de renderHomepageCards
    // Portanto, o D.quickAccessCards.forEach() foi REMOVIDO daqui.

    window.addEventListener('popstate', (event) => {
        if (Admin.isAdmin()) return;
        Router.route(event.state);
    });
}
