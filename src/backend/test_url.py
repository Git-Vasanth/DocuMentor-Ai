import os
import requests
from bs4 import BeautifulSoup, Tag
from bs4.element import NavigableString
import logging
from concurrent.futures import ThreadPoolExecutor
import shutil
from datetime import datetime

url = "https://en.wikipedia.org/wiki/M%C3%B6bius_strip"

response = requests.get(url)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')

for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

print(soup)