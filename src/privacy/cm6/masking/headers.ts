import type { Text } from "@codemirror/state";

export function isHeaderLine(lineText: string): boolean {
  // Markdown header: up to 3 leading spaces, 1-6 #'s, then a space
  return /^\s{0,3}#{1,6}\s/.test(lineText);
}

export function isCalloutBlockLine(doc: Text, lineNumber: number): boolean {
  for (let currentLine = lineNumber; currentLine >= 1; currentLine--) {
    const lineText = doc.line(currentLine).text;
    if (!isBlockQuoteLine(lineText)) return false;
    if (isCalloutStartLine(lineText)) return true;
  }

  return false;
}

function isBlockQuoteLine(lineText: string): boolean {
  return /^\s{0,3}>/.test(lineText);
}

function isCalloutStartLine(lineText: string): boolean {
  return /^\s{0,3}(?:>\s*)+\[![^\]]+\][+-]?\s*/.test(lineText);
}