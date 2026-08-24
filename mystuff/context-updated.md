# FilterAI — Full Project Context

Paste this file at the start of any new AI chat (Claude, Antigravity, Cursor) to restore full project context instantly.

**Status:** Fresh rebuild in progress · **Theme:** Deep Navy / Purple, glassmorphic, animation-heavy
**Team:** 5 members · **Repo:** `filterai-mobile` (GitHub)

---

## 1. Project Overview

FilterAI is an AI-powered recruitment screening mobile app. HR managers, startup founders, and recruiters upload multiple resumes at once, paste a job description, and the app filters, ranks, and helps act on the results — shortlisting, skill-gap analysis, interview questions, offer letters, and rejection emails.

This is a **college project + portfolio piece** (Fiverr/Upwork/Toptal-ready), not a live consumer product.

- No app store launch. Login required (JWT auth, 5 team accounts).
- App opens to a Landing screen → Login/Signup → Home.
- Every screen should look and feel like a real, funded SaaS product — not a student demo.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile App | React Native + Expo (SDK 54, **JavaScript**, not TypeScript) | All screens, UI, file upload |
| State Management | Zustand v5 | Global state across all screens |
| Navigation | React Navigation v7 (Stack + Bottom Tabs, hybrid) | Screen flow |
| Animation | react-native-reanimated v4 + react-native-worklets | All motion — native-thread only |
| Gradients | expo-linear-gradient | Backgrounds, buttons, glow effects |
| Icons | lucide-react-native | All iconography |
| Backend | FastAPI (Python) | API server, orchestrates everything |
| AI Orchestration | LangChain (Python) | Chunking pipeline (local, free) |
| Vector Database | ChromaDB | Resume vector storage, similarity search (local, free) |
| Embeddings | HuggingFace Sentence Transformers | Resume text → vectors (local, free, no API key) |
| LLM | Groq API — LLaMA 3.3 70B | Scoring, summaries, red flags, letters (paid tier only for shortlist) |
| PDF Processing (read) | PyMuPDF (fitz) | Extract text from uploaded resumes |
| PDF Generation (write) | ReportLab | Candidate report PDF |
| Excel Export | openpyxl or pandas | Candidate data export |
| Auth | passlib (bcrypt) + python-jose (JWT) | Password hashing + token auth |
| Database | MongoDB Atlas (free tier) | Users, shared team activity log |
| Email | Gmail SMTP + Python smtplib | Offer letters, rejection emails |
| Deployment | Render (free tier) + UptimeRobot | Backend hosting, keep-alive |
| Version Control | GitHub — repo `filterai-mobile`, branch-protected `main` | Source code |

**Cost: ₹0.** Everything free-tier.

---

## 3. Design System

**Theme: "Monochrome Midnight" — Dark Navy, Purple Accent, Glassmorphic, Cinematic**

This is the actual implemented design language (confirmed from built Landing + Login screens). Component naming convention: shared visual pieces are prefixed `Monochrome*` (e.g. `MonochromeBackground`, `MonochromeFunnelLogo`, `MonochromeZoomingLogo`, `MonochromeGetStartedButton`) and live in `components/landing/`.

| Token | Value | Used for |
|---|---|---|
| Background gradient (top) | `#090C16` | Base screen background |
| Background gradient (mid) | `#0E1324` | Base screen background |
| Background gradient (bottom) | `#080A12` | Base screen background |
| Content background (screen container) | `#0B0F19` | Stack `contentStyle` |
| Primary Accent (gradient start) | `#6366F1` (indigo) | Buttons, focus glow |
| Primary Accent (gradient end) | `#4F46E5` (deeper indigo) | Buttons |
| Logo Gradient — light | `#C084FC` | Funnel logo fill |
| Logo Gradient — mid | `#A78BFA` | Funnel logo fill, "AI" accent text, links |
| Logo Gradient — dark | `#8B5CF6` | Funnel logo fill, glow shadows |
| Text Primary | `#FFFFFF` | Headings, wordmark |
| Text Secondary | `#9CA3AF` | Subtitles, footer text |
| Text Tertiary | `#6B7280` | Tagline, placeholder text |
| Glass Card Background | `rgba(15, 20, 36, 0.75)` | Login form card |
| Glass Card Border | `rgba(99, 102, 241, 0.25)` | Login form card border |
| Input Background | `rgba(10, 14, 26, 0.85)` | Text input fields |
| Input Border | `rgba(255, 255, 255, 0.12)` | Text input fields |
| Ambient wave lines (SVG) | `rgba(139, 92, 246, 0.25)` / `rgba(99, 102, 241, 0.2)` / `rgba(167, 139, 250, 0.15)` | Background decorative waves |
| Logo badge background | `#12162D` | Squircle container behind funnel icon |
| Logo badge border | `rgba(167, 139, 250, 0.35)` | Squircle container border |

