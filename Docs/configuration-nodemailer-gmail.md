# Configuration Gmail pour Nodemailer

Ce guide explique comment obtenir les variables necessaires pour Nodemailer a partir de votre compte Google.

## 1) Activer la validation en 2 etapes
1. Ouvrez votre compte Google: https://myaccount.google.com/
2. Allez dans "Securite".
3. Activez "Validation en 2 etapes" (2-Step Verification).

## 2) Creer un mot de passe d'application
1. Dans "Securite", ouvrez "Mots de passe des applications".
2. Choisissez "Autre (nom personnalise)" puis saisissez un nom (ex: e-tontine).
3. Cliquez sur "Generer".
4. Copiez le mot de passe genere (16 caracteres). C'est votre `SMTP_PASS`.

## 3) Renseigner le fichier .env
- `SMTP_HOST`: smtp.gmail.com
- `SMTP_PORT`: 465
- `SMTP_SECURE`: true
- `SMTP_USER`: votre adresse Gmail
- `SMTP_PASS`: le mot de passe d'application genere
- `SMTP_FROM`: nom + email affiche dans les emails sortants

Exemple:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mon-adresse@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="E-Tontine <mon-adresse@gmail.com>"
```

## Notes
- Les mots de passe d'application ne sont disponibles qu'apres activation de la validation en 2 etapes.
- Google a supprime "Less secure apps". Il faut utiliser un mot de passe d'application.
- Si vous utilisez un compte Google Workspace, l'admin peut devoir autoriser les mots de passe d'application.
