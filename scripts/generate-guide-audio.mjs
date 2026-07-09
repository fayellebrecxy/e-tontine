#!/usr/bin/env node
/**
 * Génère un fichier audio MP3 du guide de soutenance E-Tontine.
 * Sortie : Docs/guide-soutenance-E-TONTINE.mp3
 *
 * Usage : node scripts/generate-guide-audio.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const NARRATION = path.join(__dirname, "guide-soutenance-narration.txt");
const OUT = path.join(ROOT, "Docs", "guide-soutenance-E-TONTINE.mp3");
const TMP_DIR = path.join(ROOT, "Docs", ".audio-chunks");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const MAX_CHARS = 180;
const DELAY_MS = 350;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function splitText(text) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_CHARS) {
      chunks.push(paragraph);
      continue;
    }
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [paragraph];
    let current = "";
    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      if (`${current} ${s}`.trim().length <= MAX_CHARS) {
        current = `${current} ${s}`.trim();
      } else {
        if (current) chunks.push(current);
        if (s.length <= MAX_CHARS) {
          current = s;
        } else {
          for (let i = 0; i < s.length; i += MAX_CHARS) {
            chunks.push(s.slice(i, i + MAX_CHARS));
          }
          current = "";
        }
      }
    }
    if (current) chunks.push(current);
  }
  return chunks;
}

async function fetchTtsChunk(text, index, attempt = 1) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fr&q=${encodeURIComponent(text)}`;
  const dest = path.join(TMP_DIR, `chunk-${String(index).padStart(4, "0")}.mp3`);
  try {
    execSync(
      `curl -fsSL --max-time 30 -A "${UA}" -o "${dest}" "${url}"`,
      { stdio: "pipe" },
    );
  } catch (err) {
    if (attempt < 4) {
      await sleep(1000 * attempt);
      return fetchTtsChunk(text, index, attempt + 1);
    }
    throw new Error(`TTS échec chunk ${index} après ${attempt} tentatives`);
  }
  const stat = fs.statSync(dest);
  if (stat.size < 100) {
    fs.unlinkSync(dest);
    if (attempt < 4) {
      await sleep(1000 * attempt);
      return fetchTtsChunk(text, index, attempt + 1);
    }
    throw new Error(`TTS chunk ${index} trop court`);
  }
  return dest;
}

function hasFfmpeg() {
  try {
    execSync("which ffmpeg", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function concatWithFfmpeg(files, output) {
  const listFile = path.join(TMP_DIR, "files.txt");
  fs.writeFileSync(listFile, files.map((f) => `file '${f}'`).join("\n"));
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${output}"`,
    { stdio: "inherit" },
  );
}

function concatBinary(files, output) {
  const buffers = files.map((f) => fs.readFileSync(f));
  fs.writeFileSync(output, Buffer.concat(buffers));
}

async function main() {
  if (!fs.existsSync(NARRATION)) {
    throw new Error(`Fichier narration introuvable : ${NARRATION}`);
  }

  const text = fs.readFileSync(NARRATION, "utf8");
  const chunks = splitText(text);
  console.log(`Narration : ${chunks.length} segments audio à générer…`);

  fs.mkdirSync(TMP_DIR, { recursive: true });
  const files = [];

  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`\rSegment ${i + 1}/${chunks.length}…`);
    const file = await fetchTtsChunk(chunks[i], i + 1);
    files.push(file);
    if (i < chunks.length - 1) await sleep(DELAY_MS);
  }
  console.log("\nAssemblage du fichier MP3…");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (hasFfmpeg()) {
    concatWithFfmpeg(files, OUT);
  } else {
    console.log("ffmpeg non trouvé — concaténation binaire des segments MP3.");
    concatBinary(files, OUT);
  }

  const sizeMb = (fs.statSync(OUT).size / (1024 * 1024)).toFixed(1);
  const durationEstimate = Math.round((chunks.length * 8) / 60);
  console.log(`\nAudio généré : ${OUT}`);
  console.log(`Taille : ${sizeMb} Mo — durée estimée : ~${durationEstimate} minutes`);
  console.log("Vous pouvez l'écouter sur téléphone, ordinateur ou lecteur MP3.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