**Shape & spacing:**
- Glass card border radius: 24px
- Input field border radius: 14px
- Button border radius: 9999px (full pill)
- Logo squircle badge border radius: 24px
- Screen horizontal padding: 28px

**Background pattern (`MonochromeBackground`):**
- Base: vertical `LinearGradient` (`#090C16 → #0E1324 → #080A12`)
- Top ambient glow: soft purple radial gradient, `rgba(139, 92, 246, 0.15)` fading to transparent, positioned top of screen
- Bottom decorative waves: 3 layered SVG `Path` curves (soft sine-wave lines) in varying purple/indigo opacities, positioned in the bottom ~35% of the screen
- Waves have a slow, looping opacity breathing animation (0.3 → 0.6, 4s duration, sine easing) via `useAnimatedStyle` + `withRepeat`
- This background component is reused behind every screen (`pointerEvents="none"`, `StyleSheet.absoluteFillObject`)

**Logo (`MonochromeFunnelLogo` + `MonochromeZoomingLogo`):**
- Funnel icon: custom SVG path, filled with a diagonal gradient (`#C084FC → #A78BFA → #8B5CF6`)
- Sits inside a squircle badge (dark background `#12162D`, purple-tinted border, drop shadow glow in `#8B5CF6`)
- Landing screen entrance: `MonochromeZoomingLogo` wraps the logo with a ~2s 3D flip-and-zoom entrance (`rotateY` 180°→0°, `rotateX` 25°→0°, `scale` 1.95→1, spring `translateY` settle, fade in), plus a looping soft halo glow behind it that starts after the entrance settles (scale/opacity breathing loop, 2.6s)
- Login screen uses the static `MonochromeFunnelLogo` only (no 3D entrance — smaller, top-of-form placement)

**Primary button (`MonochromeGetStartedButton`):**
- Pill shape, gradient fill `['#6366F1', '#4F46E5']`, white bold text + `ArrowRight` icon (lucide)
- Entrance: `FadeInUp` with configurable delay
- Continuous "breathing" outer glow — blurred gradient halo behind the button, opacity/scale looping (1.8s, ease in-out)
- Press feedback: spring scale down to 0.95 on press-in, spring back to 1 on release, plus a radial white-to-transparent "burst" overlay that scales/fades out on release for tactile feedback
- ⚠️ Known bug to fix: the glow/burst layers use `filter: 'blur(...)'`, which is a **web-only CSS property and does not render on iOS/Android**. Needs to be replaced with `expo-blur`'s `<BlurView>` or a layered-gradient fake-blur before this ships to a real device.

**Typography:**
- Wordmark ("FilterAI"): 40px, weight 900, white, with "AI" in accent purple (`#A78BFA`)
- Screen titles (e.g. "Login"): 32px, weight 800, white
- Subtitle: 16px, weight 500, `#9CA3AF`
- Tagline / footer text: 14px, weight 500, `#6B7280`
- Button text: 17px, weight 700, white

**Motion conventions:**
- Staggered entrance on every screen: `Animated.View entering={FadeInDown.delay(...).duration(600–800)}` per section, delays increasing top-to-bottom (header → form/content → footer)
- All continuous/looping animations (glows, waves, halos) run on `useSharedValue` + `withRepeat`, never `useState` — matches project rule of native-thread-only animation
- Screen-to-screen transitions: `fade` (set at the navigator level)

---

## 4. Screen List (13 screens — right-sized for a 15–20 day, 5-person build)

