import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Web package.json existe e possui scripts essenciais', () => {
  const pkgPath = path.resolve('package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json deve existir');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  assert.equal(pkg.name, 'neurafin-web');
  assert.ok(pkg.scripts.dev, 'script dev deve existir');
  assert.ok(pkg.scripts.build, 'script build deve existir');
});

test('Estrutura Next.js essencial está presente', () => {
  assert.ok(fs.existsSync(path.resolve('src/app/layout.tsx')), 'layout.tsx deve existir');
  assert.ok(fs.existsSync(path.resolve('src/app/page.tsx')), 'page.tsx deve existir');
  assert.ok(fs.existsSync(path.resolve('tsconfig.json')), 'tsconfig.json deve existir');
});
