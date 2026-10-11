# Nature Go

## 1. Project Overview

- **Project name:** Nature Go
- **Type:** Screen-free outdoor exploration and nature-verification web application
- **Purpose:** Encourage users to explore real outdoor environments, complete nature quests, photograph discoveries, and learn nature facts through audio narration.
- **Repository:** https://github.com/RabiaA-arif/NatureGo
- **Live application:** https://nature-go-outdoor-vision-quest.ai.studio/
- **Application title:** Nature Go - Outdoor Vision Quest
- **Primary tagline:** Explore outdoors, snap nature, and keep your daily streak!

## 2. Core User Flow

1. Select a nature quest.
2. Read the quest target, description, and hints.
3. Start the camera only when ready, or upload a photo.
4. Submit the image for vision verification.
5. Receive a verification result with:
   - Valid or invalid status
   - Detected target
   - Confidence score
   - Rejection reason, when applicable
   - Educational nature fact
6. Save a verified discovery to the Nature Log.
7. Update quest completion progress, badges, totals, authenticity score, and daily streak.
8. Continue with another quest or repeat a completed quest after confirmation.

## 3. Main Application Sections

### 3.1 Camera

- Displays the active quest.
- Shows the quest description and current completion status.
- Supports browser camera access.
- Requests camera permission only when the user selects **Start Camera**.
- Supports photo upload as an alternative to the camera.
- Provides a camera close/exit control.
- Provides front/rear camera switching when supported.
- Displays verification results after image analysis.
- Allows the user to save results to the Nature Log.

### 3.2 Quests

- Displays the complete quest catalog.
- Shows completion status and completion count.
- Allows filtering by:
  - All
  - Completed
  - Woods
  - Water & Sky
  - Meadow
  - Tiny Nature
- Displays difficulty levels and quest hints.
- Prompts for confirmation before repeating a completed quest.
- Supports user-created custom quests.

### 3.3 Nature Log / Journal

- Stores verified discoveries.
- Displays discovery photos.
- Displays quest title and target.
- Displays discovery timestamps.
- Displays verification confidence scores and result details.
- Shows journal statistics.
- Shows badge progress and unlocked badges.
- Supports clearing journal entries after confirmation.

### 3.4 Audio Walk / Screen-Free Mode

- Provides audio-based quest guidance.
- Announces the active quest and target.
- Uses browser speech synthesis for narration.
- Supports mute and unmute controls.
- Uses audio feedback for success, rejection, quest acceptance, and camera shutter events.
- Allows the user to keep the device in a pocket or lanyard while exploring.

### 3.5 Profile

- Supports explorer callsign/display name editing.
- Supports avatar/photo information.
- Supports favorite biome selection.
- Supports profile biography editing.
- Displays total completed quests.
- Displays current daily streak.
- Displays longest streak.
- Displays authenticity score.
- Displays recent weekly activity.
- Provides sign-out functionality.

### 3.6 Admin Console

- Provides a separate administrator interface.
- Displays registered explorer profiles.
- Supports explorer profile search.
- Displays completed quests, streaks, roles, and authenticity scores.
- Allows inspection of explorer profiles.
- Allows changing user/admin roles.
- Allows awarding completed quests.
- Supports creating explorer profiles.
- Supports publishing official quests to the explorer catalog.
- Provides administrative task and verification controls.
- Allows switching between the admin console and explorer view.

## 4. Nature Quest Catalog

The application includes **20 default quests** across four nature categories.

### 4.1 Woods

1. **Green Leaf** — Find a real green leaf outside on a tree, bush, or plant in natural daylight.
2. **Tree Bark** — Photograph rough, textured bark on a live outdoor tree.
3. **Pinecone** — Find a pinecone on the ground or on an evergreen tree.
4. **Acorn Nut** — Find a fallen acorn or oak nut outdoors.
5. **Wild Fern** — Find a wild fern growing in shaded outdoor woods or a garden.
6. **Pine Needles** — Find fallen pine needles on the forest floor.
7. **Wild Mushroom** — Find a mushroom or shelf fungus on outdoor logs, bark, or damp soil.

### 4.2 Water & Sky

8. **Moving Water** — Find flowing outdoor water in a stream, creek, pond edge, or fountain.
9. **Clouds in the Sky** — Photograph open sky, clouds, or daylight.
10. **Smooth River Stone** — Find a naturally rounded pebble or stream stone.
11. **Sunlight & Horizon** — Capture outdoor sunrise, sunset, golden-hour light, or twilight sky.

### 4.3 Meadow

