#!/usr/bin/env python3
import os
import math
from PIL import Image, ImageDraw, ImageFont

# Color System
DARK_BLUE = (0, 0, 0)
GRAY = (71, 85, 105)
LIGHT_GRAY = (148, 163, 184)
BG_COLOR = (255, 255, 255)
SHADOW_COLOR = (255, 255, 255)

# Shapes Colors
BOX_BORDER = (0, 0, 0)
BOX_BG = (255, 255, 255)
DEC_BORDER = (185, 28, 28)
DEC_BG = (254, 242, 242)
GREEN_BORDER = (4, 120, 87)
GREEN_BG = (236, 253, 245)

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
    draw.rectangle((x - w / 2 + 2, y_start + 2, x + w / 2 + 2, y_start + h + 2), fill=SHADOW_COLOR)
    draw.rectangle((x - w / 2, y_start, x + w / 2, y_start + h), outline=BOX_BORDER, fill=BOX_BG, width=2)
    draw.text((x, y_start + h/2), label, font=F_BOLD, fill=DARK_BLUE, anchor="mm")
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

# 1. DSS Initier un paiement
def generate_dss_initier_paiement():
    img = Image.new("RGB", (850, 420), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    draw_actor_lifeline(draw, 140, 70, 370, "Membre")
    draw_system_lifeline(draw, 425, 45, 370, ":Système")
    draw_system_lifeline(draw, 710, 45, 370, "API de paiement")
    
    # 1. Membre -> E-Tontine
    draw_arrow(draw, 140, 160, 425, 160, "1. initierPaiement(montant, numéro)", F_REG, DARK_BLUE, "top")
    
    # 2. E-Tontine -> API de paiement
    draw_arrow(draw, 425, 210, 710, 210, "2. requêteDébit(montant, numéro)", F_REG, DARK_BLUE, "top")
    
    # 3. API de paiement -> E-Tontine
    draw_arrow(draw, 710, 270, 425, 270, "3. notificationPaiement(succès/échec)", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    # 4. E-Tontine -> Membre
    draw_arrow(draw, 425, 320, 140, 320, "4. statutPaiement(confirmé)", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    img.save("Docs/dss-initier-paiement.png", "PNG")
    print("Saved Docs/dss-initier-paiement.png")

# 2. DSS Suivre une transaction
def generate_dss_suivre_transaction():
    img = Image.new("RGB", (700, 360), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    draw_actor_lifeline(draw, 180, 70, 310, "Membre")
    draw_system_lifeline(draw, 520, 45, 310, ":Système")
    
    draw_arrow(draw, 180, 160, 520, 160, "1. consulterStatut(idTransaction)", F_REG, DARK_BLUE, "top")
    draw_arrow(draw, 520, 240, 180, 240, "2. statutTransaction(validé/enCours)", F_REG, DARK_BLUE, "bottom", dashed=True)
    
    img.save("Docs/dss-suivre-transaction.png", "PNG")
    print("Saved Docs/dss-suivre-transaction.png")

# 3. Activité Initier un paiement
def generate_activite_initier_paiement():
    # Increased height to 720 to prevent cropped final node
    img = Image.new("RGB", (700, 720), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    initial_node(draw, 350, 40)
    draw_arrow(draw, 350, 50, 350, 90)
    
    # Box 1: Select transaction (height 60, spans 90 to 150)
    rounded_box(draw, 350, 120, 280, 60, "Sélectionner le type de transaction\net saisir son numéro de téléphone")
    draw_arrow(draw, 350, 150, 350, 200)
    
    # Diamond 1: Numéro valide (height 100, spans 200 to 300)
    diamond(draw, 350, 250, 180, 100, "Numéro valide ?")
    
    # No branch: Validation Error
    draw.line((260, 250, 130, 250), fill=DARK_BLUE, width=2)
    draw.text((195, 230), "Non", font=F_BOLD, fill=DARK_BLUE, anchor="ma")
    
    # Error box (height 50, centered at 170, spans 145 to 195)
    rounded_box(draw, 130, 170, 180, 50, "Afficher message d'erreur", F_REG, DEC_BORDER, DEC_BG)
    # Connect No branch down-to-up into Error Box bottom
    draw_arrow(draw, 130, 250, 130, 195)
    # Loop back from Error Box top to Box 1
    draw.line((130, 145, 130, 120), fill=DARK_BLUE, width=2)
    draw_arrow(draw, 130, 120, 210, 120)
    
    # Yes branch: Send Debit request
    # Arrow to top of Box 2 (which starts at 360)
    draw_arrow(draw, 350, 300, 350, 360, "Oui", F_BOLD, DARK_BLUE, "bottom")
    
    # Box 2: Send request (height 50, spans 360 to 410)
    rounded_box(draw, 350, 385, 280, 50, "Envoyer la requête de débit à l'opérateur")
    draw_arrow(draw, 350, 410, 350, 450)
    
    # Diamond 2: Payment validated (height 80, spans 450 to 530)
    diamond(draw, 350, 490, 180, 80, "Paiement validé\nsur le mobile ?")
    
    # Yes branch: Credit caisse
    # Arrow to top of Box 3 (starts at 580)
    draw_arrow(draw, 350, 530, 350, 580, "Oui", F_BOLD, DARK_BLUE, "bottom")
    
    # Box 3: Confirm payment (height 50, spans 580 to 630)
    rounded_box(draw, 350, 605, 280, 50, "Créditer la caisse et confirmer", F_REG, GREEN_BORDER, GREEN_BG)
    # Arrow to top of final node (which is at 650)
    draw_arrow(draw, 350, 630, 350, 650)
    final_node(draw, 350, 663)
    
    # No branch: Payment failure
    draw.line((260, 490, 130, 490), fill=DARK_BLUE, width=2)
    draw.text((195, 470), "Non", font=F_BOLD, fill=DARK_BLUE, anchor="ma")
    
    # Failure Box (height 50, spans 525 to 575)
    rounded_box(draw, 130, 550, 180, 50, "Afficher échec du paiement", F_REG, DEC_BORDER, DEC_BG)
    draw_arrow(draw, 130, 490, 130, 525)
    
    # Connect failure output to Final Node
    draw.line((130, 575, 130, 663), fill=DARK_BLUE, width=2)
    draw_arrow(draw, 130, 663, 335, 663)
    
    # Save
    img.save("Docs/activite-initier-paiement.png", "PNG")
    print("Saved Docs/activite-initier-paiement.png")

# 4. Activité Suivre une transaction
def generate_activite_suivre_transaction():
    img = Image.new("RGB", (700, 510), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    initial_node(draw, 350, 40)
    draw_arrow(draw, 350, 50, 350, 90)
    
    rounded_box(draw, 350, 120, 280, 60, "Accéder à l'historique personnel\ndes transactions")
    draw_arrow(draw, 350, 150, 350, 200)
    
    diamond(draw, 350, 250, 180, 100, "Transaction en attente ?")
    
    # No branch: Transaction not pending (already completed)
    draw.line((260, 250, 130, 250), fill=DARK_BLUE, width=2)
    draw.text((195, 230), "Non", font=F_BOLD, fill=DARK_BLUE, anchor="ma")
    
    rounded_box(draw, 130, 350, 180, 50, "Afficher le statut final", F_REG, BOX_BORDER, BOX_BG)
    draw_arrow(draw, 130, 250, 130, 325)  # Arrow pointing down to Box top (350 - 25)
    
    # Connect Box bottom (350 + 25 = 375) to Final Node (centered at 465)
    draw.line((130, 375, 130, 465), fill=DARK_BLUE, width=2)
    draw_arrow(draw, 130, 465, 337, 465)  # Touches left side of final node (350 - 13)
    
    # Yes branch
    draw_arrow(draw, 350, 300, 350, 360, "Oui", F_BOLD, DARK_BLUE, "bottom")
    
    rounded_box(draw, 350, 390, 280, 60, "Actualiser le statut auprès de l'opérateur\net mettre à jour le journal local", F_REG, GREEN_BORDER, GREEN_BG)
    draw_arrow(draw, 350, 420, 350, 452)  # Touches top of final node (465 - 13)
    
    final_node(draw, 350, 465)
    
    img.save("Docs/activite-suivre-transaction.png", "PNG")
    print("Saved Docs/activite-suivre-transaction.png")

if __name__ == "__main__":
    generate_dss_initier_paiement()
    generate_dss_suivre_transaction()
    generate_activite_initier_paiement()
    generate_activite_suivre_transaction()