**Build status as of now: only screens 4.1 (Landing) and 4.2 (Login/Signup) exist.** Everything else below is the target plan, not yet built. Navigation wiring (React Navigation vs. the expo-router currently used in the built files) is intentionally left as-is for now and will be reconciled in a later pass — do not treat §6 below as already implemented.

Organized as **Stack Navigator (root)** wrapping a **Bottom Tab Navigator** (post-login), matching a real enterprise app pattern.

```
Stack Navigator (root)
├── Landing                  ← app opens here, no tabs
├── Login / Signup           ← auth, no tabs
├── Home (Upload)            ← after login, before tabs
└── MainTabs                 ← Bottom Tab Navigator
    ├── Dashboard Tab   → DashboardScreen
    ├── Candidates Tab  → CandidateListScreen
    ├── Activity Tab    → ActivityLogScreen
    └── Profile Tab     → ProfileScreen

Stack screens (pushed from Candidates or Dashboard):
├── CandidateDetail
├── Comparison
├── OfferLetter
├── Rejection
└── Report (PDF/Excel export)
```

### 4.1 Landing
- **Layout:** `ScrollView` not needed — single static hero layout, fits one screen
- **Components:** Logo (animated scale-in), wordmark, subtitle, tagline, "Get Started" gradient button, "Learn more" link
- **Animation:** Aurora blobs (background, looping), floating particles, staggered text entrance, button breathing glow
- **Keyboard:** N/A — no inputs

### 4.2 Login / Signup
- **Layout:** `ScrollView` (with `KeyboardAvoidingView` wrapper — **critical**, form fields must stay visible above keyboard)
- **Components:** Tab toggle (Log In / Create Account), text inputs (Full Name — signup only, Email, Password with show/hide toggle), "Remember me" checkbox, gradient submit button, social login row (optional, decorative only unless implemented), switch-mode link
- **Keyboard handling:** Wrap entire form in `KeyboardAvoidingView` (`behavior="padding"` on iOS, `"height"` on Android) + `ScrollView` with `keyboardShouldPersistTaps="handled"`. Password field especially must not be hidden behind keyboard on smaller devices.
- **Animation:** Staggered field entrance on mount, input border glow on focus, shake animation on validation error

### 4.3 Home (Upload)
- **Layout:** `ScrollView` (with `KeyboardAvoidingView` — JD text input needs keyboard-safe scrolling)
- **Components:** Upload dropzone (tap to pick, `expo-document-picker`, multiple PDFs), uploaded file list (small cards, tap to add/edit email per file), JD paste `TextInput` (multiline), "Analyze" gradient button
- **List rendering:** Uploaded resumes list — use `FlatList` (not `.map()`) since this list can grow up to 100 items; each item staggered `FadeInUp` on add
- **Keyboard handling:** JD `TextInput` is multiline and near the bottom of scroll content — must wrap in `KeyboardAvoidingView` + ensure `ScrollView` auto-scrolls focused input into view (`scrollToFocusedInput` behavior or manual `scrollTo` on focus)
- **Loading state:** Full-screen overlay (not a separate route) with animated progress ring + cycling status text during analysis

### 4.4 Dashboard (Tab)
- **Layout:** `ScrollView`
- **Components:** Stat cards row (resumes screened, match rate trend — small sparkline charts), "Active Job Openings" section, quick-action FAB (+) to jump to Home/Upload
- **List rendering:** Active job openings — `FlatList` if list can exceed ~5-6 items, otherwise plain mapped views inside ScrollView are fine (small, bounded list)
- **Animation:** Stat cards staggered entrance, sparkline line-draw animation on mount

### 4.5 CandidateList (Tab)
- **Layout:** `FlatList` as the screen root (not wrapped in ScrollView — this is the primary case for FlatList: potentially many ranked candidates)
- **Components:** Search bar (sticky header), filter chips (score range, red-flag presence), candidate cards (name, score badge, progress bar) with staggered entrance animation per item
- **Keyboard handling:** Search bar `TextInput` — `FlatList` handles keyboard-safe scrolling natively reasonably well, but set `keyboardShouldPersistTaps="handled"` on the FlatList itself so tapping a result doesn't require a double-tap to dismiss keyboard first

