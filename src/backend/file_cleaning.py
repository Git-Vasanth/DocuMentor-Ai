import os
import PyPDF2
import pdfplumber
from docx import Document
import logging
import time

# Configure logging for better information
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define the input directory where files are uploaded
UPLOAD_DIR = "uploaded_files/docs/"

# Define the output directory where processed files will be saved
OUTPUT_DIR = "M:/Projects/documentor-ai/documentor-ai/src/backend/uploaded_files/formatted"

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
        extract_text_from_txt(file_path)
    elif file_extension == '.docx':
        extract_text_from_docx_or_doc(file_path)
    elif file_extension == '.pdf':
        extract_text_from_pdf(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

def extract_text_from_pdf(file_path):
    logger.info("Order - 2 : Extracting text from the File - pdf")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    try:
        with pdfplumber.open(file_path) as pdf:
            structured_elements = {
                'file_name': os.path.basename(file_path),
                'page_numbers': [],
                'text_content': []
            }

            # Extract text from each page
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:  # Ensure the text is not None
                    # Clean up newlines and extra spaces
                    cleaned_text = ' '.join(text.splitlines())
                    structured_elements['page_numbers'].append(page_num + 1)  # page numbers start from 1
                    structured_elements['text_content'].append(cleaned_text)

            # Combine the extracted text into a single string for saving
            extracted_text = "\n".join(structured_elements['text_content'])
            save_output(extracted_text, structured_elements['file_name'])  # Pass file_name here
        
    except Exception as e:
        raise ValueError(f"Error reading PDF file: {str(e)}")
    
def extract_text_from_txt(file_path):
    logger.info("Order - 2 : Extracting text from the File - txt")

    # Check if the file path is the file_names.txt, and skip it.
    if file_path == "uploaded_files/docs/file_names.txt":
        logger.info(f"Skipping processing for file_names.txt: {file_path}")
        return  # Exit the function without processing

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    paragraphs = content.split('\n\n')

    # Format text to save it as structured
    formatted_text = "\n\n".join(paragraphs)

    # Save the extracted text to a file
    save_output(formatted_text, os.path.basename(file_path))  # Pass file_name here

def extract_text_from_docx_or_doc(file_path):
    logger.info("Order - 2 : Extracting text from the File - docx or doc")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    doc = Document(file_path)
    structured_elements = {
        'file_name': os.path.basename(file_path),
        'headings': [],
        'sub_headings': [],
        'paragraphs': [],
        'tables': [],
        'lists': []
    }

    # Iterate over paragraphs to classify content into headings, sub-headings, paragraphs, and lists
    for para in doc.paragraphs:
        if para.style and para.style.name and para.style.name.startswith('Heading'):
            heading_level = int(para.style.name.split(' ')[-1])
            if heading_level == 1:
                structured_elements['headings'].append(para.text)
            elif heading_level == 2:
                structured_elements['sub_headings'].append(para.text)
        elif para.style and para.style.name.startswith('List'):
            structured_elements['lists'].append(para.text)
        else:
            structured_elements['paragraphs'].append(para.text)

    # Extract table data if present
    for table in doc.tables:
        table_data = []
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells]
            table_data.append(row_data)
        structured_elements['tables'].append(table_data)

    # Format extracted content as a string
    formatted_text = ""
    formatted_text += "\n\n--- Headings ---\n" + "\n".join(structured_elements['headings'])
    formatted_text += "\n\n--- Sub-Headings ---\n" + "\n".join(structured_elements['sub_headings'])
    formatted_text += "\n\n--- Paragraphs ---\n" + "\n".join(structured_elements['paragraphs'])
    formatted_text += "\n\n--- Lists ---\n" + "\n".join(structured_elements['lists'])
    
    if structured_elements['tables']:
        formatted_text += "\n\n--- Tables ---\n"
        for table in structured_elements['tables']:
            formatted_text += "\n" + "\n".join(["\t".join(row) for row in table])

    save_output(formatted_text, structured_elements['file_name'])  # Pass file_name here

def save_output(formatted_text, file_name):
    logger.info("Order - 3 : Saving Formatted and appending text to files_combined_formatted.txt")

    if not formatted_text.strip():
        logger.warning("No content to save.")
        return

    # Ensure the output directory exists
    ensure_directory_exists(OUTPUT_DIR)
    
    combined_file_path = os.path.join(OUTPUT_DIR, "files_combined_formatted.txt")  # Output file for all content

    try:
        # Open the combined formatted text file in append mode and write the formatted content
        with open(combined_file_path, 'a', encoding='utf-8') as file:
            # Add the filename at the beginning
            file.write(f"\n\n--- Start of content from file: {file_name} ---\n")
            file.write(formatted_text)
            # Add the filename again at the end
            file.write(f"\n--- End of content from file: {file_name} ---\n")
        
        logger.info(f"Processed content appended to: {combined_file_path}")

    except Exception as e:
        logger.error(f"Error appending text to {combined_file_path}: {e}")
