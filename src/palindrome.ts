export function isPalindrome(text: string): boolean {
  const normalized = text.replace(/\s+/g, '').toLowerCase();

  if (normalized.length === 0) {
    throw new Error('EMPTY_STRING');
  }

  const chars = [...normalized];
  return chars.join('') === chars.reverse().join('');
}