### 4.6 CandidateDetail (Stack push)
- **Layout:** `ScrollView`
- **Components:** Circular animated match-accuracy ring (count-up animation), tab bar (Overview / Skill Gap / Interview Questions / Email), key strengths tag list, skill-gap progress bars (animated fill), red flags list
- **Tab content switching:** Internal tab state (not React Navigation tabs) — cross-fade transition between tab content
- **Keyboard:** N/A unless the Email tab has a compose field — if so, wrap that section in `KeyboardAvoidingView`

### 4.7 Comparison (Stack push)
- **Layout:** Horizontal `FlatList` or `ScrollView horizontal` for the top candidate mini-cards row (max 3, small bounded list — either works, `ScrollView horizontal` is simpler here), main comparison table below in a `ScrollView` (vertical)
- **Components:** Job-role dropdown filter, candidate mini-cards, skill-by-skill comparison table with animated check/cross icons appearing row by row, "Shortlist all above threshold" gradient button, "Export comparison" link
- **Keyboard:** N/A

### 4.8 OfferLetter / Rejection (Stack push, shared screen with tab toggle)
- **Layout:** `ScrollView` (with `KeyboardAvoidingView` if "Edit Template" allows inline text editing)
- **Components:** Tab toggle (Offer Letter / Rejection Letter), AI-generated letter preview (typewriter-style reveal animation on first load), "Edit Template" and "Preview" buttons, "Send & log activity" gradient button, recent-sends list below
- **Keyboard handling:** If letter body becomes editable inline, wrap in `KeyboardAvoidingView` so the send button doesn't get hidden while editing

### 4.9 Report (Stack push or modal)
- **Layout:** `ScrollView`
- **Components:** Preview of combined PDF (top 5 candidates + chart), "Download PDF" button, "Download Excel" button — both download-only, no send option
- **Keyboard:** N/A

### 4.10 ActivityLog (Tab)
- **Layout:** `FlatList` as screen root (activity entries can grow long over time — classic FlatList use case)
- **Components:** Filter chips (All / Screening / Shortlist / Emails), date range selector (7 Days / Today / Month / Custom), timeline-style entries with colored dot + timestamp, staggered entrance per item, "View report" / "View candidate" inline links on relevant entries
- **Keyboard:** N/A unless a custom date range picker needs manual input

### 4.11 Profile (Tab)
- **Layout:** `ScrollView`
- **Components:** Avatar + name/email/role, "Your Activity Overview" stat cards, "Team Activity" mini-feed (small `FlatList` or bounded mapped list — team is only 5 people, so either works, but `FlatList` is more consistent with ActivityLog), "Report Summary" section, "Log out" button (destructive style, red border)
- **Keyboard:** N/A

---

## 5. Keyboard Handling — Project-Wide Rule

**Every screen with a text input must be wrapped in `KeyboardAvoidingView`** from `react-native`, configured as:

```js
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* form content */}
  </ScrollView>
</KeyboardAvoidingView>
```

Screens this applies to: **Login/Signup, Home (Upload/JD input), CandidateList (search bar), OfferLetter/Rejection (if editable), ActivityLog (if custom date input)**.

This was explicitly flagged as a recurring problem to avoid — typing must never be hidden behind the keyboard on any screen.

---

## 6. Navigation Rules

- Never use `SafeAreaView` from `react-native` — always `react-native-safe-area-context`
- Bottom tabs: Dashboard, Candidates, Activity, Profile — icons from `lucide-react-native`, active tab color `#8B5CF6`
- Landing, Login/Signup, Home are Stack screens **outside** the tab navigator
- Deep-action screens (CandidateDetail, Comparison, OfferLetter, Rejection, Report) are pushed onto the Stack from within tabs

---

## 7. Zustand Global State Shape

