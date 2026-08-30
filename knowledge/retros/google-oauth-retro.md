# Retro: Google SSO (login/signup with Google) — 2026-08-30

## What worked

- Direct OAuth (authorization-code + tokeninfo via plain `fetch`, zero new runtime
  deps) satisfies ADR-E001's "real auth only replaces how the cookie gets set" — the
  sessions table, session cookie, guard, and role resolution were untouched.
- `findOrCreateGoogleUser` + migration 006 (`password_hash` nullable) gives both sign
  in and sign up in one upsert path.
- Server-gated button (see `knowledge/patterns/server-gated-feature-flags.md`) lets the
  PR ship credential-free; Day 0 "runs without credentials" invariant preserved.

## Gotcha uncovered while validating

- `verifyLoginPassword` fell through to the repo-known `DUMMY_PASSWORD_HASH` on a NULL
  hash, meaning a Google-only mailbox could in principle authenticate with the dummy
  plaintext. Fixed by early-returning `false` for `password_hash === null` while keeping
  the dummy-hash bcrypt for the "user not found" path (timing parity).
  Lesson: when making something nullable, audit every existing `?? fallback` for it.

## Backlog (deferred, minor)

- OAuth has no automated e2e in CI: full flow needs real Google credentials + consent
  screen. Manual checklist: sign-in existing user, sign-up new user, account-linking
  (same email), state-tamper rejection, email_verified=false rejection, callback
  without code/state.
- `oauth_state` cookie is last-write-wins: parallel browser tabs starting OAuth
  invalidate each other's state. Fix later: per-session state journal or keyed state.
- Rate limit uses one shared `google` bucket for `/api/auth/google` and its callback; a
  burst on one throttles the other. Acceptable; revisit with a real store.
- Pre-existing: `npm run format:check` baseline is dirty under prettier 3.9.6
  (e.g. `src/app/api/auth/login/route.ts`); unrelated to this task but a full
  `prettier --write` on the repo is overdue as a separate chore.
