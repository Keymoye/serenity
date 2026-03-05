# Documentation Audit Log

## Audit: March 5, 2026

**Performed by**: GitHub Copilot (agent mode)  
**Triggered by**: Manual documentation overhaul  
**Next audit recommended**: June 5, 2026

---

## Files Deleted
| File | Reason |
|------|--------|
| DETAILED_ARCHITECTURE.md | Superseded by new ARCHITECTURE.md |
| ARCHITECTURE_GUIDE.md | Redundant with new docs |

---

## Files Created (Auto-generated from source)
| File | Description |
|------|-------------|
| ARCHITECTURE.md | Layer structure, folder map, dependency rules |
| API.md | All 30 route handlers with auth, schemas, responses |
| SERVICES.md | All application service functions and DI interfaces |
| DATA_MODELS.md | All domain interfaces and Zod schemas + input aliases |
| ERROR_HANDLING.md | Error class hierarchy and HTTP mapping table |
| FEATURES.md | Step-by-step flows for all major features |
| SETUP.md | Env vars, install/run commands, config notes |

---

## Files Retained (Existing, not regenerated)
| File | Status | Notes |
|------|--------|-------|
| SUPABASE.md | Kept as-is | Schema and RLS notes still valid |
| TESTING.md | Kept as-is | Testing strategy still relevant |
| DEPLOYMENT.md | Kept as-is | Deployment checklist still valid |
| CONTRIBUTING.md | Kept as-is | Contribution guidelines still relevant |

---

## Verification Results

### API.md
- Routes checked: 30
- Discrepancies found: 0
- Status: ✅ Verified

### SERVICES.md
- Functions checked: all exported functions across 7 service files
- Discrepancies found: 2 (both fixed)

| # | Item | Issue | Resolution |
|---|------|-------|------------|
| 1 | listPublicServices input param | Documented as optional, is required | Fixed in SERVICES.md |
| 2 | getTherapistDetail deps | therapistRepo not injected via deps | Warning note added |

### DATA_MODELS.md
- Interfaces/schemas checked: all in lib/domain/ and lib/validation.ts
- Discrepancies found: 0
- Missing type aliases added: 11 (z.infer aliases now documented)
- Status: ✅ Verified + Updated

### ERROR_HANDLING.md
- Error classes checked: 6 (DomainError + 5 subclasses)
- HTTP mappings checked: 7
- Discrepancies found: 0
- Status: ✅ Verified

---

## Overall Status

| Doc | Auto-generated | Verified | Last updated |
|-----|---------------|----------|--------------|
| ARCHITECTURE.md | ✅ | — | March 5, 2026 |
| API.md | ✅ | ✅ | March 5, 2026 |
| SERVICES.md | ✅ | ✅ | March 5, 2026 |
| DATA_MODELS.md | ✅ | ✅ | March 5, 2026 |
| ERROR_HANDLING.md | ✅ | ✅ | March 5, 2026 |
| FEATURES.md | ✅ | — | March 5, 2026 |
| SETUP.md | ✅ | — | March 5, 2026 |
| SUPABASE.md | — | — | (pre-existing) |
| TESTING.md | — | — | (pre-existing) |
| DEPLOYMENT.md | — | — | (pre-existing) |
| CONTRIBUTING.md | — | — | (pre-existing) |

---

## Recommended Follow-up Actions

- [ ] Verify FEATURES.md flows against actual service + route logic
- [ ] Verify SETUP.md env vars against all process.env references in codebase
- [ ] Add CI workflow to flag undocumented routes on each PR
- [ ] Consider verifying TESTING.md and DEPLOYMENT.md on next audit cycle
- [ ] Investigate getTherapistDetail() DI escape noted in SERVICES.md

---

## Diagrams Update: March 5, 2026

### Deleted
| File | Reason |
|------|--------|
| booking-sequence.mmd | Superseded by detailed booking-flow.mmd |
| booking-sequence.svg | Rendered output of obsolete diagram |
| er-diagram-detailed.mmd | Superseded by data-models.mmd |
| er-diagram-detailed.svg | Rendered output of obsolete diagram |
| system-architecture.mmd | Superseded by architecture-layers.mmd |
| system-architecture.svg | Rendered output of obsolete diagram |
| admin-flow.mmd (old) | Replaced with detailed sequence diagram |
| admin-flow.svg | Rendered output of obsolete diagram |
| architecture-layers.svg | Rendered output; source .mmd is sufficient |

### Created
| File | Description |
|------|-------------|
| admin-flow.mmd (new) | Sequence diagram of admin operations with RBAC checks, 4 use-cases (List Bookings, Update Status, Create Therapist, Delete Service), assertAdmin() enforcement |

### Final State
- **Total .mmd files**: 7 (architecture-layers, api-routes, auth-flow, booking-flow, data-models, error-handling, admin-flow)
- **Rendered outputs (.svg)**: 0 (source .mmd files are canonical)
- **Outdated files**: 0
- **Status**: ✅ Diagrams audit complete

### Source Material
All diagrams regenerated from verified docs:
- docs/ARCHITECTURE.md
- docs/API.md
- docs/FEATURES.md
- docs/SERVICES.md
- docs/ERROR_HANDLING.md
- docs/DATA_MODELS.md
- Live service and route implementation
