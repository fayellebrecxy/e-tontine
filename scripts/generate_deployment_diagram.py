#!/usr/bin/env python3
"""
Diagramme de déploiement E-Tontine — style mémoire de référence (UML 3 tiers).
Adapté depuis le document de référence, avec liaisons segmentées et flèches bilatérales.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT1 = ROOT / "Docs" / "diagramme-deploiement-e-tontine.png"
OUT2 = ROOT / "Docs" / "diagramme-deploiement.png"

BLACK = (20, 20, 20)
NODE = (186, 210, 235)
NODE_TOP = (210, 228, 245)
NODE_SIDE = (155, 180, 210)
COMP = (198, 232, 198)
COMP_BORDER = (70, 130, 70)
WHITE = (255, 255, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

W, H = 1400, 900
DEPTH = 28


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def _underline_text(d, xy, text, font, fill=BLACK, anchor="mm"):
    d.text(xy, text, font=font, fill=fill, anchor=anchor)
    if anchor == "mm":
        x, y = xy
        bbox = d.textbbox((x, y), text, font=font, anchor=anchor)
        d.line((bbox[0], bbox[3] + 2, bbox[2], bbox[3] + 2), fill=fill, width=2)


def _node_3d(d, x, y, w, h, title: str | None = None):
    """Bloc 3D bleu (nœud de déploiement UML)."""
    # face avant
    d.polygon(
        [(x, y + DEPTH), (x + w, y + DEPTH), (x + w, y + h + DEPTH), (x, y + h + DEPTH)],
        fill=NODE,
        outline=BLACK,
    )
    # face supérieure
    d.polygon(
        [(x, y + DEPTH), (x + DEPTH, y), (x + w + DEPTH, y), (x + w, y + DEPTH)],
        fill=NODE_TOP,
        outline=BLACK,
    )
    # face latérale
    d.polygon(
        [(x + w, y + DEPTH), (x + w + DEPTH, y), (x + w + DEPTH, y + h), (x + w, y + h + DEPTH)],
        fill=NODE_SIDE,
        outline=BLACK,
    )
    if title:
        _underline_text(d, (x + w / 2, y + DEPTH - 8), title, _font(22, True), anchor="mm")


def _component(d, box, label: str, tech: str = None):
    x1, y1, x2, y2 = box
    d.rounded_rectangle(box, radius=18, fill=COMP, outline=COMP_BORDER, width=3)
    
    box_w = x2 - x1
    
    # Auto-scale label font size to fit box width
    label_size = 20
    label_font = _font(label_size, True)
    while label_size > 12:
        l_w = d.textbbox((0, 0), label, font=label_font)[2]
        if l_w < box_w - 16:
            break
        label_size -= 1
        label_font = _font(label_size, True)
        
    if tech:
        # Auto-scale tech font size to fit box width
        tech_size = 16
        tech_font = _font(tech_size, False)
        while tech_size > 10:
            t_w = d.textbbox((0, 0), tech, font=tech_font)[2]
            if t_w < box_w - 16:
                break
            tech_size -= 1
            tech_font = _font(tech_size, False)
            
        _underline_text(d, ((x1 + x2) / 2, y1 + 30), label, label_font)
        d.text(((x1 + x2) / 2, y1 + 65), tech, font=tech_font, fill=BLACK, anchor="mm")
    else:
        _underline_text(d, ((x1 + x2) / 2, (y1 + y2) / 2), label, label_font)


def _arrow_head(d, tip, direction, size=15, angle=0.4):
    import math
    xt, yt = tip
    dx, dy = direction
    length = math.sqrt(dx*dx + dy*dy)
    if length == 0:
        return
    ux = -dx / length
    uy = -dy / length
    
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    
    p1 = (xt + size * (ux * cos_a - uy * sin_a), yt + size * (ux * sin_a + uy * cos_a))
    p2 = (xt + size * (ux * cos_a + uy * sin_a), yt + size * (ux * -sin_a + uy * cos_a))
    
    d.polygon([tip, p1, p2], fill=BLACK, outline=BLACK)


def _double_link_segments(d, points, label, label_pos):
    # Dessiner les segments de la ligne
    for i in range(len(points) - 1):
        d.line((points[i], points[i+1]), fill=BLACK, width=3)
    
    # Flèche au départ (pointant vers points[0])
    dir_start = (points[0][0] - points[1][0], points[0][1] - points[1][1])
    _arrow_head(d, points[0], dir_start)
    
    # Flèche à la fin (pointant vers points[-1])
    dir_end = (points[-1][0] - points[-2][0], points[-1][1] - points[-2][1])
    _arrow_head(d, points[-1], dir_end)
    
    # Affichage du protocole
    d.text(label_pos, label, font=_font(18, True), fill=BLACK, anchor="mm")


def main():
    OUT1.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # Cadre extérieur (rectangle)
    d.rectangle((20, 20, W - 20, H - 20), outline=BLACK, width=3)

    # ── Nœud client (haut-gauche) ──
    _node_3d(d, 80, 80, 360, 200, "Client / Navigateur")
    _component(d, (110, 140, 410, 240), "Interface web", "React / Tailwind / HTML5")

    # ── Serveur Web (centre) ──
    _node_3d(d, 480, 260, 460, 290, "Serveur d'Application (Web)")
    _component(d, (510, 350, 710, 470), "Service", "Prisma ORM")
    _component(d, (730, 350, 930, 470), "Contrôleur / API", "Node.js / Express.js")
    
    # Liaison interne entre vue et Controleur
    d.line((730, 410, 710, 410), fill=BLACK, width=2)
    d.polygon([(710, 410), (725, 400), (725, 420)], fill=BLACK)

    # ── Serveur BDD (bas-droite) ──
    # Décalé de 50px vers la droite (x=970) et 60px vers le bas (y=580)
    _node_3d(d, 980, 580, 360, 220, "Serveur de Base de Données")
    _component(d, (1010, 650, 1310, 760), "Base de données", "PostgreSQL / Supabase")

    # ── Liaisons bilatérales avec protocoles ──
    # 1. client <-> Serveur Web (HTTP / HTTPS)
    _double_link_segments(
        d,
        [(200, 280), (200, 400), (480, 400)],
        "HTTP / HTTPS",
        (340, 375)
    )

    # 2. Serveur Web <-> Serveur BDD (TCP/IP / SQL / Prisma)
    # Liaisons ajustées avec le nouveau décalage
    _double_link_segments(
        d,
        [(940, 400), (1160, 400), (1160, 580)],
        "TCP / IP (SQL / Prisma)",
        (1050, 375)
    )

    img.save(OUT1, quality=95)
    img.save(OUT2, quality=95)
    print(f"Diagramme généré : {OUT1}")
    print(f"Diagramme généré : {OUT2}")


if __name__ == "__main__":
    main()
