# Yoga Design System - Style Reference
> Utilitarian, dark-first interfaces with balanced minimalism, solid matte charcoal surfaces, muted mineral accents, and tabular figures.

**Theme:** dark (with neutral light mode support)

Yoga Design System is a specification for high-density, utilitarian interfaces across web, desktop, and mobile. The foundation rests on a warm charcoal canvas (`#08090b`), solid matte card surfaces (`#121316`), and hairline 1px borders (`rgba(255, 255, 255, 0.07)`). Elevated components cast soft directional drop shadows (`0 28px 56px -40px rgba(0, 0, 0, 0.9)`) rather than noisy gradients or glossy glassmorphism blur. Accents are desaturated, earthy minerals (sage emerald, terracotta crimson, warm amber, steel blue) paired with subtle 10% to 14% opacity background tints. Typography prioritizes information clarity: primary UI in Geist/Inter, with every numeric value, timer, and financial metric locked into tabular monospace alignment (`tabular-nums`) with tight tracking. Vanity status pills and subtitle fluff are prohibited; functional context and fast scanning are preserved.

## Tokens - Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Charcoal Canvas | `#08090b` | `--background` | Page background, deepest surface layer in dark mode. Never pitch black `#000000` |
| Foreground | `#f4f4f2` | `--foreground` | Primary readable text, high-contrast UI elements, headlines |
| Card Surface | `#121316` | `--card` | Elevated solid matte card surface, module panels, list containers |
| Card Foreground | `#f4f4f2` | `--card-foreground` | Primary text inside card containers |
| Surface Raised | `#17181c` | `--surface` | Popovers, dropdown menus, hover fills, elevated modal panels |
| Surface Inset | `rgba(255, 255, 255, 0.035)` | `--surface-inset` | Inset wells, inner row backgrounds, borderless search pill background |
| Primary CTA | `#f2f1ec` | `--primary` | High-contrast action buttons, active pill indicator fills |
| Primary Foreground | `#0a0a0b` | `--primary-foreground` | Text and icons sitting on primary action fills |
| Secondary Surface | `#17181c` | `--secondary` | Secondary buttons, button hover states, neutral chips |
| Muted Foreground | `#8a8c92` | `--muted-foreground` | Secondary labels, descriptions, timestamps, table column headers |
| Subtle Foreground | `#5f6065` | `--subtle-foreground` | Inactive tabs, placeholder text, disabled states, lowest readable neutral |
| Border Hairline | `rgba(255, 255, 255, 0.07)` | `--border` | Standard 1px card boundaries, divider lines, button outlines |
| Border Subtle | `rgba(255, 255, 255, 0.04)` | `--border-subtle` | Inset card borders, nested dividers |
| Focus Ring | `#5f6065` | `--ring` | Keyboard focus outline and active input boundary |
| Sage Emerald | `#a9bfa9` | `--emerald` | Success states, positive metric deltas, completed tasks |
| Emerald Tint | `rgba(169, 191, 169, 0.12)` | `--emerald-bg` | Background pill tint for positive / success indicators |
| Terracotta Crimson | `#c99a90` | `--crimson` | Negative deltas, destructive actions, overdue alerts, errors |
| Crimson Tint | `rgba(194, 133, 123, 0.13)` | `--crimson-bg` | Background pill tint for negative / destructive indicators |
| Warm Amber | `#d2bd93` | `--amber` | Warning alerts, pending states, active countdown timers |
| Amber Tint | `rgba(210, 189, 147, 0.12)` | `--amber-bg` | Background pill tint for warning / active states |
| Steel Blue | `#a6b0bd` | `--blue` | Informational badges, categorical tags, metadata chips |
| Blue Tint | `rgba(166, 176, 189, 0.12)` | `--blue-bg` | Background pill tint for informational / category tags |

## Tokens - Typography

### Geist / Inter - Primary UI Sans
Primary interface typeface for navigation, body text, buttons, and section titles.
- **Substitute:** Inter, Geist Sans, system-ui
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Sizes:** 10px, 11px, 13px, 14px, 15px, 18px, 20px, 28px, 32px
- **Role:** Structural interface typography, labels, descriptions, and interactive controls

### Geist Mono / JetBrains Mono - Monospace & Tabular Figures
Monospace typeface for all financial figures, metrics, timers, tables, code snippets, and dates.
- **Substitute:** JetBrains Mono, Geist Mono, Fira Code, ui-monospace
- **Weights:** 400, 500, 600, 700
- **OpenType features:** `tabular-nums`
- **Role:** Every numeric figure, timer, currency amount, and data-dense table column

