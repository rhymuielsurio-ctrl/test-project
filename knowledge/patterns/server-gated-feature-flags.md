# Server-gated feature flags (no NEXT_PUBLIC_* for capability)

**Context:** A runtime-dependent capability that also gates secrets (e.g. "is Google
OAuth configured?") must never be decided in the browser.

**Constraint:** `NEXT_PUBLIC_*` vars ship to every client bundle. Use them only for
values that are safe to expose (public keys, API bases). A secret-backed capability
must have **one source of truth: the server**.

**Pattern proven 2026-08-30 (Google SSO):**

- Route handler enforces the capability server-side and throws
  `AppError("CONFIGURATION_ERROR", …, 500)` when environment is absent — never a stub.
- The server page reads the capability (`isGoogleAuthConfigured()`) and passes a plain
  boolean prop to the client component. Button visibility therefore can never diverge
  from endpoint behavior.
- Result: login page degrades gracefully and the client ships zero environment data.

**Rule of thumb:** if the flag affects authz or secret handling, gate it in a route
handler AND mirror it to the UI via a server-rendered prop; if it only affects UX,
`NEXT_PUBLIC_*` is acceptable.
