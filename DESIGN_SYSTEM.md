---
name: "WATCH HEAVEN — The Watchmaker's Catalogue"
description: "Modern retail horology design system pairing editorial Fraunces typography, Warm Bone surfaces, Deep Ink contrast, and Aged Brass precision."
---

## Overview

**WATCH HEAVEN** is an Egyptian watch e-commerce platform built around the concept of **The Watchmaker's Catalogue — Modern Retail Edition**. It bridges three visual worlds: a carefully art-directed horological catalogue, a clean international e-commerce storefront, and the restrained precision of watchmaking.

The interface serves both everyday Egyptian shoppers (discovering Casio, Seiko, Fossil, and Samsung smartwatches in EGP) and collectors exploring mechanical classics like the Orient Bambino Automatic. Every screen prioritizes large, studio-lit watch photography, generous negative space, crisp 1px hairline divisions, and immediate readability.

- **Style:** Editorial Minimalism & Modern Horological Retail.
- **Avoid:** Thin fragile serifs, decorative blobs, glassmorphism, neon accents, heavy drop shadows, rounded pill cards, or generic SaaS templates.

---

## Colors

The visual system is anchored by a strict four-color palette: **Warm Bone** (`#F3EFE6`) for dominant storefront grounds, **Deep Ink** (`#141311`) for primary typography, navigation, primary actions, and select dark editorial spreads, **Aged Brass** (`#A8823A`) used sparingly for prices, active filters, and horological highlights, and **Hairline** (`#D9D2C3`) for 1px structural dividers. Functional white (`#FFFFFF`) is reserved for form inputs and select surfaces where clarity demands it.

- **Primary (`#141311`):** Deep Ink for primary buttons, active states, and dark editorial bands.
- **Surface (`#F3EFE6`):** Warm Bone for the primary canvas and unboxed product listings.
- **Aged Brass (`#A8823A`):** Reserved for key prices, active filter indicators, and subtle horological accents. Use `aged-brass-text` (`#7D5E22`) when brass-toned copy appears at small body/label sizes on Warm Bone to maintain WCAG AA contrast.
- **Semantic Status:** Muted, restrained tones (`success`, `error`, `warning`) used strictly for order statuses, stock availability, and form validation.

```yaml
colors:
  warm-bone: "#F3EFE6"
  deep-ink: "#141311"
  aged-brass: "#A8823A"
  aged-brass-text: "#7D5E22"
  hairline: "#D9D2C3"
  primary: "#141311"
  on-primary: "#F3EFE6"
  surface: "#F3EFE6"
  on-surface: "#141311"
  surface-alt: "#EAE4D7"
  on-surface-alt: "#141311"
  surface-input: "#FFFFFF"
  on-surface-input: "#141311"
  surface-dark: "#141311"
  on-surface-dark: "#F3EFE6"
  muted: "#5E5A52"
  on-muted: "#F3EFE6"
  outline: "#D9D2C3"
  success: "#2D5A3C"
  on-success: "#F3EFE6"
  error: "#9B2C2C"
  on-error: "#FFFFFF"
  warning: "#8C621B"
  on-warning: "#FFFFFF"
```

---

## Typography

Typography is substantial, confident, and immediately legible—never thin or fragile. **Fraunces** (weights 500, 600, 700; never 300) carries hero headlines, section titles, and watch model names. **Archivo** (weights 400, 500, 600) powers navigation, descriptions, buttons, filters, and the admin interface. **IBM Plex Mono** (weight 500) is reserved for horological reference numbers (`WH-014`), EGP pricing, specifications, and order IDs.

- All numbers in prices, tables, and specification sheets use `tabular-nums`.
- Minimum text size across the entire interface is `12px`.

