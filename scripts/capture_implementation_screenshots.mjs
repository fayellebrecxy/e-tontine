#!/usr/bin/env node
/**
 * Captures d'écran réelles de l'application E-Tontine (production ou local).
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "Docs", "captures-application");
const BASE = process.env.SCREENSHOT_BASE_URL ?? "https://e-tontine.vercel.app";

const CHROME =
  process.env.CHROME_PATH ??
  ["/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"].find((p) =>
    fs.existsSync(p),
  );

if (!CHROME) {
  console.error("Chrome/Chromium introuvable. Définissez CHROME_PATH.");
  process.exit(1);
}

function setupUser() {
  const out = execSync(`node "${path.join(ROOT, "scripts/setup-screenshot-user.mjs")}"`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
  return JSON.parse(out.trim().split("\n").pop());
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, file, url, opts = {}) {
  const dest = path.join(OUT, file);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  if (opts.waitSelector) {
    await page.waitForSelector(opts.waitSelector, { timeout: 60000 });
  }
  await wait(opts.delay ?? 3500);
  await page.screenshot({ path: dest, fullPage: Boolean(opts.fullPage) });
  console.log(`  ${file}`);
}

/** Fait défiler la page pour déclencher les animations whileInView, puis revient en haut. */
async function scrollToRevealAll(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = 350;
    const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await delay(120);
    }
    window.scrollTo(0, 0);
  });
  await wait(600);
}

/** Capture la landing page : hero, flux financier et fonctionnalités (coupure propre). */
async function shotLanding(page, file, url) {
  const dest = path.join(OUT, file);
  const width = 1440;

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width, height: 900, deviceScaleFactor: 2 });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
  await page.waitForSelector("h1", { timeout: 60000 });
  await page.waitForSelector("#fonctionnalites", { timeout: 60000 });
  await scrollToRevealAll(page);

  await page.addStyleTag({
    content: `
      .animate-marquee { animation: none !important; transform: translateX(0) !important; }
      *, *::before, *::after { animation-play-state: paused !important; }
    `,
  });
  await wait(800);

  const height = await page.evaluate(() => {
    const features = document.getElementById("fonctionnalites");
    if (features) {
      const rect = features.getBoundingClientRect();
      const bottom = rect.bottom + window.scrollY;
      return Math.ceil(bottom + 48);
    }
    return Math.min(
      Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
      2800,
    );
  });

  await page.screenshot({
    path: dest,
    clip: { x: 0, y: 0, width, height },
  });
  console.log(`  ${file} (${width}x${height}, 2x)`);
}

async function clickButtonByText(page, text, { exact = false } = {}) {
  const clicked = await page.evaluate(
    (needle, isExact) => {
      const buttons = [...document.querySelectorAll("button")];
      const match = buttons.find((btn) => {
        const label = btn.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return isExact ? label === needle : label.includes(needle);
      });
      if (!match) return false;
      match.click();
      return true;
    },
    text,
    exact,
  );
  if (!clicked) throw new Error(`Bouton introuvable : "${text}"`);
}

