# E2E Test Infra: CyberSafe Online SaaS

## Test Philosophy
- Opaque-box, requirement-driven testing based on `ORIGINAL_REQUEST.md` acceptance criteria.
- Autonomous execution using `./node_modules/.bin/vitest run`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Interaction + Real-World Workload Testing.

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|-------------|:-----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Pitch Cleanup (R1) | R1 § Acceptance | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 2 | Onboarding Tour (R2) | R2 § Acceptance | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 3 | FlashCards Dual Modes (R3) | R3 § Acceptance | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 4 | Vector Logo Integration (R4) | R4 § Acceptance | ≥5 tests | ≥5 tests | ✓ | ✓ |
| 5 | Dark Theme Ergonomics (R5) | R5 § Acceptance | ≥5 tests | ≥5 tests | ✓ | ✓ |

## Test Architecture
- Test Suite Location: `src/test/e2e-requirements.test.ts`
- Runner Command: `./node_modules/.bin/vitest run src/test/e2e-requirements.test.ts`
- Pass/Fail Semantics: Exit code 0, all assertions pass.

## Coverage Thresholds
- Tier 1 (Feature Coverage): ≥25 tests (≥5 per feature)
- Tier 2 (Boundary & Corner Cases): ≥25 tests (≥5 per feature)
- Tier 3 (Cross-Feature Combinations): ≥5 tests
- Tier 4 (Real-World Application Scenarios): ≥5 tests
- Total planned suite: ≥60 tests
