import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HudBar } from './HudBar'
import { SessionStates } from '../bootstrap/sessionState'

describe('HudBar travel speed slider', () => {
  it('renders travel speed slider and calls on change', () => {
    const onJourneySpeed = vi.fn()
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="ready"
        onControl={() => {}}
        journeySpeed={0.55}
        onJourneySpeed={onJourneySpeed}
      />
    )

    const slider = screen.getByRole('slider', { name: /Travel speed/i })
    expect(slider).toBeTruthy()
    fireEvent.change(slider, { target: { value: '0.3' } })
    expect(onJourneySpeed).toHaveBeenCalledWith(0.3)
  })
})

