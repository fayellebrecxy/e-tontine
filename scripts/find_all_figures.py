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
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    }
    
    # Build rels map
    rel_map = {}
    for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
        rid = rel.get('Id')
        target = rel.get('Target')
        rel_map[rid] = target
        
    print(f"Total relationships: {len(rel_map)}")
    
    # Iterate through paragraphs, keep track of last drawing seen
    last_image = None
    
    for idx, elem in enumerate(root.iter()):
        # Check if elem is a drawing/image reference
        # look for a:blip or pic:blip
        if elem.tag.endswith('blip'):
            embed_id = elem.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            if embed_id and embed_id in rel_map:
                last_image = rel_map[embed_id]
                
        # Check if elem is a text node containing "Figure"
        if elem.tag.endswith('t') and elem.text and "Figure" in elem.text:
            # Let's print it and the last seen image
            print(f"Text: '{elem.text}' | Associated Image: {last_image}")
            
except Exception as e:
    import traceback
    traceback.print_exc()
