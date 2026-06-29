#!/usr/bin/env python3
"""
Diagrammes de séquence système (SSD) — E-Tontine.

Un diagramme par module métier (10 modules).
Règle SSD : un acteur ↔ :E-Tontine (boîte noire).

Acteurs (diagramme UC global) :
  - Utilisateur non authentifié : auth plateforme (hors groupe)
  - Administrateur de groupe ⊂ Membre : module Groupes (écriture admin)
  - Membre : modules groupe où admin et membre interagissent
    (l'admin hérite du membre — UML generalization)
"""
from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "diagramme de sequence systeme"

BLACK = (0, 0, 0)
GRAY = (100, 100, 100)
WHITE = (255, 255, 255)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

MSG_GAP = 88
TOP = 100
ACTOR_X = 220
SYSTEM_X = 980
WIDTH = 1180
TITLE_BOTTOM = 56

# Acteur par module — aligné UC global + routes API (role ADMIN / MEMBRE)
MODULES = [
    {
        "file": "ssd-authentification",
        "title": "Authentification",
        # Hors rôle groupe : visiteur / utilisateur plateforme (UC global GUEST_LINKS)
        "actor": "Utilisateur\nnon authentifié",
        "messages": [
            (0, 1, "s'inscrire(infosProfil)"),
            (1, 0, "compteCréé / erreurValidation"),
            (0, 1, "seConnecter(email, motDePasse)"),
            (1, 0, "sessionÉtablie / erreurAuth"),
            (0, 1, "réinitialiserMotDePasse(email)"),
            (1, 0, "lienRéinitialisationEnvoyé"),
            (0, 1, "modifierProfil(données)"),
            (1, 0, "profilMisÀJour"),
        ],
    },
    {
        "file": "ssd-groupes",
        "title": "Groupes",
        # Seul acteur lié à « Créer un groupe » ; écriture réservée ADMIN (API groups)
        "actor": "Administrateur\nde groupe",
        "messages": [
            (0, 1, "créerGroupe(nom, description, devise)"),
            (1, 0, "groupeCréé — créateur ADMIN"),
            (0, 1, "configurerGroupe(paramètres)"),
            (1, 0, "groupeMisÀJour"),
            (0, 1, "supprimerGroupe(idGroupe)"),
            (1, 0, "groupeSupprimé / refus"),
        ],
    },
    {
        "file": "ssd-membres",
        "title": "Membres",
        # Membre : adhésion + gestion (admin ⊂ membre, UC « Gérer les membres »)
        "actor": "Membre",
        "messages": [
            (0, 1, "rejoindreGroupe(codeInvitation)"),
            (1, 0, "adhésionConfirmée / enAttenteValidation"),
            (0, 1, "consulterMembres(idGroupe)"),
            (1, 0, "listeMembresEtStatuts"),
            (0, 1, "générerInvitation(idGroupe)"),
            (1, 0, "codeInvitation"),
            (0, 1, "promouvoirMembre(idMembre, rôle)"),
            (1, 0, "rôleMisÀJour"),
            (0, 1, "exclureMembre(idMembre)"),
            (1, 0, "statutINACTIF"),
            (0, 1, "validerRéintégration(idMembre)"),
            (1, 0, "statutACTIF"),
        ],
    },
    {
        "file": "ssd-cycles",
        "title": "Cycles",
        # Membre : cotiser, consulter, échanger ; admin hérite pour créer / verser / valider
        "actor": "Membre",
        "messages": [
            (0, 1, "consulterCycle(idCycle)"),
            (1, 0, "détailCycleEtTours"),
            (0, 1, "payerCotisation(idCycle, montant)"),
            (1, 0, "cotisationEnregistrée"),
            (1, 0, "pénalitésCalculées (automatique)"),
            (0, 1, "demanderÉchange(idCycle, membreCible)"),
            (1, 0, "échangeEnAttenteValidation"),
            (0, 1, "créerCycle(montant, tours, participants)"),
            (1, 0, "cycleCréé"),
            (0, 1, "verserPot(idCycle, idTour)"),
            (1, 0, "distributionEnregistrée"),
            (0, 1, "validerÉchange(idDemande)"),
            (1, 0, "ordreBeneficiairesMisÀJour"),
        ],
    },
    {
        "file": "ssd-rubriques",
        "title": "Rubriques",
        "actor": "Membre",
        "messages": [
            (0, 1, "consulterRubriques(idGroupe)"),
            (1, 0, "rubriquesEtSoldes"),
            (0, 1, "payerRubrique(idRubrique, montant)"),
            (1, 0, "paiementRubriqueEnregistré"),
            (0, 1, "créerRubrique(montant, fréquence, membres)"),
            (1, 0, "rubriqueCréée"),
            (0, 1, "effectuerRetraitRubrique(montant, motif)"),
            (1, 0, "retraitEnregistré"),
            (0, 1, "verserAuPotCommun(idRubrique, montant)"),
            (1, 0, "caisseRubriqueMiseÀJour"),
        ],
    },
    {
        "file": "ssd-reunions",
        "title": "Réunions",
        "actor": "Membre",
        "messages": [
            (0, 1, "consulterRéunions(idGroupe)"),
            (1, 0, "listeRéunionsEtPrésences"),
            (0, 1, "signalerAbsence(idRéunion)"),
            (1, 0, "absenceEnregistrée"),
            (0, 1, "payerAmende(idRéunion)"),
            (1, 0, "amendeSoldée"),
            (0, 1, "planifierRéunion(date, lieu, amende)"),
            (1, 0, "réunionPlanifiée — notifications"),
            (0, 1, "saisirPrésences(idRéunion, présences)"),
            (1, 0, "feuillePrésenceEnregistrée"),
            (0, 1, "retirerCaisseAmendes(montant)"),
            (1, 0, "retraitAmendesEnregistré"),
        ],
    },
    {
        "file": "ssd-epargne",
        "title": "Épargne",
        "actor": "Membre",
        "messages": [
            (0, 1, "consulterÉpargne(idCompte)"),
            (1, 0, "soldeEtHistorique"),
            (0, 1, "effectuerDépôt(idCompte, montant)"),
            (1, 0, "soldeÉpargneMisÀJour"),
            (0, 1, "signalerMouvement(idMouvement, motif)"),
            (1, 0, "signalementEnregistré — audit admin"),
            (0, 1, "ouvrirCompteÉpargne(idMembre)"),
            (1, 0, "compteÉpargneOuvert"),
            (0, 1, "effectuerRetrait(idCompte, montant)"),
            (1, 0, "retraitEnregistré / refusSolde"),
        ],
    },
    {
        "file": "ssd-prets",
        "title": "Prêts",
        "actor": "Membre",
        "messages": [
            (0, 1, "demanderPrêt(montant, durée, avalistes)"),
            (1, 0, "demandeEnregistrée"),
            (0, 1, "accepterGarantie(idPrêt)"),
            (1, 0, "garantieAcceptée / refusée"),
            (0, 1, "rembourserPrêt(idPrêt, montant)"),
            (1, 0, "remboursementEnregistré"),
            (0, 1, "approuverPrêt(idPrêt, décision)"),
            (1, 0, "prêtApprouvé / prêtRefusé"),
            (1, 0, "décaisserPrêt(idPrêt)"),
        ],
    },
    {
        "file": "ssd-paiements",
        "title": "Paiements",
        # Membre : paiements entrants ; admin hérite pour sortants et pour compte d'un autre
        "actor": "Membre",
        "messages": [
            (0, 1, "initierPaiement(contexte, montant)"),
            (1, 0, "transactionPENDING"),
            (1, 0, "finaliserTransaction(idTransaction)"),
            (1, 0, "caissesEtJournalMisÀJour"),
            (0, 1, "consulterStatutTransaction(id)"),
            (1, 0, "statutSUCCESS / FAILED / PENDING"),
        ],
    },
    {
        "file": "ssd-finances",
        "title": "Finances",
        # Membre : consultation ; admin hérite pour rapports groupe (UC « Générer rapports »)
        "actor": "Membre",
        "messages": [
            (0, 1, "consulterCaisses(idGroupe)"),
            (1, 0, "listeCaissesEtSoldes"),
            (0, 1, "consulterJournal(idGroupe, filtres)"),
            (1, 0, "mouvementsPaginés"),
            (0, 1, "téléchargerRelevéPdf(idMembre)"),
            (1, 0, "documentPdf"),
            (0, 1, "générerRapportGroupe(format)"),
            (1, 0, "rapportPdf / rapportExcel"),
        ],
    },
]

