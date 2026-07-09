#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

def draw_arrow(draw, x1, y1, x2, y2, label="", font=None, color=(0, 0, 0), label_side="top"):
    # Draw line
    draw.line((x1, y1, x2, y2), fill=color, width=2)
    # Draw arrowhead
    ang = math.atan2(y2 - y1, x2 - x1)
    s = 9
    draw.polygon([
        (x2, y2),
        (x2 - s * math.cos(ang - 0.35), y2 - s * math.sin(ang - 0.35)),
        (x2 - s * math.cos(ang + 0.35), y2 - s * math.sin(ang + 0.35))
    ], fill=color)
    # Text label
    if label and font:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        offset = 18
        if label_side == "top":
            draw.text((mx, my - offset), label, font=font, fill=color, anchor="mm")
        elif label_side == "bottom":
            draw.text((mx, my + offset), label, font=font, fill=color, anchor="mm")

def draw_stick_figure(draw, x, y, label, font):
    color = (0, 0, 0)
    # Head
    draw.ellipse((x - 14, y - 40, x + 14, y - 12), outline=color, fill=(255, 255, 255), width=2)
    # Body
    draw.line((x, y - 12, x, y + 25), fill=color, width=2)
    # Arms
    draw.line((x - 22, y - 2, x + 22, y - 2), fill=color, width=2)
    # Legs
    draw.line((x, y + 25, x - 15, y + 65), fill=color, width=2)
    draw.line((x, y + 25, x + 15, y + 65), fill=color, width=2)
    # Text
    draw.text((x, y + 75), label, font=font, fill=color, anchor="ma")

def draw_contexte_global():
    os.makedirs("Docs", exist_ok=True)
    
    img_w, img_h = 1000, 520
    bg_color = (255, 255, 255)
    img = Image.new("RGB", (img_w, img_h), bg_color)
    draw = ImageDraw.Draw(img)
    
    BLACK = (0, 0, 0)
    WHITE = (255, 255, 255)
    
    # Bounding rectangle around the diagram
    draw.rectangle((10, 10, img_w - 10, img_h - 10), outline=BLACK, width=2)
    
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    
    if os.path.exists(font_path):
        f_bold = ImageFont.truetype(font_bold_path, 13)
        f_reg = ImageFont.truetype(font_path, 12)
        f_italic = ImageFont.truetype(font_path, 11)
        f_sys_title = ImageFont.truetype(font_bold_path, 18)
    else:
        f_bold = ImageFont.load_default()
        f_reg = ImageFont.load_default()
        f_italic = ImageFont.load_default()
        f_sys_title = ImageFont.load_default()

    # 1. Central System Box (E-Tontine)
    # Centered: sys_cx = 500, sys_cy = 260. Taller box so it aligns with both actors.
    sys_w, sys_h = 240, 240
    sys_cx, sys_cy = img_w / 2, img_h / 2
    sys_x1, sys_y1 = sys_cx - sys_w / 2, sys_cy - sys_h / 2
    sys_x2, sys_y2 = sys_cx + sys_w / 2, sys_cy + sys_h / 2
    
    # Draw central SYSTEME box (y spans 140 to 380)
    draw.rectangle((sys_x1, sys_y1, sys_x2, sys_y2), outline=BLACK, fill=WHITE, width=2)
    draw.text((sys_cx, sys_cy), "SYSTEME", font=f_sys_title, fill=BLACK, anchor="mm")

    # 2. Left Actor 1: Membre (Upper left, center y = 160)
    draw_stick_figure(draw, 130, 160, "MEMBRE", f_bold)
    
    # Left Actor 2: Administrateur (Lower left, center y = 340)
    draw_stick_figure(draw, 130, 340, "ADMINISTRATEUR", f_bold)

    # 3. Right Actor 3: API de paiement (System Box)
    api_w, api_h = 210, 100
    api_cx, api_cy = 830, sys_cy
    api_x1, api_y1 = api_cx - api_w / 2, api_cy - api_h / 2
    api_x2, api_y2 = api_cx + api_w / 2, api_cy + api_h / 2
    
    # Draw API de paiement box (y spans 210 to 310)
    draw.rectangle((api_x1, api_y1, api_x2, api_y2), outline=BLACK, fill=WHITE, width=2)
    draw.text((api_cx, api_cy), "API DE PAIEMENT", font=f_bold, fill=BLACK, anchor="mm")

    # 4. Connection Lines (simple lines without arrows or labels)
    # Membre -> SYSTEME
    draw.line((160, 160, sys_x1, 160), fill=BLACK, width=2)

    # Administrateur -> SYSTEME
    draw.line((160, 340, sys_x1, 340), fill=BLACK, width=2)

    # SYSTEME -> API de paiement
    draw.line((sys_x2, 260, api_x1, 260), fill=BLACK, width=2)

    # Save
    output_path = "Docs/contexte-global.png"
    img.save(output_path, "PNG")
    print(f"Diagram updated successfully: {output_path}")

if __name__ == "__main__":
    draw_contexte_global()
