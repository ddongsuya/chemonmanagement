# Design System Document: The Editorial Curator

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Curator."** We are moving away from the cold, clinical aesthetic of traditional SaaS dashboards and toward a high-end editorial experience. This system treats data as a curated collection, using sophisticated tonal layering and intentional white space to guide the eye.

To break the "template" look, we utilize **intentional asymmetry**. Primary actions may be offset, and secondary information is tucked into nested containers rather than boxed in by rigid lines. The shift to a sophisticated Orange (#F97316) injects warmth and professional energy, transforming the interface from a "tool" into a "workspace of distinction."

## 2. Colors
Our palette is rooted in warmth and professional depth. We use the contrast between the energetic Orange and the stabilizing Slate and Amber tones to create a balanced, premium environment.

### The Palette
*   **Primary (`#9D4300` / `#F97316`):** Used for key brand moments and main CTAs.
*   **Surface / Background (`#FFF8F1`):** A warm, tinted white that reduces eye strain and feels more "custom" than pure hex white.
*   **Secondary/Tertiary (`#505F76` / `#855300`):** Used for supporting elements and subtle accents to maintain a professional weight.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or layout. Boundaries must be defined through:
1.  **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
2.  **Tonal Transitions:** Using subtle shifts in the Material surface tokens to define where one idea ends and another begins.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers (Lowest to Highest) to create depth.
*   **Base:** `surface` (#FFF8F1)
*   **Nesting Level 1:** `surface-container-low` (#FAF2E9) for large content areas.
*   **Nesting Level 2:** `surface-container` (#F5EDE3) for inner modules or cards.
*   **Floating Elements:** `surface-container-highest` (#E9E1D8) for high-impact overlays.

### The "Glass & Gradient" Rule
To elevate the experience, utilize **Glassmorphism** for floating elements (e.g., dropdowns, navigation bars). Apply a `backdrop-blur` of 12px-20px with semi-transparent surface colors. For primary CTAs, use a subtle gradient transitioning from `primary` to `primary_container` to provide "soul" and visual volume.

## 3. Typography
We use **Inter** exclusively, relying on extreme scale and weight contrast rather than multiple typefaces.

*   **Display & Headlines:** Use `display-md` (2.75rem) and `headline-lg` (2rem) with tight letter-spacing (-0.02em) for an editorial feel. These represent the "Curator’s Voice"—authoritative and clear.
*   **Titles:** `title-lg` (1.375rem) and `title-md` (1.125rem) are the workhorses for card headers and section titles.
*   **Body:** `body-md` (0.875rem) is the standard. Use `body-lg` (1rem) for introductory text to maintain readability.
*   **Labels:** `label-md` (0.75rem) and `label-sm` (0.6875rem) are reserved for metadata and micro-copy, often in all-caps with increased letter-spacing (0.05em) for a high-end touch.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift that feels integrated into the environment.
*   **Ambient Shadows:** For floating elements that require a shadow, use a large blur (32px-64px) and very low opacity (4%-6%). The shadow color should be tinted with the `on-surface` color (a warm dark brown/slate) rather than a neutral grey.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**: use `outline-variant` at 15% opacity. High-contrast, 100% opaque borders are strictly forbidden.

## 5. Components

### Buttons
*   **Primary:** Rounded 12px (`DEFAULT`). Uses the primary orange gradient. High contrast against the warm background.
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. No border.
*   **Tertiary:** Text-only with an icon. Use `primary` color for the text to signal interactivity.

### Cards & Lists
*   **No Dividers:** Never use a line to separate list items. Use vertical white space (`spacing-4` or `spacing-6`) or alternating background tints.
*   **Interactivity:** On hover, a card should transition from `surface-container-low` to `surface-container-lowest` with a subtle ambient shadow.

### Input Fields
*   **Styling:** Follow the 12px roundness. Use `surface-container-lowest` for the field background.
*   **Focus State:** A 2px "Ghost Border" using the `primary` color at 40% opacity.
*   **Error State:** Use the `error` token (#BA1A1A) but keep the background of the field a soft `error_container`.

### Featured Metric (Custom Component)
A large-scale component for the dashboard. Use `display-sm` for the value, nested inside a `primary_container` with a glassmorphism overlay to highlight key data points with "energetic professional" flair.

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts to create a bespoke, high-end feel.
*   **Do** leverage the full range of `surface-container` tokens to create "stacked" content.
*   **Do** use `inter` in semi-bold and bold weights for headings to create an authoritative hierarchy.
*   **Do** allow for generous white space (Spacing 12 and 16) between major sections.

### Don’t:
*   **Don’t** use 1px solid borders to define boxes or sections.
*   **Don’t** use pure black (#000000) for text; use `on_surface` (#1E1B15) to maintain the warm, curated aesthetic.
*   **Don’t** use standard drop shadows with high opacity.
*   **Don’t** cram data; if a dashboard feels crowded, increase the surface nesting depth or move secondary data to a "Curated Details" drawer.