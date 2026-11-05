import { describe, expect, it } from 'vitest';
import { requestOrigin } from '../../src/lib/origin';

const h = (o: Record<string, string>) => new Headers(o);

describe('requestOrigin', () => {
  it('uses forwarded host and proto', () => {
    expect(
      requestOrigin(
        h({ 'x-forwarded-host': 'app.example.com', 'x-forwarded-proto': 'https' }),
        'http://0.0.0.0:3000',
      ),
    ).toBe('https://app.example.com');
  });
  it('falls back to Host with the fallback protocol', () => {
    expect(requestOrigin(h({ host: 'localhost:3000' }), 'http://0.0.0.0:3000')).toBe('http://localhost:3000');
  });
  it('rejects malformed hosts', () => {
    expect(requestOrigin(h({ host: 'evil.com/@x' }), 'http://0.0.0.0:3000')).toBe('http://0.0.0.0:3000');
  });
});