### Type Scale

| Role | Family | Weight | Size | Line Height | Letter Spacing | Token |
|------|--------|--------|------|-------------|----------------|-------|
| Micro Caption | Mono | 500 | 9px - 10px | 1.2 | Normal | `--text-micro` |
| Uppercase Hint | Sans | 500 / 600 | 10px | 1.2 | `+0.16em` (`tracking-[0.16em]`) | `--text-hint` |
| Meta / Subtitle | Sans | 400 | 11px - 12px | 1.3 | Normal | `--text-meta` |
| Body / Row | Sans | 400 / 500 | 13px - 14px | 1.4 | Normal | `--text-body` |
| Card Title | Sans | 500 | 15px | 1.3 | `-0.015em` (`tracking-[-0.015em]`) | `--text-card-title` |
| Section Header | Sans | 600 | 18px - 20px | 1.25 | `-0.025em` (`tracking-[-0.025em]`) | `--text-section` |
| Metric Value | Mono | 500 | 20px - 22px | 1.2 | `-0.03em`, `tabular-nums` | `--text-metric` |
| Display Number | Mono / Sans | 600 | 28px - 32px | 1.15 | `-0.04em`, `tabular-nums` | `--text-display` |
| Hero Figure | Mono | 700 | 56px - 128px | 1.0 | `tracking-tighter`, `tabular-nums` | `--text-hero` |

## Tokens - Spacing & Shapes

**Base unit:** 4px  
**Density:** Balanced, compact, high information density

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 1 | 4px | `--spacing-1` |
| 2 | 8px | `--spacing-2` |
| 3 | 12px | `--spacing-3` |
| 4 | 16px | `--spacing-4` |
| 5 | 20px | `--spacing-5` |
| 6 | 24px | `--spacing-6` |
| 8 | 32px | `--spacing-8` |
| 10 | 40px | `--spacing-10` |
| 12 | 48px | `--spacing-12` |
| 16 | 64px | `--spacing-16` |
| 24 | 96px | `--spacing-24` |

### Border Radius

| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Micro indicators, bar cells, heatmap units | 2px | `rounded-[2px]` |
| Form inputs, text fields, search boxes | 10px | `rounded-[10px]` |
| Interactive buttons, dialogs, action triggers | 12px | `rounded-[12px]` |
| Inset panels, inner cards, nested list wells | 16px | `rounded-[16px]` |
| Outer container, main module cards, panels | 24px | `rounded-[24px]` |
| Floating nav dock, pills, status tags, chips | 9999px | `rounded-full` |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| Card Elevation | `0 28px 56px -40px rgba(0, 0, 0, 0.9)` | `--shadow-card` |

### Layout

- **Page max-width:** `max-w-md` (mobile workflows), `max-w-2xl` (focused forms), or `max-w-7xl` (dashboards)
- **Page responsive padding:** `p-4 sm:p-6 md:px-28 pb-24`
- **Section gap:** 24px - 48px
- **Card inner padding:** 20px (`p-5`)
- **Element gap:** 8px - 16px

## Components

### Main Surface Card
**Role:** Main module card for dashboard widgets, panels, and sections.
Solid matte `#121316` card surface with 1px hairline border `rgba(255, 255, 255, 0.07)`, 24px border radius, and directional drop shadow `0 28px 56px -40px rgba(0, 0, 0, 0.9)`. Inner header contains an icon inside a 10px rounded `surface-inset` container, followed by a 15px medium card title.

### Floating Pill Navigation Bar
**Role:** Dock navigation bar, view switchers, persistent bottom or top menus.
Floating pill container with `rounded-full`, `#121316` card background, 1px hairline border, and card drop shadow. Items are circular or pill buttons (44px-48px) with `rounded-full`. Active items use `bg-primary text-primary-foreground`; inactive items use `text-muted-foreground hover:text-foreground hover:bg-surface`. Micro-interactions define `active:scale-95 transition-all duration-300`.

### Metric KPI Card
**Role:** Glanceable KPI card in multi-column grids (2, 3, or 4 columns).
Surface card layout (`p-5`, 24px radius). Contains an uppercase 10px tracking `+0.16em` label on the top left, paired with an icon in a 10px `surface-inset` container on the top right. Large metric value (20px-22px) in tabular numbers (`tabular-nums tracking-[-0.03em]`) in the center. Subtext description (11px) in `muted-foreground` below.

