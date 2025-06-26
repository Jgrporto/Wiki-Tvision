# Arquivo: app.py
import os
import json # Importação nova para lidar com o mapa de imagens
from flask import Flask, jsonify, request
from flask_cors import CORS
from databricks import sql
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configurações e Funções de GET e POST (sem alterações) ---
server_hostname = os.getenv("DATABRICKS_SERVER_HOSTNAME")
http_path = os.getenv("DATABRICKS_HTTP_PATH")
access_token = os.getenv("DATABRICKS_TOKEN")
db_table_path = "default.articles" 

@app.route("/api/articles", methods=['GET'])
def get_articles():
    try:
        with sql.connect(server_hostname=server_hostname, http_path=http_path, access_token=access_token) as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT id, category, title, content, images FROM {db_table_path}")
                result = cursor.fetchall()
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

@app.route("/api/articles", methods=['POST'])
def create_article():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({"error": "Título e conteúdo são obrigatórios"}), 400
    try:
        with sql.connect(server_hostname=server_hostname, http_path=http_path, access_token=access_token) as connection:
            with connection.cursor() as cursor:
                # O Databricks SQL Connector não suporta mapas diretamente como parâmetro.
                # Precisamos formatá-lo como uma string SQL.
                images_map_str = "map(" + ", ".join([f"'{k}', '{v}'" for k, v in data.get('images', {}).items()]) + ")"

                sql_command = f"INSERT INTO {db_table_path} (category, title, content, images) VALUES (?, ?, ?, from_json(?, 'map<string, string>'))"
                
                cursor.execute(
                    sql_command,
                    parameters=[
                        data.get('category'),
                        data.get('title'),
                        data.get('content'),
                        json.dumps(data.get('images', {}))
                    ]
                )
        return jsonify({"message": "Artigo criado com sucesso"}), 201
    except Exception as e:
        print(f"Ocorreu um erro ao criar o artigo: {e}")
        return jsonify({"error": str(e)}), 500

# NOVO: Endpoint para atualizar um artigo existente (PUT)
@app.route("/api/articles/<int:article_id>", methods=['PUT'])
def update_article(article_id):
    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({"error": "Título e conteúdo são obrigatórios"}), 400

    try:
        with sql.connect(server_hostname=server_hostname, http_path=http_path, access_token=access_token) as connection:
            with connection.cursor() as cursor:
                sql_command = f"""
                    UPDATE {db_table_path}
                    SET category = ?, title = ?, content = ?, images = from_json(?, 'map<string, string>')
                    WHERE id = ?
                """
                
                cursor.execute(
                    sql_command,
                    parameters=[
                        data.get('category'),
                        data.get('title'),
                        data.get('content'),
                        json.dumps(data.get('images', {})),
                        article_id
                    ]
                )
        return jsonify({"message": "Artigo atualizado com sucesso"}), 200

    except Exception as e:
        print(f"Ocorreu um erro ao atualizar o artigo: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
