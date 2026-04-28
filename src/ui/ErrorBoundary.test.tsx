import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'
import { copy } from './copy'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders fallback UI when a descendant throws', () => {
    // Silence expected React error logs in test output.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(copy.errorRender)).toBeTruthy()
    expect(screen.getByRole('button', { name: copy.refreshPage })).toBeTruthy()
  })
})

