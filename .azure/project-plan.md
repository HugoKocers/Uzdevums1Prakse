# Timber Beam Load-Capacity Calculator

## Goal

Create a Latvian-language Windows desktop application for calculating the uniformly distributed load capacity of a timber beam, visualizing its geometry, and saving calculation history.

## Approved scope

- Electron Forge desktop shell with Vue 3 and TypeScript.
- Inputs in meters and kPa, initialized to `L = 6`, `B = 0.1`, `H = 0.3`, and `f = 20000`.
- Validate that all inputs are finite and positive.
- Keep calculation logic in the Electron/Node backend and expose it to the UI through a narrow IPC API.
- Use `W = B * H^2 / 6` and `q = 8 * f * W / L^2`. Display `q` in kN/m.
- Render an interactive Three.js beam that updates when `L`, `B`, or `H` changes.
- Store calculation inputs, results, and timestamps in a local SQLite database; show saved calculations in the UI.
- Provide a separate local-development Node.js license API backed by SQLite. The desktop app checks the user's email/license before opening the main workspace. Clearly label this as a development prototype, not production-grade remote licensing.
- Include focused tests and instructions for running the desktop app and local license API.

## Out of scope

- Structural design certification, code-compliance checks, or engineering approval.
- Hosted production license infrastructure, user identity provider, license administration portal, installers/signing, and auto-updates.
- Additional structural checks such as deflection, shear, self-weight, or safety factors.

## Engineering note

The calculation assumes a simply supported beam under a uniformly distributed load, with `f` interpreted in kPa (kN/m^2). The result is a simplified bending-strength estimate in kN/m and is not sufficient by itself for real-world structural design.
