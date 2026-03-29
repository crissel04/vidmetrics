/**
 * Recharts Scatter hover: merged onto the same symbol path as inactive dots (object form).
 * A custom React activeShape can break radius/fill; stroke props merge safely.
 */
export const subtleScatterActiveShape = {
  stroke: 'var(--border-strong)',
  strokeWidth: 1,
  strokeOpacity: 0.35,
}
