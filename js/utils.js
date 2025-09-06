// js/utils.js (Corrigido para Firebase)

// 1. Importa a nova função 'fetchArticles'
import { fetchArticles } from './storage.js';

// 2. A função agora é 'async' para poder 'await' os dados
export async function exportProjectAsZip() {
    try {
        // 3. Usa 'await' para esperar os artigos serem baixados do Firebase
        const articles = await fetchArticles();

        if (!window.JSZip) {
            alert("A biblioteca JSZip não foi encontrada. Verifique o index.html.");
            return;
        }

        const zip = new JSZip();
        zip.file("data.json", JSON.stringify(articles, null, 4));

        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = 'tvision_wiki_backup.zip';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(a.href);
                a.remove();
            });
    } catch (error) {
        console.error("Erro ao exportar o projeto:", error);
        alert("Ocorreu um erro ao exportar.");
    }
}