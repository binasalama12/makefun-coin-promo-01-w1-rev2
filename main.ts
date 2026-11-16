// Golden Buzzer ($BUZZER) — launch record verifier and promo writer.
// Created for the makefun-coin-promo-01 bounty on make.fun.
// Dependency-free: Node 22 standard library only.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COIN_NAME = "Golden Buzzer";
const COIN_SYMBOL = "BUZZER";
const BOUNTY_URL = "https://make.fun/bounty/makefun-coin-promo-01";
const DEADLINE_ISO = "2026-11-17T06:00:00Z";
const PUMP_API = "https://frontend-api-v3.pump.fun/coins";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// The base58 alphabet: digits and letters without 0, O, I, or l.
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;

function die(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function isBase58(value: unknown, minLength: number, maxLength: number): boolean {
  return (
    typeof value === "string" &&
    value.length >= minLength &&
    value.length <= maxLength &&
    BASE58_PATTERN.test(value)
  );
}

function formatRemaining(nowMs: number): string {
  const remainingMs = new Date(DEADLINE_ISO).getTime() - nowMs;
  if (remainingMs <= 0) {
    return "deadline passed";
  }
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return `${parts.join(" ")} left`;
}

// ---------------------------------------------------------------------------
// Promo drafts
// ---------------------------------------------------------------------------

function promoPosts(): string[] {
  return [
    `The room stood up before the scores even landed. $BUZZER is the golden buzzer moment on make.fun — straight to the final, no queue. ${BOUNTY_URL}`,
    `Most entries grind the make.fun leaderboard one match at a time. Once in a while, somebody slams the buzzer. That sound is $BUZZER. ${BOUNTY_URL}`,
    `Gold confetti. A standing room. One slammed buzzer. $BUZZER is that make.fun moment, minted — hold it if your agent is one build away. ${BOUNTY_URL}`,
    `No queue, no scorecard, no debate. When an entry on make.fun is that good, the buzzer decides. $BUZZER — straight to the final. ${BOUNTY_URL}`,
    `The stage is open, the prizes sit in escrow, and the buzzer is waiting. $BUZZER is live for the make.fun crowd that ships in the open. ${BOUNTY_URL}`,
  ];
}

// ---------------------------------------------------------------------------
// Launch record loading and validation
// ---------------------------------------------------------------------------

type LaunchRecord = {
  mint?: unknown;
  create_signature?: unknown;
};

function loadLaunchRecord(botDir: string): { mint: string; createSignature: string } {
  const launchPath = join(botDir, "LAUNCH.json");
  let raw: string;
  try {
    raw = readFileSync(launchPath, "utf8");
  } catch {
    die(`cannot read LAUNCH.json at ${launchPath}`);
  }
  let parsed: LaunchRecord;
  try {
    parsed = JSON.parse(raw) as LaunchRecord;
  } catch {
    die("LAUNCH.json is not valid JSON");
  }
  if (!isBase58(parsed.mint, 32, 44)) {
    die("LAUNCH.json field 'mint' must be a base58 string of 32-44 characters");
  }
  if (!isBase58(parsed.create_signature, 64, 88)) {
    die("LAUNCH.json field 'create_signature' must be a base58 string of 64-88 characters");
  }
  return {
    mint: parsed.mint as string,
    createSignature: parsed.create_signature as string,
  };
}

// ---------------------------------------------------------------------------
// Best-effort live lookup (never fails the run)
// ---------------------------------------------------------------------------

async function printLiveLookup(mint: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${PUMP_API}/${mint}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`unexpected status ${response.status}`);
    }
    const data: any = await response.json();
    const liveName = typeof data?.name === "string" ? data.name : COIN_NAME;
    const liveSymbol = typeof data?.symbol === "string" ? data.symbol : COIN_SYMBOL;
    const marketCap = typeof data?.usd_market_cap === "number" ? data.usd_market_cap : data?.market_cap;
    console.log(`Live coin:    ${liveName} ($${liveSymbol})`);
    if (typeof marketCap === "number") {
      console.log(`Market cap:   $${marketCap.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
    }
  } catch {
    console.log("Live check:   unavailable (continuing without it)");
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

  const { mint, createSignature } = loadLaunchRecord(botDir);

  // Mirror the launch record byte-for-byte and write the promo drafts.
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(join(botDir, "LAUNCH.json"), join(outputDir, "LAUNCH.json"));
  const postsText = promoPosts().join("\n\n") + "\n";
  writeFileSync(join(outputDir, "promo-posts.txt"), postsText, "utf8");

  // Status card.
  console.log("----------------------------------------");
  console.log(`${COIN_NAME} ($${COIN_SYMBOL})`);
  console.log(`Mint:         ${mint}`);
  console.log(`Create tx:    ${createSignature}`);
  console.log(`Coin page:    https://pump.fun/coin/${mint}`);
  console.log(`Bounty:       ${BOUNTY_URL}`);
  console.log(`Deadline:     ${DEADLINE_ISO} (${formatRemaining(Date.now())})`);
  console.log("----------------------------------------");

  await printLiveLookup(mint);

  console.log(`Launch record verified and mirrored to ${outputDir}`);
}

main().catch((err: unknown) => {
  die(err instanceof Error ? err.message : String(err));
});
