# LITTLE THINGS — Missing Assets & Fallback Resolution Report

## 1. Character Animation Actions
- **Identified Gap**: The concept sheet contains 4-direction idle postures for characters, but lacks hand-drawn dedicated tool-swinging, sleeping in bed, or fishing animations.
- **Resolution & Implementation**: A standard 4-frame retro RPG walking cadence with stride bob and sway was constructed using the authentic character art. Special actions (cauldron stirring, sleeping) will use programmatic sprite bob/tilt effects until dedicated keyframes are illustrated.

## 2. Dynamic Weather & Environmental FX
- **Identified Gap**: Rain drops, puddle ripples, and fireflies are not individual static sprites in the raw art sheets.
- **Resolution & Implementation**: In accordance with Directive 4, sprite-based particle emitters and procedural sprite blitting (1x1 and 2x2 starlight particles) provide subtle ambient motion while preserving crisp pixel art.

## 3. UI 9-Slice Panels & Borders
- **Identified Gap**: UI frames, dialogue borders, and inventory slots were not provided as isolated 9-slice PNGs.
- **Resolution & Implementation**: High-fidelity CSS/Tailwind 9-slice borders with the authentic Night Ink (#392D49), Moon Cream (#F2DEB8), and Lavender (#766184) palette have been constructed to frame the React HUD and dialogue.