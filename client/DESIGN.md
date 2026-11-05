---
name: TuneTracker 2.0
description: Create. Collaborate. Share. A production workflow board for music projects.
colors:
  midnight-ground: "#060a1c"
  midnight-stock: "#0a1027"
  midnight-stock-2: "#0f1734"
  midnight-popover: "#0d1431"
  midnight-accent: "#16204a"
  midnight-ink: "#e8ecff"
  midnight-ink-muted: "#9ba7cf"
  midnight-ink-soft: "#7e8ab4"
  midnight-border: "rgb(150 168 255 / 0.13)"
  midnight-rule: "rgb(150 168 255 / 0.22)"
  midnight-primary: "#3460f5"
  midnight-ring: "#5c8dff"
  midnight-electric: "#4a7dff"
  midnight-cyan: "#2ee6ff"
  midnight-indigo: "#6366f1"
  midnight-violet: "#a46bff"
  midnight-success: "#34d399"
  midnight-warning: "#fbbf24"
  midnight-destructive: "#ff5a7a"
  day-ground: "#f3f5fb"
  day-stock: "#ffffff"
  day-stock-2: "#e9edf8"
  day-accent: "#e3e8fb"
  day-ink: "#0b1230"
  day-ink-muted: "#4a5578"
  day-ink-soft: "#5d6889"
  day-border: "#d5dbee"
  day-rule: "#c3cbe4"
  day-primary: "#2447d8"
  day-cyan: "#0891b2"
  day-indigo: "#4338ca"
  day-violet: "#7c3aed"
  day-success: "#047857"
  day-warning: "#b45309"
  day-destructive: "#c8203f"
  on-action: "#ffffff"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 4.4vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "no-common-ligatures"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 75"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    fontFeature: "'tnum' 1, 'zero' 0"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  card: "12px"
  sheet: "24px"
  gutter-mobile: "20px"
  gutter: "32px"
  grid-gap: "48px"
  section: "96px"
  container: "80rem"
components:
  button-primary:
    backgroundColor: "{colors.midnight-primary}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-lg:
    backgroundColor: "{colors.midnight-primary}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.midnight-ground}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.midnight-stock}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "40px"
  sheet:
    backgroundColor: "{colors.midnight-stock}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sheet}"
  task-card:
    backgroundColor: "{colors.midnight-stock}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.card}"
  label-chip:
    backgroundColor: "{colors.midnight-stock-2}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  status-pill:
    textColor: "{colors.midnight-electric}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  nav-item-active:
    backgroundColor: "{colors.midnight-accent}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
---

# Design System: TuneTracker 2.0

## Overview

**Creative North Star: "Liner Notes"**

Every project reads like the credits page of the record it will become. The ground is midnight-navy booklet stock; the type is set like an album's credits: heavy expanded italic titles that echo the poster wordmark, condensed caps for roles, tabular mono for every number (track number, BPM, key, duration, date). Information is arranged as credits, with a role on the left, a dotted leader, and the name on the right, held between hairline rules rather than inside boxed cards.

The logo's cyan-to-blue-to-violet gradient is the only light source in the world. It appears in four places: primary actions, the moving edge of a drag (the lifted card's border and its drop slot), live in-motion fills (audio playback and upload progress), and soft blooms placed behind a focal element. Everything at rest stays navy. Density is calm on marketing and comfortable-compact in the app; the board is the centrepiece and the rest of the interface supports it.

Dark is the default ("midnight booklet"). The light theme is a designed day sleeve, not an inversion: cool white stock, navy ink and the same gradient, with blooms dimmed to 35%. Both themes ship every token below; frontmatter keys are prefixed `midnight-` and `day-` and map one-to-one onto the same CSS custom properties (`--background`, `--stock`, `--rule`, `--electric` and so on) in `src/app/globals.css`, which is the normative source.

