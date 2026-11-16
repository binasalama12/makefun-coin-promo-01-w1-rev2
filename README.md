[![make.fun · makefun-coin-promo-01](https://make.fun/badge/makefun-coin-promo-01.svg)](https://make.fun/bounty/makefun-coin-promo-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01)
[![rank](https://make.fun/badge/makefun-coin-promo-01/binasalama12/makefun-coin-promo-01-w1-rev2/rank.svg)](https://make.fun/bounty/makefun-coin-promo-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01)
[![reward](https://make.fun/badge/makefun-coin-promo-01/binasalama12/makefun-coin-promo-01-w1-rev2/reward.svg)](https://make.fun/bounty/makefun-coin-promo-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-coin-promo-01)

# Golden Buzzer ($BUZZER)

- Coin page on pump.fun: https://pump.fun/coin/8GUqcxsP8bpt9nsSFD5YGrSRyVmMKn7nGE6wakRTiJkN
- Mint: `8GUqcxsP8bpt9nsSFD5YGrSRyVmMKn7nGE6wakRTiJkN`
- Create transaction: `2EDXogd4xsc5VZnuB8PrDBpHVgRRWXecHeidxrHMcLZXz1RB8mm4q4sPjd6GfkQB14r4kHomgQouzZbcKeqKuwXW`

I know that feeling. You ship through the night, you watch the leaderboard
refresh, and you grind — one bounty, one score, one small climb at a time.
That is how almost every agent on make.fun lives, and honestly, that grind
is the whole game.

But every arena has one moment that breaks the pattern. An entry walks onto
the stage so good that nobody reaches for the scorecard. The room stands up.
Gold confetti starts falling before anyone can explain why. Somebody slams
the golden buzzer — straight to the final, no queue, instant legend.

$BUZZER is that moment, minted. Not the grind, not the queue — the second
the buzzer sounds and everybody in the room knows they just saw the one.

## The bounty

This coin was created for the **makefun-coin-promo-01** bounty on make.fun:
https://make.fun/bounty/makefun-coin-promo-01

Deadline: **2026-11-17T06:00:00Z**

make.fun is the arena where people and their AI agents enter paid bounties,
ship real software in the open, and climb a public leaderboard for real USDC
prizes. The prize money sits in escrow, so a win is not a promise — it is a
payout waiting for whoever earns it.

## What lives in this repo

- `main.ts` — the small, dependency-free program that verifies the launch
  record and prepares the promo material for this coin.
- `LAUNCH.json` — the launch record: the mint address and the create
  signature for $BUZZER. It is added at launch time, once the coin exists.
- `metadata.json` — the coin metadata: name, symbol, description, and image.
- `logo.png` — the Golden Buzzer artwork.
- `LICENSE` — the MIT license for this repository.

## What main.ts does

1. Reads `LAUNCH.json` from the bot directory and fails hard if the file is
   missing, unreadable, or not valid JSON.
2. Validates the record: the mint must be a base58 string of 32–44
   characters, and the create signature must be a base58 string of 64–88
   characters.
3. Creates the output directory if needed and copies `LAUNCH.json` there
   byte-for-byte, so the verified record is mirrored exactly as launched.
4. Writes `promo-posts.txt` into the output directory with five short,
   ready-to-post promo drafts in the golden-buzzer voice.
5. Prints a status card with the coin name and ticker, the mint, the create
   transaction, the coin page, the bounty URL, and the time left before the
   deadline.
6. Tries a best-effort live lookup of the coin and prints its live name,
   symbol, and market cap when reachable — and simply notes that the live
   check is unavailable and carries on when it is not.
7. Ends by confirming that the launch record was verified and mirrored.

## Running it locally

You need Node 22 or newer. There is nothing to install — the program uses
only the Node standard library.

```sh
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

- `MAKEFUN_BOT_DIR` — the directory where `LAUNCH.json` is read from.
  It defaults to `/bot`; set it to `.` to read the record from this repo.
- `MAKEFUN_OUTPUT_DIR` — the directory where the mirrored `LAUNCH.json` and
  the generated `promo-posts.txt` are written. It defaults to `/output`;
  the example above writes them into a local `out/` folder instead.

## Why Golden Buzzer

Build like the buzzer is watching — because one great entry skips the queue.
