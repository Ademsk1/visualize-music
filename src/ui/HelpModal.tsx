import { useCallback, useEffect, useId, useRef } from 'react'
import { helpModal } from './copy'

type Props = {
  readonly open: boolean
  readonly onDismiss: () => void
}

/**
 * General overview: project, how it works, and HUD. Single OK dismisses and (via parent) persists.
 */
export function HelpModal({ open, onDismiss }: Props) {
  const titleId = useId()
  const okRef = useRef<HTMLButtonElement | null>(null)
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        onDismiss()
      }
    },
    [open, onDismiss]
  )

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [open, onKey])

  useEffect(() => {
    if (open) {
      globalThis.queueMicrotask(() => okRef.current?.focus())
    }
  }, [open])

  if (!open) return null

  return (
    <div className="help-modal-root" role="presentation">
      <div className="help-modal-backdrop" aria-hidden />
      <div
        className="help-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 className="help-modal-title" id={titleId}>
          {helpModal.title}
        </h2>
        <div className="help-modal-scroll">
          <h3 className="help-modal-h3">What it is</h3>
          <p className="help-modal-p">{helpModal.pWhat1}</p>
          <h3 className="help-modal-h3">How it works</h3>
          <p className="help-modal-p">{helpModal.pHow1}</p>
          <h3 className="help-modal-h3">The HUD</h3>
          <p className="help-modal-p">{helpModal.pHud1}</p>
          <ul className="help-modal-list">
            {helpModal.items.map((item) => (
              <li className="help-modal-li" key={item.name}>
                <span className="help-modal-item-name">{item.name}</span>
                <span className="help-modal-item-text"> — {item.text}</span>
              </li>
            ))}
          </ul>
          <p className="help-modal-p help-modal-p--kbd">{helpModal.pKbd1}</p>
        </div>
        <div className="help-modal-actions">
          <button
            ref={okRef}
            type="button"
            className="help-modal-ok"
            onClick={onDismiss}
          >
            {helpModal.ok}
          </button>
        </div>
      </div>
    </div>
  )
}