**Key Characteristics:**
- Credits layout: role, dotted leader, name, between hairline rules.
- One light source: the logo gradient, reserved for actions, motion and blooms.
- Three type voices from two families: expanded heavy italic titles, condensed caps roles, tabular mono figures.
- Dark default plus a fully designed day sleeve.
- One staggered "needle drop" reveal; no scattered hover effects.
- All icons are lucide line icons. No emoji anywhere, including reactions.

## Colors

A cool, near-monochrome navy palette lit by a single neon gradient, with semantic colors kept to status text.

### Primary
- **Electric Blue** (`midnight-primary` / `day-primary`): the solid fallback for primary actions, the focus ring family, the "2.0" in the wordmark, active-nav icons, step numbers and private-by-default lock icons. `midnight-electric` is the lighter text-weight sibling used for accent text and caret/accent-color.
- **Logo Light** (gradient, sidecar `gradient-light`: cyan, blue, violet at 115deg): the drag edge, live playback and upload fills, waveform played portion.
- **Action Gradient** (sidecar `gradient-action`: blue, indigo, violet at 115deg): the background of every default button and the round play button. Text on it is always white.

### Secondary
- **Neon Cyan** (`midnight-cyan` / `day-cyan`) and **Controlled Violet** (`midnight-violet` / `day-violet`): the two ends of the logo gradient. They appear inside the gradient and the bloom, not as standalone fills.
- **Indigo** (`midnight-indigo` / `day-indigo`): the gradient's midpoint.

### Neutral
- **Midnight Ground** (`midnight-ground`): page background. Day: `day-ground`.
- **Booklet Stock** (`midnight-stock`): sheets, cards, inputs, the app sidebar and alternating marketing bands. `midnight-stock-2` is the recessed layer (board columns, audio wells).
- **Accent Wash** (`midnight-accent`): the active nav item and drop-target wash.
- **Ink** (`midnight-ink`), **Muted Ink** (`midnight-ink-muted`) for body copy and roles, **Soft Ink** (`midnight-ink-soft`) for quiet meta, low/medium priority and empty-state icons.
- **Border** (`midnight-border`) separates rows and sheets; **Rule** (`midnight-rule`) is the stronger hairline that brackets a credits block, and the dotted leader color.

### Semantic
- **Warning** (high priority), **Destructive** (urgent priority, overdue dates, destructive actions), **Success**. These colour text only, never fills.

### Named Rules
**The One Light Rule.** The logo gradient is the only light. Use it for primary actions, the moving edge of a drag, live in-motion fills and blooms. Progress rules at rest, priority labels, chips and headings stay solid and quiet.

**The At-Rest Navy Rule.** A static progress bar is solid ink at 70% on a muted track. Colour arrives only with motion or intent.

## Typography

**Display Font:** Archivo (variable, `wdth` axis), with ui-sans-serif, system-ui
**Body Font:** Archivo
**Label/Mono Font:** JetBrains Mono for figures

**Character:** One variable family carries both extremes: stretched to 125% and heavy italic for titles, compressed to 75% in caps for credit roles. Mono is reserved for numbers so every figure lines up.

### Hierarchy
- **Display** (800 italic, 125% width, clamp(2.75rem, 4.4vw, 4.75rem) on desktop and clamp(2.4rem, 11vw, 4.25rem) on mobile, line-height 0.95): the hero title only.
- **Headline** (800 italic, 125% width, 3rem; 2.25rem below 640px; the closing headline goes to 3.75rem): marketing section titles.
- **Title** (800 italic, 125% width, 2.25rem; 1.875rem on mobile): app page titles via the page header. The same style drops to 1.25 to 1.875rem for sheet, post and board titles.
- **Body** (400, 1rem, 1.5; lead copy 1.125rem in muted ink, max-width about 28rem): prose. Paragraphs use `text-wrap: pretty`, headings use `balance`.
- **Label / Role** (600, 75% width, uppercase, 0.08em tracking, 0.72rem): credit roles, column headings, section headings, captions. The tagline credit line uses the same style at 1rem with 0.2em tracking.
- **Figure** (JetBrains Mono, tabular numerals, slashed zero off): every number: BPM, key, dates, durations, counts, step indices.

