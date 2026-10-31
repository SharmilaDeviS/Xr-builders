# XR Builders – Angular

Pages (routes)
- `/`                      → XrBuilderComponent (main XR Builders site)
- `/vr-welding-simulator`  → VrWeldingSimulatorComponent (separate page)

Run
1. Copy your original `image/` folder into `public/image/` (needs `XR-logo.png`).
2. `npm install`
3. `npm start`  → http://localhost:4200

Build: `npm run build` → `dist/xr-builders/browser`
Hosting note: configure the server to fall back to index.html so refreshing /vr-welding-simulator works.
