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
    const exportJsonBtn = document.getElementById('export-json-btn');

    // --- Variáveis de Estado ---
    let isEditMode = false;
    let currentArticleId = null;
    let currentCategoryName = null;
    let tempImages = {};

    // --- Inicialização da Aplicação ---
    initializeWiki();

    // --- Funções de Setup e Lógica Principal ---

    function initializeWiki() {
        fetch('http://127.0.0.1:5000/api/articles')
            .then(response => {
                if (!response.ok) throw new Error('Erro de rede ao conectar com a API: ' + response.statusText);
                return response.json();
            })
            .then(data => {
                saveArticlesToStorage(data);
                setupEventListeners();
                showView('welcome');
            })
            .catch(error => {
                console.error('Falha ao inicializar a wiki pela API:', error);
                document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif;"><h1>Erro de Conexão</h1><p>Não foi possível conectar ao backend. Verifique se o servidor Python (Flask) está rodando.</p></div>`;
            });
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
        exportJsonBtn.addEventListener('click', exportProjectAsZip); 
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
        if (isEditMode) {
            const article = getArticlesFromStorage().find(a => a.id == currentArticleId);
            tempImages = article && article.images ? { ...article.images } : {};
        } else {
            tempImages = {};
        }

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

        if (currentArticleId) {
            // LÓGICA DE EDIÇÃO via API
            const updatedArticle = {
                category: currentCategoryName, 
                title: newTitle,
                content: newContent,
                images: { ...tempImages }
            };

            fetch(`http://127.0.0.1:5000/api/articles/${currentArticleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedArticle),
            })
            .then(response => response.ok ? response.json() : Promise.reject('Falha ao atualizar o artigo.'))
            .then(data => {
                alert(data.message || 'Artigo atualizado com sucesso!');
                return fetch('http://127.0.0.1:5000/api/articles');
            })
            .then(response => response.json())
            .then(articles => {
                saveArticlesToStorage(articles);
                toggleEditMode();
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Não foi possível atualizar o artigo.');
            });
            
        } else {
            // LÓGICA DE CRIAÇÃO via API
            const newArticle = { 
                category: currentCategoryName, 
                title: newTitle, 
                content: newContent,
                images: { ...tempImages }
            };

            fetch('http://127.0.0.1:5000/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArticle),
            })
            .then(response => response.ok ? response.json() : Promise.reject('Falha ao criar artigo.'))
            .then(data => {
                alert(data.message || 'Artigo criado com sucesso!');
                return fetch('http://127.0.0.1:5000/api/articles');
            })
            .then(response => response.json())
            .then(articles => {
                saveArticlesToStorage(articles);
                isEditMode = false;
                editModeControls.classList.add('hidden');
                displayCategory(currentCategoryName);
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Não foi possível criar o artigo.');
            });
        }
    }
    
    function deleteArticle() {
        // Esta função ainda não está conectada ao backend. Será o próximo passo.
        if (!currentArticleId) return;
        const confirmed = confirm('Tem a certeza que deseja eliminar este artigo? Esta ação não pode ser desfeita.');
        if (confirmed) {
            let articles = getArticlesFromStorage();
            const updatedArticles = articles.filter(a => a.id != currentArticleId);
            saveArticlesToStorage(updatedArticles);
            alert('Artigo eliminado localmente (ainda não no backend).');
            isEditMode = false;
            editModeControls.classList.add('hidden');
            displayCategory(currentCategoryName);
        }
    }

    function exportProjectAsZip() {
        try {
            const articles = getArticlesFromStorage();
            let articlesForJson = JSON.parse(JSON.stringify(articles));
            const zip = new JSZip();
            const imgFolder = zip.folder("images");

            articlesForJson.forEach(article => {
                if (article.images) {
                    Object.keys(article.images).forEach(filename => {
                        const base64Data = article.images[filename].split(',')[1];
                        imgFolder.file(filename, base64Data, { base64: true });
                    });
                    article.content = article.content.replace(/!\[\]\((.*?)\)/g, (match, filename) => {
                        return `![](images/${filename})`;
                    });
                    delete article.images;
                }
            });

            zip.file("data.json", JSON.stringify(articlesForJson, null, 4));

            zip.generateAsync({ type: "blob" })
                .then(function(content) {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(content);
                    a.download = 'tvision_wiki_projeto.zip';
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(a.href);
                    a.remove();
                    alert('Projeto exportado como .zip com sucesso!');
                }).catch(err => {
                    console.error("Erro ao gerar o ZIP:", err);
                    alert("Ocorreu um erro ao gerar o arquivo .zip.");
                });
        } catch (error) {
            console.error("Erro na função de exportar:", error);
            alert("Ocorreu um erro ao exportar.");
        }
    }

    function displayCreateArticleView() {
        currentArticleId = null;
        tempImages = {};
        const titleDisplay = document.getElementById('article-title-display');
        const contentDisplay = document.getElementById('article-content-display');
        titleDisplay.innerHTML = `<input type="text" id="edit-article-title" placeholder="Digite o título do novo artigo" />`;
        
        const editorHtml = `
            <div class="editor-toolbar">
                <button class="toolbar-button" id="add-image-btn" title="Adicionar Imagem">
                    <i class="fa-solid fa-image"></i> Adicionar Imagem
                </button>
            </div>
            <textarea id="edit-article-content" placeholder="Digite o conteúdo do novo artigo"></textarea>
        `;
        contentDisplay.innerHTML = editorHtml;

        setupToolbarListeners();
        
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

        // CORRIGIDO: O seletor agora é '.article-card' para garantir que o clique funcione.
        categoryView.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => {
                displayArticle(card.dataset.id, card.dataset.category)
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
                        <span>Ler mais <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                `).join('')}
            </div>`;
        }
        categoryView.innerHTML = content;

        // CORRIGIDO: O seletor aqui também deve ser '.article-card'.
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
            const editorHtml = `
                <div class="editor-toolbar">
                    <button class="toolbar-button" id="add-image-btn" title="Adicionar Imagem">
                        <i class="fa-solid fa-image"></i> Adicionar Imagem
                    </button>
                </div>
                <textarea id="edit-article-content">${article.content}</textarea>
            `;
            contentDisplay.innerHTML = editorHtml;
            setupToolbarListeners();
            deleteArticleBtn.classList.remove('hidden');
            saveChangesBtn.classList.remove('hidden');
        } else {
            titleDisplay.innerHTML = `<i class="fa-solid fa-book"></i> ${article.title}`;
            contentDisplay.innerHTML = renderContent(article.content, article.images);
        }
        updateBreadcrumbs(['Início', categoryName, article.title]);
        showView('article');
    }

    // --- Funções Auxiliares ---
    
    function renderContent(text, images = {}) {
        const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        const withImages = safeText.replace(/!\[\]\((.*?)\)/g, (match, filename) => {
            const imageSrc = images[filename] || '';
            if (imageSrc) {
                return `<img src="${imageSrc}" alt="Imagem do artigo" class="article-image">`;
            }
            return '(Imagem não encontrada)';
        });
        
        const withLineBreaks = withImages.replace(/\n/g, '<br>');
        return withLineBreaks;
    }
    
    function setupToolbarListeners() {
        const addImageBtn = document.getElementById('add-image-btn');
        if (addImageBtn) {
            addImageBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = readerEvent => {
                            const base64Content = readerEvent.target.result;
                            const filename = `artigo_${currentArticleId || 'novo'}_${Date.now()}.${file.name.split('.').pop()}`;
                            tempImages[filename] = base64Content;
                            insertTextAtCursor(`![](${filename})`);
                        }
                        reader.readAsDataURL(file);
                    }
                }
                fileInput.click();
            });
        }
    }
    
    function insertTextAtCursor(text) {
        const textarea = document.getElementById('edit-article-content');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const newText = currentText.substring(0, start) + text + currentText.substring(end);
        textarea.value = newText;
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }

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
            tempImages = {};
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
