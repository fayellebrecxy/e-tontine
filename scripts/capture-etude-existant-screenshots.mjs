#!/usr/bin/env node
/**
 * Captures d'écran des sites officiels des applications étudiées (I.2).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../Docs/memoire-etude-existant");

const CHROME =
  process.env.CHROME_PATH ??
  ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find((p) =>
    fs.existsSync(p),
  );

if (!CHROME) {
  console.error("Chrome/Chromium introuvable. Définissez CHROME_PATH.");
  process.exit(1);
}

const TARGETS = [
  {
    file: "capture-cirkkle.png",
    url: "https://cirkkle.com/",
    waitSelector: "body",
    delay: 5000,
  },
  {
    file: "capture-njangi.png",
    url: "https://njangiapp.com/fr/",
    waitSelector: "body",
    delay: 5000,
  },
  {
    file: "capture-djangui.png",
    url: "https://djangui.net/blog/",
    waitSelector: "body",
    delay: 5000,
  },
  {
    file: "capture-kika.png",
    url: "https://kika.africa/",
    waitSelector: "body",
    delay: 5000,
  },
];

async function scrollReveal(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = 400;
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= Math.min(max, 1800); y += step) {
      window.scrollTo(0, y);
      await delay(100);
    }
    window.scrollTo(0, 0);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  for (const target of TARGETS) {
    const dest = path.join(OUT, target.file);
    try {
      await page.goto(target.url, { waitUntil: "networkidle2", timeout: 120000 });
      if (target.waitSelector) {
        await page.waitForSelector(target.waitSelector, { timeout: 60000 });
      }
      await scrollReveal(page);
      await new Promise((r) => setTimeout(r, target.delay));
      await page.screenshot({ path: dest, fullPage: false });
      console.log(`OK ${target.file} <- ${target.url}`);
    } catch (err) {
      console.error(`Échec ${target.file}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`Captures enregistrées dans ${OUT}`);
}

main();
