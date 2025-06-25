document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos do HTML ---
    const welcomeView = document.getElementById('welcome-view');
    const categoryView = document.getElementById('category-view');
    const articleView = document.getElementById('article-view');
    const quickAccessCards = document.querySelectorAll('.card');
    const homeLink = document.getElementById('home-link');
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    const heroSearchInput = document.getElementById('hero-search-input');
    const heroSearchBtn = document.getElementById('hero-search-btn');
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');

    // --- Inicialização da Aplicação ---
    initializeWiki();

    // --- Funções de Setup e Lógica Principal ---

    function initializeWiki() {
        // Busca os dados do arquivo data.json e então configura o resto da aplicação.
        fetch('data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro de rede ao carregar data.json: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                // Uma vez que os dados são carregados, salvamos no LocalStorage
                saveArticlesToStorage(data);
                
                // Agora que os dados estão prontos, configuramos os eventos e a view inicial.
                setupEventListeners();
                showView('welcome');
            })
            .catch(error => {
                console.error('Falha ao inicializar a wiki:', error);
                // Você pode exibir uma mensagem de erro para o usuário aqui.
            });
    }

    function setupEventListeners() {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('welcome');
        });

        quickAccessCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                displayCategory(category);
            });
        });

        const performSearch = () => {
            const searchTerm = heroSearchInput.value.trim();
            if (!searchTerm) return;
            
            const searchResults = getArticlesFromStorage().filter(article => 
                article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                article.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
            displaySearchResults(searchResults, searchTerm);
        };

        heroSearchBtn.addEventListener('click', performSearch);
        heroSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Configura o menu dropdown do usuário
        setupDropdown();
    }
    
    function setupDropdown() {
        if (!userMenuButton || !userDropdown) return;

        userMenuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        window.addEventListener('click', (event) => {
            if (!userDropdown.contains(event.target) && !userMenuButton.contains(event.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // --- Funções de Renderização de Views ---

    function displayCategory(categoryName) {
        const articlesInCategory = getArticlesFromStorage().filter(a => a.category === categoryName);
        categoryView.innerHTML = `
            <div class="category-header-main">
                <h2><i class="fa-solid fa-folder-open"></i> Categoria: ${categoryName}</h2>
                <p>Encontre abaixo todos os artigos relacionados a ${categoryName}.</p>
            </div>
            <div class="article-grid">
                ${articlesInCategory.map(article => `
                    <div class="article-card" data-id="${article.id}" data-category="${article.category}">
                        <h3>${article.title}</h3>
                        <p>${article.content.substring(0, 100)}...</p>
                        <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                `).join('')}
            </div>
        `;
        
        categoryView.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => {
                displayArticle(card.dataset.id, card.dataset.category);
            });
        });

        updateBreadcrumbs(['Início', categoryName]);
        showView('category');
    }

    function displaySearchResults(results, searchTerm) {
        let content = `
            <div class="category-header-main">
                <h2><i class="fa-solid fa-search"></i> Resultados para "${searchTerm}"</h2>
                <p>${results.length} artigo(s) encontrado(s).</p>
            </div>
        `;
        if (results.length > 0) {
            content += `<div class="article-grid">
                ${results.map(article => `
                    <div class="article-card" data-id="${article.id}" data-category="${article.category}">
                        <h3>${article.title}</h3>
                        <p>${article.content.substring(0, 100)}...</p>
                        <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                `).join('')}
            </div>`;
        }
        categoryView.innerHTML = content;
        
        categoryView.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => {
                displayArticle(card.dataset.id, card.dataset.category);
            });
        });

        updateBreadcrumbs(['Início', `Busca: ${searchTerm}`]);
        showView('category');
    }

    function displayArticle(id, categoryName) {
        const article = getArticlesFromStorage().find(a => a.id == id);
        if (!article) {
            showView('welcome');
            return;
        }

        document.getElementById('article-title-display').innerHTML = `<i class="fa-solid fa-book"></i> ${article.title}`;
        document.getElementById('article-content-display').textContent = article.content;
        
        updateBreadcrumbs(['Início', categoryName, article.title]);
        showView('article');
    }

    // --- Funções Auxiliares ---
    
    function updateBreadcrumbs(path) {
        breadcrumbsContainer.innerHTML = path.map((item, index) => {
            if (index === path.length - 1) {
                return `<span class="breadcrumb-active">${item}</span>`;
            }
            if (item === 'Início') {
                return `<a href="#" class="breadcrumb-link" data-path="home">${item}</a>`;
            }
            if(path.length === 3 && index === 1) {
                 return `<a href="#" class="breadcrumb-link" data-path="${item}">${item}</a>`;
            }
            return `<span>${item}</span>`;
        }).join('<span class="breadcrumb-separator">/</span>');

        breadcrumbsContainer.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = e.target.dataset.path;
                if (path === 'home') {
                    showView('welcome');
                } else {
                    displayCategory(path);
                }
            });
        });
    }
    
    function showView(viewName) {
        welcomeView.classList.add('hidden');
        categoryView.classList.add('hidden');
        articleView.classList.add('hidden');
        document.getElementById(`${viewName}-view`).classList.remove('hidden');

        if (viewName === 'welcome') {
            updateBreadcrumbs([]);
            if (heroSearchInput) heroSearchInput.value = '';
        }
    }

    function getArticlesFromStorage() {
        const articles = localStorage.getItem('tvision_wiki_articles');
        return articles ? JSON.parse(articles) : [];
    }

    function saveArticlesToStorage(articles) {
        localStorage.setItem('tvision_wiki_articles', JSON.stringify(articles));
    }
});