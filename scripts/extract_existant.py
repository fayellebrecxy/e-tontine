import zipfile
import xml.etree.ElementTree as ET
import os

def extract_section(docx_path, output_txt_path):
    if not os.path.exists(docx_path):
        print("File not found")
        return

    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        paragraphs = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [run.text for run in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if run.text]
            paragraphs.append("".join(texts))
            
        # We find where I.2 ÉTUDE DE L’EXISTANT starts and where CHAPITRE II starts (skipping TOC, so index > 120)
        start_idx = -1
        end_idx = -1
        for idx, p in enumerate(paragraphs):
            if idx < 120:
                continue
            if "I.2 ÉTUDE DE L’EXISTANT" in p.upper() or "I.2 ETUDE DE L'EXISTANT" in p.upper() or "I.2 ETUDE DE L’EXISTANT" in p.upper():
                if start_idx == -1:
                    start_idx = idx
            if "CHAPITRE II :" in p.upper() or "CHAPITRE II" == p.strip().upper():
                if start_idx != -1 and end_idx == -1:
                    end_idx = idx
                    
        print(f"Start index: {start_idx}, End index: {end_idx}")
        if start_idx != -1:
            if end_idx == -1:
                end_idx = len(paragraphs)
            with open(output_txt_path, 'w', encoding='utf-8') as out_f:
                for p in paragraphs[start_idx:end_idx]:
                    out_f.write(p + "\n")
            print("Extracted successfully!")
        else:
            print("Could not find section start.")

if __name__ == "__main__":
    extract_section("/home/fayelle-yvanna/Documents/e-tontine/Docs/memoire-E-TONTINE (1) (1).docx", "/home/fayelle-yvanna/Documents/e-tontine/Docs/existant_extracted.txt")
