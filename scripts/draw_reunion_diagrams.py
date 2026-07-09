#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

# Typography & Color System
DARK_BLUE = (0, 0, 0)
GRAY = (71, 85, 105)        # Slate-600 (Lifelines, minor text)
LIGHT_GRAY = (148, 163, 184)# Slate-400 (Dashed lines)
BG_COLOR = (255, 255, 255)
SHADOW_COLOR = (255, 255, 255)

# UML Shapes Colors
BOX_BORDER = (0, 0, 0)
BOX_BG = (255, 255, 255)
DEC_BORDER = (185, 28, 28)   # Red-700
DEC_BG = (254, 242, 242)     # Red-50
GREEN_BORDER = (4, 120, 87)  # Emerald-700
GREEN_BG = (236, 253, 245)   # Emerald-50

font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

if os.path.exists(font_path):
    F_BOLD = ImageFont.truetype(font_bold_path, 13)
    F_REG = ImageFont.truetype(font_path, 13)
    F_ITALIC = ImageFont.truetype(font_path, 11)
else:
    F_BOLD = ImageFont.load_default()
    F_REG = ImageFont.load_default()
    F_ITALIC = ImageFont.load_default()

def draw_arrow(draw, x1, y1, x2, y2, label="", font=None, color=DARK_BLUE, label_side="top", dashed=False):
    if dashed:
        dist = math.hypot(x2 - x1, y2 - y1)
        ux, uy = (x2 - x1) / dist, (y2 - y1) / dist
        pos, draw_segment = 0.0, True
        step = 8
        while pos < dist:
            nxt = min(pos + step, dist)
            if draw_segment:
                draw.line((x1 + ux * pos, y1 + uy * pos, x1 + ux * nxt, y1 + uy * nxt), fill=color, width=2)
            pos, draw_segment = nxt, not draw_segment
    else:
        draw.line((x1, y1, x2, y2), fill=color, width=2)
        
    ang = math.atan2(y2 - y1, x2 - x1)
    s = 9
    draw.polygon([
        (x2, y2),
        (x2 - s * math.cos(ang - 0.35), y2 - s * math.sin(ang - 0.35)),
        (x2 - s * math.cos(ang + 0.35), y2 - s * math.sin(ang + 0.35))
    ], fill=color)
    
    if label and font:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if label_side == "top":
            draw.text((mx, my - 13), label, font=font, fill=color, anchor="mm")
        elif label_side == "bottom":
            draw.text((mx, my + 13), label, font=font, fill=color, anchor="mm")

def draw_actor_lifeline(draw, x, y_start, y_end, label):
    # Head
    draw.ellipse((x - 12, y_start - 45, x + 12, y_start - 21), outline=DARK_BLUE, width=2)
    # Body
    draw.line((x, y_start - 21, x, y_start + 10), fill=DARK_BLUE, width=2)
    # Arms
    draw.line((x - 18, y_start - 10, x + 18, y_start - 10), fill=DARK_BLUE, width=2)
    # Legs
    draw.line((x, y_start + 10, x - 12, y_start + 35), fill=DARK_BLUE, width=2)
    draw.line((x, y_start + 10, x + 12, y_start + 35), fill=DARK_BLUE, width=2)
    # Actor Label
    draw.text((x, y_start + 45), label, font=F_BOLD, fill=DARK_BLUE, anchor="ma")
    # Lifeline
    draw.line((x, y_start + 65, x, y_end), fill=GRAY, width=1)

def draw_system_lifeline(draw, x, y_start, y_end, label):
    w, h = 130, 45
    # Shadow
    draw.rectangle((x - w / 2 + 2, y_start + 2, x + w / 2 + 2, y_start + h + 2), fill=SHADOW_COLOR)
    # Box
    draw.rectangle((x - w / 2, y_start, x + w / 2, y_start + h), outline=BOX_BORDER, fill=BOX_BG, width=2)
    draw.text((x, y_start + h/2), label, font=F_BOLD, fill=DARK_BLUE, anchor="mm")
    # Lifeline
    draw.line((x, y_start + h, x, y_end), fill=GRAY, width=1)

def initial_node(draw, cx, cy):
    draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=DARK_BLUE)

def final_node(draw, cx, cy):
    draw.ellipse((cx - 13, cy - 13, cx + 13, cy + 13), outline=DARK_BLUE, width=2)
    draw.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=DARK_BLUE)

def rounded_box(draw, cx, cy, w, h, text, font=F_REG, border_color=DARK_BLUE, fill_color=BOX_BG):
    x1, y1 = cx - w/2, cy - h/2
    x2, y2 = cx + w/2, cy + h/2
    draw.rounded_rectangle((x1, y1, x2, y2), radius=10, outline=border_color, fill=fill_color, width=2)
    
    lines = text.split("\n")
    lh = font.getbbox("A")[3] - font.getbbox("A")[1] + 4
    ty = cy - (len(lines) * lh) / 2
    for line in lines:
        draw.text((cx, ty + lh/2), line, font=font, fill=DARK_BLUE, anchor="mm")
        ty += lh

def diamond(draw, cx, cy, w, h, label, font=F_BOLD, border_color=DEC_BORDER, fill_color=DEC_BG):
    pts = [(cx, cy - h/2), (cx + w/2, cy), (cx, cy + h/2), (cx - w/2, cy)]
    draw.polygon(pts, outline=border_color, fill=fill_color, width=2)
    draw.text((cx, cy), label, font=font, fill=DARK_BLUE, anchor="mm", align="center")

