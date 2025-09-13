import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as D from './dom.js';
import { displayFormView } from './editor.js';

const ADMIN_PASSWORD = "1234";
let _isAdmin = false;

// --- INÍCIO DA LÓGICA DE EVENTOS UNIFICADA ---
D.adminView.addEventListener('click', async (e) => {
    const createCategoryBtn = e.target.closest('#admin-create-category-btn');
    const editCategoryBtn = e.target.closest('[data-edit-category-id]');
    const deleteCategoryBtn = e.target.closest('[data-delete-category-id]');
    const createArticleBtn = e.target.closest('[data-create-article-in-category]');
    const editArticleBtn = e.target.closest('[data-edit-id]');
    const deleteArticleBtn = e.target.closest('[data-delete-id]');

    if (createCategoryBtn) {
        handleCreateCategory();
    } else if (editCategoryBtn) {
        const categoryId = editCategoryBtn.dataset.editCategoryId;
        handleUpdateCategory(categoryId);
    } else if (deleteCategoryBtn) {
        const categoryId = deleteCategoryBtn.dataset.deleteCategoryId;
        handleDeleteCategory(categoryId);
    } else if (createArticleBtn) {
        const categoryName = createArticleBtn.dataset.createArticleInCategory;
        const newArticleTemplate = { category: categoryName };
        displayFormView({ article: newArticleTemplate, onSave: createArticle, onBack: displayAdminDashboard });
    } else if (editArticleBtn) {
        const articleId = editArticleBtn.dataset.editId;
        const articles = await Storage.fetchArticles();
        const articleToEdit = articles.find(a => a.id == articleId);
        displayFormView({ article: articleToEdit, onSave: (data) => updateArticle(articleId, data), onBack: displayAdminDashboard });
    } else if (deleteArticleBtn) {
        const articleId = deleteArticleBtn.dataset.deleteId;
        deleteArticle(articleId);
    }
});
// --- FIM DA LÓGICA DE EVENTOS ---

export function isAdmin() { return _isAdmin; }

export function checkAdminStatus() {
    if (sessionStorage.getItem('tvision_isAdmin') === 'true') {
        _isAdmin = true;
        document.body.classList.add('admin-mode');
        D.sidebarAdminLink.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i><span>Sair do Modo Admin</span>`;
    }
}

export function enterAdminMode() {
    const password = prompt('Por favor, digite a senha de administrador:');
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('tvision_isAdmin', 'true');
        _isAdmin = true;
        document.body.classList.add('admin-mode');
        D.sidebarAdminLink.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i><span>Sair do Modo Admin</span>`;
        alert('Acesso concedido. Bem-vindo, Administrador!');
        displayAdminDashboard();
    } else if (password) {
        alert('Senha incorreta. Acesso negado.');
    }
}

export function exitAdminMode() {
    sessionStorage.removeItem('tvision_isAdmin');
    _isAdmin = false;
    document.body.classList.remove('admin-mode');
    D.sidebarAdminLink.innerHTML = `<i class="fa-solid fa-user-shield"></i><span>Administrativo</span>`;
    window.location.hash = '';
    window.location.reload();
}

/**
 * TELA FINAL DO PAINEL DE ADMINISTRAÇÃO (COM PREVIEW)
 */
