#!/usr/bin/env python3
import os
from PIL import Image

def convert_to_bw(file_path):
    try:
        img = Image.open(file_path).convert("RGBA")
        width, height = img.size
        
        new_pixels = []
        for r, g, b, a in img.getdata():
            # If the pixel is very light (background, shadows, box backgrounds)
            # We check if red, green, and blue values are all relatively high, or if it is close to the soft blue/gray backgrounds
            if r > 215 and g > 220 and b > 220:
                new_pixels.append((255, 255, 255, a))
            else:
                # Convert to grayscale
                gray = int(0.299 * r + 0.587 * g + 0.114 * b)
                # Keep lines, arrows, text, and actor lifelines crisp and dark
                if gray < 160:
                    new_pixels.append((0, 0, 0, a))
                else:
                    # Antialiasing gradient mapping: scale between 160 and 255
                    val = int((gray - 160) * 255 / (255 - 160))
                    new_pixels.append((val, val, val, a))
                    
        new_img = Image.new("RGBA", (width, height))
        new_img.putdata(new_pixels)
        new_img.convert("RGB").save(file_path, "PNG")
        print(f"Successfully processed {file_path} to black & white.")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def main():
    docs_dir = "Docs"
    for filename in os.listdir(docs_dir):
        if filename.startswith("dss-") and filename.endswith(".png"):
            file_path = os.path.join(docs_dir, filename)
            convert_to_bw(file_path)

if __name__ == "__main__":
    main()
