# Design System

A specification for utilitarian, dark-first interfaces across web, desktop, and mobile applications.

---

## 1. Design Philosophy

- **Balanced minimalism**: High information density without decorative fluff. State only what is necessary to inform the user and enable action. Avoid extreme minimalism that trims away vital dates, figures, or navigation controls.
- **Dark-first foundation**: Warm charcoal tones (`#08090b` canvas, `#121316` card surface). Never harsh pitch black (`#000000`).
- **Solid matte surfaces**: Solid card colors with 1px hairline borders (`rgba(255, 255, 255, 0.07)`) and soft directional drop shadows (`0 28px 56px -40px rgba(0, 0, 0, 0.9)`). No gradient card overlays, glassmorphism blur, or glossy highlights.
- **Muted mineral accents**: Accent colors are desaturated earthy minerals (sage emerald, terracotta crimson, warm amber, steel blue) paired with 10% to 14% opacity background tints. Never neon or high-saturation primaries.
- **Tabular figures**: Every numeric value, financial figure, and timer uses tabular alignment (`tabular-nums`) with tight tracking for vertical scanning.

---

## 2. Typography & Font Configuration

### Font Stack

- **Primary UI Sans**: `Geist` or `Inter` (`--font-sans`, `--font-geist-sans`).
- **Monospace / Numerals / Timers**: `Geist Mono` or `JetBrains Mono` (`--font-mono`, `--font-geist-mono`).

### Next.js Font Setup Blueprint

```tsx
import { Geist, Geist_Mono, Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
```

### Typography Scale

| Role | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | 56px - 128px (`text-5xl` to `text-8xl`) | 700 (Bold) | `tracking-tighter`, `tabular-nums` | Stopwatches, countdown timers, giant figures |
| **Display Number** | 28px - 32px | 600 (Semibold) | `-0.04em` (`tracking-[-0.04em]`) | Main balance, net worth, hero figures |
| **Section Title** | 18px - 20px | 600 (Semibold) | `-0.025em` (`tracking-[-0.025em]`)| Page headers, view titles |
| **Card / Panel Title**| 15px | 500 (Medium) | `-0.015em` (`tracking-[-0.015em]`)| Card header, table section titles |
| **Metric Value** | 20px - 22px | 500 (Medium) | `-0.03em`, `tabular-nums` | MetricCard numbers, recurring totals |
| **Body / Row Text** | 13px - 14px | 400 or 500 | Normal | Transaction descriptions, settings, lists |
| **Meta / Subtitle** | 11px - 12px | 400 (Regular) | Normal | Card subtitles, secondary metadata, dates |
| **Uppercase Label** | 10px | 500 or 600 | `+0.16em` (`tracking-[0.16em]`) | Section category hints, micro KPI headers |
| **Micro Caption** | 9px - 10px | 500 (Medium) | Normal | Heatmap weekday/month markers, legends |

---

## 3. Color Tokens & CSS Variables

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

### Tailwind Theme & Utilities

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

---

## 4. Elevation, Radii & Shadows

### Corner Radius Hierarchy

- **Outer container / Main card**: `24px` (`rounded-[24px]` or `rounded-3xl`)
- **Inset section / Nested list / Inner card**: `16px` (`rounded-[16px]` or `rounded-2xl`)
- **Interactive buttons, form inputs, dialogs**: `10px` to `12px` (`rounded-[10px]` or `rounded-xl`)
- **Pill navigations, status tags, toggle chips**: `9999px` (`rounded-full`)
- **Micro-indicators, bar cells, heatmap units**: `2px` (`rounded-[2px]`)

### Shadow Specification

Use this exact shadow for all elevated cards and navigation containers:

```css
box-shadow: 0 28px 56px -40px rgba(0, 0, 0, 0.9);
```

Tailwind utility equivalent: `shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)]`.

---

## 5. Concrete Component Blueprints

### 1. Main Surface Card

Used for panels, stat containers, and dashboard modules.

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

### 2. Floating Pill Navigation Bar

Used for dock bars, view switchers, and persistent floating menus.

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

### 3. Metric KPI Card

Used in grid layouts (2, 3, or 4 columns) for quick glances.

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

### 4. Hero Display Figure / Timer

Used for hero stopwatches, countdowns, and giant balances.

```tsx
<div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
  25:00
</div>
```

### 5. Semantic Icon Container

Icon badges with muted mineral background tints.

```tsx
{/* Emerald (Success / Positive) */}
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

### 6. Interactive Action Buttons

Buttons feature clear micro-interactions (`active:scale-95`, `transition-all duration-300`).

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

### 7. Search and Filter Bar

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

---

## 6. Layout & Spacing Rules

- **Container widths**: Constrain readable interfaces with `max-w-md`, `max-w-2xl`, or `max-w-7xl mx-auto`.
- **Page padding**: Standard responsive padding `p-4 sm:p-6 md:px-28 pb-24`.
- **Vertical centering**: Center hero workflows (e.g. timers, focus blocks, key actions) in available viewport height (`min-h-[50vh] flex flex-col items-center justify-center`).
- **Smooth transitions**: Every interactive element must define `transition-all duration-300 ease-out`.

---

## 7. Content & Copywriting Rules

- **No subtitle fluff**: Do not place descriptive slogans or filler under headings (for example, omit "Balances, bills, and what is left"). If the header and numbers make the purpose obvious, skip the subtitle.
- **No vanity status pills**: Never render decorative badges for obvious or trivial states like "Online", "Status: Active", "Normal", or "Dashboard". Badges exist only for actionable or urgent state:
  - Allowed: `Trial ending`, `Overdue`, `Cancelled`, `Paid`, or currency switchers (`IDR`, `USD`).
  - Forbidden: "Online", "Active", "Operational", "Synced", "Ready".
- **Concise actionable labels**: Button labels use direct verbs ("Add transaction", "Save", "Filter", "Export"). Avoid conversational or long labels.
- **Preserve functional context**: Do not over-prune. Keep transaction categories, dates, bank account names, clear renewal countdowns, and quick filters.

---

## 8. Anti-Patterns & Strict Rules

1. **No generic zinc/gray defaults**: Never use unstyled Tailwind `bg-zinc-900 border-zinc-800`. Always use the custom tokens (`bg-card`, `bg-background`, `border-border`).
2. **No gradient card fills**: Never apply linear or radial gradients across `.surface` cards. Cards are solid matte `#121316`.
3. **No pure black canvas**: `#000000` is harsh. Canvas is `#08090b`; cards are `#121316`.
4. **No folder-tab cutouts**: Headers sit flush inside card padding with equal border radii.
5. **No vanity status pills**: Never display badges like "Online", "Active", "Operational", or "Normal".
6. **No subtitle fluff**: Do not add marketing taglines, explanatory paragraphs, or filler slogans under titles inside application views.
7. **No saturated neon accents**: Never use `#00ff00`, `#ff0000`, or default Tailwind `blue-600`. Use the desaturated mineral palette.
8. **No borders on search pills**: Inset search inputs must remain borderless.
9. **Never omit micro-interactions**: Every clickable item must feature `active:scale-95` and `transition-all duration-300`.
