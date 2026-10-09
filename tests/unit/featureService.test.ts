import { describe, it, expect } from 'vitest';
import { processRequest } from '../../src/services/featureService.js';

describe('processRequest', () => {
  it('should complete successfully with default options', async () => {
    const result = await processRequest();
    expect(result.success).toBe(true);
  });

  it('should respect custom timeout limit', async () => {
    const result = await processRequest({ timeoutMs: 1000 });
    expect(result.success).toBe(true);
  });
});