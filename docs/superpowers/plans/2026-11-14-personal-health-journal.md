# Personal Health Journal Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver a usable local astronaut daily journal with explainable review prompts and a separate simulator.
**Architecture:** Pure HealthDomain module owns validation, storage schema, merge, rules and exports. Journal controller owns persistence and forms; telemetry and protocols render shared snapshots; charts owns visualization and body interaction.
**Tech Stack:** HTML, CSS, vanilla JavaScript, Node built-in tests; no npm dependencies.
**Spec:** ../specs/2026-11-14-personal-health-journal-design.md

## Global Constraints

- Preserve mandatory IDs and UI/logic layer boundaries from AGENTS.md.
- English UI; no application build step or npm runtime dependencies.
- No diagnosis, invented live feeds, or journal/demo mixing. Thresholds are prototype review rules.
- Bound records to 365; manual provenance, consistent units, local-only exports.
- Work on feat/mission-health-workstation; commit, do not push or merge.

## Review Focus

- Storage unavailable/corrupt: keep session usable, protect original data, show recovery.
- Backdated corrections: radiation order remains monotonic across all dated observations.
- Import conflict or malformed metadata: validate atomically; never overwrite existing records silently.
- Missing optional measurements: remain null and gaps, never zero/nominal.
- Edits and UTC date rollover: acknowledgement and task state remain correctly scoped.

### Task 1: Domain and persistence

Files: create js/health-domain.js, js/storage.js, tests/domain.test.cjs, tests/storage.test.cjs.
Interfaces: HealthDomain.empty(), observation(raw, now), upsert(state, record), validateState(raw, now), merge(current, incoming), evaluate(record, previous), csv(records), simulate(inputs). JournalStore.load(storage), save(storage,state,blocked).

- [ ] Write tests for bounds, missing data, dates, chronological dose, edits, imports, acknowledgements, CSV formulas, storage failures and deterministic simulation.
- [ ] Run `node --test tests/*.test.cjs`: expect missing module failure.
- [ ] Implement browser globals plus CommonJS exports; explicit units and schema, reject unknown provenance/version.
- [ ] Run tests: expect all pass. Commit domain/storage.

### Task 2: Journal and presentation

Files: modify index.html, js/telemetry.js, js/protocols.js, js/charts.js, CSS; create js/journal.js, css/journal.css.
Interfaces: JournalApp exposes render(), state(), review(ruleId); Telemetry.render(record,mode), Protocols.render(record,previous,acks,onReview), JournalCharts.render(records,mode).

- [ ] Add integration contract checks for IDs/script assets, emergency/prototype copy and local-only dependencies; run and observe failure.
- [ ] Add form, edit/cancel, history/table trends, checklist, import preview/confirm, backup/CSV, storage recovery, explicit empty state and freshness.
- [ ] Replace static protocols and charts with current state; preserve accessible body zones; simulator controls produce deterministic snapshots without persistence.
- [ ] Test domain suite and browser flows: empty -> invalid -> submit -> review -> edit -> reload -> demo -> journal; keyboard and mobile.
- [ ] Commit the functioning journal.

### Task 3: Offline, documentation and verification

Files: create sw.js; modify README.md; optional local Chart.js + license if download available.

- [ ] Test app-shell asset list and missing-library fallback.
- [ ] Cache local assets via service worker; avoid external fonts; support trend tables if Chart.js unavailable.
- [ ] Document source-to-feature mapping, exact prototype thresholds, units/schema, backup/import behavior, privacy limitations, startup, and demo script.
- [ ] Run complete Node suite, syntax and git diff checks, browser smoke including storage restoration and offline reload. Get fresh whole-branch review; address important findings with regression tests.
- [ ] Commit final verified changes; leave clean feature branch.
