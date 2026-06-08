import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyWebhookSignature } from '../src/modules/payments/payments.service.js';

const SECRET = 'test_webhook_secret'; // igual al de test/setup.js

const buildSignature = (dataId, requestId, ts) => {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac('sha256', SECRET).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
};

describe('verifyWebhookSignature', () => {
  const dataId = '123456';
  const requestId = 'req-abc';
  const ts = '1700000000';

  it('acepta una firma válida', () => {
    const signature = buildSignature(dataId, requestId, ts);
    expect(verifyWebhookSignature({ signature, requestId, dataId })).toBe(true);
  });

  it('rechaza una firma manipulada', () => {
    const signature = buildSignature(dataId, requestId, ts).replace(/v1=.*/, 'v1=deadbeef');
    expect(verifyWebhookSignature({ signature, requestId, dataId })).toBe(false);
  });

  it('rechaza si falta el header de firma', () => {
    expect(verifyWebhookSignature({ signature: undefined, requestId, dataId })).toBe(false);
  });

  it('rechaza si el dataId no coincide', () => {
    const signature = buildSignature(dataId, requestId, ts);
    expect(verifyWebhookSignature({ signature, requestId, dataId: 'otro' })).toBe(false);
  });
});
