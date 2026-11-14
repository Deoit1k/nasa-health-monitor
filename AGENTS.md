# NASA Biomedical Telemetry Core — Architecture & Agent Guide

## 1. Technology Stack
- **Markup**: Pure HTML5 (semantic, modular HUD layout)
- **Styling**: CSS3 (custom CSS variables, CSS Grid, Flexbox, glowing neon filters, animations, responsive HUD styling; no preprocessors)
- **Logic**: Vanilla JavaScript (ES6+, zero build tools, no Node.js/npm dependencies)
- **Visualization**: [Chart.js](https://www.chartjs.org/) via CDN (`https://cdn.jsdelivr.net/npm/chart.js`)

---

## 2. File Organization & Responsibilities

The codebase is strictly divided into **UI Layer** and **Business Logic Layer**:

### UI Layer
- `index.html`: Core DOM structure, HUD layout containers, SVG silhouette, Chart.js canvas elements, simulation controls, and protocol panels.
- `css/variables.css`: Global design tokens, color palette (`#050b14` background, `#00e5ff` neon accents, warnings, alerts), typography, glow effects, borders, and spacing tokens.
- `css/layout.css`: Overall HUD grid layout, panels, scanline overlays, responsive breakpoints, header, and telemetry metrics row.
- `js/charts.js`: Chart.js lifecycle management, gradient canvas creation, dataset styling for Radiation Exposure (mSv) & Hydration/Metabolism (%), and interactive body silhouette tooltip handling.

### Logic Layer
- `js/telemetry.js`: Telemetry data generator/stream handler, state management, calculation of biometric indicators, update loops for telemetry cards and charts. *(Reserved for Logic Developer)*
- `js/protocols.js`: Medical protocol engine, action recommendation generators based on radiation, days in orbit, stress, and thermal zone loads. *(Reserved for Logic Developer)*
- `css/components.css`: Component-specific styling: biometric cards, SVG silhouette heat zones, vertical gradient scale, floating HUD tooltip, custom range sliders, select dropdowns, and protocol action cards.

---

## 3. Mandatory Element IDs

All developers and agents must preserve the following element IDs for seamless UI-logic binding:

| Element ID | Category | Description / Target Binding |
| :--- | :--- | :--- |
| `#val-heart-rate` | Metric Value | Astronaut Heart Rate readout (e.g., `72 BPM`) |
| `#status-heart-rate` | Metric Status | Heart rate status badge/text (e.g., `NOMINAL`) |
| `#val-radiation` | Metric Value | Accumulated Radiation exposure readout (e.g., `0.42 mSv`) |
| `#status-radiation` | Metric Status | Radiation risk status badge/text (e.g., `SAFE` / `ELEVATED`) |
| `#val-bone-mass` | Metric Value | Bone Mineral Density (BMD) readout (e.g., `98.4%`) |
| `#status-bone-mass` | Metric Status | Bone mass status badge/text (e.g., `OPTIMAL`) |
| `#val-stress` | Metric Value | Cognitive/Physiological Stress level (e.g., `24%`) |
| `#status-stress` | Metric Status | Stress level status badge/text (e.g., `LOW`) |
| `#sim-preset-select` | Sim Control | Mission scenario preset dropdown (`<select>`) |
| `#slider-radiation` | Sim Control | Radiation exposure rate range slider (`<input type="range">`) |
| `#slider-days` | Sim Control | Mission duration / days in orbit slider (`<input type="range">`) |
| `#slider-stress` | Sim Control | Physiological stress factor slider (`<input type="range">`) |
| `#protocols-container` | Protocol | Action recommendations & countermeasure card container |
| `#zone-head` | Silhouette Zone | SVG Heat Zone: Head / Cranial region |
| `#zone-chest` | Silhouette Zone | SVG Heat Zone: Chest / Thoracic / Cardiopulmonary region |
| `#zone-abdomen` | Silhouette Zone | SVG Heat Zone: Abdomen / Core region |
| `#zone-knees` | Silhouette Zone | SVG Heat Zone: Knees / Musculoskeletal lower limb region |

---

## 4. UI Interaction Contracts

1. **Silhouette & Tooltip**:
   - Hovering over `#zone-head`, `#zone-chest`, `#zone-abdomen`, or `#zone-knees` triggers an active glow on the SVG zone.
   - A floating HUD tooltip appears positioned strictly to the **left** of the cursor.
   - The tooltip displays:
     - **Zone Name / Identifier**
     - **Load Percentage** (`%`)
     - **Local Temperature** (`°C`)
     - **Status** (`NOMINAL`, `ELEVATED`, `WARNING`, `CRITICAL`)

2. **Charts**:
   - `Radiation Exposure (mSv)`: Line chart with deep red neon stroke (`#ff2a55`) and vertical gradient fading to transparent.
   - `Hydration & Metabolism (%)`: Dual/single line chart with electric cyan stroke (`#00e5ff`) and vertical neon cyan gradient fill.
   - Gridlines, axis scales, and tooltips follow the `#050b14` and `#00e5ff` HUD theme.

3. **Simulation Panel**:
   - Controls `#sim-preset-select`, `#slider-radiation`, `#slider-days`, `#slider-stress` dispatch standard `input` and `change` events.
   - The Logic Developer binds to these events inside `js/telemetry.js` and `js/protocols.js` to recalculate biometric states and populate `#protocols-container`.
