# Design System

A portable, production-tested design specification for utilitarian, dark-first software interfaces across Web, Desktop, Mobile, and generative AI design tools (such as Google Stitch, v0, Lovable, and Figma).

---

## 1. Design Philosophy

- **Utilitarian luxury**: Inspired by Swiss typography, Braun industrial design, and tools like Linear, Stripe, and Wise. Clean, quiet, and dense with information.
- **Dark-first foundation**: Deep warm charcoals rather than harsh pitch black `#000000`. Reduces eye strain and frames data crisply.
- **Solid matte surfaces**: No flashy gradient card backgrounds or glossy skeuomorphism. Surfaces rely on hairline borders, solid card tones, and soft directional drop shadows.
- **Muted organic accents**: Accent colors are desaturated, earthy mineral tones (sage emerald, terracotta crimson, warm sand amber, steel blue). Never neon or high-saturation primaries.
- **Tabular financial typography**: Numerical data uses tabular numerals (`tabular-nums`) with tight tracking for alignment and immediate scanning.

---

## 2. Color Palette & Tokens

### Dark theme (primary / default)

| Token | Value | Description |
| :--- | :--- | :--- |
| `background` | `#08090b` | Main app background canvas. Warm obsidian tint. |
| `card` | `#121316` | Solid panel and card surface. |
| `surface` | `#17181c` | Secondary surface, active rows, hover cards. |
| `surface-inset` | `rgba(255, 255, 255, 0.035)` | Recessed sections, input tracks, sub-panels. |
| `popover` | `#15161a` | Menus, dropdowns, dialogs. |
| `border` | `rgba(255, 255, 255, 0.07)` | Hairline container border. |
| `border-subtle` | `rgba(255, 255, 255, 0.04)` | Inset dividers, row separators. |
| `foreground` | `#f4f4f2` | Primary text and strong icons. Warm bone off-white. |
| `muted-foreground` | `#8a8c92` | Secondary labels, descriptions, timestamps. |
| `subtle-foreground` | `#5f6065` | Inactive icons, placeholder text, hints. |
| `primary` | `#f2f1ec` | Inverted call-to-action buttons, high-emphasis pills. |
| `primary-foreground`| `#0a0a0b` | Text on inverted primary buttons. |

### Light theme (secondary)

| Token | Value | Description |
| :--- | :--- | :--- |
| `background` | `#f2f1ed` | Warm linen / alabaster canvas. |
| `card` | `#faf9f6` | Solid card surface, clean paper white. |
| `surface` | `#e8e6e0` | Hover rows, secondary containers. |
| `surface-inset` | `rgba(21, 21, 20, 0.035)` | Recessed chips, search input background. |
| `border` | `rgba(21, 21, 20, 0.09)` | Hairline border. |
| `border-subtle` | `rgba(21, 21, 20, 0.05)` | Faint row dividers. |
| `foreground` | `#151514` | Primary text. Soft charcoal ink. |
| `muted-foreground` | `#6f6d67` | Secondary labels and body text. |
| `subtle-foreground` | `#9a9890` | Footers and placeholders. |
| `primary` | `#171716` | Strong dark CTA buttons. |
| `primary-foreground`| `#f6f4ef` | Light text on primary buttons. |

### Semantic accents (desaturated minerals)

Use with 10% to 14% opacity backgrounds for badges, icon holders, and status chips.

| Tone | Dark value | Dark BG tint (12%) | Light value | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Emerald** | `#a9bfa9` | `rgba(169, 191, 169, 0.12)` | `#4f7357` | Income, positive cashflow, active, success |
| **Crimson** | `#c99a90` | `rgba(194, 133, 123, 0.13)` | `#a2544a` | Expenses, negative net, cancel, urgent due |
| **Amber** | `#d2bd93` | `rgba(210, 189, 147, 0.12)` | `#8a6b34` | Upcoming bills, warning, trial ending |
| **Blue** | `#a6b0bd` | `rgba(166, 176, 189, 0.12)` | `#5c6b7a` | Transfers, accounts, informational tags |

