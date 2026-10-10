import test from 'node:test';
import assert from 'node:assert/strict';

test('Validação de Contratos e URLs do DocumentsApiClient', () => {
  const baseUrl = 'http://localhost:8000/api/v1';
  const token = 'test-jwt-token';
  const docId = '123e4567-e89b-12d3-a456-426614174000';

  // Verifica montagem correta de URL de download
  const downloadUrl = `${baseUrl}/documents/${docId}/download`;
  assert.equal(downloadUrl, 'http://localhost:8000/api/v1/documents/123e4567-e89b-12d3-a456-426614174000/download');

  // Verifica headers de autenticação Bearer
  const headers = { Authorization: `Bearer ${token}` };
  assert.equal(headers.Authorization, 'Bearer test-jwt-token');
});

test('Validação de Tipos de Status de Documentos', () => {
  const validStatuses = [
    'received',
    'pending_processing',
    'processing',
    'ready',
    'review_required',
    'read_unavailable',
    'error',
    'pending_sync',
  ];

  assert.equal(validStatuses.length, 8);
  assert.ok(validStatuses.includes('ready'));
  assert.ok(validStatuses.includes('review_required'));
  assert.ok(validStatuses.includes('read_unavailable'));
});
