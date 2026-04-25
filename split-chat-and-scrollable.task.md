# Split `Chat.tsx` (524 lines) and `scrollable/page.tsx` (463 lines)

## Goal

Bring two oversized files under the project's "≤300 lines per file, one concept per file" convention (`CLAUDE.md` → *Code Conventions* and *Component Organization*) without behavioral change. Apply the existing `ComponentName.{tsx,types,hooks,config,utils}` modular pattern already used by `Dimension/`, `UnifiedGrid/`, `Pacman/`, etc.

This is a **pure refactor**: no public API changes, no UX changes, no logic changes. Tests, snapshots, type-check, lint, and the dev/build server must remain green.

## Non-goals

- Don't redesign the chat UX or scrollable layout.
- Don't change persisted localStorage shape (`STORAGE_KEYS.CHAT_HISTORY`).
- Don't change the API contract for `/api/chat` or `/api/feedback`.
- Don't change the `dynamic(() => import('@/components/Chat'))` import path used by 3 callers (`src/app/page.tsx:32`, `src/app/scrollable/page.tsx:102`, `src/components/BentoOS/BootScreen.tsx:26`). Default export must stay.
- Don't introduce new dependencies.
- Don't fix unrelated issues found along the way (file separate tickets).

---

## Existing patterns to follow

| Convention | Reference |
|---|---|
| Modular folder per component | `src/components/Dimension/` (`.tsx`, `.types.ts`, `.hooks.ts`, `.config.ts`, `.utils.ts`, `.3d.tsx`, `.ui.tsx`) |
| Shared subfolder + `index.ts` barrel | `src/components/UnifiedGrid/` (`core/`, `cards/`, `themes/`) |
| Re-use shared utilities first | `@/lib/utils`, `@/lib/constants`, `@/components/ui/Icons`, `@/components/ui/ErrorBoundary` |
| Dynamic-import a 3D/heavy child with `ssr: false` and a `LoadingSpinner` fallback | `src/app/page.tsx`, `src/app/scrollable/page.tsx` |
| `'use client'` at top of files using state/effects | All current `.tsx` |

`src/components/ui/ErrorBoundary.tsx` already exists and supports a `fallback` prop — the inline `class ErrorBoundary` in `scrollable/page.tsx:47-88` is a duplicate that must be removed.

---

## Part 1 — Split `src/components/Chat.tsx` (524 → ~6 small files)

### Target structure

```
src/components/Chat/
├── index.ts                 # barrel: re-exports default Chatbot + types if any
├── Chat.tsx                 # main component, ~180 lines (state wiring + render)
├── Chat.types.ts            # Message, ChatFunctions, ChatbotProps interfaces
├── Chat.storage.ts          # loadMessages / saveMessages / clearStoredMessages / isValidMessage / getDefaultMessage
├── Chat.hooks.ts            # useChatMessages (state + persistence + scroll), useChatSubmit (send/abort/error)
└── parts/
    ├── CopyButton.tsx       # memo'd CopyButton (currently Chat.tsx:77-102)
    ├── FeedbackButtons.tsx  # memo'd FeedbackButtons (Chat.tsx:104-143)
    ├── QuickActions.tsx     # memo'd QuickActions (Chat.tsx:145-181)
    ├── MessageItem.tsx      # NEW: extracts the user/assistant render branch from Chat.tsx:413-450
    ├── SuggestedQuestions.tsx # extracts Chat.tsx:471-488 (≤2-message render)
    └── ChatInput.tsx        # extracts the `<form>` block at Chat.tsx:497-521
```

> Why a `Chat/` folder instead of co-located `Chat.tsx` + `Chat.parts.tsx`? Three callers import `'@/components/Chat'`. Next.js resolves directory imports via `index.ts`, so a folder with `index.ts` re-exporting `default` from `./Chat.tsx` is **drop-in compatible** with the existing dynamic imports — no caller changes.

### File-by-file responsibilities

#### `Chat.types.ts`
Move the three interfaces from `Chat.tsx:17-35` verbatim:
- `Message` (id, role, content, timestamp, optional feedback)
- `ChatFunctions` (send, addAssistant, clear)
- `ChatbotProps` (onReady, onViewResume, onSeeProjects)

Export every type. No runtime code.

