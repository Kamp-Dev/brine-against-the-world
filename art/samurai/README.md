# Samurai Brine animation review

Status: selectable game playtest. Choose Samurai beside the battle controls, then activate the charged melee form. Step Shell remains available. The choice is saved, old saves default to Step Shell, and switching is disabled during an active transformation.

Browser: `web/samurai-review.html`. Unity: **Brine > Open Samurai Motion Review**, then Play. Neither preview reads or changes game saves.

Prepared a matching Walk V5, Slash V5 and Series Slash V5 source set. GMA generated an opaque backdrop, unwanted weapon pixels, and a significant camera/body turn in Slash. Built-in image generation rebuilt the slash as 12 fixed-view key poses, removed weapon/effects from the 29-frame combo, and corrected two arm-color mistakes. The walk uses GMA's background-removal result. Prompts and request records are in this directory; originals remain in `outputs/prototypes/brine-samurai-v1` in the working workspace.

Five potentially credit-consuming requests were submitted: Walk, Slash, Series (queue timeout), walk background removal, Series retry. Count the timeout conservatively; no refund is assumed. No more GMA requests are authorized by this task's budget. Built-in artwork cleanup did not call GMA.

The katana is a separate transparent texture with its own handle pivot. Animation metadata stores per-frame hand positions and angles. Sword display can be toggled without replacing body frames. Future sword artwork must provide its own grip pivot and scale. The current preview contains one sword design.

Implemented a continuous timeline, fixed per-clip scale, floor anchors, per-frame weapon sockets, pause/scrubbing and a transparency-check backdrop. Browser and Unity share image and frame metadata. No whole-body crossfades are used.

Review correction: walking now runs at 18 fps (25% slower), with scenery speed reduced by the same amount. Remapped walking and combo grips onto the visible fingers. Sword orientation now uses the current body frame rather than rotating ahead toward the next pose. A runtime eye-opacity repair restores the walk's original light eye pixels and makes light eye pixels opaque in the cleaned attack art. It preserves the exterior transparency, orange shell and dark pupils. No additional GMA calls were made.

## Remaining quality issues

- The combo cleanup has lower effective detail than the walk and slash.
- Armor and silhouettes still change between generated poses.
- Hand sockets are mapped for review; not every pose has been visually approved.
- Fixed anchors prevent empty-frame jumps, but these heterogeneous clips do not yet constitute a certified seamless animation.
- This is not the untouched Slash V5 output: it is a reconstructed candidate after the original failed visual review.

The user authorized installing this as a selectable second form for testing. Do not describe the underlying generated animation as error-free; the art consistency limitations above still apply.

The replacement sword is **Breakwater**: broad dark steel, cream cutting bevel, a thick indigo grip, muted brass and worn orange. Generated using built-in image generation, with no further GodMode requests. The slim draft was rejected and is not installed. Runtime cleanup now rejects isolated bright specks surrounded by dark opaque pupil pixels before restoring eye opacity. Attack clips alternate during melee; their contact frames are mapped to the combat model's damage time.

Breakwater prompt: One isolated game weapon sprite for a chunky armored harbor warrior. Compact broad harbor-forged blade, not a slender katana; short stout indigo grip, simple dark iron oval guard with muted brass inset, wide matte steel blade, thick spine, angled chisel tip, cream-silver bevel, one riveted reinforcement and restrained rust-orange paint. Bold comic outlines and flat cel shading, horizontal grip-left/tip-right, transparent background, no character, text, glow, runes or scabbard.

Validation: `node tests/samurai.cjs` checks frame bounds, socket bounds, timeline sampling at 30/60/120 Hz, budget accounting, and browser/Unity metadata parity. Existing game tests remain unchanged. These checks do not certify artwork quality.
