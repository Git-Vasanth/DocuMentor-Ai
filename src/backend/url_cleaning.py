import os
import requests
from bs4 import BeautifulSoup, Tag
import logging
from concurrent.futures import ThreadPoolExecutor
import hashlib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Directories for saving files
UPLOAD_DIR = "uploaded_files/urls"
URL_FILE_PATH = os.path.join(UPLOAD_DIR, "new", "urls.txt")
OUTPUT_DIR = "uploaded_files/formatted/individual_urls"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def process_urls(urls):
    logger.info("Order - 1 : Processing URLs")
    formatted_texts = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(process_url, urls)
        for url, formatted_text_path in results:
            if formatted_text_path:
                formatted_texts[url] = formatted_text_path
    return formatted_texts

def process_url(url):
    logger.info(f"Order - 2 : Processing URL: {url}")
    content = extract_text_from_url(url)
    if content:
        formatted_text = format_text(content)
        formatted_text_path = save_output(formatted_text, url_to_filename(url))
        return url, formatted_text_path
    else:
        logger.error(f"Failed to extract text from URL: {url}")
        return url, None

def extract_text_from_url(url):
    logger.info(f"Order - 3 : Extracting Text from URL: {url}")
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()
        text = soup.get_text(separator='\n', strip=True)
        return text
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching URL {url}: {str(e)}")
        return None

def format_text(content):
    logger.info("Order - 4 : Formatting Text")
    return f"--- Start of content from URL ---\n{content}\n--- End of content from URL ---\n"

def save_output(formatted_text, filename):
    logger.info(f"Order - 5 : Saving formatted URL content to {filename}.txt")
    if not formatted_text.strip():
        logger.warning(f"No content to save for {filename}.")
        return None
    output_file_path = os.path.join(OUTPUT_DIR, f"{filename}.txt")
    try:
        with open(output_file_path, 'w', encoding='utf-8') as outfile:
            outfile.write(formatted_text)
        logger.info(f"Formatted URL content saved to: {output_file_path}")
        return output_file_path
    except Exception as e:
        logger.error(f"Error saving formatted text for {filename}: {e}")
        return None

def url_to_filename(url):
    return hashlib.md5(url.encode()).hexdigest()