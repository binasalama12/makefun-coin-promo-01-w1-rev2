#!/usr/bin/env node
// Golden Buzzer ($BUZZER) — make.fun coin-promo entry bot.
// Verifies the launch record, mirrors it, prints a stage-card,
// emits promo drafts, and does a best-effort live lookup.
import { readFileSync, mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const COIN_NAME = "Golden Buzzer";
const COIN_SYMBOL = "BUZZER";
const BOUNTY_URL = "https://make.fun/bounty/makefun-coin-promo-01";
const DEADLINE_ISO = "2026-11-17T06:00:00Z";
const PUMP_API = "https://frontend-api-v3.pump.fun/coins";
const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const LAUNCH_PATH = join(BOT_DIR, "LAUNCH.json");
const BASE58 = "[1-9A-HJ-NP-Za-km-z]";
const MINT_RE = new RegExp(`^${BASE58}{32,44}$`);
const SIG_RE = new RegExp(`^${BASE58}{64,88}$`);

type LaunchRecord = { mint: string; create_signature: string };

function die(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): { json: boolean; noLive: boolean } {
  return { json: argv.includes("--json"), noLive: argv.includes("--no-live") };
}

function loadLaunch(path: string): LaunchRecord {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    die(`cannot read launch record at ${path} (file unreadable or missing)`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw!);
  } catch {
    die(`launch record at ${path} is not valid JSON`);
  }
  const rec = parsed as Partial<LaunchRecord>;
  if (typeof rec.mint !== "string" || !MINT_RE.test(rec.mint)) {
    die(`launch record mint is invalid: expected base58 string of 32-44 chars, got ${JSON.stringify(rec.mint)}`);
  }
  if (typeof rec.create_signature !== "string" || !SIG_RE.test(rec.create_signature)) {
    die(`launch record create_signature is invalid: expected base58 string of 64-88 chars, got ${JSON.stringify(rec.create_signature)}`);
  }
  return { mint: rec.mint, create_signature: rec.create_signature };
}

function mirrorLaunch(src: string, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, "LAUNCH.json");
  copyFileSync(src, dest);
  return dest;
}

