// js/ui.js
// Lida com componentes e funções gerais da Interface do Usuário.

import * as D from './dom.js';
import * as Admin from './admin.js';
import { exportProjectAsZip } from './utils.js';

/**
 * Controla qual "tela" (view) principal é exibida.
 * @param {string} viewName - O nome da view a ser mostrada ('welcome', 'category', etc.).
 */
export function showView(viewName) {
    // Esconde todas as views principais
    [D.welcomeView, D.categoryView, D.articleView, D.adminView, D.editorView].forEach(v => {
        if (v) v.classList.add('hidden');
    });

    // Mostra a view desejada
    const viewToShow = document.getElementById(`${viewName}-view`);
    if (viewToShow) {
        viewToShow.classList.remove('hidden');
    }

    // Limpa o conteúdo das views dinâmicas quando voltamos para a home
    if (viewName === 'welcome') {
        if (D.categoryView) D.categoryView.innerHTML = '';
        if (D.editorView) D.editorView.innerHTML = '';
        if (D.adminView) D.adminView.innerHTML = '';
        // Restaura a estrutura da view de artigo para não quebrar a renderização futura
        if (D.articleView) D.articleView.innerHTML = `<h2 id="article-title-display"></h2><div id="article-content-display"></div>`;
    }
}

/**
 * Configura todos os eventos da sidebar (menu hambúrguer).
 */
export function setupSidebar() {
    const closeSidebar = () => {
        D.navSidebar.classList.remove('open');
        D.sidebarOverlay.classList.remove('open');
    };

    D.sidebarToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        D.navSidebar.classList.add('open');
        D.sidebarOverlay.classList.add('open');
    });

    D.sidebarOverlay.addEventListener('click', closeSidebar);

    // Conecta o link 'Administrativo' às funções de admin
    D.sidebarAdminLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeSidebar();
        if (Admin.isAdmin()) {
            Admin.exitAdminMode();
        } else {
            Admin.enterAdminMode();
        }
    });

    // Conecta os outros links
    D.sidebarExportLink.addEventListener('click', (e) => {
        e.preventDefault();
        exportProjectAsZip();
        closeSidebar();
    });
    
    D.sidebarToolsLink.addEventListener('click', (e) => { e.preventDefault(); alert('Página "Ferramentas Utilizadas" em construção!'); closeSidebar(); });
    D.sidebarMainContentLink.addEventListener('click', (e) => { e.preventDefault(); alert('Página "Principais Conteúdos" em construção!'); closeSidebar(); });
}