async function shotGroupDetail(page, file, groupUrl) {
  const dest = path.join(OUT, file);
  await page.goto(`${BASE}${groupUrl}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector("h1", { timeout: 60000 });
  await wait(3500);

  await clickButtonByText(page, "Menu du groupe");
  await page.waitForSelector("aside nav", { timeout: 30000 });
  await wait(1200);

  await page.screenshot({ path: dest });
  console.log(`  ${file}`);
}

async function shotMobileMoneyDialog(page, file, cyclesUrl) {
  const dest = path.join(OUT, file);
  await page.goto(`${BASE}${cyclesUrl}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector("main", { timeout: 60000 });
  await wait(3500);

  await clickButtonByText(page, "Payer", { exact: true });
  await wait(1500);

  await fillInput(page, "#cycle-montant", "5000");
  await wait(500);

  await clickButtonByText(page, "Payer via Mobile Money");
  await page.waitForSelector('[role="dialog"]', { timeout: 30000 });
  await page.waitForSelector("#mm-phone", { timeout: 30000 });
  await wait(1200);

  await page.screenshot({ path: dest });
  console.log(`  ${file}`);
}

async function waitHydrated(page) {
  await page.waitForSelector("form button[type='submit']", { timeout: 30000 });
  await wait(3000);
}

async function fillInput(page, selector, value) {
  await page.waitForSelector(selector);
  await page.$eval(
    selector,
    (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(el, val);
      else el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

async function loginViaForm(page, email, password) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await waitHydrated(page);
  await fillInput(page, 'input[type="email"]', email);
  await fillInput(page, 'input[type="password"]', password);
  await page.evaluate(() => {
    document.querySelector("form")?.requestSubmit();
  });
  await page.waitForFunction(
    () => window.location.pathname.startsWith("/dashboard"),
    { timeout: 120000 },
  );
  await wait(2500);
}

async function authenticate(page, email, password) {
  await loginViaForm(page, email, password);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const only = process.env.CAPTURE_ONLY?.split(",")
    .map((s) => s.trim().replace(/\.png$/, "").replace(/^capture-/, ""))
    .filter(Boolean);
  const wants = (name) => {
    if (!only.length) return true;
    const stem = name.replace(/\.png$/, "");
    const short = stem.replace(/^capture-/, "");
    return only.includes(stem) || only.includes(short);
  };

  let creds = null;
  if (!only.length || only.some((n) => !["accueil", "connexion", "inscription"].includes(n))) {
    try {
      creds = setupUser();
    } catch (e) {
      console.error("Impossible de préparer le compte capture :", e.message);
      process.exit(1);
    }
  }

  const { email, password, groupId, cycleId } = creds ?? {};
  const g = groupId ? `/dashboard/groups/${groupId}` : "";
  const cyclesUrl = cycleId ? `${g}/cycles/${cycleId}` : `${g}/cycles`;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  try {
    if (wants("capture-accueil")) {
      await shotLanding(page, "capture-accueil.png", `${BASE}/`);
    }
    if (wants("capture-connexion")) {
      await shot(page, "capture-connexion.png", `${BASE}/auth/login`);
    }
    if (wants("capture-inscription")) {
      await shot(page, "capture-inscription.png", `${BASE}/auth/register`);
    }

    if (
      wants("capture-dashboard") ||
      wants("capture-mes-groupes") ||
      wants("capture-detail-groupe") ||
      wants("capture-cycles") ||
      wants("capture-membres") ||
      wants("capture-invitations") ||
      wants("capture-rubriques") ||
      wants("capture-reunions") ||
      wants("capture-epargne") ||
      wants("capture-prets") ||
      wants("capture-finances") ||
      wants("capture-caisses") ||
      wants("capture-paiements")
    ) {
      await authenticate(page, email, password);
    }

    if (wants("capture-dashboard")) {
      await shot(page, "capture-dashboard.png", `${BASE}/dashboard`, {
        waitSelector: "h1, main",
      });
    }
    if (wants("capture-mes-groupes")) {
      await shot(page, "capture-mes-groupes.png", `${BASE}/dashboard/groups`);
    }
    if (wants("capture-detail-groupe")) {
      await shotGroupDetail(page, "capture-detail-groupe.png", g);
    }

    const modules = [
      ["capture-cycles.png", cyclesUrl],
      ["capture-membres.png", `${g}/members`],
      ["capture-invitations.png", `${g}/invitations`],
      ["capture-rubriques.png", `${g}/rubriques`],
      ["capture-reunions.png", `${g}/reunions`],
      ["capture-epargne.png", `${g}/epargne`],
      ["capture-prets.png", `${g}/prets`],
      ["capture-finances.png", `${g}/finances?vue=detail`],
      ["capture-caisses.png", `${g}/finances`],
    ];

    for (const [file, url] of modules) {
      if (!wants(file)) continue;
      await shot(page, file, `${BASE}${url}`, {
        delay: 5500,
        waitSelector: "h1, h2, main",
      });
    }

    if (wants("capture-paiements")) {
      await shotMobileMoneyDialog(page, "capture-paiements.png", cyclesUrl);
    }
  } finally {
    await browser.close();
  }

  console.log(`${fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).length} captures → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
