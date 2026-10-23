import { describe, it, expect } from 'vitest';
import { isPalindrome } from '../src/palindrome';

describe('isPalindrome', () => {
  it('повертає true для слова-паліндрома', () => {
    expect(isPalindrome('level')).toBe(true);
  });

  it('ігнорує регістр і пробіли у фразі-паліндромі', () => {
    expect(isPalindrome('А роза упала на лапу Азора')).toBe(true);
  });

  it('повертає false для рядка, що не є паліндромом', () => {
    expect(isPalindrome('hello')).toBe(false);
  });

  it('повертає true для рядка з одного символу', () => {
    expect(isPalindrome('a')).toBe(true);
  });

  it('викидає виняток для порожнього рядка', () => {
    expect(() => isPalindrome('')).toThrow('EMPTY_STRING');
  });

  it('викидає виняток для рядка з самих пробілів', () => {
    expect(() => isPalindrome('   ')).toThrow('EMPTY_STRING');
  });
});