12. **Wildflower or Dandelion** — Find a real outdoor flower or dandelion.
13. **Tall Wild Grass** — Find wild grass with visible seed heads.
14. **Outdoor Soil & Dirt** — Photograph real outdoor earth, soil, or ground.
15. **Bird Feather** — Find a wild bird feather outdoors.
16. **Bee or Butterfly** — Observe a live bee or butterfly visiting an outdoor flower.

### 4.4 Tiny Nature

17. **Moss on a Rock** — Find moss growing on a shady rock, boulder, or brick.
18. **Morning Dewdrops** — Find dew drops on grass, leaves, or plant petals.
19. **Outdoor Spiderweb** — Find a spiderweb between outdoor branches, bushes, or rails.
20. **Snail or Shell** — Find a garden snail or snail shell in damp outdoor surroundings.

## 5. Custom Quests

- Users can create a custom outdoor quest.
- A custom quest includes:
  - Target item or subject
  - Optional quest title
  - Automatically generated outdoor description
  - Outdoor-nature hints
  - Medium difficulty by default
- Custom quests are stored per user in browser local storage.

## 6. Expedition Challenges

The application includes **8 challenges** with progress tracking, difficulty levels, and XP rewards.

1. **Forest Trio** — Find a green leaf, tree bark, and pinecone. **350 XP**
2. **Water & Sky Explorer** — Find two water or sky items. **300 XP**
3. **Tiny Nature Wonders** — Find three small nature items such as moss, dewdrops, or a snail shell. **400 XP**
4. **Meadow & Flowers** — Find two meadow items such as a wildflower or tall grass. **280 XP**
5. **Sharp Eye** — Complete four nature quests in clear daylight. **500 XP**
6. **Forest Mushroom & Acorn** — Find a wild mushroom or acorn. **450 XP**
7. **Daily Double** — Complete two quests in one day. **250 XP**
8. **Grand Nature Tour** — Complete at least one quest in all four categories. **750 XP**

## 7. Badges

The application tracks five badges.

1. **First Find** — Find the first nature item outdoors.
2. **Forest Scout** — Find three forest items, including leaves, bark, or pinecones.
3. **Water & Sky** — Find two water or open-sky items.
4. **Clear Daylight** — Complete three verified nature photos with confidence of at least 0.85.
5. **Nature Explorer** — Save five verified finds to the Nature Log.

## 8. Vision Verification

### 8.1 Verification Criteria

The server-side verification system evaluates each submitted image against three criteria:

1. **Target match**
   - Confirms that the requested nature target is visible.
2. **Physical authenticity**
   - Rejects digital screens showing nature.
   - Rejects computer monitors, tablets, and phone wallpapers.
   - Rejects printed photos, book illustrations, and photos of photos.
   - Rejects artificial plastic plants and fake flowers.
   - Rejects indoor houseplants in homes, offices, or living rooms.
3. **Outdoor natural context**
   - Looks for daylight, soil, open atmosphere, natural ground, and surrounding vegetation.

### 8.2 Verification Response

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

### 8.3 Fallback Verification

- The server uses Gemini Vision Intelligence as the primary evaluator.
- A heuristic fallback evaluator is used when the Gemini request fails, times out, or reaches quota limits.
- The fallback includes deterministic demo scenarios for:
  - Real outdoor leaf
  - Real outdoor pinecone
  - Real outdoor bark
  - Open sky and clouds
  - Digital screen spoof
  - Indoor houseplant
  - Artificial plastic plant
  - Wrong target or missing target
- The Gemini request uses structured JSON output and has a 3.5-second timeout.
- Quota failures are temporarily tracked to avoid repeatedly calling an exhausted endpoint.

## 9. Technology Stack

### 9.1 Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Tailwind Vite plugin
- Lucide React icons
- Motion
- Recharts

### 9.2 Backend

- Node.js
- Express
- TypeScript
- TSX runtime
- dotenv

### 9.3 AI and Data Services

- Google Gemini through `@google/genai`
- Firebase Authentication
- Firebase Firestore
- Browser Web SpeechSynthesis API
- Browser Web Audio API

## 10. Project Structure

```text
NatureGo/
├── .env.example
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── AdminDashboard.tsx
    │   ├── AuthModal.tsx
    │   ├── CameraViewfinder.tsx
    │   ├── ChallengesPanel.tsx
    │   ├── FieldJournal.tsx
    │   ├── QuestSelector.tsx
    │   ├── RepeatQuestModal.tsx
    │   ├── ScreenFreeMode.tsx
    │   ├── UserProfileModal.tsx
    │   └── VerificationCard.tsx
    ├── context/
    │   └── AuthContext.tsx
    ├── data/
    │   ├── challenges.ts
    │   └── quests.ts
    ├── firebase/
    │   ├── config.ts
    │   └── firestoreError.ts
    ├── services/
    │   └── userDirectory.ts
    ├── types/
    │   └── nature.ts
    └── utils/
        ├── audio.ts
        └── sampleImages.ts
```