EXPECTED_FILES = {f"{mod['file']}.png" for mod in MODULES}


def _font(size: int, bold: bool = False):
    return ImageFont.truetype(BOLD if bold else FONT, size)


def _draw_actor(d: ImageDraw.ImageDraw, x: int, y: int, label: str, font_name):
    d.ellipse((x - 14, y, x + 14, y + 28), outline=BLACK, width=1)
    d.line((x, y + 28, x, y + 50), fill=BLACK, width=1)
    d.line((x - 18, y + 38, x + 18, y + 38), fill=BLACK, width=1)
    d.line((x, y + 50, x - 16, y + 68), fill=BLACK, width=1)
    d.line((x, y + 50, x + 16, y + 68), fill=BLACK, width=1)
    ty = y + 78
    for line in label.replace("\\n", "\n").split("\n"):
        d.text((x, ty), line, font=font_name, fill=BLACK, anchor="ma")
        ty += font_name.size + 2


def _draw_system(d: ImageDraw.ImageDraw, x: int, y: int, font_name):
    bw, bh = 200, 52
    box = (x - bw // 2, y, x + bw // 2, y + bh)
    d.rectangle(box, outline=BLACK, fill=WHITE, width=1)
    d.text((x, y + bh // 2), ":E-Tontine", font=font_name, fill=BLACK, anchor="mm")
    return y + bh + 12


def _dashed_h(d, x1, y, x2):
    step = 8
    x, draw = min(x1, x2), True
    x_end = max(x1, x2)
    while x < x_end:
        x2s = min(x + step, x_end)
        if draw:
            d.line((x, y, x2s, y), fill=GRAY, width=1)
        x += step
        draw = not draw


def _arrow(d, x, y, direction: str):
    s = 8
    if direction == "right":
        d.polygon([(x, y), (x - s, y - 4), (x - s, y + 4)], outline=BLACK, fill=WHITE)
    else:
        d.polygon([(x, y), (x + s, y - 4), (x + s, y + 4)], outline=BLACK, fill=WHITE)


def _msg_label(d, x1, x2, y, text, font, return_msg: bool):
    lines = []
    for part in text.split("\n"):
        lines.extend(wrap(part, 36) or [""])
    mx = (x1 + x2) / 2
    ty = y - 6 - len(lines) * (font.size + 2)
    for line in lines:
        d.text((mx, ty), line, font=font, fill=GRAY if return_msg else BLACK, anchor="ma")
        ty += font.size + 2


def render_module(mod: dict) -> Path:
    n_msgs = len(mod["messages"])
    h = TOP + 200 + n_msgs * MSG_GAP + TITLE_BOTTOM + 24

    img = Image.new("RGB", (WIDTH, h), WHITE)
    d = ImageDraw.Draw(img)
    f_title = _font(24, bold=True)
    f_name = _font(16, bold=True)
    f_msg = _font(14)

    life_start = TOP + 100
    life_end = h - TITLE_BOTTOM - 20

    _draw_actor(d, ACTOR_X, TOP + 8, mod["actor"], f_name)
    d.line((ACTOR_X, life_start, ACTOR_X, life_end), fill=GRAY, width=1)

    sys_top = _draw_system(d, SYSTEM_X, TOP + 8, f_name)
    d.line((SYSTEM_X, sys_top, SYSTEM_X, life_end), fill=GRAY, width=1)

    xs = [ACTOR_X, SYSTEM_X]
    y = life_start + 24

    for frm, to, label in mod["messages"]:
        x1, x2 = xs[frm], xs[to]
        is_return = frm == 1

        if is_return:
            _dashed_h(d, min(x1, x2), y, max(x1, x2))
            _arrow(d, x2, y, "left" if x2 < x1 else "right")
        else:
            d.line((x1, y, x2, y), fill=BLACK, width=1)
            _arrow(d, x2, y, "right" if x2 > x1 else "left")

        _msg_label(d, x1, x2, y, label, f_msg, is_return)
        y += MSG_GAP

    title = f"Diagramme de séquence système — {mod['title']}"
    d.text((WIDTH // 2, h - TITLE_BOTTOM // 2 + 6), title, font=f_title, fill=BLACK, anchor="mm")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{mod['file']}.png"
    out = img.resize((1920, int(h * 1920 / WIDTH)), Image.Resampling.LANCZOS)
    out.save(path, quality=95)
    return path


def _cleanup_orphans():
    if not OUT.exists():
        return
    for png in OUT.glob("*.png"):
        if png.name not in EXPECTED_FILES:
            png.unlink()
            print(f"  supprimé {png.name}")


def main():
    paths = []
    for mod in MODULES:
        p = render_module(mod)
        paths.append(p)
        print(f"  {mod['file']}.png → {mod['actor'].replace(chr(10), ' ')}")
    _cleanup_orphans()
    print(f"{len(paths)} diagrammes SSD → {OUT}")


if __name__ == "__main__":
    main()
