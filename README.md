# Brine Against the World

Portrait idle RPG playtest starring Brine, with interchangeable guns, automatic battles, bosses, upgrades, offline salvage, and a continuous walk/aim/fire sequence.

## Browser playtest

Install Node.js 20 or newer, then run these commands from this repository:

```sh
npm test
npm start
```

Open the local address printed by the server. No dependency installation or GodMode account is needed to play. The animation review is at `animation-review.html` under the same address.

The server deliberately uses `/brine-against-the-world/` to check that the game works under a GitHub Pages project path.

## Publish on GitHub Pages

1. Push this repository to GitHub with `main` as the default branch.
2. In the repository's **Settings → Pages**, choose **GitHub Actions** as the source.
3. Run **Test and publish browser playtest** from Actions, or push another commit to `main`.
4. Open the published URL shown by the successful deployment.

The workflow tests the project and publishes only `web/`. Pull requests run checks without deploying. Pages must be available for your repository visibility and account plan. See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Unity

Open `unity/BrineAgainstTheWorld` through Unity Hub using Unity **6000.6.2f1**. Open `Assets/Brine/Scenes/SaltRoad.unity` and press Play. The Brine menu includes gameplay checks and scene rebuilding.

The published web game is the existing HTML/Canvas version. The Unity project is included for editing and native testing; this repository does not contain a Unity WebGL build or require Unity to publish the browser version.

## Combat expansion

- Six encounter types: Salt Porter (lob), Pipe Pilfer (burst), Gate Hauler (shield), Sump Mender (repair), Mud Skipper (burrow), and Sluice Keeper (boss slam).
- New enemies are variants of the existing three illustrations, distinguished by equipment, silhouettes, and code-driven actions. No additional GodMode credits are required.
- Kit contains the Harbor Workshop: three visible barrel attachments per gun, each adding 5 damage. Costs are 45, 90, and 135 salvage.
- Camp contains route choices. Drainage unlocks at stretch 5 (+25% salvage, +20% enemy damage); Salt Flats at 10 (+50% salvage, +45% enemy damage).
- Seven shared vector scenery layers scroll at different rates during travel and freeze in combat/pause. Browser and Unity read the same `parallax.json`.
- Existing saves migrate with no loss of upgrades or salvage. New Ultimate charge, route selection, and weapon attachments persist.

Run the Brine gameplay checks and `ExpansionChecks.Run` in Unity for the new combat mechanics. `BrineProject.BuildAndTest` includes model, animation, expansion, and play-mode checks. Browser checks run with `npm test`.

## Project layout

- `web/`: browser game, shared data, and runtime art.
- `unity/BrineAgainstTheWorld/`: Unity source project, excluding editor caches.
- `tests/`: asset, progression, and animation checks.
- `.github/workflows/pages.yml`: checks and browser deployment.

Walk playback uses 28 approved frames at 21 fps. The seven safe aiming frames share the exact neutral walk frame at transitions. Guns remain separate from the character, with continuous recoil and distinct impact effects.

Browser progress is saved locally per browser and site address. A new published URL starts a separate save from localhost. Unity saves are separate. Step Shell is an eight-second melee Ultimate: 4x strike damage, 75% damage resistance, and shield/burrow penetration. Hits and damage taken charge it separately from the volley. The gun is stowed and restored automatically.

This repository is a prototype for testing. No open-source license is granted by this package; code and artwork licensing can be chosen by the project owner. Runtime images are pre-generated assets, and no generation API keys are included.
