# OpenOrigin Design Spec v1

## 1. Overall Background
- Dark glassmorphism base
- Main background uses deep charcoal / black-gray tones
- Localized low-opacity blur layers are allowed
- Avoid noisy or overly decorative sci-fi backdrops

## 2. Module Color System
- Ops: Amber `#F59E0B`
- Brain: Electric Cyan `#06B6D4`
- Laboratory: Matrix Green
- Global accent gradient: Purple to Pink `#7C3AED -> #EC4899`

## 3. Visual Language
- Controlled neon tech aesthetic
- Icons, titles, and active tabs should have glow
- Glow should feel deliberate, not excessive

## 4. Panel Rules
- Use pure dark panels as the main information container
- Panels should use neon outlines
- Inner panel content should remain clean and readable
- Avoid visual clutter and over-layering

## 5. Tab Rules
- Tabs are fixed and cannot be closed
- Drag-reorder is allowed
- Active tab uses module-color glow
- Inactive tabs stay dim and low-noise

## 6. Dock Rules
- Keep the bottom floating dock layout
- Hover state must stay fully inside the container
- No outline expansion beyond the dock item bounds
- No exaggerated bounce or overshoot animation
- Prefer highlight over motion

## 7. Mission Control
- Keep the current structural direction
- Support future multi-model views
- Codex 5.4 may use demo data for now
- Demo model cards must be clearly marked as Offline

## 8. Active Session Interaction
- Active sessions open on click
- Use a centered window/modal style
- Size target: about 75 percent of the screen
- Must support scrolling through full conversation context
- Do not use fullscreen takeover
