#!/usr/bin/env python3
"""
Diagramme de déploiement — E-Tontine.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "Docs" / "cahier-implementation-diagrammes"
PNG_PATH = OUT_DIR / "diagramme-deploiement-e-tontine.png"

BLACK = (15, 15, 15)
GRAY = (90, 90, 90)
WHITE = (255, 255, 255)
FILL = (248, 250, 252)
ACCENT = (238, 246, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

W, H = 1600, 1000
TITLE_BOTTOM = 56


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def _box(d, x, y, w, h, lines, fill=WHITE, bold_first=True):
    d.rounded_rectangle((x, y, x + w, y + h), radius=10, outline=BLACK, fill=fill, width=2)
    f = _font(22, bold_first)
    f2 = _font(18)
    ty = y + 28
    for i, line in enumerate(lines):
        d.text((x + w / 2, ty), line, font=f if i == 0 else f2, fill=BLACK, anchor="ma")
        ty += 30 if i == 0 else 26


def _arrow(d, x1, y1, x2, y2, label=None):
    d.line((x1, y1, x2, y2), fill=BLACK, width=2)
    import math

    ang = math.atan2(y2 - y1, x2 - x1)
    s = 12
    d.polygon(
        [
            (x2, y2),
            (x2 - s * math.cos(ang - 0.4), y2 - s * math.sin(ang - 0.4)),
            (x2 - s * math.cos(ang + 0.4), y2 - s * math.sin(ang + 0.4)),
        ],
        fill=BLACK,
    )
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - 18
        d.text((mx, my), label, font=_font(16, True), fill=GRAY, anchor="ma")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # Nœuds
    _box(d, 60, 380, 260, 120, ["Poste utilisateur", "Navigateur web"])
    _box(d, 420, 280, 360, 320, ["Vercel", "Application Next.js 15", "Pages + API Routes", "Server Actions"], fill=ACCENT)
    _box(d, 900, 140, 300, 110, ["Supabase Auth", "Sessions JWT / cookies"], fill=FILL)
    _box(d, 900, 340, 300, 110, ["PostgreSQL", "Base métier (Supabase)"], fill=FILL)
    _box(d, 900, 540, 300, 110, ["Opérateurs", "Mobile Money"], fill=FILL)
    _box(d, 420, 680, 360, 100, ["GitHub", "Dépôt source + CI/CD"], fill=FILL)
    _box(d, 900, 740, 300, 110, ["SMTP", "Notifications e-mail"], fill=FILL)

    # Flux
    _arrow(d, 320, 440, 420, 440, "HTTPS")
    _arrow(d, 780, 360, 900, 195, "Auth SSR")
    _arrow(d, 780, 460, 900, 395, "Prisma ORM")
    _arrow(d, 780, 520, 900, 595, "API paiement")
    _arrow(d, 600, 680, 600, 600, "Déploiement")
    _arrow(d, 780, 795, 900, 795, "E-mails")
    _arrow(d, 320, 480, 420, 520, "")

    d.text(
        (W // 2, H - TITLE_BOTTOM // 2 + 6),
        "Diagramme de déploiement — E-Tontine",
        font=_font(28, True),
        fill=BLACK,
        anchor="ma",
    )

    img.save(PNG_PATH, quality=95)
    print(f"Diagramme généré : {PNG_PATH}")


if __name__ == "__main__":
    main()
