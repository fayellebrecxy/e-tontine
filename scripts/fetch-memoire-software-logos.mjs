#!/usr/bin/env node
/**
 * Télécharge et prépare les logos officiels pour le tableau
 * « Environnement logiciel » du mémoire (sources vérifiables).
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "Docs", "memoire-environnement-logiciel");
const UA = "Mozilla/5.0 (compatible; E-Tontine-memoire/1.0)";

fs.mkdirSync(OUT, { recursive: true });

function curl(url, dest) {
  execSync(`curl -fsSL -A "${UA}" -o "${dest}" "${url}"`, { stdio: "inherit" });
}

function convert(args) {
  execSync(`convert ${args}`, { stdio: "inherit" });
}

const SOURCES = {
  "logo-nodejs.svg":
    "https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg",
  "logo-nextjs-icon.svg":
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  "logo-react.svg":
    "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
  "logo-tailwind.svg":
    "https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg",
  "logo-github.svg":
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  "logo-vercel.svg":
    "https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg",
  "logo-word.svg":
    "https://upload.wikimedia.org/wikipedia/commons/1/19/Microsoft_Office_Word_%282019%E2%80%932025%29.svg",
  "logo-vscode.svg":
    "https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg",
};

console.log("Téléchargement des logos officiels…");
for (const [file, url] of Object.entries(SOURCES)) {
  curl(url, path.join(OUT, file));
}

console.log("Téléchargement Draw.io et Supabase…");
curl("https://www.drawio.com/favicon.ico", path.join(OUT, "logo-drawio.ico"));
curl(
  "https://supabase.com/dashboard/img/supabase-logo.svg",
  path.join(OUT, "logo-supabase.svg"),
);

const prismaIcon = path.join(ROOT, "node_modules/prisma/build/public/icon-1024.png");
if (!fs.existsSync(prismaIcon)) {
  throw new Error("Prisma non installé — exécutez npm install avant ce script.");
}
fs.copyFileSync(prismaIcon, path.join(OUT, "logo-prisma-icon-src.png"));

console.log("Conversion PNG haute résolution…");
convert(
  `-background white -density 400 "${OUT}/logo-nodejs.svg" -resize 320x110 "${OUT}/logo-nodejs.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-nextjs-icon.svg" -resize 96x96 "${OUT}/logo-nextjs-icon.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-react.svg" -resize 96x96 "${OUT}/logo-react.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-tailwind.svg" -resize 240x64 "${OUT}/logo-tailwind.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-github.svg" -resize 96x96 "${OUT}/logo-github.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-vercel.svg" -resize 200x60 "${OUT}/logo-vercel.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-word.svg" -resize 96x96 "${OUT}/logo-word.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-vscode.svg" -resize 96x96 "${OUT}/logo-vscode.png"`,
);
convert(
  `-background white "${OUT}/logo-drawio.ico[1]" -resize 96x96 "${OUT}/logo-drawio.png"`,
);
convert(
  `-background white "${OUT}/logo-prisma-icon-src.png" -resize 96x96 "${OUT}/logo-prisma-icon.png"`,
);
convert(
  `-background white -density 400 "${OUT}/logo-supabase.svg" -resize 96x96 "${OUT}/logo-supabase.png"`,
);

const compositePy = path.join(OUT, "_compose_logos.py");
fs.writeFileSync(
  compositePy,
  `from PIL import Image, ImageOps
import os
base = ${JSON.stringify(OUT)}

def on_white(im, pad=14):
    im = im.convert('RGBA')
    w, h = im.size
    canvas = Image.new('RGBA', (w + pad * 2, h + pad * 2), (255, 255, 255, 255))
    canvas.paste(im, (pad, pad), im)
    return canvas.convert('RGB')

def composite(out, items):
  prepared = []
  for p, sz in items:
    im = Image.open(os.path.join(base, p)).convert('RGBA').resize(sz, Image.Resampling.LANCZOS)
    prepared.append(on_white(im, pad=10))
  gap = 16
  w = sum(i.size[0] for i in prepared) + gap * (len(prepared) - 1)
  h = max(i.size[1] for i in prepared)
  canvas = Image.new('RGB', (w, h), (255, 255, 255))
  x = 0
  for im in prepared:
    y = (h - im.size[1]) // 2
    canvas.paste(im, (x, y))
    x += im.size[0] + gap
  canvas.save(os.path.join(base, out), quality=95)

composite('logo-node-next.png', [
  ('logo-nodejs.png', (170, 58)),
  ('logo-nextjs-icon.png', (58, 58)),
])
composite('logo-react-tailwind.png', [
  ('logo-react.png', (58, 58)),
  ('logo-tailwind.png', (150, 40)),
])
composite('logo-prisma-supabase.png', [
  ('logo-prisma-icon.png', (58, 58)),
  ('logo-supabase.png', (58, 58)),
])

for name in [
  'logo-vscode.png', 'logo-drawio.png', 'logo-github.png',
  'logo-vercel.png', 'logo-word.png',
]:
  path = os.path.join(base, name)
  im = Image.open(path).convert('RGBA')
  on_white(im, pad=14).save(path, quality=95)

print('Logos prêts dans', base)
`,
);
execSync(`python3 "${compositePy}"`, { stdio: "inherit" });
fs.unlinkSync(compositePy);

console.log(`Logos enregistrés dans ${OUT}`);