### Monochrome data visualization sequence

For multi-category charts, stacked bars, or breakdowns:
1. `chart-1`: `#f0efeb` (dark) / `#262624` (light)
2. `chart-2`: `#b9b9b4` (dark) / `#4b4b48` (light)
3. `chart-3`: `#8c8d90` (dark) / `#767671` (light)
4. `chart-4`: `#5f6065` (dark) / `#a3a29b` (light)
5. `chart-5`: `#3a3b40` (dark) / `#cbc9c1` (light)

---

## 3. Typography Scale

Default typeface: `Inter`, `SF Pro Display / Text`, or high-grade system sans-serif.

| Role | Size | Weight | Tracking / Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Number** | 28px - 32px | 600 (Semibold) | `-0.04em` (`-1.1px`) | Main balance, net worth, hero analytics |
| **Section Title** | 18px - 20px | 600 (Semibold) | `-0.025em` (`-0.5px`)| Page headers, view titles |
| **Card / Panel Title**| 15px | 500 (Medium) | `-0.015em` (`-0.2px`)| Card header, table section titles |
| **Metric Value** | 20px - 22px | 500 (Medium) | `-0.03em`, `tabular-nums` | MetricCard figures, recurring totals |
| **Body / Row Text** | 13px - 14px | 400 or 500 | Normal | Transaction descriptions, settings, lists |
| **Meta / Subtitle** | 11px - 12px | 400 (Regular) | Normal | Card subtitles, secondary metadata, dates |
| **Uppercase Label** | 10px | 500 or 600 | `+0.16em` (`+1.6px` uppercase) | Category hints, micro badges, KPI headers |
| **Micro Caption** | 9px - 10px | 500 (Medium) | Normal | Heatmap weekday/month markers, legends |

---

## 4. Elevation, Radii & Surfaces

### Corner radius hierarchy

- **Outer container / Main card (`.surface`)**: `24px` (`rounded-3xl` or `rounded-[24px]`)
- **Inset section / Nested list (`.surface-inset`)**: `16px` (`rounded-2xl` or `rounded-[16px]`)
- **Interactive buttons, form inputs, dialogs**: `10px` to `12px` (`rounded-xl` or `rounded-[10px]`)
- **Pills / Status tags**: `9999px` (`rounded-full`) or `6px`
- **Heatmap cells & micro-indicators**: `2px` (`rounded-[2px]`)

### Surface construction

Every card uses three exact properties:

```css
/* Card Container */
background-color: var(--card); /* Solid #121316 in dark mode */
border: 1px solid var(--border); /* rgba(255, 255, 255, 0.07) */
border-radius: 24px;
box-shadow: 0 28px 56px -40px rgba(0, 0, 0, 0.9);
```

- **No gradient overlays on card surfaces**: Never apply linear gradients to card backgrounds.
- **No folder tabs or mock tabs**: Do not cut tabs into card headers. Headers sit cleanly inside standard padding.
- **Hairline dividers**: Sections within cards separate with `border-t border-border` (`rgba(255, 255, 255, 0.07)`).

---

## 5. Standard Component Patterns

### 1. MetricCard (KPI display)
Compact summary card used across dashboards in 2, 3, or 4 column grids.

- **Structure**:
  1. Top row: Small uppercase label (`10px`, tracking `+0.16em`, muted) or category pill.
  2. Middle row: Giant tabular numeral (`20px - 22px`, font-medium, foreground).
  3. Bottom row: Secondary context label (`11px`, muted text).
- **Padding**: `16px` (`p-4`).
- **Surface**: Solid card background, 24px radius, 1px border.

### 2. Activity heatmap (calendar matrix)
Full 52-week annual spending matrix inspired by contribution charts.

