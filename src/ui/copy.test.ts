import { describe, expect, it } from 'vitest'
import { copy, micErrorMessage } from './copy'

describe('micErrorMessage', () => {
  it('maps mic denial errors to copy', () => {
    const e = new DOMException('denied', 'NotAllowedError')
    expect(micErrorMessage(e)).toBe(copy.errorMicDenied)
  })

  it('maps missing device to copy', () => {
    const e = new DOMException('none', 'NotFoundError')
    expect(micErrorMessage(e)).toBe(copy.errorNoInput)
  })

  it('falls back for unknown errors', () => {
    expect(micErrorMessage(new Error('x'))).toBe(copy.errorGeneric)
  })
})