#### `Chat.storage.ts`
Move pure functions from `Chat.tsx:39-73`:
- `getDefaultMessage(): Message` (depends on `PORTFOLIO_DATA`)
- `isValidMessage(m: unknown): m is Message`
- `loadMessages(): Message[] | null`
- `saveMessages(messages: Message[]): void`
- `clearStoredMessages(): void`

Imports: `@/lib/portfolio-context`, `@/lib/utils` (storage helpers), `@/lib/constants`, and `./Chat.types`.

No `'use client'` needed (no JSX), but Next will treat it as client-shared since it's imported by a client module — fine.

#### `Chat.hooks.ts`
Two hooks consolidating the four `useEffect`/`useCallback` blocks in `Chat.tsx:186-218, 256-341, 343-357`:

1. **`useChatMessages()`** owns:
   - `messages` / `setMessages` state, seeded with `getDefaultMessage()`.
   - `isHydrated` flag + the load-from-storage effect (Chat.tsx:197-203).
   - The save-on-change effect (Chat.tsx:206-210).
   - `messagesEndRef` + `scrollToBottom` + auto-scroll effect (Chat.tsx:212-218).
   - `addAssistantMessage(content)` (Chat.tsx:343-357).
   - `clearChat()` (Chat.tsx:372-383).
   - Returns `{ messages, setMessages, messagesEndRef, addAssistantMessage, clearChat, setError }` — or shape per simplest call site.

2. **`useChatSubmit({ messages, setMessages, inputRef })`** owns:
   - `input`, `setInput`, `isLoading`, `error`, `setError`, `isDemoMode`.
   - `sendMessage(content)` (Chat.tsx:256-341) — keep AbortController + 30s timeout from `TIMEOUTS.CHAT_REQUEST` exactly as-is.
   - `handleFeedback(messageId, feedback)` (Chat.tsx:220-254).
   - Returns `{ input, setInput, isLoading, error, isDemoMode, sendMessage, handleFeedback }`.

> Carry over the **functional `setMessages` resolver Promise pattern** at Chat.tsx:281-286 verbatim — it intentionally avoids stale closures on the messages list when posting to `/api/chat`. Do not "simplify" it without verifying behavior.

#### `parts/CopyButton.tsx`, `parts/FeedbackButtons.tsx`, `parts/QuickActions.tsx`
Lift verbatim from Chat.tsx, preserving:
- `memo(...)` wrapping
- `displayName` assignment (relied on by React DevTools and possibly tests)
- Existing className strings, `aria-*`, `onCopied` callback shape.

#### `parts/MessageItem.tsx` (new extraction)
Render one message. Props: `{ message: Message; onCopied: (msg: string) => void; onFeedback: (id, fb) => void; }`. Move the time-string formatting + the user/assistant ternary from Chat.tsx:413-450. Memoize with `React.memo` (each message is keyed; reduces re-renders when only one new message is appended — modest perf win, free with extraction).

#### `parts/SuggestedQuestions.tsx`
Props: `{ onSelect: (q: string) => void; disabled: boolean; }`. Renders the block at Chat.tsx:471-488. Internal `disabled` flag still wired to `isLoading`. Stays inside the `messages.length <= 2` guard which lives in the parent.

#### `parts/ChatInput.tsx`
Props: `{ value, onChange, onSubmit, disabled, inputRef }`. Renders the input form at Chat.tsx:497-521. Must keep the `<m.button>` with `whileTap` (framer-motion) and the gradient `borderImage` style.

#### `Chat.tsx` (the slim shell)
Composition only:
```tsx
'use client';
import { useRef } from 'react';
import { useChatMessages, useChatSubmit } from './Chat.hooks';
import { useToast } from '@/components/ui/Toast';
// ...parts...

export default function Chatbot({ onReady, onViewResume, onSeeProjects }: ChatbotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess } = useToast();
  const { messages, setMessages, messagesEndRef, addAssistantMessage, clearChat } = useChatMessages();
  const { input, setInput, isLoading, error, isDemoMode, sendMessage, handleFeedback } =
    useChatSubmit({ messages, setMessages, inputRef });

  // onReady stable-wrapper effect (Chat.tsx:385-398) stays here — closes over local refs.
  // ...
  return ( /* compose <DemoModeBanner/>, <MessageList/>, <SuggestedQuestions/>, <QuickActions/>, <ChatInput/> */ );
}
```

