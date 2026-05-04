# Design System Color Rules

The portfolio uses four semantic color roles.

| Token | Meaning | Use |
| --- | --- | --- |
| `--primary` | Orange brand/action color | Navigation CTAs, content links, focus rings, decorative accents, game starts, scroll prompts |
| `--ai` | Purple AI accent | Chat trigger, chat panel highlights, suggested questions, AI status affordances |
| `--success` | Green success state | READY chips, success toasts, completed states |
| `--destructive` | Red error state | Errors, destructive states, failure toasts |

Rules:

- Orange is the default accent. If an element is a normal CTA, link, focus state, selected state, or decoration, use `--primary`.
- Purple is reserved for AI surfaces only. Non-AI elements should not use `--ai`, `--purple`, violet utilities, or purple gradients.
- Green and red are state colors. Do not use them for generic branding or primary actions.
- Amber/yellow is not part of the palette. Use `--primary` for former amber highlights.

Preferred utilities:

- CSS variables: `var(--primary)`, `var(--ai)`, `var(--success)`, `var(--destructive)`
- Tailwind 4 tokens: `bg-primary`, `text-primary`, `bg-ai`, `text-ai`
- Local utilities: `.bg-primary`, `.text-primary`, `.bg-ai`, `.text-ai`
