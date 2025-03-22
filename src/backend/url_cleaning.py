import os
import requests
from bs4 import BeautifulSoup, Tag
import logging
from concurrent.futures import ThreadPoolExecutor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Directories for saving files
UPLOAD_DIR = "uploaded_files/urls"  # Adjusted to directory only
URL_FILE_PATH = os.path.join(UPLOAD_DIR, "urls.txt") # added URL_FILE_PATH
OUTPUT_DIR = "M:/Projects/documentor-ai/documentor-ai/src/backend/uploaded_files/formatted"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Path to the combined output file
combined_file_path = os.path.join(OUTPUT_DIR, "Urls_combined_formatted.txt")

def process_urls(urls):
    logger.info("Order - 1 : Processing URLs")

    # Initialize a list to hold all formatted texts
    all_formatted_texts = []

    # Process each URL using ThreadPoolExecutor for parallel processing
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = executor.map(process_url, urls)
        
        # Collect the formatted texts that are returned
        for result in results:
            if result:
                all_formatted_texts.append(result)

    # Step 3: Save all formatted content after all URLs are processed (Order 5)
    if all_formatted_texts:
        # Combine all formatted texts into one output
        combined_formatted_text = "\n\n".join(all_formatted_texts)
        save_output(combined_formatted_text)

def process_url(url):
    logger.info("Order - 2 : Processing URL")

    # Step 1: Extract text from the URL (Order 2)
    content = extract_text_from_url(url)

    if content:
        # Step 2: Format the extracted text (Order 3)
        formatted_text = format_text(content)
        
        # Now we return the formatted text to be saved after all URLs are processed
        return formatted_text
    else:
        logger.error(f"Failed to extract text from URL: {url}")
        return None

def extract_text_from_url(url):
    logger.info("Order - 3 : Extracting Text from URL")
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        response.raise_for_status()  # Check for errors in the response

        # Parse the HTML content of the page
        soup = BeautifulSoup(response.text, 'html.parser')

        # Remove unwanted tags like script and style
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        # List to store the headings and paragraphs content
        ordered_content = []

        # We need to track the current heading and associate it with its paragraphs
        current_heading = None

        # Iterate through the HTML elements and classify them
        for element in soup.find_all(True):  # True finds all tags
            if isinstance(element, Tag):
                # If the element is a heading (h1-h6), set the current heading
                if element.name.startswith('h') and element.name[1:].isdigit():
                    heading_text = element.get_text(strip=True)
                    current_heading = heading_text  # Capture the heading text

                # If the element is a paragraph (p), associate it with the current heading
                elif element.name == 'p' and current_heading:
                    paragraph_text = element.get_text(strip=True)
                    ordered_content.append(f"{current_heading}\n{paragraph_text}\n")

        # Return the ordered content as a string
        return "\n".join(ordered_content)

    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching URL {url}: {str(e)}")
        return None

def format_text(content):
    logger.info("Order - 4 : Formatting Text")
    
    # Check if content is a string, if so, format it accordingly
    if isinstance(content, str):
        # Simply return the content if it's just text
        return f"Formatted content:\n{content}"

    # If the content is not a string, handle it as a dictionary (e.g., for headings, paragraphs)
    output = ""
    try:
        # Assuming content is a dictionary-like object with keys for different elements
        output += f"Formatted Content:\n{content}"

    except Exception as e:
        logger.error(f"Error during text formatting: {str(e)}")
        return None

    return output

def save_output(formatted_text):
    logger.info("Order - 5 : Appending formatted URL content to Urls_combined_formatted.txt")

    if not formatted_text.strip():
        logger.warning("No content to save.")
        return
    
    try:
        with open(combined_file_path, 'a', encoding='utf-8') as file:
            file.write(f"\n\n--- Start of formatted content from URL ---\n")
            file.write(formatted_text)
            file.write(f"\n--- End of formatted content from URL ---\n")

        logger.info(f"Processed content appended to: {combined_file_path}")

    except Exception as e:
        logger.error(f"Error appending text to {combined_file_path}: {e}")
