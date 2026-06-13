# Velmont Associates — Website

The official source for the Velmont Associates marketing site — the outsourced B2B
sales arm for India's best independent brands. Commission-only: brands pay ₹0 until
they're paid.

## Stack

Static, no build step.

- **HTML** — `index.html`
- **CSS** — `css/style.css` (the "Evergreen Ledger" palette; Playfair Display + Inter)
- **JS** — `js/script.js` (GSAP 3.13 — ScrollTrigger, SplitText, DrawSVG — + Lenis smooth scroll)

The hero shelf is a hand-drawn inline SVG that animates on load. Every contact CTA
opens a full-screen contact overlay that builds a pre-filled email on submit.

## Run locally

Any static server works, e.g.:

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

## Brand

All copy, color, and type decisions follow `brand_context.md` — the single source of
truth for Velmont branding.