### Hero Display Figure / Timer
**Role:** Focus timers, countdown clocks, giant account balances.
Extra-large display typography (`text-5xl` to `text-8xl`), bold weight (700), tight tracking (`tracking-tighter`), tabular monospace alignment (`tabular-nums`), and text color `#f4f4f2`. Centered vertically in viewport height.

### Semantic Icon Badge
**Role:** Status indicators and category chips with muted mineral tints.
Icon containers with 10px border radius and 6px padding (`p-1.5`). Uses mineral background tints (12% opacity) paired with desaturated foreground colors:
- Emerald (positive/success): `bg-emerald-bg text-emerald`
- Amber (warning/active): `bg-amber-bg text-amber`
- Crimson (danger/destructive): `bg-crimson-bg text-crimson`
- Blue (info/category): `bg-blue-bg text-blue`

### Primary Action Button
**Role:** Main call to action.
Height 48px (`h-12`), 24px horizontal padding (`px-6`), 12px border radius (`rounded-[12px]`). Solid high-contrast fill (`bg-primary text-primary-foreground`), medium weight, with micro-interaction `active:scale-95 transition-all duration-300 cursor-pointer`.

### Secondary / Outline Button
**Role:** Secondary actions, dismiss, filter toggles.
Height 48px (`h-12`), 16px horizontal padding (`px-4`), 12px border radius. Transparent background with 2px hairline border (`border-2 border-border text-foreground hover:bg-secondary`). Micro-interaction `active:scale-95 transition-all duration-300 cursor-pointer`.

### Inset Search & Filter Pill
**Role:** Fast filter search bar.
Height 44px (`h-11`), border-radius 9999px (`rounded-full`), background `bg-surface-inset` (`rgba(255, 255, 255, 0.035)`), with zero borders (`border-0`). Contains a 16px search icon in `muted-foreground` and an unbordered transparent input field.

## Do's and Don'ts

### Do
- Use warm charcoal `#08090b` for canvas and `#121316` for cards in dark mode.
- Use solid matte surfaces with 1px hairline borders (`rgba(255, 255, 255, 0.07)`).
- Apply tabular alignment (`tabular-nums`) to every number, timer, currency amount, and date.
- Use desaturated earthy mineral accents (sage, terracotta, warm amber, steel blue) with 10% to 14% background tints.
- Enforce micro-interactions (`active:scale-95 transition-all duration-300`) on all clickable elements.
- Keep transaction categories, dates, bank names, and renewal counts clear and actionable.

### Don't
- Do not use pitch black `#000000` for canvas or surfaces.
- Do not use gradient card fills, glassmorphism blur overlays, or glossy highlight strokes.
- Do not use generic unstyled Tailwind grays (`bg-zinc-900 border-zinc-800`); use custom theme tokens.
- Do not show vanity status badges like "Online", "Active", "Operational", or "Normal". Badges exist only for actionable urgency (e.g. `Overdue`, `Trial ending`).
- Do not add subtitle fluff or marketing taglines under headers (e.g. omit "Balances, bills, and what is left").
- Do not use saturated neon primaries (`#00ff00`, `#ff0000`, or standard `blue-600`).
- Do not add borders to inset search pills; keep them borderless.
- Do not use emojis in UI copy, buttons, or labels.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Charcoal Canvas | `#08090b` | Base page canvas, view viewport, deepest foundation layer |
| 1 | Card Surface | `#121316` | Solid matte cards, primary module containers, panels |
| 2 | Surface Raised | `#17181c` | Dropdown menus, popovers, modal sheets, elevated button fills |
| 3 | Surface Inset | `rgba(255, 255, 255, 0.035)` | Nested list rows, icon badge backdrops, borderless search pills |

## Elevation

- **Main cards and dock navigation:** `0 28px 56px -40px rgba(0, 0, 0, 0.9)` with 1px border `rgba(255, 255, 255, 0.07)`
- **Inset elements and search pills:** Zero shadow, zero border, solid tint `rgba(255, 255, 255, 0.035)`
- **Active focus states:** 2px ring `#5f6065` with 2px offset on keyboard navigation

## Imagery

Interfaces prioritize live product data over decorative imagery. No 3D renders, no stock photography, and no decorative illustrations. Icons are minimal, stroke-based (1.5px or 2px), outlined, and monochromatic (`currentColor`). Data charts use thin hairline strokes with solid matte fills and tabular tooltips.

## Layout