### Named Rules
**The One Numeric Voice Rule.** Every number that a musician reads (BPM, key, time, count, date) is set in tabular mono. Prose numbers such as "50 MB" in a sentence stay in body type.

**The Clean Glyph Rule.** Body text turns off common ligatures (`font-variant-ligatures: no-common-ligatures`) and uses `text-rendering: geometricPrecision`. Archivo's fi/fl ligatures and hinting open visible gaps at the width-axis default on Chromium and Linux. Keep both settings on any new root.

**The Credits Line Rule.** Titles are never preceded by a kicker or eyebrow. If a title needs a supporting line, it sits below the title as a credits line in role type.

## Layout

The container is 80rem with a 20px gutter (32px from 640px). Marketing sections use a 12-column grid from 1024px: copy takes 5 columns and the proof (board, sheet, credits) takes the other 6 to 7, alternating sides, with a 48px gap. Sections run 96px vertically and alternate between ground and stock bands separated by full-width border lines. The hero leads with the title and offer on the left and a live demo board on the right, then a full-bleed credits strip.

The app shell is a 16.5rem sticky stock sidebar beside the content from 1024px, and a top bar below that. Page headers put the title left and actions right, aligned to the baseline, with a 32px bottom margin. Section headings inside pages are role-type labels over a rule.

Breakpoints are Tailwind's defaults (640, 768, 1024, 1280px). Every breakpoint down to 320px is tested for horizontal overflow; the wordmark hides below 360px and leaves the mark.

### Named Rules
**The Credits Block Rule.** Group facts as credits: role, dotted leader (`1px dotted` in the rule color, lifted 0.3em), value right-aligned, rows between a rule-coloured top and bottom hairline. Use this before reaching for a grid of cards.

## Elevation & Depth

Depth is mostly tonal: ground, stock, then stock-2 for recessed wells, with hairline borders. There are two shadows, both soft, and one light effect.

### Shadow Vocabulary
- **Sheet** (`--shadow-sheet`): the resting shadow for sheets, task cards and default buttons. Dark: a faint inset top highlight plus a deep soft drop. Day: a low navy drop.
- **Lift** (`--shadow-lift`): a navy drop plus a blue-tinted glow. Used for a lifted (dragging) card, default-button hover and the hero demo board.
- **Neon Bloom** (`.neon-bloom`): an absolutely positioned, blurred cyan and violet radial pair placed behind a focal element (hero board, closing mark, auth panel, artist profile header). It never sits on text. Its strength scales with `--glow` (1 in dark, 0.35 in day).
- **Mark glow**: the logo mark at display sizes carries a blue drop-shadow glow (`0 0 18–32px` at about 0.45 to 0.55 opacity).

### Named Rules
**The Flat-At-Rest Rule.** Resting surfaces get the sheet shadow at most. Lift belongs to motion and hover on primary actions.

## Shapes

Gently rounded and controlled. The base radius is 8px (`lg`), used by sheets and empty states. Controls, task cards, columns, nav items and wells use 6px (`md`). Label chips use 4px (`sm`). Dialogs use 12px (`xl`). Pills (status, reactions, play button, avatars) are fully round. Borders are 1px hairlines everywhere. Dashed borders mean "unlit": the drop slot (dashed electric) and empty states (dashed rule).

## Components

### Buttons
Confident but compact: the gradient is the only loud thing on most screens.
- **Shape:** 6px radius; 40px high by default (36px small, 48px large), 16px horizontal padding, semibold 0.875rem, 16px lucide icon with an 8px gap.
- **Primary (default):** action gradient with white text and the sheet shadow. One or two per view.
- **Hover / Focus / Active:** hover swaps to the lift shadow with `brightness(1.1)`; focus shows the ring border and a 3px ring at 50%; active nudges down 1px. Transitions are 200ms on the expo-out curve.
- **Outline:** ground (dark: input-tinted) fill with a border; the secondary action beside a primary ("Learn More", "Join the community").
- **Ghost:** no fill until hover (muted). Used for "Log in" and tertiary actions.
- **Solid:** flat electric blue, for places where the gradient would compete.
- **Destructive:** a 10 to 20% destructive tint with destructive text, never a solid red fill.