```js
{
  // Auth
  authToken: null,
  currentUser: null,          // { name, email }

  // Upload state
  uploadedResumes: [],        // [{ name, uri, mimeType }]
  jobDescription: "",
  candidateEmails: {},        // { "filename.pdf": "candidate@email.com" } — auto-extracted + manual fallback

  // Analysis state
  isAnalyzing: false,
  analysisProgress: "",
  analysisComplete: false,

  // Results
  candidates: [],              // full ranked array from backend
  shortlistedIds: [],

  // Selected / comparison
  selectedCandidate: null,
  comparisonCandidates: [],    // max 3

  // Actions
  setAuthToken, setCurrentUser, logout,
  setUploadedResumes, setJobDescription, setCandidateEmail,
  setIsAnalyzing, setAnalysisProgress, setCandidates,
  toggleShortlist, setSelectedCandidate, toggleComparison,
  resetAll,
}
```

Rules: `candidateEmails` is an object, not an array. `resetAll()` runs before every new upload batch. `comparisonCandidates` capped at 3. Never call the API directly from the store — always call from the screen, then update the store.

---

## 8. Backend Pipeline (Phase-by-Phase)

### Phase 1 — Ingestion
`POST /api/upload` → up to 100 resume PDFs accepted → PyMuPDF extracts raw text from each.

### Phase 2 — Local Processing (free, no tokens)
LangChain (`RecursiveCharacterTextSplitter`, 500-token chunks / 50 overlap) → HuggingFace Sentence Transformers embed each chunk locally → stored in ChromaDB (collection reset per upload batch).

### Phase 3 — Matching (pure math, still free)
`POST /api/analyze` → job description embedded → cosine similarity search against all resume vectors in ChromaDB → top 5–10 shortlist selected.

### Phase 4 — AI Scoring (Groq called only for the shortlist)
Shortlisted candidates sent to Groq (LLaMA 3.3 70B) → returns match score, skills/experience/education breakdown, summary, red flags. Every action (analysis, shortlist, offer, rejection) logged to MongoDB's shared activity collection.

### Phase 5 — Owner Actions
- Bottom (non-shortlisted) candidates → auto-rejected via Gmail SMTP, bulk send
- Top 5 → reviewed manually by the logged-in user → Offer Letter (Groq-generated, sent via SMTP) or Rejection (manual, per candidate)
- Combined PDF report (ReportLab) and Excel export — both download-only, no send option

---

## 9. Candidate ID Convention (carried over from prior version — critical)

Backend matches candidates by a normalized name, not filename:

```python
candidate_id = candidate["candidate_name"].lower().replace(" ", "_")
```

Every screen calling a candidate-specific route must compute the ID the same way on the frontend:

```js
const candidateId = selectedCandidate.candidate_name.toLowerCase().replace(/ /g, '_');
```

`candidateEmails` in Zustand stays keyed by `file_name` (mobile-only concept) — this is intentionally different and correct.

---

## 10. Authentication Flow

1. **Signup** — email + password sent to `POST /api/auth/signup` → backend hashes password with `passlib` (bcrypt) → saved to MongoDB `users` collection
2. **Login** — `POST /api/auth/login` → backend verifies hash match → returns a JWT (via `python-jose`)
3. **Token storage** — kept in Zustand (in-memory), attached to every subsequent request as `Authorization: Bearer <token>` header
4. **Protected routes** — FastAPI's `Depends()` decodes/verifies the token before allowing the request through
5. No role-based permissions — all 5 team members see the same shared data (activity log, candidates), simple flat access

---

## 11. Deployment & Infra

- Backend deployed to **Render** (free tier), kept awake via **UptimeRobot** pings
- **MongoDB Atlas** (free tier) for `users` + `activity_log` collections
- Mobile app distributed via **Expo Go QR code** (SDK 54 — confirmed compatible with the App Store version of Expo Go, required for iPad/iPhone demo)
- CORS fully open (`allow_origins=["*"]`) — acceptable for this project's scope

---

## 12. GitHub / Team Workflow

- Repo: `filterai-mobile`, `main` branch protected (PR required to merge — admin/owner can bypass, teammates cannot)
- 5 team members added as collaborators (Write access, not Admin)
- Each member works on their own branch, opens a PR, owner reviews and merges
- Non-technical teammates onboard via: install Git + Node.js (LTS) → `git clone` → `npm install` → `npx expo start` → scan QR with Expo Go

---

## 13. How to Resume in a New AI Chat

Paste this entire file and say: *"I am building FilterAI. Read the context above and help me continue from Phase X. My current status is: [describe where you stopped]."*
