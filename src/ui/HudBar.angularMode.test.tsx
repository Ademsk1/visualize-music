import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HudBar } from './HudBar'
import { SessionStates } from '../bootstrap/sessionState'

describe('HudBar angular placement toggle', () => {
  it('renders the radial mapping control and calls on change', () => {
    const onAngularPlacementMode = vi.fn()
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="ready"
        onControl={() => {}}
        onAngularPlacementMode={onAngularPlacementMode}
        angularPlacementMode="even"
      />
    )

    const sel = screen.getByRole('combobox', { name: /Radial mapping/i })
    expect(sel).toBeTruthy()
    ;(sel as HTMLSelectElement).value = 'golden'
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    expect(onAngularPlacementMode).toHaveBeenCalledWith('golden')
  })
})

