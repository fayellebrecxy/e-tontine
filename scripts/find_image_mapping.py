import zipfile
import re

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/originalTAMELA.docx'

try:
    with zipfile.ZipFile(docx_path) as z:
        doc_xml = z.read('word/document.xml').decode('utf-8')
        rels_xml = z.read('word/_rels/document.xml.rels').decode('utf-8')
        
    rels = re.findall(r'Id="([^"]+)"\s+Type="[^"]+image"\s+Target="([^"]+)"', rels_xml)
    rel_map = {rId: target for rId, target in rels}
    
    # Search for "Figure 23"
    pos = doc_xml.find("Figure 23")
    print(f"Figure 23 index: {pos}")
    
    # Let's search for "embed" or "embed=\"" in the window of 20,000 characters before pos
    window = doc_xml[max(0, pos-20000) : min(len(doc_xml), pos+1000)]
    
    # Find any w:drawing or graphic
    # Let's search for any rId in this window
    rids = re.findall(r'rId\d+', window)
    print("Found rIds in window:", rids)
    for rid in set(rids):
        if rid in rel_map:
            print(f"  {rid} -> {rel_map[rid]}")
            
except Exception as e:
    print("Error:", e)
