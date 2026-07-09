import zipfile
import re

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/originalTAMELA.docx'

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml').decode('utf-8')
    
    # Find all paragraph text
    paragraphs = re.findall(r'<w:p\b[^>]*>(.*?)</w:p>', xml_content)
    print(f"Total paragraphs in originalTAMELA: {len(paragraphs)}")

    # Search for headings or paragraphs about authentification or sequence diagrams
    auth_mentions = []
    headings = []
    
    for i, p in enumerate(paragraphs):
        runs = re.findall(r'<w:t\b[^>]*>(.*?)</w:t>', p)
        p_text = "".join(runs)
        if not p_text:
            continue
        
        if 'w:pStyle' in p:
            style_match = re.search(r'<w:pStyle w:val="([^"]+)"/>', p)
            if style_match:
                headings.append((style_match.group(1), p_text))
        
        if "authenti" in p_text.lower() or "séquence" in p_text.lower():
            auth_mentions.append((i, p_text))
            
    print("\n--- FIRST 20 HEADINGS IN originalTAMELA ---")
    for style, text in headings[:40]:
        print(f"  [{style}]: {text}")
        
    print("\n--- SOME PARAGRAPHS MENTIONING AUTH/SEQUENCE IN originalTAMELA ---")
    for idx, text in auth_mentions[:15]:
        print(f"  [{idx}]: {text[:150]}")
except Exception as e:
    print("Error:", e)
