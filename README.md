# Hand Warmer PWA

A Progressive Web App that generates device heat by creating CPU and GPU load.

## Quick Start

### Running Locally

This app requires a local web server (not `file://` protocol) for full functionality:

**Option 1: Python (if installed)**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Node.js (if installed)**
```bash
npx http-server -p 8000
```

**Option 3: PHP (if installed)**
```bash
php -S localhost:8000
```

Then open: `http://localhost:8000`

### Features

- **On/Off Toggle**: Start/stop heat generation
- **Heat Power Slider**: Control intensity (0-100%, default 30%)
- **Heating Mechanism**: Choose CPU & GPU, CPU Only, or GPU Only
- **Screen Wake Lock**: Keeps screen on while heating
- **PWA Installable**: Can be installed on mobile devices

### Notes

- Web Workers and Service Workers require `http://` or `https://` protocol
- GPU heating works even without Web Workers (uses WebGL)
- For full functionality, use a local server or deploy to a web host

### Generating Icons

1. Open `generate-icons.html` in your browser
2. Click download buttons to save `icon-192.png` and `icon-512.png`
3. Place icons in the project root directory

