import { Dialog } from '@base-ui/react/dialog'
import { Select } from '@base-ui/react/select'
import { Switch } from '@base-ui/react/switch'
import { Check, ChevronDown, X } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'

/// While a Sheet is open, Base UI locks pointer events on everything outside
/// the dialog — so portaled popups (Select, etc.) must render inside it.
const SheetPortalContext = createContext<HTMLElement | null>(null)

/// Bottom sheet on phones, centered card on larger screens — mirrors the iOS
/// .sheet presentation with grabber, big rounded corners and cream surface.
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
  wide?: boolean
}) {
  const [popupEl, setPopupEl] = useState<HTMLElement | null>(null)
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="sheet-backdrop" />
        <Dialog.Popup ref={setPopupEl} className="sheet" style={wide ? { width: 'min(760px, calc(100vw - 32px))' } : undefined}>
          <SheetPortalContext.Provider value={popupEl}>
            <span className="grabber" aria-hidden />
            {title ? (
              <div className="flex items-center justify-between px-6 pt-2 pb-1">
                <Dialog.Title className="text-[0.95rem] font-medium text-ink">{title}</Dialog.Title>
                <Dialog.Close
                  className="glass flex size-10 items-center justify-center rounded-full text-ink"
                  aria-label="Done"
                >
                  <X size={18} />
                </Dialog.Close>
              </div>
            ) : null}
            <div className="sheet-scroll">{children}</div>
          </SheetPortalContext.Provider>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Picker<T extends string | number>({
  value,
  onChange,
  options,
  label,
  disabled,
  display,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly T[]
  label?: string
  disabled?: boolean
  display?: (v: T) => string
}) {
  const show = display ?? ((v: T) => String(v))
  const portalContainer = useContext(SheetPortalContext)
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as T)} disabled={disabled}>
      <Select.Trigger
        aria-label={label}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4 text-left disabled:opacity-50"
      >
        <span className="flex flex-col items-start gap-0.5">
          {label ? <span className="text-xs text-cocoa">{label}</span> : null}
          <span className="font-medium">{show(value)}</span>
        </span>
        <Select.Icon>
          <ChevronDown size={18} className="text-cocoa" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={portalContainer ?? undefined}>
        <Select.Positioner sideOffset={6} className="z-[60]">
          <Select.Popup className="max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-2xl bg-white p-1.5 shadow-xl shadow-ink/10">
            {options.map((o) => (
              <Select.Item
                key={String(o)}
                value={o}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] outline-none data-[highlighted]:bg-peach"
              >
                <Select.ItemText>{show(o)}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={16} className="text-orange" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span>{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-8 w-[52px] rounded-full bg-peach transition-colors data-[checked]:bg-orange"
        aria-label={label}
      >
        <Switch.Thumb className="absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-5" />
      </Switch.Root>
    </div>
  )
}

export function SettingSection({
  title,
  footer,
  children,
}: {
  title: string
  footer?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-[0.8rem] font-medium tracking-[1.2px] text-cocoa uppercase">
        {title}
      </h3>
      <div className="card flex flex-col gap-3 p-5">{children}</div>
      {footer ? <p className="px-1 text-[0.8rem] leading-relaxed text-cocoa">{footer}</p> : null}
    </section>
  )
}

export function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="text-cocoa">{value}</span>
    </div>
  )
}
