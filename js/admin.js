import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as D from './dom.js';
import { displayFormView } from './editor.js';

const ADMIN_PASSWORD = "1234";
let _isAdmin = false;

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
        displayAdminDashboard(); // Chama a nova função unificada
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
 * TELA ÚNICA E UNIFICADA DO PAINEL DE ADMINISTRAÇÃO
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

        <div class="admin-category-group-list">
            ${categories.map(category => {
                const articlesInCategory = articles.filter(art => art.category === category.name);
                return `
                <div class="category-group">
                    <div class="category-group-header">
                        <div class="category-group-title">
                            <h4>${category.name} (${articlesInCategory.length})</h4>
                        </div>
                        <div class="category-group-actions">
                            <button class="btn btn-primary btn-sm" data-create-article-in-category="${category.name}">Criar Artigo</button>
                            <button class="btn-icon" data-edit-category-id="${category.id}" data-category-name="${category.name}" title="Renomear Categoria"><i class="fa-solid fa-pen"></i></button>
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

    // Listeners para todas as ações
    D.adminView.querySelector('#admin-create-category-btn').addEventListener('click', handleCreateCategory);
    
    D.adminView.querySelectorAll('[data-edit-category-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.target.closest('button').dataset.editCategoryId;
            const categoryName = e.target.closest('button').dataset.categoryName;
            handleUpdateCategory(categoryId, categoryName);
        });
    });

    D.adminView.querySelectorAll('[data-delete-category-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryId = e.target.closest('button').dataset.deleteCategoryId;
            handleDeleteCategory(categoryId);
        });
    });

    D.adminView.querySelectorAll('[data-create-article-in-category]').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryName = e.target.closest('button').dataset.createArticleInCategory;
            const newArticleTemplate = { category: categoryName };
            displayFormView({ article: newArticleTemplate, onSave: createArticle, onBack: displayAdminDashboard });
        });
    });

    D.adminView.querySelectorAll('[data-edit-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const articleId = e.target.dataset.editId;
            const articleToEdit = articles.find(a => a.id == articleId);
            displayFormView({ article: articleToEdit, onSave: (data) => updateArticle(articleId, data), onBack: displayAdminDashboard });
        });
    });

    D.adminView.querySelectorAll('[data-delete-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const articleId = e.target.dataset.deleteId;
            deleteArticle(articleId);
        });
    });
}

export async function createArticle(data) {
    if (!data.title || !data.category) {
        alert('Título e Categoria são obrigatórios.');
        return false;
    }
    const newArticle = { 
        title: data.title,
        category: data.category,
        content: data.content || '', 
        images: {}
    };
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
    const updatedData = {
        title: data.title,
        category: data.category,
        content: data.content || ''
    };
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
        onSave: async (newName) => {
            await Storage.createCategory(newName);
            await displayAdminDashboard();
        }
    });
}

async function handleUpdateCategory(categoryId, oldName) {
    showCategoryModal({
        title: `Renomear Categoria "${oldName}"`,
        value: oldName,
        onSave: async (newName) => {
            if (newName !== oldName) {
                await Storage.updateCategory(categoryId, newName);
                alert(`Categoria renomeada para "${newName}". Lembre-se de atualizar os artigos que usavam a categoria antiga.`);
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

function showCategoryModal({ title, value = '', onSave }) {
    modalTitle.textContent = title;
    modalInput.value = value;
    categoryModal.classList.remove('hidden');
    modalInput.focus();
    const newSaveBtn = modalSaveBtn.cloneNode(true);
    modalSaveBtn.parentNode.replaceChild(newSaveBtn, modalSaveBtn);
    const newCancelBtn = modalCancelBtn.cloneNode(true);
    modalCancelBtn.parentNode.replaceChild(newCancelBtn, modalCancelBtn);
    newSaveBtn.addEventListener('click', () => {
        const inputValue = modalInput.value.trim();
        if (inputValue) { onSave(inputValue); categoryModal.classList.add('hidden'); }
    });
    newCancelBtn.addEventListener('click', () => { categoryModal.classList.add('hidden'); });
    window.onkeydown = (event) => { if (event.key === 'Escape') { categoryModal.classList.add('hidden'); } };
}
