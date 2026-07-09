import os
from PIL import Image, ImageDraw, ImageFont

def draw_organigramme_navigation():
    # Ensure target directory exists
    os.makedirs("Docs", exist_ok=True)
    
    # Image size and background: matching TAMELA style (light gray background #e1e4e6)
    img_w, img_h = 4900, 2250
    bg_color = (230, 245, 230)  # Soft premium pastel green
    img = Image.new("RGB", (img_w, img_h), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Colors
    color_line = (0, 0, 0)
    color_border = (0, 0, 0)
    color_fill = (255, 255, 255)
    
    # Fonts (larger sizes for maximum legibility)
    font_path_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_path_regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    
    font_title = ImageFont.truetype(font_path_bold, 48)
    font_regular = ImageFont.truetype(font_path_regular, 36)
    
    # Helper to draw arrows
    def draw_arrow(p1, p2, width=3.5, color=(0, 0, 0)):
        x1, y1 = p1
        x2, y2 = p2
        # Draw line
        draw.line([p1, p2], fill=color, width=int(width))
        # Draw arrowhead
        arrow_size = 24
        if x1 == x2: # Vertical line
            if y2 > y1: # Pointing down
                draw.polygon([(x2 - arrow_size, y2 - arrow_size), (x2, y2), (x2 + arrow_size, y2 - arrow_size)], fill=color)
            else: # Pointing up
                draw.polygon([(x2 - arrow_size, y2 + arrow_size), (x2, y2), (x2 + arrow_size, y2 + arrow_size)], fill=color)
        elif y1 == y2: # Horizontal line
            if x2 > x1: # Pointing right
                draw.polygon([(x2 - arrow_size, y2 - arrow_size), (x2, y2), (x2 - arrow_size, y2 + arrow_size)], fill=color)
            else: # Pointing left
                draw.polygon([(x2 + arrow_size, y2 - arrow_size), (x2, y2), (x2 + arrow_size, y2 + arrow_size)], fill=color)

    # Helper to draw polygon with outlines
    def draw_polygon_with_width(points, fill_color=(255, 255, 255), outline_color=(0, 0, 0), line_width=3.5):
        draw.polygon(points, fill=fill_color)
        for i in range(len(points)):
            p1 = points[i]
            p2 = points[(i + 1) % len(points)]
            draw.line([p1, p2], fill=outline_color, width=int(line_width))

    # Shapes:
    # 1. Oval (Debut/Fin/Deconnexion)
    def draw_oval(cx, cy, rx, ry, text):
        draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=color_fill, outline=color_border, width=3)
        draw.text((cx, cy), text, fill=(0, 0, 0), font=font_title, anchor="mm")

    # 2. Rectangle (Dashboards)
    def draw_rect(cx, cy, w, h, text_lines):
        draw.rectangle((cx - w//2, cy - h//2, cx + w//2, cy + h//2), fill=color_fill, outline=color_border, width=3)
        y_text = cy - (len(text_lines) - 1) * 30
        for line in text_lines:
            draw.text((cx, y_text), line, fill=(0, 0, 0), font=font_title, anchor="mm")
            y_text += 60

    # 3. Parallelogram (Actions/Views)
    def draw_parallelogram(cx, cy, w, h, text):
        offset = 20
        points = [
            (cx - w//2 + offset, cy - h//2),
            (cx + w//2 + offset, cy - h//2),
            (cx + w//2 - offset, cy + h//2),
            (cx - w//2 - offset, cy + h//2)
        ]
        draw_polygon_with_width(points, fill_color=color_fill, outline_color=color_border, line_width=3.5)
        lines = text.split("\n")
        y_text = cy - (len(lines) - 1) * 22
        for line in lines:
            draw.text((cx, y_text), line, fill=(0, 0, 0), font=font_regular, anchor="mm")
            y_text += 44

    # 4. Diamond (Decision)
    def draw_diamond(cx, cy, w, h, text_lines):
        points = [
            (cx, cy - h//2),
            (cx + w//2, cy),
            (cx, cy + h//2),
            (cx - w//2, cy)
        ]
        draw_polygon_with_width(points, fill_color=color_fill, outline_color=color_border, line_width=3.5)
        y_text = cy - (len(text_lines) - 1) * 25
        for line in text_lines:
            draw.text((cx, y_text), line, fill=(0, 0, 0), font=font_regular, anchor="mm")
            y_text += 50

    # Layout Parameters
    spine_x = 550
    dash_x = 2800
    return_x = 4750
    
    # --- Left Spine Flow ---
    # Debut
    draw_oval(spine_x, 120, 180, 65, "Début")
    draw_arrow((spine_x, 185), (spine_x, 260))
    
    # S'authentifier
    draw_parallelogram(spine_x, 335, 420, 150, "S'authentifier")
    draw_arrow((spine_x, 410), (spine_x, 490))
    
    # Diamond 1: role = Administrateur
    draw_diamond(spine_x, 580, 560, 180, ["role =", "Administrateur"])
    
    # --- Admin Module (Upper Section) ---
    # OUI branch to Admin Dashboard
    draw_arrow((spine_x + 280, 580), (2550, 580))
    draw.text((950, 520), "OUI", fill=(0, 0, 0), font=font_title)
    
    # Admin Dashboard
    draw_rect(dash_x, 580, 500, 140, [
        "Tableau de bord",
        "Administrateur"
    ])
    
    # Line down from Admin Dashboard to its top bus
    draw.line([(dash_x, 650), (dash_x, 710)], fill=(0, 0, 0), width=3)
    
    # Horizontal bus for Admin actions
    admin_centers_x = [1100, 1525, 1950, 2375, 2800, 3225, 3650, 4075, 4500]
    draw.line([(admin_centers_x[0], 710), (admin_centers_x[-1], 710)], fill=(0, 0, 0), width=3)
    
    # Admin Actions (9 items)
    admin_actions = [
        "Gestion membres\net adhésions",
        "Gestion des\ncycles",
        "Enregistrement\ndes cotisations",
        "Gestion de\nl'épargne",
        "Gestion des\nréunions",
        "Gestion des\nrubriques",
        "Configuration\ndes paramètres",
        "Gestion des\nprêts",
        "Journal financier\net rapports"
    ]
    
    box_width = 340
    box_height = 150
    
    for idx, cx in enumerate(admin_centers_x):
        draw_arrow((cx, 710), (cx, 810 - box_height//2))
        draw_parallelogram(cx, 810, box_width, box_height, admin_actions[idx])
        
    # Merge Admin actions to bottom bus
    draw.line([(admin_centers_x[0], 950), (return_x, 950)], fill=(0, 0, 0), width=3)
    for cx in admin_centers_x:
        draw.line([(cx, 810 + box_height//2), (cx, 950)], fill=(0, 0, 0), width=3)
        
    # --- Transition to Member Module ---
    # NON branch from Administrateur to Membre
    draw_arrow((spine_x, 670), (spine_x, 1060))
    draw.text((580, 850), "NON", fill=(0, 0, 0), font=font_title)
    
    # Diamond 2: role = Membre
    draw_diamond(spine_x, 1150, 560, 180, ["role =", "Membre"])
    
    # --- Member Module (Lower Section) ---
    # OUI branch to Member Dashboard
    draw_arrow((spine_x + 280, 1150), (2550, 1150))
    draw.text((950, 1090), "OUI", fill=(0, 0, 0), font=font_title)
    
    # Member Dashboard
    draw_rect(dash_x, 1150, 500, 140, [
        "Tableau de bord",
        "Membre"
    ])
    
    # Line down from Member Dashboard to its top bus
    draw.line([(dash_x, 1220), (dash_x, 1290)], fill=(0, 0, 0), width=3)
    
    # Horizontal bus for Member actions
    membre_centers_x = [1100, 1585, 2070, 2555, 3040, 3525, 4010, 4500]
    draw.line([(membre_centers_x[0], 1290), (membre_centers_x[-1], 1290)], fill=(0, 0, 0), width=3)
    
    # Member Actions (8 items)
    membre_actions = [
        "Cotisations\ndes cycles",
        "Cotisations\ndes rubriques",
        "Échange de\ntour",
        "Épargne et\nversements",
        "Demandes de\nprêts",
        "Réunions et\nexcuses",
        "Membres du\ngroupe",
        "Rapports et\nrelevés"
    ]
    
    for idx, cx in enumerate(membre_centers_x):
        draw_arrow((cx, 1290), (cx, 1450 - box_height//2))
        draw_parallelogram(cx, 1450, box_width, box_height, membre_actions[idx])
        
    # Merge Member actions to bottom bus
    draw.line([(membre_centers_x[0], 1650), (return_x, 1650)], fill=(0, 0, 0), width=3)
    for cx in membre_centers_x:
        draw.line([(cx, 1450 + box_height//2), (cx, 1650)], fill=(0, 0, 0), width=3)
        
    # --- Loopback from Diamond 2 NON ---
    # NON branch goes left, up, then right back to S'authentifier
    draw.line([(spine_x - 280, 1150), (150, 1150)], fill=(0, 0, 0), width=3)
    draw.line([(150, 1150), (150, 335)], fill=(0, 0, 0), width=3)
    draw_arrow((150, 335), (spine_x - 210, 335))
    draw.text((210, 1090), "NON", fill=(0, 0, 0), font=font_title)
    
    # --- Return Trunk & Merger to Deconnexion ---
    # Return trunk on the far right
    draw.line([(return_x, 950), (return_x, 1780)], fill=(0, 0, 0), width=3)
    draw.line([(return_x, 1650), (return_x, 1780)], fill=(0, 0, 0), width=3)
    
    # Horizontal line from trunk to spine at Y = 1780
    draw.line([(return_x, 1780), (spine_x, 1780)], fill=(0, 0, 0), width=3)
    draw_arrow((spine_x, 1780), (spine_x, 1815))
    
    # Deconnexion
    draw_oval(spine_x, 1880, 220, 65, "Déconnexion")
    draw_arrow((spine_x, 1945), (spine_x, 2035))
    
    # Fin
    draw_oval(spine_x, 2100, 160, 65, "Fin")
    
    # Save to both target locations to keep everything updated
    img.save("Docs/organigramme_navigation.png")
    img.save("Docs/organigramme.png")
    print("Navigation organigram successfully saved to Docs/organigramme_navigation.png and Docs/organigramme.png")

if __name__ == "__main__":
    draw_organigramme_navigation()
