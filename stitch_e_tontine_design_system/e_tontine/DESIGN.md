---
name: E-Tontine
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4a3d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
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
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  warning-orange: '#F97316'
  error-red: '#DC2626'
  surface-white: '#FFFFFF'
  background-slate: '#F8FAFC'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  sidebar-expanded: 260px
  sidebar-collapsed: 72px
---

## Brand & Style

The design system for this product is built upon the pillars of trust, community solidarity, and modern financial management. It bridges the gap between traditional community savings (tontines) and digital reliability. The target audience includes community administrators and group members who require a platform that feels both professional and benevolent.

The visual style is **Corporate / Modern** with a focus on high legibility and structured organization. It prioritizes clarity and a sense of security through balanced layouts, purposeful whitespace, and a sophisticated color application that avoids being overly sterile. The interface should feel accessible yet authoritative, ensuring users feel their collective finances are handled with precision.

## Colors

The palette is anchored by a vibrant green representing growth and financial health, paired with a deep, institutional blue that signals stability and trust. 

- **Primary (Green):** Used for primary actions, success states, and indicating positive financial trends.
- **Secondary (Blue):** Utilized for navigation elements, headers, and branding accents to ground the interface.
- **Named Colors:** Orange and Red are reserved strictly for system feedback—warnings regarding late payments and critical errors or deletions.
- **Neutral:** A range of slates and grays are used to maintain hierarchy and readability without the harshness of pure black.

## Typography

This design system utilizes a dual-font approach to balance character with utility. **Hanken Grotesk** (serving as a high-quality contemporary alternative to Poppins) provides a modern, sharp look for headlines and display text, ensuring the brand feels "tech-forward." **Inter** is used for all functional body text and UI labels due to its exceptional legibility and neutral, systematic tone.

Text hierarchy should be strictly enforced to guide users through complex financial data. Large displays are used for dashboard totals, while labels are kept clear and frequently capitalized for metadata and table headers.

## Layout & Spacing

The layout follows a **Fixed Grid** model for desktop dashboards to ensure data density remains manageable and professional. A 12-column grid is used for main content areas, with a persistent sidebar on the left.

- **Desktop:** 1280px max-width container, 24px gutters, and 32px page margins.
- **Tablet:** 8-column fluid grid with 24px margins.
- **Mobile:** Single column fluid layout with 16px horizontal margins.

Spacing follows an 8px linear scale. Large components (like cards) should use 24px padding to provide breathing room, while smaller list items use 12px or 16px to maintain efficiency.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to convey depth. This approach maintains a clean, professional aesthetic suitable for financial management.

- **Level 0 (Background):** Slate-50 (#F8FAFC) creates a subtle contrast with white cards.
- **Level 1 (Cards/Surface):** White background with a 1px border in Slate-200. No shadow is used for static elements.
- **Level 2 (Interactive/Floating):** Used for dropdowns and active cards. Includes a soft, diffuse shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Modals:** High-contrast backdrop blur (8px) with a Level 2 surface to focus user attention on critical financial tasks.

## Shapes

The shape language is **Rounded**, using a 0.5rem (8px) corner radius as the standard for buttons, input fields, and cards. This softens the "corporate" feel of the blue/green palette, making the application feel more approachable and modern.

- **Standard (8px):** Primary UI components and containers.
- **Large (16px):** Featured dashboard widgets and promotional banners.
- **Pill:** Reserved for status chips (e.g., "Paid", "Pending") and secondary action buttons to distinguish them from primary structural elements.

## Components

### Sidebar (Navigation)
The central navigation hub for the dashboard.
- **Behavior:** Collapsible to maximize workspace. The transition should be a smooth 200ms ease.
- **Expanded State:** Shows the "E-Tontine" logo, icon + label pairs, and active state indicators (a vertical 4px bar in Primary Green on the left edge).
- **Collapsed State:** Shows only icons with tooltips on hover.
- **Styling:** Dark blue (#1E3A8A) background or a clean white with Slate-200 borders, depending on the specific module's hierarchy.

### Buttons
- **Primary:** Solid Green (#16A34A) with white text. High emphasis.
- **Secondary:** Outlined Blue (#1E3A8A) with blue text. Medium emphasis.
- **Tertiary:** Ghost style (no border/background) for less frequent actions like "Cancel."

### Input Fields
- **Standard:** 1px Slate-300 border, 8px corner radius. On focus, the border transitions to Blue (#1E3A8A) with a subtle 2px outer glow.
- **Feedback:** Error states use the Red (#DC2626) named color for both the border and help text.

### Cards
Dashboard widgets are white surfaces with an 8px radius and a 1px Slate-200 border. Content should be grouped logically with Title-LG typography for headers.

### Chips/Badges
Small pill-shaped elements used for status.
- **Paid:** Green tint background with Green text.
- **Late:** Orange tint background with Orange text.
- **Unpaid:** Red tint background with Red text.