// a11y smoke — verifies P1/P2 fixes from docs/a11y-audit.md remain in component sources
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const checks = [
  ['js/components/story_chat.mjs', /aria-live="polite"/],
  ['js/components/story_chat.mjs', /aria-atomic="false"/],
  ['js/components/story_dice.mjs', /:aria-label="'掷 ' \+ diceCount \+ 'd' \+ sides"/],
  ['js/components/story_clues.mjs', /toggleClueDetail\(clue\)/],
  ['js/components/story_map.mjs', /toggleRoomDetail\(room\)/],
  ['js/components/story_map.mjs', /tabindex="0" role="button"/],
  ['js/components/story_map.mjs', /@keydown\.enter/],
  ['js/components/story_clues.mjs', /tabindex="0" role="button"/],
  ['js/components/story_combat.mjs', /combat-initiative-toggle.*tabindex="0"/s],
  ['js/components/ui_feedback.mjs', /aria-live="polite"/],
  ['js/views/creator_view.mjs', /chartUnavailable/],
];

for (const [file, pattern] of checks) {
  const src = read(file);
  assert(pattern.test(src), `${file} missing a11y pattern ${pattern}`);
}

console.log(`a11y_smoke: ${checks.length} P1/P2 patterns OK`);
