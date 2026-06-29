#!/usr/bin/env python3
"""
Diagrammes de séquence détaillés par module — E-Tontine.

Docs/diagramme de sequences/
Style TAMELA : acteur + interface + backend + table, fragments alt/opt,
référence « S'authentifier » pour les modules protégés.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Docs" / "diagramme de sequences"

_spec = importlib.util.spec_from_file_location(
    "seq_engine", ROOT / "scripts" / "generate_conception_sequences.py"
)
_engine = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_engine)
_engine.OUT = OUT
OUT.mkdir(parents=True, exist_ok=True)

render = _engine.sequence_diagram


def _spec(main: list, alt=None, opt=None):
    s: dict = {"preamble": main}
    if alt:
        s["alt"] = alt
    if opt:
        s["opt"] = opt
    return s


MODULES = [
    {
        "file": "seq-authentification.png",
        "title": "Diagramme de séquence — Authentification",
        "ref": False,
        "participants": ["Utilisateur", "Page login", "Actions auth", "users"],
        "spec": _spec(
            [
                (0, 1, "Saisir identifiants"),
                (1, 2, "Transmettre la connexion"),
                (2, 2, "Authentifier via Supabase"),
            ],
            alt={
                "operands": [
                    (
                        "[identifiants valides]",
                        [
                            (2, 1, "Session établie"),
                            (1, 2, "Charger le profil"),
                            (2, 3, "Lire le profil utilisateur"),
                            (3, 2, "Profil trouvé"),
                            (1, 0, "Rediriger vers le tableau de bord"),
                        ],
                    ),
                    (
                        "[identifiants invalides]",
                        [
                            (2, 1, "Échec de connexion"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-groupes.png",
        "title": "Diagramme de séquence — Groupes",
        "ref": True,
        "participants": ["Administrateur", "Page groupes", "API groupes", "groupes"],
        "spec": _spec(
            [
                (0, 1, "Saisir les informations du groupe"),
                (1, 2, "Envoyer la création"),
                (2, 2, "Contrôler les données saisies"),
            ],
            alt={
                "operands": [
                    (
                        "[données valides]",
                        [
                            (2, 3, "Enregistrer le groupe"),
                            (2, 3, "Créer l'adhésion administrateur"),
                            (3, 2, "Groupe créé"),
                            (2, 1, "Confirmation"),
                            (1, 0, "Afficher le groupe"),
                        ],
                    ),
                    (
                        "[données invalides]",
                        [
                            (2, 1, "Refus de création"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-membres.png",
        "title": "Diagramme de séquence — Membres",
        "ref": True,
        "participants": ["Membre", "Page invitation", "API adhésion", "membre_groupe"],
        "spec": _spec(
            [
                (0, 1, "Ouvrir le lien d'invitation"),
                (1, 2, "Demander l'adhésion"),
                (2, 3, "Vérifier le code d'invitation"),
            ],
            alt={
                "operands": [
                    (
                        "[invitation valide]",
                        [
                            (3, 2, "Invitation trouvée"),
                            (2, 3, "Enregistrer le membre"),
                            (3, 2, "Adhésion enregistrée"),
                            (2, 1, "Confirmation"),
                            (1, 0, "Accéder au groupe"),
                        ],
                    ),
                    (
                        "[invitation invalide]",
                        [
                            (3, 2, "Invitation introuvable"),
                            (2, 1, "Refus d'adhésion"),
                            (1, 0, "Afficher code invalide"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-cycles.png",
        "title": "Diagramme de séquence — Cycles",
        "ref": True,
        "participants": ["Membre", "Page cycle", "API paiement", "cotisations"],
        "spec": _spec(
            [
                (0, 1, "Payer sa cotisation"),
                (1, 2, "Lancer le paiement"),
                (2, 2, "Vérifier le cycle et le membre"),
            ],
            alt={
                "operands": [
                    (
                        "[cotisation due]",
                        [
                            (2, 3, "Consulter le tour en cours"),
                            (2, 3, "Enregistrer la cotisation"),
                            (3, 2, "Cotisation enregistrée"),
                            (2, 1, "Paiement confirmé"),
                            (1, 0, "Mettre à jour l'affichage"),
                        ],
                    ),
                    (
                        "[aucune cotisation due]",
                        [
                            (2, 1, "Paiement refusé"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-rubriques.png",
        "title": "Diagramme de séquence — Rubriques",
        "ref": True,
        "participants": ["Membre", "Page rubriques", "Actions rubriques", "paiement_rubrique"],
        "spec": _spec(
            [
                (0, 1, "Régler une rubrique"),
                (1, 2, "Enregistrer le paiement"),
                (2, 3, "Vérifier la rubrique"),
            ],
            alt={
                "operands": [
                    (
                        "[rubrique active]",
                        [
                            (3, 2, "Rubrique valide"),
                            (2, 3, "Enregistrer le paiement"),
                            (2, 3, "Mettre à jour la caisse"),
                            (2, 1, "Paiement enregistré"),
                            (1, 0, "Afficher confirmation"),
                        ],
                    ),
                    (
                        "[rubrique clôturée]",
                        [
                            (3, 2, "Rubrique indisponible"),
                            (2, 1, "Paiement refusé"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-reunions.png",
        "title": "Diagramme de séquence — Réunions",
        "ref": True,
        "participants": ["Administrateur", "Page réunions", "API présences", "presence_reunion"],
        "spec": _spec(
            [
                (0, 1, "Saisir les présences"),
                (1, 2, "Enregistrer la feuille"),
                (2, 3, "Charger la réunion"),
            ],
            alt={
                "operands": [
                    (
                        "[membre présent]",
                        [
                            (2, 3, "Marquer présent"),
                            (3, 2, "Présence enregistrée"),
                            (2, 1, "Confirmation"),
                        ],
                    ),
                    (
                        "[membre absent]",
                        [
                            (2, 3, "Marquer absent"),
                            (2, 3, "Calculer l'amende"),
                            (3, 2, "Amende enregistrée"),
                            (2, 1, "Amende appliquée"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-epargne.png",
        "title": "Diagramme de séquence — Épargne",
        "ref": True,
        "participants": ["Membre", "Page épargne", "API épargne", "mouvement_epargne"],
        "spec": _spec(
            [
                (0, 1, "Effectuer un dépôt"),
                (1, 2, "Enregistrer l'opération"),
                (2, 3, "Vérifier le compte épargne"),
            ],
            alt={
                "operands": [
                    (
                        "[compte actif]",
                        [
                            (3, 2, "Compte disponible"),
                            (2, 3, "Enregistrer le mouvement"),
                            (2, 3, "Mettre à jour le solde"),
                            (3, 2, "Solde mis à jour"),
                            (2, 1, "Opération validée"),
                            (1, 0, "Afficher le nouveau solde"),
                        ],
                    ),
                    (
                        "[compte indisponible]",
                        [
                            (3, 2, "Opération impossible"),
                            (2, 1, "Refus"),
                            (1, 0, "Afficher message d'erreur"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-prets.png",
        "title": "Diagramme de séquence — Prêts",
        "ref": True,
        "participants": ["Membre", "Page prêts", "API prêts", "pret"],
        "spec": _spec(
            [
                (0, 1, "Soumettre une demande"),
                (1, 2, "Transmettre la demande"),
                (2, 2, "Vérifier l'éligibilité"),
            ],
            alt={
                "operands": [
                    (
                        "[membre éligible]",
                        [
                            (2, 3, "Enregistrer la demande"),
                            (2, 3, "Enregistrer les avalistes"),
                            (3, 2, "Demande enregistrée"),
                            (2, 1, "Confirmation"),
                            (1, 0, "Afficher le suivi"),
                        ],
                    ),
                    (
                        "[membre non éligible]",
                        [
                            (2, 1, "Demande refusée"),
                            (1, 0, "Afficher le motif"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-paiements.png",
        "title": "Diagramme de séquence — Paiements",
        "ref": True,
        "participants": ["Membre", "Interface paiement", "API paiement", "payment_transactions"],
        "spec": _spec(
            [
                (0, 1, "Lancer un paiement Mobile Money"),
                (1, 2, "Créer la transaction"),
                (2, 3, "Enregistrer en attente"),
            ],
            alt={
                "operands": [
                    (
                        "[paiement accepté]",
                        [
                            (2, 2, "Recevoir confirmation opérateur"),
                            (2, 3, "Finaliser la transaction"),
                            (2, 3, "Mettre à jour les caisses"),
                            (3, 2, "Transaction validée"),
                            (2, 1, "Succès"),
                            (1, 0, "Afficher confirmation"),
                        ],
                    ),
                    (
                        "[paiement refusé]",
                        [
                            (2, 3, "Marquer la transaction en échec"),
                            (2, 1, "Échec"),
                            (1, 0, "Afficher échec du paiement"),
                        ],
                    ),
                ],
            },
        ),
    },
    {
        "file": "seq-finances.png",
        "title": "Diagramme de séquence — Finances",
        "ref": True,
        "participants": ["Membre", "Page finances", "API finances", "mouvement_financier"],
        "spec": _spec(
            [
                (0, 1, "Consulter les finances"),
                (1, 2, "Charger caisses et journal"),
                (2, 3, "Lire les mouvements"),
                (3, 2, "Données financières"),
                (2, 1, "Afficher soldes et journal"),
            ],
            opt={
                "guard": "[export PDF ou Excel demandé]",
                "messages": [
                    (0, 1, "Demander un export"),
                    (1, 2, "Générer le rapport"),
                    (2, 3, "Consolider les données"),
                    (2, 1, "Fichier prêt"),
                    (1, 0, "Télécharger le relevé"),
                ],
            },
        ),
    },
]


def main():
    from PIL import Image

    for mod in MODULES:
        render(
            mod["title"],
            mod["file"],
            mod["participants"],
            mod["spec"],
            show_ref=mod.get("ref", False),
        )
        path = OUT / mod["file"]
        im = Image.open(path)
        w = 1920
        im.resize((w, int(im.height * w / im.width)), Image.Resampling.LANCZOS).save(
            path, quality=95
        )
        print(f"  {mod['file']}")
    print(f"{len(MODULES)} diagrammes → {OUT}")


if __name__ == "__main__":
    main()
