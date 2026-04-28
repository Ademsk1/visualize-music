import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { helpModal } from './copy'
import { HelpModal } from './HelpModal'

describe('HelpModal', () => {
  it('calls onDismiss when OK is clicked', () => {
    const onDismiss = vi.fn()
    render(<HelpModal open onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: helpModal.ok }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <HelpModal open={false} onDismiss={() => {}} />
    )
    expect(container.querySelector('.help-modal-root')).toBeNull()
  })
})