# 1. DSS Planifier une réunion
def generate_dss_planifier_reunion():
    img = Image.new("RGB", (700, 360), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    draw_actor_lifeline(draw, 180, 70, 310, "Administrateur")
    draw_system_lifeline(draw, 520, 45, 310, ":Système")
    
    draw_arrow(draw, 180, 160, 520, 160, "1. planifierRéunion(date, lieu, amende)", F_REG, DARK_BLUE, "top")
    draw_arrow(draw, 520, 240, 180, 240, "2. réunionPlanifiée", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    img.save("Docs/dss-planifier-reunion.png", "PNG")
    print("Saved Docs/dss-planifier-reunion.png")

# 2. DSS Saisir les présences
def generate_dss_saisir_presences():
    img = Image.new("RGB", (700, 360), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    draw_actor_lifeline(draw, 180, 70, 310, "Administrateur")
    draw_system_lifeline(draw, 520, 45, 310, ":Système")
    
    draw_arrow(draw, 180, 160, 520, 160, "1. saisirPrésences(idRéunion, listePrésences)", F_REG, DARK_BLUE, "top")
    draw_arrow(draw, 520, 240, 180, 240, "2. présencesEnregistrées / amendesCalculées", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    img.save("Docs/dss-saisir-presences.png", "PNG")
    print("Saved Docs/dss-saisir-presences.png")

# 3. Activité Planifier une réunion
def generate_activite_planifier_reunion():
    img = Image.new("RGB", (700, 510), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    initial_node(draw, 350, 40)
    draw_arrow(draw, 350, 50, 350, 90)
    
    rounded_box(draw, 350, 120, 280, 60, "Saisir les détails de la réunion\n(date, lieu, montant de l'amende)")
    draw_arrow(draw, 350, 150, 350, 200)
    
    diamond(draw, 350, 250, 180, 100, "Données valides ?")
    
    # No branch
    draw.line((260, 250, 130, 250), fill=DARK_BLUE, width=2)
    draw.text((195, 230), "Non", font=F_BOLD, fill=DARK_BLUE, anchor="ma")
    rounded_box(draw, 130, 170, 180, 50, "Afficher les erreurs de saisie", F_REG, DEC_BORDER, DEC_BG)
    draw_arrow(draw, 130, 250, 130, 195)
    draw.line((130, 145, 130, 120), fill=DARK_BLUE, width=2)
    draw_arrow(draw, 130, 120, 210, 120)
    
    # Yes branch
    draw_arrow(draw, 350, 300, 350, 360, "Oui", F_BOLD, DARK_BLUE, "bottom")
    
    rounded_box(draw, 350, 390, 280, 60, "Créer la réunion et envoyer\nles notifications aux membres", F_REG, GREEN_BORDER, GREEN_BG)
    draw_arrow(draw, 350, 420, 350, 465)
    
    final_node(draw, 350, 478)
    
    img.save("Docs/activite-planifier-reunion.png", "PNG")
    print("Saved Docs/activite-planifier-reunion.png")

# 4. Activité Saisir les présences
def generate_activite_saisir_presences():
    # Increased height to 640 to prevent cropped final node
    img = Image.new("RGB", (700, 640), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    initial_node(draw, 350, 40)
    draw_arrow(draw, 350, 50, 350, 90)
    
    # Box 1: Select reunion (height 60, spans 90 to 150)
    rounded_box(draw, 350, 120, 280, 60, "Sélectionner la réunion active\net ouvrir la feuille de présence")
    draw_arrow(draw, 350, 150, 350, 210)  # Corrected to end at 210 (top of Box 2)
    
    # Box 2: Fill attendance (height 60, spans 210 to 270)
    rounded_box(draw, 350, 240, 280, 60, "Cocher le statut de présence\nde chaque membre du groupe")
    draw_arrow(draw, 350, 270, 350, 320)  # Hits top of Diamond 1 (starts at 320)
    
    # Diamond 1: Calculate penalties (height 100, spans 320 to 420)
    diamond(draw, 350, 370, 180, 100, "Calculer amendes ?")
    
    # Yes branch: Generate fines
    # Arrow to top of Box 3 (starts at 480)
    draw_arrow(draw, 350, 420, 350, 480, "Oui", F_BOLD, DARK_BLUE, "bottom")
    
    # Box 3: Generate fines (height 60, spans 480 to 540)
    rounded_box(draw, 350, 510, 280, 60, "Générer les amendes d'absence\net enregistrer la feuille", F_REG, GREEN_BORDER, GREEN_BG)
    # Arrow to top of final node (starts at 565)
    draw_arrow(draw, 350, 540, 350, 565)
    final_node(draw, 350, 578)  # Center is 578, top is 565
    
    # No branch: Save without fines
    draw.line((260, 370, 130, 370), fill=DARK_BLUE, width=2)
    draw.text((195, 350), "Non", font=F_BOLD, fill=DARK_BLUE, anchor="ma")
    
    # Box 4: Save without fines (height 50, spans 395 to 445)
    rounded_box(draw, 130, 420, 180, 50, "Enregistrer la feuille\nsans générer d'amendes", F_REG, BOX_BORDER, BOX_BG)
    draw_arrow(draw, 130, 370, 130, 395)  # Vertical arrow pointing down to Box 4 top
    
    # Connect Box 4 bottom to Final Node
    draw.line((130, 445, 130, 578), fill=DARK_BLUE, width=2)
    draw_arrow(draw, 130, 578, 337, 578)  # Touches left side of final node (350 - 13)
    
    img.save("Docs/activite-saisir-presences.png", "PNG")
    print("Saved Docs/activite-saisir-presences.png")

if __name__ == "__main__":
    generate_dss_planifier_reunion()
    generate_dss_saisir_presences()
    generate_activite_planifier_reunion()
    generate_activite_saisir_presences()
