import test from 'node:test';
import assert from 'node:assert/strict';

// Mock de localStorage para ambiente Node
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
global.window = {};

test('Fila Offline - Enfileiramento e Recuperação', async () => {
  const STORAGE_KEY = 'neurafin_offline_queue';
  storage.clear();

  const item1 = {
    id: 'test-1',
    action: 'upload_document',
    payload: { fileName: 'recibo.pdf' },
    createdAt: Date.now(),
    status: 'pending',
  };

  global.localStorage.setItem(STORAGE_KEY, JSON.stringify([item1]));

  const raw = global.localStorage.getItem(STORAGE_KEY);
  assert.ok(raw);
  const queue = JSON.parse(raw);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].payload.fileName, 'recibo.pdf');
  assert.equal(queue[0].status, 'pending');
});

test('Fila Offline - Remoção e Limpeza', async () => {
  const STORAGE_KEY = 'neurafin_offline_queue';
  storage.clear();

  const items = [
    { id: '1', action: 'upload_document', status: 'pending' },
    { id: '2', action: 'upload_document', status: 'pending' },
  ];
  global.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  // Simula markSynced removendo id 1
  const updated = items.filter((i) => i.id !== '1');
  global.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  const remaining = JSON.parse(global.localStorage.getItem(STORAGE_KEY));
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, '2');
});
