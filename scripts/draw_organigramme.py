import os
from PIL import Image, ImageDraw, ImageFont

def draw_organigram():
    # Target directory
    os.makedirs("Docs", exist_ok=True)
    
    # Image size and background
    img_w, img_h = 1200, 650
    bg_color = (248, 250, 252) # Slate 50
    img = Image.new("RGB", (img_w, img_h), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Colors
    color_line = (148, 163, 184) # Slate 400
    color_dg_bg = (15, 23, 42) # Slate 900
    color_dep_bg = (29, 78, 216) # Blue 700
    color_sub_bg = (255, 255, 255) # White
    color_sub_border = (191, 219, 254) # Blue 200
    color_shadow = (226, 232, 240) # Slate 200
    
    # Fonts
    font_path_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_path_regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    
    font_title_lg = ImageFont.truetype(font_path_bold, 15)
    font_text_lg = ImageFont.truetype(font_path_regular, 13)
    font_title_md = ImageFont.truetype(font_path_bold, 13)
    font_text_md = ImageFont.truetype(font_path_regular, 12)
    font_title_sm = ImageFont.truetype(font_path_bold, 11)
    font_text_sm = ImageFont.truetype(font_path_regular, 10)
    
    # Draw connection lines (width=3 for visibility and modern look)
    # Line from DG to Level 1
    draw.line([(600, 150), (600, 200)], fill=color_line, width=3)
    draw.line([(200, 200), (1000, 200)], fill=color_line, width=3)
    draw.line([(200, 200), (200, 250)], fill=color_line, width=3)
    draw.line([(600, 200), (600, 250)], fill=color_line, width=3)
    draw.line([(1000, 200), (1000, 250)], fill=color_line, width=3)
    
    # Line from Direction Technique to Level 2
    draw.line([(600, 345), (600, 405)], fill=color_line, width=3)
    draw.line([(225, 405), (975, 405)], fill=color_line, width=3)
    draw.line([(225, 405), (225, 460)], fill=color_line, width=3)
    draw.line([(475, 405), (475, 460)], fill=color_line, width=3)
    draw.line([(725, 405), (725, 460)], fill=color_line, width=3)
    draw.line([(975, 405), (975, 460)], fill=color_line, width=3)
    
    def draw_shadow_box(bounds, fill, outline=None, width=1, radius=10):
        # Draw shadow
        x1, y1, x2, y2 = bounds
        offset = 4
        draw.rounded_rectangle(
            (x1 + offset, y1 + offset, x2 + offset, y2 + offset),
            radius=radius,
            fill=color_shadow
        )
        # Draw actual rounded rectangle box
        draw.rounded_rectangle(
            bounds,
            radius=radius,
            fill=fill,
            outline=outline,
            width=width
        )
        
    # 1. Level 0: Direction Générale
    draw_shadow_box((450, 60, 750, 150), color_dg_bg, radius=10)
    draw.text((600, 85), "Direction Générale", fill=(255, 255, 255), font=font_title_lg, anchor="mm")
    draw.text((600, 110), "M. HARUNA Rachid", fill=(241, 245, 249), font=font_text_lg, anchor="mm")
    draw.text((600, 130), "(Gérant)", fill=(148, 163, 184), font=font_text_md, anchor="mm")
    
    # 2. Level 1: Departments
    # Left: Direction Commerciale
    draw_shadow_box((75, 250, 325, 345), color_dep_bg, radius=10)
    draw.text((200, 275), "Direction Commerciale", fill=(255, 255, 255), font=font_title_md, anchor="mm")
    draw.text((200, 300), "M. KENWOU Barthez", fill=(239, 246, 255), font=font_text_md, anchor="mm")
    draw.text((200, 320), "(Directeur Commercial)", fill=(147, 197, 253), font=font_text_sm, anchor="mm")
    
    # Center: Direction Technique
    draw_shadow_box((475, 250, 725, 345), color_dep_bg, radius=10)
    draw.text((600, 275), "Direction Technique", fill=(255, 255, 255), font=font_title_md, anchor="mm")
    draw.text((600, 300), "M. TAFOTSI Dimitri", fill=(239, 246, 255), font=font_text_md, anchor="mm")
    draw.text((600, 320), "(Directeur Technique)", fill=(147, 197, 253), font=font_text_sm, anchor="mm")
    
    # Right: Service SAF
    draw_shadow_box((875, 250, 1125, 345), color_dep_bg, radius=10)
    draw.text((1000, 275), "Service Admin & Financier", fill=(255, 255, 255), font=font_title_md, anchor="mm")
    draw.text((1000, 300), "Mme OYONO Sylviane", fill=(239, 246, 255), font=font_text_md, anchor="mm")
    draw.text((1000, 320), "(Responsable SAF)", fill=(147, 197, 253), font=font_text_sm, anchor="mm")
    
    # 3. Level 2: Sub-units under Direction Technique
    # Sub 1: Pôle Web
    draw_shadow_box((115, 460, 335, 550), color_sub_bg, outline=color_sub_border, width=2, radius=8)
    draw.text((225, 485), "Pôle Développement Web", fill=(30, 41, 59), font=font_title_sm, anchor="mm")
    draw.text((225, 510), "M. PRINCE MABENGUE", fill=(15, 23, 42), font=font_text_sm, anchor="mm")
    draw.text((225, 530), "(Chef d'équipe)", fill=(71, 85, 105), font=font_text_sm, anchor="mm")
    
    # Sub 2: Pôle Mobile
    draw_shadow_box((365, 460, 585, 550), color_sub_bg, outline=color_sub_border, width=2, radius=8)
    draw.text((475, 485), "Pôle Développement Mobile", fill=(30, 41, 59), font=font_title_sm, anchor="mm")
    draw.text((475, 510), "M. ATEBA François", fill=(15, 23, 42), font=font_text_sm, anchor="mm")
    draw.text((475, 530), "(Développeurs Mobile)", fill=(71, 85, 105), font=font_text_sm, anchor="mm")
    
    # Sub 3: Pôle Design UX/UI
    draw_shadow_box((615, 460, 835, 550), color_sub_bg, outline=color_sub_border, width=2, radius=8)
    draw.text((725, 485), "Pôle Design UX/UI", fill=(30, 41, 59), font=font_title_sm, anchor="mm")
    draw.text((725, 510), "M. FOUDA Edward", fill=(15, 23, 42), font=font_text_sm, anchor="mm")
    draw.text((725, 530), "(Designers UX/UI)", fill=(71, 85, 105), font=font_text_sm, anchor="mm")
    
    # Sub 4: Support & Maintenance
    draw_shadow_box((865, 460, 1085, 550), color_sub_bg, outline=color_sub_border, width=2, radius=8)
    draw.text((975, 485), "Support & Maintenance", fill=(30, 41, 59), font=font_title_sm, anchor="mm")
    draw.text((975, 510), "M. NOAH Ulrich", fill=(15, 23, 42), font=font_text_sm, anchor="mm")
    draw.text((975, 530), "(Maintenance / Support)", fill=(71, 85, 105), font=font_text_sm, anchor="mm")
    
    # Save image
    img.save("Docs/organigramme.png")
    print("Organigram saved successfully in Docs/organigramme.png")

if __name__ == "__main__":
    draw_organigram()
