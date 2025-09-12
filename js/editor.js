import Quill from 'https://esm.sh/quill@1.3.6';
import ImageResize from 'https://esm.sh/quill-image-resize-module@3.0.0';
import * as D from './dom.js';
import { showView } from './ui.js';
import * as Storage from './storage.js';

let quillEditor = null;

export async function displayFormView({ article = null, onSave, onBack }) {
    showView('editor');
    
    const isEditing = article && article.id;
    const categories = await Storage.fetchCategories();

    D.editorView.innerHTML = `
        <button class="header-back-btn"><i class="fa-solid fa-arrow-left"></i> Voltar ao Painel</button>
        <h2>${isEditing ? 'Editar Artigo' : 'Criar Novo Artigo'}</h2>
        
        <div id="editor-wrapper">
            
            <input type="text" id="edit-article-title" placeholder="Título do artigo" value="${(article && article.title) ? article.title.replace(/"/g, '&quot;') : ''}">
            
            <select id="edit-article-category">
                <option value="" disabled ${!article || !article.category ? 'selected' : ''}>Selecione uma categoria</option>
                
                ${categories.map(cat => 
                    `<option value="${cat.name}" ${article && article.category === cat.name ? 'selected' : ''}>
                        ${cat.name}
                    </option>`
                ).join('')}
            </select>
            
            <div id="quill-wrapper">
                <div id="quill-toolbar-container">
                    <span class="ql-formats">
                        <select class="ql-header" title="Formato do Texto"><option selected>Normal</option><option value="1">Título 1</option><option value="2">Título 2</option><option value="3">Título 3</option></select>
                        <select class="ql-size" title="Tamanho da Fonte"><option value="small">Pequena</option><option selected>Média</option><option value="large">Grande</option><option value="huge">Enorme</option></select>
                    </span>
                    <span class="ql-formats"><button class="ql-bold" title="Negrito"></button><button class="ql-italic" title="Itálico"></button><button class="ql-underline" title="Sublinhado"></button></span>
                    <span class="ql-formats"><button class="ql-list" value="ordered" title="Lista Numerada"></button><button class="ql-list" value="bullet" title="Lista com Marcadores"></button></span>
                    <span class="ql-formats"><button class="ql-align" value="" title="Alinhar à Esquerda"></button><button class="ql-align" value="center" title="Centralizar"></button><button class="ql-align" value="right" title="Alinhar à Direita"></button></span>
                    <span class="ql-formats"><button class="ql-link" title="Inserir Link"></button><button class="ql-image" title="Inserir Imagem"></button><button class="ql-video" title="Inserir Vídeo"></button></span>
                    <span class="ql-formats"><button class="ql-clean" title="Remover Formatação"></button></span>
                    <span class="ql-formats fullscreen-container">
                        <button id="fullscreen-btn" class="toolbar-button" title="Tela Cheia"><i class="fa-solid fa-expand"></i></button>
                    </span>
                </div>
                <div id="quill-editor-container"></div>
            </div>

            <div class="form-actions" style="margin-top: 20px;">
                <button id="save-article-btn" class="btn btn-primary"><i class="fa-solid fa-save"></i> Salvar ${isEditing ? 'Alterações' : 'Artigo'}</button>
            </div>
        </div>
    `;
    
    Quill.register('modules/imageResize', ImageResize);

    quillEditor = new Quill('#quill-editor-container', {
        modules: {
            toolbar: '#quill-toolbar-container',
            imageResize: {
                modules: ['Resize', 'DisplaySize', 'Toolbar']
            }
        },
        theme: 'snow',
        placeholder: 'Comece a escrever seu artigo aqui...'
    });

    if (article && article.content) {
        quillEditor.root.innerHTML = article.content;
    }
    
    const backButton = D.editorView.querySelector('.header-back-btn');
    const saveButton = D.editorView.querySelector('#save-article-btn');
    const fullscreenButton = D.editorView.querySelector('#fullscreen-btn');

    if (backButton && typeof onBack === 'function') {
        backButton.addEventListener('click', onBack);
    }

    if (saveButton && typeof onSave === 'function') {
        saveButton.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Salvando...';
            btn.disabled = true;
            
            const data = {
                content: quillEditor.root.innerHTML,
                title: D.editorView.querySelector('#edit-article-title').value,
                category: D.editorView.querySelector('#edit-article-category').value,
            };
            
            const success = await onSave(data);
            
            if (!success) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    const handleEscKey = (e) => {
        if (e.key === "Escape" && D.editorView.classList.contains('fullscreen-active')) {
            toggleFullscreen();
        }
    };
    
    const toggleFullscreen = () => {
        const quillWrapper = D.editorView.querySelector('#quill-wrapper');
        const fullscreenIcon = fullscreenButton.querySelector('i');
        quillWrapper.classList.toggle('fullscreen-mode');
        D.editorView.classList.toggle('fullscreen-active');
        const isFullscreen = quillWrapper.classList.contains('fullscreen-mode');
        if (isFullscreen) {
            fullscreenIcon.classList.remove('fa-expand');
            fullscreenIcon.classList.add('fa-compress');
            fullscreenButton.title = "Sair da Tela Cheia";
            document.addEventListener('keydown', handleEscKey);
        } else {
            fullscreenIcon.classList.remove('fa-compress');
            fullscreenIcon.classList.add('fa-expand');
            fullscreenButton.title = "Tela Cheia";
            document.removeEventListener('keydown', handleEscKey);
        }
    };
    fullscreenButton.addEventListener('click', toggleFullscreen);
}
