# ArchGen 3D — Project Knowledge

## Project Overview
- **Type**: Multi-page web application with authentication
- **Product**: ArchGen 3D — AI-powered 2D-to-3D floor plan converter
- **Design level**: Awwwards / Apple product page quality
- **Location**: `c:\Users\VIVEK\Desktop\New folder (6)\`

## Tech Stack
- **Framework**: React 18 + Vite 5
- **Routing**: React Router DOM v7 (`BrowserRouter`)
- **Authentication**: Firebase Auth (Email/Password + Google)
- **Database**: Firebase Realtime Database (user profiles stored as base64-encoded JSON)
- **Animation**: GSAP 3.12 + ScrollTrigger (no Framer Motion)
- **Styling**: Vanilla CSS with CSS custom properties
- **Typography**: Inter (Google Fonts) — weights 400–900; Orbitron (Google Fonts) — weights 400–900 (logo/brand text)

## Firebase Configuration
- **Project**: archgen-3d
- **Auth Providers Enabled**: Email/Password, Google
- **Database URL**: `https://archgen-3d-default-rtdb.firebaseio.com`
- **Storage Strategy**: User profiles encoded as base64 JSON in Realtime Database (free tier compatible)
- **Config File**: `src/firebase.js`

## Image Assets
- **Location**: `H2img/` folder (high-quality PNGs), copied to `public/frames2/` for serving
- **Frame count**: 300 frames (`ezgif-frame-001.png` → `ezgif-frame-300.png`)
- **Content progression**:
  - Frames 1–45: Blueprint wireframe with scattered dots and particles
  - Frames 45–120: Walls assembling, structure forming
  - Frames 120–210: 3D construction — walls, materials, windows
  - Frames 210–270: Near-complete house
  - Frames 270–300: Fully rendered photorealistic modern house with interiors

## Color Palette
### Hero (light mode)
- Background: `#F4F5F7`
- Headings: `#0D1117`
- Body: `#2D3444`

### Body (dark mode)
- Background: `#0B0C10`
- Cards: `#12141A`
- Headings: `rgba(255, 255, 255, 0.9)`
- Body: `rgba(255, 255, 255, 0.6)`

### Accent
- Indigo: `#3457FF`
- Cyan: `#3FD0E0`
- Gradient: `linear-gradient(135deg, #3457FF, #3FD0E0)`

## File Structure
```
├── package.json
├── vite.config.js
├── index.html
├── public/frames2/          (300 PNG frames for hero animation)
├── src/
│   ├── main.jsx             (BrowserRouter + AuthProvider wrapper)
│   ├── App.jsx              (Routes definition — no theme toggle)
│   ├── App.css              (~5700 lines — full design system)
│   ├── firebase.js          (Firebase config + auth/db exports)
│   ├── context/
│   │   └── AuthContext.jsx  (Auth state, login/register/Google, profile CRUD)
│   ├── components/
│   │   ├── Navbar.jsx       (React Router links, auth-aware, profile dropdown)
│   │   ├── Hero.jsx         (canvas + scroll-linked 300-frame animation)
│   │   ├── HowItWorks.jsx   (4-step process strip)
│   │   ├── AIParser.jsx     (pipeline + accuracy table — used on home page)
│   │   ├── ModelViewer.jsx  (3D viewer mockup + features)
│   │   ├── ARVRViewer.jsx   (AR/VR split cards + compat table — legacy, used by ARVRPage)
│   │   ├── ProtectedRoute.jsx (redirect to /login if not authenticated)
│   │   └── Footer.jsx       (React Router links)
│   └── pages/
│       ├── HomePage.jsx     (Hero + HowItWorks + ModelViewer + AIParser)
│       ├── ARVRPage.jsx     (Full AR/VR page: cards, use cases, steps, compat, FAQ)
│       ├── AboutPage.jsx    (Mission, stats, values, technology)
│       ├── ContactPage.jsx  (Contact form + info cards)
│       ├── AuthPage.jsx     (Login/Register sliding panels, Google/social login)
│       ├── AIParsePage.jsx  (Under Construction placeholder)
│       └── ProfilePage.jsx  (Avatar, personal/professional info, inline edit, password change)
└── H2img/                   (original frame source — DO NOT DELETE)
```

