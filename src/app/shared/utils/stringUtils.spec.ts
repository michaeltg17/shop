import { capitalize } from './stringUtils';

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should return the string unchanged if already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('should handle a single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('should return empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('should only capitalize the first letter, leaving the rest unchanged', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });
});