- **Structure**:
  - Top header: "Activity", subtitle "Daily spending, past 52 weeks", active days count badge.
  - Matrix layout: 7 rows (Mon through Sun) by 52-53 column weeks.
  - Cell size: `10px` square, `2px` border radius, `3px` gap.
  - Weekday indicators: Left column showing `Mon`, `Wed`, `Fri` at `9px` muted text.
  - Month headers: Positioned above week columns where a new month starts.
  - Intensity scale: Non-linear square root scaling `0.22 + 0.78 * sqrt(amount / peak)` using `foreground` color opacity. Zero spend renders as subtle `bg-muted/40` (`rgba(255, 255, 255, 0.04)`).
  - Footer: Left shows "Peak day" currency value, right shows 5-step "Less ... More" intensity legend.

### 3. List item / Transaction row
Standard row item for recurring bills, payments, and histories.

- **Structure**:
  - Left: `36px` rounded square icon container (`10px` radius) with 12% semantic tint background and matching icon color.
  - Middle: Item name (`13px`, font-medium, foreground) with category or frequency subtitle (`11px`, muted).
  - Right: Tabular amount (`13px`, font-medium, foreground or positive emerald) above date or status badge.
- **Interaction**: Subtle hover transition `bg-white/[0.02]` on desktop.

### 4. Status chips & Badges
Compact pill markers for trials, cycles, and categories.

- **Structure**: `rounded-full`, padding `3px 8px`, font size `10px`, tracking `+0.04em`.
- **Active / Success**: Emerald text on `rgba(169, 191, 169, 0.12)`.
- **Urgent / Warning**: Amber text on `rgba(210, 189, 147, 0.12)`.
- **Neutral / Meta**: Muted text on `rgba(255, 255, 255, 0.05)`.

---

## 6. Prompt Template for AI Generators (Stitch, v0, Lovable, Claude)

Copy and paste this prompt when generating new screens or starting companion projects:

```markdown
Design this interface using the SubKeep Design System:
- Theme: Dark-first, minimal, utilitarian, warm charcoal palette. Not pure black.
- Palette: Canvas is #08090b, cards are solid #121316, surface inset is rgba(255,255,255,0.035), borders are 1px solid rgba(255,255,255,0.07).
- Typography: Clean sans-serif (Inter/SF Pro). All financial values and numerals must use tabular-nums with tight tracking. Micro-labels must be 10px uppercase with letter-spacing: 0.16em.
- Surfaces: Cards must have 24px border radius, 1px hairline border, and a soft deep shadow (0 28px 56px -40px rgba(0,0,0,0.9)). Absolutely NO gradient backgrounds on card surfaces. Keep them solid matte.
- Accents: Desaturated mineral tones only. Positive/Income is sage emerald (#a9bfa9), negative/urgent is muted crimson (#c99a90), warnings/upcoming is warm sand amber (#d2bd93), secondary info is steel blue (#a6b0bd). Background tints are 12% opacity of the accent color.
- Spacing: 12px or 16px grid gaps, 20px or 24px card interior padding. High information density without clutter.
- Anti-patterns to avoid: No bright primary blue buttons, no neon gradients, no folder-tab header artifacts, no heavy drop shadows without hairline borders, no decorative illustrations.
```

---

## 7. Anti-Patterns & Rules

1. **No gradient card fills**: Never apply linear or radial gradients across `.surface` cards. Cards are solid matte.
2. **No pure black canvas**: `#000000` is harsh and unrefined. Canvas is `#08090b`; cards are `#121316`.
3. **No folder-tab cutouts**: Headers sit flush inside standard card padding with equal border radii.
4. **No saturated neon accents**: Never use `#00ff00`, `#ff0000`, or default Tailwind `blue-600`. Use the desaturated mineral palette.
5. **No proportional numerals for currency**: Always specify `tabular-nums` / `numeral` so numbers never jump during updates.
6. **No unbordered floating cards**: Drop shadows must always pair with a 1px hairline border `rgba(255, 255, 255, 0.07)`.
