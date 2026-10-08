# Nature Go — Outdoor Vision Quest 🌿🧭

> **A screen-free outdoor exploration app powered by Vision Intelligence to verify real natural discoveries and guide expeditions with audio narration.**

🔗 **Live Demo:** [https://nature-go-outdoor-vision-quest.ai.studio](https://nature-go-outdoor-vision-quest.ai.studio)

---

## 📖 Overview

**Nature Go** is an outdoor adventure application designed to encourage explorers of all ages to step outside, observe the natural world, and complete quests screen-free. 

Using an AI-powered **Vision Intelligence System**, the app verifies incoming camera captures against physical authenticity criteria, ensures the user is genuinely outdoors in daylight, filters out fake plastic or screen spoofs, and plays an educational nature fact aloud so users can keep their eyes off their devices and on the trees, soil, and sky.

---

## ✨ Key Features

### 1. 👁️ Primary Vision Intelligence & Anti-Spoof System
The core verification engine checks every snapshot across three rigorous criteria:
1. **Target Match**: Confirms whether the requested object/scene (e.g., *green leaf*, *tree bark*, *pinecone*, *running water*, *sky and clouds*) is present in the frame.
2. **Physical Authenticity (Anti-Spoof)**:
   - ❌ **Rejects** photos taken of digital displays, computer monitors, tablets, or phone wallpapers.
   - ❌ **Rejects** printed book illustrations or photos of photos.
   - ❌ **Rejects** fake synthetic plastic plants or artificial flowers.
   - ❌ **Rejects** indoor houseplants inside offices or living rooms.
3. **Outdoor Natural Context**: Confirms real outdoor sunlight, soil, open atmosphere, and wild flora surroundings.

### 2. 📸 Privacy-First Camera Launcher & Close Controls
- **Never Auto-Opens Camera**: Starting or choosing a quest displays a clean quest briefing card and waits for the user to explicitly tap "Start Camera".
- **Permission On-Demand**: Requests browser camera permissions only when the user is ready to snap their outdoor target.
- **Instant Close / Exit Button**: A prominent Close Camera (`X`) button in the top-right corner and bottom action bar immediately stops all media tracks and turns off webcam hardware anytime.

### 3. 🎧 Screen-Free "Pocket Audio Walk"
- **Eyes-Free Exploration**: Explorers can put their phone in their pocket or lanyard. The app speaks quest directions and targets aloud.
- **Tactile Full-Screen Shutter**: Tap anywhere on the dimmed screen with haptic feedback to snap a photo when you spot your target.
- **Immediate Audio Readout**: Automatically narrates the discovery results and fascinating nature facts using natural voice speech synthesis.

### 3. 🧪 1-Click Interactive Test Lab
Instant simulations for first-time users or indoor testing:
- 🌲 **Real Outdoor Pinecone**: Authentic conifer scales on a forest needle floor *(Expected: Verified)*
- 🍃 **Real Green Leaf**: Wild branch foliage in natural sunlight *(Expected: Verified)*
- 📱 **iPad Display Screen**: Photo of a tablet showing nature wallpaper *(Expected: Screen Spoof Rejected)*
- 🪴 **Indoor Houseplant**: Snake plant in a living room ceramic pot *(Expected: Indoor Plant Rejected)*
- 🌵 **Artificial Plastic Plant**: Synthetic desk succulent *(Expected: Fake Plant Rejected)*
- 🛣️ **Asphalt Road Ground**: Aiming downward instead of at sky *(Expected: Target Missing Rejected)*

### 4. 📖 Explorer Field Journal & Badges
- **Discovery Catalog**: Stores timestamped photos, target names, verification scores, and educational facts.
- **Achievement Badges**:
  - 🌱 **First Sprout**: Verify your first outdoor discovery.
  - 🌲 **Woodland Scout**: Spot 3 forest treasures (leaves, bark, pinecones).
  - 🌊 **Sky & Stream Seeker**: Find outdoor water or open clouds.
  - 🛡️ **Wilderness Pure**: Pass 3 anti-spoof checks with >85% confidence.
  - 🧭 **Master Naturalist**: Log 5+ verified species in the journal.

### 5. 🎯 Quests Catalog & Custom Targets
- Pre-built quests across Forest, Meadow, Sky & Water, and Micro-Nature biomes.
- **Custom Quest Creator**: Parents, teachers, and adventurers can define any custom target (e.g., *"oak acorn"*, *"dandelion clock"*, *"river pebble"*).

### 6. 👤 User Login, Profiles & Cloud Progress Sync
- **Firebase Authentication & Firestore Database**: Sign in via Google or instant 1-click Explorer login to save data in the database for easy access next time.
- **Daily Nature Streak Counter**:
  - Tracks consecutive calendar days where a user completes at least one verified nature quest.
  - Automatically handles day-to-day transitions, increments on consecutive days, prevents duplicate counts on the same day, and updates all-time personal best streaks.
  - Displays a dedicated streak flame card, status advisories, and a rolling 7-day weekly activity tracker directly inside the User Profile Modal.
- **User Profile Management**: Manage callsign, avatar, favorite biomes, bio, and review real-time quest completion stats & streak days.
- **Automatic Task Synchronization**: Every verified outdoor find is recorded in Firestore (`/users/{userId}/discoveries`), syncing progress across sessions.

### 7. 🛡️ Nature Admin Dashboard
- **Admin Authentication**: Dedicated admin access (`rabiaarifai55@gmail.com`) with administrative privileges.
- **Explorer Directory**: Inspect all registered explorers in Firestore, their completed tasks, streak, authenticity score, and role.
- **Profile Builder**: Admin can create and save new explorer profiles directly into the database.
- **Mission Dispatcher**: Deploy brand-new official outdoor quests directly into the explorer catalog.
- **Task & Verification Controls**: Award completed tasks, inspect anti-spoof flags, and adjust permissions.

---

## 🛠️ Technical Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Express on Node.js running full-stack alongside Vite dev server.
- **Vision Intelligence**: Server-side `@google/genai` TypeScript SDK invoking `gemini-3.8-flash` with structured JSON schema output and intelligent heuristic fallback.
- **Audio Synthesizers**:
  - Client-side Web SpeechSynthesis API for instant, latency-free ranger voice narration without quota exhaustion.
  - Web Audio API oscillators for synthesized nature chimes (quest accept chime, camera shutter snap, victory arpeggio, spoof alert tone).

---

## 📡 Vision Intelligence API Specification

### Endpoint: `POST /api/verify-quest`

#### Request Body
```json
{
  "questTarget": "green leaf",
  "imageBase64": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg",
  "scenarioId": "optional-test-scenario-id"
}
```

#### Response Format (Strict JSON Schema)
```json
{
  "success": true,
  "result": {
    "is_valid": true,
    "detected_target": "green leaf on wild tree branch",
    "confidence_score": 0.95,
    "rejection_reason": "null",
    "nature_fact": "Leaves contain millions of microscopic chloroplasts that convert outdoor sunlight into chemical energy and oxygen through photosynthesis."
  }
}
```

#### Rejection Example (Screen Spoof)
```json
{
  "success": true,
  "result": {
    "is_valid": false,
    "detected_target": "digital tablet screen displaying leaf wallpaper",
    "confidence_score": 0.15,
    "rejection_reason": "Screen spoof detected: Digital device bezel and display pixels observed",
    "nature_fact": "Real outdoor leaves absorb natural sunlight, unlike digital screen pixels."
  }
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📜 License
Apache-2.0
