# Portfolio Improvements Roadmap

A prioritized list of enhancements organized by impact and effort.

---

## Completed

- [x] Glassmorphism design overhaul
- [x] Gemini AI chat integration
- [x] Responsive layout with mobile toggles
- [x] Header component with social links
- [x] GLTF/GLB model support
- [x] Dark theme model selector
- [x] Resume download button

---

## Phase 1: High-Impact (Recruiter Essentials)

### 1.1 Projects Showcase Section
**Priority:** Critical | **Effort:** Medium

A visual grid of project cards below or alongside the chat.

**Features:**
- Project cards with thumbnail images
- Tech stack badges (icons or pills)
- Brief description
- Links: Live Demo | GitHub | Load 3D Model
- Hover effects with glassmorphism

**Files to create/modify:**
- `src/components/ProjectsSection.tsx` (new)
- `src/lib/projects-data.ts` (new)
- `src/app/page.tsx` (integrate)

**Design notes:**
- Use placeholder images initially
- Cards should match glassmorphism theme
- Consider masonry or uniform grid layout

---

### 1.2 Skills Visualization
**Priority:** High | **Effort:** Low-Medium

Interactive skill tags that connect to the AI assistant.

**Features:**
- Categorized skill pills (Hardware / Software / Tools)
- Hover glow effect
- Click to ask AI: "Tell me about your experience with [skill]"
- Optional: Proficiency indicators (bars or dots)

**Files to create/modify:**
- `src/components/SkillsSection.tsx` (new)
- `src/lib/portfolio-context.ts` (already has skills data)

---

### 1.3 SEO & Social Meta Tags
**Priority:** High | **Effort:** Low

Essential for LinkedIn shares and Google discoverability.

**Features:**
- Open Graph meta tags (title, description, image)
- Twitter card meta tags
- Structured data (JSON-LD for Person)
- Proper favicon set
- robots.txt and sitemap.xml

**Files to create/modify:**
- `src/app/layout.tsx` (metadata)
- `public/og-image.png` (create)
- `public/favicon.ico` (update if needed)

---

### 1.4 Chat Enhancements
**Priority:** High | **Effort:** Medium

Make the AI chat more powerful and persistent.

**Features:**
- [ ] Markdown rendering in responses (react-markdown)
- [ ] Conversation persistence (localStorage)
- [ ] Quick action buttons ("View Resume", "See Projects")
- [ ] Copy message button
- [ ] Feedback mechanism (thumbs up/down)

**Files to modify:**
- `src/components/Chat.tsx`
- `package.json` (add react-markdown)

---

## Phase 2: Polish & Delight

### 2.1 Animated Transitions
**Priority:** Medium | **Effort:** Low

Smooth page transitions and micro-interactions.

**Features:**
- Fade-in on scroll for sections
- Staggered animation for project cards
- Smooth tab transitions on mobile
- Button press feedback

**Consider:** Framer Motion library

---

### 2.2 3D Model Annotations
**Priority:** Medium | **Effort:** Medium-High

Interactive hotspots on 3D models with info panels.

**Features:**
- Clickable points on model surface
- Info popover on click
- Highlight effect on hover
- Navigation between annotation points

**Useful for:** Explaining hardware projects in detail

---

### 2.3 Dark/Light Mode Toggle
**Priority:** Low-Medium | **Effort:** Medium

Theme switcher with system preference detection.

**Features:**
- Toggle button in header
- Persist preference in localStorage
- Respect system preference initially
- Smooth transition between themes

**Files to modify:**
- `src/app/globals.css` (light theme variables)
- `src/components/Header.tsx` (toggle button)
- Create theme context

---

### 2.4 GitHub Stats Widget
**Priority:** Low | **Effort:** Low

Show GitHub contribution graph or stats.

**Options:**
- GitHub readme stats card (embed image)
- GitHub API integration for live stats
- Contribution calendar visualization

---

### 2.5 Testimonials/Recommendations
**Priority:** Medium | **Effort:** Low

Social proof section with quotes.

**Features:**
- Quote cards with attribution
- Optional: LinkedIn recommendation imports
- Carousel or grid layout

---

## Phase 3: Advanced Features

### 3.1 PWA (Progressive Web App)
**Priority:** Medium | **Effort:** Medium

Make the portfolio installable and work offline.

**Features:**
- Service worker for caching
- Web app manifest
- Install prompt
- Offline fallback page

**Benefits:** Feels like a native app, works offline

---

### 3.2 Analytics Dashboard
**Priority:** Low | **Effort:** Medium

Track user interactions (privacy-respecting).

**Options:**
- Plausible Analytics (privacy-focused)
- PostHog (open source)
- Simple custom analytics

**Track:**
- Most asked questions in chat
- Time spent on page
- Which projects get most interest
- 3D model interactions

---

### 3.3 Contact Form
**Priority:** Low | **Effort:** Low-Medium

Alternative to just email links.

**Features:**
- Simple form (name, email, message)
- Send via Resend or EmailJS
- Success/error states
- Spam protection (honeypot or reCAPTCHA)

---

### 3.4 Blog/Writing Section
**Priority:** Low | **Effort:** Medium-High

If you have technical content to share.

**Options:**
- MDX-based blog posts
- External blog link (dev.to, Medium)
- RSS feed integration

---

### 3.5 AR/VR Preview (WebXR)
**Priority:** Low | **Effort:** High

View 3D models in augmented reality.

**Features:**
- AR button for compatible devices
- Place model in real world
- VR mode for headsets

**Note:** Requires HTTPS and device support

---

### 3.6 Voice Input for Chat
**Priority:** Low | **Effort:** Medium

Speech-to-text for chat input.

**Features:**
- Microphone button
- Web Speech API integration
- Visual feedback during recording

---

## Quick Wins (Do Anytime)

These can be done quickly between larger features:

- [ ] Add loading skeletons for project cards
- [ ] Improve error messages with retry buttons
- [ ] Add keyboard navigation (Tab, Enter)
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add print stylesheet for resume
- [ ] Create custom 404 page
- [ ] Add breadcrumb for navigation
- [ ] Implement focus trap in modals
- [ ] Add skip-to-content link for accessibility

---

## Tech Debt / Maintenance

- [ ] Fix ESLint warnings in Dimension components
- [ ] Add unit tests for Chat component
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add Storybook for component documentation
- [ ] Improve TypeScript types (remove `any`)

---

## Resources

**Design Inspiration:**
- https://brittanychiang.com
- https://leerob.io
- https://jhey.dev

**Libraries to Consider:**
- `framer-motion` - Animations
- `react-markdown` - Markdown rendering
- `next-seo` - SEO utilities
- `@vercel/analytics` - Simple analytics

---

## Notes

- Always test on mobile before deploying
- Keep lighthouse score above 90
- Prioritize recruiter experience
- Update `portfolio-context.ts` with real data before launch
