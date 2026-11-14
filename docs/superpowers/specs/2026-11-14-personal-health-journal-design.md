# Personal astronaut health journal

Status: approved by user. Date: 2026-11-14.

## Intent and chosen approach

Help an astronaut perform a short daily health check, understand changes, and prepare a useful handover to the crew medical officer. The user selected daily self-monitoring and a personal onboard journal with a separate demo mode.

Approaches considered:

1. **Personal onboard journal (selected):** actual user-entered observations, persistent history, understandable review prompts, daily tasks, export, and a separate simulator. More work in data handling, but useful beyond a presentation.
2. **Expanded simulator:** more animated telemetry and scenarios using the current HUD. Quicker visual demonstration, but does not support longitudinal self-monitoring well.

## Existing project and constraints

- Keep semantic HTML, modular CSS, vanilla JavaScript, and no application build step or npm runtime dependencies.
- Preserve all mandatory IDs and layer boundaries from `AGENTS.md`.
- `telemetry.js` and `protocols.js` are currently placeholders. Charts and medical actions are static examples.
- Retain the body silhouette and dark cyan/red chart language. Improve readability, responsive layout, focus states, and reduced-motion behavior.
- Use English UI to match the existing project and international challenge. Explain implementation to the user in Russian.
- Work on `feat/mission-health-workstation`, commit the deliverable, and leave integration to the team. No automatic push or merge.

## Goals

1. A functioning end-to-end daily check-in, history, review, task, and export workflow.
2. Clear provenance: manual observations are distinct from simulated values and illustrative model estimates.
3. Explain why a result needs attention, show the triggering value and rule, and link the relevant challenge resource.
4. Work locally without a backend and, after an initial successful load over localhost/HTTPS, without network access.
5. Test the health rules, validation, persistence, exports, and core browser interactions.

## Non-goals and anti-goals

- No diagnosis, treatment prescription, medical-device certification, or claims of NASA endorsement.
- No invented live sensor, Earth communications, AI clinician, or spacecraft-control integration.
- No bone-density or hydration measurement inferred from unrelated observations in journal mode.
- No mixing demo records into the personal journal, silent data loss, or presenting missing data as normal.
- No real health records in repository fixtures. This local prototype is for demonstration data; it has no authentication or encryption at rest.

## Product flow

### 1. Journal is the default

The header identifies the personal journal and provides Journal / Simulation navigation. A compact summary shows latest observation time, data freshness, and active review prompts. An empty journal shows a helpful empty state, never prefilled fake results.

The existing four mandatory vital cards remain. In journal mode, heart rate and cumulative radiation display entered observations, with units BPM and mSv. Bone density is unavailable without a measurement, and stress is explicitly a self-report. Additional journal summaries show temperature, blood pressure, sleep, mood, fluid intake, and exercise. Optional omissions show “Not recorded”.

### 2. Daily check-in

An accessible form collects observation time (editable, default now), resting heart rate, temperature, sleep duration, mood (1–5), self-reported stress (0–100), optional systolic/diastolic pressure as a pair, optional cumulative dosimeter reading in mSv, daily fluid intake in mL, exercise minutes, and a short note. Sleep, mood, stress, heart rate, and temperature form the required daily check; optional fields may remain empty.

Validation rejects nonnumeric/nonfinite data, invalid paired pressure, impossible input ranges, invalid/future timestamps, oversized notes, and decreasing cumulative radiation relative to chronological neighboring observations. These broad input bounds are data-quality checks, not health thresholds. Corrections are supported by editing a selected record. Exported backups can be imported after full validation and an explicit preview; importing merges by record ID, with conflicts reported rather than silently overwritten. Record data remains unchanged if import fails.

### 3. History and trends

Keep at most 365 observations, sorted by observation time. Display a recent-record list with edit actions. Charts use actual timestamps and actual journal observations: cumulative radiation and sleep/stress trends, with missing values shown as gaps. Never interpolate missing medical measurements. Show a tabular/text equivalent for chart information and a comparison with the prior observation when available. A reading older than 24 hours is explicitly stale.

### 4. Review prompts and tasks

Replace the static “execute protocol” examples with explainable review prompts. Categories: cardiovascular observation, temperature, sleep/recovery, self-reported mood/stress, and radiation-record review. Every prompt includes the observed value, the illustrative rule that fired, the related hazard, an explanation, a source link, and a “Reviewed” action. Reviewing records an acknowledgement timestamp; it does not clear the underlying finding. A new or edited observation has its own findings and requires its own acknowledgement.

