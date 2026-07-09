#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

def draw_se_connecter():
    # Create target directory if not exists
    os.makedirs("Docs", exist_ok=True)
    
    # Image size and background (Modern styling)
    img_w, img_h = 900, 500
    bg_color = (250, 251, 253) # Crisp clean soft blue-gray
    img = Image.new("RGB", (img_w, img_h), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Colors
    DARK_BLUE = (15, 23, 42)    # Slate-900 (Text and main lines)
    LIGHT_GRAY = (148, 163, 184) # Slate-400 (Dashed lines and borders)
    SYS_BORDER = (71, 85, 105)  # Slate-600 (System boundary)
    SYS_BG = (255, 255, 255)    # White (System box background)
    UC_BORDER = (29, 78, 216)   # Blue-700 (Use case outline)
    UC_FILL = (239, 246, 255)   # Blue-50 (Use case background)
    
    # Fonts
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    
    if not os.path.exists(font_path):
        # Fallback to default
        f_title = ImageFont.load_default()
        f_reg = ImageFont.load_default()
        f_bold = ImageFont.load_default()
        f_italic = ImageFont.load_default()
    else:
        f_title = ImageFont.truetype(font_bold_path, 22)
        f_reg = ImageFont.truetype(font_path, 15)
        f_bold = ImageFont.truetype(font_bold_path, 15)
        f_italic = ImageFont.truetype(font_path, 13)

    # 1. Draw Title
    title_text = "DIAGRAMME DE CAS D'UTILISATION : SE CONNECTER"
    draw.text((img_w / 2, 25), title_text, font=f_title, fill=DARK_BLUE, anchor="ma")

    # 2. Draw System Boundary (E-Tontine Platform)
    sys_x1, sys_y1, sys_x2, sys_y2 = 240, 80, 660, 440
    # Soft shadow effect
    draw.rectangle((sys_x1 + 3, sys_y1 + 3, sys_x2 + 3, sys_y2 + 3), fill=(226, 232, 240))
    # Main boundary
    draw.rectangle((sys_x1, sys_y1, sys_x2, sys_y2), outline=SYS_BORDER, fill=SYS_BG, width=2)
    # System name
    draw.text((sys_x1 + 15, sys_y1 + 12), "Plateforme E-Tontine", font=f_bold, fill=SYS_BORDER)

    # 3. Draw Actor: Utilisateur (Left side)
    act_x, act_y = 110, 240
    # Head
    draw.ellipse((act_x - 15, act_y - 50, act_x + 15, act_y - 20), outline=DARK_BLUE, width=3)
    # Body
    draw.line((act_x, act_y - 20, act_x, act_y + 20), fill=DARK_BLUE, width=3)
    # Arms
    draw.line((act_x - 25, act_y - 10, act_x + 25, act_y - 10), fill=DARK_BLUE, width=3)
    # Legs
    draw.line((act_x, act_y + 20, act_x - 18, act_y + 55), fill=DARK_BLUE, width=3)
    draw.line((act_x, act_y + 20, act_x + 18, act_y + 55), fill=DARK_BLUE, width=3)
    # Actor label
    draw.text((act_x, act_y + 70), "Utilisateur", font=f_bold, fill=DARK_BLUE, anchor="ma")

    # 4. Draw External System Actor: Supabase Auth (Right side)
    ext_x1, ext_y1, ext_x2, ext_y2 = 710, 220, 850, 300
    # Shadow
    draw.rectangle((ext_x1 + 2, ext_y1 + 2, ext_x2 + 2, ext_y2 + 2), fill=(226, 232, 240))
    # Box
    draw.rectangle((ext_x1, ext_y1, ext_x2, ext_y2), outline=SYS_BORDER, fill=UC_FILL, width=2)
    # Text
    draw.text(((ext_x1 + ext_x2) / 2, (ext_y1 + ext_y2) / 2 - 18), "«system»", font=f_italic, fill=SYS_BORDER, anchor="ma")
    draw.text(((ext_x1 + ext_x2) / 2, (ext_y1 + ext_y2) / 2 + 2), "Supabase Auth", font=f_bold, fill=SYS_BORDER, anchor="ma")

    # 5. Draw Use Cases (inside boundary)
    # UC 1: Se connecter
    uc1_cx, uc1_cy, uc1_rx, uc1_ry = 450, 160, 120, 36
    draw.ellipse((uc1_cx - uc1_rx, uc1_cy - uc1_ry, uc1_cx + uc1_rx, uc1_cy + uc1_ry), outline=UC_BORDER, fill=UC_FILL, width=2)
    draw.text((uc1_cx, uc1_cy), "Se connecter", font=f_bold, fill=DARK_BLUE, anchor="mm")

    # UC 2: Vérifier les identifiants
    uc2_cx, uc2_cy, uc2_rx, uc2_ry = 450, 340, 140, 38
    draw.ellipse((uc2_cx - uc2_rx, uc2_cy - uc2_ry, uc2_cx + uc2_rx, uc2_cy + uc2_ry), outline=UC_BORDER, fill=UC_FILL, width=2)
    draw.text((uc2_cx, uc2_cy), "Vérifier les\nidentifiants", font=f_bold, fill=DARK_BLUE, anchor="mm")

    # 6. Draw Associations and Relationships
    # Line from Actor "Utilisateur" to Use Case "Se connecter"
    # End point is left edge of UC1 (uc1_cx - uc1_rx, uc1_cy)
    draw.line((act_x + 25, act_y - 10, uc1_cx - uc1_rx, uc1_cy), fill=DARK_BLUE, width=2)

    # Line from "Vérifier les identifiants" to external system "Supabase Auth"
    # Start point is right edge of UC2 (uc2_cx + uc2_rx, uc2_cy)
    # End point is left edge of box (ext_x1, (ext_y1+ext_y2)/2)
    draw.line((uc2_cx + uc2_rx, uc2_cy, ext_x1, (ext_y1 + ext_y2) / 2), fill=DARK_BLUE, width=2)

    # Dashed arrow from "Se connecter" to "Vérifier les identifiants" (<<include>>)
    # Vertical line from bottom of UC1 to top of UC2
    y_start = uc1_cy + uc1_ry
    y_end = uc2_cy - uc2_ry
    x_pos = 450
    
    # Draw dashed vertical line
    y_curr = y_start
    dash_len = 6
    gap_len = 4
    while y_curr < y_end - 8:
        draw.line((x_pos, y_curr, x_pos, min(y_curr + dash_len, y_end - 8)), fill=LIGHT_GRAY, width=2)
        y_curr += dash_len + gap_len
        
    # Draw arrowhead at the end (pointing down)
    arrow_y = y_end
    draw.line((x_pos, arrow_y, x_pos - 6, arrow_y - 10), fill=LIGHT_GRAY, width=2)
    draw.line((x_pos, arrow_y, x_pos + 6, arrow_y - 10), fill=LIGHT_GRAY, width=2)
    
    # Label for <<include>>
    draw.text((x_pos + 12, (y_start + y_end) / 2), "<<include>>", font=f_italic, fill=DARK_BLUE, anchor="lm")

    # Save image
    output_path = "Docs/se-connecter.png"
    img.save(output_path, "PNG")
    print(f"Custom diagram saved to {output_path}")

if __name__ == "__main__":
    draw_se_connecter()
