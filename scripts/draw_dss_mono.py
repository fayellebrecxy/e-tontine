#!/usr/bin/env python3
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Path configuration
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "Docs" / "DSS"

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font_bold_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

if os.path.exists(font_path):
    F_BOLD = ImageFont.truetype(font_bold_path, 11)
    F_REG = ImageFont.truetype(font_path, 11)
    F_TITLE = ImageFont.truetype(font_bold_path, 12)
else:
    F_BOLD = ImageFont.load_default()
    F_REG = ImageFont.load_default()
    F_TITLE = ImageFont.load_default()

def draw_dashed_vline(draw, x, y_start, y_end, step=6, fill=BLACK):
    y = y_start
    draw_segment = True
    while y < y_end:
        nxt = min(y + step, y_end)
        if draw_segment:
            draw.line((x, y, x, nxt), fill=fill, width=1)
        y = nxt
        draw_segment = not draw_segment

def draw_dashed_hline(draw, x_start, x_end, y, step=6, fill=BLACK):
    x = min(x_start, x_end)
    x_max = max(x_start, x_end)
    draw_segment = True
    while x < x_max:
        nxt = min(x + step, x_max)
        if draw_segment:
            draw.line((x, y, nxt, y), fill=fill, width=1)
        x = nxt
        draw_segment = not draw_segment

def draw_dss(filename, title, actor_label, call_msg, return_msg):
    # Diagram Dimensions
    width, height = 600, 280
    img = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(img)
    
    # Coordinate system
    BOX_W = 140
    BOX_H = 35
    ACTOR_X = 150
    SYSTEM_X = 450
    HEADER_Y = 20
    LIFELINE_END_Y = 230
    
    # 1. Draw Participant Header (Stick figure for Actor, Box for System)
    # Actor (Stick figure / Bonhomme en allumette)
    # Head (Perfect circle)
    draw.ellipse((ACTOR_X - 8, 8, ACTOR_X + 8, 24), outline=BLACK, fill=WHITE, width=1)
    # Body
    draw.line((ACTOR_X, 24, ACTOR_X, 42), fill=BLACK, width=1)
    # Arms
    draw.line((ACTOR_X - 12, 32, ACTOR_X + 12, 32), fill=BLACK, width=1)
    # Legs
    draw.line((ACTOR_X, 42, ACTOR_X - 10, 58), fill=BLACK, width=1)
    draw.line((ACTOR_X, 42, ACTOR_X + 10, 58), fill=BLACK, width=1)
    # Actor Label
    draw.text((ACTOR_X, 61), actor_label, font=F_BOLD, fill=BLACK, anchor="ma")
    
    # System Box
    draw.rectangle(
        (SYSTEM_X - BOX_W//2, HEADER_Y, SYSTEM_X + BOX_W//2, HEADER_Y + BOX_H),
        outline=BLACK, fill=WHITE, width=1
    )
    draw.text((SYSTEM_X, HEADER_Y + BOX_H//2), ":Système", font=F_BOLD, fill=BLACK, anchor="mm")
    
    # 2. Draw Dashed Lifelines
    draw_dashed_vline(draw, ACTOR_X, 78, LIFELINE_END_Y)
    draw_dashed_vline(draw, SYSTEM_X, HEADER_Y + BOX_H, LIFELINE_END_Y)
    
    # 3. Draw Activation Bars
    ACT_W = 10
    actor_act_top = 80
    actor_act_bottom = 205
    system_act_top = 90
    system_act_bottom = 195
    
    # Actor activation bar
    draw.rectangle(
        (ACTOR_X - ACT_W//2, actor_act_top, ACTOR_X + ACT_W//2, actor_act_bottom),
        outline=BLACK, fill=WHITE, width=1
    )
    # System activation bar
    draw.rectangle(
        (SYSTEM_X - ACT_W//2, system_act_top, SYSTEM_X + ACT_W//2, system_act_bottom),
        outline=BLACK, fill=WHITE, width=1
    )
    
    # 4. Message Coordinates
    call_y = 110
    return_y = 175
    
    # Right edge of actor act bar, Left edge of system act bar
    call_start_x = ACTOR_X + ACT_W//2
    call_end_x = SYSTEM_X - ACT_W//2
    
    # 5. Draw Call Message (Solid Line + Filled Arrow)
    draw.line((call_start_x, call_y, call_end_x, call_y), fill=BLACK, width=1)
    # Filled arrowhead pointing right
    arr_size = 6
    draw.polygon(
        [(call_end_x, call_y), (call_end_x - arr_size, call_y - 3), (call_end_x - arr_size, call_y + 3)],
        fill=BLACK
    )
    # Call Label
    draw.text(((call_start_x + call_end_x)//2, call_y - 12), call_msg, font=F_REG, fill=BLACK, anchor="mm")
    
    # 6. Draw Return Message (Dashed Line + Open Arrow)
    return_start_x = SYSTEM_X - ACT_W//2
    return_end_x = ACTOR_X + ACT_W//2
    
    draw_dashed_hline(draw, return_start_x, return_end_x, return_y)
    # Open arrowhead pointing left
    draw.line((return_end_x, return_y, return_end_x + arr_size, return_y - 4), fill=BLACK, width=1)
    draw.line((return_end_x, return_y, return_end_x + arr_size, return_y + 4), fill=BLACK, width=1)
    # Return Label
    draw.text(((return_start_x + return_end_x)//2, return_y - 12), return_msg, font=F_REG, fill=BLACK, anchor="mm")
    
    # 7. Draw Title at the Bottom
    draw.text((width//2, height - 25), title, font=F_TITLE, fill=BLACK, anchor="mm")
    
    # Create output dir if needed
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save Image
    output_path = OUT_DIR / filename
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

def main():
    diagrams = [
        {
            "filename": "dss-creer-cycle.png",
            "title": "Figure: DSS - Créer un cycle",
            "actor": "Administrateur",
            "call": "1. créerCycle(montant, tours, participants)",
            "return": "2. cycleCréé"
        },
        {
            "filename": "dss-planifier-reunion.png",
            "title": "Figure: DSS - Planifier une réunion",
            "actor": "Administrateur",
            "call": "1. planifierRéunion(date, lieu, amende)",
            "return": "2. réunionPlanifiée"
        },
        {
            "filename": "dss-ouvrir-compte.png",
            "title": "Figure: DSS - Ouvrir un compte épargne",
            "actor": "Membre",
            "call": "1. ouvrirCompteÉpargne(idMembre)",
            "return": "2. compteÉpargneOuvert"
        },
        {
            "filename": "dss-demander-pret.png",
            "title": "Figure: DSS - Demander un prêt",
            "actor": "Membre",
            "call": "1. demanderPrêt(montant, durée, avalistes)",
            "return": "2. demandeEnregistrée / refusÉligibilité"
        },
        {
            "filename": "dss-consulter-journal.png",
            "title": "Figure: DSS - Consulter le journal financier",
            "actor": "Membre",
            "call": "1. consulterJournal(idGroupe, filtres)",
            "return": "2. mouvementsJournaliers"
        }
    ]
    
    for diag in diagrams:
        draw_dss(
            diag["filename"],
            diag["title"],
            diag["actor"],
            diag["call"],
            diag["return"]
        )

if __name__ == "__main__":
    main()
