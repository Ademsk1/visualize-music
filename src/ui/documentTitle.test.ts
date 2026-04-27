import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SessionStates } from '../bootstrap/sessionState'
import { resetDocumentTitleToDefault, syncDocumentTitle } from './documentTitle'

describe('syncDocumentTitle', () => {
  beforeEach(() => {
    let title = 'initial'
    vi.stubGlobal('document', {
      get title() {
        return title
      },
      set title(v: string) {
        title = v
      },
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets live and paused titles', () => {
    syncDocumentTitle('ready', SessionStates.live, false)
    expect(document.title).toBe('visualize-music — live')
    syncDocumentTitle('ready', SessionStates.live, true)
    expect(document.title).toBe('visualize-music — audio paused')
  })

  it('restores default for idle+ready', () => {
    syncDocumentTitle('ready', SessionStates.idle, false)
    expect(document.title).toBe('visualize-music — mic → 3D colour')
  })

  it('resetDocumentTitleToDefault', () => {
    document.title = 'x'
    resetDocumentTitleToDefault()
    expect(document.title).toBe('visualize-music — mic → 3D colour')
  })
})
