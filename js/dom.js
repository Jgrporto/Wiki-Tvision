// js/dom.js
// Este arquivo centraliza todas as referências aos elementos do HTML.

// Views Principais
export const welcomeView = document.getElementById('welcome-view');
export const categoryView = document.getElementById('category-view');
export const articleView = document.getElementById('article-view');
export const adminView = document.getElementById('admin-view');
export const editorView = document.getElementById('editor-view');

// Elementos do Cabeçalho (Navbar)
export const homeLink = document.getElementById('home-link');
export const breadcrumbsContainer = document.getElementById('breadcrumbs');

// Elementos da Busca (Versão Original)
export const heroSearchInput = document.getElementById('hero-search-input');
export const heroSearchBtn = document.getElementById('hero-search-btn');

// Cards da Página Inicial
export const quickAccessCards = document.querySelectorAll('.card');

// Elementos da Sidebar
export const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
export const navSidebar = document.getElementById('nav-sidebar');
export const sidebarOverlay = document.getElementById('sidebar-overlay');
export const sidebarAdminLink = document.getElementById('sidebar-admin-link');
export const sidebarToolsLink = document.getElementById('sidebar-tools-link');
export const sidebarMainContentLink = document.getElementById('sidebar-main-content-link');
export const sidebarExportLink = document.getElementById('sidebar-export-link');

// Elementos internos da View de Artigo (para o modo público)
export const articleTitleDisplay = document.getElementById('article-title-display');
export const articleContentDisplay = document.getElementById('article-content-display');