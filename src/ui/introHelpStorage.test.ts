import { beforeEach, describe, expect, it } from 'vitest'
import { acknowledgeIntro, isIntroAcknowledged } from './introHelpStorage'

describe('introHelpStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is not acknowledged by default', () => {
    expect(isIntroAcknowledged()).toBe(false)
  })

  it('is acknowledged after acknowledgeIntro', () => {
    acknowledgeIntro()
    expect(isIntroAcknowledged()).toBe(true)
  })
})
