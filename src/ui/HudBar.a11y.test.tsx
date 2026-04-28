import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HudBar } from './HudBar'
import { SessionStates } from '../bootstrap/sessionState'

describe('HudBar accessibility', () => {
  it('exposes a polite, atomic live status region', () => {
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="ready"
        onControl={() => {}}
      />
    )

    const hud = screen.getByRole('region', { name: 'Player controls' })
    const status = within(hud).getByText(/Ready/i, { selector: '.hud-status' })
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.getAttribute('aria-atomic')).toBe('true')

    const srOnly = within(hud).getByText(/Ready/i, { selector: '.sr-only' })
    expect(srOnly.getAttribute('aria-live')).toBe('polite')
    expect(srOnly.getAttribute('aria-atomic')).toBe('true')
  })

  it('announces blocked state with the blocked message', () => {
    render(
      <HudBar
        session={SessionStates.blocked}
        engineStatus="ready"
        blockedMessage="Microphone access was blocked."
        onControl={() => {}}
      />
    )

    const hud = screen.getByRole('region', { name: 'Player controls' })
    expect(within(hud).getByText('Microphone access was blocked.')).toBeTruthy()
    expect(
      within(hud).getByText(/Blocked\. Microphone access was blocked\./i, {
        selector: '.sr-only',
      })
    ).toBeTruthy()
  })

  it('keeps the primary control keyboard-operable via a semantic button', () => {
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="ready"
        onControl={() => {}}
      />
    )

    const btn = screen.getByRole('button', { name: /Start listening/i })
    expect(btn.getAttribute('type')).toBe('button')
  })

  it('does not expose decorative status icons to screen readers', () => {
    render(
      <HudBar
        session={SessionStates.live}
        engineStatus="ready"
        onControl={() => {}}
      />
    )

    const hud = screen.getByRole('region', { name: 'Player controls' })
    const icon = within(hud).getByText('●')
    expect(icon.getAttribute('aria-hidden')).toBe('true')
  })

  it('exposes a labeled keyboard shortcut group', () => {
    render(
      <HudBar
        session={SessionStates.idle}
        engineStatus="ready"
        onControl={() => {}}
      />
    )

    expect(
      screen.getByRole('group', { name: 'Keyboard shortcuts' })
    ).toBeTruthy()
    expect(screen.getByText('Space', { selector: 'kbd' })).toBeTruthy()
  })
})

