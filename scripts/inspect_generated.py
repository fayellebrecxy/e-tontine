import zipfile
import re
import xml.etree.ElementTree as ET

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/memoire-E-TONTINE-genere.docx'

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    
    root = ET.fromstring(xml_content)
    
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = root.findall('.//w:p', ns)
    
    print(f"Total paragraphs in generated document: {len(paragraphs)}")
    
    # List all heading titles (usually bold or with specific styles)
    headings = []
    for idx, p in enumerate(paragraphs):
        texts = p.findall('.//w:t', ns)
        p_text = "".join([t.text for t in texts if t.text]).strip()
        if p_text and (p_text.startswith("CHAPITRE") or p_text.startswith("CONCLUSION") or "I." in p_text or "II." in p_text or "III." in p_text):
            headings.append((idx, p_text))
            
    print("\n--- HEADINGS IN GENERATED DOCX ---")
    for idx, h in headings:
        print(f"[{idx}]: {h}")
        
except Exception as e:
    print("Error:", e)
