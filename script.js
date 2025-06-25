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
    
    const editModeBtn = document.getElementById('edit-mode-btn');
    const editModeControls = document.getElementById('edit-mode-controls');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const exitEditModeBtn = document.getElementById('exit-edit-mode-btn');
    const deleteArticleBtn = document.getElementById('delete-article-btn');
    const exportJsonBtn = document.getElementById('export-json-btn'); // NOVO: Referência para o botão de exportar

    // --- Variáveis de Estado ---
    let isEditMode = false;
    let currentArticleId = null;
    let currentCategoryName = null;

    // --- Inicialização da Aplicação ---
    initializeWiki();

    // --- Funções de Setup e Lógica Principal ---

    function initializeWiki() {
        fetch('data.json')
            .then(response => {
                if (!response.ok) throw new Error('Erro de rede: ' + response.statusText);
                return response.json();
            })
            .then(data => {
                if (!localStorage.getItem('tvision_wiki_articles')) {
                    saveArticlesToStorage(data);
                }
                setupEventListeners();
                showView('welcome');
            })
            .catch(error => console.error('Falha ao inicializar a wiki:', error));
    }

    function setupEventListeners() {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showView('welcome');
        });

        quickAccessCards.forEach(card => {
            card.addEventListener('click', () => displayCategory(card.dataset.category));
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
            if (e.key === 'Enter') performSearch();
        });

        setupDropdown();
        
        editModeBtn.addEventListener('click', toggleEditMode);
        exitEditModeBtn.addEventListener('click', toggleEditMode);
        saveChangesBtn.addEventListener('click', saveArticleChanges);
        deleteArticleBtn.addEventListener('click', deleteArticle);
        exportJsonBtn.addEventListener('click', exportToJson); // NOVO: Listener para o botão de exportar
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

    // --- Funções do Modo de Edição e Gerenciamento ---

    function toggleEditMode() {
        isEditMode = !isEditMode;
        editModeControls.classList.toggle('hidden', !isEditMode);
        userDropdown.classList.remove('show');

        if (!articleView.classList.contains('hidden')) {
            if (currentArticleId) {
                const article = getArticlesFromStorage().find(a => a.id == currentArticleId);
                displayArticle(currentArticleId, article.category);
            }
        }
    }

    function saveArticleChanges() {
        const newTitle = document.getElementById('edit-article-title').value.trim();
        const newContent = document.getElementById('edit-article-content').value.trim();

        if (!newTitle || !newContent) {
            alert('O título e o conteúdo não podem estar vazios.');
            return;
        }

        let articles = getArticlesFromStorage();

        if (currentArticleId) {
            const articleIndex = articles.findIndex(a => a.id == currentArticleId);
            if (articleIndex > -1) {
                articles[articleIndex].title = newTitle;
                articles[articleIndex].content = newContent;
                saveArticlesToStorage(articles);
                alert('Artigo salvo com sucesso!');
                toggleEditMode();
            }
        } else {
            const newId = Math.max(...articles.map(a => a.id), 0) + 1;
            const newArticle = { id: newId, category: currentCategoryName, title: newTitle, content: newContent };
            articles.push(newArticle);
            saveArticlesToStorage(articles);
            alert('Novo artigo criado com sucesso!');
            
            isEditMode = false;
            editModeControls.classList.add('hidden');
            displayArticle(newId, currentCategoryName);
        }
    }
    
    function deleteArticle() {
        if (!currentArticleId) return;

        const confirmed = confirm('Você tem certeza que deseja deletar este artigo? Esta ação não pode ser desfeita.');
        
        if (confirmed) {
            let articles = getArticlesFromStorage();
            const updatedArticles = articles.filter(a => a.id != currentArticleId);
            saveArticlesToStorage(updatedArticles);
            
            alert('Artigo deletado com sucesso.');
            
            isEditMode = false;
            editModeControls.classList.add('hidden');
            displayCategory(currentCategoryName);
        }
    }

    // NOVO: Função para exportar os dados para um arquivo JSON
    function exportToJson() {
        const articles = getArticlesFromStorage();
        // O 'null, 4' formata o JSON para ser legível (com 4 espaços de indentação)
        const jsonString = JSON.stringify(articles, null, 4);
        
        // Cria um objeto "Blob", que é como um arquivo em memória
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Cria um link temporário para o download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json'; // Define o nome do arquivo a ser baixado
        
        // Simula um clique no link para iniciar o download e depois o remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Libera o objeto URL da memória
        URL.revokeObjectURL(url);
    }

    function displayCreateArticleView() {
        currentArticleId = null;
        
        const titleDisplay = document.getElementById('article-title-display');
        const contentDisplay = document.getElementById('article-content-display');

        titleDisplay.innerHTML = `<input type="text" id="edit-article-title" placeholder="Digite o título do novo artigo" />`;
        contentDisplay.innerHTML = `<textarea id="edit-article-content" placeholder="Digite o conteúdo do novo artigo"></textarea>`;
        
        deleteArticleBtn.classList.add('hidden');
        saveChangesBtn.classList.remove('hidden');

        updateBreadcrumbs(['Início', currentCategoryName, 'Novo Artigo']);
        showView('article');
        
        if (!isEditMode) {
            isEditMode = true;
            editModeControls.classList.remove('hidden');
        }
    }

    // --- Funções de Renderização de Views ---

   // Substitua a função displayCategory pela versão abaixo
