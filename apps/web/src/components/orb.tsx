/// CSS port of MuralOrb — layered radial-gradient "mesh" inside a morphing
/// blob, with listening rings, highlight, base glow, shadow and satellites.
export function MuralOrb({
  energy = 0,
  listening = false,
  className = '',
}: {
  energy?: number
  listening?: boolean
  className?: string
}) {
  return (
    <div
      className={`orb ${className}`}
      data-listening={listening ? 'true' : 'false'}
      style={{ '--energy': Math.min(1, Math.max(0, energy)) } as React.CSSProperties}
      aria-hidden
    >
      <span className="orb-ring" />
      <span className="orb-ring wide" />
      <div className="orb-blob">
        <div className="orb-mesh" />
        <div className="orb-shine" />
        <div className="orb-base-glow" />
      </div>
      <span className="orb-dot a" />
      <span className="orb-dot b" />
      <div className="orb-shadow" />
    </div>
  )
}
