# Roadmap

## Implement `limitless-security.js` (screening + appeal/override system) — in progress
- [x] Verify uploaded file's own test suites pass (screening vectors + override self-test)
- [x] Generate OVERRIDE_SECRET (64 chars) in Lovable Cloud
- [ ] Port screening lab to `src/lib/screening.ts` (client-safe, edge-safe)
- [ ] Port PDF scanner to `src/lib/pdf-guard.server.ts` (node:zlib via nodejs_compat)
- [ ] Port OverrideSystem to `src/lib/override.server.ts` (Supabase-backed store + MemoryStore for tests)
- [ ] Apply database migration (screening_cases, override_audit, redeem_case, audit-append RPC, user_roles/has_role for reviewers)
- [ ] Server functions: screen gate inside study/story/assistant/flowchart flows; appeal filing; reviewer queue
- [ ] PDF scan endpoint `/api/public/scan-pdf` (raw bytes)
- [ ] Client: AppealDialog + handle blocked results on study/flowchart/assistant
- [ ] Reviewer page `/review` (admin role)
- [ ] Tests: port vectors + override self-test as `src/lib/security.test.ts`, run with bun
- [ ] Typecheck + build + e2e verify (clean generate, blocked→appeal→auto-approve→retry)