function displayCategory(categoryName) {
    currentCategoryName = categoryName; 
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
                    <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            `).join('') || `<p>Ainda não há artigos nesta categoria.</p>`}
        </div>
    `;
    
    const header = categoryView.querySelector('.category-header-main');
    const newArticleBtn = document.createElement('button');
    newArticleBtn.id = 'add-new-article-btn';
    newArticleBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Criar Novo Artigo';
    header.appendChild(newArticleBtn);

    newArticleBtn.addEventListener('click', displayCreateArticleView);

    categoryView.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => displayArticle(card.dataset.id, card.dataset.category));
    });

    updateBreadcrumbs(['Início', categoryName]);
    showView('category');
}

// Substitua a função displaySearchResults pela versão abaixo
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
                    <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            `).join('')}
        </div>`;
    }
    categoryView.innerHTML = content;

    categoryView.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => displayArticle(card.dataset.id, card.dataset.category));
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
        
        currentArticleId = id;
        currentCategoryName = categoryName;

        const titleDisplay = document.getElementById('article-title-display');
        const contentDisplay = document.getElementById('article-content-display');

        if (isEditMode) {
            titleDisplay.innerHTML = `<input type="text" id="edit-article-title" value="${article.title}" />`;
            contentDisplay.innerHTML = `<textarea id="edit-article-content">${article.content}</textarea>`;
            
            deleteArticleBtn.classList.remove('hidden');
            saveChangesBtn.classList.remove('hidden');

        } else {
            titleDisplay.innerHTML = `<i class="fa-solid fa-book"></i> ${article.title}`;
            contentDisplay.textContent = article.content;
        }

        updateBreadcrumbs(['Início', categoryName, article.title]);
        showView('article');
    }

    // --- Funções Auxiliares ---

    function updateBreadcrumbs(path) {
        breadcrumbsContainer.innerHTML = path.map((item, index) => {
            if (index === path.length - 1) return `<span class="breadcrumb-active">${item}</span>`;
            if (item === 'Início') return `<a href="#" class="breadcrumb-link" data-path="home">${item}</a>`;
            if (path.length >= 2 && index === 1) return `<a href="#" class="breadcrumb-link" data-path="${item}">${item}</a>`;
            return `<span>${item}</span>`;
        }).join('<span class="breadcrumb-separator">/</span>');

        breadcrumbsContainer.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = e.target.dataset.path;
                if (path === 'home') showView('welcome');
                else displayCategory(path);
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
            currentArticleId = null;
            currentCategoryName = null;
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