Keep the `onReady` wrapper effect (`Chat.tsx:385-398`) and its `sendMessageRef` / `clearChatRef` pattern in the shell — it's the bridge to parents and depends on locally captured callbacks.

#### `index.ts`
```ts
export { default } from './Chat';
export type { Message, ChatFunctions, ChatbotProps } from './Chat.types';
```

### Caller compatibility check
Three sites import `'@/components/Chat'` (or the relative `'../../components/Chat'`):
- `src/app/page.tsx:32`
- `src/app/scrollable/page.tsx:102`
- `src/components/BentoOS/BootScreen.tsx:26`

A `Chat/` directory with `index.ts` resolves to `'@/components/Chat'` identically. Verify by leaving these imports untouched and re-running `npm run dev` + `npm run type-check`.

### Risks / pitfalls in this part

- **Stale-closure regression on `sendMessage`.** The current code uses a deliberate `Promise<Message[]>` trick to read live state. Keep it inside `useChatSubmit` and write a unit test (see Testing).
- **`onReady` firing more than once.** The `useEffect` deps in Chat.tsx:398 are `[onReady, addAssistantMessage]`. `addAssistantMessage` must remain `useCallback` with `[]` deps so the effect stays single-fire. Verify after extraction.
- **`isHydrated` flag.** Required to prevent overwriting persisted localStorage with the default message during SSR-then-hydrate. Keep it in `useChatMessages` and gate the save effect on it.
- **`memo` + `displayName`.** Don't drop `displayName` during extraction — ESLint may warn, and it's used by snapshot/debug tooling.

---

## Part 2 — Split `src/app/scrollable/page.tsx` (463 → ~5 small files)

### Target structure

```
src/app/scrollable/
├── page.tsx                              # ~120 lines: imports + dynamic shells + ScrollableLayout JSX skeleton
├── layout-parts/
│   ├── HeroSection.tsx                   # Hero block (page.tsx:194-287)
│   ├── SkillsSectionWrapper.tsx          # Skills wrapper block (page.tsx:298-317)
│   ├── ScrollableFooter.tsx              # Footer block (page.tsx:319-366)
│   ├── ChatPanel.tsx                     # AnimatePresence chat panel (page.tsx:411-450) + floating button (page.tsx:388-409)
│   └── ScrollToTopButton.tsx             # Scroll-to-top button (page.tsx:368-386)
└── hooks/
    └── useScrollableLayout.ts            # showScrollTop tracking, scrollToTop, scrollToSection, mounted ref
```

> Keeping these inside `app/scrollable/` (not under `components/`) signals they're page-scoped, single-use chunks — no temptation to import them from elsewhere. This matches Next.js App Router convention for route-local components.

### File-by-file responsibilities

#### Remove the inline `ErrorBoundary`
`page.tsx:37-88` re-implements an error boundary that already exists at `src/components/ui/ErrorBoundary.tsx`. **Delete the local class** and import the shared one. Its `fallback` prop signature already supports the existing fallback UI; the existing inline fallback (page.tsx:65-83) can be passed via `<ErrorBoundary fallback={<ScrollableErrorFallback />}>` or simply omitted to use the shared default.

Verify the shared `ErrorBoundary` accepts the same JSX shape before deleting; if the default fallback styling differs meaningfully, capture the current fallback into a small `parts/ScrollableErrorFallback.tsx` and pass it explicitly. **Don't quietly change the error UI.**

#### `hooks/useScrollableLayout.ts`
Move:
- `isMountedRef` + mount/unmount effect (page.tsx:136-142).
- `showScrollTop` state + scroll listener (page.tsx:127, 145-151).
- `scrollToTop` callback (page.tsx:153-155).
- `scrollToSection` function (page.tsx:167-169).

Returns `{ showScrollTop, scrollToTop, scrollToSection, isMountedRef }`.

#### `layout-parts/HeroSection.tsx`
Props: `{ onOpenChat: () => void; onScrollToProjects: () => void; ThreeViewer: ComponentType }`. Why pass `ThreeViewer` in? It's a `dynamic()` shell defined at the page level (page.tsx:90-100) — pushing it into the section file creates a second dynamic boundary which could change Next's chunking. Keep it page-level, pass through as a prop.

