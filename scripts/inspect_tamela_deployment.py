import zipfile
import re
import xml.etree.ElementTree as ET

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/originalTAMELA.docx'

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    
    root = ET.fromstring(xml_content)
    
    # Define namespaces
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }
    
    # Extract all paragraphs and check if they contain keywords
    paragraphs = root.findall('.//w:p', ns)
    print(f"Total paragraphs: {len(paragraphs)}")
    
    matches = []
    for idx, p in enumerate(paragraphs):
        texts = p.findall('.//w:t', ns)
        p_text = "".join([t.text for t in texts if t.text])
        if p_text and ("déploiement" in p_text.lower() or "deploiement" in p_text.lower() or "physique" in p_text.lower() or "noeud" in p_text.lower() or "nœud" in p_text.lower() or "diagramme de" in p_text.lower()):
            matches.append((idx, p_text))
            
    print("\n--- MATCHING PARAGRAPHS ---")
    for idx, text in matches:
        print(f"[{idx}]: {text}")
        
except Exception as e:
    print("Error:", e)
