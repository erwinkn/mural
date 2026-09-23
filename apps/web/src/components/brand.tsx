export function Brand() {
  return (
    <div className="flex items-center gap-2 text-ink" aria-label="Mural">
      <span className="brand-dot" aria-hidden />
      <span className="text-[30px] font-bold tracking-[-1.6px] leading-none">mural</span>
    </div>
  )
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex w-full flex-col items-start gap-2.5">
      <div className="text-[0.8rem] font-medium tracking-[1.5px] text-cocoa uppercase">
        {eyebrow}
      </div>
      <h1 className="text-4xl font-semibold tracking-[-1px] whitespace-pre-line">{title}</h1>
      {subtitle ? <p className="text-[0.95rem] text-cocoa">{subtitle}</p> : null}
    </div>
  )
}

export function RecallBars({ count }: { count: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${count} of 3 recall bars`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-[18px] rounded-full ${i < count ? 'bg-orange' : 'bg-peach'}`}
        />
      ))}
    </div>
  )
}