## Route Table
| Path | Component | Auth Required | Description |
|------|-----------|:---:|-------------|
| `/` | HomePage | No | Hero animation + features overview |
| `/ar-vr` | ARVRPage | No | Dedicated AR/VR experience page |
| `/about` | AboutPage | No | Mission, values, stats |
| `/contact` | ContactPage | No | Contact form + company info |
| `/login` | AuthPage | No | Login/Register sliding panels |
| `/register` | AuthPage | No | Same component as login |
| `/ai-parse` | AIParsePage | **Yes** | Under Construction (auth-gated) |
| `/profile` | ProfilePage | **Yes** | User profile with inline editing |

## Authentication Flow
1. **Email/Password Registration**: Collects Full Name, Email, Username, Mobile, Password, Professional Role, Company, Country
2. **Email/Password Login**: Email + Password
3. **Google Sign-In**: Auto-creates profile from Google data if first login
4. **Forgot Password**: Sends Firebase password reset email
5. **Profile Storage**: User data encoded as base64 JSON → stored at `users/{uid}` in Realtime DB
6. **Protected Routes**: `ProtectedRoute` component wraps `/ai-parse` and `/profile`

## Navbar Behavior
- **Public (not logged in)**: Home, AR/VR, About, Contact + Login CTA button
- **Authenticated**: Home, AR/VR, AI Parse, About, Contact + Avatar dropdown (Profile, Logout)
- **Home page**: Light→dark crossfade based on scroll position (past hero = dark glass)
- **Other pages**: Always dark glass style
- **Active link**: Gradient underline via `navbar__link--active` class
- **Mobile**: Slide-out panel with same links + auth actions

