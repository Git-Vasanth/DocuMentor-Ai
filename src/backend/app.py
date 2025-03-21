import os
import logging
import uuid 
from flask import Flask, request, jsonify
from flask_cors import CORS
from file_cleaning import process_file
from url_cleaning import extract_text_from_url, format_text as url_format_text, save_output as url_save_output, process_urls
from embeddings import build_and_save

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

os.makedirs("uploaded_files/docs", exist_ok=True)
os.makedirs("uploaded_files/urls", exist_ok=True)

@app.route('/stat',methods=['GET'])
def stat():
    return jsonify("Message : Its working")

@app.route('/upload', methods=['POST'])
def upload():

    logger.info("In the Upload Function")

    try:
        files = request.files.getlist("files")
        urls = request.form.getlist("urls")
        file_paths = []
        url_file_path = "uploaded_files/urls/urls.txt"

        # Handle file uploads
        if files:
            for file in files:
                file_path = f"uploaded_files/docs/{file.filename}"
                
                # Save the file
                file.save(file_path)
                file_paths.append(file_path)

        logger.info("Files are Saved in Docs")

        # Handle URL uploads
        if urls:
            # Read existing URLs from the file
            with open(url_file_path, "r") as url_file:
                existing_urls = set(url_file.readlines())  # Using set to avoid duplicates

            # Check for duplicate URLs and reject them
            for url in urls:
                if url + "\n" in existing_urls:
                    return jsonify({"message": f"The URL {url} has already been uploaded."}), 400

            # If no duplicates, append the new URLs to the file
            with open(url_file_path, "a") as url_file:
                for url in urls:
                    url_file.write(url + "\n")

        logger.info("Urls are Saved in Urls")

        return jsonify({"message": "Files and URLs uploaded successfully."})

    except Exception as e:
        return jsonify({"message": str(e)}), 500
    

@app.route('/process', methods=['POST'])
def process_documents_and_urls():
    
    try:
        # Process files
        for file_path in os.listdir("uploaded_files/docs"):
            if file_path.endswith((".docx", ".pdf", ".txt", ".doc")):
                content = process_file(f"uploaded_files/docs/{file_path}")

        # Process URLs
        urls = []
        with open("uploaded_files/urls/urls.txt", "r") as url_file:
            urls = [url.strip() for url in url_file.readlines()]

        if urls:
            process_urls(urls)

        return jsonify({"message": "Files and URLs processed and formatted successfully."})

    except Exception as e:
        return jsonify({"message": str(e)}), 500
    

@app.route('/build',methods=['POST'])
def build():
    build_and_save()
    logger.info("Embeddings and Index are Saved")

"""

@app.route('/destroy',methods=['POST'])
def destroy():
    pass

@app.route('/logout', methods=['POST'])
def logout():
    try:
        # Clear uploaded files and URLs
        docs_folder = "uploaded_files/docs"
        if os.path.exists(docs_folder):
            for filename in os.listdir(docs_folder):
                file_path = os.path.join(docs_folder, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)

        urls_file = "uploaded_files/urls/urls.txt"
        if os.path.exists(urls_file):
            open(urls_file, 'w').close()

        return jsonify({"message": "Logged out and data cleared."})

    except Exception as e:
        return jsonify({"message": str(e)}), 500

"""
if __name__ == '__main__':
    app.run(debug=True)
