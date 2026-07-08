# Workshop Discover UX Phased Plan

## Goal

Move public Workshop browsing from one mixed `/library` surface into a durable discovery model:

- `/discover`: public mixed discovery hub.
- `/skins`: focused cosmetic browse page.
- `/experiences`: maps, custom logic, and addons browse page.
- `/library`: compatibility redirect to `/discover`.

## Acceptance Criteria

- Route and type ownership are documented before implementation starts.
- All new UI uses `@aottg2/ui` primitives and existing Workshop components built on it.
- Every phase requires local Docker plus `agent-browser` evidence before Linear moves to Done.
- Fresh uploads stay visible through newest sections, not only popular/trending ranking.

## Context Links

- Linear parent: `GIS-221`
- Phase 0: `GIS-222`
- Backend API: `/Users/arnelglennjimenez/devfiles/Aottg2-Workshop-back`
- Frontend app: `/Users/arnelglennjimenez/devfiles/Aottg2-Workshop-front`

## Source Of Truth

### Public routes

- `/discover` owns mixed public discovery.
- `/skins` owns cosmetic browsing and skin-specific filters.
- `/experiences` owns playable/behavior content browsing.
- `/library` remains only as an old-link redirect to `/discover`.

### Type groups

Skins:

- `skin_part`
- `skin_set`
- `titan_skin_set`
- `shifter_skin_set`
- `skybox_skin_set`
- `full_preset`

Experiences:

- `map`
- `custom_logic`
- `addon`

Backend already supports `map` and `custom_logic`. `addon` backend support is required in Phase 1 before the frontend can honestly expose addons as an experience type.

### Listing query contract

Keep the existing public browse query shape:

- `q`
- `type`
- `tag`
- `category`
- `slot`
- `target`
- `sort`
- `page`
- `pageSize`

## Steps

1. Phase 0: lock this plan and prove local e2e harness.
2. Phase 1: add backend `addon` asset contract and listing support.
3. Phase 2: add shared frontend taxonomy and reusable browse sections.
4. Phase 3: build `/discover` with popular and newest sections.
5. Phase 4: move focused cosmetic browsing to `/skins`.
6. Phase 5: build `/experiences` for maps, custom logic, and addons.
7. Phase 6: add publish flow for maps, custom logic, and addons.
8. Phase 7: finish redirects, SEO, docs, and full e2e regression.

## Discovery Hub Query Plan

- Featured Skins: skin types, `sort=popular`, `pageSize=12`.
- Featured Experiences: experience types, `sort=popular`, `pageSize=12`.
- Trending Experiences: experience types, `sort=trending`, `pageSize=24`.
- New Uploads: all public types, `sort=newest`, `pageSize=24`.
- New Skins: skin types, `sort=newest`, `pageSize=12`.
- New Experiences: experience types, `sort=newest`, `pageSize=12`.

## E2E Seed Data

Local e2e screenshots should have at least:

- one skin asset
- one map asset
- one custom logic asset
- one addon asset after Phase 1

## Validation

Every phase must prove the local stack before completion:

```bash
cd /Users/arnelglennjimenez/devfiles/Aottg2-Workshop-back
docker compose up -d --build
curl -fsS http://localhost:5011/health/live
cd /Users/arnelglennjimenez/devfiles/Aottg2-Workshop-front
npm run dev:prod-auth
agent-browser skills get core --full
```

Use `agent-browser` against `http://localhost:5173`, capture screenshots for touched routes, then close the browser session and stop local servers/containers.

Run repo checks appropriate to touched files:

- Frontend source changes: `npm run lint`, `npm run build`
- Backend source changes: `dotnet build Aottg2.Workshop.sln --no-restore`, `dotnet test Aottg2.Workshop.sln --no-build`

## Decision Log

- Featured means `sort=popular` for v1. No curated/admin feature system in this migration.
- Fresh post visibility is mandatory; `/discover` includes newest sections.
- Use `@aottg2/ui`; do not add a second UI library or local component fork.
- Keep old links working through redirects/fallback routes.

## Progress Log

- 2026-07-08: Phase 0 plan created from Linear phase tickets.