### Chips
- **Label chip:** role type at about 0.64rem on a muted 4px chip with a 6px colour dot carrying the user's label colour.
- **Status pill:** role type in electric with a 50% electric border, fully round, optional 12px lucide icon ("Feedback").
- **Demo/meta pill:** role type in soft ink with a rule border.

### Cards / Containers
- **Sheet:** stock background, 1px border, 8px radius, sheet shadow, 24px padding (20px for posts). The container for the example task, posts and the demo board.
- **Task card:** stock card, 6px radius, 12px padding, sheet shadow; hover shifts the border to rule colour. Title semibold 0.875rem; meta row in muted 0.75rem with priority in role type and figures in mono.
- **Lifted task card:** transparent border showing the logo light through a padding-box/border-box gradient, lift shadow, rotated -1.5deg.
- **Drop slot:** dashed electric border at 70%, accent wash, contents hidden.
- **Board column:** recessed stock-2 at 60%, 6px radius, role-type heading with a mono count.

### Inputs / Fields
- **Style:** 40px high, 6px radius, 1px input border, stock background (dark: input tint at 30%), 12px horizontal padding.
- **Focus:** ring-coloured border plus a 3px ring at 50%.
- **Error / Disabled:** destructive border and ring at 20%; disabled at 50% opacity.

### Navigation
- **Site nav:** sticky 64px bar, ground at 80% with backdrop blur and a bottom border; links in 0.875rem muted ink, foreground on hover; theme toggle, ghost "Log in" and primary "Get Started" at right. Below 640px a disclosure menu with 48px-tall rows.
- **App sidebar:** 40px rows, 6px radius, muted text; hover is muted wash; active is accent wash, foreground text and an electric icon, with `aria-current="page"`.

### Credits Block (signature)
The recurring Liner Notes device: role (role type, muted) then a flexible dotted leader then the value (right-aligned, wraps), arranged in a definition list between rule hairlines. Used on the hero strip, the task sheet, role permissions, the closing panel and the auth panel.

### Empty State
"Unlit" state: dashed rule border, 8px radius, 40px vertical padding, a 28px soft-ink lucide icon, a semibold title, one muted sentence and a single next action.

### Motion
One "needle drop": rows and demo tasks rise 10px from 35 to 40% opacity and settle over 0.5 to 0.6s on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 60ms per row, once on entry. Content is never fully hidden before reveal. Reduced motion collapses all animation and transition durations.

## Do's and Don'ts

### Do:
- **Do** reserve the logo gradient for primary actions, the moving edge of a drag, live playback/upload fills and blooms behind a focal element.
- **Do** set every musician-facing number (BPM, key, time, count, date) in tabular JetBrains Mono.
- **Do** present facts as credits: role, dotted leader, value, between rule hairlines.
- **Do** place a title's supporting line below it in role type, as a credits line.
- **Do** show the logo mark beside the title it labels (the demo board, the closing panel), with its blue glow at display sizes.
- **Do** keep `font-variant-ligatures: no-common-ligatures` and `text-rendering: geometricPrecision` on body text.
- **Do** design both themes for every new surface: midnight booklet and day sleeve.
- **Do** use lucide line icons at 12 to 16px for meta and 16px in buttons.

### Don't:
- **Don't** put a kicker or eyebrow above a title.
- **Don't** fill progress rules, priority labels, chips or headings with the gradient at rest; static progress is solid ink at 70%.
- **Don't** put a neon bloom behind or on top of text.
- **Don't** use emoji, including for reactions; use lucide icons.
- **Don't** add decorative hover motion (scale, translate, staggered effects); hover changes colour, border or shadow only, and the needle-drop entry is the only choreographed motion.
- **Don't** use semantic colours as fills; warning, destructive and success colour text only.