## Key Design Decisions
1. **GSAP over Framer Motion**: Single animation library, smaller bundle, better scroll perf
2. **CSS sticky over GSAP pin**: More predictable behavior, no pin-spacer artifacts
3. **Base64 profile storage**: Firebase free tier doesn't have Cloud Storage; profile photos stored as base64 data URLs in Realtime DB
4. **Combined Auth page**: Login and Register in a single sliding-panel component (inspired by user's provided HTML)
5. **Under Construction pattern**: AIParsePage is a placeholder with animated gear and feature preview — ready for future implementation
6. **Removed components**: Collaboration.jsx, WhoItsFor.jsx, FinalCTA.jsx deleted from original SPA

## Scroll Stage Mapping (Hero — Home page only)
| Stage | Scroll % | Frames | Copy | Alignment |
|-------|---------|--------|------|-----------| 
| 0 | 0–15% | 1–45 | "Any floor plan. Understood instantly." | Center |
| 1 | 15–40% | 45–120 | "Walls, rooms, and openings — detected." | Left |
| 2 | 40–70% | 120–210 | "Real-world scale, extracted." | Right |
| 3 | 70–90% | 210–270 | "A complete blueprint. In seconds." | Center |
| 4 | 90–100% | 270–300 | "See your blueprint become a house." | Center + CTA |

## Full White UI Redesign (Aug 2026)
**Every page** in the app now uses white/light UI. The dark theme toggle has been removed.

### App.jsx Changes
- Theme toggle button **removed** — no `useState`, no `data-theme` attribute
- `[data-theme="light"]` CSS blocks in App.css are now dead code (safe to remove later)
- Import changed from `useState, useEffect` to just `useEffect`

### EmailJS — Fully Configured
- Service ID: `service_e2blkf9`
- Template ID: `template_4mldipu`
- Public Key: `edOzetw4p8fok_oS6`
- Template variables: `{{name}}`, `{{email}}`, `{{title}}` (NOT `{{subject}}`), `{{message}}`
- SDK loaded dynamically via CDN — no npm dependency
- Public key passed as 4th argument to `send()` (CDN v4 quirk)

### HomePage.jsx
- Hero scroll animation (300 frames) is **unchanged** — still dark
- Sections after hero now wrapped in `.home-sections-light` (was `dark-sections`)
- CSS overrides change all `dark-section__*` text colors to dark-on-white
- Section divider uses `.section-divider--light` variant
- HowItWorks, ModelViewer, AIParser components unchanged — colors overridden via parent CSS

### AuthPage.jsx — Redesigned
- Two-panel layout: slate-blue (`#1E3A5F`) brand panel (left) + white form panel (right)
- Brand panel has blueprint grid pattern (same as About hero)
- Form reuses `contact-form-group` / `contact-form-row` classes from Contact page
- New v2 class names: `auth-page-v2`, `auth-brand-v2`, `auth-tabs-v2`, `auth-submit-v2`, etc.
- Login/Register tab switching, Google + GitHub social buttons
- Forgot Password with reset email flow

### ProfilePage.jsx — Complete Redesign
- **No page-shell dependency** — uses self-contained `.pf-page` wrapper
- Layout: slate-blue `.pf-banner` at top (180px, blueprint grid) → `.pf-body` with negative margin → content overlaps banner
- Hero card (`.pf-hero-card`) overlaps banner with avatar + name + badge + Edit button
- Section cards (`.pf-card`) with icon headers (person, briefcase, gear SVGs)
- All class names use `pf-*` prefix to avoid any conflicts
- Avatar: 80px circle, `#1E3A5F` bg, white border, shadow
- Fields: 2-column grid with uppercase labels, `#D1D5DB` border inputs
- Buttons: `pf-btn--primary` (#1E3A5F), `pf-btn--secondary` (white), `pf-btn--danger` (red)
- Responsive: stacks at 640px breakpoint

### AIParsePage.jsx — White UI
- Shell changed to `page-shell page-shell--light`
- New class names: `uc-section`, `uc-content`, `uc-progress`, `uc-features`, `uc-feature`
- Gear icon stroke changed from gradient to solid #1E3A5F
- Progress bar fill uses #1E3A5F
- Feature cards: white bg with #E5E7EB border

### AboutPage.jsx Sections
1. **Hero** — blueprint grid + wireframe house SVG
2. **Problem → Solution** — two-column comparison
3. **How It Works** — 4-step horizontal process
4. **Tech Badges** — pill-style badges
5. **Values** — 3 cards (Accuracy, Speed, Accessibility)
6. **CTA Band** — primary + secondary button

### ContactPage.jsx
- Full EmailJS integration with form validation
- Two-column: form + info panel (email, response time, social links)

### ARVRPage.jsx
1. **Hero** — "Step inside your floor plan"
2. **AR vs VR** — two side-by-side feature cards
3. **Use Cases** — 2×2 grid
4. **Getting Started** — 3 steps with connected line
5. **Compatibility Table** — with ✓/— SVG icons
6. **FAQ** — card-style
7. **CTA Band**

### Unified Design System
- **Background**: White (`#FAFBFC` / `#fff`), never dark
- **Accent**: Deep architectural slate-blue `#1E3A5F`
- **Hover accent**: `#2B4F7E`
- **Text**: `#111827` (headings), `#4B5563` (body), `#6B7280` (labels), `#9CA3AF` (muted)
- **Borders**: `#E5E7EB` (cards), `#D1D5DB` (inputs)
- **btn-primary**: Solid `#1E3A5F` bg, white text, hover `#2B4F7E` (globally updated)
- **btn-secondary**: White bg, `#D1D5DB` border, hover border `#1E3A5F` (globally updated)
- **Layout**: `max-width: 1100px`, `100px` section padding, breakpoints at 768px / 480px
- **CSS class prefixes**: `about-*` (shared), `contact-*-v2`, `arvr-*-v2`, `auth-*-v2`, `uc-*`
- **All new styles appended to `App.css`** (after line ~4900)

## Notes for Future Sessions
- Read THIS FILE first instead of re-scanning all source files
- The H2img/ folder contains originals — never modify or delete
- The hero canvas renders frames via GSAP ScrollTrigger with `scrub: 0.6` smoothing
- Navbar link behavior changes based on `useLocation()` — home page vs inner pages
- Auth state is managed via React Context (`AuthContext.jsx`) with Firebase `onAuthStateChanged`
- Profile data round-trips: `JSON.stringify` → `btoa` (encode) → Firebase Realtime DB → `atob` → `JSON.parse` (decode)
- The AI Parse page is a placeholder — user will tell when to add functionality
- **Theme toggle removed** — no `data-theme` attribute is set anymore
- **ALL pages now white UI** — home sections use `.home-sections-light` override wrapper
- Hero scroll animation is the only dark element remaining (canvas-based, cannot easily change)
- GSAP ScrollTrigger animations on inner pages use `.reveal` class pattern
- EmailJS template uses `{{title}}` NOT `{{subject}}` — maps to the form's subject dropdown
- Old dark CSS (`dark-section`, `bg-dark-card`, etc.) is still in App.css but overridden

## Auth Error Handling (Aug 2026)
- **Favicon**: SVG favicon at `public/favicon.svg`, referenced in `index.html` — fixes 404
- **Login errors**: `handleLogin` in `AuthPage.jsx` maps Firebase error codes to user-friendly messages
- **Forgot Password**: `handleForgotPassword` trims email, shows loading state, maps error codes

## Auth Updates (Aug 14, 2026)
- **Google Sign-In**: Switched from `signInWithPopup` → `signInWithRedirect` + `getRedirectResult` to eliminate `Cross-Origin-Opener-Policy` console errors. Profile creation for new Google users now happens in a `useEffect` that calls `getRedirectResult(auth)`.
- **Password Reset SMTP**: User configured Gmail SMTP in Firebase Console (`smtp.gmail.com:465`, App Password). `sendPasswordResetEmail` now includes `actionCodeSettings` with `url: window.location.origin + '/auth'` for redirect after reset.
- **Google Fonts**: Updated `index.html` font link to variable font API (`Inter:ital,opsz,wght@0,14..32,100..900`) to fix `.woff2` 404 errors.
- **Console Logging**: Password reset now logs `[ArchGen] Sending password reset to: <email>` and `[ArchGen] Password reset email sent successfully` to browser console for debugging.

## Branding & Logo (Aug 2026)
- **Logo file**: `public/logo.png` — architectural A-house icon in black + blue
- **Typography**: Orbitron font (700/800 weights) for logo text, loaded via Google Fonts in `index.html`. Wide, geometric, futuristic sans-serif — matches the reference image style.
- **Logo text format**: `ARCHGEN` (Orbitron 700, dark/white) + `3D` (Orbitron 800, outlined with `-webkit-text-stroke: 1.5px`)
- **Letter-spacing**: `0.12em` (wider than before to suit Orbitron's geometric proportions)
- **Colors**:
  - Light mode: ARCHGEN = `var(--ink-primary)`, 3D stroke = `#00509E` (royal blue)
  - Dark mode: ARCHGEN = `rgba(255,255,255,0.95)`, 3D stroke = `#5B9BD5` (lighter blue)
- **Navbar**: `.navbar__brand` contains `navbar__logo-img` (36px) + `navbar__logo-text` with `navbar__logo-arch` + `navbar__logo-3d`. Uses `--light`/`--dark` modifier from `textMode`.
- **Footer**: `.footer__logo` contains `footer__logo-img` (40px) + `footer__logo-text` with `footer__logo-arch` + `footer__logo-3d`. Always dark bg, white text.
- **Auth page**: `.auth-brand-v2__title` also uses Orbitron for the "ArchGen 3D" heading on the login/register brand panel.
- **Mobile**: Logo image shrinks to 28px and text to 0.95rem at `max-width: 768px`.

## Related Project: Floor Plan Editor
- **Location**: `c:\Users\VIVEK\Desktop\New folder (8)\`
- **Knowledge file**: `floorplan_knowledge.md` in that directory
- **Purpose**: Preprocessing tool for ArchGen 3D — detects walls/doors/windows in 2D floor plans
- **"Remove Non-Architecture" button**: Makes entire image white, copies ONLY detected architecture pixels from original image
