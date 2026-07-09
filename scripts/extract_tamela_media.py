import zipfile
import os

docx_path = '/home/fayelle-yvanna/Documents/e-tontine/Docs/originalTAMELA.docx'
extract_dir = '/home/fayelle-yvanna/Documents/e-tontine/Docs/tamela-reference-extract'

os.makedirs(extract_dir, exist_ok=True)

try:
    with zipfile.ZipFile(docx_path) as z:
        media_files = [f for f in z.namelist() if f.startswith('word/media/')]
        print(f"Total media files found: {len(media_files)}")
        
        # Sort them
        media_files.sort()
        for f in media_files:
            size = z.getinfo(f).file_size
            print(f"  {f}: {size} bytes")
            # Extract
            base = os.path.basename(f)
            out_path = os.path.join(extract_dir, base)
            with open(out_path, 'wb') as out_f:
                out_f.write(z.read(f))
                
except Exception as e:
    print("Error:", e)
