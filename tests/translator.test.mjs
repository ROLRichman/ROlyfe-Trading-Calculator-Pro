import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const hub=readFileSync(new URL('../scanner-hub/index.html',import.meta.url),'utf8');
const translator=readFileSync(new URL('../rol-translator.js',import.meta.url),'utf8');
test('Calculator Pro and Scanner Hub both expose the shared translator',()=>{
  assert.match(page,/src="rol-translator\.js"/);
  assert.match(hub,/src="\.\.\/rol-translator\.js"/);
  for(const language of ['English','Spanish','French','Haitian Creole','Portuguese'])assert.ok(translator.includes(language));
  assert.match(translator,/action:"translate"/);
});
