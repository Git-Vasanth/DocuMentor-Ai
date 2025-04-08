import os
import logging
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from file_cleaning import process_file
from url_cleaning import process_urls
import conqa
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Ensure base directories exist
os.makedirs("uploaded_files/docs/new", exist_ok=True)
os.makedirs("uploaded_files/docs/old", exist_ok=True)
os.makedirs("uploaded_files/urls/new", exist_ok=True)
os.makedirs("uploaded_files/urls/old", exist_ok=True)
os.makedirs("uploaded_files/formatted/individual_files", exist_ok=True)
os.makedirs("uploaded_files/formatted/individual_urls", exist_ok=True)
os.makedirs("uploaded_files/embds", exist_ok=True)
os.makedirs("uploaded_files/formatted", exist_ok=True) # Keep this for potential combined files

PROCESSED_FILES_PATH = "uploaded_files/docs/processed_files.txt"
PROCESSED_URLS_PATH = "uploaded_files/urls/processed_urls.txt"

def load_processed_items(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return set(f.read().splitlines())
    return set()

def save_processed_items(filepath, items):
    with open(filepath, "w") as f:
        f.write("\n".join(items))

@app.route('/upload', methods=['POST'])
def upload():
    logger.info("In the Upload Function")

    try:
        files = request.files.getlist("files")
        urls = request.form.getlist("urls")
        new_url_file_path = "uploaded_files/urls/new/urls.txt"
        new_file_names_path = "uploaded_files/docs/new/file_names.txt"

        os.makedirs(os.path.dirname(new_url_file_path), exist_ok=True)
        os.makedirs(os.path.dirname(new_file_names_path), exist_ok=True)

        # Handle file uploads to 'new'
        existing_new_file_names = set()
        if os.path.exists(new_file_names_path):
            with open(new_file_names_path, "r") as f:
                existing_new_file_names = set(f.read().splitlines())

        for file in files:
            if file.filename in existing_new_file_names:
                return jsonify({"message": f"The file {file.filename} has already been uploaded (in this session)."}), 400
            new_file_path = f"uploaded_files/docs/new/{file.filename}"
            file.save(new_file_path)
            with open(new_file_names_path, "a") as f:
                f.write(file.filename + "\n")
        logger.info("Files saved to uploaded_files/docs/new/")

        # Handle URL uploads to 'new/urls.txt'
        existing_new_urls = set()
        if os.path.exists(new_url_file_path):
            with open(new_url_file_path, "r") as f:
                existing_new_urls = set(line.strip() for line in f.readlines())

        with open(new_url_file_path, "a") as f:
            for url in urls:
                if url not in existing_new_urls:
                    f.write(url + "\n")
                    existing_new_urls.add(url)
        logger.info("Urls saved to uploaded_files/urls/new/urls.txt")

        return jsonify({"message": "Files and URLs uploaded successfully to 'new' directories."})

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/process', methods=['POST'])
def process_documents_and_urls():
    logger.info("In the Process Function")
    try:
        new_docs_dir = "uploaded_files/docs/new/"
        old_docs_dir = "uploaded_files/docs/old/"
        new_urls_file = "uploaded_files/urls/new/urls.txt"

        processed_files = load_processed_items(PROCESSED_FILES_PATH)
        processed_urls = load_processed_items(PROCESSED_URLS_PATH)

        newly_processed_files = []
        newly_processed_urls = []
        formatted_file_paths = []
        formatted_url_paths = {}

        # --- Process Files ---
        if os.path.exists(new_docs_dir):
            new_files = [f for f in os.listdir(new_docs_dir) if os.path.isfile(os.path.join(new_docs_dir, f))]
            if not os.path.exists(old_docs_dir):
                os.makedirs(old_docs_dir)

            files_to_process = []
            for filename in new_files:
                if filename not in processed_files:
                    files_to_process.append(filename)

            for filename in files_to_process:
                new_file_path = os.path.join(new_docs_dir, filename)
                formatted_path = process_file(new_file_path)
                if formatted_path:
                    formatted_file_paths.append(formatted_path)
                    newly_processed_files.append(filename)
                # Move processed files to 'old' regardless of successful formatting
                old_path = os.path.join(old_docs_dir, filename)
                new_path = os.path.join(new_docs_dir, filename)
                try:
                    shutil.move(new_path, old_path)
                    logger.info(f"Moved {filename} from new to old.")
                except Exception as e:
                    logger.error(f"Error moving {filename} from new to old: {e}")

            # Clean up new directory
            if os.path.exists(new_docs_dir) and not os.listdir(new_docs_dir):
                try:
                    os.rmdir(new_docs_dir)
                    os.makedirs(new_docs_dir, exist_ok=True) # Recreate it
                    logger.info("Cleared and recreated the 'new/docs' directory.")
                except OSError as e:
                    logger.warning(f"Could not clear 'new/docs' directory: {e}")
            elif os.path.exists(new_docs_dir) and os.listdir(new_docs_dir):
                logger.warning("'new/docs' directory is not empty after processing.")

        # --- Process URLs ---
        if os.path.exists(new_urls_file):
            with open(new_urls_file, "r") as f:
                urls_to_process = [url.strip() for url in f.readlines() if url.strip() not in processed_urls]

            processed_url_results = process_urls(urls_to_process)
            for url, formatted_path in processed_url_results.items():
                if formatted_path:
                    formatted_url_paths[url] = formatted_path
                    newly_processed_urls.append(url)

            # Move processed URLs to 'old'
            old_urls_file = "uploaded_files/urls/old/urls.txt"
            os.makedirs(os.path.dirname(old_urls_file), exist_ok=True)
            with open(old_urls_file, "a") as f:
                for url in urls_to_process:
                    f.write(url + "\n")
            logger.info(f"Processed and added new URLs to {old_urls_file}")

            # Clear the 'new' URLs file
            open(new_urls_file, 'w').close()
            logger.info(f"Cleared {new_urls_file}")

        # Update vector store with newly processed content
        conqa.update_vector_store(formatted_file_paths=formatted_file_paths, formatted_url_paths=formatted_url_paths)

        # Update processed items lists
        processed_files.update(newly_processed_files)
        processed_urls.update(newly_processed_urls)
        save_processed_items(PROCESSED_FILES_PATH, processed_files)
        save_processed_items(PROCESSED_URLS_PATH, processed_urls)

        return jsonify({"message": "Files and URLs processed and vector store updated incrementally."})
    except Exception as e:
        logger.error(f"Error in process function: {e}")
        return jsonify({"message": str(e)}), 500

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
            user_pref = conqa.pref_message(message)  # Call the function from conqa.py
            return jsonify({"response": user_pref}), 200
        else:
            return jsonify({"error": "No message provided"}), 400
    except Exception as e:
        print(f"Error in sendai: {e}")
        return jsonify({"error": "An error occurred while processing the request."}), 500

@app.route('/docai', methods=['POST'])
def aichat():
    data = request.get_json()
    user_id = data.get('user_id', 'default_user')
    user_input = data.get('input', '')

    ai_response, updated_history = conqa.process_user_message(user_input, [], user_id) #pass empty list for initial history.

    return jsonify({'generated_code': ai_response})

if __name__ == '__main__':
    app.run(debug=True)