Render block: page.tsx:195-287, including the `<m.header>` and the inner `<m.div>`/grid. Receives `prefersReducedMotion` via prop or `useReducedMotion()` directly (re-call is cheap and isolated).

> The `Header` component (page.tsx:182-190) sits inside the fixed header, not inside the hero — keep it in `page.tsx` or split it into a `ScrollableHeader.tsx`. **Recommendation:** keep header inline since it's just a ~10-line `Header` config. Don't over-split.

#### `layout-parts/SkillsSectionWrapper.tsx`
Props: `{ onAskAboutSkill: (skill: string) => void; SkillsSection: ComponentType<...> }`. Block from page.tsx:299-317. Same `dynamic()` reason for passing the inner component.

#### `layout-parts/ScrollableFooter.tsx`
Props: `{ onScrollToSection: (id: string) => void }`. Block from page.tsx:320-366. The inline social-icon SVGs (4 of them) move with it. **Don't** refactor to use `@/components/ui/Icons` here — it's out of scope (the GitHub/LinkedIn icons in `Icons.tsx` may differ visually); file a follow-up.

#### `layout-parts/ScrollToTopButton.tsx`
Props: `{ visible: boolean; onClick: () => void; prefersReducedMotion: boolean | null }`. Block from page.tsx:368-386. Wrap with `AnimatePresence` internally so the page just renders `<ScrollToTopButton visible={...} />`.

#### `layout-parts/ChatPanel.tsx`
The most complex split. Owns:
- The floating button (page.tsx:388-409) **and** the slide-in chat panel (page.tsx:411-450) — they're sibling state and share `isChatOpen`, so co-locate.
- Internal state: `isChatOpen`, `chatFns`, `isProjectsOpen` (latter used to close chat when "see projects" clicked).

Wait — `isProjectsOpen` is also used by `FeaturedProjects` (page.tsx:293) and `ProjectsModal` (page.tsx:453). Three call sites means the state has to live higher.

**Decision:** keep `isProjectsOpen` and `isChatOpen` in `page.tsx`. Pass them as props to `ChatPanel`:

```tsx
<ChatPanel
  isOpen={isChatOpen}
  onToggle={() => setIsChatOpen(v => !v)}
  onClose={() => setIsChatOpen(false)}
  onChatReady={setChatFns}
  onSeeProjects={() => { setIsProjectsOpen(true); setIsChatOpen(false); }}
  prefersReducedMotion={prefersReducedMotion}
/>
```

`ChatPanel.tsx` owns the dynamic-imported `Chatbot` shell (page.tsx:102-111) — moving it keeps the floating-button behavior and the dynamic loader together.

The `chatRef` (page.tsx:128, 415) appears unused; verify with grep before extraction. If unused, delete it; if used (focus trap?), keep it inside `ChatPanel`.

#### `page.tsx` (the slim shell, ~120 lines)
After extraction:
```tsx
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import Header from '@/components/Header';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { KeyboardShortcutsModal, useKeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { AboutSection /*…*/ } from './_dynamics'; // optional: extract dynamic shells if it cleans up imports
import { useScrollableLayout } from './hooks/useScrollableLayout';
import { HeroSection } from './layout-parts/HeroSection';
// …other parts…

export default function ScrollableLayout() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatFns, setChatFns] = useState<{ send: (c:string)=>void; clear: ()=>void } | null>(null);
  const { showScrollTop, scrollToTop, scrollToSection, isMountedRef } = useScrollableLayout();
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();
  const prefersReducedMotion = useReducedMotion();

  const handleAskAboutSkill = useCallback((skill: string) => { /* unchanged */ }, [chatFns, isMountedRef]);

  return (
    <LazyMotion features={domAnimation} strict>
      <main id="main-content" className="...">
        {/* fixed header, ~10 lines */}
        <HeroSection ThreeViewer={ThreeViewer} onOpenChat={() => setIsChatOpen(true)} onScrollToProjects={() => scrollToSection('projects')} prefersReducedMotion={prefersReducedMotion} />
        <AboutSection />
        <FeaturedProjects onViewAll={() => setIsProjectsOpen(true)} />
        <TimelineSection />
        <SkillsSectionWrapper SkillsSection={SkillsSection} onAskAboutSkill={handleAskAboutSkill} />
        <ScrollableFooter onScrollToSection={scrollToSection} />
        <ScrollToTopButton visible={showScrollTop && !isChatOpen} onClick={scrollToTop} prefersReducedMotion={prefersReducedMotion} />
        <ChatPanel isOpen={isChatOpen} onToggle={() => setIsChatOpen(v=>!v)} onClose={() => setIsChatOpen(false)} onChatReady={setChatFns} onSeeProjects={() => { setIsProjectsOpen(true); setIsChatOpen(false); }} prefersReducedMotion={prefersReducedMotion} />
        <ProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
        <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
      </main>
    </LazyMotion>
  );
}
```

