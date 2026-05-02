# Zibo's Cosmic Quest

A 2D side-scrolling jump'n'run for kids 5+, controlled with keyboard or a LEGO Powered Up Remote (88010) over Web Bluetooth.

See [SPEC.md](./SPEC.md) for the full design document.

## Run

ES modules need to be served over HTTP. Pick one:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve

# PowerShell + .NET
# (any local static server works)
```

Then open `http://localhost:8000/` in Chrome or Edge.

## Controls

- **Keyboard**: Arrow keys / WASD to move, Space or Up to jump, Shift for power-up, Esc to pause.
- **LEGO Powered Up Remote**: Click "Connect Controller" on the title screen.
  - Left `+` / `–`: walk right / left
  - Right `+`: jump (hold for higher)
  - Right red center: use power-up
  - Left red center / green button: pause
