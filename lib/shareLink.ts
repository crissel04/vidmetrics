import LZString from 'lz-string'

/**
 * Encodes report data to a compressed URI-safe string using lz-string.
 *
 * TODO V2: The shareable report URL can become very long for channels with 50 videos.
 * Current compression is sufficient for the demo. V2 should store reports server-side
 * (Supabase or similar) and share a short opaque ID instead.
 */
export function encodeReportData(data: unknown): string {
  // lz-string compression keeps the URL under browser limits for typical channel datasets.
  // For very large channels (50 videos with full metadata), compressed size is ~2-4KB.
  // Most browsers support URLs up to 2MB, so this is safe for the current scope.
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data))
  return compressed
}

/**
 * Decodes a compressed URI string back to the original report data.
 * Returns null if decompression or JSON parsing fails.
 */
export function decodeReportData<T>(encoded: string): T | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded)
    if (!decompressed) return null
    return JSON.parse(decompressed) as T
  } catch {
    return null
  }
}