export async function displayAdminDashboard() {
    UI.showView('admin');
    const [articles, categories] = await Promise.all([
        Storage.fetchArticles(),
        Storage.fetchCategories()
    ]);

    D.adminView.innerHTML = `
        <div class="admin-header">
            <h2>Painel de Gerenciamento</h2>
            <button id="admin-create-category-btn" class="btn btn-primary">Adicionar Nova Categoria</button>
        </div>

        <h3 class="admin-section-title">Preview da Página Inicial</h3>
        <div class="card-container admin-preview-container">
            ${categories.map(category => `
                <div class="card" data-category="${category.name}">
                    <i class="fa-solid ${category.icon || 'fa-folder'}"></i>
                    <span>${category.name}</span>
                </div>
            `).join('') || '<p>Crie uma categoria para ver o preview.</p>'}
        </div>

        <h3 class="admin-section-title">Gerenciar Conteúdo</h3>
        <div class="admin-category-group-list">
            ${categories.map(category => {
                const articlesInCategory = articles.filter(art => art.category === category.name);
                return `
                <div class="category-group">
                    <div class="category-group-header">
                        <div class="category-group-title">
                            <h4><i class="fa-solid ${category.icon || 'fa-folder'}"></i> ${category.name} <span>(${articlesInCategory.length})</span></h4>
                        </div>
                        <div class="category-group-actions">
                            <button class="btn btn-primary btn-sm" data-create-article-in-category="${category.name}">Criar Artigo</button>
                            <button class="btn-icon" data-edit-category-id="${category.id}" title="Editar Categoria"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon" data-delete-category-id="${category.id}" title="Deletar Categoria"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="admin-article-list">
                        ${articlesInCategory.length > 0 ? articlesInCategory.map(article => `
                            <div class="admin-article-item">
                                <div class="admin-article-item-info">
                                    <span>${article.title}</span>
                                </div>
                                <div class="admin-article-item-actions">
                                    <button class="btn btn-secondary btn-sm" data-edit-id="${article.id}">Editar Artigo</button>
                                    <button class="btn btn-danger btn-sm" data-delete-id="${article.id}">Apagar Artigo</button>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-category-message">Nenhum artigo nesta categoria.</p>'}
                    </div>
                </div>
            `}).join('') || '<p>Nenhuma categoria encontrada.</p>'}
        </div>
    `;
    // A função agora só renderiza o HTML. A lógica de clique foi movida para o topo do arquivo.
}

// --- Funções CRUD e Modal (o código delas permanece o mesmo) ---

export async function createArticle(data) {
    if (!data.title || !data.category) {
        alert('Título e Categoria são obrigatórios.');
        return false;
    }
    const newArticle = { title: data.title, category: data.category, content: data.content || '', images: {} };
    await Storage.createArticleInDb(newArticle);
    alert('Artigo criado com sucesso!');
    await displayAdminDashboard();
    return true;
}

export async function updateArticle(id, data) {
    if (!data.title || !data.category) {
        alert('Título e Categoria são obrigatórios.');
        return false;
    }
    const updatedData = { title: data.title, category: data.category, content: data.content || '' };
    await Storage.updateArticleInDb(id, updatedData);
    alert('Artigo atualizado com sucesso!');
    await displayAdminDashboard();
    return true;
}

export async function deleteArticle(id) {
    if (confirm('Tem certeza que deseja deletar este artigo?')) {
        await Storage.deleteArticleInDb(id);
        alert('Artigo deletado com sucesso.');
        await displayAdminDashboard();
    }
}

async function handleCreateCategory() {
    showCategoryModal({
        title: 'Adicionar Nova Categoria',
        onSave: async (categoryData) => {
            await Storage.createCategory(categoryData);
            await displayAdminDashboard();
        }
    });
}

async function handleUpdateCategory(categoryId) {
    const categories = await Storage.fetchCategories();
    const categoryToEdit = categories.find(c => c.id === categoryId);
    showCategoryModal({
        title: `Editar Categoria "${categoryToEdit.name}"`,
        category: categoryToEdit,
        onSave: async (categoryData) => {
            if (categoryData.name !== categoryToEdit.name || categoryData.icon !== categoryToEdit.icon) {
                await Storage.updateCategory(categoryId, categoryData);
                alert(`Categoria atualizada. Se você mudou o nome, lembre-se de reassociar os artigos que a usavam.`);
                await displayAdminDashboard();
            }
        }
    });
}

async function handleDeleteCategory(categoryId) {
    if (confirm("Tem certeza que deseja deletar esta categoria?\n\n(Atenção: os artigos que usam esta categoria NÃO serão deletados.)")) {
        await Storage.deleteCategory(categoryId);
        await displayAdminDashboard();
    }
}

const categoryModal = document.getElementById('category-modal');
const modalTitle = document.getElementById('modal-title');
const modalInput = document.getElementById('modal-input');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalSaveBtn = document.getElementById('modal-save-btn');
let currentModalSaveHandler = null;

modalSaveBtn.addEventListener('click', () => {
    if (typeof currentModalSaveHandler === 'function') {
        currentModalSaveHandler();
    }
});

function showCategoryModal({ title, category = {}, onSave }) {
    modalTitle.textContent = title;
    modalInput.value = category.name || '';
    const availableIcons = [ 'fa-folder', 'fa-book-open', 'fa-screwdriver-wrench', 'fa-receipt', 'fa-headset', 'fa-building-shield', 'fa-star', 'fa-file-alt', 'fa-lightbulb', 'fa-comments', 'fa-cogs', 'fa-chart-bar', 'fa-bullhorn', 'fa-key', 'fa-network-wired', 'fa-wallet' ];
    let iconPickerHTML = '<p style="margin-bottom: 10px; font-weight: 500;">Selecione um ícone:</p><div class="icon-picker-container">';
    availableIcons.forEach(iconClass => {
        const isSelected = (category.icon || 'fa-folder') === iconClass;
        iconPickerHTML += `<div class="icon-picker-item ${isSelected ? 'active' : ''}" data-icon="${iconClass}" title="${iconClass.replace('fa-','')}"><i class="fa-solid ${iconClass}"></i></div>`;
    });
    iconPickerHTML += '</div>';
    const pickerWrapper = categoryModal.querySelector('#modal-icon-picker-wrapper');
    if (pickerWrapper) { pickerWrapper.innerHTML = iconPickerHTML; } else {
        const newPickerWrapper = document.createElement('div');
        newPickerWrapper.id = 'modal-icon-picker-wrapper';
        newPickerWrapper.innerHTML = iconPickerHTML;
        modalInput.after(newPickerWrapper);
    }
    categoryModal.querySelectorAll('.icon-picker-item').forEach(item => {
        item.addEventListener('click', () => {
            categoryModal.querySelector('.icon-picker-item.active')?.classList.remove('active');
            item.classList.add('active');
        });
    });

    currentModalSaveHandler = () => {
        const newName = modalInput.value.trim();
        const selectedIconEl = categoryModal.querySelector('.icon-picker-item.active');
        const newIcon = selectedIconEl ? selectedIconEl.dataset.icon : 'fa-folder';
        if (newName) {
            onSave({ name: newName, icon: newIcon });
            categoryModal.classList.add('hidden');
            currentModalSaveHandler = null;
        } else {
            alert("O nome da categoria não pode ficar em branco.");
        }
    };
    
    modalCancelBtn.onclick = () => {
        categoryModal.classList.add('hidden');
        currentModalSaveHandler = null;
    }
    window.onkeydown = (event) => {
        if (event.key === 'Escape') {
            modalCancelBtn.onclick();
        }
    };

    categoryModal.classList.remove('hidden');
    modalInput.focus();
}
