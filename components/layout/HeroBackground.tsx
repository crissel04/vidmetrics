/**
 * Shared home / analysis hero layers: radial wash + masked grid.
 * position:fixed → viewport-relative; keep z-index below header (z-10) and hero content (z-10).
 */
const heroRadialShape = 'ellipse 70% 55% at 50% 0%'

export function HeroBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 0,
          background: `radial-gradient(${heroRadialShape}, color-mix(in srgb, var(--primary) var(--hero-radial-primary-inner), var(--bg-app)) 0%, color-mix(in srgb, var(--primary) var(--hero-radial-primary-mid), var(--bg-app)) 40%, var(--bg-app) 75%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 0,
          opacity: 'var(--hero-grid-opacity)',
          backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 -32px',
          maskImage: `radial-gradient(${heroRadialShape}, #000 0%, rgb(0 0 0 / 0.5) 40%, transparent 76%)`,
          WebkitMaskImage: `radial-gradient(${heroRadialShape}, #000 0%, rgb(0 0 0 / 0.5) 40%, transparent 76%)`,
        }}
      />
    </>
  )
}
