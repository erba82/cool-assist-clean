# Cool-Assist - HVAC-R Design Assistant

AI-powered refrigeration system design tool with intelligent P&ID generation and 3D visualization.

## Features

- 🤖 **Smart AI Chat** - Conversational interface with automatic intent detection
- 📐 **Refrigerant-Aware P&ID** - Generates correct diagrams for R717, R744, R404A, etc.
- 🎨 **2D P&ID Generation** - Professional ISO 10628 compliant diagrams
- 🌐 **3D Visualization** - Interactive 3D model synchronized with 2D layout
- ⚡ **Energy Analysis** - Efficiency recommendations and cost calculations
- 🌍 **Regional Standards** - ASHRAE, ISO compliance checking

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 20.x)
- **npm** 8+  
- **Git**

### Installation

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd cool-assist-clean
   ```

2. **Install Backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup Environment:**
   ```bash
   cd ../backend
   cp .env.example .env
   ```
   Edit `.env` and add your API keys (optional for AI features)

5. **Run Application:**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```

6. **Open Browser:**
   Navigate to `http://localhost:3001`

---

## Project Structure

```
cool-assist-clean/
├── backend/                # Node.js/Express API server
│   ├── core/              # Core calculation engine
│   │   ├── ai/           # AI orchestrator & intent classifier
│   │   ├── modules/      # Domain modules (refrigeration, energy, etc.)
│   │   └── rendering/    # P&ID generation engine
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic services
│   ├── data/             # Reference data & standards
│   └── server.js         # Entry point
│
├── frontend/              # React + TypeScript UI
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── 3D/      # 3D visualization
│   │   │   └── symbols/ # P&ID symbols
│   │   └── App.tsx      # Main app
│   └── public/           # Static assets
│
└── package.json
```

---

## API Endpoints

### Core Design API

**POST** `/api/chat/message`  
Smart endpoint - auto-detects question vs design request

```json
{
  "message": "Design 500-ton ammonia cold storage in Dubai",
  "sessionId": "user-session-1"
}
```

**POST** `/api/core/design`  
Direct design endpoint with refrigerant override

```json
{
  "message": "200-ton cold storage",
  "refrigerant": "R744"
}
```

---

## Configuration

### Backend (.env)

```env
# Optional - AI features
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional - Database
MONGODB_URI=mongodb://localhost:27017/coolassist
NEO4J_URI=bolt://localhost:7687
```

### Frontend

Proxy configured in `webpack.config.js`:
```javascript
proxy: {
  '/api': 'http://localhost:5000'
}
```

---

## Development

### Backend

- **Start dev server:** `npm run dev` (with nodemon)
- **Start production:** `npm start`

### Frontend

- **Start dev server:** `npm start`
- **Build production:** `npm run build`

---

## Key Technologies

**Backend:**
- Express.js
- Custom refrigeration calculation engine
- ISO 10628 P&ID generator
- @google/generative-ai (optional)

**Frontend:**
- React 18 + TypeScript
- Material-UI (MUI)
- Three.js + React Three Fiber
- Recharts for energy visualization

---

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (need 18+)
- Verify dependencies: `npm install`
- Check port 5000 is free: `netstat -ano | findstr :5000`

### Frontend compilation errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript: `npx tsc --noEmit`

### P&ID not showing
- Check browser console for errors
- Verify backend API is running
- Check pidData in network tab

### 3D view blank
- Supported browsers: Chrome, Edge, Firefox (latest)
- WebGL required - check: `chrome://gpu`

---

## License

ISC

---

## Support

For issues or questions, please create an issue in the repository.
