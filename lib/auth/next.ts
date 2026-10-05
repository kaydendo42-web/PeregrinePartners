/** A destination is navigation only; permission is checked at the data boundary. */
export function safeDestination(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value, 'https://peregrine.invalid');
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== 'https://peregrine.invalid' || /[\\\u0000-\u0020\u007f]/u.test(path) || /%2f|%5c|%2e/iu.test(url.pathname) || /%[0-9a-f]{2}/iu.test(path)) return null;
    return ['/owner','/console'].some(root=>path===root || path.startsWith(root+'/')) ? url.pathname+url.search : null;
  } catch { return null; }
}
export function defaultDestination(requested: unknown, owner: boolean): string {
  return safeDestination(requested) ?? (owner ? '/owner' : '/console');
}
