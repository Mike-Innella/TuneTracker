import { describe, expect, it } from 'vitest';
import { can } from '../../src/authorization/permissions';

describe('project permissions', () => {
  it.each([
    ['OWNER', 'manage', true],
    ['OWNER', 'edit', true],
    ['EDITOR', 'edit', true],
    ['EDITOR', 'manage', false],
    ['VIEWER', 'view', true],
    ['VIEWER', 'comment', true],
    ['VIEWER', 'edit', false],
    [null, 'view', false],
  ] as const)('%s can %s → %s', (role, action, expected) => {
    expect(can(role, action)).toBe(expected);
  });
});
