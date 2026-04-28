import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { copy } from './copy'
import { HudBar } from './HudBar'
import { SessionStates } from '../bootstrap/sessionState'

function baseReady() {
  return {
    session: SessionStates.idle,
    engineStatus: 'ready' as const,
    onControl: () => {},
    onAngularPlacementMode: () => {},
    onJourneySpeed: () => {},
  }
}

describe('HudBar error state', () => {
  it('uses the error region and default message when none provided', () => {
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="error"
        onControl={() => {}}
      />
    )
    const region = screen.getByRole('region', { name: 'Error' })
    expect(
      within(region).getByText(copy.errorSceneLoad, { exact: true })
    ).toBeTruthy()
    expect(
      within(region).getByRole('button', { name: copy.refreshPage })
    ).toBeTruthy()
  })

  it('shows a custom error message from props', () => {
    const msg = 'My custom error.'
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="error"
        engineErrorMessage={msg}
        onControl={() => {}}
      />
    )
    expect(screen.getByText(msg, { exact: true })).toBeTruthy()
  })
})

describe('HudBar CTA and session states', () => {
  it('disables the start button while the engine is loading', () => {
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="loading"
        onControl={() => {}}
      />
    )
    const btn = screen.getByRole('button', { name: /Start listening/i })
    expect(btn.hasAttribute('disabled')).toBe(true)
    expect(btn.getAttribute('aria-busy')).toBe('true')
  })

  it('shows Stop with stop styling when live and not suspended', () => {
    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
        audioSuspended={false}
        onJourneySpeed={() => {}}
      />
    )
    const btn = screen.getByRole('button', { name: copy.stopListening })
    expect(btn).toBeTruthy()
    expect(btn.className).toMatch(/hud-cta--stop/)
  })

  it('offers Resume when the session is live but the context is suspended', () => {
    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
        audioSuspended
        onJourneySpeed={() => {}}
      />
    )
    expect(
      screen.getByRole('button', { name: copy.resumeAudio })
    ).toBeTruthy()
  })
})

describe('HudBar idle tagline', () => {
  it('shows the idle tagline only when ready and not live', () => {
    const { unmount } = render(
      <HudBar {...baseReady()} onJourneySpeed={() => {}} />
    )
    expect(
      screen.getByText(copy.taglineIdle, {
        exact: true,
        selector: '.hud-tagline',
      })
    ).toBeTruthy()
    unmount()

    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
        onJourneySpeed={() => {}}
        liveAudioReadout={null}
      />
    )
    expect(screen.queryByText(copy.taglineIdle, { exact: true })).toBeNull()
  })
})

describe('HudBar live audio readout', () => {
  it('renders level meter and notes when live with a readout', () => {
    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
        onJourneySpeed={() => {}}
        liveAudioReadout={{ level: 0.4, notesLine: 'A · C# · E' }}
      />
    )
    const readout = screen.getByRole('group', {
      name: /Live audio readout/i,
    })
    const meter = within(readout).getByRole('progressbar')
    expect(meter.getAttribute('aria-valuenow')).toBe('40')
    expect(
      within(readout).getByText('A · C# · E', { exact: true })
    ).toBeTruthy()
  })

  it('does not render the live block when readout is null', () => {
    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
        onJourneySpeed={() => {}}
        liveAudioReadout={null}
      />
    )
    expect(
      screen.queryByRole('group', { name: /Live audio readout/i })
    ).toBeNull()
  })

  it('clamps the meter progress and aria-valuenow to 0..100', () => {
    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
        onJourneySpeed={() => {}}
        liveAudioReadout={{ level: 1.5, notesLine: '—' }}
      />
    )
    const meter = screen.getByRole('progressbar')
    expect(meter.getAttribute('aria-valuenow')).toBe('100')
  })
})

describe('HudBar min. level (dBFS) slider', () => {
  it('renders and reports changes', () => {
    const onMin = vi.fn()
    render(
      <HudBar
        {...baseReady()}
        onJourneySpeed={() => {}}
        showLevelSlider
        onMinLevelDb={onMin}
        minLevelDb={-40}
      />
    )
    const slider = screen.getByRole('slider', { name: /Min\. level/i })
    fireEvent.change(slider, { target: { value: '-32' } })
    expect(onMin).toHaveBeenCalledWith(-32)
  })
})

describe('HudBar A4 reference slider', () => {
  it('renders the tuning group and sends updates', () => {
    const onT = vi.fn()
    render(
      <HudBar
        {...baseReady()}
        onJourneySpeed={() => {}}
        showTuningSlider
        tuningA4Hz={442}
        onTuningA4Hz={onT}
      />
    )
    expect(
      screen.getByRole('group', { name: copy.hudTuningA4 })
    ).toBeTruthy()
    const slider = screen.getByRole('slider', { name: copy.hudTuningA4 })
    fireEvent.change(slider, { target: { value: '444' } })
    expect(onT).toHaveBeenCalledWith(444)
  })
})

describe('HudBar controls row', () => {
  it('wraps min level, mapping, travel, and tuning as four direct children', () => {
    const { container } = render(
      <HudBar
        {...baseReady()}
        onJourneySpeed={() => {}}
        showLevelSlider
        onMinLevelDb={() => {}}
        showTuningSlider
        onTuningA4Hz={() => {}}
      />
    )
    const bar = container.querySelector('.hud-controls')
    expect(bar?.children.length).toBe(4)
  })
})
