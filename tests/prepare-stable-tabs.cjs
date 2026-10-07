// Run from repository root, then open /stable-review.html on the local server.
// Uses an isolated save key and disables persistence; never alters the player save.
const fs=require('node:fs');
let game=fs.readFileSync('web/game.js','utf8');
const start=game.indexOf('function persist(){'),end=game.indexOf('\nfunction formName',start);
game=game.slice(0,start)+'function persist(){}'+game.slice(end);
game=game.replace("const SAVE_KEY='brine-rpg-v1'","const SAVE_KEY='brine-stable-review'");
fs.writeFileSync('web/stable-review-game.js',game);
fs.writeFileSync('web/stable-review.js',fs.readFileSync(process.argv.includes('--pacing')?'tests/pacing-browser.js':process.argv.includes('--reforges')?'tests/reforge-browser.js':process.argv.includes('--rewards')?'tests/single-reward-browser.js':'tests/stable-tabs-browser.js'));
fs.writeFileSync('web/stable-review.html',fs.readFileSync('web/index.html','utf8').replace('game.js?v=','stable-review-game.js?v=').replace('</body>','<script src="stable-review.js"></script></body>'));
console.log('Open stable-review.html; expect every reported check to pass. Remove the three stable-review files after testing.');
