import pytesseract
import pdfplumber
from PIL import Image
import requests
from io import BytesIO
from bs4 import BeautifulSoup
from fastapi import HTTPException

def extract_files(file_paths, urls=None):
    # Process files here
    print(f"Processing {len(file_paths)} files.")
    
    if urls:
        print(f"URLs received: {urls}")
    
    # Example: Return a dummy result
    return {"file_count": len(file_paths), "urls": urls}

# Function to extract text from image using pytesseract (OCR)
def extract_text_from_image(image_path: str):
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Function to extract text from PDF using pdfplumber
def extract_text_from_pdf(pdf_path: str):
    try:
        extracted_data = {}
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                # Check if image extraction is needed (use page.to_image() if necessary)
                image = page.to_image()
                extracted_data[f"page_{i+1}"] = {
                    'text': text if text else '',
                    'image': image.to_image().save(f'page_{i+1}.png')  # Saving the image (if required)
                }
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# Function to extract text from URL using BeautifulSoup
def extract_text_from_url(url: str):
    try:
        response = requests.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="URL could not be fetched")

        soup = BeautifulSoup(response.content, 'html.parser')
        text = ' '.join([p.get_text() for p in soup.find_all('p')])  # Extracts all paragraph text
        # Optionally, extract image URLs if needed
        images = [img['src'] for img in soup.find_all('img') if img.has_attr('src')]
        return text, images
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")

# Function to extract the first 30 characters of the URL (for display purposes)
def extract_url_name(url: str):
    try:
        domain = url.split('//')[-1]  # Remove 'http://' or 'https://'
        domain_name = domain.split('/')[0]  # Get only the domain name
        return domain_name[:30]  # Return first 30 characters
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")

# Main function to handle multiple sources
def handle_extraction(files: list = [], urls: list = []):
    extracted_data = {}

    # Handle file uploads (images, PDFs)
    for file in files:
        file_extension = file.lower().split('.')[-1]
        
        if file_extension in ['jpg', 'jpeg', 'png']:
            # Extract text from image
            text = extract_text_from_image(file)
            extracted_data[file] = {
                'type': 'image',
                'text': text,
                'image': file  # Just add the image path or base64 image if needed
            }

        elif file_extension == 'pdf':
            # Extract text from PDF using pdfplumber
            data = extract_text_from_pdf(file)
            for page, content in data.items():
                extracted_data[f"{file}_page_{page}"] = {
                    'type': 'pdf',
                    'text': content['text'],
                    'image': content['image']  # Save the image (if needed)
                }
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

    # Handle URL inputs
    for idx, url in enumerate(urls):
        url_name = extract_url_name(url)
        text, images = extract_text_from_url(url)
        extracted_data[f"url_{idx+1}"] = {
            'type': 'url',
            'name': url_name,
            'text': text,
            'image': images  # List of image URLs found on the page
        }

    return extracted_data