Clean vertical rhythm with centered max-width containers (`max-w-md`, `max-w-2xl`, `max-w-7xl mx-auto`). Section spacing ranges from 24px to 48px. Hero focus components (timers, hero balance cards) are centered vertically in the viewport (`min-h-[50vh] flex flex-col items-center justify-center`). Grids use 2, 3, or 4 equal columns with 16px gaps.

## Agent Prompt Guide

**Quick Color Reference**
- text: `#f4f4f2` (Foreground)
- text secondary / muted: `#8a8c92` (Muted Foreground)
- text subtle: `#5f6065` (Subtle Foreground)
- background: `#08090b` (Charcoal Canvas)
- card surface: `#121316` (Card Surface)
- border: `rgba(255, 255, 255, 0.07)`
- emerald accent: `#a9bfa9` / tint: `rgba(169, 191, 169, 0.12)`
- amber accent: `#d2bd93` / tint: `rgba(210, 189, 147, 0.12)`
- crimson accent: `#c99a90` / tint: `rgba(194, 133, 123, 0.13)`
- blue accent: `#a6b0bd` / tint: `rgba(166, 176, 189, 0.12)`

**Example Component Prompts**
1. *Create a dashboard module on #08090b canvas using a #121316 matte card surface, 1px border rgba(255,255,255,0.07), rounded-[24px], and shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)]. Include an icon in a rounded-[10px] surface-inset container and a 15px font-medium title. No subtitle fluff.*
2. *Create a 3-column metric KPI grid: each card p-5 bg-card border border-border rounded-[24px]. Top: 10px uppercase tracking-[0.16em] label and icon badge. Center: 22px tabular-nums font-medium value. Bottom: 11px muted description.*
3. *Create a floating dock navigation bar centered at the bottom of the screen: rounded-full p-2 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)]. Active item rounded-full bg-primary text-primary-foreground; inactive item rounded-full text-muted-foreground hover:bg-surface. Include active:scale-95 transition-all duration-300.*

**Spacing & Type Rules for All Prompts**
- Base unit: 4px. Element gap: 8px - 16px. Card padding: 20px (`p-5`).
- Headings: Geist/Inter 500/600. All numbers and timers: tabular-nums with tight tracking.
- Radii: outer cards 24px, inner cards 16px, buttons 12px, inputs 10px, pills 9999px.

## Similar Brands

- **Linear:** Charcoal canvas, solid matte surfaces, muted mineral accents, tight tracking
- **Raycast:** High information density, dark charcoal foundations, tabular data alignments
- **Vercel:** Clean utilitarian typography, hairline 1px borders, subtle monochrome hierarchy
- **Cron / Notion Calendar:** Tabular figures, focused minimalist scheduling, mineral categorization

## Quick Start

### CSS Custom Properties

```css
:root {
  --background: #f2f1ed;
  --foreground: #151514;
  --card: #faf9f6;
  --card-foreground: #151514;
  --surface: #e8e6e0;
  --surface-foreground: #151514;
  --surface-inset: rgba(21, 21, 20, 0.035);
  --popover: #faf9f6;
  --popover-foreground: #151514;
  --primary: #171716;
  --primary-foreground: #f6f4ef;
  --secondary: #e8e6e0;
  --secondary-foreground: #151514;
  --muted: #e8e6e0;
  --muted-foreground: #6f6d67;
  --subtle-foreground: #9a9890;
  --accent: #e8e6e0;
  --accent-foreground: #151514;
  --destructive: #a2544a;
  --destructive-foreground: #f6f4ef;
  --border: rgba(21, 21, 20, 0.09);
  --border-subtle: rgba(21, 21, 20, 0.05);
  --input: rgba(21, 21, 20, 0.09);
  --ring: #9a9890;
  --emerald: #4f7357;
  --emerald-bg: rgba(79, 115, 87, 0.12);
  --crimson: #a2544a;
  --crimson-bg: rgba(162, 84, 74, 0.13);
  --amber: #8a6b34;
  --amber-bg: rgba(138, 107, 52, 0.12);
  --blue: #5c6b7a;
  --blue-bg: rgba(92, 107, 122, 0.12);
  --radius: 24px;
}

.dark {
  --background: #08090b;
  --foreground: #f4f4f2;
  --card: #121316;
  --card-foreground: #f4f4f2;
  --surface: #17181c;
  --surface-foreground: #f4f4f2;
  --surface-inset: rgba(255, 255, 255, 0.035);
  --popover: #15161a;
  --popover-foreground: #f4f4f2;
  --primary: #f2f1ec;
  --primary-foreground: #0a0a0b;
  --secondary: #17181c;
  --secondary-foreground: #f4f4f2;
  --muted: #17181c;
  --muted-foreground: #8a8c92;
  --subtle-foreground: #5f6065;
  --accent: #17181c;
  --accent-foreground: #f4f4f2;
  --destructive: #c99a90;
  --destructive-foreground: #0a0a0b;
  --border: rgba(255, 255, 255, 0.07);
  --border-subtle: rgba(255, 255, 255, 0.04);
  --input: rgba(255, 255, 255, 0.07);
  --ring: #5f6065;
  --emerald: #a9bfa9;
  --emerald-bg: rgba(169, 191, 169, 0.12);
  --crimson: #c99a90;
  --crimson-bg: rgba(194, 133, 123, 0.13);
  --amber: #d2bd93;
  --amber-bg: rgba(210, 189, 147, 0.12);
  --blue: #a6b0bd;
  --blue-bg: rgba(166, 176, 189, 0.12);
  --radius: 24px;
}
```

