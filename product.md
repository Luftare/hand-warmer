# Hand Warmer PWA — PRODUCT.md

## Purpose

Build a super-simple Progressive Web App that intentionally generates device heat so a user can warm their hands by holding their phone.

The app **does not** control hardware temperature. Heat is generated indirectly by creating sustained CPU and GPU load in the browser.

This document is written as a **build prompt** for an AI coding agent (e.g. Cursor) and contains all requirements needed to implement the product.

---

## Product Scope

- Platform: Mobile-first PWA (works in modern mobile browsers)
- Tech: **Vanilla HTML, CSS, JavaScript only**
- No frameworks, no build tools
- Single-page app
- Offline-capable (basic PWA installability)

---

## User Experience

### Controls (only two)

1. **On / Off toggle**
   - Starts or stops heat generation immediately
2. **Heat Power slider (0–100%)**
   - Controls how much heat is generated

### UX Requirements

- UI must remain responsive at all times
- No visible lag while heating
- Minimal visual design
- Clear indication when heating is active
- Heating mechanism selector: CPU & GPU, CPU Only, GPU Only (use this to activate/disable the different sources of heating)

### Design

- The app illustrates a radiator that shows visually the current behavior
- Large graphical elements that are clearly separated from each other by white space
- Visual feedback: visual pulsating of heatwaves from the radiator when it's heating

---

## Technical Architecture

### Threads & Responsibilities

| Layer        | Responsibility                   |
| ------------ | -------------------------------- |
| Main thread  | UI, user input, state management |
| Web Worker   | CPU-intensive computations       |
| WebGL canvas | GPU-intensive rendering          |

All heavy computation **must not** run on the main thread.

---

## CPU Heating (Web Worker)

### Goal

Generate sustained CPU usage without blocking the UI.

### Requirements

- Use a dedicated `Worker`
- Worker runs an infinite loop while heating is enabled
- Loop performs intentionally expensive math operations
- Work intensity scales with Heat Power

### Control

- Main thread sends messages to worker:
  - `power: 0–100`
- `power = 0` must stop CPU work immediately

---

## GPU Heating (WebGL)

### Goal

Increase device temperature efficiently using GPU load.

### Requirements

- Use a `<canvas>` with a WebGL context
- Canvas may be hidden or minimal in size
- Use a fragment shader that performs unnecessary but expensive math
- Continuously re-render while heating is active

### Power Scaling

Heat Power should influence GPU load by adjusting one or more of:

- Shader iteration count
- Canvas resolution
- Render frequency

GPU heating should contribute more strongly than CPU on capable devices.

---

## Heat Power Model

Heat Power (0–100%) controls **both** systems:

- CPU worker loop intensity
- GPU shader complexity / render load

Turning heating Off:

- Stops worker loop
- Stops rendering loop
- Frees resources

---

## Performance & Safety Constraints

- UI thread must never run heavy loops
- Heating must stop when:
  - User turns Off
  - Page is hidden or unloaded
- Expect OS-level thermal throttling
- High battery usage is expected and acceptable

---

## PWA Requirements

- Basic `manifest.json`
- Installable on mobile
- Works offline after first load
- No background execution when app is closed

Optional:

- Request screen wake lock while heating is active

---

## Non-Goals

- Precise temperature measurement
- Background heating
- Hardware access APIs
- Health or medical guarantees

---

## Disclaimer (must be shown in UI)

- This app intentionally increases device workload
- Prolonged use may cause heat, battery drain, or throttling
- Use at your own risk

---

## Definition of Done

- App loads instantly
- UI remains smooth while heating
- Device becomes noticeably warm within ~30–60 seconds on most phones
- Only vanilla HTML/CSS/JS used
- No console errors

---

## Product Philosophy

Minimal controls. Transparent intent.

**Turn computation into warmth.**
