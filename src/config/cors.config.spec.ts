import { describe, expect, it } from 'vitest';
import { resolveAllowedOrigins } from './cors.config.js';

describe('resolveAllowedOrigins', () => {
  it('parses comma-separated origins and keeps localhost for local development', () => {
    expect(
      resolveAllowedOrigins(
        'https://app.example.vercel.app,https://preview.example.vercel.app,http://localhost:3000',
      ),
    ).toEqual([
      'https://app.example.vercel.app',
      'https://preview.example.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('adds localhost variants when environment is local', () => {
    expect(resolveAllowedOrigins('https://app.example.vercel.app')).toEqual([
      'https://app.example.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });
});
