import os
import pdfplumber
from docx import Document
import logging
import time

# Configure logging for better information
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define the input directory where files are uploaded
UPLOAD_DIR = "uploaded_files/docs/"

# Define the output directory where processed files will be saved (individual files)
OUTPUT_DIR = "uploaded_files/formatted/individual_files"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def ensure_directory_exists(directory):
    if not os.path.exists(directory):
        try:
            os.makedirs(directory)
            logger.info(f"Directory {directory} created.")
        except Exception as e:
            logger.error(f"Failed to create directory {directory}: {e}")
            raise

def process_file(file_path):
    logger.info("Text_cleaning - Welcome")
    logger.info("Order - 1 : Finding the right type of file")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    file_extension = os.path.splitext(file_path)[1].lower()

    ensure_directory_exists(OUTPUT_DIR)

    if file_extension == '.txt':
        formatted_text = extract_text_from_txt(file_path)
        if formatted_text:
            return save_output(formatted_text, os.path.basename(file_path))
    elif file_extension == '.docx' or file_extension == '.doc':
        formatted_text = extract_text_from_docx_or_doc(file_path)
        if formatted_text:
            return save_output(formatted_text, os.path.basename(file_path))
    elif file_extension == '.pdf':
        formatted_text = extract_text_from_pdf(file_path)
        if formatted_text:
            return save_output(formatted_text, os.path.basename(file_path))
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")
    return None

def extract_text_from_pdf(file_path):
    logger.info("Order - 2 : Extracting text from the File - pdf")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    try:
        all_text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text += text + "\n\n"
        return format_text(all_text, os.path.basename(file_path))

    except Exception as e:
        raise ValueError(f"Error reading PDF file: {str(e)}")

def extract_text_from_txt(file_path):
    logger.info("Order - 2 : Extracting text from the File - txt")

    if file_path.endswith("file_names.txt"):
        logger.info(f"Skipping processing for file_names.txt: {file_path}")
        return None

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    return format_text(content, os.path.basename(file_path))

def extract_text_from_docx_or_doc(file_path):
    logger.info("Order - 2 : Extracting text from the File - docx or doc")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    doc = Document(file_path)
    all_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return format_text(all_text, os.path.basename(file_path))

def format_text(text_content, file_name):
    logger.info("Order - 3 : Formatting Text")
    return f"--- Start of content from file: {file_name} ---\n{text_content}\n--- End of content from file: {file_name} ---\n"

def save_output(formatted_text, base_file_name):
    logger.info(f"Order - 4 : Saving Formatted text for {base_file_name}")

    if not formatted_text.strip():
        logger.warning(f"No content to save for {base_file_name}.")
        return None

    ensure_directory_exists(OUTPUT_DIR)
    output_file_path = os.path.join(OUTPUT_DIR, f"{os.path.splitext(base_file_name)[0]}.txt")

    try:
        with open(output_file_path, 'w', encoding='utf-8') as outfile:
            outfile.write(formatted_text)
        logger.info(f"Formatted content saved to: {output_file_path}")
        return output_file_path
    except Exception as e:
        logger.error(f"Error saving formatted text for {base_file_name}: {e}")
        return None

def deleting_docs():
    logger.info("Order - 4 : Deleting files from docs directory")
    folder_path = UPLOAD_DIR
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
                logger.info(f"Deleted {filename}")
        except Exception as e:
            logger.error(f"Error deleting {filename}: {e}")