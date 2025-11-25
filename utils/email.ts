export function extractAddress(header: string) {
  const match = header.match(/<([^>]+)>/);
  return match ? match[1] : header;
}
