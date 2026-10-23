# Design System

A specification for utilitarian, dark-first interfaces across web, desktop, and mobile applications.

---

## 1. Design Philosophy

- **Balanced minimalism**: High information density without decorative fluff. State only what is necessary to inform the user and enable action. Avoid extreme minimalism that trims away vital dates, figures, or navigation controls.
- **Dark-first foundation**: Warm charcoal tones (`#08090b` canvas, `#121316` card surface). Never harsh pitch black (`#000000`).
- **Solid matte surfaces**: Solid card colors with 1px hairline borders (`rgba(255, 255, 255, 0.07)`) and soft directional drop shadows. No gradient card overlays or glossy highlights.
- **Muted mineral accents**: Accent colors are desaturated earthy minerals (sage emerald, terracotta crimson, warm amber, steel blue). Never neon or high-saturation primaries.
- **Tabular financial figures**: Every financial numeral uses tabular alignment (`tabular-nums`) with tight tracking for vertical scanning.

---

## 2. Color Palette & Tokens

### Dark theme (default)

| Token | Value | Description |
| :--- | :--- | :--- |
| `background` | `#08090b` | App canvas background. Warm charcoal. |
| `card` | `#121316` | Solid card and surface background. |
| `surface` | `#17181c` | Secondary surface, active rows, hover cards. |
| `surface-inset` | `rgba(255, 255, 255, 0.035)` | Recessed sections, search input tracks, pills. |
| `popover` | `#15161a` | Menus, dropdowns, dialogs. |
| `border` | `rgba(255, 255, 255, 0.07)` | Hairline container border. |
| `border-subtle` | `rgba(255, 255, 255, 0.04)` | Inset dividers, row separators. |
| `foreground` | `#f4f4f2` | Primary text and strong icons. Warm off-white. |
| `muted-foreground` | `#8a8c92` | Secondary labels, descriptions, timestamps. |
| `subtle-foreground` | `#5f6065` | Inactive icons, placeholder text, hints. |
| `primary` | `#f2f1ec` | Inverted action buttons, high-emphasis triggers. |
| `primary-foreground`| `#0a0a0b` | Text on inverted primary buttons. |

### Light theme

| Token | Value | Description |
| :--- | :--- | :--- |
| `background` | `#f2f1ed` | Warm linen / alabaster canvas. |
| `card` | `#faf9f6` | Solid card surface, clean paper white. |
| `surface` | `#e8e6e0` | Hover rows, secondary containers. |
| `surface-inset` | `rgba(21, 21, 20, 0.035)` | Recessed chips, search input background. |
| `border` | `rgba(21, 21, 20, 0.09)` | Hairline container border. |
| `border-subtle` | `rgba(21, 21, 20, 0.05)` | Row dividers. |
| `foreground` | `#151514` | Primary text. Soft charcoal ink. |
| `muted-foreground` | `#6f6d67` | Secondary labels and body text. |
| `subtle-foreground` | `#9a9890` | Footers and placeholders. |
| `primary` | `#171716` | Dark CTA buttons. |
| `primary-foreground`| `#f6f4ef` | Light text on primary buttons. |

### Semantic accents

Use accent tones with 10% to 14% opacity backgrounds for indicators, icon holders, and status chips.

| Tone | Dark value | Dark BG tint (12%) | Light value | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Emerald** | `#a9bfa9` | `rgba(169, 191, 169, 0.12)` | `#4f7357` | Income, positive cashflow, success |
| **Crimson** | `#c99a90` | `rgba(194, 133, 123, 0.13)` | `#a2544a` | Expenses, negative net, cancellation, overdue |
| **Amber** | `#d2bd93` | `rgba(210, 189, 147, 0.12)` | `#8a6b34` | Upcoming bills, warnings, trial ending soon |
| **Blue** | `#a6b0bd` | `rgba(166, 176, 189, 0.12)` | `#5c6b7a` | Transfers, accounts, category tags |

---

## 3. Typography Scale

Default typeface: `Inter`, `SF Pro`, or system sans-serif.

| Role | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Number** | 28px - 32px | 600 (Semibold) | `-0.04em` (`-1.1px`) | Main balance, net worth, hero figures |
| **Section Title** | 18px - 20px | 600 (Semibold) | `-0.025em` (`-0.5px`)| Page headers, view titles |
| **Card / Panel Title**| 15px | 500 (Medium) | `-0.015em` (`-0.2px`)| Card header, table section titles |
| **Metric Value** | 20px - 22px | 500 (Medium) | `-0.03em`, `tabular-nums` | MetricCard numbers, recurring totals |
| **Body / Row Text** | 13px - 14px | 400 or 500 | Normal | Transaction descriptions, settings, lists |
| **Meta / Subtitle** | 11px - 12px | 400 (Regular) | Normal | Card subtitles, secondary metadata, dates |
| **Uppercase Label** | 10px | 500 or 600 | `+0.16em` (`+1.6px`) | Section category hints, micro KPI headers |
| **Micro Caption** | 9px - 10px | 500 (Medium) | Normal | Heatmap weekday/month markers, legends |

