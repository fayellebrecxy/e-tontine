import zipfile
import re
import xml.etree.ElementTree as ET

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/originalTAMELA.docx'

try:
    with zipfile.ZipFile(docx_path) as z:
        doc_xml_bytes = z.read('word/document.xml')
        rels_xml_bytes = z.read('word/_rels/document.xml.rels')
        
    root = ET.fromstring(doc_xml_bytes)
    rels_root = ET.fromstring(rels_xml_bytes)
    
    # Namespaces
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }
    
    # Build rels map
    rel_map = {}
    for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
        rid = rel.get('Id')
        target = rel.get('Target')
        rel_map[rid] = target
        
    # Let's search for paragraph containing blip and print their text and preceding text
    paragraphs = list(root.findall('.//w:p', ns))
    for i, p in enumerate(paragraphs):
        blips = p.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip', ns)
        if blips:
            embed_id = blips[0].get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            target = rel_map.get(embed_id)
            
            # Print paragraph text
            texts = p.findall('.//w:t', ns)
            p_text = "".join([t.text for t in texts if t.text])
            
            # Get next 2 paragraphs
            next_texts = []
            for j in range(1, 4):
                if i + j < len(paragraphs):
                    nt = "".join([t.text for t in paragraphs[i+j].findall('.//w:t', ns) if t.text])
                    if nt:
                        next_texts.append(nt)
            
            print(f"Image: {target} | Text: '{p_text}' | Next texts: {next_texts}")
            
except Exception as e:
    import traceback
    traceback.print_exc()
