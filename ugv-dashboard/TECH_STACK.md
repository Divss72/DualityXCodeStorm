# UGV Perception Dashboard - Technology Stack

## Team: CodeStorm ⚡

---

## Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with Turbopack |
| **React** | 19.x | UI library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Zustand** | 5.x | State management |

---

## UI Components

| Component | Source | Usage |
|-----------|--------|-------|
| **shadcn/ui** | shadcn.com | Button, Card, Switch components |
| **WebGL2 Shader** | Custom | Animated cosmic background |

---

## Browser APIs Used

| API | Purpose |
|-----|---------|
| `navigator.mediaDevices.getUserMedia` | Access phone camera |
| `navigator.mediaDevices.enumerateDevices` | List available cameras |
| `HTMLCanvasElement` | Frame capture, mock camera |
| `WebSocket` | Real-time backend communication |
| `fetch` | REST API calls |

---

## Project Structure

```
ugv-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   └── camera/page.tsx   # Mobile camera page
│   ├── components/
│   │   ├── dashboard/        # Dashboard panels
│   │   └── ui/               # shadcn + shader
│   ├── lib/
│   │   ├── camera/           # useCamera hook, frame capture
│   │   ├── state/            # Zustand store
│   │   ├── network/          # API, WebSocket clients
│   │   ├── parser/           # AI output parser
│   │   └── demo/             # Mock camera, mock AI
│   ├── types/                # TypeScript interfaces
│   └── config/               # API endpoints
```

---

## Key Features

1. **4-Camera Grid** - Front, Rear, Left, Right
2. **AI Perception Display** - Segmentation, alerts, NLP summary
3. **Demo Mode** - Works offline with mock data
4. **Mobile Camera Input** - Phone as camera source
5. **Schema-Tolerant Parser** - Handles unknown AI classes

---

## Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production
npm start
```

---

## Network Access

- **Local**: http://localhost:3000
- **Network**: http://10.72.109.165:3000 (varies by WiFi)
- **Camera Page**: /camera

---

## Known Requirements

- **HTTPS or Chrome Flag** for mobile camera access
- Chrome flag: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`

---

## Dependencies (package.json)

```json
{
  "next": "^16.1.6",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "zustand": "^5.0.3",
  "tailwindcss": "^4.0.0"
}
```
