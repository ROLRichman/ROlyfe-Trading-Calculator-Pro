import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hub=readFileSync(new URL('../scanner-hub/index.html',import.meta.url),'utf8');
const translator=readFileSync(new URL('../rol-translator.js',import.meta.url),'utf8');
test('Calculator Pro and Scanner Hub expose the shared global page-language selector',()=>{
  assert.ok(page.includes('src="rol-translator.js"'));
  assert.ok(hub.includes('src="../rol-translator.js"'));
  for(const language of ['English','Spanish','French','Haitian Creole','Portuguese'])assert.ok(translator.includes(language));
  assert.match(translator,/rolPageLanguageSelect/);
  assert.match(translator,/rol-page-translate/);
  assert.match(translator,/MutationObserver/);
  assert.match(translator,/data-price/);
  assert.doesNotMatch(translator,/rolTranslateNetworkInput|Use selected text|Paste text to translate/);
});