```yaml
typography:
  display-lg:
    fontFamily: "Fraunces"
    fontSize: 84px
    fontWeight: 600
    lineHeight: 88px
    letterSpacing: -1.5px
  display-lg-mobile:
    fontFamily: "Fraunces"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: "Fraunces"
    fontSize: 52px
    fontWeight: 600
    lineHeight: 58px
    letterSpacing: -0.75px
  headline-lg-mobile:
    fontFamily: "Fraunces"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38px
    letterSpacing: -0.4px
  headline-md:
    fontFamily: "Fraunces"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 42px
    letterSpacing: -0.5px
  headline-md-mobile:
    fontFamily: "Fraunces"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 34px
    letterSpacing: -0.25px
  headline-sm:
    fontFamily: "Fraunces"
    fontSize: 28px
    fontWeight: 500
    lineHeight: 34px
    letterSpacing: -0.25px
  title-lg:
    fontFamily: "Fraunces"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 28px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Archivo"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0px
  body-md:
    fontFamily: "Archivo"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Archivo"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.2px
  label-md:
    fontFamily: "Archivo"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: "Archivo"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.6px
  mono-lg:
    fontFamily: "IBM Plex Mono"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  mono-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.2px
  mono-sm:
    fontFamily: "IBM Plex Mono"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.4px
```

---

## Layout & Spacing

The storefront uses a **12-column editorial grid** on a `1440px` desktop canvas (with `48px` outer margins and `24px` gutters), collapsing to 8 columns on tablet (`768px`) and 4 columns on mobile (`390px`, `20px` outer margins, `16px` gutters).

- Prefer **editorial asymmetry** over uniform card grids: vary featured product scale and pair photography with generous whitespace.
- Use **unboxed product listings**—let photography and 1px hairline dividers structure the page rather than wrapping every item in a bordered box.
- Future RTL/Arabic readiness: use logical spacing (`ps-`, `pe-`, `ms-`, `me-`) where applicable and clean directional arrows.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 64px
  section-lg: 96px
  page-margin: 48px
  page-margin-mobile: 20px
```

---

## Elevation & Depth

**Flat & Hairline-Structured.** Sophistication comes from contrast, typographic scale, and composition—never from drop shadows or blurs.

- No prominent drop shadows, no floating glass panels, and no `backdrop-blur`.
- Hierarchy is established through **tonal contrast** (Warm Bone `#F3EFE6` vs. Deep Ink `#141311` vs. Surface Alt `#EAE4D7`) and **1px solid Hairline (`#D9D2C3`)** horizontal and vertical rules.

---

## Shapes

Architectural, sharp geometry inspired by watch case chamfers and printed horological catalogues. Corners are sharp (`0px`) or strictly restrained (`2px`–`4px` maximum). Never use large rounded corners or pill-shaped buttons.

```yaml
rounded:
  none: 0px
  sm: 2px
  DEFAULT: 2px
  md: 4px
```

---

## Motion & Micro-interaction

Motion is crisp, mechanical, and restrained—like the sweep of a watch hand or the click of a bezel.

- Only animate `transform`, `opacity`, and `color`.
- No scroll-triggered gimmicks or looping animations.

```yaml
motion:
  state-change:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-enter:
    duration: 240ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
```

---

## Voice & Content Strategy

- **Tone:** Informed, direct, and unhurried—like a knowledgeable watchmaker speaking to a discerning customer. Never use hype words ("Elevate", "Luxury redefined", "Unleash").
- **Capitalisation:** Sentence case for headings and buttons (`Explore watches`, `Add to cart`, `Your cart is empty.`). Uppercase is reserved strictly for small technical eyebrows (`THE COLLECTION / 2026`, `REF. WH-014`).
- **Currency & Units:** Always format prices as `EGP 12,900` with `IBM Plex Mono` and `tabular-nums`. Specifications use standard horological units (`40.5 mm`, `30 m`, `Automatic`).

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Button** → `@components/button.html`: `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html`: `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Input Field** → `@components/input-field.html`: `input-field-text`, `input-field-icon`
- **Table** → `@components/table.html`: `table-standard`, `table-interactive`, `table-selectable`
