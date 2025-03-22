import os
import logging
import uuid 
from flask import Flask, request, jsonify
from flask_cors import CORS
from file_cleaning import process_file
from url_cleaning import extract_text_from_url, format_text as url_format_text, save_output as url_save_output, process_urls
from embeddings import build_and_save
from docai import pref_message
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

os.makedirs("uploaded_files/docs", exist_ok=True)
os.makedirs("uploaded_files/urls", exist_ok=True)
os.makedirs("uploaded_files/embds",exist_ok=True)
os.makedirs("uploaded_files/formatted",exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload():
    logger.info("In the Upload Function")

    try:
        files = request.files.getlist("files")
        urls = request.form.getlist("urls")
        file_paths = []
        url_file_path = "uploaded_files/urls/urls.txt"
        file_names_path = "uploaded_files/docs/file_names.txt"

        # Ensure directories exist
        os.makedirs(os.path.dirname(url_file_path), exist_ok=True)
        os.makedirs(os.path.dirname(file_names_path), exist_ok=True)

        # Handle file uploads
        if files:
            # Load existing file names
            if os.path.exists(file_names_path):
                with open(file_names_path, "r") as file_names_file:
                    existing_file_names = set(file_names_file.read().splitlines())
            else:
                existing_file_names = set()

            for file in files:
                if file.filename in existing_file_names:
                    return jsonify({"message": f"The file {file.filename} has already been uploaded."}), 400

                file_path = f"uploaded_files/docs/{file.filename}"
                file.save(file_path)
                file_paths.append(file_path)

                # Append the file name to the file_names.txt
                with open(file_names_path, "a") as file_names_file:
                    file_names_file.write(file.filename + "\n")

            logger.info("Files are Saved in Docs")

        # Handle URL uploads
        if urls:
            # Read existing URLs from the file
            if os.path.exists(url_file_path):
                with open(url_file_path, "r") as url_file:
                    existing_urls = set(url_file.readlines())  # Using set to avoid duplicates
            else:
                existing_urls = set()

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

    logger.info("In the Process Function")

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

    logger.info("In the Build Function")

    try:
        build_and_save()
        return jsonify({"message": "Documents processed successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/destroy',methods=['POST'])
def destroy():

    logger.info("In the Destroy Function")

    pass

@app.route('/prefai',methods=['POST'])
def prefai():

    logger.info("In the PrefAi Function")
    try:
        data = request.get_json()
        message = data.get('message', '')

        if message:
            # Send the message to process_message in docai.py
            user_pref = pref_message(message)  # Call the function from docai.py
            return jsonify({"response": user_pref}), 200
        else:
            return jsonify({"error": "No message provided"}), 400
    except Exception as e:
        print(f"Error in sendai: {e}")
        return jsonify({"error": "An error occurred while processing the request."}), 500

@app.route('/docai', methods=['POST'])
def sendai():

    logger.info("In the SendAi Function")

    pass

"""
@app.route('/docai',methods=['GET'])
def getai():

    logger.info("In the GetAi Function")

    pass


@app.route('/logout', methods=['POST'])
def logout():

    logger.info("In the Logout Function")

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
