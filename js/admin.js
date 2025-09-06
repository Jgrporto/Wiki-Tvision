// js/admin.js (Refatorado para Firebase)

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
        displayAdminDashboard(); // Chama a nova função async
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

// A função agora é ASYNC para poder esperar pelos dados do Firebase
export async function displayAdminDashboard() {
    UI.showView('admin');
    const articles = await Storage.fetchArticles(); // Usa a nova função fetchArticles
    
    D.adminView.innerHTML = `
        <div class="admin-header">
            <h2>Painel Administrativo</h2>
            <button id="admin-create-btn" class="btn btn-primary">Criar Novo Artigo</button>
        </div>
        <div class="admin-article-list">
            ${articles.map(article => `
                <div class="admin-article-item">
                    <div class="admin-article-item-info">
                        <h4>${article.title}</h4>
                        <span>Categoria: ${article.category}</span>
                    </div>
                    <div class="admin-article-item-actions">
                        <button class="btn btn-secondary btn-sm" data-edit-id="${article.id}">Editar</button>
                        <button class="btn btn-danger btn-sm" data-delete-id="${article.id}">Deletar</button>
                    </div>
                </div>
            `).join('') || '<p>Nenhum artigo encontrado. Clique em "Criar Novo Artigo" para começar.</p>'}
        </div>
    `;

    D.adminView.querySelector('#admin-create-btn').addEventListener('click', () => {
        displayFormView({
            article: null, 
            onSave: (data) => createArticle(data),
            onBack: displayAdminDashboard
        });
    });
    
    D.adminView.querySelectorAll('[data-edit-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const articleId = e.target.dataset.editId;
            // Encontra o artigo na lista que já foi baixada, sem precisar buscar de novo
            const articleToEdit = articles.find(a => a.id == articleId);
            displayFormView({
                article: articleToEdit, 
                onSave: (data) => updateArticle(articleId, data),
                onBack: displayAdminDashboard
            });
        });
    });

    D.adminView.querySelectorAll('[data-delete-id]').forEach(button => {
        button.addEventListener('click', (e) => deleteArticle(e.target.dataset.deleteId));
    });
}

// A função agora é ASYNC
export async function createArticle(data) {
    if (!data.title || !data.category) { // A verificação do conteúdo é opcional
        alert('Título e Categoria são obrigatórios.');
        return false;
    }
    // A lógica de imagens foi removida daqui. Ela será feita no editor.js
    const newArticle = { 
        title: data.title,
        category: data.category,
        content: data.content || '', 
        images: {} // Por enquanto, deixamos um objeto de imagens vazio
    };
    await Storage.createArticleInDb(newArticle); // Chama a nova função do storage
    
    alert('Artigo criado com sucesso!');
    await displayAdminDashboard(); // Recarrega o painel
    return true;
}

// A função agora é ASYNC
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
    
    await Storage.updateArticleInDb(id, updatedData); // Chama a nova função do storage
    alert('Artigo atualizado com sucesso!');
    await displayAdminDashboard();
    return true;
}

// A função agora é ASYNC
export async function deleteArticle(id) {
    if (confirm('Tem certeza que deseja deletar este artigo?')) {
        await Storage.deleteArticleInDb(id); // Chama a nova função do storage
        alert('Artigo deletado com sucesso.');
        await displayAdminDashboard();
    }
}