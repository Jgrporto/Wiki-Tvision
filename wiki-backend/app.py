# Arquivo: app.py
import os
from flask import Flask, jsonify
from flask_cors import CORS
from databricks import sql
from dotenv import load_dotenv

load_dotenv() # Carrega as variáveis do arquivo .env

app = Flask(__name__)
CORS(app) # Permite que seu front-end (em outra "origem") acesse a API

# Configurações da conexão com Databricks
server_hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
http_path = os.getenv("DATABRICKS_HTTP_PATH")
access_token = os.getenv("DATABRICKS_TOKEN")

# Endpoint para listar todos os artigos
@app.route("/api/articles", methods=['GET'])
def get_articles():
    try:
        with sql.connect(server_hostname=server_hostname,
                         http_path=http_path,
                         access_token=access_token) as connection:

            with connection.cursor() as cursor:
                # ATENÇÃO: Mude 'meu_catalogo.minha_wiki' para o seu catálogo/schema
                cursor.execute("SELECT id, category, title, content, images FROM default.articles")
                result = cursor.fetchall()

                # Transforma o resultado em uma lista de dicionários (JSON)
                articles = [
                    {
                        "id": row.id,
                        "category": row.category,
                        "title": row.title,
                        "content": row.content,
                        "images": row.images or {}
                    } for row in result
                ]

                return jsonify(articles)

    except Exception as e:
        print(f"Ocorreu um erro: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)