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

# 1. DSS Consulter le solde des caisses
def generate_dss_consulter_caisses():
    img = Image.new("RGB", (700, 360), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    draw_actor_lifeline(draw, 180, 70, 310, "Membre")
    draw_system_lifeline(draw, 520, 45, 310, ":Système")
    
    draw_arrow(draw, 180, 160, 520, 160, "1. consulterCaisses(idGroupe)", F_REG, DARK_BLUE, "top")
    draw_arrow(draw, 520, 240, 180, 240, "2. listeCaissesEtSoldes", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    img.save("Docs/dss-consulter-caisses.png", "PNG")
    print("Saved Docs/dss-consulter-caisses.png")

# 2. DSS Consulter le journal financier
def generate_dss_consulter_journal():
    img = Image.new("RGB", (700, 360), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    draw_actor_lifeline(draw, 180, 70, 310, "Membre")
    draw_system_lifeline(draw, 520, 45, 310, ":Système")
    
    draw_arrow(draw, 180, 160, 520, 160, "1. consulterJournal(idGroupe, filtres)", F_REG, DARK_BLUE, "top")
    draw_arrow(draw, 520, 240, 180, 240, "2. mouvementsJournaliers", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    img.save("Docs/dss-consulter-journal.png", "PNG")
    print("Saved Docs/dss-consulter-journal.png")

# 3. Activité Consulter le solde des caisses
def generate_activite_consulter_caisses():
    img = Image.new("RGB", (700, 440), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    initial_node(draw, 350, 40)
    draw_arrow(draw, 350, 50, 350, 90)
    
    rounded_box(draw, 350, 120, 280, 60, "Accéder au module financier\net sélectionner le détail des caisses")
    draw_arrow(draw, 350, 150, 350, 210)
    
    rounded_box(draw, 350, 240, 280, 60, "Calculer les soldes en direct\n(amendes, secours, épargne, cycles)")
    draw_arrow(draw, 350, 270, 350, 330)
    
    rounded_box(draw, 350, 360, 280, 60, "Présenter l'état financier global\ndes caisses sur le tableau de bord", F_REG, GREEN_BORDER, GREEN_BG)
    draw_arrow(draw, 350, 390, 350, 410)
    
    final_node(draw, 350, 420)
    
    img.save("Docs/activite-consulter-caisses.png", "PNG")
    print("Saved Docs/activite-consulter-caisses.png")

# 4. Activité Consulter le journal financier
def generate_activite_consulter_journal():
    img = Image.new("RGB", (700, 440), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    initial_node(draw, 350, 40)
    draw_arrow(draw, 350, 50, 350, 90)
    
    rounded_box(draw, 350, 120, 280, 60, "Sélectionner le journal financier\net choisir les filtres de recherche")
    draw_arrow(draw, 350, 150, 350, 210)
    
    rounded_box(draw, 350, 240, 280, 60, "Appliquer les filtres saisis\net récupérer l'historique des flux")
    draw_arrow(draw, 350, 270, 350, 330)
    
    rounded_box(draw, 350, 360, 280, 60, "Afficher la liste chronologique\ndes mouvements financiers du groupe", F_REG, GREEN_BORDER, GREEN_BG)
    draw_arrow(draw, 350, 390, 350, 410)
    
    final_node(draw, 350, 420)
    
    img.save("Docs/activite-consulter-journal.png", "PNG")
    print("Saved Docs/activite-consulter-journal.png")

if __name__ == "__main__":
    generate_dss_consulter_caisses()
    generate_dss_consulter_journal()
    generate_activite_consulter_caisses()
    generate_activite_consulter_journal()