---

## 4. Content & Copywriting Rules

- **No subtitle fluff**: Do not place descriptive slogans or filler under headings (for example, omit "Balances, bills, and what is left"). If the header and numbers make the purpose obvious, skip the subtitle.
- **No vanity status pills**: Never render decorative badges for obvious or trivial states like "Online", "Status: Active", "Normal", or "Dashboard". Badges exist only for actionable or urgent state:
  - Allowed: `Trial ending`, `Overdue`, `Cancelled`, `Paid`, or currency switchers (`IDR`, `USD`).
  - Forbidden: "Online", "Active", "Operational", "Synced", "Ready".
- **Concise actionable labels**: Button labels use direct verbs ("Add transaction", "Save", "Filter", "Export"). Avoid conversational or long labels.
- **Preserve functional context**: Do not over-prune. Keep transaction categories, dates, bank account names, clear renewal countdowns, and quick filters.

---

## 5. Elevation, Radii & Surfaces

### Corner radius hierarchy

- **Outer container / Main card (`.surface`)**: `24px` (`rounded-3xl` or `rounded-[24px]`)
- **Inset section / Nested list (`.surface-inset`)**: `16px` (`rounded-2xl` or `rounded-[16px]`)
- **Interactive buttons, form inputs, dialogs**: `10px` to `12px` (`rounded-xl` or `rounded-[10px]`)
- **Pills / Status tags**: `9999px` (`rounded-full`)
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

- **Solid matte background**: No linear or radial gradient overlays on card surfaces.
- **No folder tabs**: Card headers sit flush inside standard card padding with uniform corners.
- **Border-free search inputs**: Search inputs sit inside a pill container (`borderRadius: 999`) with `surfaceInset` background and zero border outline.

---

## 6. Standard Components

### 1. MetricCard
Compact KPI card used across dashboards in 2, 3, or 4 column grids.

- **Structure**:
  1. Top row: Small uppercase label (`10px`, tracking `+0.16em`, muted).
  2. Middle row: Tabular numeral (`20px - 22px`, font-medium, foreground).
  3. Bottom row: Context label (`11px`, muted text) indicating recurrence or account count.
- **Padding**: `16px` (`p-4`).
- **Surface**: Solid card background, 24px radius, 1px border.

### 2. Activity heatmap
Full 52-week calendar spending matrix.

- **Structure**:
  - Header: "Activity", subtitle "Daily spending, past 52 weeks", active days count.
  - Matrix layout: 7 rows (Mon through Sun) by 52-53 column weeks.
  - Cell size: `10px` square, `2px` border radius, `3px` gap.
  - Weekday indicators: Left column showing `Mon`, `Wed`, `Fri` at `9px` muted text.
  - Month headers: Positioned above week columns where a new month starts.
  - Intensity scale: Square root scaling `0.22 + 0.78 * sqrt(amount / peak)` on foreground opacity. Zero spend renders at `rgba(255, 255, 255, 0.04)`.
  - Footer: Left displays "Peak day" currency value, right displays 5-step "Less ... More" intensity legend.

### 3. List item / Transaction row
Standard row item for transactions, bills, and accounts.

- **Structure**:
  - Left: `36px` rounded square icon container (`10px` radius) with 12% semantic tint background and matching icon color.
  - Middle: Item title (`13px`, font-medium, foreground) with category or frequency subtitle (`11px`, muted).
  - Right: Tabular amount (`13px`, font-medium, foreground or emerald for income) above date or status badge.

### 4. Search and filter bar
Input for filtering records by name, category, or date.

- **Structure**: Rounded pill (`rounded-full` or `borderRadius: 999`), inset background (`surfaceInset`), border-free (`border: 0`).
- **Left icon**: 14px search icon in muted foreground.
- **Text input**: 12px - 14px, transparent background, no focus ring outline.

---

## 7. Anti-Patterns & Strict Rules

1. **No gradient card fills**: Never apply linear or radial gradients across `.surface` cards. Cards are solid matte.
2. **No pure black canvas**: `#000000` is harsh. Canvas is `#08090b`; cards are `#121316`.
3. **No folder-tab cutouts**: Headers sit flush inside card padding with equal border radii.
4. **No vanity status pills**: Never display badges like "Online", "Active", "Operational", or "Normal". Use badges only for critical financial states or currency selection.
5. **No subtitle fluff**: Do not add marketing taglines, explanatory paragraphs, or filler slogans under titles inside application views.
6. **No over-trimming**: Never remove functional dates, transaction accounts, currency codes, or navigation buttons in the name of minimalism.
7. **No saturated neon accents**: Never use `#00ff00`, `#ff0000`, or default Tailwind `blue-600`. Use the desaturated mineral palette.
8. **No borders on search pills**: Inset search inputs must remain borderless.
