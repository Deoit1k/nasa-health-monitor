# Orbit Health

A personal astronaut daily health journal for NASA Space Apps 2026. Record observations, review changes, maintain a routine and prepare a local handover. A separate mission simulator preserves the original interactive body/HUD concept.

**Research prototype, not flight software or a medical device.** No diagnosis, prescribed treatments, NASA endorsement, connected sensors or real Earth communications. Use demonstration data: browser storage and exported files are unencrypted and accessible to anyone using the same browser profile. No observations are uploaded or sent to an AI service.

## Run

Requires Node.js 18+ for the optional local server and tests; no npm installation or build step.

```sh
node server.cjs
```

Open [Orbit Health locally](http://127.0.0.1:8765). To choose another port: `node server.cjs 8766`. The server binds only to loopback and exposes only application assets, not `.git` or journal files. `index.html` also supports basic journal use directly, but service workers require localhost or HTTPS; local-file storage behavior depends on the browser.

After the first successful HTTP load, wait for “Offline cache ready”. Reload once to activate the service worker. Subsequent loads can use the cached shell without the server/network. All runtime assets, including Chart.js 4.4.8 and system fonts, are local. Source links require internet. If the chart library fails, the journal and accessible trend table remain available. The worker caches only public application assets; it never caches observations or external resources. Bump its cache version when shipping a new shell.

## Daily workflow

1. Record observation time, resting pulse, temperature, sleep in the last 24 hours, mood and perceived stress. Use mission-approved measurement techniques and equipment.
2. Optionally enter paired blood pressure, cumulative dose from the same mission dosimeter, total fluid intake and exercise in the last 24 hours, and context.
3. Review prompts explain exactly what triggered them. “Mark reviewed” records acknowledgement, not recovery or medical clearance. Severe symptoms require the mission emergency procedure and crew medical officer, regardless of app output.
4. Check off daily routine items. These are per UTC day and do not represent fitness for duty.
5. Review history and trends. Edit observations to correct errors; corrections invalidate their previous acknowledgements. Readings over 24 hours old are explicitly stale.
6. Download a JSON backup, or CSV observations for handover. Import JSON using the preview and explicit confirmation; nothing changes on validation failure or cancel.

Missing optional measurements stay missing, including gaps in radiation charts. Bone density and local thermal load are not inferred in the journal. Charts connect discrete observed samples and use observation timestamps; sleep and stress use separate labeled axes. The table below the charts gives their exact values.

## Demo script (3 minutes)

- Start from an empty browser profile. Record a fictional check-in with pulse 74 BPM, 36.8 °C, 4.5 h sleep, mood 2/5, stress 75%, dose 12.5 mSv. Explain the sleep, well-being and first-dose review prompts and follow their source links.
- Mark one prompt reviewed and tick a routine item. Reload to show persistence. Edit the record and show that it remains one observation and its review is required again.
- Open Mission simulator, select Solar particle event and adjust the sliders. Dose, modeled body zones, charts and prompts change together. All values are labeled simulated; the charts show one scenario point, not invented historical measurements.
- Return to Personal journal: the original observation remains. Export a backup and import it again: identical records are deduplicated. Change a value under the same ID in a backup to demonstrate conflict protection.
- After offline caching, stop the server and reload to demonstrate local operation.

## Prototype review rules

These rules are **illustrative project choices, not NASA clinical limits**, individual flight-surgeon baselines or validated diagnostic thresholds. The sources below establish relevant risk domains, not these numeric values. No diagnostic health/readiness score is produced.

| Prompt | Trigger |
|---|---|
| Resting pulse | < 50 or > 100 BPM |
| Blood pressure | Systolic < 90 or ≥ 140, or diastolic < 60 or ≥ 90 mmHg |
| Temperature | < 35.5 or ≥ 38 °C |
| Sleep | < 6 h in last 24 hours |
| Well-being | Mood ≤ 2/5 or self-reported stress ≥ 70% |
| Radiation record | First dose observation or any increase since the prior available dose observation; **no safe/unsafe dose threshold inferred** |

Review prompts ask users to confirm readings, check mission-approved guidance and discuss concerns with the crew medical officer. Nominal-looking inputs do not rule out illness.

## Resources used

All five resource links below were verified in the [challenge Resources tab](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources) on November 14, 2026.

| Resource | How it informs this project |
|---|---|
| [NASA: Five Hazards](https://www.nasa.gov/hrp/hazards/) | Hazard explanations in review prompts; autonomy and local operation |
| [NASA: Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) | Sleep, behavioral, cardiovascular, environmental and activity domains |
| [NASA: Ongoing HRP Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | Sleep/well-being observations and consistent longitudinal records |
| [CSA: Radiation Monitoring](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) | Explicit dosimeter provenance, cumulative-dose units and review rather than invented limits |
| [CSA: Why Space Experiments?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp) | Autonomous workflows and delayed access to Earth support |

These are educational references, not a source of live astronaut data. No private astronaut dataset is included.

## Data model and safeguards

Storage key: `astronaut-health-journal-v1`. Schema version: `1`.

- `records`: at most 365 observations, sorted by ISO UTC observation timestamp and ID. Each carries a UUID, `source: "manual"`, an explicit units map, required numeric observations, nullable optional fields and a note of at most 1000 characters. Simulator state is never persisted here.
- Units: heart rate BPM; temperature °C; sleep h; mood 1–5; stress %; pressure mmHg; **cumulative** radiation mSv; fluid mL; exercise min.
- `acknowledgements`: bounded record/rule/timestamp events. Editing a record invalidates its acknowledgements.
- `tasks`: boolean routine items keyed by UTC date, retaining at most 366 dates. Checklist retention does not delete observations.
- Broad input bounds (see `HealthDomain.BOUNDS`) reject implausible data-entry values, not diagnose disease. Pressure requires both values and systolic > diastolic. Dates cannot be future, mood must be a whole number, and dose cannot decrease across the full chronological history, including backdated edits.
- Capacity is never resolved by silently dropping observations. At 365 records, new entries/imports are rejected while existing records remain editable and exportable.
- JSON imports are limited to 2 MB and validated atomically, including units, provenance, duplicates, tasks, review metadata and radiation order. Identical IDs/values deduplicate; conflicting IDs reject the entire merge. Existing review/routine values take precedence on metadata conflicts. A changed journal between preview and confirmation is revalidated.
- CSV quotes text and neutralizes spreadsheet formula prefixes. Imported text is rendered with `textContent`; source links are defined by code, not imported data.
- Corrupt saved data is never overwritten. The original is downloadable for recovery while the new in-memory session can be exported. Storage/quota failures show a persistent warning. A change in another browser tab protects this tab against further writes; export and reload to reconcile.

## Architecture and tests

| File | Responsibility |
|---|---|
| `js/health-domain.js` | Pure schema validation, ordering, merges, review rules, CSV, simulation math; browser + CommonJS |
| `js/storage.js` | Validated local persistence and recovery protection |
| `js/journal.js` | Form/history/checklist/export/import orchestration |
| `js/telemetry.js` | Shared readout rendering and deterministic simulator controls |
| `js/protocols.js` | Explanations, source links, review actions |
| `js/charts.js` | Chart lifecycle, separate axes, missing-value gaps, body pointer/keyboard interaction |
| `sw.js` | Public shell cache only |

Mandatory integration IDs and the existing body SVG are preserved. The original hydration/metabolism chart remains available in simulation; the same canvas displays actual sleep/stress observations in the journal. Pointer tooltips prefer the left of the cursor with viewport clamping; keyboard activation navigates to related inputs. Layout adapts to narrow screens, with focus indicators and reduced-motion support.

```sh
node --test tests/*.test.cjs
```

Tests cover validation, missing data, chronological dose checks, edits, import conflicts, provenance/units, formula-safe CSV, storage corruption/quota failures, deterministic simulation and application-shell contracts. Browser smoke verification is recorded in `docs/verification.md`.

Chart.js is bundled under its [MIT license](js/vendor/Chart.LICENSE.md).

## Toward operational usefulness

Before any use with real crew health data: clinical ownership of personalized thresholds and mission procedures; usability studies with crew; authenticated/encrypted storage and recovery; approved retention and access policy; sensor calibration, quality and provenance adapters; and validated medical-device/flight-software processes. A next integration should ingest timestamped measurements through the same validated domain boundary rather than replacing it with random telemetry. Multi-device or ground handover requires a designed authenticated sync protocol; the current app intentionally has no network submission endpoint.
