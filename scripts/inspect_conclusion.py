import zipfile
import re
import xml.etree.ElementTree as ET

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/memoire-E-TONTINE (1) (1).docx'

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    
    root = ET.fromstring(xml_content)
    
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = root.findall('.//w:p', ns)
    
    print(f"Total paragraphs: {len(paragraphs)}")
    
    # Let's inspect the last 150 paragraphs of the document
    last_paragraphs = []
    for idx in range(len(paragraphs) - 150, len(paragraphs)):
        if idx < 0:
            continue
        p = paragraphs[idx]
        texts = p.findall('.//w:t', ns)
        p_text = "".join([t.text for t in texts if t.text]).strip()
        if p_text:
            last_paragraphs.append((idx, p_text))
            
    print("\n--- LAST PARAGRAPHS ---")
    for idx, text in last_paragraphs[-80:]:
        print(f"[{idx}]: {text}")
        
except Exception as e:
    print("Error:", e)
