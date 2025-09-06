// js/theme.js

// Seleciona o botão e o corpo do documento
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const body = document.body;

// Função para aplicar o tema com base no valor salvo
function applyTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
}

// Função principal que configura tudo
export function setupTheme() {
    // 1. Verifica se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'; // Padrão é 'light'
    applyTheme(savedTheme);

    // 2. Adiciona o listener de clique ao botão
    themeToggleBtn.addEventListener('click', () => {
        // Verifica se o modo escuro já está ativo
        const isDarkMode = body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            // Se estiver, muda para o modo claro
            applyTheme('light');
            localStorage.setItem('theme', 'light');
        } else {
            // Se não, muda para o modo escuro
            applyTheme('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}