All threshold rules are clearly marked **prototype review rules, not NASA clinical limits**. Resource pages inform risk domains, not numerical diagnostic cutoffs. Prompts ask users to confirm readings, review their mission-approved guidance, and consult their crew medical officer. Do not recommend drugs, doses, or improvised procedures. Serious reported symptoms are handled by a visible reminder to follow the mission emergency procedure and contact the crew medical officer rather than waiting for an app score.

A daily checklist supports measurement completion, planned exercise, and a well-being check. Progress is saved per UTC date and is independent of medical status. No diagnostic “readiness score”.

### 5. Simulation remains available

Existing scenario selector and three sliders drive deterministic simulated indicators, body zones, charts, and review prompts. Radiation slider and card consistently represent **cumulative mSv**; there is no implied rate or automatic accumulation from wall-clock time. Scenario/day/stress changes update the entire screen from one state snapshot. The simulator supports reset and pause/resume if animated samples are added. All modeled bone/thermal/hydration estimates are visibly illustrative. In journal mode the body acts as keyboard-accessible navigation to related observations, not as a fake thermal scan.

### 6. Local persistence, export, offline behavior

Use a versioned localStorage document for observations, acknowledgements, and checklist state. Validate stored data on load. Report blocked/quota-exceeded storage and preserve the in-memory working session. Do not silently replace malformed saved data; offer an actionable recovery message and export of the stored original when possible.

JSON backup contains schema version, observations with timestamps/units/provenance, acknowledgement events, and daily tasks. CSV exports observations with formula-injection protection. Both exports are local downloads; no network upload. Explain local-only storage and its lack of encryption; recommend demonstration data for the prototype. No destructive reset of journal data is needed in this iteration.

A service worker caches the application shell on localhost/HTTPS. Pin and bundle Chart.js if obtainable from the established CDN, preserving its license. Remove external font dependence and use local system fonts. If Chart.js cannot be bundled, journal workflows and accessible trend tables must still work offline, with a clear chart fallback. Opening `index.html` directly supports the basic journal, but offline installation requires the documented local HTTP server.

## Architecture (builder decisions)

- Add a pure, browser/Node-compatible health-domain module for schemas, validation, rule evaluation, ordering, and CSV generation.
- Implement the simulator and shared state/controller binding in `js/telemetry.js`.
- Implement source-backed prompt definitions/rendering and review interactions in `js/protocols.js`.
- Keep chart lifecycle and keyboard/pointer silhouette interaction in `js/charts.js`.
- A separate journal controller/storage module may be added to avoid overloading telemetry responsibilities.
- Render user text with `textContent`, never untrusted HTML. Do not let imported data supply arbitrary source URLs.
- Bound storage, notes, import size, records, and history tables. Define deterministic import conflict policy.
- The builder chooses exact demonstration thresholds, UI arrangement, and internal module interfaces, documenting them in README and tests. Any numerical rule remains explicitly illustrative.

## NASA / partner resources and intended use

These are the actual links read from the challenge Resources tab on 2026-11-14:

1. [Challenge and Resources](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources): self-assessment workflow, inputs, interactive body, trends, routine actions.
2. [NASA: 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/): map journal domains to radiation, isolation, distance from Earth, gravity, and closed environment; source of educational explanations.
3. [NASA: Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/): organize sleep, behavioral, cardiovascular, and musculoskeletal review domains.
4. [NASA: Ongoing HRP Research in Space](https://www.nasa.gov/hrp/ongoing-hrp-research/): context for recording sleep, well-being, and consistent longitudinal observations; not a public clinical telemetry feed.
5. [CSA: Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp): motivate dosimeter provenance and careful radiation units; not a source of numeric personal safety limits.
6. [CSA: Why Do We Conduct Science Experiments in Space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp): explain autonomy and communication constraints.

No claim that these pages validate the prototype's numerical rules or make its outputs suitable for flight use.

## Acceptance and verification

- Initial journal is empty; submit a valid check-in and see matching values, timestamp, history, trend points, and explanations.
- Reload restores journal/checklist/review state. Demo controls never alter saved journal observations.
- Empty optional values, stale readings, out-of-range values, edits, failed imports, duplicate IDs, and storage failures have explicit handling.
- Exports preserve values, units, time, and provenance; a valid JSON backup can be restored without silent overwrites.
- Keyboard interaction reaches all form controls and body zones. Narrow/mobile layouts remain usable.
- No unsupported static medical recommendations or fake communications remain.
- Domain tests run with the Node built-in test runner, with no npm install. Browser smoke checks verify submit/edit/reload/demo separation and responsive/offline behavior where available.
- README documents startup, demo script, source-to-feature mapping, rule limitations, data model, and next steps toward real sensor integration and clinical validation.
