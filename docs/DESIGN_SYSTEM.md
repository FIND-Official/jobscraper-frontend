# JobScraper Design System

Single source of truth for visual decisions. Everything here is implemented as
tokens in `src/index.css` and exposed to Tailwind in `tailwind.config.ts`.

**Rule: never hardcode colors in components** (`text-white`, `bg-black`, `bg-pink-500`,
`bg-[#fcbcd7]`). Use the semantic classes below.

---

## 1. Brand & Mood

Dark-first, editorial, calm. Near-black surfaces, soft pink accent, generous
whitespace, no gradients-on-white and no purple/indigo. The pink is used as a
*signal* (primary actions, active state, saved state), never as a large fill.

## 2. Color tokens

All values are HSL triplets so they can be composed with opacity
(`hsl(var(--primary) / 0.3)`).

| Token | Value | Tailwind class | Use |
| --- | --- | --- | --- |
| `--background` | `0 0% 7%` | `bg-background` | Page canvas |
| `--foreground` | `0 0% 98%` | `text-foreground` | Primary text |
| `--card` | `0 0% 10%` | `bg-card` | Cards, modals, popovers |
| `--surface` | `0 0% 12%` | `bg-surface` | Raised rows inside cards |
| `--muted` | `0 0% 15%` | `bg-muted` | Chips, inert fills |
| `--muted-foreground` | `0 0% 64%` | `text-muted-foreground` | Secondary text, metadata |
| `--border` / `--input` | `0 0% 20%` | `border-border` | Hairlines, inputs |
| `--primary` | `331 82% 76%` (#fcbcd7) | `bg-primary` `text-primary` | Primary action, brand accent |
| `--primary-glow` | `331 82% 85%` | `bg-primary-glow` | Hover of primary |
| `--primary-deep` | `331 60% 45%` | `bg-primary-deep` | Pressed / dense pink on light chips |
| `--primary-foreground` | `331 82% 20%` | `text-primary-foreground` | Text on pink |
| `--success` | `152 60% 45%` | `bg-success` `text-success` | Saved, exported, applied |
| `--warning` | `38 92% 58%` | `text-warning` | Quota nearly reached |
| `--info` | `199 89% 60%` | `text-info` | Links inside job descriptions |
| `--destructive` | `0 84% 60%` | `bg-destructive` | Delete, dismiss, cancel plan |
| `--ring` | same as primary | `ring-ring` | Focus ring |

Sidebar has its own mirrored set (`--sidebar-*`) so the saved-jobs panel can
diverge from the page without new hardcoded values.

## 3. Gradients, shadows, motion

| Token | Tailwind | Use |
| --- | --- | --- |
| `--gradient-primary` | `bg-gradient-primary` | PRO badges, upgrade CTA |
| `--gradient-dark` | `bg-gradient-dark` | Hero / section backdrop |
| `--gradient-surface` | `bg-gradient-surface` | Card depth |
| `--shadow-card` | `shadow-card` | Default card elevation |
| `--shadow-elegant` | `shadow-elegant` | Modals, dropdowns |
| `--shadow-glow` | `shadow-glow` | Floating primary buttons only |
| `--transition-smooth` | `duration-300 ease-smooth` | All hover/state changes |

Motion: 150ms for color/opacity, 300ms for size/position, `ease-smooth`
(`cubic-bezier(0.4, 0, 0.2, 1)`). Accordions use the existing
`accordion-down` / `accordion-up` keyframes. No parallax, no long entrances.

## 4. Typography

- **Inter** — all UI and body copy (`font-sans`).
- **Playfair Display Italic** — accents only (`font-playfair italic`): page
  titles, empty-state headlines, marketing lines. Never for labels, buttons,
  table headers, or anything repeated.

| Role | Classes |
| --- | --- |
| Page title | `text-3xl sm:text-4xl font-semibold tracking-tight` |
| Accent title | `font-playfair italic text-3xl sm:text-4xl` |
| Section heading | `text-xl font-semibold` |
| Card title (job title) | `text-base font-semibold` |
| Body | `text-sm leading-relaxed` |
| Metadata / captions | `text-xs text-muted-foreground` |
| Badge | `text-[10px] uppercase tracking-wide` |

Long-form scraped HTML is rendered through the `.job-description` component
class in `src/index.css` — do not restyle it inline.

## 5. Spacing, radius, layout

- 4px base scale; prefer `2 / 3 / 4 / 6 / 8 / 12` Tailwind steps.
- Card padding `p-4` mobile, `p-6` from `sm`. Vertical rhythm between sections `mt-12`.
- Radius from `--radius` (0.5rem): `rounded-md` inputs/badges, `rounded-lg`
  cards/modals, `rounded-full` avatars and floating buttons.
- Page shell: `container mx-auto px-4 pt-24 pb-32`, content column `max-w-5xl`,
  fixed header `h-16`, saved-jobs sidebar reserved with `lg:mr-80` (sheet on mobile).
- Breakpoints: `sm` 640 / `md` 768 / `lg` 1024 / `2xl` container cap 1400.

## 6. Components

Built on shadcn/ui. Extend via `cva` variants, not per-instance class soup.

- **Buttons** — `default` (pink, primary action: Scrape, Upgrade), `outline`
  (secondary: Sign In, Export), `ghost` (nav and tertiary), `destructive`
  (delete/dismiss), `link` (inline). Sizes `sm` in dense rows, default elsewhere.
- **Job card** — `bg-card border border-border rounded-lg shadow-card`, hover
  `border-primary/40`. Title, company, location, source badge, dedupe count,
  save (bookmark) and dismiss actions.
- **Badges** — `secondary` for source board, `bg-gradient-primary` for PRO,
  `text-success` for saved/exported, `outline` for filters.
- **Inputs & selects** — `bg-background border-input`, focus
  `ring-2 ring-ring ring-offset-2 ring-offset-background`.
- **Dialogs / sheets** — `bg-card shadow-elegant`; sheets for mobile sidebar.
- **Tooltips** — one short sentence, `max-w-[200px]`, used for job-board
  explanations and quota hints.
- **Empty & loading states** — skeletons matching the card silhouette; empty
  states pair a Playfair italic line with one primary action.
- **Toasts** — success default, `destructive` for failures; title ≤ 4 words.

## 7. States

- Focus: always visible (`ring-ring`); never remove outlines.
- Disabled: `opacity-50 pointer-events-none`.
- Saved: filled bookmark in `text-primary`; exported: `text-success`.
- Gated PRO feature: enabled control that opens the pricing dialog, not a dead
  button — never fake entitlement client-side.

## 8. Accessibility

- Contrast: body text and `muted-foreground` on `background` meet 4.5:1; pink is
  only used for text at `text-primary` on dark, and always with
  `--primary-foreground` when used as a fill.
- Icon-only controls need `aria-label` (see footer social links).
- One `h1` per page; headings follow order.
- Colour never carries meaning alone — pair with an icon or label.
- Respect `prefers-reduced-motion` for any new animation.

## 9. Adding something new

1. Need a colour? Add an HSL token to `:root`, map it in `tailwind.config.ts`,
   then use the semantic class.
2. Need a variant? Add it to the component's `cva` config.
3. Never introduce a second accent hue, a serif other than Playfair, or a
   light-mode-only value.