### Tailwind v4 Theme Configuration

```css
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-surface: var(--surface);
  --color-surface-foreground: var(--surface-foreground);
  --color-surface-inset: var(--surface-inset);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-subtle-foreground: var(--subtle-foreground);
  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-emerald: var(--emerald);
  --color-emerald-bg: var(--emerald-bg);
  --color-crimson: var(--crimson);
  --color-crimson-bg: var(--crimson-bg);
  --color-amber: var(--amber);
  --color-amber-bg: var(--amber-bg);
  --color-blue: var(--blue);
  --color-blue-bg: var(--blue-bg);

  --radius-xs: 2px;
  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
}

@layer utilities {
  .surface {
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: 24px;
    box-shadow: 0 28px 56px -40px rgba(0, 0, 0, 0.9);
  }
  .surface-inset {
    background-color: var(--surface-inset);
    border-radius: 16px;
  }
  .search-pill {
    background-color: var(--surface-inset);
    border: 0;
    border-radius: 9999px;
  }
}
```

### Component TSX Blueprints

#### 1. Main Surface Card
```tsx
<div className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">Card Title</h3>
    </div>
  </div>
  {children}
</div>
```

#### 2. Floating Pill Navigation Bar
```tsx
<nav className="flex items-center gap-2 p-2 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-full">
  <button className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full text-primary-foreground bg-primary shadow-sm transition-all duration-300 active:scale-95">
    <Icon className="w-5 h-5" />
  </button>
  <button className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-300 active:scale-95">
    <Icon className="w-5 h-5" />
  </button>
</nav>
```

#### 3. Metric KPI Card
```tsx
<div className="p-5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      Label
    </span>
    <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
      <Icon className="w-4 h-4" />
    </div>
  </div>
  <div className="text-[22px] font-medium tabular-nums tracking-[-0.03em] text-foreground my-1">
    1,420
  </div>
  <span className="text-[11px] text-muted-foreground">
    Subtext description
  </span>
</div>
```

#### 4. Hero Display Figure / Timer
```tsx
<div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
  25:00
</div>
```

#### 5. Semantic Icon Badges
```tsx
{/* Emerald (Positive / Success) */}
<div className="p-1.5 bg-emerald-bg rounded-[10px] text-emerald">
  <Icon className="w-4 h-4" />
</div>

{/* Amber (Warning / Active) */}
<div className="p-1.5 bg-amber-bg rounded-[10px] text-amber">
  <Icon className="w-4 h-4" />
</div>

{/* Crimson (Negative / Danger) */}
<div className="p-1.5 bg-crimson-bg rounded-[10px] text-crimson">
  <Icon className="w-4 h-4" />
</div>

{/* Blue (Info / Tag) */}
<div className="p-1.5 bg-blue-bg rounded-[10px] text-blue">
  <Icon className="w-4 h-4" />
</div>
```

#### 6. Action Buttons
```tsx
{/* Primary CTA */}
<button className="h-12 px-6 rounded-[12px] bg-primary text-primary-foreground font-medium shadow-md hover:shadow active:scale-95 transition-all duration-300 cursor-pointer">
  Start Session
</button>

{/* Secondary / Outline Button */}
<button className="h-12 px-4 rounded-[12px] border-2 border-border bg-transparent text-foreground hover:bg-secondary hover:border-border/80 active:scale-95 transition-all duration-300 cursor-pointer">
  Settings
</button>
```

#### 7. Search and Filter Bar
```tsx
<div className="flex items-center gap-2 px-4 h-11 bg-surface-inset rounded-full border-0">
  <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full bg-transparent text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none border-0"
  />
</div>
```
