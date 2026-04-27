import { SessionStates, type SessionState } from '../bootstrap/sessionState'
import type { EngineStatus } from './HudBar'

/** Keep in sync with `<title>` in `index.html` */
const DEFAULT_PAGE_TITLE = 'visualize-music — mic → 3D colour'

/**
 * Shorter tab label when the session or engine state changes. Restores
 * the marketing title when returning to a neutral idle+ready state.
 */
export function syncDocumentTitle(
  engine: EngineStatus,
  session: SessionState,
  audioSuspended: boolean
) {
  if (engine === 'error') {
    document.title = 'visualize-music — error'
    return
  }
  if (engine === 'loading') {
    document.title = 'visualize-music — …'
    return
  }
  if (session === SessionStates.requestingPermission) {
    document.title = 'visualize-music — microphone…'
    return
  }
  if (session === SessionStates.blocked) {
    document.title = 'visualize-music — microphone blocked'
    return
  }
  if (session === SessionStates.live) {
    document.title = audioSuspended
      ? 'visualize-music — audio paused'
      : 'visualize-music — live'
    return
  }
  document.title = DEFAULT_PAGE_TITLE
}

export function resetDocumentTitleToDefault() {
  document.title = DEFAULT_PAGE_TITLE
}