## 11. Data Persistence

### 11.1 Browser Local Storage

The application stores the following locally:

- Cached explorer profile
- Last active user ID
- User-scoped journal entries
- User-scoped badges
- User-scoped completed quest records
- User-scoped custom quests
- Admin-published official quests
- User directory fallback records

### 11.2 Firestore

User data is stored under the following collections and paths:

```text
/users/{userId}
/users/{userId}/discoveries/{discoveryId}
/admins/{userId}
/test/connection
```

Firestore stores and synchronizes:

- User profiles
- Discovery journal entries
- Completed quest totals
- Daily streak information
- Longest streak
- Completion dates
- Authenticity score
- User roles
- Admin designation records

## 12. Authentication

- Google sign-in is supported through Firebase Authentication.
- Instant explorer login is available for quick access and developer previews.
- Admin access uses the dedicated admin login flow.
- User profiles are created or synchronized in Firestore after login.
- Cached local profiles provide continuity when cloud access is unavailable.
- Sign-out removes the active cached profile while preserving stored user records.

## 13. Streak Tracking

- A streak begins when the user completes the first verified quest.
- Completing another quest on the same calendar day maintains the streak.
- Completing a quest on the following calendar day increments the streak.
- Missing more than one calendar day resets the current streak to one after the next completion.
- The application stores current streak, longest streak, last quest date, and recent completion dates.
- Duplicate completion dates are not added more than once.

## 14. API Endpoint

### `POST /api/verify-quest`

#### Request Body

```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg",
  "questTarget": "green leaf",
  "scenarioId": "optional-test-scenario-id"
}
```

#### Successful Response

```json
{
  "success": true,
  "result": {
    "is_valid": true,
    "detected_target": "green leaf on wild tree branch",
    "confidence_score": 0.95,
    "rejection_reason": "null",
    "nature_fact": "Educational nature fact"
  },
  "raw": "{...}",
  "fallback": false
}
```

#### Error Conditions

- Returns HTTP `400` when `imageBase64` or `questTarget` is missing.
- Returns HTTP `500` when `GEMINI_API_KEY` is not configured.
- Returns HTTP `500` when verification fails unexpectedly.

## 15. Environment Variables

Create a `.env` file from `.env.example`.

```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="your-app-url"
PORT=3000
```

- `GEMINI_API_KEY` is required for Gemini Vision Intelligence.
- `APP_URL` identifies the hosted application URL.
- `PORT` controls the Express server port and defaults to `3000`.

## 16. Local Installation

### 16.1 Requirements

- Node.js
- npm
- Firebase project configuration
- Gemini API key

### 16.2 Install Dependencies

```bash
npm install
```

### 16.3 Configure Environment

```bash
cp .env.example .env
```

Add the required environment values to `.env`.

### 16.4 Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 17. Build and Production Start

### Build

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

The production server serves the built Vite application from the `dist` directory.

## 18. Available npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx server.ts` | Start the Express and Vite development server |
| `build` | `vite build` | Build the frontend for production |
| `start` | `node server.ts` | Start the server |
| `preview` | `vite preview` | Preview the Vite production build |
| `clean` | `rm -rf dist server.js` | Remove generated build files |
| `lint` | `tsc --noEmit` | Run TypeScript type checking |

## 19. Firestore Security

- Firestore uses a default-deny rule for unspecified documents.
- Users can read and update their own profile records.
- Administrators can manage user records.
- Users can create and update their own discoveries.
- Administrators can inspect and manage discoveries.
- Admin status is based on the configured administrator email or an admin record in Firestore.
- User and discovery IDs are validated before creation.

## 20. Live Application Verification Scenarios

The deployed app provides demo photo buttons for testing without a camera:

- **Real Nature — Green Leaf:** Expected verified result.
- **Real Nature — Pinecone:** Expected verified result.
- **Fake / Screen — Phone / Tablet Screen:** Expected screen-spoof rejection.
- **Fake / Screen — Plastic Fake Plant:** Expected artificial-plant rejection.

The live interface also visibly includes:

- Camera tab
- Quests tab
- Journal tab
- Audio Walk
- Log In
- Quest change control
- Camera start control
- Photo upload control
- Quest catalog
- Challenge catalog
- Custom quest creation
- Woods, Water & Sky, Meadow, and Tiny Nature filters

## 21. License

Apache-2.0
