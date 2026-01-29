export function isHeaderLine(lineText: string): boolean {
  // Markdown header: up to 3 leading spaces, 1-6 #'s, then a space
  return /^\s{0,3}#{1,6}\s/.test(lineText);
}
