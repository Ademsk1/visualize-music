const STORAGE_KEY = 'visualize-music.introAck.v1'

export function isIntroAcknowledged(): boolean {
  if (typeof globalThis.localStorage === 'undefined') return false
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function acknowledgeIntro(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode, quota, etc. */
  }
}