function countdownText(now: Date, deadlineIso: string): string {
  const target = new Date(deadlineIso).getTime();
  const diffMs = target - now.getTime();
  if (Number.isNaN(target)) return "unknown deadline";
  if (diffMs <= 0) return "deadline passed";
  const totalSec = Math.floor(diffMs / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return `${parts.join(" ")} remaining`;
}

function pumpUrl(mint: string): string {
  return `https://pump.fun/coin/${mint}`;
}

type DraftGroup = { voice: string; drafts: string[] };

function buildPromoDrafts(): DraftGroup[] {
  const b = BOUNTY_URL;
  return [
    {
      voice: "hype",
      drafts: [
        `THE GOLDEN BUZZER JUST GOT SLAMMED. $BUZZER is live, confetti in the air, judges on their feet. No queue, no waiting room — straight to the live shows. Enter on make.fun: ${b}`,
        `BUZZ BUZZ. $BUZZER skipped the whole audition line and went golden on make.fun. One press, full stage lights, escrow prizes waiting for the loudest crowd. Join in: ${b}`,
        `THIS IS THE MOMENT. Hand down, buzzer gold, confetti cannons fired for $BUZZER on make.fun. The stage is open and the prize pool sits in escrow. Be early: ${b}`,
      ],
    },
    {
      voice: "storyteller",
      drafts: [
        `Every act dreams of the night the room goes quiet, a hand hits gold, and confetti rewrites their story. That night is $BUZZER on make.fun — escrow prizes, real stage. Watch it unfold: ${b}`,
        `She waited in the audition queue for hours. Then someone pressed the golden buzzer and the queue stopped mattering. $BUZZER is that press, live on make.fun. Step onto the stage: ${b}`,
        `The best stage stories are not about winning the final — they are about the second everything changed. $BUZZER is that second, minted on make.fun with prizes held in escrow. Read the act: ${b}`,
      ],
    },
    {
      voice: "degen",
      drafts: [
        `ape the buzzer before the confetti settles. $BUZZER live on make.fun, escrow prizes locked, queue = skipped, stage = ours. send it: ${b}`,
        `no audition, no judges smalltalk, just palm -> gold -> $BUZZER. make.fun bounty is live and the escrow bag does not blink. in early or watch the replay: ${b}`,
        `pressed it. full send. $BUZZER golden buzzer arc on make.fun — confetti on the chart, prizes in escrow, latecomers in the queue we skipped. join: ${b}`,
      ],
    },
  ];
}

function renderPromoFile(groups: DraftGroup[]): string {
  const lines: string[] = [];
  lines.push(`# Golden Buzzer ($BUZZER) — promo drafts`);
  lines.push(`# Bounty: ${BOUNTY_URL}`);
  lines.push("");
  for (const group of groups) {
    lines.push(`## Voice: ${group.voice}`);
    lines.push("");
    group.drafts.forEach((draft, i) => {
      lines.push(`${i + 1}. ${draft}`);
      lines.push("");
    });
  }
  return lines.join("\n");
}

function writePromoDrafts(outDir: string): string {
  const dest = join(outDir, "promo-posts.txt");
  writeFileSync(dest, renderPromoFile(buildPromoDrafts()), "utf8");
  return dest;
}

function printStageCard(rec: LaunchRecord, mirroredTo: string): void {
  const banner = [
    "        \\  |  /",
    "      --  \\ | /  --",
    "           ___",
    "        .-'   '-.",
    "       /  GOLDEN  \\",
    "      |   BUZZER   |",
    "       \\  * * *   /",
    "        '-.___.-'",
    "     [  PRESS  IT  ]",
  ];
  for (const line of banner) console.log(line);
  console.log("");
  console.log(`Coin:     ${COIN_NAME} ($${COIN_SYMBOL})`);
  console.log(`Mint:     ${rec.mint}`);
  console.log(`Create tx: ${rec.create_signature}`);
  console.log(`Pump.fun: ${pumpUrl(rec.mint)}`);
  console.log(`Bounty:   ${BOUNTY_URL}`);
  console.log(`Deadline: ${DEADLINE_ISO} (${countdownText(new Date(), DEADLINE_ISO)})`);
  console.log(`Mirrored: ${mirroredTo}`);
}

async function liveLookup(mint: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${PUMP_API}/${mint}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name : COIN_NAME;
    const symbol = typeof data.symbol === "string" ? data.symbol : COIN_SYMBOL;
    console.log(`Live:     ${name} ($${symbol})`);
    const mc =
      typeof data.usd_market_cap === "number" ? data.usd_market_cap
      : typeof data.market_cap === "number" ? data.market_cap
      : null;
    if (mc !== null) console.log(`Live MC:  $${mc.toLocaleString("en-US")}`);
    else console.log("Live MC:  unavailable (not reported by API)");
  } catch {
    console.log("Live:     unavailable (lookup failed, continuing offline)");
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rec = loadLaunch(LAUNCH_PATH);
  const mirroredTo = mirrorLaunch(LAUNCH_PATH, OUTPUT_DIR);
  const promoPath = writePromoDrafts(OUTPUT_DIR);
  if (args.json) {
    const summary = {
      name: COIN_NAME,
      symbol: COIN_SYMBOL,
      mint: rec.mint,
      create_signature: rec.create_signature,
      pump_url: pumpUrl(rec.mint),
      bounty_url: BOUNTY_URL,
      deadline_iso: DEADLINE_ISO,
      mirrored_to: mirroredTo,
    };
    console.log(JSON.stringify(summary));
  } else {
    printStageCard(rec, mirroredTo);
    console.log(`Promo:    ${promoPath} (9 drafts: hype / storyteller / degen)`);
    if (!args.noLive) await liveLookup(rec.mint);
  }
  console.log(`Golden Buzzer record verified and mirrored to ${mirroredTo}.`);
}

main().catch((err: unknown) => {
  die(err instanceof Error ? err.message : String(err));
});
