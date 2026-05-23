# Allo Take-Home — Inventory Reservation System

Multi-warehouse inventory reservation service. Units are held for 10 minutes at checkout. The hold confirms on payment or releases on cancellation/expiry.

**Live demo:** https://allo-inventory1-chi.vercel.app

**Try the 409 path:** "Allo Tote Bag" in Mumbai has 1 unit. Open two tabs, click Reserve in both fast — one succeeds, the other shows a sold-out error.

## Running locally

Clone the repo, add DATABASE_URL to .env, then:

    npx prisma migrate dev
    npx prisma db seed
    npm run dev

## How concurrency safety works

The reservation endpoint uses SELECT FOR UPDATE inside a Prisma transaction. This locks the Stock row so concurrent requests serialise — Alice grabs the lock, Bob blocks, Alice commits, Bob reads available=0 and gets 409.

## Concurrency proof

scripts/concurrency-test.ts fires 50 parallel requests at a 1-unit stock row. Result: 1 success (201), 49 conflicts (409). PASS.

## Expiry

Vercel Cron runs daily cleanup. Lazy cleanup also runs inside the confirm handler — if expired, returns 410 immediately without waiting for cron.

## Trade-offs

- Skipped idempotency bonus — would use a unique-constrained IdempotencyKey table
- Daily cron on free Vercel plan — mitigated by lazy cleanup on confirm
- No auth — reservations are anonymous UUIDs# Allo Take-Home — Inventory Reservation System

Multi-warehouse inventory reservation service. Units are held for 10 minutes at checkout. The hold confirms on payment or releases on cancellation/expiry.

**Live demo:** https://allo-inventory1-chi.vercel.app

**Try the 409 path:** "Allo Tote Bag" in Mumbai has 1 unit. Open two tabs, click Reserve in both fast — one succeeds, the other shows a sold-out error.

## Running locally

Clone the repo, add DATABASE_URL to .env, then:

    npx prisma migrate dev
    npx prisma db seed
    npm run dev

## How concurrency safety works

The reservation endpoint uses SELECT FOR UPDATE inside a Prisma transaction. This locks the Stock row so concurrent requests serialise — Alice grabs the lock, Bob blocks, Alice commits, Bob reads available=0 and gets 409.

## Concurrency proof

scripts/concurrency-test.ts fires 50 parallel requests at a 1-unit stock row. Result: 1 success (201), 49 conflicts (409). PASS.

## Expiry

Vercel Cron runs daily cleanup. Lazy cleanup also runs inside the confirm handler — if expired, returns 410 immediately without waiting for cron.

## Trade-offs

- Skipped idempotency bonus — would use a unique-constrained IdempotencyKey table
- Daily cron on free Vercel plan — mitigated by lazy cleanup on confirm
- No auth — reservations are anonymous UUIDs