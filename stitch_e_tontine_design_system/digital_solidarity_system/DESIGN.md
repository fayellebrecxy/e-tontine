---
name: Digital Solidarity System
colors:
  surface: '#f4fcf0'
  surface-dim: '#d5dcd1'
  surface-bright: '#f4fcf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff6ea'
  surface-container: '#e9f0e5'
  surface-container-high: '#e3eadf'
  surface-container-highest: '#dde5d9'
  on-surface: '#171d16'
  on-surface-variant: '#3e4a3d'
  inverse-surface: '#2b322b'
  inverse-on-surface: '#ecf3e7'
  outline: '#6e7b6c'
  outline-variant: '#bdcaba'
  surface-tint: '#006e2d'
  primary: '#006b2c'
  on-primary: '#ffffff'
  primary-container: '#00873a'
  on-primary-container: '#f7fff2'
  inverse-primary: '#62df7d'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#a72d51'
  on-tertiary: '#ffffff'
  tertiary-container: '#c74668'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7ffc97'
  primary-fixed-dim: '#62df7d'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005320'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3f0016'
  on-tertiary-fixed-variant: '#8a143c'
  background: '#f4fcf0'
  on-background: '#171d16'
  surface-variant: '#dde5d9'
  warning: '#F97316'
  destructive: '#DC2626'
  surface-light: '#F8FAFC'
  border-light: '#E2E8F0'
  text-main: '#0F172A'
  text-muted: '#64748B'
typography:
  display:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Poppins
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h1-mobile:
    fontFamily: Poppins
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.2'
  h2:
    fontFamily: Poppins
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  h4:
    fontFamily: Poppins
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for a fintech ecosystem that bridges traditional community saving practices with modern digital security. The brand personality is **Professional and Benevolent**, striking a balance between the rigors of financial management and the warmth of communal solidarity.

The visual direction follows a **Corporate / Modern** aesthetic, heavily influenced by contemporary SaaS patterns. It prioritizes clarity, trust, and structural integrity. The interface utilizes generous whitespace, refined typography, and subtle depth to guide users through complex financial data without overwhelming them. The style is deliberately approachable yet evokes the "rock-solid" reliability of a high-end banking institution.

Key attributes:
- **Organized:** Every element sits on a strict geometric grid.
- **Transparent:** Information hierarchy is explicit, ensuring users always know the status of their funds.
- **Accessible:** High contrast and clear affordances cater to a diverse demographic of community members.

## Colors

The palette is anchored by **Growth Green** (#16A34A) and **Security Blue** (#1E3A8A). Green represents the flourishing of community wealth and financial health, while Blue provides the professional foundation required for a fintech product.

### Color Application
- **Primary (Green):** Used for primary actions, success states, and indicating positive financial growth.
- **Secondary (Blue):** Used for navigation elements, headers, and professional accents that require a more serious tone than the green.
- **Accent (Orange):** Reserved for alerts, pending states, and items requiring immediate attention without being errors.
- **Destructive (Red):** Exclusively for penalties, overdue payments, and errors.
- **Neutrals:** A range of cool grays derived from the Secondary Blue to maintain a cohesive, "tech-forward" feel.

### Color Modes
While the default is **Light**, the dark mode should transition surfaces to `#020617` (Deep Navy) rather than pure black to maintain the professional fintech character. Borders in dark mode should use a subtle `#1E293B`.

## Typography

This design system employs a dual-font strategy. **Poppins** is used for headlines to provide a modern, friendly, and geometric touch that feels welcoming. **Inter** is utilized for all functional text, data, and body copy to ensure maximum legibility and a systematic, clean appearance.

### Hierarchy Rules
- **Numerical Data:** Use Inter with tabular lining figures where possible for financial reports and data tables to ensure numbers align vertically.
- **Headings:** Use Poppins with tighter letter spacing for large display sizes to create a modern, "impactful" look.
- **Mobile Scaling:** Headings scale down significantly on mobile to prevent awkward line breaks in long French/Community terms.

## Layout & Spacing

The system is built on a strict **8px linear scale**. All paddings, margins, and component heights must be multiples of 8px (e.g., 8, 16, 24, 32, 48, 64).

### Grid System
- **Desktop:** 12-column fixed grid (1280px max-width) with 24px gutters. Use this for dashboard layouts and data-heavy pages.
- **Tablet:** 8-column fluid grid.
- **Mobile:** 4-column fluid grid with 16px side margins.

### Spacing Philosophy
Consistent spacing is used to group related financial information. For example, a card's internal padding should be 24px (`3 units`), while the gap between cards in a dashboard view should be 32px (`4 units`) to provide clear visual separation.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layering** and **Ambient Shadows**, following a modern "flat-plus" approach.

### Surface Tiers
- **Level 0 (Background):** Used for the main app canvas (`#F8FAFC`).
- **Level 1 (Surface):** Used for cards and primary containers. White background with a subtle border and an `XS` shadow.
- **Level 2 (Raised):** Used for interactive elements like dropdowns and modals. Features a more pronounced `MD` or `LG` shadow.

### Shadows
Shadows should be soft and highly diffused, using a blue-tinted gray (`#1E3A8A` at very low opacity) rather than pure black to keep the UI feeling "airy" and clean.
- **XS Shadow:** `0 1px 2px 0 rgba(30, 58, 138, 0.05)`
- **LG Shadow:** `0 10px 15px -3px rgba(30, 58, 138, 0.1)`

## Shapes

The shape language is **Rounded**, conveying friendliness and accessibility.
- **Standard (0.5rem):** Used for buttons, input fields, and small badges.
- **Large (1rem):** Used for cards and summary containers.
- **Extra Large (1.5rem):** Reserved for modals and larger dashboard widgets.

These rounded corners soften the "serious" nature of fintech, making the community savings aspect feel more like a collective effort and less like a cold banking interface.

## Components

### Buttons
- **Primary:** Solid Green (#16A34A). White text. Used for "Join Tontine," "Contribute," or "Save."
- **Secondary:** Solid Blue (#1E3A8A). White text. Used for administrative actions or secondary navigation.
- **Outline:** 1px border using `#E2E8F0`. Used for "Cancel" or "View Details."
- **Success/Destructive:** Use Green or Red respectively for terminal actions.
- **Interactive States:** On hover, darken the background by 10%. On active/click, scale the button to 0.98 for tactile feedback.

### Form Fields
Inputs use a 1px border (`#E2E8F0`) that transitions to Primary Green on focus. 
- **Currency Input:** Must include a fixed suffix/prefix for the local currency (e.g., FCFA) to prevent user error.
- **States:** Error states must include both a red border and a small "Destructive" icon for accessibility (color-blindness).

### Badges & Status
- **Status Pills:** Pill-shaped (rounded-full) with a light background tint and dark text of the same hue (e.g., Paid = Light Green background, Dark Green text).
- **Variants:** Paid (Success), Overdue (Destructive), Pending (Warning), Admin (Secondary Blue).

### Cards
- **Summary Cards:** Large display typography for balances.
- **Member Cards:** Include a small avatar and a "Contribution Progress" bar.
- **Statistics:** Use sparkline charts in the background of cards to show trends over cycles.

### Navigation
- **Desktop Sidebar:** Collapsible, dark secondary blue background for high contrast against the content area.
- **Mobile Navbar:** Fixed to the bottom with 4-5 key icons (Home, Tontines, Contributions, Profile) for thumb-friendly interaction.