Optional: pull the 4 `dynamic()` shells (lines 21-34, 90-121) into `app/scrollable/_dynamics.ts` as a barrel — only if it noticeably shortens `page.tsx`. Skip if marginal.

### Risks / pitfalls in this part

- **Server/client boundary.** `page.tsx` is `'use client'` — every `layout-parts/*` is also a client component (uses `framer-motion`'s `m.*`). Add `'use client'` at the top of each.
- **Dynamic-import chunking.** Moving a `dynamic()` call into a child component creates a second boundary; bundle splitting may regress. Pass dynamic-loaded components in as props instead (see Hero/SkillsSectionWrapper above).
- **`isMountedRef` is shared.** It must come from one place (the hook) and be referenced by both `handleAskAboutSkill` (in `page.tsx`) and any future async work.
- **Removing the inline `ErrorBoundary`.** Verify `src/components/ui/ErrorBoundary.tsx`'s default fallback is acceptable, or pass a custom fallback. Don't change error UX silently.
- **`prefersReducedMotion`** is `null | boolean` from `useReducedMotion()`. Type prop signatures accordingly to avoid type-narrowing churn.

---

## Sequencing (suggested order)

Two independent splits — but the Chat split touches a file imported by `scrollable/page.tsx`, so do Chat first. Keep commits small to ease review.

1. **Chat: types + storage + hooks** (no UI change).
   - Create `Chat/Chat.types.ts`, `Chat/Chat.storage.ts`, `Chat/Chat.hooks.ts`.
   - Re-import them inside the existing `Chat.tsx` (still at `src/components/Chat.tsx`) to validate the API.
   - Run `npm run type-check`, `npm test`, `npm run lint`.
   - Commit: `refactor(Chat): extract types, storage, and hooks`.
2. **Chat: parts**.
   - Create `Chat/parts/*.tsx`. Still importing into the old `Chat.tsx`.
   - Commit: `refactor(Chat): extract subcomponents into parts/`.
3. **Chat: move main file + index barrel**.
   - Create `Chat/Chat.tsx` (slim shell) and `Chat/index.ts`. Delete `src/components/Chat.tsx`.
   - Run dev server and click through chat in `/`, `/scrollable`, and the BootScreen.
   - Commit: `refactor(Chat): move into Chat/ folder with index barrel`.
4. **Scrollable: hooks + drop inline ErrorBoundary**.
   - Create `app/scrollable/hooks/useScrollableLayout.ts`. Replace inline `ErrorBoundary` with import from `@/components/ui/ErrorBoundary`. Verify fallback parity.
   - Commit: `refactor(scrollable): extract layout hook and reuse shared ErrorBoundary`.
5. **Scrollable: layout-parts (one-by-one)**.
   - One commit per part is overkill; group as Hero+Skills+Footer in one commit, ScrollToTop+ChatPanel in another.
   - Commit 5a: `refactor(scrollable): extract hero, skills wrapper, footer`.
   - Commit 5b: `refactor(scrollable): extract scroll-to-top button and chat panel`.

Each commit must independently pass `npm run type-check`, `npm test`, `npm run lint`.

---

## Testing

### Existing tests to keep green
- `src/lib/__tests__/utils.test.ts`, `constants.test.ts`, `clipboard.test.tsx`, `use-focus-trap.test.tsx`, `colors.test.ts`, `animations.test.ts` — unchanged, must still pass.
- E2E tests under `tests/` — Playwright suite. Run `npx playwright test` after the full split.

### New unit tests (recommended)
Create `src/components/Chat/__tests__/Chat.storage.test.ts`:
- `isValidMessage`: accepts well-formed `Message`, rejects null/missing-fields/wrong-types.
- `loadMessages` returns `null` for empty/invalid storage; returns filtered valid array otherwise.
- `saveMessages` truncates to `DEFAULTS.MAX_CHAT_MESSAGES` (mock `localStorage`).
- `clearStoredMessages` removes the key.

Optional: `Chat.hooks.test.tsx` covering:
- `useChatMessages` hydrates from storage on mount.
- `useChatSubmit.sendMessage` aborts after `TIMEOUTS.CHAT_REQUEST` ms (use `vi.useFakeTimers` + `vi.spyOn(global, 'fetch')`).

Skip tests for layout-parts under `app/scrollable/` — visual-only, covered by E2E. Per `CLAUDE.md` *Unit Test Triggers*, "purely visual/layout" changes don't require tests.

### Manual smoke test
Per `CLAUDE.md`'s "For UI or frontend changes, start the dev server and use the feature in a browser":
1. `npm run dev`
2. Visit `/scrollable`. Confirm:
   - Hero loads, 3D viewer renders.
   - Click "Ask Me Anything" → chat panel slides in.
   - Send a message → response renders, suggested-questions disappear after 3 messages.
   - Click thumbs-up → toggles persistent.
   - Reload → chat history persists.
   - Click "[resume --download]" → opens PDF.
   - Scroll past 400px → scroll-to-top button appears.
   - Toggle skills "ask AI" buttons → chat opens with prefilled message.
3. Visit `/` and the BootScreen flow → chat still works (since `Chat` import path is preserved).
4. Open DevTools mobile mode → confirm responsive behavior unchanged.
5. `npm run build` — confirm no chunking regressions (compare bundle output).

---

## Acceptance criteria

- [ ] No file in this PR exceeds 300 lines (target enforcement: `wc -l src/components/Chat/* src/app/scrollable/**/*.tsx`).
- [ ] `src/components/Chat.tsx` is deleted; `src/components/Chat/index.ts` exports default.
- [ ] All 3 importers of `'@/components/Chat'` work without changes.
- [ ] `src/app/scrollable/page.tsx` is ≤150 lines.
- [ ] Inline `class ErrorBoundary` in `scrollable/page.tsx` is gone; shared `@/components/ui/ErrorBoundary` is used.
- [ ] `npm run type-check`, `npm run lint`, `npm test`, `npm run build` all pass.
- [ ] Playwright E2E suite passes (`npx playwright test`).
- [ ] Manual smoke test items above all confirmed.
- [ ] Commit messages do not include AI attribution (per `CLAUDE.md`).
- [ ] No behavioral change: chat history persists, feedback toggles, scroll-to-top threshold = 400px, etc.

---

## Open questions / decisions to confirm before starting

1. **Folder vs. dotted-file pattern for Chat?** `Dimension/` uses dotted files in a folder; `UnifiedGrid/` uses subfolders. Plan above picks **folder + dotted main + `parts/` subfolder** (closest to UnifiedGrid). Confirm preference.
2. **Should `parts/` for scrollable live under `app/scrollable/layout-parts/` or `src/components/Scrollable/`?** Plan keeps it route-local since none of the parts are reusable. Confirm.
3. **`chatRef` at `page.tsx:128, 415`** — appears unused outside JSX attachment. Drop it? Or there's a follow-up plan to add focus management?
4. **Should the dynamic-section shells (`AboutSection`, `TimelineSection`, `FeaturedProjects`, `ThreeViewer`, `Chatbot`, `ProjectsModal`, `SkillsSection`) be barrel-extracted into `app/scrollable/_dynamics.ts`?** Adds one more file but cleans `page.tsx` imports. Marginal — recommend skipping unless `page.tsx` still feels cluttered after the rest of the split.

---

## Out of scope (file separate tickets if desired)

- Replacing inline social SVGs in the footer with `@/components/ui/Icons`.
- Consolidating the two `dynamic(() => import('./components/Chat'))` callers in `app/page.tsx` and `app/scrollable/page.tsx` into a shared dynamic shell.
- Reducing `Dimension.3d.tsx` (527 lines) and `UnifiedGrid.tsx` (532 lines), which also exceed the 300-line guideline.
- Adding tests for `useChatSubmit.sendMessage` abort behavior beyond the smoke test.
