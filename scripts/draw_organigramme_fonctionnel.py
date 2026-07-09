import os
from PIL import Image, ImageDraw, ImageFont

def draw_functional_organigram():
    # Target directory
    os.makedirs("Docs", exist_ok=True)
    
    # Image size and background
    img_w, img_h = 1400, 920
    bg_color = (248, 250, 252) # Slate 50
    img = Image.new("RGB", (img_w, img_h), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Colors
    color_line = (148, 163, 184) # Slate 400
    color_root_bg = (15, 23, 42) # Slate 900
    color_shadow = (226, 232, 240) # Slate 200
    
    # Categories (Level 1) Backgrounds
    colors_level1 = [
        (30, 41, 59),   # Slate 800
        (6, 95, 70),    # Emerald 800
        (17, 94, 89),   # Teal 800
        (55, 48, 163)   # Indigo 800
    ]
    
    # Sub-modules (Level 2) Borders
    colors_level2_border = [
        (203, 213, 225), # Slate 300
        (167, 243, 208), # Emerald 200
        (153, 246, 228), # Teal 200
        (199, 210, 254)  # Indigo 200
    ]
    
    # Fonts
    font_path_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_path_regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    
    # Font sizes
    font_root_title = ImageFont.truetype(font_path_bold, 18)
    font_root_sub = ImageFont.truetype(font_path_regular, 13)
    
    font_cat_title = ImageFont.truetype(font_path_bold, 12)
    font_cat_sub = ImageFont.truetype(font_path_regular, 10)
    
    font_sub_title = ImageFont.truetype(font_path_bold, 11)
    font_sub_text = ImageFont.truetype(font_path_regular, 9)
    
    def draw_shadow_box(bounds, fill, outline=None, width=1, radius=8):
        x1, y1, x2, y2 = bounds
        offset = 4
        # Shadow
        draw.rounded_rectangle(
            (x1 + offset, y1 + offset, x2 + offset, y2 + offset),
            radius=radius,
            fill=color_shadow
        )
        # Box
        draw.rounded_rectangle(
            bounds,
            radius=radius,
            fill=fill,
            outline=outline,
            width=width
        )

    # 1. Draw connection lines
    # From Root bottom (700, 110) to horizontal bus (700, 140)
    draw.line([(700, 110), (700, 140)], fill=color_line, width=3)
    
    # Horizontal bus
    draw.line([(200, 140), (1200, 140)], fill=color_line, width=3)
    
    # Drops to Level 1 Categories
    centers_x = [200, 533, 866, 1200]
    for cx in centers_x:
        draw.line([(cx, 140), (cx, 170)], fill=color_line, width=3)
        
    # Vertical line down each column connecting the boxes
    for cx in centers_x:
        # From category bottom (230) to the bottom of the column (780)
        draw.line([(cx, 230), (cx, 780)], fill=color_line, width=2)
        
    # 2. Draw Root Node (E-Tontine Platform)
    draw_shadow_box((480, 30, 920, 110), color_root_bg, radius=10)
    draw.text((700, 52), "PLATEFORME E-TONTINE", fill=(255, 255, 255), font=font_root_title, anchor="mm")
    draw.text((700, 82), "Système de Gestion de Tontines Communautaires & Finances", fill=(203, 213, 225), font=font_root_sub, anchor="mm")
    
    # 3. Draw Level 1 Categories
    categories = [
        {"title": "ACCÈS & PROFILS", "sub": "Sécurité, Identité & Groupes"},
        {"title": "TONTINE & ÉPARGNE", "sub": "Cycles, Cotisations & Épargne"},
        {"title": "GOUVERNANCE & OPÉRATIONS", "sub": "Réunions, Présences & Rubriques"},
        {"title": "CRÉDIT & COMPTABILITÉ", "sub": "Prêts, Avalistes & Journal Financier"}
    ]
    
    for i, cat in enumerate(categories):
        cx = centers_x[i]
        bg = colors_level1[i]
        draw_shadow_box((cx - 150, 170, cx + 150, 230), bg, radius=6)
        draw.text((cx, 190), cat["title"], fill=(255, 255, 255), font=font_cat_title, anchor="mm")
        draw.text((cx, 212), cat["sub"], fill=(229, 231, 235), font=font_cat_sub, anchor="mm")
        
    # 4. Draw Level 2 Sub-modules
    # Define the 4 boxes for each of the 4 columns
    sub_modules = [
        # Column 1: Accès & Profils
        [
            {
                "title": "1.1 Authentification",
                "lines": [
                    "• Inscription & connexion sécurisée",
                    "• Cookies HTTP-only sécurisés (SSR)",
                    "• Sessions gérées par Supabase Auth"
                ]
            },
            {
                "title": "1.2 Profils & Identités",
                "lines": [
                    "• Données personnelles (Nom, Tél...)",
                    "• Téléchargement de photo de profil",
                    "• Journalisation des activités"
                ]
            },
            {
                "title": "1.3 Gestion des Groupes",
                "lines": [
                    "• Création et configuration",
                    "• Gestion des devises (XAF par déf.)",
                    "• Paramétrage des règles de groupe"
                ]
            },
            {
                "title": "1.4 Invitations & Rôles",
                "lines": [
                    "• Codes d'invitation à durée limitée",
                    "• Liens de partage uniques",
                    "• Rôles de gestion : ADMIN / MEMBRE"
                ]
            }
        ],
        # Column 2: Tontine & Épargne
        [
            {
                "title": "2.1 Cycles de Cotisation",
                "lines": [
                    "• Planification de tontine rotative",
                    "• Définition de l'ordre de passage",
                    "• Gestion des tours et dates de gain"
                ]
            },
            {
                "title": "2.2 Suivi des Cotisations",
                "lines": [
                    "• Enregistrement des apports par tour",
                    "• Versement automatisé de la cagnotte",
                    "• Statut des paiements en temps réel"
                ]
            },
            {
                "title": "2.3 Retards & Pénalités",
                "lines": [
                    "• Détection des échéances dépassées",
                    "• Taux de pénalité (Fixe/Pct/Prog)",
                    "• Statut visuel de discipline (Vert/Rge)"
                ]
            },
            {
                "title": "2.4 Épargne Individuelle",
                "lines": [
                    "• Compte d'épargne par membre",
                    "• Enregistrement des dépôts/retraits",
                    "• Signalements de litiges sur mouvements"
                ]
            }
        ],
        # Column 3: Gouvernance & Opérations
        [
            {
                "title": "3.1 Réunions Périodiques",
                "lines": [
                    "• Planification (Date, lieu, type)",
                    "• Ordinaire, extraordinaire ou urgence",
                    "• Rédaction des comptes-rendus"
                ]
            },
            {
                "title": "3.2 Suivi des Présences",
                "lines": [
                    "• Émargement numérique par réunion",
                    "• Statuts : Présent, Absent, En retard",
                    "• Gestion des demandes d'excuse"
                ]
            },
            {
                "title": "3.3 Amendes & Discipline",
                "lines": [
                    "• Amendes d'absence ou de retard",
                    "• Retrait sur épargne pour paiement",
                    "• Suivi des paiements d'amendes"
                ]
            },
            {
                "title": "3.4 Rubriques de Cotisation",
                "lines": [
                    "• Caisses spéciales (Secours, Fêtes...)",
                    "• Cotisations ponctuelles/récurrentes",
                    "• Suivi des versements & décaissements"
                ]
            }
        ],
        # Column 4: Crédit & Comptabilité
        [
            {
                "title": "4.1 Demandes de Prêts",
                "lines": [
                    "• Formulaires de crédit interne",
                    "• Calcul d'intérêts mensuels",
                    "• Validation administrative du prêt"
                ]
            },
            {
                "title": "4.2 Cautionnement / Avalistes",
                "lines": [
                    "• Engagement financier de garants",
                    "• Contrat type avec signature nominale",
                    "• Blocage de l'épargne en garantie"
                ]
            },
            {
                "title": "4.3 Journal Comptable",
                "lines": [
                    "• Centralisation des mouvements d'argent",
                    "• Traçabilité stricte (Solde avant/après)",
                    "• Double entrée (Entrée, Sortie, Correct.)"
                ]
            },
            {
                "title": "4.4 Caisses & Rapports",
                "lines": [
                    "• Caisses typées (Banque, Épargne...)",
                    "• Simulation Mobile Money (MTN/Orange)",
                    "• Export des rapports (PDF & Excel)"
                ]
            }
        ]
    ]
    
    # Loop over columns
    y_starts = [260, 400, 540, 680] # Y start for each of the 4 rows of boxes
    box_w, box_h = 280, 110
    
    for col_idx in range(4):
        cx = centers_x[col_idx]
        border_color = colors_level2_border[col_idx]
        
        for row_idx in range(4):
            y_start = y_starts[row_idx]
            mod = sub_modules[col_idx][row_idx]
            
            # Bounds for the box
            bounds = (cx - box_w//2, y_start, cx + box_w//2, y_start + box_h)
            draw_shadow_box(bounds, (255, 255, 255), outline=border_color, width=2, radius=8)
            
            # Title
            draw.text((cx - box_w//2 + 15, y_start + 12), mod["title"], fill=(15, 23, 42), font=font_sub_title)
            
            # Content lines
            y_text = y_start + 35
            for line in mod["lines"]:
                draw.text((cx - box_w//2 + 15, y_text), line, fill=(71, 85, 105), font=font_sub_text)
                y_text += 18
                
    # Save image
    img.save("Docs/organigramme_fonctionnel.png")
    print("Functional organigram successfully drawn and saved in Docs/organigramme_fonctionnel.png")

if __name__ == "__main__":
    draw_functional_organigram()
